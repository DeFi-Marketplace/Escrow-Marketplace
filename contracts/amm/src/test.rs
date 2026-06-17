#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, Symbol};

fn setup_test() -> (Env, DefiAMMClient<'static>, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(DefiAMM, ());
    let client = DefiAMMClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let token_a = Address::generate(&env);
    let token_b = Address::generate(&env);

    client.initialize(&admin, &30);
    (env, client, admin, token_a, token_b)
}

#[test]
fn test_initialize() {
    let (env, client, admin, _, _) = setup_test();
    let pool_id = client.create_pair(&Address::generate(&env), &Address::generate(&env));

    client.set_fee(&50);
    // fee updated successfully
}

#[test]
fn test_create_pair() {
    let (env, client, admin, token_a, token_b) = setup_test();
    let pool_id = client.create_pair(&token_a, &token_b);
    let pool = client.get_pool(&pool_id);

    assert_eq!(pool.token_a, token_a);
    assert_eq!(pool.token_b, token_b);
    assert_eq!(pool.reserve_a, 0);
    assert_eq!(pool.reserve_b, 0);
}

#[test]
fn test_add_liquidity() {
    let (env, client, admin, token_a, token_b) = setup_test();
    let pool_id = client.create_pair(&token_a, &token_b);
    let caller = Address::generate(&env);

    client.add_liquidity(&pool_id, &caller, &1000, &2000, &0, &0);
    let pool = client.get_pool(&pool_id);

    assert_eq!(pool.reserve_a, 1000);
    assert_eq!(pool.reserve_b, 2000);
}

#[test]
fn test_swap() {
    let (env, client, admin, token_a, token_b) = setup_test();
    let pool_id = client.create_pair(&token_a, &token_b);
    let caller = Address::generate(&env);

    client.add_liquidity(&pool_id, &caller, &1000000, &2000000, &0, &0);

    let amount_out = client.swap_exact_in(&pool_id, &caller, &token_a, &10000, &1);
    assert!(amount_out > 0);

    let pool = client.get_pool(&pool_id);
    assert_eq!(pool.reserve_a, 1010000);
    assert_eq!(pool.reserve_b, 2000000 - amount_out);
}

#[test]
fn test_get_amount_out() {
    let (env, client, admin, token_a, token_b) = setup_test();
    let pool_id = client.create_pair(&token_a, &token_b);
    let caller = Address::generate(&env);

    client.add_liquidity(&pool_id, &caller, &1000000, &2000000, &0, &0);

    let amount_out = client.get_amount_out(&pool_id, &10000, &token_a);
    assert!(amount_out > 0);
}
