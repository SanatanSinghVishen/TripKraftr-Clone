import { Router } from 'express';
import { authenticateHO } from '../middleware/auth.js';
import { getRevenueSummary } from '../controllers/revenueController.js';

const router = Router();

router.get('/properties/:id/revenue', authenticateHO, getRevenueSummary);

export default router;
