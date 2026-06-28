import Property from '../models/Property.js';
import Booking from '../models/Booking.js';

/**
 * GET /api/public/:slug
 * Get property header details for the public availability page.
 * No auth required.
 */
export const getPropertyBySlug = async (req, res) => {
  try {
    const property = await Property.findOne({ slug: req.params.slug })
      .select('name contactNumber whatsappNumber state region slug rooms');

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Return only the info a guest needs
    res.json({
      name: property.name,
      contactNumber: property.contactNumber,
      whatsappNumber: property.whatsappNumber,
      state: property.state,
      region: property.region,
      slug: property.slug,
      roomTypes: property.rooms.map(r => ({
        id: r._id,
        name: r.name,
        pricePerNight: r.pricePerNight,
        mealPlan: r.mealPlan,
        totalRooms: r.totalRooms,
      })),
    });
  } catch (err) {
    console.error('Public property error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/public/:slug/availability
 * Check room availability for a date range.
 * Query params: checkin (date), nights (int), guests (int, optional), rooms (int, optional)
 * No auth required.
 */
export const checkAvailability = async (req, res) => {
  try {
    const property = await Property.findOne({ slug: req.params.slug });
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const { checkin, nights, rooms: roomsNeeded } = req.query;

    if (!checkin || !nights) {
      return res.status(400).json({
        error: 'checkin and nights query parameters are required',
      });
    }

    const checkinDate = new Date(checkin);
    const nightsCount = parseInt(nights, 10);
    const checkoutDate = new Date(checkinDate);
    checkoutDate.setDate(checkoutDate.getDate() + nightsCount);

    // Find overlapping active bookings
    const overlapping = await Booking.find({
      propertyId: property._id,
      status: 'active',
      checkinDate: { $lt: checkoutDate },
      checkoutDate: { $gt: checkinDate },
    });

    // Sum booked qty per room type
    const bookedMap = new Map();
    for (const booking of overlapping) {
      for (const roomLine of booking.rooms) {
        const key = roomLine.roomTypeId.toString();
        bookedMap.set(key, (bookedMap.get(key) || 0) + roomLine.qty);
      }
    }

    const roomsNeededInt = parseInt(roomsNeeded || '1', 10);

    const availability = property.rooms.map(room => {
      const booked = bookedMap.get(room._id.toString()) || 0;
      const freeCount = Math.max(0, room.totalRooms - booked);

      return {
        roomTypeId: room._id,
        name: room.name,
        pricePerNight: room.pricePerNight,
        mealPlan: room.mealPlan,
        totalRooms: room.totalRooms,
        freeCount,
        meetsNeeded: freeCount >= roomsNeededInt,
      };
    });

    res.json({
      propertyName: property.name,
      checkin: checkinDate.toISOString(),
      checkout: checkoutDate.toISOString(),
      nights: nightsCount,
      availability,
    });
  } catch (err) {
    console.error('Check availability error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/public/:slug/view
 * Increment the page view counter for a property.
 * No auth required. Fire-and-forget.
 */
export const logPageView = async (req, res) => {
  try {
    await Property.updateOne(
      { slug: req.params.slug },
      { $inc: { viewCount: 1 } }
    );
    res.status(204).end();
  } catch (err) {
    // Don't fail the response — this is fire-and-forget
    console.error('Page view log error:', err);
    res.status(204).end();
  }
};
