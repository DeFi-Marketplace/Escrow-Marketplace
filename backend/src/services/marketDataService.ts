import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MarketDataService {
  async getTokenPrice(tokenId: string): Promise<number> {
    const pool = await prisma.liquidityPool.findFirst({
      where: {
        OR: [{ tokenAId: tokenId }, { tokenBId: tokenId }],
      },
      include: { tokenA: true, tokenB: true },
    });

    if (!pool) return 0;

    const reserveA = Number(pool.reserveA);
    const reserveB = Number(pool.reserveB);
    if (reserveA === 0 || reserveB === 0) return 0;

    if (pool.tokenAId === tokenId) {
      return reserveB / reserveA;
    }
    return reserveA / reserveB;
  }

  async getPoolApr(poolId: string): Promise<number> {
    const pool = await prisma.liquidityPool.findUnique({
      where: { id: poolId },
    });

    if (!pool) return 0;
    const volume24h = await this.getPoolVolume24h(pool.id);
    const tvl = Number(pool.reserveA) + Number(pool.reserveB);
    if (tvl === 0) return 0;
    const dailyFees = volume24h * (pool.feeBps / 10000);
    return (dailyFees * 365 * 100) / tvl;
  }

  async getPoolVolume24h(poolId: string): Promise<number> {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await prisma.transaction.count({
      where: {
        type: 'swap',
        createdAt: { gte: dayAgo },
        tokenId: poolId,
      },
    });
    return count * 1000; // rough estimate
  }

  async getLendingApy(tokenId: string): Promise<{ depositApy: number; borrowApy: number }> {
    const market = await prisma.lendingMarket.findUnique({
      where: { tokenId },
    });

    if (!market) return { depositApy: 0, borrowApy: 0 };

    const totalDeposits = Number(market.totalDeposits);
    const totalBorrows = Number(market.totalBorrows);
    const utilizationRate = totalDeposits > 0 ? totalBorrows / totalDeposits : 0;

    const baseRate = 0.02;
    const slope1 = 0.1;
    const slope2 = 1.0;
    const optimalUtilization = 0.8;

    let borrowApy: number;
    if (utilizationRate <= optimalUtilization) {
      borrowApy = baseRate + (utilizationRate / optimalUtilization) * slope1;
    } else {
      borrowApy =
        baseRate +
        slope1 +
        ((utilizationRate - optimalUtilization) / (1 - optimalUtilization)) * slope2;
    }

    const depositApy = utilizationRate * borrowApy * (1 - 0.1);

    return {
      depositApy: depositApy * 100,
      borrowApy: borrowApy * 100,
    };
  }

  async getStakingApr(poolId: string): Promise<number> {
    const pool = await prisma.stakingPool.findUnique({
      where: { id: poolId },
    });

    if (!pool || Number(pool.totalStaked) === 0) return 0;

    const rewardPerYear = Number(pool.rewardRate) * 365 * 24 * 60 * 60;
    const totalStaked = Number(pool.totalStaked);
    return (rewardPerYear / totalStaked) * 100;
  }
}

export const marketDataService = new MarketDataService();
