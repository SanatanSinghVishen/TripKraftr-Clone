import Property from '../models/Property.js';

/**
 * GET /api/admin/overview
 * Super admin overview: total homestays, paid vs free counts.
 */
export const getOverview = async (req, res) => {
  try {
    const totalProperties = await Property.countDocuments();
    const paidProperties = await Property.countDocuments({ plan: 'paid' });
    const freeProperties = totalProperties - paidProperties;

    res.json({
      totalHomestays: totalProperties,
      paidPlan: paidProperties,
      freePlan: freeProperties,
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/admin/properties
 * List all properties with plan/expiry/room count/view count.
 */
export const listAllProperties = async (req, res) => {
  try {
    const properties = await Property.find()
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 });

    const result = properties.map(p => ({
      _id: p._id,
      name: p.name,
      region: p.region,
      state: p.state,
      slug: p.slug,
      ownerName: p.ownerId?.name || 'Unknown',
      ownerEmail: p.ownerId?.email || 'Unknown',
      plan: p.plan,
      subscriptionExpiry: p.subscriptionExpiry,
      roomCount: p.rooms.reduce((sum, r) => sum + r.totalRooms, 0),
      roomTypeCount: p.rooms.length,
      viewCount: p.viewCount,
      createdAt: p.createdAt,
    }));

    res.json(result);
  } catch (err) {
    console.error('Admin list properties error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/admin/properties/:id/analytics
 * Get page view count for a specific property.
 */
export const getPropertyAnalytics = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).select('name slug viewCount');
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json({
      name: property.name,
      slug: property.slug,
      viewCount: property.viewCount,
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PATCH /api/admin/properties/:id/plan
 * Manually set a property's plan and subscription expiry.
 * Stand-in for a payment webhook.
 */
export const updatePlan = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const { plan, subscriptionExpiry } = req.body;

    if (plan) {
      property.plan = plan;
    }
    if (subscriptionExpiry !== undefined) {
      property.subscriptionExpiry = subscriptionExpiry ? new Date(subscriptionExpiry) : null;
    }

    await property.save();
    res.json({ message: 'Plan updated', property });
  } catch (err) {
    console.error('Admin update plan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
