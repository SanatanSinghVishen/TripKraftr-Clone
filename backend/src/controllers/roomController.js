import Property from '../models/Property.js';

const FREE_PLAN_ROOM_LIMIT = parseInt(process.env.FREE_PLAN_ROOM_LIMIT || '4', 10);

/**
 * POST /api/properties/:id/rooms
 * Add a new room type to the property.
 * Enforces free plan room limit.
 */
export const addRoomType = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    if (property.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your property' });
    }

    const { name, totalRooms, pricePerNight, mealPlan } = req.body;

    if (!name || !totalRooms || pricePerNight === undefined) {
      return res.status(400).json({
        error: 'Room name, total rooms, and price per night are required',
      });
    }

    // Calculate current total rooms
    const currentTotalRooms = property.rooms.reduce(
      (sum, r) => sum + r.totalRooms, 0
    );

    // Enforce free plan room limit
    if (property.plan === 'free' && currentTotalRooms + totalRooms > FREE_PLAN_ROOM_LIMIT) {
      return res.status(403).json({
        error: `Free plan allows up to ${FREE_PLAN_ROOM_LIMIT} rooms total. You have ${currentTotalRooms} rooms. Upgrade to add more.`,
        upgradeRequired: true,
        currentRooms: currentTotalRooms,
        limit: FREE_PLAN_ROOM_LIMIT,
      });
    }

    property.rooms.push({
      name,
      totalRooms: parseInt(totalRooms, 10),
      pricePerNight: parseInt(pricePerNight, 10), // stored in paise
      mealPlan: mealPlan || 'only_room',
    });

    await property.save();
    res.status(201).json(property);
  } catch (err) {
    console.error('Add room type error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PATCH /api/rooms/:id
 * Update a room type (finds it across all properties owned by user).
 */
export const updateRoomType = async (req, res) => {
  try {
    const roomId = req.params.id;
    const property = await Property.findOne({
      ownerId: req.user._id,
      'rooms._id': roomId,
    });

    if (!property) {
      return res.status(404).json({ error: 'Room type not found' });
    }

    const room = property.rooms.id(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room type not found' });
    }

    const { name, totalRooms, pricePerNight, mealPlan } = req.body;

    // If totalRooms is changing, check free plan limit
    if (totalRooms !== undefined && totalRooms !== room.totalRooms) {
      const otherRoomsTotals = property.rooms
        .filter(r => r._id.toString() !== roomId)
        .reduce((sum, r) => sum + r.totalRooms, 0);

      if (property.plan === 'free' && otherRoomsTotals + totalRooms > FREE_PLAN_ROOM_LIMIT) {
        return res.status(403).json({
          error: `Free plan allows up to ${FREE_PLAN_ROOM_LIMIT} rooms total. Upgrade to add more.`,
          upgradeRequired: true,
        });
      }
    }

    if (name !== undefined) room.name = name;
    if (totalRooms !== undefined) room.totalRooms = parseInt(totalRooms, 10);
    if (pricePerNight !== undefined) room.pricePerNight = parseInt(pricePerNight, 10);
    if (mealPlan !== undefined) room.mealPlan = mealPlan;

    await property.save();
    res.json(property);
  } catch (err) {
    console.error('Update room type error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/rooms/:id
 * Delete a room type.
 */
export const deleteRoomType = async (req, res) => {
  try {
    const roomId = req.params.id;
    const property = await Property.findOne({
      ownerId: req.user._id,
      'rooms._id': roomId,
    });

    if (!property) {
      return res.status(404).json({ error: 'Room type not found' });
    }

    property.rooms.pull({ _id: roomId });
    await property.save();

    res.json(property);
  } catch (err) {
    console.error('Delete room type error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/properties/:id/rooms
 * List all room types for a property.
 */
export const listRoomTypes = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    if (property.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your property' });
    }
    res.json(property.rooms);
  } catch (err) {
    console.error('List room types error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
