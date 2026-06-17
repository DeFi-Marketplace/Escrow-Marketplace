#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn setup() -> (Env, DefiStakingClient<'static>, Address, Address, Address, u32) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(DefiStaking, ());
    let client = DefiStakingClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let staking_token = Address::generate(&env);
    let reward_token = Address::generate(&env);

    client.initialize(&admin);
    let pool_id = client.create_pool(&staking_token, &reward_token, &100000);

    (env, client, admin, staking_token, reward_token, pool_id)
}

#[test]
fn test_create_pool() {
    let (env, client, admin, staking_token, reward_token, pool_id) = setup();
    let pool = client.get_pool(&pool_id);
    assert_eq!(pool.staking_token, staking_token);
    assert_eq!(pool.reward_token, reward_token);
}

#[test]
fn test_stake() {
    let (env, client, admin, staking_token, reward_token, pool_id) = setup();
    let user = Address::generate(&env);
    client.stake(&pool_id, &user, &5000);

    let user_stake = client.get_user_stake(&pool_id, &user);
    assert_eq!(user_stake.amount, 5000);
}

#[test]
fn test_unstake() {
    let (env, client, admin, staking_token, reward_token, pool_id) = setup();
    let user = Address::generate(&env);
    client.stake(&pool_id, &user, &5000);
    client.unstake(&pool_id, &user, &2000);

    let user_stake = client.get_user_stake(&pool_id, &user);
    assert_eq!(user_stake.amount, 3000);
}
