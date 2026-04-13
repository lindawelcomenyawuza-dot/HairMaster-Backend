import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  type: String,
});

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: String,
  userAvatar: String,
  content: { type: String, required: true },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: String,
  userAvatar: String,
  accountType: { type: String, enum: ['personal', 'business'] },
  image: { type: String, required: true },
  images: [String],
  video: String,
  styleName: { type: String, required: true },
  barberName: String,
  barberShop: String,
  location: String,
  price: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  rating: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  description: String,
  gender: { type: String, enum: ['male', 'female', 'unisex'] },
  products: [productSchema],
  hashtags: [String],
  taggedUsers: [{ userId: String, name: String }],
  comments: [commentSchema],
  sharesCount: { type: Number, default: 0 },
  isSponsored: { type: Boolean, default: false },
  isStory: { type: Boolean, default: false },
  storyExpiresAt: Date,
}, { timestamps: true });

export default mongoose.model('Post', postSchema);
