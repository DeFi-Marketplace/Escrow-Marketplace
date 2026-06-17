#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn setup() -> (Env, DefiLendingClient<'static>, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(DefiLending, ());
    let client = DefiLendingClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let token = Address::generate(&env);

    client.initialize(&admin);
    client.create_market(&token, &8000, &1000);
    (env, client, admin, token)
}

#[test]
fn test_deposit() {
    let (env, client, admin, token) = setup();
    let user = Address::generate(&env);
    client.deposit(&token, &user, &1000);

    let position = client.get_user_position(&user, &token);
    assert_eq!(position.deposited, 1000);
    let market = client.get_market(&token);
    assert_eq!(market.total_deposits, 1000);
}

#[test]
fn test_withdraw() {
    let (env, client, admin, token) = setup();
    let user = Address::generate(&env);
    client.deposit(&token, &user, &1000);
    client.withdraw(&token, &user, &500);

    let position = client.get_user_position(&user, &token);
    assert_eq!(position.deposited, 500);
}

#[test]
fn test_borrow_and_repay() {
    let (env, client, admin, token) = setup();
    let user = Address::generate(&env);
    // Deposit collateral
    client.deposit(&token, &user, &10000);
    // Borrow
    client.borrow(&token, &user, &5000);

    let position = client.get_user_position(&user, &token);
    assert!(position.borrowed > 0);

    let hf = client.get_health_factor(&user, &token);
    assert!(hf > 150);

    // Repay
    client.repay(&token, &user, &i128::MAX);
    let position = client.get_user_position(&user, &token);
    assert_eq!(position.borrowed, 0);
}

#[test]
fn test_health_factor() {
    let (env, client, admin, token) = setup();
    let user = Address::generate(&env);

    let hf = client.get_health_factor(&user, &token);
    assert_eq!(hf, i128::MAX);

    client.deposit(&token, &user, &10000);
    client.borrow(&token, &user, &5000);

    let hf = client.get_health_factor(&user, &token);
    assert!(hf > 100);
}
