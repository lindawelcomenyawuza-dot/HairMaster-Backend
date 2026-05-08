import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  city: String,
  country: String,
  phone: String,
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  barbers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const businessSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  locations: [locationSchema],
  staff: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['owner', 'manager', 'barber'] },
    locationId: mongoose.Schema.Types.ObjectId,
  }],
}, { timestamps: true });

export const Location = mongoose.model('Location', locationSchema);
export default mongoose.model('Business', businessSchema);
