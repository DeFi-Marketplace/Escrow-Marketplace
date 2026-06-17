import { stellarClient } from '../utils/stellar';
import logger from '../utils/logger';

const CONTRACT_ADDRESSES = {
  token: process.env.TOKEN_CONTRACT_ID || '',
  amm: process.env.AMM_CONTRACT_ID || '',
  lending: process.env.LENDING_CONTRACT_ID || '',
  staking: process.env.STAKING_CONTRACT_ID || '',
  nft: process.env.NFT_CONTRACT_ID || '',
  marketplace: process.env.MARKETPLACE_CONTRACT_ID || '',
  launchpad: process.env.LAUNCHPAD_CONTRACT_ID || '',
};

export class ContractService {
  getContractIds() {
    return { ...CONTRACT_ADDRESSES };
  }

  async getPool(poolId: number) {
    try {
      const result = await stellarClient.simulateContractCall(
        CONTRACT_ADDRESSES.amm,
        'get_pool',
        [stellarClient.toScVal(poolId)],
      );
      return result;
    } catch (error) {
      logger.error('Error fetching pool:', error);
      throw error;
    }
  }

  async getSwapQuote(poolId: number, amountIn: string, tokenIn: string) {
    try {
      const result = await stellarClient.simulateContractCall(
        CONTRACT_ADDRESSES.amm,
        'get_amount_out',
        [
          stellarClient.toScVal(poolId),
          stellarClient.toScVal(Number(amountIn)),
          stellarClient.toScVal(tokenIn),
        ],
      );
      return result;
    } catch (error) {
      logger.error('Error getting swap quote:', error);
      throw error;
    }
  }

  async getMarket(marketToken: string) {
    try {
      const result = await stellarClient.simulateContractCall(
        CONTRACT_ADDRESSES.lending,
        'get_market',
        [stellarClient.toScVal(marketToken)],
      );
      return result;
    } catch (error) {
      logger.error('Error fetching market:', error);
      throw error;
    }
  }

  async getUserPosition(user: string, marketToken: string) {
    try {
      const result = await stellarClient.simulateContractCall(
        CONTRACT_ADDRESSES.lending,
        'get_user_position',
        [stellarClient.toScVal(user), stellarClient.toScVal(marketToken)],
      );
      return result;
    } catch (error) {
      logger.error('Error fetching user position:', error);
      throw error;
    }
  }

  async getStakePool(poolId: number) {
    try {
      const result = await stellarClient.simulateContractCall(
        CONTRACT_ADDRESSES.staking,
        'get_pool',
        [stellarClient.toScVal(poolId)],
      );
      return result;
    } catch (error) {
      logger.error('Error fetching stake pool:', error);
      throw error;
    }
  }

  async getNFTInfo(nftContract: string, tokenId: number) {
    try {
      const metadata = await stellarClient.simulateContractCall(
        nftContract,
        'token_metadata',
        [stellarClient.toScVal(tokenId)],
      );
      const owner = await stellarClient.simulateContractCall(
        nftContract,
        'owner_of',
        [stellarClient.toScVal(tokenId)],
      );
      return { metadata, owner };
    } catch (error) {
      logger.error('Error fetching NFT info:', error);
      throw error;
    }
  }

  async getListing(listingId: number) {
    try {
      const result = await stellarClient.simulateContractCall(
        CONTRACT_ADDRESSES.marketplace,
        'get_listing',
        [stellarClient.toScVal(listingId)],
      );
      return result;
    } catch (error) {
      logger.error('Error fetching listing:', error);
      throw error;
    }
  }

  async getAuction(auctionId: number) {
    try {
      const result = await stellarClient.simulateContractCall(
        CONTRACT_ADDRESSES.marketplace,
        'get_auction',
        [stellarClient.toScVal(auctionId)],
      );
      return result;
    } catch (error) {
      logger.error('Error fetching auction:', error);
      throw error;
    }
  }

  async getLaunchpadSale(saleId: number) {
    try {
      const result = await stellarClient.simulateContractCall(
        CONTRACT_ADDRESSES.launchpad,
        'get_sale',
        [stellarClient.toScVal(saleId)],
      );
      return result;
    } catch (error) {
      logger.error('Error fetching launchpad sale:', error);
      throw error;
    }
  }
}

export const contractService = new ContractService();
