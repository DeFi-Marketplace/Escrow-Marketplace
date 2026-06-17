import { Router, Request, Response } from 'express';
import { contractService } from '../services/contractService';
import { optionalAuth } from '../middleware/auth';

export const launchpadRouter = Router();

launchpadRouter.get('/sales', async (req: Request, res: Response) => {
  try {
    const { saleId } = req.query;
    if (saleId) {
      const sale = await contractService.getLaunchpadSale(parseInt(saleId as string));
      res.json({ success: true, data: sale, timestamp: Date.now() });
    } else {
      res.json({ success: true, data: [], timestamp: Date.now() });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch sales', timestamp: Date.now() });
  }
});

launchpadRouter.post('/create', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { token, price, maxSupply, startTime, endTime, minPerWallet, maxPerWallet } = req.body;
    res.json({
      success: true,
      data: { token, price, maxSupply, startTime, endTime, status: 'simulated' },
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Sale creation failed', timestamp: Date.now() });
  }
});

launchpadRouter.post('/buy', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { saleId, amount } = req.body;
    res.json({ success: true, data: { saleId, amount, status: 'simulated' }, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Purchase failed', timestamp: Date.now() });
  }
});

launchpadRouter.post('/claim', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { saleId } = req.body;
    res.json({ success: true, data: { saleId, status: 'simulated' }, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Claim failed', timestamp: Date.now() });
  }
});

launchpadRouter.get('/user', optionalAuth, async (req: Request, res: Response) => {
  try {
    const address = req.userAddress;
    if (!address) {
      return res.status(401).json({ success: false, error: 'Not authenticated', timestamp: Date.now() });
    }
    res.json({ success: true, data: { user: address }, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch user data', timestamp: Date.now() });
  }
});
