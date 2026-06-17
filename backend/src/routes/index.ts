import { Router } from 'express';
import { swapRouter } from './swap';
import { poolRouter } from './pools';
import { lendingRouter } from './lending';
import { stakingRouter } from './staking';
import { nftRouter } from './nfts';
import { marketplaceRouter } from './marketplace';
import { launchpadRouter } from './launchpad';
import { portfolioRouter } from './portfolio';
import { infoRouter } from './info';

const router = Router();

router.use('/swap', swapRouter);
router.use('/pools', poolRouter);
router.use('/lending', lendingRouter);
router.use('/staking', stakingRouter);
router.use('/nfts', nftRouter);
router.use('/marketplace', marketplaceRouter);
router.use('/launchpad', launchpadRouter);
router.use('/portfolio', portfolioRouter);
router.use('/info', infoRouter);

export default router;
