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

fn setup() -> (Env, DefiStakingClient<'static>, Address, Address, Address, u32, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(DefiStaking, ());
    let contract_addr = contract_id.clone();
    let client = DefiStakingClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let staking_token = create_token(&env, &admin);
    let reward_token = create_token(&env, &admin);

    client.initialize(&admin);
    let pool_id = client.create_pool(&staking_token, &reward_token, &100000);

    // Mint tokens to user
    let staking_client = DefiTokenClient::new(&env, &staking_token);
    staking_client.mint(&user, &1_000_000_000);
    let reward_client = DefiTokenClient::new(&env, &reward_token);
    reward_client.mint(&contract_addr, &1_000_000_000);

    (env, client, admin, user, staking_token, pool_id, contract_addr)
}

#[test]
fn test_create_pool() {
    let (env, client, _, _, staking_token, pool_id, _) = setup();
    let pool = client.get_pool(&pool_id);
    assert_eq!(pool.staking_token, staking_token);
}

#[test]
fn test_stake() {
    let (env, client, _, user, staking_token, pool_id, contract_addr) = setup();
    let staking_client = DefiTokenClient::new(&env, &staking_token);
    staking_client.approve(&user, &contract_addr, &1_000_000_000);

    client.stake(&pool_id, &user, &5000);

    let user_stake = client.get_user_stake(&pool_id, &user);
    assert_eq!(user_stake.amount, 5000);
}

#[test]
fn test_unstake() {
    let (env, client, _, user, staking_token, pool_id, contract_addr) = setup();
    let staking_client = DefiTokenClient::new(&env, &staking_token);
    staking_client.approve(&user, &contract_addr, &1_000_000_000);

    client.stake(&pool_id, &user, &5000);
    client.unstake(&pool_id, &user, &2000);

    let user_stake = client.get_user_stake(&pool_id, &user);
    assert_eq!(user_stake.amount, 3000);
}

#[test]
fn test_claim_rewards() {
    let (env, client, _, user, staking_token, pool_id, contract_addr) = setup();
    let staking_client = DefiTokenClient::new(&env, &staking_token);
    staking_client.approve(&user, &contract_addr, &1_000_000_000);

    client.stake(&pool_id, &user, &5000);

    let pending = client.get_pending_rewards(&pool_id, &user);
    assert_eq!(pending, 0);
}
