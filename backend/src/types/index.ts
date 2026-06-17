export interface SwapQuote {
  poolId: number;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  fee: string;
  priceImpact: number;
}

export interface PoolData {
  id: number;
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  reserveA: string;
  reserveB: string;
  totalSupply: string;
  feeBps: number;
  apr: number;
  volume24h: string;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
  price?: number;
  balance?: string;
}

export interface LendingMarketData {
  token: TokenInfo;
  totalDeposits: string;
  totalBorrows: string;
  depositApy: number;
  borrowApy: number;
  collateralFactor: number;
  liquidity: string;
  utilizationRate: number;
}

export interface UserPositionData {
  deposited: string;
  borrowed: string;
  collateral: string;
  healthFactor: number;
}

export interface StakePoolData {
  id: number;
  stakingToken: TokenInfo;
  rewardToken: TokenInfo;
  totalStaked: string;
  rewardRate: string;
  apr: number;
  userStaked?: string;
  pendingRewards?: string;
}

export interface NFTData {
  contractId: string;
  tokenId: number;
  name: string;
  description: string;
  uri: string;
  owner: string;
  creator: string;
  royaltyBps: number;
  listing?: ListingData;
}

export interface ListingData {
  id: number;
  seller: string;
  price: string;
  paymentToken: string;
  active: boolean;
}

export interface AuctionData {
  id: number;
  seller: string;
  startPrice: string;
  endPrice: string;
  startTime: number;
  endTime: number;
  highestBid: string;
  highestBidder: string;
  paymentToken: string;
  active: boolean;
}

export interface LaunchpadSaleData {
  id: number;
  token: TokenInfo;
  price: string;
  maxSupply: string;
  sold: string;
  startTime: number;
  endTime: number;
  minPerWallet: string;
  maxPerWallet: string;
  whitelistOnly: boolean;
  finalized: boolean;
  userPurchased?: string;
}

export interface PortfolioData {
  address: string;
  totalValueUsd: number;
  tokens: TokenInfo[];
  nfts: NFTData[];
  stakingPositions: StakePoolData[];
  lendingPositions: LendingMarketData[];
  lpTokens: PoolData[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}
