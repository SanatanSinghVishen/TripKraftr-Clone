import Property from '../models/Property.js';
import { generateSlug } from '../utils/slugify.js';

/**
 * POST /api/properties
 * Create a new property for the authenticated owner.
 * Enforces: free plan = max 1 property.
 */
export const createProperty = async (req, res) => {
  try {
    // Check if user already owns a property
    const existing = await Property.findOne({ ownerId: req.user._id });
    if (existing) {
      // Free plan: only 1 property allowed
      if (existing.plan === 'free') {
        return res.status(403).json({
          error: 'Free plan allows only 1 property. Upgrade to add more properties.',
          upgradeRequired: true,
        });
      }
      // TODO: For paid plan, allow multiple properties in future
      return res.status(403).json({
        error: 'You already have a property. Multi-property support coming soon.',
        upgradeRequired: true,
      });
    }

    const { name, contactNumber, whatsappNumber, state, region, address, email } = req.body;

    if (!name || !contactNumber || !state || !region) {
      return res.status(400).json({
        error: 'Name, contact number, state, and region are required',
      });
    }

    // Validate phone number (Indian 10-digit, optional +91 prefix)
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    const cleanContact = contactNumber.replace(/[\s-]/g, '');
    if (!phoneRegex.test(cleanContact)) {
      return res.status(400).json({
        error: 'Invalid contact number. Enter a valid Indian 10-digit mobile number.',
      });
    }

    const slug = await generateSlug(name, region);

    const property = await Property.create({
      ownerId: req.user._id,
      name,
      contactNumber: cleanContact,
      whatsappNumber: whatsappNumber ? whatsappNumber.replace(/[\s-]/g, '') : cleanContact,
      state,
      region,
      address: address || '',
      email: email || req.user.email,
      slug,
      plan: 'free',
      rooms: [],
    });

    res.status(201).json(property);
  } catch (err) {
    console.error('Create property error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/properties/me
 * Get the authenticated owner's property.
 */
export const getMyProperty = async (req, res) => {
  try {
    const property = await Property.findOne({ ownerId: req.user._id });
    if (!property) {
      return res.status(404).json({ error: 'No property found. Please create one.' });
    }
    res.json(property);
  } catch (err) {
    console.error('Get my property error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PATCH /api/properties/:id
 * Update property details (not rooms — use room routes for that).
 */
export const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    if (property.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your property' });
    }

    const allowedFields = [
      'name', 'contactNumber', 'whatsappNumber', 'state',
      'region', 'address', 'email',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        property[field] = req.body[field];
      }
    }

    // Regenerate slug if name or region changed
    if (req.body.name || req.body.region) {
      property.slug = await generateSlug(
        property.name,
        property.region
      );
    }

    // Clean phone numbers
    if (property.contactNumber) {
      property.contactNumber = property.contactNumber.replace(/[\s-]/g, '');
    }
    if (property.whatsappNumber) {
      property.whatsappNumber = property.whatsappNumber.replace(/[\s-]/g, '');
    }

    await property.save();
    res.json(property);
  } catch (err) {
    console.error('Update property error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
