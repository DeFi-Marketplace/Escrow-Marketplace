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

fn setup_test() -> (Env, DefiAMMClient<'static>, Address, Address, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(DefiAMM, ());
    let amm_address = contract_id.clone();
    let client = DefiAMMClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let caller = Address::generate(&env);
    let token_a = create_token(&env, &admin);
    let token_b = create_token(&env, &admin);

    client.initialize(&admin, &30);

    // Mint tokens to caller
    let token_a_client = DefiTokenClient::new(&env, &token_a);
    let token_b_client = DefiTokenClient::new(&env, &token_b);
    token_a_client.mint(&caller, &1_000_000_000);
    token_b_client.mint(&caller, &1_000_000_000);

    (env, client, admin, caller, token_a, token_b, amm_address)
}

#[test]
fn test_initialize() {
    let (env, client, _, _, _, _, _) = setup_test();
    let pool_id = client.create_pair(&Address::generate(&env), &Address::generate(&env));
    client.set_fee(&50);
    let _ = pool_id;
}

#[test]
fn test_create_pair() {
    let (env, client, _, _, token_a, token_b, _) = setup_test();
    let pool_id = client.create_pair(&token_a, &token_b);
    let pool = client.get_pool(&pool_id);

    assert_eq!(pool.token_a, token_a);
    assert_eq!(pool.token_b, token_b);
    assert_eq!(pool.reserve_a, 0);
    assert_eq!(pool.reserve_b, 0);
}

#[test]
fn test_add_liquidity() {
    let (env, client, _, caller, token_a, token_b, amm_address) = setup_test();
    let pool_id = client.create_pair(&token_a, &token_b);

    // Approve AMM contract to spend tokens
    let token_a_client = DefiTokenClient::new(&env, &token_a);
    let token_b_client = DefiTokenClient::new(&env, &token_b);
    token_a_client.approve(&caller, &amm_address, &100_000_000);
    token_b_client.approve(&caller, &amm_address, &200_000_000);

    client.add_liquidity(&pool_id, &caller, &1000, &2000, &0, &0);
    let pool = client.get_pool(&pool_id);

    assert_eq!(pool.reserve_a, 1000);
    assert_eq!(pool.reserve_b, 2000);
}

#[test]
fn test_swap() {
    let (env, client, _, caller, token_a, token_b, amm_address) = setup_test();
    let pool_id = client.create_pair(&token_a, &token_b);

    let token_a_client = DefiTokenClient::new(&env, &token_a);
    let token_b_client = DefiTokenClient::new(&env, &token_b);
    token_a_client.approve(&caller, &amm_address, &1_000_000_000);
    token_b_client.approve(&caller, &amm_address, &2_000_000_000);

    client.add_liquidity(&pool_id, &caller, &1000000, &2000000, &0, &0);

    let amount_out = client.swap_exact_in(&pool_id, &caller, &token_a, &10000, &1);
    assert!(amount_out > 0);

    let pool = client.get_pool(&pool_id);
    assert_eq!(pool.reserve_a, 1010000);
    assert_eq!(pool.reserve_b, 2000000 - amount_out);
}

#[test]
fn test_get_amount_out() {
    let (env, client, _, caller, token_a, token_b, amm_address) = setup_test();
    let pool_id = client.create_pair(&token_a, &token_b);

    let token_a_client = DefiTokenClient::new(&env, &token_a);
    let token_b_client = DefiTokenClient::new(&env, &token_b);
    token_a_client.approve(&caller, &amm_address, &1_000_000_000);
    token_b_client.approve(&caller, &amm_address, &2_000_000_000);

    client.add_liquidity(&pool_id, &caller, &1000000, &2000000, &0, &0);

    let amount_out = client.get_amount_out(&pool_id, &10000, &token_a);
    assert!(amount_out > 0);
}
