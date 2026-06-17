import { Router, Request, Response } from 'express';
import { contractService } from '../services/contractService';
import { optionalAuth } from '../middleware/auth';

export const nftRouter = Router();

nftRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { contract, tokenId } = req.query;
    if (contract && tokenId) {
      const info = await contractService.getNFTInfo(contract as string, parseInt(tokenId as string));
      res.json({ success: true, data: info, timestamp: Date.now() });
    } else {
      res.json({ success: true, data: [], timestamp: Date.now() });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch NFTs', timestamp: Date.now() });
  }
});

nftRouter.get('/owned', optionalAuth, async (req: Request, res: Response) => {
  try {
    const address = req.userAddress;
    if (!address) {
      return res.status(401).json({ success: false, error: 'Not authenticated', timestamp: Date.now() });
    }
    res.json({ success: true, data: [], timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch owned NFTs', timestamp: Date.now() });
  }
});
