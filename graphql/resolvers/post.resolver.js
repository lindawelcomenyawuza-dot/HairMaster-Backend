import mongoose from 'mongoose';
import User from '../../models/User.js';
import Post from '../../models/Post.js';
import Booking from '../../models/Booking.js';
import { getUser, requireAuth } from '../../middleware/auth.js';
import { getObjectKey, getPublicMediaUrl } from '../../utils/media.js';
import { formatPost, getValidSalonAndStaff } from './shared.js';

export const resolvers = {
  posts: async ({ gender, search }, { req }) => {
    const authUser = getUser(req);
    const query = {};
    if (gender && gender !== 'all') query.gender = gender;
    if (search) {
      const re = new RegExp(search, 'i');
      query.$or = [
        { styleName: re },
        { barberName: re },
        { description: re },
        { hashtags: re },
        { location: re },
      ];
    }
    const posts = await Post.find(query).sort({ createdAt: -1 });
    return Promise.all(posts.map(p => formatPost(p, authUser?.id)));
  },

  post: async ({ id }, { req }) => {
    const authUser = getUser(req);
    const post = await Post.findById(id);
    if (!post) return null;
    return formatPost(post, authUser?.id);
  },

  userPosts: async ({ userId }, { req }) => {
    const authUser = getUser(req);
    const posts = await Post.find({ userId }).sort({ createdAt: -1 });
    return Promise.all(posts.map(p => formatPost(p, authUser?.id)));
  },

  createPost: async (args, { req }) => {
    const authUser = requireAuth(getUser(req));
    const user = await User.findById(authUser.id);
    if (!user) throw new Error('User not found');

    const postType = args.type || 'portfolio';
    const requiresRelationalAttribution = postType === 'portfolio';
    const salonStaff = (args.salonId || args.stylistId || requiresRelationalAttribution)
      ? await getValidSalonAndStaff(args.salonId, args.stylistId)
      : null;

    if (postType === 'verified' && !args.bookingId) {
      throw new Error('Verified posts must be linked to a booking');
    }

    if (postType === 'verified' && args.bookingId) {
      const booking = await Booking.findById(args.bookingId);
      if (!booking || booking.status !== 'completed') {
        throw new Error('Verified posts must link to a completed booking');
      }
    }

    const requestedPrice = Number(args.price || 0);
    const hasServicePricing = requestedPrice > 0 || Boolean(args.currency);
    if (hasServicePricing && user.accountType !== 'business') {
      throw new Error('Only business accounts can add service pricing to posts');
    }
    const price = user.accountType === 'business' ? Math.max(0, requestedPrice) : 0;
    const currency = user.accountType === 'business' ? (args.currency || user.currency || 'ZAR') : 'ZAR';

    const post = new Post({
      type: postType,
      userId: user._id,
      createdBy: user._id,
      userName: user.name,
      userAvatar: user.avatar || '',
      userAvatarKey: user.avatarKey || getObjectKey(user.avatar),
      accountType: user.accountType,
      image: getPublicMediaUrl(args.imageKey || args.image),
      imageKey: args.imageKey || getObjectKey(args.image),
      images: (args.images || []).map((image, index) => getPublicMediaUrl((args.imageKeys || [])[index] || image)),
      imageKeys: args.imageKeys || (args.images || []).map(getObjectKey).filter(Boolean),
      styleName: args.styleName,
      barberName: salonStaff?.stylist.name || args.barberName,
      barberShop: salonStaff ? (salonStaff.salon.businessName || salonStaff.salon.name) : args.barberShop,
      salonId: salonStaff?.salon._id,
      salonName: salonStaff ? (salonStaff.salon.businessName || salonStaff.salon.name) : args.barberShop,
      stylistId: salonStaff?.stylist._id?.toString(),
      stylistName: salonStaff?.stylist.name || args.barberName,
      stylistAvatar: salonStaff?.stylist.avatar || '',
      salonLogo: salonStaff?.salon.avatar || '',
      location: args.location || salonStaff?.salon.location,
      price,
      currency,
      isService: user.accountType === 'business' && price > 0,
      description: args.description,
      gender: args.gender,
      hashtags: args.hashtags,
      bookingId: args.bookingId || undefined,
    });
    await post.save();
    return formatPost(post, authUser.id);
  },

  repost: async ({ originalPostId }, { req }) => {
    const authUser = requireAuth(getUser(req));
    const user = await User.findById(authUser.id);
    if (!user) throw new Error('User not found');

    const original = await Post.findById(originalPostId);
    if (!original) throw new Error('Original post not found');

    const repost = new Post({
      type: 'repost',
      userId: user._id,
      createdBy: user._id,
      originalPostId: original._id,
      barberId: original.barberId || original.userId,
      locationId: original.locationId,
      userName: user.name,
      userAvatar: user.avatar || '',
      userAvatarKey: user.avatarKey || getObjectKey(user.avatar),
      accountType: user.accountType,
      image: original.image,
      imageKey: original.imageKey || getObjectKey(original.image),
      images: original.images,
      imageKeys: original.imageKeys,
      styleName: original.styleName,
      barberName: original.barberName,
      barberShop: original.barberShop,
      salonId: original.salonId,
      salonName: original.salonName,
      stylistId: original.stylistId,
      stylistName: original.stylistName,
      stylistAvatar: original.stylistAvatar,
      salonLogo: original.salonLogo,
      location: original.location,
      price: original.price,
      currency: original.currency,
      description: original.description,
      gender: original.gender,
      hashtags: original.hashtags,
    });
    await repost.save();
    original.sharesCount = (original.sharesCount || 0) + 1;
    await original.save();
    return formatPost(repost, authUser.id);
  },

  toggleLike: async ({ postId }, { req }) => {
    const authUser = requireAuth(getUser(req));
    const uid = new mongoose.Types.ObjectId(authUser.id);
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    const alreadyLiked = post.likedBy.some(id => id.equals(uid));
    if (alreadyLiked) {
      post.likedBy = post.likedBy.filter(id => !id.equals(uid));
      post.likes = Math.max(0, post.likes - 1);
    } else {
      post.likedBy.push(uid);
      post.likes += 1;
    }
    await post.save();
    return formatPost(post, authUser.id);
  },

  addComment: async ({ postId, content }, { req }) => {
    const authUser = requireAuth(getUser(req));
    const user = await User.findById(authUser.id);
    if (!user) throw new Error('User not found');
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    post.comments.push({
      userId: user._id,
      userName: user.name,
      userAvatar: '',
      content,
      likes: 0,
      likedBy: [],
    });
    await post.save();
    return formatPost(post, authUser.id);
  },

  editComment: async ({ postId, commentId, content }, { req }) => {
    const authUser = requireAuth(getUser(req));
    if (!content || !content.trim()) throw new Error('Comment cannot be empty');
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');
    const comment = post.comments.id(commentId);
    if (!comment) throw new Error('Comment not found');
    if (comment.userId.toString() !== authUser.id) throw new Error('Not authorized to edit this comment');
    comment.content = content.trim();
    await post.save();
    return formatPost(post, authUser.id);
  },

  deleteComment: async ({ postId, commentId }, { req }) => {
    const authUser = requireAuth(getUser(req));
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');
    const comment = post.comments.id(commentId);
    if (!comment) throw new Error('Comment not found');
    if (comment.userId.toString() !== authUser.id) throw new Error('Not authorized to delete this comment');
    comment.deleteOne();
    await post.save();
    return formatPost(post, authUser.id);
  },

  reportComment: async ({ postId, commentId, reason }, { req }) => {
    const authUser = requireAuth(getUser(req));
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');
    const comment = post.comments.id(commentId);
    if (!comment) throw new Error('Comment not found');
    if (comment.userId.toString() === authUser.id) throw new Error('You cannot report your own comment');
    const alreadyReported = (comment.reports || []).some(report => report.userId?.toString() === authUser.id);
    if (!alreadyReported) {
      comment.reports.push({
        userId: new mongoose.Types.ObjectId(authUser.id),
        reason: reason || '',
      });
      await post.save();
    }
    return true;
  },

  toggleSavePost: async ({ postId }, { req }) => {
    const authUser = requireAuth(getUser(req));
    const uid = new mongoose.Types.ObjectId(authUser.id);
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    const alreadySaved = post.savedBy.some(id => id.equals(uid));
    if (alreadySaved) {
      post.savedBy = post.savedBy.filter(id => !id.equals(uid));
    } else {
      post.savedBy.push(uid);
    }
    await post.save();

    const user = await User.findById(authUser.id);
    const postOid = new mongoose.Types.ObjectId(postId);
    if (alreadySaved) {
      user.savedPosts = user.savedPosts.filter(id => !id.equals(postOid));
    } else {
      user.savedPosts.push(postOid);
    }
    await user.save();

    return formatPost(post, authUser.id);
  },
};
