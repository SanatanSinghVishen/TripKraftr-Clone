import { Router } from 'express';
import { authenticateHO } from '../middleware/auth.js';
import { getRevenueSummary } from '../controllers/revenueController.js';

const router = Router();

router.use(authenticateHO);

router.get('/properties/:id/revenue', getRevenueSummary);

export default router;
