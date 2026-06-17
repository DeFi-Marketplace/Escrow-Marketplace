#![cfg(test)]
use super::*;
use defi_token::{DefiToken, DefiTokenClient};
use soroban_sdk::{testutils::Address as _, Address, Env, String as SorobanString, Vec};

fn create_token(env: &Env, admin: &Address) -> Address {
    let token_id = env.register(DefiToken, ());
    let token_client = DefiTokenClient::new(env, &token_id);
    token_client.initialize(
        admin,
        &SorobanString::from_str(env, "Sale Token"),
        &SorobanString::from_str(env, "SALE"),
        &7,
    );
    token_id
}

fn setup() -> (Env, DefiLaunchpadClient<'static>, Address, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(DefiLaunchpad, ());
    let contract_addr = contract_id.clone();
    let client = DefiLaunchpadClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let token = create_token(&env, &admin);

    client.initialize(&admin);

    // Mint tokens to owner for the sale
    let token_client = DefiTokenClient::new(&env, &token);
    token_client.mint(&owner, &1_000_000_000);

    // Approve launchpad to transfer tokens
    token_client.approve(&owner, &contract_addr, &1_000_000_000);

    (env, client, admin, owner, token, contract_addr)
}

#[test]
fn test_create_sale() {
    let (env, client, _, owner, token, _) = setup();
    let now = env.ledger().timestamp();

    let sale_id = client.create_sale(
        &owner, &token, &100, &10000, &now, &(now + 86400), &1, &1000, &false,
    );
    assert_eq!(sale_id, 1);

    let sale = client.get_sale(&sale_id);
    assert_eq!(sale.price, 100);
    assert_eq!(sale.max_supply, 10000);
}

#[test]
fn test_whitelist() {
    let (env, client, _, owner, token, _) = setup();
    let user = Address::generate(&env);
    let now = env.ledger().timestamp();

    let sale_id = client.create_sale(
        &owner, &token, &100, &10000, &now, &(now + 86400), &1, &1000, &true,
    );

    let mut users = Vec::new(&env);
    users.push_back(user.clone());
    client.add_to_whitelist(&sale_id, &owner, &users);

    assert!(client.is_whitelisted(&sale_id, &user));
}

#[test]
fn test_buy_and_claim() {
    let (env, client, _, owner, token, contract_addr) = setup();
    let buyer = Address::generate(&env);
    let now = env.ledger().timestamp();

    // Mint payment tokens to buyer
    let token_client = DefiTokenClient::new(&env, &token);
    token_client.mint(&buyer, &1_000_000_000);

    let sale_id = client.create_sale(
        &owner, &token, &100, &10000, &now, &(now + 86400), &1, &1000, &false,
    );

    // Buyer approves launchpad contract for payment
    token_client.approve(&buyer, &contract_addr, &50000);

    client.buy(&sale_id, &buyer, &500);

    let purchased = client.get_user_purchased(&sale_id, &buyer);
    assert_eq!(purchased, 500);
}

#[test]
fn test_finalize() {
    let (env, client, _, owner, token, _) = setup();
    let now = env.ledger().timestamp();

    let sale_id = client.create_sale(
        &owner, &token, &100, &10000, &now, &now, &1, &1000, &false,
    );

    client.finalize(&sale_id, &owner);
    let sale = client.get_sale(&sale_id);
    assert!(sale.finalized);
}
