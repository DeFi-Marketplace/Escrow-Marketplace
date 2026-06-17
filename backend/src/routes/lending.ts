import { Router, Request, Response } from 'express';
import { validate, depositSchema, borrowSchema } from '../middleware/validation';
import { contractService } from '../services/contractService';
import { optionalAuth } from '../middleware/auth';
import { marketDataService } from '../services/marketDataService';

export const lendingRouter = Router();

lendingRouter.get('/markets', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (token) {
      const market = await contractService.getMarket(token as string);
      res.json({ success: true, data: market, timestamp: Date.now() });
    } else {
      res.json({ success: true, data: [], timestamp: Date.now() });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch markets', timestamp: Date.now() });
  }
});

lendingRouter.get('/position', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { marketToken } = req.query;
    const address = req.userAddress;
    if (!address || !marketToken) {
      return res.status(400).json({ success: false, error: 'Missing parameters', timestamp: Date.now() });
    }
    const position = await contractService.getUserPosition(address, marketToken as string);
    const apy = await marketDataService.getLendingApy(marketToken as string);
    res.json({ success: true, data: { ...position, apy }, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch position', timestamp: Date.now() });
  }
});

lendingRouter.post('/deposit', optionalAuth, validate(depositSchema), async (req: Request, res: Response) => {
  try {
    const { marketToken, amount } = req.body;
    res.json({ success: true, data: { marketToken, amount, status: 'simulated' }, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Deposit failed', timestamp: Date.now() });
  }
});

lendingRouter.post('/withdraw', optionalAuth, validate(depositSchema), async (req: Request, res: Response) => {
  try {
    const { marketToken, amount } = req.body;
    res.json({ success: true, data: { marketToken, amount, status: 'simulated' }, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Withdraw failed', timestamp: Date.now() });
  }
});

lendingRouter.post('/borrow', optionalAuth, validate(borrowSchema), async (req: Request, res: Response) => {
  try {
    const { marketToken, amount } = req.body;
    res.json({ success: true, data: { marketToken, amount, status: 'simulated' }, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Borrow failed', timestamp: Date.now() });
  }
});

lendingRouter.post('/repay', optionalAuth, validate(depositSchema), async (req: Request, res: Response) => {
  try {
    const { marketToken, amount } = req.body;
    res.json({ success: true, data: { marketToken, amount, status: 'simulated' }, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Repay failed', timestamp: Date.now() });
  }
});
