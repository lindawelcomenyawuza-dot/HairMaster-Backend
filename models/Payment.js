import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  reference: { type: String, required: true, unique: true },
  amount:    { type: Number, required: true },
  currency:  { type: String, default: 'NGN' },
  status:    { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  paystackData: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
