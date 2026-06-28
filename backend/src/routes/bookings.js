import { Router } from 'express';
import { authenticateHO } from '../middleware/auth.js';
import {
  createBooking,
  listBookings,
  updateBooking,
  cancelBooking,
  getAvailability,
} from '../controllers/bookingController.js';

const router = Router();

// Property-scoped booking routes
router.post('/properties/:id/bookings', authenticateHO, createBooking);
router.get('/properties/:id/bookings', authenticateHO, listBookings);
router.get('/properties/:id/availability', authenticateHO, getAvailability);

// Booking-specific routes
router.patch('/bookings/:id', authenticateHO, updateBooking);
router.delete('/bookings/:id', authenticateHO, cancelBooking);

export default router;
