import Property from '../models/Property.js';

/**
 * Generate a URL-safe slug from property name and region.
 * If a collision exists, appends a numeric suffix (e.g. -2, -3).
 *
 * @param {string} name - Property name
 * @param {string} region - Region name
 * @returns {Promise<string>} unique slug
 */
export async function generateSlug(name, region) {
  const base = `${name}-${region}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')  // remove special chars
    .replace(/\s+/g, '-')           // spaces → hyphens
    .replace(/-+/g, '-')            // collapse multiple hyphens
    .replace(/^-|-$/g, '');          // trim leading/trailing hyphens

  let slug = base;
  let suffix = 1;

  while (await Property.findOne({ slug })) {
    suffix++;
    slug = `${base}-${suffix}`;
  }

  return slug;
}
