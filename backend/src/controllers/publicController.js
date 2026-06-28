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
      .select('name contactNumber whatsappNumber state region address slug rooms');

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
      address: property.address,
      slug: property.slug,
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

    const { checkin, nights, guests, rooms: roomsNeeded } = req.query;

    if (!checkin) {
      return res.status(400).json({ error: 'checkin date is required' });
    }

    const checkinDate = new Date(checkin);
    if (isNaN(checkinDate.getTime())) {
      return res.status(400).json({ error: 'Invalid checkin date' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkinDate < today) {
      return res.status(400).json({ error: "Check-in date can't be in the past." });
    }

    const nightsCount = Math.max(1, parseInt(nights, 10) || 1);
    const guestsCount = Math.max(1, parseInt(guests, 10) || 2);
    const roomsCount = Math.max(1, parseInt(roomsNeeded, 10) || 1);
    
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

    const roomTypes = property.rooms.map(room => {
      const booked = bookedMap.get(room._id.toString()) || 0;
      const freeCount = Math.max(0, room.totalRooms - booked);
      const meetsRoomsNeeded = freeCount >= roomsCount;
      const meetsOccupancy = room.maxOccupancy ? (room.maxOccupancy * roomsCount >= guestsCount) : true;

      return {
        id: room._id,
        name: room.name,
        pricePerNight: Math.floor(room.pricePerNight / 100),
        mealPlan: room.mealPlan,
        totalRooms: room.totalRooms,
        freeCount,
        meetsRoomsNeeded,
        meetsOccupancy,
      };
    });

    res.json({
      checkinDate: checkinDate.toISOString(),
      checkoutDate: checkoutDate.toISOString(),
      roomTypes,
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
