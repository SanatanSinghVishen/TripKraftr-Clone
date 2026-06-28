import Booking from '../models/Booking.js';
import Property from '../models/Property.js';

/**
 * Compute free rooms per room type for a given date range.
 * Returns a Map of roomTypeId → bookedQty.
 */
async function getBookedCounts(propertyId, checkinDate, checkoutDate) {
  const overlapping = await Booking.find({
    propertyId,
    status: 'active',
    checkinDate: { $lt: checkoutDate },
    checkoutDate: { $gt: checkinDate },
  });

  const bookedMap = new Map();
  for (const booking of overlapping) {
    for (const roomLine of booking.rooms) {
      const key = roomLine.roomTypeId.toString();
      bookedMap.set(key, (bookedMap.get(key) || 0) + roomLine.qty);
    }
  }
  return bookedMap;
}

/**
 * POST /api/properties/:id/bookings
 * Block rooms — create a new booking.
 */
export const createBooking = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    if (property.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your property' });
    }

    const { guestName, contactNumber, checkinDate, nights, rooms, advancePaid, notes } = req.body;

    if (!guestName || !contactNumber || !checkinDate || !nights || !rooms || !rooms.length) {
      return res.status(400).json({
        error: 'Guest name, contact, check-in date, nights, and at least one room selection are required',
      });
    }

    // Compute checkout date server-side
    const checkin = new Date(checkinDate);
    const checkout = new Date(checkin);
    checkout.setDate(checkout.getDate() + parseInt(nights, 10));

    // Get current booked counts for the date range
    const bookedMap = await getBookedCounts(property._id, checkin, checkout);

    // Validate room selections and compute totals
    const bookingRooms = [];
    let totalAmount = 0;

    for (const selection of rooms) {
      const roomType = property.rooms.id(selection.roomTypeId);
      if (!roomType) {
        return res.status(400).json({
          error: `Room type ${selection.roomTypeId} not found on this property`,
        });
      }

      const booked = bookedMap.get(selection.roomTypeId.toString()) || 0;
      const freeCount = roomType.totalRooms - booked;

      if (selection.qty > freeCount) {
        return res.status(400).json({
          error: `Only ${freeCount} ${roomType.name} room(s) available for these dates. Requested: ${selection.qty}`,
        });
      }

      const lineTotal = selection.qty * roomType.pricePerNight * parseInt(nights, 10);
      totalAmount += lineTotal;

      bookingRooms.push({
        roomTypeId: selection.roomTypeId,
        qty: selection.qty,
        pricePerNightSnapshot: roomType.pricePerNight,
      });
    }

    const booking = await Booking.create({
      propertyId: property._id,
      guestName,
      contactNumber: contactNumber.replace(/[\s-]/g, ''),
      checkinDate: checkin,
      nights: parseInt(nights, 10),
      checkoutDate: checkout,
      status: 'active',
      rooms: bookingRooms,
      totalAmount,
      advancePaid: parseInt(advancePaid || '0', 10),
      notes: notes || '',
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/properties/:id/bookings
 * List bookings for a property. Supports ?status=active filter.
 */
export const listBookings = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    if (property.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your property' });
    }

    const filter = { propertyId: property._id };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const bookings = await Booking.find(filter).sort({ checkinDate: 1 });
    res.json(bookings);
  } catch (err) {
    console.error('List bookings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PATCH /api/bookings/:id
 * Update a booking (advance paid, notes, mark paid).
 */
export const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify ownership
    const property = await Property.findById(booking.propertyId);
    if (!property || property.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { advancePaid, notes, markPaid } = req.body;

    if (markPaid) {
      booking.advancePaid = booking.totalAmount;
    } else if (advancePaid !== undefined) {
      booking.advancePaid = parseInt(advancePaid, 10);
    }

    if (notes !== undefined) {
      booking.notes = notes;
    }

    await booking.save();
    res.json(booking);
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/bookings/:id
 * Cancel a booking (set status to cancelled).
 */
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const property = await Property.findById(booking.propertyId);
    if (!property || property.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ message: 'Booking cancelled', booking });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/properties/:id/availability
 * Get free room counts for each room type for a date range.
 * Used internally by the owner dashboard.
 */
export const getAvailability = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const { checkin, nights } = req.query;
    if (!checkin || !nights) {
      // Return total rooms if no date range specified
      const availability = property.rooms.map(room => ({
        roomTypeId: room._id,
        name: room.name,
        totalRooms: room.totalRooms,
        freeCount: room.totalRooms,
        pricePerNight: room.pricePerNight,
        mealPlan: room.mealPlan,
      }));
      return res.json(availability);
    }

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkinDate);
    checkoutDate.setDate(checkoutDate.getDate() + parseInt(nights, 10));

    const bookedMap = await getBookedCounts(property._id, checkinDate, checkoutDate);

    const availability = property.rooms.map(room => {
      const booked = bookedMap.get(room._id.toString()) || 0;
      return {
        roomTypeId: room._id,
        name: room.name,
        totalRooms: room.totalRooms,
        freeCount: Math.max(0, room.totalRooms - booked),
        pricePerNight: room.pricePerNight,
        mealPlan: room.mealPlan,
      };
    });

    res.json(availability);
  } catch (err) {
    console.error('Get availability error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
