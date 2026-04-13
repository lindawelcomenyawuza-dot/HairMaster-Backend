import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  styleName: { type: String, required: true },
  barberName: String,
  barberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: String,
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  depositAmount: Number,
  depositPaid: { type: Boolean, default: false },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming' },
  paymentMethod: { type: String, enum: ['online', 'offline'], default: 'online' },
  paymentStatus: { type: String, enum: ['pending', 'partial', 'completed'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);
