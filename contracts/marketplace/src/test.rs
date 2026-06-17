#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env, String as SorobanString, Vec};

fn setup() -> (Env, DefiMarketplaceClient<'static>, Address, Address, Address, u32) {
    let env = Env::default();
    env.mock_all_auths();

    let marketplace_id = env.register(DefiMarketplace, ());
    let marketplace_client = DefiMarketplaceClient::new(&env, &marketplace_id);

    let admin = Address::generate(&env);
    let nft_contract = Address::generate(&env);
    let payment_token = Address::generate(&env);
    let nft_token_id = 1u32;

    marketplace_client.initialize(&admin, &250);

    (env, marketplace_client, admin, nft_contract, payment_token, nft_token_id)
}

#[test]
fn test_initialize() {
    let (env, client, admin, _, _, _) = setup();
    // initialized
}

#[test]
fn test_list_and_buy() {
    let (env, client, admin, nft_contract, payment_token, token_id) = setup();
    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);

    let listing_id = client.list(&seller, &nft_contract, &token_id, &1000, &payment_token);
    assert_eq!(listing_id, 1);

    client.buy(&listing_id, &buyer);

    let listing = client.get_listing(&listing_id);
    assert!(!listing.active);
}

#[test]
fn test_cancel_listing() {
    let (env, client, admin, nft_contract, payment_token, token_id) = setup();
    let seller = Address::generate(&env);

    let listing_id = client.list(&seller, &nft_contract, &token_id, &1000, &payment_token);
    client.cancel_listing(&listing_id, &seller);

    let listing = client.get_listing(&listing_id);
    assert!(!listing.active);
}

#[test]
fn test_auction_flow() {
    let (env, client, admin, nft_contract, payment_token, token_id) = setup();
    let seller = Address::generate(&env);

    let auction_id = client.create_auction(&seller, &nft_contract, &token_id, &100, &500, &86400, &payment_token);
    let auction = client.get_auction(&auction_id);
    assert!(auction.active);
}
