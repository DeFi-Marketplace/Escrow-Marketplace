import { Router, Request, Response } from 'express';
import { validate, createListingSchema, createAuctionSchema } from '../middleware/validation';
import { contractService } from '../services/contractService';
import { optionalAuth } from '../middleware/auth';

export const marketplaceRouter = Router();

marketplaceRouter.get('/listings', async (req: Request, res: Response) => {
  try {
    const { listingId } = req.query;
    if (listingId) {
      const listing = await contractService.getListing(parseInt(listingId as string));
      res.json({ success: true, data: listing, timestamp: Date.now() });
    } else {
      res.json({ success: true, data: [], timestamp: Date.now() });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch listings', timestamp: Date.now() });
  }
});

marketplaceRouter.post('/list', optionalAuth, validate(createListingSchema), async (req: Request, res: Response) => {
  try {
    const { tokenAddress, tokenId, price } = req.body;
    res.json({
      success: true,
      data: { tokenAddress, tokenId, price, status: 'simulated' },
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Listing failed', timestamp: Date.now() });
  }
});

marketplaceRouter.post('/buy', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { listingId } = req.body;
    res.json({ success: true, data: { listingId, status: 'simulated' }, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Purchase failed', timestamp: Date.now() });
  }
});

marketplaceRouter.post('/cancel-listing', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { listingId } = req.body;
    res.json({ success: true, data: { listingId, status: 'simulated' }, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Cancel failed', timestamp: Date.now() });
  }
});

marketplaceRouter.get('/auctions', async (req: Request, res: Response) => {
  try {
    const { auctionId } = req.query;
    if (auctionId) {
      const auction = await contractService.getAuction(parseInt(auctionId as string));
      res.json({ success: true, data: auction, timestamp: Date.now() });
    } else {
      res.json({ success: true, data: [], timestamp: Date.now() });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch auctions', timestamp: Date.now() });
  }
});

marketplaceRouter.post('/create-auction', optionalAuth, validate(createAuctionSchema), async (req: Request, res: Response) => {
  try {
    const { tokenAddress, tokenId, startPrice, reservePrice, duration } = req.body;
    res.json({
      success: true,
      data: { tokenAddress, tokenId, startPrice, reservePrice, duration, status: 'simulated' },
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Auction creation failed', timestamp: Date.now() });
  }
});

marketplaceRouter.post('/place-bid', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { auctionId, amount } = req.body;
    res.json({ success: true, data: { auctionId, amount, status: 'simulated' }, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Bid failed', timestamp: Date.now() });
  }
});
