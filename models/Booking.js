import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  barberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  styleName: { type: String, required: true },
  barberName: String,
  location: String,
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  depositAmount: Number,
  depositPaid: { type: Boolean, default: false },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'upcoming'],
    default: 'pending',
  },
  paymentMethod: { type: String, enum: ['online', 'offline'], default: 'online' },
  paymentStatus: { type: String, enum: ['pending', 'partial', 'completed'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);
