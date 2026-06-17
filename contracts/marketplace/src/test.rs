#![cfg(test)]
use super::*;
use defi_nft::{DefiNFT, DefiNFTClient};
use defi_token::{DefiToken, DefiTokenClient};
use soroban_sdk::{testutils::Address as _, Address, Env, String as SorobanString, Vec};

fn create_nft_contract(env: &Env, admin: &Address) -> Address {
    let nft_id = env.register(DefiNFT, ());
    let nft_client = DefiNFTClient::new(env, &nft_id);
    nft_client.initialize(
        admin,
        &SorobanString::from_str(env, "Test NFT"),
        &SorobanString::from_str(env, "TNFT"),
    );
    nft_id
}

fn mint_nft(env: &Env, nft_contract: &Address, owner: &Address) -> u32 {
    let nft_client = DefiNFTClient::new(env, nft_contract);
    let uri = Vec::from_array(env, [104, 116, 116, 112]);
    let name = Vec::from_array(env, [78, 70, 84, 49]);
    let desc = Vec::from_array(env, [97, 32, 110, 102, 116]);
    nft_client.mint(owner, &uri, &name, &desc, &500)
}

fn create_token(env: &Env, admin: &Address) -> Address {
    let token_id = env.register(DefiToken, ());
    let token_client = DefiTokenClient::new(env, &token_id);
    token_client.initialize(
        admin,
        &SorobanString::from_str(env, "Payment Token"),
        &SorobanString::from_str(env, "PAY"),
        &7,
    );
    token_id
}

fn setup() -> (Env, DefiMarketplaceClient<'static>, Address, Address, Address, Address, Address, u32, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let marketplace_id = env.register(DefiMarketplace, ());
    let marketplace_addr = marketplace_id.clone();
    let marketplace_client = DefiMarketplaceClient::new(&env, &marketplace_id);

    let admin = Address::generate(&env);
    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);
    let nft_contract = create_nft_contract(&env, &admin);
    let payment_token = create_token(&env, &admin);

    marketplace_client.initialize(&admin, &250);

    // Mint a token for seller
    let token_client = DefiTokenClient::new(&env, &payment_token);
    token_client.mint(&buyer, &1_000_000_000);

    // Mint an NFT to seller
    let nft_token_id = mint_nft(&env, &nft_contract, &seller);

    (env, marketplace_client, admin, seller, buyer, nft_contract, payment_token, nft_token_id, marketplace_addr)
}

#[test]
fn test_initialize() {
    let (env, client, _, _, _, _, _, _, _) = setup();
    // initialized successfully
}

#[test]
fn test_list_and_buy() {
    let (env, client, _, seller, buyer, nft_contract, payment_token, token_id, marketplace_addr) = setup();


    let listing_id = client.list(&seller, &nft_contract, &token_id, &1000, &payment_token);
    assert_eq!(listing_id, 1);

    // Approve payment
    let token_client = DefiTokenClient::new(&env, &payment_token);
    token_client.approve(&buyer, &marketplace_addr, &1000);

    client.buy(&listing_id, &buyer);

    let listing = client.get_listing(&listing_id);
    assert!(!listing.active);
}

#[test]
fn test_cancel_listing() {
    let (env, client, _, seller, _, nft_contract, payment_token, token_id, _) = setup();

    let listing_id = client.list(&seller, &nft_contract, &token_id, &1000, &payment_token);
    client.cancel_listing(&listing_id, &seller);

    let listing = client.get_listing(&listing_id);
    assert!(!listing.active);
}

#[test]
fn test_auction_flow() {
    let (env, client, _, seller, _, nft_contract, payment_token, token_id, _) = setup();

    let auction_id = client.create_auction(&seller, &nft_contract, &token_id, &100, &500, &86400, &payment_token);
    let auction = client.get_auction(&auction_id);
    assert!(auction.active);
}
