// models/User.js
import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: false },
  startDate: Date,
  endDate: Date,
  isTrial: { type: Boolean, default: true },
  trialEndsAt: Date,
  monthlyFee: Number,
  currency: String,
  paymentHistory: [{ type: mongoose.Schema.Types.Mixed }],
});

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,

    accountType: {
      type: String,
      enum: ["personal", "business"],
      default: "personal",
    },

    avatar: String,
    bio: String,

    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },

    location: String,
    country: String,
    currency: String,

    businessName: String,

    isVerified: { type: Boolean, default: false },
    verificationBadge: {
      type: String,
      enum: ["verified", "business", "pro"],
    },

    subscription: SubscriptionSchema,

    staff: [{ type: mongoose.Schema.Types.Mixed }],
    documents: mongoose.Schema.Types.Mixed,

    savedPosts: [{ type: String }],

    referralCode: String,
    loyaltyPoints: { type: Number, default: 0 },

    darkMode: { type: Boolean, default: false },
    language: { type: String, default: "en" },

    posts: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    discountTokens: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);