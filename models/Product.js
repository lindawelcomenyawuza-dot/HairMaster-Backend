import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  images: [String],
  description: String,
  category: String,
  deliveryAvailable: { type: Boolean, default: false },
  deliveryFee: Number,
  deliveryAreas: [String],
  inStock: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
