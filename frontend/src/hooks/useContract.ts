'use client';

import { useCallback } from 'react';
import { api } from '@/lib/api';
import { useWallet } from '@/context/WalletContext';

export function useContract() {
  const { address } = useWallet();

  const getSwapQuote = useCallback(async (poolId: number, tokenIn: string, amountIn: string) => {
    return api.getSwapQuote(poolId, tokenIn, amountIn);
  }, []);

  const executeSwap = useCallback(async (data: { poolId: number; tokenIn: string; amountIn: string; minAmountOut: string }) => {
    return api.executeSwap(data, address || undefined);
  }, [address]);

  const getPools = useCallback(async () => {
    return api.getPools();
  }, []);

  const addLiquidity = useCallback(async (poolId: number, amountA: string, amountB: string) => {
    return api.addLiquidity({ poolId, amountA, amountB }, address || undefined);
  }, [address]);

  const removeLiquidity = useCallback(async (poolId: number, lpAmount: string) => {
    return api.removeLiquidity({ poolId, lpAmount }, address || undefined);
  }, [address]);

  const getMarkets = useCallback(async () => {
    return api.getMarkets();
  }, []);

  const deposit = useCallback(async (marketToken: string, amount: string) => {
    return api.deposit({ marketToken, amount }, address || undefined);
  }, [address]);

  const borrow = useCallback(async (marketToken: string, amount: string) => {
    return api.borrow({ marketToken, amount }, address || undefined);
  }, [address]);

  const repay = useCallback(async (marketToken: string, amount: string) => {
    return api.repay({ marketToken, amount }, address || undefined);
  }, [address]);

  const getStakePools = useCallback(async () => {
    return api.getStakePools();
  }, []);

  const stake = useCallback(async (poolId: number, amount: string) => {
    return api.stake({ poolId, amount }, address || undefined);
  }, [address]);

  const unstake = useCallback(async (poolId: number, amount: string) => {
    return api.unstake({ poolId, amount }, address || undefined);
  }, [address]);

  const getNFTs = useCallback(async () => {
    return api.getNFTs();
  }, []);

  const createListing = useCallback(async (data: { tokenAddress: string; tokenId: number; price: string; paymentToken: string }) => {
    return api.createListing(data, address || undefined);
  }, [address]);

  const buyNFT = useCallback(async (listingId: number) => {
    return api.buyNFT(listingId, address || undefined);
  }, [address]);

  const getLaunchpadSales = useCallback(async () => {
    return api.getSales();
  }, []);

  const buyTokens = useCallback(async (saleId: number, amount: string) => {
    return api.buyTokens({ saleId, amount }, address || undefined);
  }, [address]);

  const claimTokens = useCallback(async (saleId: number) => {
    return api.claimTokens(saleId, address || undefined);
  }, [address]);

  const getPortfolio = useCallback(async () => {
    if (!address) return null;
    return api.getPortfolio(address);
  }, [address]);

  return {
    getSwapQuote,
    executeSwap,
    getPools,
    addLiquidity,
    removeLiquidity,
    getMarkets,
    deposit,
    borrow,
    repay,
    getStakePools,
    stake,
    unstake,
    getNFTs,
    createListing,
    buyNFT,
    getLaunchpadSales,
    buyTokens,
    claimTokens,
    getPortfolio,
  };
}
