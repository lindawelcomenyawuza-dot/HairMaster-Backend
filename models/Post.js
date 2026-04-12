// models/Post.js
import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  type: String,
});

const CommentSchema = new mongoose.Schema({
  id: String,
  userId: String,
  userName: String,
  userAvatar: String,
  content: String,
  createdAt: { type: Date, default: Date.now },
});

const TaggedUserSchema = new mongoose.Schema({
  id: String,
  name: String,
});

const PostSchema = new mongoose.Schema(
  {
    userId: String,
    userName: String,
    userAvatar: String,
    accountType: String,

    image: String,
    images: [String],

    styleName: String,
    barberName: String,
    barberShop: String,

    location: String,

    price: Number,
    currency: { type: String, default: "USD" },

    rating: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    isLiked: { type: Boolean, default: false },
    isSaved: { type: Boolean, default: false },

    description: String,
    gender: {
      type: String,
      enum: ["male", "female", "unisex"],
    },

    products: [ProductSchema],
    hashtags: [String],
    taggedUsers: [TaggedUserSchema],

    comments: [CommentSchema],
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Post", PostSchema);