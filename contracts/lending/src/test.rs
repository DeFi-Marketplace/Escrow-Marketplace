#![cfg(test)]
use super::*;
use defi_token::{DefiToken, DefiTokenClient};
use soroban_sdk::{testutils::Address as _, Address, Env, String as SorobanString};

fn create_token(env: &Env, admin: &Address) -> Address {
    let token_id = env.register(DefiToken, ());
    let token_client = DefiTokenClient::new(env, &token_id);
    token_client.initialize(
        admin,
        &SorobanString::from_str(env, "Test Token"),
        &SorobanString::from_str(env, "TST"),
        &7,
    );
    token_id
}

fn setup() -> (Env, DefiLendingClient<'static>, Address, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(DefiLending, ());
    let contract_addr = contract_id.clone();
    let client = DefiLendingClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let token = create_token(&env, &admin);

    client.initialize(&admin);
    client.create_market(&token, &8000, &1000);

    // Mint tokens to user
    let token_client = DefiTokenClient::new(&env, &token);
    token_client.mint(&user, &1_000_000_000);

    (env, client, admin, user, token, contract_addr)
}

#[test]
fn test_deposit() {
    let (env, client, _, user, token, contract_addr) = setup();
    let token_client = DefiTokenClient::new(&env, &token);
    token_client.approve(&user, &contract_addr, &1000);

    client.deposit(&token, &user, &1000);

    let position = client.get_user_position(&user, &token);
    assert_eq!(position.deposited, 1000);
    let market = client.get_market(&token);
    assert_eq!(market.total_deposits, 1000);
}

#[test]
fn test_withdraw() {
    let (env, client, _, user, token, contract_addr) = setup();
    let token_client = DefiTokenClient::new(&env, &token);
    token_client.approve(&user, &contract_addr, &1000);

    client.deposit(&token, &user, &1000);
    client.withdraw(&token, &user, &500);

    let position = client.get_user_position(&user, &token);
    assert_eq!(position.deposited, 500);
}

#[test]
fn test_borrow_and_repay() {
    let (env, client, _, user, token, contract_addr) = setup();
    let token_client = DefiTokenClient::new(&env, &token);
    token_client.approve(&user, &contract_addr, &1_000_000_000);

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
    let (env, client, _, user, token, contract_addr) = setup();
    let token_client = DefiTokenClient::new(&env, &token);
    token_client.approve(&user, &contract_addr, &1_000_000_000);

    let hf = client.get_health_factor(&user, &token);
    assert_eq!(hf, i128::MAX);

    client.deposit(&token, &user, &10000);
    client.borrow(&token, &user, &5000);

    let hf = client.get_health_factor(&user, &token);
    assert!(hf > 100);
}
