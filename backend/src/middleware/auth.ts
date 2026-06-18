import { Request, Response, NextFunction } from 'express';

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      userAddress?: string;
    }
  }
}

export function validateWalletSignature(req: Request, res: Response, next: NextFunction) {
  const address = req.headers['x-wallet-address'] as string;

  if (!address) {
    return res.status(401).json({
      success: false,
      error: 'Missing wallet address',
      timestamp: Date.now(),
    });
  }

  req.userAddress = address.toLowerCase();
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const address = req.headers['x-wallet-address'] as string;
  if (address) {
    req.userAddress = address.toLowerCase();
  }
  next();
}
