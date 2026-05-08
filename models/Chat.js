import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const chatSchema = new mongoose.Schema({
  type: { type: String, enum: ['booking', 'enquiry'], required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['active', 'locked', 'expired'], default: 'active' },
  expiresAt: { type: Date },
  messages: [chatMessageSchema],
}, { timestamps: true });

export default mongoose.model('Chat', chatSchema);
