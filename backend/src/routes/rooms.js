import { Router } from 'express';
import { authenticateHO } from '../middleware/auth.js';
import {
  addRoomType,
  updateRoomType,
  deleteRoomType,
  listRoomTypes,
} from '../controllers/roomController.js';

const router = Router();

// Routes scoped to a property
router.post('/properties/:id/rooms', authenticateHO, addRoomType);
router.get('/properties/:id/rooms', authenticateHO, listRoomTypes);

// Routes scoped to a specific room type
router.patch('/rooms/:id', authenticateHO, updateRoomType);
router.delete('/rooms/:id', authenticateHO, deleteRoomType);

export default router;
