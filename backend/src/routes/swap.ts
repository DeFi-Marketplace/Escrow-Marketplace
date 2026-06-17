import { Router, Request, Response } from 'express';
import { validate, swapQuoteSchema, swapSchema } from '../middleware/validation';
import { contractService } from '../services/contractService';
import { optionalAuth } from '../middleware/auth';

export const swapRouter = Router();

swapRouter.post('/quote', validate(swapQuoteSchema), async (req: Request, res: Response) => {
  try {
    const { poolId, tokenIn, amountIn } = req.body;
    const quote = await contractService.getSwapQuote(poolId, amountIn, tokenIn);
    res.json({ success: true, data: quote, timestamp: Date.now() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get quote';
    res.status(500).json({ success: false, error: message, timestamp: Date.now() });
  }
});

swapRouter.post('/execute', optionalAuth, validate(swapSchema), async (req: Request, res: Response) => {
  try {
    const { poolId, tokenIn, amountIn, minAmountOut } = req.body;
    const result = { poolId, tokenIn, amountIn, minAmountOut, status: 'simulated' };
    res.json({ success: true, data: result, timestamp: Date.now() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Swap failed';
    res.status(500).json({ success: false, error: message, timestamp: Date.now() });
  }
});

swapRouter.get('/pairs', async (_req: Request, res: Response) => {
  try {
    const contractIds = contractService.getContractIds();
    res.json({
      success: true,
      data: { ammContract: contractIds.amm },
      timestamp: Date.now(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list pairs';
    res.status(500).json({ success: false, error: message, timestamp: Date.now() });
  }
});
