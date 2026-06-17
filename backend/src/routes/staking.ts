import { Router, Request, Response } from 'express';
import { validate, stakeSchema } from '../middleware/validation';
import { contractService } from '../services/contractService';
import { optionalAuth } from '../middleware/auth';

export const stakingRouter = Router();

stakingRouter.get('/pools', async (req: Request, res: Response) => {
  try {
    const { poolId } = req.query;
    if (poolId) {
      const pool = await contractService.getStakePool(parseInt(poolId as string));
      res.json({ success: true, data: pool, timestamp: Date.now() });
    } else {
      res.json({ success: true, data: [], timestamp: Date.now() });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch pools', timestamp: Date.now() });
  }
});

stakingRouter.get('/position', optionalAuth, async (req: Request, res: Response) => {
  try {
    const address = req.userAddress;
    const { poolId } = req.query;
    if (!address || !poolId) {
      return res.status(400).json({ success: false, error: 'Missing parameters', timestamp: Date.now() });
    }
    res.json({ success: true, data: { user: address, poolId }, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch position', timestamp: Date.now() });
  }
});

stakingRouter.post('/stake', optionalAuth, validate(stakeSchema), async (req: Request, res: Response) => {
  try {
    const { poolId, amount } = req.body;
    res.json({ success: true, data: { poolId, amount, status: 'simulated' }, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Stake failed', timestamp: Date.now() });
  }
});

stakingRouter.post('/unstake', optionalAuth, validate(stakeSchema), async (req: Request, res: Response) => {
  try {
    const { poolId, amount } = req.body;
    res.json({ success: true, data: { poolId, amount, status: 'simulated' }, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Unstake failed', timestamp: Date.now() });
  }
});

stakingRouter.post('/claim', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { poolId } = req.body;
    res.json({ success: true, data: { poolId, status: 'simulated' }, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Claim failed', timestamp: Date.now() });
  }
});
