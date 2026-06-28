import { Router } from 'express';
import { authenticateAdmin } from '../middleware/auth.js';
import {
  getOverview,
  listAllProperties,
  getPropertyAnalytics,
  updatePlan,
} from '../controllers/adminController.js';

const router = Router();

// All admin routes require admin authentication
router.use(authenticateAdmin);

router.get('/overview', getOverview);
router.get('/properties', listAllProperties);
router.get('/properties/:id/analytics', getPropertyAnalytics);
router.patch('/properties/:id/plan', updatePlan);

export default router;
