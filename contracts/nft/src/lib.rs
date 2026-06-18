#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Bytes, BytesN, Env, String as SorobanString, Vec,
};

use defi_common::NFTMetadata;

mod test;

#[contracttype]
#[derive(Clone)]
pub struct NFTData {
    pub owner: Address,
    pub metadata: NFTMetadata,
    pub approved: Option<Address>,
    pub exists: bool,
}

#[contract]
pub struct DefiNFT;

#[contractimpl]
impl DefiNFT {
    pub fn initialize(env: Env, admin: Address, name: SorobanString, symbol: SorobanString) {
        if env.storage().instance().has(&BytesN::from_array(&env, &[0u8; 32])) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&BytesN::from_array(&env, &[0u8; 32]), &admin);
        env.storage().instance().set(&BytesN::from_array(&env, &[1u8; 32]), &name);
        env.storage().instance().set(&BytesN::from_array(&env, &[2u8; 32]), &symbol);
        env.storage().instance().set(&BytesN::from_array(&env, &[3u8; 32]), &0u32);
    }

    pub fn mint(
        env: Env,
        to: Address,
        uri: Bytes,
        name: Bytes,
        description: Bytes,
        royalty_bps: u32,
    ) -> u32 {
        let admin: Address = env.storage().instance().get(&BytesN::from_array(&env, &[0u8; 32])).unwrap();
        admin.require_auth();

        let token_id: u32 = env.storage().instance().get(&BytesN::from_array(&env, &[3u8; 32])).unwrap();
        let new_token_id = token_id + 1;

        let metadata = NFTMetadata {
            name,
            description,
            uri,
            creator: to.clone(),
            royalty_bps,
        };

        let nft = NFTData {
            owner: to.clone(),
            metadata,
            approved: None,
            exists: true,
        };

        env.storage().instance().set(&new_token_id, &nft);
        env.storage().instance().set(&BytesN::from_array(&env, &[3u8; 32]), &new_token_id);

        // Track tokens owned by address
        let mut owned: Vec<u32> = env.storage()
            .instance()
            .get(&(BytesN::from_array(&env, &[4u8; 32]), to.clone()))
            .unwrap_or(Vec::new(&env));
        owned.push_back(new_token_id);
        env.storage().instance().set(&(BytesN::from_array(&env, &[4u8; 32]), to.clone()), &owned);

        env.events().publish(
            ("mint", to, new_token_id),
            (SorobanString::from_str(&env, "mint"), new_token_id, to.clone()),
        );

        new_token_id
    }

    pub fn transfer(env: Env, from: Address, to: Address, token_id: u32) {
        let mut nft: NFTData = env.storage().instance().get(&token_id).unwrap();
        if !nft.exists {
            panic!("token does not exist");
        }

        let caller = env.current_contract_address();
        if nft.owner != from {
            panic!("not the owner");
        }

        from.require_auth();

        // Remove from old owner's list
        let mut from_owned: Vec<u32> = env.storage()
            .instance()
            .get(&(BytesN::from_array(&env, &[4u8; 32]), from.clone()))
            .unwrap();
        let mut new_from_owned = Vec::new(&env);
        for i in 0..from_owned.len() {
            if from_owned.get(i).unwrap() != token_id {
                new_from_owned.push_back(from_owned.get(i).unwrap());
            }
        }
        env.storage().instance().set(&(BytesN::from_array(&env, &[4u8; 32]), from.clone()), &new_from_owned);

        // Add to new owner's list
        let mut to_owned: Vec<u32> = env.storage()
            .instance()
            .get(&(BytesN::from_array(&env, &[4u8; 32]), to.clone()))
            .unwrap_or(Vec::new(&env));
        to_owned.push_back(token_id);
        env.storage().instance().set(&(BytesN::from_array(&env, &[4u8; 32]), to.clone()), &to_owned);

        nft.owner = to.clone();
        nft.approved = None;
        env.storage().instance().set(&token_id, &nft);

        env.events().publish(("transfer", from, to, token_id), ());
    }

    pub fn approve(env: Env, owner: Address, spender: Address, token_id: u32) {
        let mut nft: NFTData = env.storage().instance().get(&token_id).unwrap();
        if nft.owner != owner {
            panic!("not the owner");
        }
        owner.require_auth();
        nft.approved = Some(spender.clone());
        env.storage().instance().set(&token_id, &nft);

        env.events().publish(("approve", owner, spender, token_id), ());
    }

    pub fn owner_of(env: &Env, token_id: u32) -> Address {
        let nft: NFTData = env.storage().instance().get(&token_id).unwrap();
        nft.owner
    }

    pub fn token_uri(env: &Env, token_id: u32) -> Bytes {
        let nft: NFTData = env.storage().instance().get(&token_id).unwrap();
        nft.metadata.uri
    }

    pub fn token_metadata(env: &Env, token_id: u32) -> NFTMetadata {
        let nft: NFTData = env.storage().instance().get(&token_id).unwrap();
        nft.metadata
    }

    pub fn name(env: &Env) -> SorobanString {
        env.storage().instance().get(&BytesN::from_array(env, &[1u8; 32])).unwrap()
    }

    pub fn symbol(env: &Env) -> SorobanString {
        env.storage().instance().get(&BytesN::from_array(env, &[2u8; 32])).unwrap()
    }

    pub fn total_supply(env: &Env) -> u32 {
        env.storage().instance().get(&BytesN::from_array(env, &[3u8; 32])).unwrap()
    }

    pub fn tokens_of(env: &Env, owner: Address) -> Vec<u32> {
        env.storage()
            .instance()
            .get(&(BytesN::from_array(env, &[4u8; 32]), owner))
            .unwrap_or(Vec::new(env))
    }

    pub fn burn(env: Env, caller: Address, token_id: u32) {
        let mut nft: NFTData = env.storage().instance().get(&token_id).unwrap();
        if nft.owner != caller {
            panic!("not the owner");
        }
        caller.require_auth();

        nft.exists = false;
        env.storage().instance().set(&token_id, &nft);

        // Remove from owner's list
        let mut owned: Vec<u32> = env.storage()
            .instance()
            .get(&(BytesN::from_array(&env, &[4u8; 32]), caller.clone()))
            .unwrap();
        let mut new_owned = Vec::new(&env);
        for i in 0..owned.len() {
            if owned.get(i).unwrap() != token_id {
                new_owned.push_back(owned.get(i).unwrap());
            }
        }
        env.storage().instance().set(&(BytesN::from_array(&env, &[4u8; 32]), caller.clone()), &new_owned);

        env.events().publish(("burn", caller, token_id), ());
    }
}
