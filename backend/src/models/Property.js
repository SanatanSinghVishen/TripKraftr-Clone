import mongoose from 'mongoose';

const roomTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  totalRooms: {
    type: Number,
    required: true,
    min: 1,
  },
  pricePerNight: {
    type: Number,
    required: true,
    min: 0,
    // Stored in paise (integer), never as float
  },
  mealPlan: {
    type: String,
    enum: ['only_room', 'breakfast', 'breakfast_dinner', 'all_meals'],
    default: 'only_room',
  },
  maxOccupancy: {
    type: Number,
    default: 2,
    min: 1,
  }
});

const propertySchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true,
  },
  whatsappNumber: {
    type: String,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  region: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
  },
  plan: {
    type: String,
    enum: ['free', 'paid'],
    default: 'free',
  },
  subscriptionExpiry: {
    type: Date,
    default: null,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  rooms: [roomTypeSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Property = mongoose.model('Property', propertySchema);
export default Property;
