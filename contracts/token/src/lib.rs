#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, BytesN, Env, String as SorobanString, Symbol,
};

mod test;

#[contracttype]
#[derive(Clone)]
pub struct TokenMetadata {
    pub name: SorobanString,
    pub symbol: SorobanString,
    pub decimals: u32,
}

#[contract]
pub struct DefiToken;

#[contractimpl]
impl DefiToken {
    pub fn initialize(
        env: Env,
        admin: Address,
        name: SorobanString,
        symbol: SorobanString,
        decimals: u32,
    ) {
        if env.storage().instance().has(&BytesN::from_array(&env, &[0u8; 32])) {
            panic!("already initialized");
        }

        admin.require_auth();
        env.storage().instance().set(&BytesN::from_array(&env, &[0u8; 32]), &admin);
        env.storage().instance().set(&BytesN::from_array(&env, &[1u8; 32]), &TokenMetadata { name, symbol, decimals });
    }

    pub fn mint(env: Env, to: Address, amount: i128) {
        let admin: Address = env.storage().instance().get(&BytesN::from_array(&env, &[0u8; 32])).unwrap();
        admin.require_auth();

        if amount <= 0 {
            panic!("invalid amount");
        }

        token::TokenInterface::receive_balance(&env, &to, amount);
        token::TokenInterface::receive_total_supply(&env, amount);

        env.events().publish(
            (SorobanString::from_str(&env, "mint"), admin, to),
            amount,
        );
    }

    pub fn burn(env: Env, from: Address, amount: i128) {
        from.require_auth();

        if amount <= 0 {
            panic!("invalid amount");
        }

        token::TokenInterface::spend_balance(&env, &from, amount);
        token::TokenInterface::spend_total_supply(&env, amount);

        env.events().publish(
            (SorobanString::from_str(&env, "burn"), from),
            amount,
        );
    }

    pub fn set_admin(env: Env, new_admin: Address) {
        let admin: Address = env.storage().instance().get(&BytesN::from_array(&env, &[0u8; 32])).unwrap();
        admin.require_auth();
        env.storage().instance().set(&BytesN::from_array(&env, &[0u8; 32]), &new_admin);
    }

    pub fn name(env: &Env) -> SorobanString {
        let meta: TokenMetadata = env.storage().instance().get(&BytesN::from_array(env, &[1u8; 32])).unwrap();
        meta.name
    }

    pub fn symbol(env: &Env) -> SorobanString {
        let meta: TokenMetadata = env.storage().instance().get(&BytesN::from_array(env, &[1u8; 32])).unwrap();
        meta.symbol
    }

    pub fn decimals(env: &Env) -> u32 {
        let meta: TokenMetadata = env.storage().instance().get(&BytesN::from_array(env, &[1u8; 32])).unwrap();
        meta.decimals
    }

    pub fn balance(env: &Env, id: Address) -> i128 {
        token::TokenInterface::read_balance(&env, &id)
    }

    pub fn total_supply(env: &Env) -> i128 {
        token::TokenInterface::read_total_supply(&env)
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        if amount <= 0 {
            panic!("invalid amount");
        }
        token::TokenInterface::spend_balance(&env, &from, amount);
        token::TokenInterface::receive_balance(&env, &to, amount);
        env.events().publish(
            (SorobanString::from_str(&env, "transfer"), from, to),
            amount,
        );
    }

    pub fn approve(env: Env, from: Address, spender: Address, amount: i128) {
        from.require_auth();
        env.storage().instance().set(
            &(from.clone(), spender.clone()),
            &amount,
        );
        env.events().publish(
            (SorobanString::from_str(&env, "approve"), from, spender),
            amount,
        );
    }

    pub fn allowance(env: &Env, owner: Address, spender: Address) -> i128 {
        env.storage()
            .instance()
            .get(&(owner, spender))
            .unwrap_or(0)
    }

    pub fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        spender.require_auth();
        let mut allowed = env.storage().instance().get(&(from.clone(), spender.clone())).unwrap_or(0);
        if allowed < amount {
            panic!("insufficient allowance");
        }
        allowed -= amount;
        if allowed > 0 {
            env.storage().instance().set(&(from.clone(), spender.clone()), &allowed);
        } else {
            env.storage().instance().remove(&(from.clone(), spender.clone()));
        }
        token::TokenInterface::spend_balance(&env, &from, amount);
        token::TokenInterface::receive_balance(&env, &to, amount);
        env.events().publish(
            (SorobanString::from_str(&env, "transfer_from"), spender, from, to),
            amount,
        );
    }
}

mod token {
    use soroban_sdk::{Address, Env, Symbol};

    fn balance_key(addr: &Address) -> (Symbol, Address) {
        (Symbol::new(&Env::default(), "balance"), addr.clone())
    }

    fn total_supply_key() -> Symbol {
        Symbol::new(&Env::default(), "total_supply")
    }

    pub trait TokenInterface {
        fn read_balance(env: &Env, addr: &Address) -> i128;
        fn receive_balance(env: &Env, addr: &Address, amount: i128);
        fn spend_balance(env: &Env, addr: &Address, amount: i128);
        fn read_total_supply(env: &Env) -> i128;
        fn receive_total_supply(env: &Env, amount: i128);
        fn spend_total_supply(env: &Env, amount: i128);
    }

    impl TokenInterface for () {
        fn read_balance(env: &Env, addr: &Address) -> i128 {
            let key = balance_key(addr);
            env.storage().instance().get(&key).unwrap_or(0)
        }

        fn receive_balance(env: &Env, addr: &Address, amount: i128) {
            let key = balance_key(addr);
            let balance: i128 = env.storage().instance().get(&key).unwrap_or(0);
            let new_balance = balance.checked_add(amount).expect("overflow");
            env.storage().instance().set(&key, &new_balance);
        }

        fn spend_balance(env: &Env, addr: &Address, amount: i128) {
            let key = balance_key(addr);
            let balance: i128 = env.storage().instance().get(&key).unwrap_or(0);
            if balance < amount {
                panic!("insufficient balance");
            }
            let new_balance = balance.checked_sub(amount).expect("underflow");
            env.storage().instance().set(&key, &new_balance);
        }

        fn read_total_supply(env: &Env) -> i128 {
            env.storage().instance().get(&total_supply_key()).unwrap_or(0)
        }

        fn receive_total_supply(env: &Env, amount: i128) {
            let supply: i128 = env.storage().instance().get(&total_supply_key()).unwrap_or(0);
            let new_supply = supply.checked_add(amount).expect("overflow");
            env.storage().instance().set(&total_supply_key(), &new_supply);
        }

        fn spend_total_supply(env: &Env, amount: i128) {
            let supply: i128 = env.storage().instance().get(&total_supply_key()).unwrap_or(0);
            if supply < amount {
                panic!("insufficient total supply");
            }
            let new_supply = supply.checked_sub(amount).expect("underflow");
            env.storage().instance().set(&total_supply_key(), &new_supply);
        }
    }
}
