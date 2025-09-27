import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  active: {
    type: Boolean,
    default: false
  },
  isEnabled: {
    type: Boolean,
    default: false
  }
});

export const Service = mongoose.model('Service', serviceSchema);
