#![no_std]
use soroban_sdk::{contracterror, contracttype, Address, Env, Vec};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InsufficientBalance = 4,
    InsufficientAllowance = 5,
    Overflow = 6,
    Underflow = 7,
    InvalidAmount = 8,
    InvalidPair = 9,
    InsufficientLiquidity = 10,
    SlippageExceeded = 11,
    DeadlineExceeded = 12,
    PoolNotFound = 13,
    PositionNotFound = 14,
    NotEnoughCollateral = 15,
    HealthFactorTooLow = 16,
    AlreadyListed = 17,
    NotListed = 18,
    AuctionExpired = 19,
    BidTooLow = 20,
    SaleAlreadyStarted = 21,
    SaleNotStarted = 22,
    SaleEnded = 23,
    AlreadyClaimed = 24,
    NotWhitelisted = 25,
    InvalidMetadata = 26,
    NFTAlreadyMinted = 27,
    TokenIdNotFound = 28,
    NotApproved = 29,
    ProtocolPaused = 30,
}

#[contracttype]
pub struct SwapStep {
    pub pool_id: u32,
    pub asset_in: Address,
    pub asset_out: Address,
    pub amount_in: i128,
    pub min_amount_out: i128,
}

#[contracttype]
pub struct LiquidityPool {
    pub token_a: Address,
    pub token_b: Address,
    pub reserve_a: i128,
    pub reserve_b: i128,
    pub lp_token: Address,
    pub total_supply: i128,
}

#[contracttype]
pub struct LendingMarket {
    pub token: Address,
    pub total_deposits: i128,
    pub total_borrows: i128,
    pub liquidity_index: i128,
    pub borrow_index: i128,
    pub reserve_factor: i128,
    pub collateral_factor: i128,
    pub interest_rate: i128,
}

#[contracttype]
pub struct UserPosition {
    pub deposited: i128,
    pub borrowed: i128,
    pub collateral: i128,
}

#[contracttype]
pub struct StakePool {
    pub staking_token: Address,
    pub reward_token: Address,
    pub total_staked: i128,
    pub reward_rate: i128,
    pub period_finish: u64,
    pub last_update: u64,
    pub reward_per_token_stored: i128,
}

#[contracttype]
pub struct UserStake {
    pub amount: i128,
    pub reward_per_token_paid: i128,
    pub rewards_earned: i128,
}

#[contracttype]
pub struct NFTMetadata {
    pub name: Vec<u8>,
    pub description: Vec<u8>,
    pub uri: Vec<u8>,
    pub creator: Address,
    pub royalty_bps: u32,
}

#[contracttype]
pub struct MarketplaceListing {
    pub seller: Address,
    pub token_address: Address,
    pub token_id: u32,
    pub price: i128,
    pub payment_token: Address,
    pub active: bool,
}

#[contracttype]
pub struct Auction {
    pub seller: Address,
    pub token_address: Address,
    pub token_id: u32,
    pub start_price: i128,
    pub end_price: i128,
    pub start_time: u64,
    pub end_time: u64,
    pub highest_bid: i128,
    pub highest_bidder: Address,
    pub payment_token: Address,
    pub active: bool,
}

#[contracttype]
pub struct LaunchpadSale {
    pub token: Address,
    pub owner: Address,
    pub price: i128,
    pub max_supply: i128,
    pub sold: i128,
    pub start_time: u64,
    pub end_time: u64,
    pub min_per_wallet: i128,
    pub max_per_wallet: i128,
    pub whitelist_only: bool,
    pub finalized: bool,
}

pub fn check_nonnegative_amount(amount: i128) -> Result<(), Error> {
    if amount < 0 {
        Err(Error::InvalidAmount)
    } else {
        Ok(())
    }
}

pub fn calculate_k(reserve_a: i128, reserve_b: i128) -> Result<i128, Error> {
    reserve_a
        .checked_mul(reserve_b)
        .ok_or(Error::Overflow)
}

pub fn calculate_health_factor(
    collateral_value: i128,
    borrowed_value: i128,
    collateral_factor: i128,
) -> i128 {
    if borrowed_value == 0 {
        return i128::MAX;
    }
    let adjusted_collateral = (collateral_value * collateral_factor) / 10000;
    (adjusted_collateral * 100) / borrowed_value
}
