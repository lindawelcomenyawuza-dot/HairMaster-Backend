import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  name: String,
  role: String,
  email: String,
  phone: String,
  avatar: String,
  specialties: [String],
});

const paymentRecordSchema = new mongoose.Schema({
  amount: Number,
  currency: String,
  date: Date,
  status: { type: String, enum: ['completed', 'pending', 'failed'] },
  type: { type: String, enum: ['subscription', 'booking'] },
});

const subscriptionSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: false },
  startDate: Date,
  endDate: Date,
  isTrial: { type: Boolean, default: false },
  trialEndsAt: Date,
  monthlyFee: Number,
  currency: String,
  paymentHistory: [paymentRecordSchema],
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  accountType: { type: String, enum: ['personal', 'business'], default: 'personal' },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  location: String,
  country: String,
  currency: { type: String, default: 'USD' },
  businessName: String,
  isVerified: { type: Boolean, default: false },
  verificationBadge: { type: String, enum: ['verified', 'business', 'pro', null] },
  subscription: subscriptionSchema,
  staff: [staffSchema],
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  followingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  referralCode: String,
  loyaltyPoints: { type: Number, default: 0 },
  discountTokens: { type: Number, default: 0 },
  darkMode: { type: Boolean, default: false },
  language: { type: String, default: 'en' },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
