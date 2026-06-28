import { Router } from 'express';
import {
  getPropertyBySlug,
  checkAvailability,
  logPageView,
} from '../controllers/publicController.js';

const router = Router();

// No auth — fully public endpoints
router.get('/:slug', getPropertyBySlug);
router.get('/:slug/availability', checkAvailability);
router.post('/:slug/view', logPageView);

export default router;
