#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env};

use defi_common::{check_nonnegative_amount, Error, StakePool, UserStake};

mod test;

#[contract]
pub struct DefiStaking;

#[contractimpl]
impl DefiStaking {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&BytesN::from_array(&env, &[0u8; 32])) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&BytesN::from_array(&env, &[0u8; 32]), &admin);
    }

    pub fn create_pool(
        env: Env,
        staking_token: Address,
        reward_token: Address,
        reward_rate: i128,
    ) -> u32 {
        let admin: Address = env.storage().instance().get(&BytesN::from_array(&env, &[0u8; 32])).unwrap();
        admin.require_auth();

        let next_id: u32 = env.storage().instance().get(&BytesN::from_array(&env, &[1u8; 32])).unwrap_or(1);
        let now = env.ledger().timestamp();

        let pool = StakePool {
            staking_token,
            reward_token,
            total_staked: 0,
            reward_rate,
            period_finish: now + 30 * 24 * 60 * 60,
            last_update: now,
            reward_per_token_stored: 0,
        };

        env.storage().instance().set(&next_id, &pool);
        env.storage().instance().set(&BytesN::from_array(&env, &[1u8; 32]), &(next_id + 1));
        next_id
    }

    pub fn stake(env: Env, pool_id: u32, caller: Address, amount: i128) {
        caller.require_auth();
        check_nonnegative_amount(amount).unwrap();

        let mut pool: StakePool = env.storage().instance().get(&pool_id).unwrap();
        let mut user_stake: UserStake = env.storage()
            .instance()
            .get(&(caller.clone(), pool_id))
            .unwrap_or(UserStake { amount: 0, reward_per_token_paid: 0, rewards_earned: 0 });

        // Update rewards
        user_stake.rewards_earned += Self::earned(&pool, &user_stake);
        user_stake.reward_per_token_paid = pool.reward_per_token_stored;
        user_stake.amount += amount;
        pool.total_staked += amount;

        let token_client = defi_token::DefiTokenClient::new(&env, &pool.staking_token);
        token_client.transfer_from(&caller, &env.current_contract_address(), &amount);

        pool.last_update = env.ledger().timestamp();
        env.storage().instance().set(&pool_id, &pool);
        env.storage().instance().set(&(caller.clone(), pool_id), &user_stake);

        env.events().publish(("stake", pool_id, caller), amount);
    }

    pub fn unstake(env: Env, pool_id: u32, caller: Address, amount: i128) {
        caller.require_auth();
        check_nonnegative_amount(amount).unwrap();

        let mut pool: StakePool = env.storage().instance().get(&pool_id).unwrap();
        let mut user_stake: UserStake = env.storage()
            .instance()
            .get(&(caller.clone(), pool_id))
            .unwrap();

        if user_stake.amount < amount {
            panic!("insufficient staked amount");
        }

        user_stake.rewards_earned += Self::earned(&pool, &user_stake);
        user_stake.reward_per_token_paid = pool.reward_per_token_stored;
        user_stake.amount -= amount;
        pool.total_staked -= amount;

        let token_client = defi_token::DefiTokenClient::new(&env, &pool.staking_token);
        token_client.transfer(&env.current_contract_address(), &caller, &amount);

        pool.last_update = env.ledger().timestamp();
        env.storage().instance().set(&pool_id, &pool);
        env.storage().instance().set(&(caller.clone(), pool_id), &user_stake);

        env.events().publish(("unstake", pool_id, caller), amount);
    }

    pub fn claim_rewards(env: Env, pool_id: u32, caller: Address) {
        caller.require_auth();

        let mut pool: StakePool = env.storage().instance().get(&pool_id).unwrap();
        let mut user_stake: UserStake = env.storage()
            .instance()
            .get(&(caller.clone(), pool_id))
            .unwrap();

        user_stake.rewards_earned += Self::earned(&pool, &user_stake);
        user_stake.reward_per_token_paid = pool.reward_per_token_stored;

        let reward_amount = user_stake.rewards_earned;
        if reward_amount > 0 {
            user_stake.rewards_earned = 0;

            let reward_token_client = defi_token::DefiTokenClient::new(&env, &pool.reward_token);
            reward_token_client.transfer(&env.current_contract_address(), &caller, &reward_amount);
        }

        pool.last_update = env.ledger().timestamp();
        env.storage().instance().set(&pool_id, &pool);
        env.storage().instance().set(&(caller.clone(), pool_id), &user_stake);

        env.events().publish(("claim_rewards", pool_id, caller), reward_amount);
    }

    fn earned(pool: &StakePool, user: &UserStake) -> i128 {
        let reward_per_token = Self::reward_per_token(pool);
        let user_reward = user.amount * (reward_per_token - user.reward_per_token_paid);
        user_reward / 1000000000000000000
    }

    fn reward_per_token(pool: &StakePool) -> i128 {
        if pool.total_staked == 0 {
            return pool.reward_per_token_stored;
        }
        let now = 0; // placeholder - would use env.ledger().timestamp()
        let time_diff = now as i128 - pool.last_update as i128;
        if time_diff <= 0 {
            return pool.reward_per_token_stored;
        }
        let reward = time_diff * pool.reward_rate * 1000000000000000000 / pool.total_staked;
        pool.reward_per_token_stored + reward
    }

    pub fn get_pool(env: &Env, pool_id: u32) -> StakePool {
        env.storage().instance().get(&pool_id).unwrap()
    }

    pub fn get_user_stake(env: &Env, pool_id: u32, user: Address) -> UserStake {
        env.storage()
            .instance()
            .get(&(user, pool_id))
            .unwrap_or(UserStake { amount: 0, reward_per_token_paid: 0, rewards_earned: 0 })
    }

    pub fn get_pending_rewards(env: &Env, pool_id: u32, user: Address) -> i128 {
        let pool: StakePool = env.storage().instance().get(&pool_id).unwrap();
        let user_stake: UserStake = env.storage()
            .instance()
            .get(&(user, pool_id))
            .unwrap_or(UserStake { amount: 0, reward_per_token_paid: 0, rewards_earned: 0 });

        user_stake.rewards_earned + Self::earned(&pool, &user_stake)
    }
}
