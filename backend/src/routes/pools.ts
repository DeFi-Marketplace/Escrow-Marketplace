import { Router, Request, Response } from 'express';
import { validate, addLiquiditySchema, removeLiquiditySchema } from '../middleware/validation';
import { contractService } from '../services/contractService';
import { optionalAuth } from '../middleware/auth';

export const poolRouter = Router();

poolRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { tokenA, tokenB } = req.query;
    const contractIds = contractService.getContractIds();
    res.json({
      success: true,
      data: {
        pools: [],
        ammContract: contractIds.amm,
        filters: { tokenA, tokenB },
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch pools';
    res.status(500).json({ success: false, error: message, timestamp: Date.now() });
  }
});

poolRouter.get('/:poolId', async (req: Request, res: Response) => {
  try {
    const poolId = parseInt(req.params.poolId);
    const pool = await contractService.getPool(poolId);
    res.json({ success: true, data: pool, timestamp: Date.now() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch pool';
    res.status(500).json({ success: false, error: message, timestamp: Date.now() });
  }
});

poolRouter.post('/add-liquidity', optionalAuth, validate(addLiquiditySchema), async (req: Request, res: Response) => {
  try {
    const { poolId, amountA, amountB } = req.body;
    res.json({
      success: true,
      data: { poolId, amountA, amountB, status: 'simulated' },
      timestamp: Date.now(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add liquidity';
    res.status(500).json({ success: false, error: message, timestamp: Date.now() });
  }
});

poolRouter.post('/remove-liquidity', optionalAuth, validate(removeLiquiditySchema), async (req: Request, res: Response) => {
  try {
    const { poolId, lpAmount } = req.body;
    res.json({
      success: true,
      data: { poolId, lpAmount, status: 'simulated' },
      timestamp: Date.now(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove liquidity';
    res.status(500).json({ success: false, error: message, timestamp: Date.now() });
  }
});
