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
  subscriptionStatus: { type: String, enum: ['inactive', 'active', 'past_due', 'cancelled'], default: 'inactive' },
  subscriptionPlan: String,
  activatedAt: Date,
  expiresAt: Date,
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
  phone: { type: String, default: '' },
  password: { type: String, required: true },
  accountType: { type: String, enum: ['personal', 'business'], default: 'personal' },
  avatar: { type: String, default: '' },
  avatarKey: String,
  bio: { type: String, default: '' },
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  location: String,
  country: String,
  currency: { type: String, default: 'USD' },
  businessName: String,
  isVerified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationTokenExpires: Date,
  emailVerificationTokenHash: String,
  emailVerificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  passwordResetTokenHash: String,
  passwordResetExpires: Date,
  passwordResetUsedAt: Date,
  consentAccepted: { type: Boolean, default: false },
  consentTimestamp: Date,
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
  authProvider: { type: String, enum: ['email', 'google'], default: 'email' },
  googleId: { type: String, sparse: true },
}, { timestamps: true });

userSchema.index({ accountType: 1, businessName: 1, location: 1 });
userSchema.index({ businessName: 'text', name: 'text', location: 'text' });
userSchema.index({ verificationToken: 1 });
userSchema.index({ emailVerificationTokenHash: 1 });
userSchema.index({ resetPasswordToken: 1 });

export default mongoose.model('User', userSchema);
