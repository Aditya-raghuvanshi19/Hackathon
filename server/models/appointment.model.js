import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  repairRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repair',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledDateTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'rescheduled', 'canceled', 'completed'],
    default: 'scheduled'
  },
  notes: {
    type: String
  }
});

export const Appointment = mongoose.model('Appointment', appointmentSchema);
