import { Router, Request, Response } from 'express';

export const infoRouter = Router();

infoRouter.get('/contracts', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      token: process.env.TOKEN_CONTRACT_ID || '',
      amm: process.env.AMM_CONTRACT_ID || '',
      lending: process.env.LENDING_CONTRACT_ID || '',
      staking: process.env.STAKING_CONTRACT_ID || '',
      nft: process.env.NFT_CONTRACT_ID || '',
      marketplace: process.env.MARKETPLACE_CONTRACT_ID || '',
      launchpad: process.env.LAUNCHPAD_CONTRACT_ID || '',
    },
    timestamp: Date.now(),
  });
});

infoRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: Date.now(),
    },
  });
});
