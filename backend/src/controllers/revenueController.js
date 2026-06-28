import Booking from '../models/Booking.js';
import Property from '../models/Property.js';

/**
 * GET /api/properties/:id/revenue
 * Revenue summary for a property.
 * Aggregates: total booked, collected, outstanding, active booking count.
 */
export const getRevenueSummary = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    if (property.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your property' });
    }

    // Get all active bookings (not yet checked out)
    const now = new Date();
    const activeBookings = await Booking.find({
      propertyId: property._id,
      status: 'active',
      checkoutDate: { $gte: now },
    });

    const totalBooked = activeBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const collected = activeBookings.reduce((sum, b) => sum + b.advancePaid, 0);
    const outstanding = totalBooked - collected;

    res.json({
      totalBooked,
      collected,
      outstanding,
      activeBookings: activeBookings.length,
    });
  } catch (err) {
    console.error('Revenue summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
