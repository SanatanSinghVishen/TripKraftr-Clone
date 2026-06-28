import { Router } from 'express';
import { authenticateHO } from '../middleware/auth.js';
import {
  createProperty,
  getMyProperty,
  updateProperty,
} from '../controllers/propertyController.js';

const router = Router();

// All property routes require HO authentication
router.use(authenticateHO);

router.post('/', createProperty);
router.get('/me', getMyProperty);
router.patch('/:id', updateProperty);

export default router;
