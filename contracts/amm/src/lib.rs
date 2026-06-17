#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, BytesN, Env, Map, Vec,
};

use defi_common::{check_nonnegative_amount, Error, LiquidityPool};

mod test;

#[contracttype]
pub struct SwapResult {
    pub amount_out: i128,
    pub fee: i128,
}

#[contract]
pub struct DefiAMM;

#[contractimpl]
impl DefiAMM {
    pub fn initialize(env: Env, admin: Address, fee_bps: u32) {
        if env.storage().instance().has(&BytesN::from_array(&env, &[0u8; 32])) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&BytesN::from_array(&env, &[0u8; 32]), &admin);
        env.storage().instance().set(&BytesN::from_array(&env, &[1u8; 32]), &fee_bps);
        env.storage().instance().set(&BytesN::from_array(&env, &[2u8; 32]), &0u32);
    }

    pub fn create_pair(env: Env, token_a: Address, token_b: Address) -> u32 {
        if token_a == token_b {
            panic!("identical tokens");
        }
        let next_id: u32 = env.storage().instance().get(&BytesN::from_array(&env, &[2u8; 32])).unwrap_or(0);
        let pair_key = (token_a.clone(), token_b.clone());
        let reverse_pair_key = (token_b.clone(), token_a.clone());

        if env.storage().instance().has(&pair_key) || env.storage().instance().has(&reverse_pair_key) {
            panic!("pair already exists");
        }

        let pool = LiquidityPool {
            token_a: token_a.clone(),
            token_b: token_b.clone(),
            reserve_a: 0,
            reserve_b: 0,
            lp_token: Address::generate(&env),
            total_supply: 0,
        };

        env.storage().instance().set(&pair_key, &next_id);
        env.storage().instance().set(&next_id, &pool);
        env.storage().instance().set(&BytesN::from_array(&env, &[2u8; 32]), &(next_id + 1));
        next_id
    }

    pub fn add_liquidity(
        env: Env,
        pool_id: u32,
        caller: Address,
        amount_a_desired: i128,
        amount_b_desired: i128,
        amount_a_min: i128,
        amount_b_min: i128,
    ) {
        caller.require_auth();
        check_nonnegative_amount(amount_a_desired).unwrap();
        check_nonnegative_amount(amount_b_desired).unwrap();

        let mut pool: LiquidityPool = env.storage().instance().get(&pool_id).unwrap();
        let (amount_a, amount_b) = if pool.reserve_a == 0 && pool.reserve_b == 0 {
            (amount_a_desired, amount_b_desired)
        } else {
            let amount_b_optimal = (amount_a_desired * pool.reserve_b) / pool.reserve_a;
            if amount_b_optimal <= amount_b_desired {
                if amount_b_optimal < amount_b_min {
                    panic!("insufficient b amount");
                }
                (amount_a_desired, amount_b_optimal)
            } else {
                let amount_a_optimal = (amount_b_desired * pool.reserve_a) / pool.reserve_b;
                if amount_a_optimal < amount_a_min {
                    panic!("insufficient a amount");
                }
                (amount_a_optimal, amount_b_desired)
            }
        };

        let token_a_client = defi_token::DefiTokenClient::new(&env, &pool.token_a);
        let token_b_client = defi_token::DefiTokenClient::new(&env, &pool.token_b);

        token_a_client.transfer_from(&caller, &env.current_contract_address(), &amount_a);
        token_b_client.transfer_from(&caller, &env.current_contract_address(), &amount_b);

        pool.reserve_a += amount_a;
        pool.reserve_b += amount_b;

        let lp_amount = if pool.total_supply == 0 {
            (amount_a * amount_b).isqrt()
        } else {
            let total_lp = pool.total_supply;
            let min_lp = core::cmp::min(
                (amount_a * total_lp) / pool.reserve_a,
                (amount_b * total_lp) / pool.reserve_b,
            );
            min_lp
        };

        pool.total_supply += lp_amount;

        env.storage().instance().set(&pool_id, &pool);

        let lp_balance: i128 = env.storage().instance().get(&(caller.clone(), pool_id)).unwrap_or(0);
        env.storage().instance().set(&(caller.clone(), pool_id), &(lp_balance + lp_amount));

        env.events().publish(
            ("add_liquidity", pool_id, caller),
            (amount_a, amount_b, lp_amount),
        );
    }

    pub fn remove_liquidity(
        env: Env,
        pool_id: u32,
        caller: Address,
        lp_amount: i128,
        amount_a_min: i128,
        amount_b_min: i128,
    ) {
        caller.require_auth();
        check_nonnegative_amount(lp_amount).unwrap();

        let mut pool: LiquidityPool = env.storage().instance().get(&pool_id).unwrap();
        let user_lp: i128 = env.storage().instance().get(&(caller.clone(), pool_id)).unwrap_or(0);

        if user_lp < lp_amount {
            panic!("insufficient lp tokens");
        }

        let amount_a = (lp_amount * pool.reserve_a) / pool.total_supply;
        let amount_b = (lp_amount * pool.reserve_b) / pool.total_supply;

        if amount_a < amount_a_min || amount_b < amount_b_min {
            panic!("slippage exceeded");
        }

        pool.reserve_a -= amount_a;
        pool.reserve_b -= amount_b;
        pool.total_supply -= lp_amount;

        env.storage().instance().set(&pool_id, &pool);
        env.storage().instance().set(&(caller.clone(), pool_id), &(user_lp - lp_amount));

        let token_a_client = defi_token::DefiTokenClient::new(&env, &pool.token_a);
        let token_b_client = defi_token::DefiTokenClient::new(&env, &pool.token_b);

        token_a_client.transfer(&env.current_contract_address(), &caller, &amount_a);
        token_b_client.transfer(&env.current_contract_address(), &caller, &amount_b);

        env.events().publish(
            ("remove_liquidity", pool_id, caller),
            (amount_a, amount_b, lp_amount),
        );
    }

    pub fn swap_exact_in(
        env: Env,
        pool_id: u32,
        caller: Address,
        token_in: Address,
        amount_in: i128,
        min_amount_out: i128,
    ) -> i128 {
        caller.require_auth();
        check_nonnegative_amount(amount_in).unwrap();

        let mut pool: LiquidityPool = env.storage().instance().get(&pool_id).unwrap();
        let fee_bps: u32 = env.storage().instance().get(&BytesN::from_array(&env, &[1u8; 32])).unwrap();

        let (reserve_in, reserve_out, is_a) = if token_in == pool.token_a {
            (pool.reserve_a, pool.reserve_b, true)
        } else if token_in == pool.token_b {
            (pool.reserve_b, pool.reserve_a, false)
        } else {
            panic!("invalid token");
        };

        let fee_amount = (amount_in * fee_bps as i128) / 10000;
        let amount_in_after_fee = amount_in - fee_amount;
        let amount_out = (reserve_out * amount_in_after_fee) / (reserve_in + amount_in_after_fee);

        if amount_out < min_amount_out {
            panic!("slippage exceeded");
        }

        let token_in_client = defi_token::DefiTokenClient::new(&env, &token_in);
        let token_out = if is_a { pool.token_b.clone() } else { pool.token_a.clone() };
        let token_out_client = defi_token::DefiTokenClient::new(&env, &token_out);

        token_in_client.transfer_from(&caller, &env.current_contract_address(), &amount_in);
        token_out_client.transfer(&env.current_contract_address(), &caller, &amount_out);

        if is_a {
            pool.reserve_a += amount_in;
            pool.reserve_b -= amount_out;
        } else {
            pool.reserve_b += amount_in;
            pool.reserve_a -= amount_out;
        }

        env.storage().instance().set(&pool_id, &pool);

        env.events().publish(
            ("swap", pool_id, caller, token_in, token_out),
            (amount_in, amount_out, fee_amount),
        );

        amount_out
    }

    pub fn get_pool(env: &Env, pool_id: u32) -> LiquidityPool {
        env.storage().instance().get(&pool_id).unwrap()
    }

    pub fn get_pool_by_tokens(env: &Env, token_a: Address, token_b: Address) -> Option<LiquidityPool> {
        let id: u32 = env.storage().instance().get(&(token_a, token_b)).unwrap_or(0);
        env.storage().instance().get(&id)
    }

    pub fn get_amount_out(
        env: &Env,
        pool_id: u32,
        amount_in: i128,
        token_in: Address,
    ) -> i128 {
        let pool: LiquidityPool = env.storage().instance().get(&pool_id).unwrap();
        let fee_bps: u32 = env.storage().instance().get(&BytesN::from_array(env, &[1u8; 32])).unwrap();

        let (reserve_in, reserve_out) = if token_in == pool.token_a {
            (pool.reserve_a, pool.reserve_b)
        } else {
            (pool.reserve_b, pool.reserve_a)
        };

        let fee_amount = (amount_in * fee_bps as i128) / 10000;
        let amount_in_after_fee = amount_in - fee_amount;
        (reserve_out * amount_in_after_fee) / (reserve_in + amount_in_after_fee)
    }

    pub fn set_fee(env: Env, new_fee_bps: u32) {
        let admin: Address = env.storage().instance().get(&BytesN::from_array(&env, &[0u8; 32])).unwrap();
        admin.require_auth();
        env.storage().instance().set(&BytesN::from_array(&env, &[1u8; 32]), &new_fee_bps);
    }
}
