import { useState } from 'react';
import { properties, rooms } from '../../lib/api.js';
import UpgradeModal from '../../components/UpgradeModal.jsx';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const MEAL_PLANS = [
  { value: 'only_room', label: 'Only Room' },
  { value: 'breakfast', label: 'Breakfast Included' },
  { value: 'breakfast_dinner', label: 'Breakfast and Dinner' },
  { value: 'all_meals', label: 'All Meals' },
];

export default function SetupTab({ property, onPropertySaved }) {
  const isNew = !property;

  // Property form state
  const [propertyForm, setPropertyForm] = useState({
    name: property?.name || '',
    contactNumber: property?.contactNumber || '',
    whatsappNumber: property?.whatsappNumber || '',
    state: property?.state || '',
    region: property?.region || '',
    address: property?.address || '',
    email: property?.email || '',
    sameAsContact: property ? property.contactNumber === property.whatsappNumber : true,
  });

  // Room type form state
  const [roomForm, setRoomForm] = useState({
    name: '',
    totalRooms: '',
    pricePerNight: '',
    mealPlan: 'only_room',
  });
  const [editingRoomId, setEditingRoomId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [savingRoom, setSavingRoom] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  // ── Property Form Handlers ──

  function updateField(field, value) {
    setPropertyForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'sameAsContact' && value) {
        updated.whatsappNumber = updated.contactNumber;
      }
      if (field === 'contactNumber' && prev.sameAsContact) {
        updated.whatsappNumber = value;
      }
      return updated;
    });
  }

  async function handleSaveProperty(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name: propertyForm.name,
        contactNumber: propertyForm.contactNumber,
        whatsappNumber: propertyForm.sameAsContact
          ? propertyForm.contactNumber
          : propertyForm.whatsappNumber,
        state: propertyForm.state,
        region: propertyForm.region,
        address: propertyForm.address,
        email: propertyForm.email,
      };

      if (isNew) {
        await properties.create(payload);
      } else {
        await properties.update(property._id, payload);
      }

      setSuccess(isNew ? 'Property created successfully!' : 'Property updated successfully!');
      onPropertySaved();
    } catch (err) {
      if (err.data?.upgradeRequired) {
        setUpgradeMessage(err.data.error || err.message);
        setShowUpgrade(true);
      } else {
        setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Room Type Handlers ──

  function startEditRoom(room) {
    setEditingRoomId(room._id);
    setRoomForm({
      name: room.name,
      totalRooms: room.totalRooms.toString(),
      pricePerNight: (room.pricePerNight / 100).toString(),
      mealPlan: room.mealPlan,
    });
  }

  function cancelEditRoom() {
    setEditingRoomId(null);
    setRoomForm({ name: '', totalRooms: '', pricePerNight: '', mealPlan: 'only_room' });
  }

  async function handleSaveRoom(e) {
    e.preventDefault();
    setSavingRoom(true);
    setError(null);

    try {
      const payload = {
        name: roomForm.name,
        totalRooms: parseInt(roomForm.totalRooms, 10),
        pricePerNight: Math.round(parseFloat(roomForm.pricePerNight) * 100), // Convert ₹ to paise
        mealPlan: roomForm.mealPlan,
      };

      if (editingRoomId) {
        await rooms.update(editingRoomId, payload);
      } else {
        await rooms.add(property._id, payload);
      }

      cancelEditRoom();
      onPropertySaved();
    } catch (err) {
      if (err.data?.upgradeRequired) {
        setUpgradeMessage(err.data.error || err.message);
        setShowUpgrade(true);
      } else {
        setError(err.message);
      }
    } finally {
      setSavingRoom(false);
    }
  }

  async function handleDeleteRoom(roomId) {
    if (!confirm('Delete this room type? This cannot be undone.')) return;

    try {
      await rooms.remove(roomId);
      onPropertySaved();
    } catch (err) {
      setError(err.message);
    }
  }

  const totalRooms = property?.rooms?.reduce((sum, r) => sum + r.totalRooms, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Error / Success Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 slide-up">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 slide-up">
          {success}
        </div>
      )}

      {/* ── Section 1: Property Setup ── */}
      <div className="card slide-up" id="property-setup-form">
        <h2 className="text-lg font-bold text-[var(--color-heading)] mb-4">
          {isNew ? '🏠 Create Your Property' : '🏠 Property Details'}
        </h2>

        <form onSubmit={handleSaveProperty} className="space-y-4">
          <div>
            <label className="label" htmlFor="prop-name">Property Name</label>
            <input
              id="prop-name"
              className="input"
              type="text"
              placeholder="Sunrise Homestay"
              value={propertyForm.name}
              onChange={e => updateField('name', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="prop-contact">Contact Number</label>
              <input
                id="prop-contact"
                className="input"
                type="tel"
                placeholder="+91 98xxxxxxxx"
                value={propertyForm.contactNumber}
                onChange={e => updateField('contactNumber', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="prop-whatsapp">WhatsApp Number</label>
              <div className="flex items-center gap-2 mb-1.5">
                <input
                  type="checkbox"
                  id="same-as-contact"
                  checked={propertyForm.sameAsContact}
                  onChange={e => updateField('sameAsContact', e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="same-as-contact" className="text-xs text-[var(--color-muted)] cursor-pointer">
                  Same as contact
                </label>
              </div>
              <input
                id="prop-whatsapp"
                className="input"
                type="tel"
                placeholder="+91 98xxxxxxxx"
                value={propertyForm.sameAsContact ? propertyForm.contactNumber : propertyForm.whatsappNumber}
                onChange={e => updateField('whatsappNumber', e.target.value)}
                disabled={propertyForm.sameAsContact}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="prop-state">State</label>
              <select
                id="prop-state"
                className="input"
                value={propertyForm.state}
                onChange={e => updateField('state', e.target.value)}
                required
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="prop-region">Region</label>
              <input
                id="prop-region"
                className="input"
                type="text"
                placeholder="Coorg"
                value={propertyForm.region}
                onChange={e => updateField('region', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="prop-address">Address</label>
            <textarea
              id="prop-address"
              className="input min-h-[80px] resize-y"
              placeholder="Full address of your property"
              value={propertyForm.address}
              onChange={e => updateField('address', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="label" htmlFor="prop-email">Email ID</label>
            <input
              id="prop-email"
              className="input"
              type="email"
              placeholder="host@example.com"
              value={propertyForm.email}
              onChange={e => updateField('email', e.target.value)}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              id="save-property-btn"
            >
              {saving ? 'Saving...' : (isNew ? 'Create Property' : 'Save Changes')}
            </button>
          </div>
        </form>
      </div>

      {/* ── Section 2: Room Types ── */}
      {property && (
        <div className="card slide-up" id="room-types-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[var(--color-heading)]">
              🛏️ Room Types
            </h2>
            <span className="text-xs text-[var(--color-muted)]">
              {totalRooms} / 4 rooms used (Free plan)
            </span>
          </div>

          {/* Existing room types */}
          {property.rooms && property.rooms.length > 0 && (
            <div className="space-y-3 mb-5">
              {property.rooms.map(room => (
                <div
                  key={room._id}
                  className="flex items-center justify-between bg-[var(--color-cream)] rounded-lg px-4 py-3 border border-[var(--color-border)]"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-[var(--color-heading)]">
                      {room.name}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--color-body)]">
                      <span>{room.totalRooms} room{room.totalRooms > 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>₹{(room.pricePerNight / 100).toLocaleString('en-IN')}/night</span>
                      <span>·</span>
                      <span>{MEAL_PLANS.find(m => m.value === room.mealPlan)?.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEditRoom(room)}
                      className="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] text-xs font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room._id)}
                      className="text-[var(--color-danger)] hover:opacity-70 text-xs font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add / Edit room form */}
          <form onSubmit={handleSaveRoom} className="space-y-3 pt-3 border-t border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-body)]">
              {editingRoomId ? 'Edit Room Type' : '+ Add Room Type'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="room-name">Room Name</label>
                <input
                  id="room-name"
                  className="input"
                  type="text"
                  placeholder="Deluxe Room"
                  value={roomForm.name}
                  onChange={e => setRoomForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="room-count">No. of Rooms</label>
                <input
                  id="room-count"
                  className="input"
                  type="number"
                  min="1"
                  placeholder="2"
                  value={roomForm.totalRooms}
                  onChange={e => setRoomForm(prev => ({ ...prev, totalRooms: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="room-price">Price Per Night (₹)</label>
                <input
                  id="room-price"
                  className="input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="2500"
                  value={roomForm.pricePerNight}
                  onChange={e => setRoomForm(prev => ({ ...prev, pricePerNight: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="room-meal">Meal Plan</label>
                <select
                  id="room-meal"
                  className="input"
                  value={roomForm.mealPlan}
                  onChange={e => setRoomForm(prev => ({ ...prev, mealPlan: e.target.value }))}
                >
                  {MEAL_PLANS.map(mp => (
                    <option key={mp.value} value={mp.value}>{mp.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="btn btn-success text-sm"
                disabled={savingRoom}
                id="save-room-btn"
              >
                {savingRoom ? 'Saving...' : (editingRoomId ? 'Update Room' : 'Add Room')}
              </button>
              {editingRoomId && (
                <button
                  type="button"
                  onClick={cancelEditRoom}
                  className="btn btn-outline text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        message={upgradeMessage}
      />
    </div>
  );
}
