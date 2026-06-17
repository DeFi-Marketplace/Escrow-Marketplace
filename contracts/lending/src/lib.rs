#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Map};

use defi_common::{check_nonnegative_amount, Error, LendingMarket, UserPosition};

mod test;

#[contract]
pub struct DefiLending;

#[contractimpl]
impl DefiLending {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&BytesN::from_array(&env, &[0u8; 32])) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&BytesN::from_array(&env, &[0u8; 32]), &admin);
    }

    pub fn create_market(
        env: Env,
        token: Address,
        collateral_factor: i128,
        reserve_factor: i128,
    ) {
        let admin: Address = env.storage().instance().get(&BytesN::from_array(&env, &[0u8; 32])).unwrap();
        admin.require_auth();

        if env.storage().instance().has(&token) {
            panic!("market already exists");
        }

        let market = LendingMarket {
            token: token.clone(),
            total_deposits: 0,
            total_borrows: 0,
            liquidity_index: 1000000000000000000,
            borrow_index: 1000000000000000000,
            reserve_factor,
            collateral_factor,
            interest_rate: 50000000000000000,
        };

        env.storage().instance().set(&token, &market);
    }

    pub fn deposit(env: Env, market_token: Address, caller: Address, amount: i128) {
        caller.require_auth();
        check_nonnegative_amount(amount).unwrap();

        let mut market: LendingMarket = env.storage().instance().get(&market_token).unwrap();

        let token_client = defi_token::DefiTokenClient::new(&env, &market_token);
        token_client.transfer_from(&caller, &env.current_contract_address(), &amount);

        market.total_deposits += amount;

        let mut position: UserPosition = env.storage()
            .instance()
            .get(&(caller.clone(), market_token.clone()))
            .unwrap_or(UserPosition { deposited: 0, borrowed: 0, collateral: 0 });

        let scaled_amount = (amount * market.liquidity_index) / 1000000000000000000;
        position.deposited += scaled_amount;
        position.collateral += scaled_amount;

        env.storage().instance().set(&market_token, &market);
        env.storage().instance().set(&(caller.clone(), market_token.clone()), &position);

        env.events().publish(("deposit", caller, market_token), amount);
    }

    pub fn withdraw(env: Env, market_token: Address, caller: Address, amount: i128) {
        caller.require_auth();
        check_nonnegative_amount(amount).unwrap();

        let mut market: LendingMarket = env.storage().instance().get(&market_token).unwrap();
        let mut position: UserPosition = env.storage()
            .instance()
            .get(&(caller.clone(), market_token.clone()))
            .unwrap();

        let scaled_amount = (amount * market.liquidity_index) / 1000000000000000000;
        if position.deposited < scaled_amount || position.collateral < scaled_amount {
            panic!("insufficient deposited");
        }
        if market.total_deposits < amount {
            panic!("insufficient liquidity");
        }

        position.deposited -= scaled_amount;
        position.collateral -= scaled_amount;
        market.total_deposits -= amount;

        let token_client = defi_token::DefiTokenClient::new(&env, &market_token);
        token_client.transfer(&env.current_contract_address(), &caller, &amount);

        env.storage().instance().set(&market_token, &market);
        env.storage().instance().set(&(caller.clone(), market_token.clone()), &position);

        env.events().publish(("withdraw", caller, market_token), amount);
    }

    pub fn borrow(env: Env, market_token: Address, caller: Address, amount: i128) {
        caller.require_auth();
        check_nonnegative_amount(amount).unwrap();

        let mut market: LendingMarket = env.storage().instance().get(&market_token).unwrap();

        // Calculate health factor across all positions
        let total_collateral = env.storage()
            .instance()
            .get::<_, UserPosition>(&(caller.clone(), market_token.clone()))
            .map(|p| p.collateral)
            .unwrap_or(0);

        let current_borrow: i128 = env.storage()
            .instance()
            .get::<_, UserPosition>(&(caller.clone(), market_token.clone()))
            .map(|p| p.borrowed)
            .unwrap_or(0);

        let new_borrow = current_borrow + (amount * market.borrow_index) / 1000000000000000000;

        if total_collateral == 0 {
            panic!("no collateral");
        }

        let health_factor = (total_collateral * market.collateral_factor * 100)
            / (new_borrow * 10000);
        if health_factor < 150 {
            panic!("health factor too low");
        }

        if market.total_deposits < amount {
            panic!("insufficient liquidity");
        }

        let scaled_amount = (amount * market.borrow_index) / 1000000000000000000;
        let mut position: UserPosition = env.storage()
            .instance()
            .get(&(caller.clone(), market_token.clone()))
            .unwrap_or(UserPosition { deposited: 0, borrowed: 0, collateral: 0 });

        position.borrowed += scaled_amount;
        market.total_borrows += amount;
        market.total_deposits -= amount;

        let token_client = defi_token::DefiTokenClient::new(&env, &market_token);
        token_client.transfer(&env.current_contract_address(), &caller, &amount);

        env.storage().instance().set(&market_token, &market);
        env.storage().instance().set(&(caller.clone(), market_token.clone()), &position);

        env.events().publish(("borrow", caller, market_token), amount);
    }

    pub fn repay(env: Env, market_token: Address, caller: Address, amount: i128) {
        caller.require_auth();
        check_nonnegative_amount(amount).unwrap();

        let mut market: LendingMarket = env.storage().instance().get(&market_token).unwrap();
        let mut position: UserPosition = env.storage()
            .instance()
            .get(&(caller.clone(), market_token.clone()))
            .unwrap();

        let debt_scaled = position.borrowed;
        let debt_amount = (debt_scaled * 1000000000000000000) / market.borrow_index;

        let repay_amount = if amount == i128::MAX { debt_amount } else { amount };
        let repay_scaled = (repay_amount * market.borrow_index) / 1000000000000000000;

        let token_client = defi_token::DefiTokenClient::new(&env, &market_token);
        token_client.transfer_from(&caller, &env.current_contract_address(), &repay_amount);

        position.borrowed -= repay_scaled;
        market.total_borrows -= repay_amount;
        market.total_deposits += repay_amount;

        env.storage().instance().set(&market_token, &market);
        env.storage().instance().set(&(caller.clone(), market_token.clone()), &position);

        env.events().publish(("repay", caller, market_token), repay_amount);
    }

    pub fn liquidate(
        env: Env,
        market_token: Address,
        user: Address,
        caller: Address,
        amount: i128,
    ) {
        caller.require_auth();
        check_nonnegative_amount(amount).unwrap();

        let mut market: LendingMarket = env.storage().instance().get(&market_token).unwrap();
        let mut position: UserPosition = env.storage()
            .instance()
            .get(&(user.clone(), market_token.clone()))
            .unwrap();

        let health_factor = (position.collateral * market.collateral_factor * 100)
            / (position.borrowed * 10000);

        if health_factor >= 100 {
            panic!("position is healthy");
        }

        let debt_scaled = position.borrowed;
        let debt_amount = (debt_scaled * 1000000000000000000) / market.borrow_index;
        let liquidate_amount = core::cmp::min(amount, debt_amount / 2);
        let repay_scaled = (liquidate_amount * market.borrow_index) / 1000000000000000000;

        let token_client = defi_token::DefiTokenClient::new(&env, &market_token);
        token_client.transfer_from(&caller, &env.current_contract_address(), &liquidate_amount);

        // Liquidator gets collateral at a discount
        let collateral_to_transfer = (liquidate_amount * 10000) / (market.collateral_factor * 95 / 100);

        token_client.transfer(&env.current_contract_address(), &caller, &collateral_to_transfer);

        // Update position
        position.borrowed -= repay_scaled;
        let collateral_scaled = (collateral_to_transfer * market.liquidity_index) / 1000000000000000000;
        position.collateral = position.collateral.saturating_sub(collateral_scaled);
        position.deposited = position.deposited.saturating_sub(collateral_scaled);

        // Update market
        market.total_borrows -= liquidate_amount;
        market.total_deposits -= collateral_to_transfer;

        env.storage().instance().set(&market_token, &market);
        env.storage().instance().set(&(user.clone(), market_token.clone()), &position);

        env.events().publish(("liquidation", caller, user, market_token), (amount, collateral_to_transfer));
    }

    pub fn get_market(env: &Env, token: Address) -> LendingMarket {
        env.storage().instance().get(&token).unwrap()
    }

    pub fn get_user_position(env: &Env, user: Address, token: Address) -> UserPosition {
        env.storage()
            .instance()
            .get(&(user, token))
            .unwrap_or(UserPosition { deposited: 0, borrowed: 0, collateral: 0 })
    }

    pub fn get_health_factor(env: &Env, user: Address, token: Address) -> i128 {
        let market: LendingMarket = env.storage().instance().get(&token).unwrap();
        let position: UserPosition = env.storage()
            .instance()
            .get(&(user, token))
            .unwrap_or(UserPosition { deposited: 0, borrowed: 0, collateral: 0 });

        if position.borrowed == 0 {
            return i128::MAX;
        }

        (position.collateral * market.collateral_factor * 100) / (position.borrowed * 10000)
    }
}
