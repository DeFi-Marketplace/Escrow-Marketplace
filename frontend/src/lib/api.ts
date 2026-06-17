import { API_BASE } from './utils';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  walletAddress?: string;
}

async function apiClient<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, walletAddress } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(walletAddress ? { 'X-Wallet-Address': walletAddress } : {}),
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Swap
  getSwapQuote: (poolId: number, tokenIn: string, amountIn: string) =>
    apiClient('/swap/quote', {
      method: 'POST',
      body: { poolId, tokenIn, amountIn },
    }),

  executeSwap: (data: { poolId: number; tokenIn: string; amountIn: string; minAmountOut: string }, address?: string) =>
    apiClient('/swap/execute', { method: 'POST', body: data, walletAddress: address }),

  // Pools
  getPools: () => apiClient('/pools'),

  getPool: (poolId: number) => apiClient(`/pools/${poolId}`),

  addLiquidity: (data: { poolId: number; amountA: string; amountB: string }, address?: string) =>
    apiClient('/pools/add-liquidity', { method: 'POST', body: data, walletAddress: address }),

  removeLiquidity: (data: { poolId: number; lpAmount: string }, address?: string) =>
    apiClient('/pools/remove-liquidity', { method: 'POST', body: data, walletAddress: address }),

  // Lending
  getMarkets: () => apiClient('/lending/markets'),

  getPosition: (marketToken: string, address: string) =>
    apiClient(`/lending/position?marketToken=${marketToken}`, { walletAddress: address }),

  deposit: (data: { marketToken: string; amount: string }, address?: string) =>
    apiClient('/lending/deposit', { method: 'POST', body: data, walletAddress: address }),

  withdraw: (data: { marketToken: string; amount: string }, address?: string) =>
    apiClient('/lending/withdraw', { method: 'POST', body: data, walletAddress: address }),

  borrow: (data: { marketToken: string; amount: string }, address?: string) =>
    apiClient('/lending/borrow', { method: 'POST', body: data, walletAddress: address }),

  repay: (data: { marketToken: string; amount: string }, address?: string) =>
    apiClient('/lending/repay', { method: 'POST', body: data, walletAddress: address }),

  // Staking
  getStakePools: () => apiClient('/staking/pools'),

  stake: (data: { poolId: number; amount: string }, address?: string) =>
    apiClient('/staking/stake', { method: 'POST', body: data, walletAddress: address }),

  unstake: (data: { poolId: number; amount: string }, address?: string) =>
    apiClient('/staking/unstake', { method: 'POST', body: data, walletAddress: address }),

  claimRewards: (poolId: number, address?: string) =>
    apiClient('/staking/claim', { method: 'POST', body: { poolId }, walletAddress: address }),

  // NFTs
  getNFTs: () => apiClient('/nfts'),

  getOwnedNFTs: (address: string) =>
    apiClient('/nfts/owned', { walletAddress: address }),

  // Marketplace
  getListings: () => apiClient('/marketplace/listings'),

  createListing: (data: { tokenAddress: string; tokenId: number; price: string; paymentToken: string }, address?: string) =>
    apiClient('/marketplace/list', { method: 'POST', body: data, walletAddress: address }),

  buyNFT: (listingId: number, address?: string) =>
    apiClient('/marketplace/buy', { method: 'POST', body: { listingId }, walletAddress: address }),

  getAuctions: () => apiClient('/marketplace/auctions'),

  placeBid: (data: { auctionId: number; amount: string }, address?: string) =>
    apiClient('/marketplace/place-bid', { method: 'POST', body: data, walletAddress: address }),

  // Launchpad
  getSales: () => apiClient('/launchpad/sales'),

  buyTokens: (data: { saleId: number; amount: string }, address?: string) =>
    apiClient('/launchpad/buy', { method: 'POST', body: data, walletAddress: address }),

  claimTokens: (saleId: number, address?: string) =>
    apiClient('/launchpad/claim', { method: 'POST', body: { saleId }, walletAddress: address }),

  // Portfolio
  getPortfolio: (address: string) =>
    apiClient('/portfolio', { walletAddress: address }),

  // Info
  getContracts: () => apiClient('/info/contracts'),
  getHealth: () => apiClient('/info/health'),
};
