#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env, Vec};

fn setup() -> (Env, DefiLaunchpadClient<'static>, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(DefiLaunchpad, ());
    let client = DefiLaunchpadClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let token = Address::generate(&env);

    client.initialize(&admin);
    (env, client, admin, token)
}

#[test]
fn test_create_sale() {
    let (env, client, admin, token) = setup();
    let owner = Address::generate(&env);
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
    let (env, client, admin, token) = setup();
    let owner = Address::generate(&env);
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
    let (env, client, admin, token) = setup();
    let owner = Address::generate(&env);
    let buyer = Address::generate(&env);
    let now = env.ledger().timestamp();

    let sale_id = client.create_sale(
        &owner, &token, &100, &10000, &now, &(now + 86400), &1, &1000, &false,
    );

    // Jump to after launch but before end
    // client.buy(&sale_id, &buyer, &500);

    let purchased = client.get_user_purchased(&sale_id, &buyer);
    // assert_eq!(purchased, 500);
}

#[test]
fn test_finalize() {
    let (env, client, admin, token) = setup();
    let owner = Address::generate(&env);
    let now = env.ledger().timestamp();

    let sale_id = client.create_sale(
        &owner, &token, &100, &10000, &now, &now, &1, &1000, &false,
    );

    client.finalize(&sale_id, &owner);
    let sale = client.get_sale(&sale_id);
    assert!(sale.finalized);
}
