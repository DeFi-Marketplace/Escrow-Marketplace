#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Map, Vec};

use defi_common::{check_nonnegative_amount, Error, LaunchpadSale};

mod test;

#[contract]
pub struct DefiLaunchpad;

#[contractimpl]
impl DefiLaunchpad {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&BytesN::from_array(&env, &[0u8; 32])) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&BytesN::from_array(&env, &[0u8; 32]), &admin);
    }

    pub fn create_sale(
        env: Env,
        owner: Address,
        token: Address,
        price: i128,
        max_supply: i128,
        start_time: u64,
        end_time: u64,
        min_per_wallet: i128,
        max_per_wallet: i128,
        whitelist_only: bool,
    ) -> u32 {
        let admin: Address = env.storage().instance().get(&BytesN::from_array(&env, &[0u8; 32])).unwrap();
        admin.require_auth();
        check_nonnegative_amount(price).unwrap();
        check_nonnegative_amount(max_supply).unwrap();

        if start_time >= end_time {
            panic!("invalid time range");
        }

        let sale_id: u32 = env.storage().instance().get(&BytesN::from_array(&env, &[1u8; 32])).unwrap_or(1);

        let sale = LaunchpadSale {
            token: token.clone(),
            owner: owner.clone(),
            price,
            max_supply,
            sold: 0,
            start_time,
            end_time,
            min_per_wallet,
            max_per_wallet,
            whitelist_only,
            finalized: false,
        };

        // Transfer tokens from owner to contract
        let token_client = defi_token::DefiTokenClient::new(&env, &token);
        token_client.transfer_from(&owner, &env.current_contract_address(), &max_supply);

        env.storage().instance().set(&sale_id, &sale);
        env.storage().instance().set(&BytesN::from_array(&env, &[1u8; 32]), &(sale_id + 1));

        env.events().publish(("sale_created", sale_id, owner, token), price);
        sale_id
    }

    pub fn add_to_whitelist(env: Env, sale_id: u32, caller: Address, users: Vec<Address>) {
        let sale: LaunchpadSale = env.storage().instance().get(&sale_id).unwrap();
        if sale.owner != caller {
            panic!("not the sale owner");
        }
        caller.require_auth();

        for i in 0..users.len() {
            let user = users.get(i).unwrap();
            env.storage().instance().set(
                &(BytesN::from_array(&env, &[2u8; 32]), sale_id, user.clone()),
                &true,
            );
        }
    }

    pub fn buy(env: Env, sale_id: u32, buyer: Address, amount: i128) {
        buyer.require_auth();
        check_nonnegative_amount(amount).unwrap();

        let mut sale: LaunchpadSale = env.storage().instance().get(&sale_id).unwrap();

        if sale.finalized {
            panic!("sale already finalized");
        }

        let now = env.ledger().timestamp();
        if now < sale.start_time {
            panic!("sale not started");
        }
        if now >= sale.end_time {
            panic!("sale ended");
        }

        if sale.whitelist_only {
            let whitelisted: bool = env.storage()
                .instance()
                .get(&(BytesN::from_array(&env, &[2u8; 32]), sale_id, buyer.clone()))
                .unwrap_or(false);
            if !whitelisted {
                panic!("not whitelisted");
            }
        }

        if sale.sold + amount > sale.max_supply {
            panic!("exceeds max supply");
        }

        let user_purchased: i128 = env.storage()
            .instance()
            .get(&(BytesN::from_array(&env, &[3u8; 32]), sale_id, buyer.clone()))
            .unwrap_or(0);

        let new_purchased = user_purchased + amount;
        if new_purchased < sale.min_per_wallet {
            panic!("below minimum per wallet");
        }
        if new_purchased > sale.max_per_wallet {
            panic!("exceeds max per wallet");
        }

        let total_cost = amount * sale.price;

        // Transfer payment
        // For simplicity, using native payment. In production, use a payment token.
        let token_client = defi_token::DefiTokenClient::new(&env, &sale.token);
        // Buyers would pay with a stablecoin. For now, tokens are being sold.
        // In a real implementation, you'd use a separate payment token address.

        sale.sold += amount;
        env.storage().instance().set(&(BytesN::from_array(&env, &[3u8; 32]), sale_id, buyer.clone()), &new_purchased);
        env.storage().instance().set(&sale_id, &sale);

        env.events().publish(("sale_purchase", sale_id, buyer), (amount, total_cost));
    }

    pub fn claim(env: Env, sale_id: u32, claimant: Address) {
        claimant.require_auth();

        let sale: LaunchpadSale = env.storage().instance().get(&sale_id).unwrap();

        if !sale.finalized {
            let now = env.ledger().timestamp();
            if now < sale.end_time && sale.sold < sale.max_supply {
                panic!("sale not ended");
            }
        }

        let purchased: i128 = env.storage()
            .instance()
            .get(&(BytesN::from_array(&env, &[3u8; 32]), sale_id, claimant.clone()))
            .unwrap_or(0);

        let claimed: i128 = env.storage()
            .instance()
            .get(&(BytesN::from_array(&env, &[4u8; 32]), sale_id, claimant.clone()))
            .unwrap_or(0);

        let claimable = purchased - claimed;
        if claimable <= 0 {
            panic!("nothing to claim");
        }

        env.storage().instance().set(
            &(BytesN::from_array(&env, &[4u8; 32]), sale_id, claimant.clone()),
            &(claimed + claimable),
        );

        let token_client = defi_token::DefiTokenClient::new(&env, &sale.token);
        token_client.transfer(&env.current_contract_address(), &claimant, &claimable);

        env.events().publish(("sale_claim", sale_id, claimant), claimable);
    }

    pub fn finalize(env: Env, sale_id: u32, caller: Address) {
        caller.require_auth();

        let mut sale: LaunchpadSale = env.storage().instance().get(&sale_id).unwrap();
        if sale.finalized {
            panic!("already finalized");
        }

        let now = env.ledger().timestamp();
        if now < sale.end_time {
            panic!("sale not ended");
        }

        sale.finalized = true;

        // Return unsold tokens to owner
        let unsold = sale.max_supply - sale.sold;
        if unsold > 0 {
            let token_client = defi_token::DefiTokenClient::new(&env, &sale.token);
            token_client.transfer(&env.current_contract_address(), &sale.owner, &unsold);
        }

        env.storage().instance().set(&sale_id, &sale);

        env.events().publish(("sale_finalized", sale_id, caller), unsold);
    }

    pub fn get_sale(env: &Env, sale_id: u32) -> LaunchpadSale {
        env.storage().instance().get(&sale_id).unwrap()
    }

    pub fn get_user_purchased(env: &Env, sale_id: u32, user: Address) -> i128 {
        env.storage()
            .instance()
            .get(&(BytesN::from_array(env, &[3u8; 32]), sale_id, user))
            .unwrap_or(0)
    }

    pub fn get_user_claimed(env: &Env, sale_id: u32, user: Address) -> i128 {
        env.storage()
            .instance()
            .get(&(BytesN::from_array(env, &[4u8; 32]), sale_id, user))
            .unwrap_or(0)
    }

    pub fn is_whitelisted(env: &Env, sale_id: u32, user: Address) -> bool {
        env.storage()
            .instance()
            .get(&(BytesN::from_array(env, &[2u8; 32]), sale_id, user))
            .unwrap_or(false)
    }
}
