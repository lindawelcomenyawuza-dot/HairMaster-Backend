import { buildSchema } from 'graphql';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Booking from '../models/Booking.js';
import Message from '../models/Message.js';
import DiscountToken from '../models/DiscountToken.js';
import { getUser, requireAuth } from '../middleware/auth.js';

const typeDefs = `
  type PaymentRecord {
    id: ID!
    amount: Float!
    currency: String!
    date: String!
    status: String!
    type: String!
  }

  type Subscription {
    isActive: Boolean!
    startDate: String
    endDate: String
    isTrial: Boolean!
    trialEndsAt: String
    monthlyFee: Float
    currency: String
    paymentHistory: [PaymentRecord]
  }

  type StaffMember {
    id: ID!
    name: String!
    role: String!
    email: String!
    phone: String!
    avatar: String!
    specialties: [String]
  }

  type User {
    id: ID!
    name: String!
    email: String!
    accountType: String!
    avatar: String
    bio: String
    followers: Int
    following: Int
    location: String
    country: String
    currency: String
    businessName: String
    isVerified: Boolean
    verificationBadge: String
    subscription: Subscription
    staff: [StaffMember]
    savedPosts: [String]
    referralCode: String
    loyaltyPoints: Int
    darkMode: Boolean
    language: String
    posts: Int
    totalSpent: Float
    discountTokens: Int
    isFollowing: Boolean
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Product {
    name: String!
    price: Float!
    type: String!
  }

  type TaggedUser {
    id: String!
    name: String!
  }

  type Comment {
    id: ID!
    postId: ID!
    userId: ID!
    userName: String!
    userAvatar: String!
    content: String!
    createdAt: String!
    likes: Int!
    isLiked: Boolean!
  }

  type Post {
    id: ID!
    userId: ID!
    userName: String!
    userAvatar: String!
    accountType: String!
    image: String!
    images: [String]
    styleName: String!
    barberName: String
    barberShop: String
    location: String
    price: Float!
    currency: String
    rating: Float
    likes: Int!
    isLiked: Boolean!
    isSaved: Boolean!
    description: String
    gender: String
    createdAt: String!
    products: [Product]
    hashtags: [String]
    taggedUsers: [TaggedUser]
    comments: [Comment]
    commentsCount: Int!
    sharesCount: Int
  }

  type Booking {
    id: ID!
    postId: String
    styleName: String!
    barberName: String
    location: String
    price: Float!
    currency: String
    depositAmount: Float
    depositPaid: Boolean
    date: String!
    time: String!
    status: String!
    paymentMethod: String!
    paymentStatus: String
  }

  type Message {
    id: ID!
    senderId: ID!
    receiverId: ID!
    content: String!
    timestamp: String!
    read: Boolean!
  }

  type Conversation {
    userId: ID!
    userName: String!
    userAvatar: String!
    lastMessage: String!
    lastMessageTime: String!
    unreadCount: Int!
  }

  type DiscountToken {
    id: ID!
    code: String!
    discount: Int!
    pointCost: Int!
    used: Boolean!
    usedAt: String
    expiresAt: String!
    earnedAt: String!
  }

  type RedeemResult {
    token: DiscountToken!
    newLoyaltyPoints: Int!
  }

  type Query {
    me: User
    user(id: ID!): User
    users: [User]
    posts(gender: String, search: String): [Post]
    post(id: ID!): Post
    userPosts(userId: ID!): [Post]
    bookings: [Booking]
    conversations: [Conversation]
    messages(otherUserId: ID!): [Message]
    myTokens: [DiscountToken]
    tokenTiers: [TokenTier]
  }

  type TokenTier {
    label: String!
    pointCost: Int!
    discount: Int!
    description: String!
  }

  type Mutation {
    register(name: String!, email: String!, password: String!, accountType: String): AuthPayload
    login(email: String!, password: String!): AuthPayload
    createPost(
      image: String!
      images: [String]
      styleName: String!
      barberName: String
      barberShop: String
      location: String
      price: Float
      currency: String
      description: String
      gender: String
      hashtags: [String]
    ): Post
    toggleLike(postId: ID!): Post
    addComment(postId: ID!, content: String!): Post
    toggleSavePost(postId: ID!): Post
    createBooking(
      postId: String
      styleName: String!
      barberName: String
      location: String
      price: Float!
      currency: String
      depositAmount: Float
      date: String!
      time: String!
      paymentMethod: String!
    ): Booking
    updateBooking(id: ID!, status: String, paymentStatus: String): Booking
    toggleFollow(userId: ID!): User
    sendMessage(receiverId: ID!, content: String!): Message
    redeemPoints(pointCost: Int!): RedeemResult
    useToken(code: String!): DiscountToken
    updateProfile(
      name: String
      bio: String
      avatar: String
      location: String
      country: String
      currency: String
      businessName: String
      darkMode: Boolean
      language: String
    ): User
  }
`;

function formatId(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
}

function formatPost(post, requestingUserId) {
  const obj = post.toObject ? post.toObject() : { ...post };
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;

  const uid = requestingUserId ? requestingUserId.toString() : null;
  obj.isLiked = uid ? obj.likedBy?.some(id => id.toString() === uid) : false;
  obj.isSaved = uid ? obj.savedBy?.some(id => id.toString() === uid) : false;
  obj.commentsCount = obj.comments?.length || 0;
  obj.createdAt = obj.createdAt ? obj.createdAt.toISOString() : new Date().toISOString();

  obj.comments = (obj.comments || []).map(c => ({
    id: c._id.toString(),
    postId: obj.id,
    userId: c.userId.toString(),
    userName: c.userName,
    userAvatar: c.userAvatar,
    content: c.content,
    createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
    likes: c.likes || 0,
    isLiked: uid ? (c.likedBy || []).some(id => id.toString() === uid) : false,
  }));

  obj.taggedUsers = (obj.taggedUsers || []).map(t => ({
    id: t.userId || t.id || '',
    name: t.name,
  }));

  delete obj.likedBy;
  delete obj.savedBy;
  return obj;
}

function formatUser(user, requestingUserId, followingIds) {
  const obj = user.toObject ? user.toObject() : { ...user };
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  delete obj.password;

  obj.savedPosts = (obj.savedPosts || []).map(id => id.toString());
  obj.followingIds = (obj.followingIds || []).map(id => id.toString());
  obj.followerIds = (obj.followerIds || []).map(id => id.toString());

  if (requestingUserId && followingIds) {
    obj.isFollowing = followingIds.some(id => id.toString() === obj.id);
  } else {
    obj.isFollowing = false;
  }

  if (obj.subscription) {
    const sub = obj.subscription;
    obj.subscription = {
      ...sub,
      startDate: sub.startDate ? sub.startDate.toISOString() : null,
      endDate: sub.endDate ? sub.endDate.toISOString() : null,
      trialEndsAt: sub.trialEndsAt ? sub.trialEndsAt.toISOString() : null,
      paymentHistory: (sub.paymentHistory || []).map(p => ({
        id: p._id ? p._id.toString() : Date.now().toString(),
        amount: p.amount,
        currency: p.currency,
        date: p.date ? p.date.toISOString() : new Date().toISOString(),
        status: p.status,
        type: p.type,
      })),
    };
  }

  if (obj.staff) {
    obj.staff = obj.staff.map(s => ({
      ...s,
      id: s._id ? s._id.toString() : s.id,
    }));
  }

  obj.posts = 0;
  obj.totalSpent = 0;
  obj.loyaltyPoints = obj.loyaltyPoints || 0;
  obj.discountTokens = obj.discountTokens || 0;

  return obj;
}

function formatDiscountToken(token) {
  const obj = token.toObject ? token.toObject() : { ...token };
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  obj.expiresAt = obj.expiresAt ? obj.expiresAt.toISOString() : new Date().toISOString();
  obj.earnedAt = obj.earnedAt ? obj.earnedAt.toISOString() : (obj.createdAt ? obj.createdAt.toISOString() : new Date().toISOString());
  if (obj.usedAt) obj.usedAt = obj.usedAt.toISOString();
  obj.userId = obj.userId ? obj.userId.toString() : '';
  return obj;
}

function formatBooking(booking) {
  const obj = booking.toObject ? booking.toObject() : { ...booking };
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  obj.postId = obj.postId ? obj.postId.toString() : null;
  obj.date = obj.date ? obj.date.toISOString() : new Date().toISOString();
  obj.createdAt = obj.createdAt ? obj.createdAt.toISOString() : new Date().toISOString();
  return obj;
}

function formatMessage(message) {
  const obj = message.toObject ? message.toObject() : { ...message };
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  obj.senderId = obj.senderId.toString();
  obj.receiverId = obj.receiverId.toString();
  obj.timestamp = obj.createdAt ? obj.createdAt.toISOString() : new Date().toISOString();
  return obj;
}

const root = {
  me: async (_, { req }) => {
    const authUser = getUser(req);
    if (!authUser) return null;
    const user = await User.findById(authUser.id);
    if (!user) return null;
    return formatUser(user, authUser.id, user.followingIds);
  },

  user: async ({ id }, { req }) => {
    const authUser = getUser(req);
    const user = await User.findById(id);
    if (!user) return null;
    const requestingUser = authUser ? await User.findById(authUser.id) : null;
    return formatUser(user, authUser?.id, requestingUser?.followingIds || []);
  },

  users: async (_, { req }) => {
    const authUser = getUser(req);
    const users = await User.find();
    const requestingUser = authUser ? await User.findById(authUser.id) : null;
    return users.map(u => formatUser(u, authUser?.id, requestingUser?.followingIds || []));
  },

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
    return posts.map(p => formatPost(p, authUser?.id));
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
    return posts.map(p => formatPost(p, authUser?.id));
  },

  bookings: async (_, { req }) => {
    const authUser = requireAuth(getUser(req));
    const bookings = await Booking.find({ userId: authUser.id }).sort({ date: -1 });
    return bookings.map(formatBooking);
  },

  conversations: async (_, { req }) => {
    const authUser = requireAuth(getUser(req));
    const uid = new mongoose.Types.ObjectId(authUser.id);
    const messages = await Message.find({
      $or: [{ senderId: uid }, { receiverId: uid }],
    }).sort({ createdAt: -1 });

    const convoMap = new Map();
    for (const msg of messages) {
      const otherId = msg.senderId.toString() === authUser.id
        ? msg.receiverId.toString()
        : msg.senderId.toString();

      if (!convoMap.has(otherId)) {
        convoMap.set(otherId, msg);
      }
    }

    const conversations = [];
    for (const [otherId, lastMsg] of convoMap) {
      const otherUser = await User.findById(otherId);
      if (!otherUser) continue;
      const unreadCount = await Message.countDocuments({
        senderId: otherId,
        receiverId: authUser.id,
        read: false,
      });
      conversations.push({
        userId: otherId,
        userName: otherUser.name,
        userAvatar: otherUser.avatar || '',
        lastMessage: lastMsg.content,
        lastMessageTime: lastMsg.createdAt.toISOString(),
        unreadCount,
      });
    }
    return conversations;
  },

  messages: async ({ otherUserId }, { req }) => {
    const authUser = requireAuth(getUser(req));
    const uid = new mongoose.Types.ObjectId(authUser.id);
    const oid = new mongoose.Types.ObjectId(otherUserId);
    const messages = await Message.find({
      $or: [
        { senderId: uid, receiverId: oid },
        { senderId: oid, receiverId: uid },
      ],
    }).sort({ createdAt: 1 });

    await Message.updateMany(
      { senderId: oid, receiverId: uid, read: false },
      { read: true }
    );

    return messages.map(formatMessage);
  },

  myTokens: async (_, { req }) => {
    const authUser = requireAuth(getUser(req));
    const tokens = await DiscountToken.find({ userId: authUser.id }).sort({ createdAt: -1 });
    return tokens.map(formatDiscountToken);
  },

  tokenTiers: async () => {
    return [
      { label: 'Bronze', pointCost: 100, discount: 5, description: 'Get 5% off your next booking' },
      { label: 'Silver', pointCost: 250, discount: 10, description: 'Get 10% off your next booking' },
      { label: 'Gold', pointCost: 500, discount: 15, description: 'Get 15% off your next booking' },
      { label: 'Platinum', pointCost: 1000, discount: 25, description: 'Get 25% off your next booking' },
    ];
  },

  redeemPoints: async ({ pointCost }, { req }) => {
    const authUser = requireAuth(getUser(req));
    const user = await User.findById(authUser.id);
    if (!user) throw new Error('User not found');

    const tiers = [
      { label: 'Bronze', pointCost: 100, discount: 5 },
      { label: 'Silver', pointCost: 250, discount: 10 },
      { label: 'Gold', pointCost: 500, discount: 15 },
      { label: 'Platinum', pointCost: 1000, discount: 25 },
    ];

    const tier = tiers.find(t => t.pointCost === pointCost);
    if (!tier) throw new Error('Invalid tier');

    const currentPoints = user.loyaltyPoints || 0;
    if (currentPoints < pointCost) throw new Error('Insufficient loyalty points');

    const code = `${tier.label.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const token = new DiscountToken({
      userId: authUser.id,
      code,
      discount: tier.discount,
      pointCost,
      used: false,
      expiresAt,
    });
    await token.save();

    user.loyaltyPoints = currentPoints - pointCost;
    user.discountTokens = (user.discountTokens || 0) + 1;
    await user.save();

    return {
      token: formatDiscountToken(token),
      newLoyaltyPoints: user.loyaltyPoints,
    };
  },

  useToken: async ({ code }, { req }) => {
    const authUser = requireAuth(getUser(req));
    const token = await DiscountToken.findOne({ code, userId: authUser.id });
    if (!token) throw new Error('Token not found');
    if (token.used) throw new Error('Token already used');
    if (new Date(token.expiresAt) < new Date()) throw new Error('Token has expired');

    token.used = true;
    token.usedAt = new Date();
    await token.save();

    const user = await User.findById(authUser.id);
    if (user && user.discountTokens > 0) {
      user.discountTokens -= 1;
      await user.save();
    }

    return formatDiscountToken(token);
  },

  register: async ({ name, email, password, accountType }) => {
    const existing = await User.findOne({ email });
    if (existing) throw new Error('Email already in use');
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashed,
      accountType: accountType || 'personal',
      avatar: '',
      bio: '',
      followers: 0,
      following: 0,
    });
    await user.save();
    const token = jwt.sign({ id: user._id.toString(), email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return { token, user: formatUser(user, user._id.toString(), []) };
  },

  login: async ({ email, password }) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid credentials');
    const token = jwt.sign({ id: user._id.toString(), email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return { token, user: formatUser(user, user._id.toString(), user.followingIds) };
  },

  createPost: async (args, { req }) => {
    const authUser = requireAuth(getUser(req));
    const user = await User.findById(authUser.id);
    if (!user) throw new Error('User not found');
    const post = new Post({
      ...args,
      userId: user._id,
      userName: user.name,
      userAvatar: user.avatar || '',
      accountType: user.accountType,
    });
    await post.save();
    return formatPost(post, authUser.id);
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
      userAvatar: user.avatar || '',
      content,
      likes: 0,
      likedBy: [],
    });
    await post.save();
    return formatPost(post, authUser.id);
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
    if (alreadySaved) {
      user.savedPosts = user.savedPosts.filter(id => !id.equals(uid));
    } else {
      user.savedPosts.push(new mongoose.Types.ObjectId(postId));
    }
    await user.save();

    return formatPost(post, authUser.id);
  },

  createBooking: async (args, { req }) => {
    const authUser = requireAuth(getUser(req));
    const booking = new Booking({
      ...args,
      userId: authUser.id,
      date: new Date(args.date),
      depositPaid: args.depositAmount ? false : false,
    });
    await booking.save();

    const user = await User.findById(authUser.id);
    if (user) {
      user.loyaltyPoints = (user.loyaltyPoints || 0) + 10;
      await user.save();
    }

    return formatBooking(booking);
  },

  updateBooking: async ({ id, status, paymentStatus }, { req }) => {
    const authUser = requireAuth(getUser(req));
    const booking = await Booking.findOne({ _id: id, userId: authUser.id });
    if (!booking) throw new Error('Booking not found');
    const wasCompleted = booking.status === 'completed';
    if (status) booking.status = status;
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    await booking.save();

    if (status === 'completed' && !wasCompleted) {
      const user = await User.findById(authUser.id);
      if (user) {
        user.loyaltyPoints = (user.loyaltyPoints || 0) + 10;
        await user.save();
      }
    }

    return formatBooking(booking);
  },

  toggleFollow: async ({ userId }, { req }) => {
    const authUser = requireAuth(getUser(req));
    if (authUser.id === userId) throw new Error('Cannot follow yourself');

    const currentUser = await User.findById(authUser.id);
    const targetUser = await User.findById(userId);
    if (!currentUser || !targetUser) throw new Error('User not found');

    const targetOid = new mongoose.Types.ObjectId(userId);
    const currentOid = new mongoose.Types.ObjectId(authUser.id);

    const isFollowing = currentUser.followingIds.some(id => id.equals(targetOid));
    if (isFollowing) {
      currentUser.followingIds = currentUser.followingIds.filter(id => !id.equals(targetOid));
      currentUser.following = Math.max(0, currentUser.following - 1);
      targetUser.followerIds = targetUser.followerIds.filter(id => !id.equals(currentOid));
      targetUser.followers = Math.max(0, targetUser.followers - 1);
    } else {
      currentUser.followingIds.push(targetOid);
      currentUser.following += 1;
      targetUser.followerIds.push(currentOid);
      targetUser.followers += 1;
    }

    await currentUser.save();
    await targetUser.save();

    return formatUser(targetUser, authUser.id, currentUser.followingIds);
  },

  sendMessage: async ({ receiverId, content }, { req }) => {
    const authUser = requireAuth(getUser(req));
    const message = new Message({
      senderId: authUser.id,
      receiverId,
      content,
    });
    await message.save();
    return formatMessage(message);
  },

  updateProfile: async (args, { req }) => {
    const authUser = requireAuth(getUser(req));
    const user = await User.findById(authUser.id);
    if (!user) throw new Error('User not found');
    Object.assign(user, args);
    await user.save();
    return formatUser(user, authUser.id, user.followingIds);
  },
};

import { graphql } from 'graphql';

const schema = buildSchema(typeDefs);

export { root };
export default schema;
