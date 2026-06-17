import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export function validate(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message).join(', ');
      return res.status(400).json({
        success: false,
        error: messages,
        timestamp: Date.now(),
      });
    }
    next();
  };
}

export const swapQuoteSchema = Joi.object({
  poolId: Joi.number().integer().positive().required(),
  tokenIn: Joi.string().required(),
  amountIn: Joi.string().required(),
});

export const swapSchema = Joi.object({
  poolId: Joi.number().integer().positive().required(),
  tokenIn: Joi.string().required(),
  amountIn: Joi.string().required(),
  minAmountOut: Joi.string().required(),
});

export const addLiquiditySchema = Joi.object({
  poolId: Joi.number().integer().positive().required(),
  amountA: Joi.string().required(),
  amountB: Joi.string().required(),
  amountAMin: Joi.string().allow('0'),
  amountBMin: Joi.string().allow('0'),
});

export const removeLiquiditySchema = Joi.object({
  poolId: Joi.number().integer().positive().required(),
  lpAmount: Joi.string().required(),
  amountAMin: Joi.string().required(),
  amountBMin: Joi.string().required(),
});

export const depositSchema = Joi.object({
  marketToken: Joi.string().required(),
  amount: Joi.string().required(),
});

export const borrowSchema = Joi.object({
  marketToken: Joi.string().required(),
  amount: Joi.string().required(),
});

export const stakeSchema = Joi.object({
  poolId: Joi.number().integer().positive().required(),
  amount: Joi.string().required(),
});

export const createListingSchema = Joi.object({
  tokenAddress: Joi.string().required(),
  tokenId: Joi.number().integer().positive().required(),
  price: Joi.string().required(),
  paymentToken: Joi.string().required(),
});

export const createAuctionSchema = Joi.object({
  tokenAddress: Joi.string().required(),
  tokenId: Joi.number().integer().positive().required(),
  startPrice: Joi.string().required(),
  reservePrice: Joi.string().required(),
  duration: Joi.number().integer().positive().required(),
  paymentToken: Joi.string().required(),
});
