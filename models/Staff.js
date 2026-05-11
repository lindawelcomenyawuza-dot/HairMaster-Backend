import mongoose from 'mongoose';

const socialLinksSchema = new mongoose.Schema({
  instagram: String,
  tiktok: String,
  website: String,
}, { _id: false });

const staffSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fullName: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  bio: { type: String, default: '' },
  specialties: [{ type: String, trim: true }],
  profileImage: { type: String, default: '' },
  profileImageKey: String,
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  socialLinks: socialLinksSchema,
}, { timestamps: true });

staffSchema.index({ businessId: 1, fullName: 1 });

export default mongoose.model('Staff', staffSchema);
