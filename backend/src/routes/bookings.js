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

// All booking routes require HO authentication
router.use(authenticateHO);

// Property-scoped booking routes
router.post('/properties/:id/bookings', createBooking);
router.get('/properties/:id/bookings', listBookings);
router.get('/properties/:id/availability', getAvailability);

// Booking-specific routes
router.patch('/bookings/:id', updateBooking);
router.delete('/bookings/:id', cancelBooking);

export default router;
