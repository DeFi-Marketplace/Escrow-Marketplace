#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env, String as SorobanString, Vec};

fn setup() -> (Env, DefiNFTClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(DefiNFT, ());
    let client = DefiNFTClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin, &SorobanString::from_str(&env, "DeFi NFT"), &SorobanString::from_str(&env, "DNFT"));
    (env, client, admin)
}

#[test]
fn test_mint() {
    let (env, client, admin) = setup();
    let user = Address::generate(&env);

    let uri = Vec::from_array(&env, [104, 116, 116, 112]); // "http"
    let name = Vec::from_array(&env, [78, 70, 84, 49]); // "NFT1"
    let desc = Vec::from_array(&env, [97, 32, 110, 102, 116]); // "a nft"

    let token_id = client.mint(&user, &uri, &name, &desc, &500);
    assert_eq!(token_id, 1);

    let owner = client.owner_of(&token_id);
    assert_eq!(owner, user);

    assert_eq!(client.total_supply(), 1);
}

#[test]
fn test_transfer() {
    let (env, client, admin) = setup();
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    let uri = Vec::new(&env);
    let name = Vec::new(&env);
    let desc = Vec::new(&env);

    let token_id = client.mint(&alice, &uri, &name, &desc, &0);
    client.transfer(&alice, &bob, &token_id);

    assert_eq!(client.owner_of(&token_id), bob);
}

#[test]
fn test_tokens_of() {
    let (env, client, admin) = setup();
    let user = Address::generate(&env);

    let empty = Vec::new(&env);
    let uri = Vec::new(&env);
    let name = Vec::new(&env);
    let desc = Vec::new(&env);

    client.mint(&user, &uri, &name, &desc, &0);
    client.mint(&user, &uri, &name, &desc, &0);

    let tokens = client.tokens_of(&user);
    assert_eq!(tokens.len(), 2);
}
