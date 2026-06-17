import { Router, Request, Response } from 'express';
import { validate, addLiquiditySchema, removeLiquiditySchema } from '../middleware/validation';
import { contractService } from '../services/contractService';
import { optionalAuth } from '../middleware/auth';

export const poolRouter = Router();

poolRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { tokenA, tokenB } = req.query;
    let pools;
    if (tokenA && tokenB) {
      pools = await contractService.getPool(0);
    }
    res.json({ success: true, data: pools || [], timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch pools', timestamp: Date.now() });
  }
});

poolRouter.get('/:poolId', async (req: Request, res: Response) => {
  try {
    const poolId = parseInt(req.params.poolId);
    const pool = await contractService.getPool(poolId);
    res.json({ success: true, data: pool, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch pool', timestamp: Date.now() });
  }
});

poolRouter.post('/add-liquidity', optionalAuth, validate(addLiquiditySchema), async (req: Request, res: Response) => {
  try {
    const { poolId, amountA, amountB, amountAMin, amountBMin } = req.body;
    res.json({
      success: true,
      data: { poolId, amountA, amountB, status: 'simulated' },
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add liquidity', timestamp: Date.now() });
  }
});

poolRouter.post('/remove-liquidity', optionalAuth, validate(removeLiquiditySchema), async (req: Request, res: Response) => {
  try {
    const { poolId, lpAmount, amountAMin, amountBMin } = req.body;
    res.json({
      success: true,
      data: { poolId, lpAmount, status: 'simulated' },
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to remove liquidity', timestamp: Date.now() });
  }
});
