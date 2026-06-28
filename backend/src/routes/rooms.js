import { Router } from 'express';
import { authenticateHO } from '../middleware/auth.js';
import {
  addRoomType,
  updateRoomType,
  deleteRoomType,
  listRoomTypes,
} from '../controllers/roomController.js';

const router = Router();

// All room routes require HO authentication
router.use(authenticateHO);

// Routes scoped to a property
router.post('/properties/:id/rooms', addRoomType);
router.get('/properties/:id/rooms', listRoomTypes);

// Routes scoped to a specific room type
router.patch('/rooms/:id', updateRoomType);
router.delete('/rooms/:id', deleteRoomType);

export default router;
