#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env, String as SorobanString};

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register(DefiToken, ());
    let client = DefiTokenClient::new(&env, &contract_id);

    let admin = Address::generate(&env);

    client.initialize(&admin, &SorobanString::from_str(&env, "Test Token"), &SorobanString::from_str(&env, "TST"), &7);

    assert_eq!(client.name(), SorobanString::from_str(&env, "Test Token"));
    assert_eq!(client.symbol(), SorobanString::from_str(&env, "TST"));
    assert_eq!(client.decimals(), 7);
}

#[test]
fn test_mint_and_balance() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(DefiToken, ());
    let client = DefiTokenClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin, &SorobanString::from_str(&env, "Test"), &SorobanString::from_str(&env, "TST"), &7);
    client.mint(&user, &1000);

    assert_eq!(client.balance(&user), 1000);
    assert_eq!(client.total_supply(), 1000);
}

#[test]
fn test_transfer() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(DefiToken, ());
    let client = DefiTokenClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    client.initialize(&admin, &SorobanString::from_str(&env, "Test"), &SorobanString::from_str(&env, "TST"), &7);
    client.mint(&alice, &1000);
    client.transfer(&alice, &bob, &500);

    assert_eq!(client.balance(&alice), 500);
    assert_eq!(client.balance(&bob), 500);
}

#[test]
fn test_approve_and_transfer_from() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(DefiToken, ());
    let client = DefiTokenClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let charlie = Address::generate(&env);

    client.initialize(&admin, &SorobanString::from_str(&env, "Test"), &SorobanString::from_str(&env, "TST"), &7);
    client.mint(&alice, &1000);
    client.approve(&alice, &bob, &300);
    assert_eq!(client.allowance(&alice, &bob), 300);

    client.transfer_from(&bob, &alice, &charlie, &200);
    assert_eq!(client.balance(&alice), 800);
    assert_eq!(client.balance(&charlie), 200);
    assert_eq!(client.allowance(&alice, &bob), 100);
}

#[test]
fn test_burn() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(DefiToken, ());
    let client = DefiTokenClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin, &SorobanString::from_str(&env, "Test"), &SorobanString::from_str(&env, "TST"), &7);
    client.mint(&user, &1000);
    client.burn(&user, &300);

    assert_eq!(client.balance(&user), 700);
    assert_eq!(client.total_supply(), 700);
}
