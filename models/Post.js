import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: String,
  userAvatar: String,
  content: { type: String, required: true },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reports: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    createdAt: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['verified', 'portfolio', 'repost'],
    default: 'portfolio',
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  barberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  salonId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  stylistId: String,
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  originalPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  userName: String,
  userAvatar: String,
  userAvatarKey: String,
  accountType: { type: String, enum: ['personal', 'business'] },
  image: { type: String, required: true },
  imageKey: String,
  images: [String],
  imageKeys: [String],
  styleName: { type: String, required: true },
  barberName: String,
  barberShop: String,
  salonName: String,
  stylistName: String,
  stylistAvatar: String,
  salonLogo: String,
  location: String,
  price: { type: Number, default: 0 },
  currency: { type: String, default: 'ZAR' },
  isService: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  description: String,
  gender: { type: String, enum: ['male', 'female', 'unisex'] },
  hashtags: [String],
  taggedUsers: [{ userId: String, name: String }],
  comments: [commentSchema],
  sharesCount: { type: Number, default: 0 },
  isSponsored: { type: Boolean, default: false },
}, { timestamps: true });

postSchema.index({ salonId: 1, stylistId: 1, createdAt: -1 });
postSchema.index({ salonName: 'text', barberShop: 'text', stylistName: 'text', barberName: 'text', styleName: 'text', description: 'text' });

export default mongoose.model('Post', postSchema);
