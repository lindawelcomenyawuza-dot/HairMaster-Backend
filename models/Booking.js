// models/Booking.js
import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      required: true,
    },

    businessId: {
      type: String,
      required: true,
    },

    postId: {
      type: String,
    },

    styleName: String,
    barberName: String,
    location: String,

    price: Number,
    currency: { type: String, default: "USD" },

    depositAmount: Number,
    depositPaid: { type: Boolean, default: false },

    date: Date,
    time: String,

    status: {
      type: String,
      enum: ["upcoming", "completed", "cancelled"],
      default: "upcoming",
    },

    paymentMethod: String,
    paymentStatus: String,
  },
  { timestamps: true }
);
export default mongoose.model("Booking", BookingSchema);