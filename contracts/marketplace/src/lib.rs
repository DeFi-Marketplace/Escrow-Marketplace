#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Map, Vec};

use defi_common::{check_nonnegative_amount, Auction, Error, MarketplaceListing};

mod test;

#[contract]
pub struct DefiMarketplace;

#[contractimpl]
impl DefiMarketplace {
    pub fn initialize(env: Env, admin: Address, fee_bps: u32) {
        if env.storage().instance().has(&BytesN::from_array(&env, &[0u8; 32])) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&BytesN::from_array(&env, &[0u8; 32]), &admin);
        env.storage().instance().set(&BytesN::from_array(&env, &[1u8; 32]), &fee_bps);
    }

    pub fn list(
        env: Env,
        seller: Address,
        token_address: Address,
        token_id: u32,
        price: i128,
        payment_token: Address,
    ) -> u32 {
        seller.require_auth();
        check_nonnegative_amount(price).unwrap();

        let listing_id: u32 = env.storage().instance().get(&BytesN::from_array(&env, &[2u8; 32])).unwrap_or(1);

        // Verify ownership
        let nft_client = defi_nft::DefiNFTClient::new(&env, &token_address);
        let owner = nft_client.owner_of(&token_id);
        if owner != seller {
            panic!("not the owner");
        }

        // Transfer NFT to marketplace
        nft_client.transfer(&seller, &env.current_contract_address(), &token_id);

        let listing = MarketplaceListing {
            seller: seller.clone(),
            token_address: token_address.clone(),
            token_id,
            price,
            payment_token: payment_token.clone(),
            active: true,
        };

        env.storage().instance().set(&listing_id, &listing);
        env.storage().instance().set(&BytesN::from_array(&env, &[2u8; 32]), &(listing_id + 1));

        env.events().publish(
            ("listing_created", listing_id, seller),
            (token_address, token_id, price),
        );

        listing_id
    }

    pub fn buy(env: Env, listing_id: u32, buyer: Address) {
        buyer.require_auth();

        let mut listing: MarketplaceListing = env.storage().instance().get(&listing_id).unwrap();
        if !listing.active {
            panic!("listing not active");
        }

        listing.active = false;

        // Transfer payment
        let payment_token_client = defi_token::DefiTokenClient::new(&env, &listing.payment_token);
        let fee_bps: u32 = env.storage().instance().get(&BytesN::from_array(&env, &[1u8; 32])).unwrap();
        let fee = (listing.price * fee_bps as i128) / 10000;
        let seller_amount = listing.price - fee;

        // Fee to marketplace admin
        let admin: Address = env.storage().instance().get(&BytesN::from_array(&env, &[0u8; 32])).unwrap();
        payment_token_client.transfer_from(&buyer, &admin, &fee);
        payment_token_client.transfer_from(&buyer, &listing.seller, &seller_amount);

        // Transfer NFT to buyer
        let nft_client = defi_nft::DefiNFTClient::new(&env, &listing.token_address);
        nft_client.transfer(&env.current_contract_address(), &buyer, &listing.token_id);

        env.storage().instance().set(&listing_id, &listing);

        env.events().publish(
            ("listing_sold", listing_id, buyer, listing.seller),
            listing.price,
        );
    }

    pub fn cancel_listing(env: Env, listing_id: u32, seller: Address) {
        seller.require_auth();

        let mut listing: MarketplaceListing = env.storage().instance().get(&listing_id).unwrap();
        if listing.seller != seller {
            panic!("not the seller");
        }
        if !listing.active {
            panic!("listing not active");
        }

        listing.active = false;

        // Return NFT to seller
        let nft_client = defi_nft::DefiNFTClient::new(&env, &listing.token_address);
        nft_client.transfer(&env.current_contract_address(), &seller, &listing.token_id);

        env.storage().instance().set(&listing_id, &listing);

        env.events().publish(("listing_cancelled", listing_id, seller), ());
    }

    pub fn create_auction(
        env: Env,
        seller: Address,
        token_address: Address,
        token_id: u32,
        start_price: i128,
        reserve_price: i128,
        duration: u64,
        payment_token: Address,
    ) -> u32 {
        seller.require_auth();
        check_nonnegative_amount(start_price).unwrap();
        check_nonnegative_amount(reserve_price).unwrap();

        let auction_id: u32 = env.storage().instance().get(&BytesN::from_array(&env, &[3u8; 32])).unwrap_or(1);
        let now = env.ledger().timestamp();

        // Verify ownership
        let nft_client = defi_nft::DefiNFTClient::new(&env, &token_address);
        let owner = nft_client.owner_of(&token_id);
        if owner != seller {
            panic!("not the owner");
        }

        nft_client.transfer(&seller, &env.current_contract_address(), &token_id);

        let auction = Auction {
            seller: seller.clone(),
            token_address,
            token_id,
            start_price,
            end_price: reserve_price,
            start_time: now,
            end_time: now + duration,
            highest_bid: 0,
            highest_bidder: Address::generate(&env),
            payment_token,
            active: true,
        };

        env.storage().instance().set(&auction_id, &auction);
        env.storage().instance().set(&BytesN::from_array(&env, &[3u8; 32]), &(auction_id + 1));

        env.events().publish(("auction_created", auction_id, seller), ());
        auction_id
    }

    pub fn place_bid(env: Env, auction_id: u32, bidder: Address, amount: i128) {
        bidder.require_auth();
        check_nonnegative_amount(amount).unwrap();

        let mut auction: Auction = env.storage().instance().get(&auction_id).unwrap();
        if !auction.active {
            panic!("auction not active");
        }

        let now = env.ledger().timestamp();
        if now >= auction.end_time {
            panic!("auction ended");
        }

        if amount <= auction.highest_bid {
            panic!("bid too low");
        }

        // Return previous bid if exists
        if auction.highest_bid > 0 {
            let payment_token_client = defi_token::DefiTokenClient::new(&env, &auction.payment_token);
            payment_token_client.transfer(&env.current_contract_address(), &auction.highest_bidder, &auction.highest_bid);
        }

        // Lock new bid
        let payment_token_client = defi_token::DefiTokenClient::new(&env, &auction.payment_token);
        payment_token_client.transfer_from(&bidder, &env.current_contract_address(), &amount);

        auction.highest_bid = amount;
        auction.highest_bidder = bidder.clone();

        env.storage().instance().set(&auction_id, &auction);

        env.events().publish(("bid_placed", auction_id, bidder), amount);
    }

    pub fn finalize_auction(env: Env, auction_id: u32) {
        let auction: Auction = env.storage().instance().get(&auction_id).unwrap();
        if !auction.active {
            panic!("auction not active");
        }

        let now = env.ledger().timestamp();
        if now < auction.end_time && auction.highest_bid < auction.end_price {
            panic!("auction not ended or reserve not met");
        }

        // Check if reserve was met
        let reserve_met = auction.highest_bid >= auction.end_price;

        if reserve_met {
            // Transfer payment to seller (minus fee)
            let fee_bps: u32 = env.storage().instance().get(&BytesN::from_array(&env, &[1u8; 32])).unwrap();
            let fee = (auction.highest_bid * fee_bps as i128) / 10000;
            let seller_amount = auction.highest_bid - fee;

            let admin: Address = env.storage().instance().get(&BytesN::from_array(&env, &[0u8; 32])).unwrap();
            let payment_token_client = defi_token::DefiTokenClient::new(&env, &auction.payment_token);

            payment_token_client.transfer(&env.current_contract_address(), &admin, &fee);
            payment_token_client.transfer(&env.current_contract_address(), &auction.seller, &seller_amount);

            // Transfer NFT to winner
            let nft_client = defi_nft::DefiNFTClient::new(&env, &auction.token_address);
            nft_client.transfer(&env.current_contract_address(), &auction.highest_bidder, &auction.token_id);
        } else {
            // Reserve not met - return NFT to seller
            let nft_client = defi_nft::DefiNFTClient::new(&env, &auction.token_address);
            nft_client.transfer(&env.current_contract_address(), &auction.seller, &auction.token_id);

            // Return highest bid if any
            if auction.highest_bid > 0 {
                let payment_token_client = defi_token::DefiTokenClient::new(&env, &auction.payment_token);
                payment_token_client.transfer(&env.current_contract_address(), &auction.highest_bidder, &auction.highest_bid);
            }
        }

        let mut updated = auction;
        updated.active = false;
        env.storage().instance().set(&auction_id, &updated);

        env.events().publish(("auction_finalized", auction_id), reserve_met);
    }

    pub fn get_listing(env: &Env, listing_id: u32) -> MarketplaceListing {
        env.storage().instance().get(&listing_id).unwrap()
    }

    pub fn get_auction(env: &Env, auction_id: u32) -> Auction {
        env.storage().instance().get(&auction_id).unwrap()
    }

    pub fn set_fee(env: Env, new_fee_bps: u32) {
        let admin: Address = env.storage().instance().get(&BytesN::from_array(&env, &[0u8; 32])).unwrap();
        admin.require_auth();
        env.storage().instance().set(&BytesN::from_array(&env, &[1u8; 32]), &new_fee_bps);
    }
}
