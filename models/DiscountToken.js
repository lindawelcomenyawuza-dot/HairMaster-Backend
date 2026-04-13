import mongoose from 'mongoose';

const discountTokenSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code:      { type: String, required: true, unique: true },
  discount:  { type: Number, required: true },
  pointCost: { type: Number, required: true },
  used:      { type: Boolean, default: false },
  usedAt:    { type: Date },
  expiresAt: { type: Date, required: true },
  earnedAt:  { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('DiscountToken', discountTokenSchema);
