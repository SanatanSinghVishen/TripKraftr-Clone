import mongoose from 'mongoose';

const bookingRoomSchema = new mongoose.Schema({
  roomTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  qty: {
    type: Number,
    required: true,
    min: 1,
  },
  pricePerNightSnapshot: {
    type: Number,
    required: true,
    min: 0,
    // Price locked in at booking time (in paise), so later price edits don't change past bookings
  },
});

const bookingSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  guestName: {
    type: String,
    required: true,
    trim: true,
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true,
  },
  checkinDate: {
    type: Date,
    required: true,
  },
  nights: {
    type: Number,
    required: true,
    min: 1,
  },
  checkoutDate: {
    type: Date,
    required: true,
    // Always derived server-side: checkinDate + nights
  },
  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active',
  },
  rooms: [bookingRoomSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
    // Stored in paise
  },
  advancePaid: {
    type: Number,
    default: 0,
    min: 0,
    // Stored in paise
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for availability overlap queries
bookingSchema.index({ propertyId: 1, checkinDate: 1 });

// Virtual: balanceDue — never stored, always computed
bookingSchema.virtual('balanceDue').get(function () {
  return Math.max(0, this.totalAmount - this.advancePaid);
});

// Ensure virtuals are included in JSON output
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
