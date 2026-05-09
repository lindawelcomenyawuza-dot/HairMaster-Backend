import { buildSchema } from 'graphql';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Booking from '../models/Booking.js';
import Message from '../models/Message.js';
import DiscountToken from '../models/DiscountToken.js';
import Chat from '../models/Chat.js';
import Product from '../models/Product.js';
import { getUser, requireAuth } from '../middleware/auth.js';
import { getObjectKey, getPublicMediaUrl } from '../utils/media.js';

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
    avatarKey: String
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

  type SalonSearchResult {
    id: ID!
    name: String!
    city: String
    logo: String
  }

  type SalonStaffMember {
    id: ID!
    displayName: String!
    avatar: String
    role: String!
  }

  type Post {
    id: ID!
    type: String!
    userId: ID!
    userName: String!
    userAvatar: String!
    userAvatarKey: String
    accountType: String!
    image: String!
    imageKey: String
    images: [String]
    imageKeys: [String]
    styleName: String!
    barberName: String
    barberShop: String
    salonId: String
    salonName: String
    stylistId: String
    stylistName: String
    stylistAvatar: String
    salonLogo: String
    location: String
    barberId: String
    bookingId: String
    originalPostId: String
    price: Float!
    currency: String
    rating: Float
    likes: Int!
    isLiked: Boolean!
    isSaved: Boolean!
    description: String
    gender: String
    createdAt: String!
    hashtags: [String]
    taggedUsers: [TaggedUser]
    comments: [Comment]
    commentsCount: Int!
    sharesCount: Int
  }

  type Booking {
    id: ID!
    userId: String
    barberId: String
    locationId: String
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

  type ChatMessage {
    id: ID!
    senderId: ID!
    content: String!
    createdAt: String!
  }

  type Chat {
    id: ID!
    type: String!
    bookingId: String
    participants: [String]
    status: String!
    expiresAt: String
    messages: [ChatMessage]
    createdAt: String!
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

  type Product {
    id: ID!
    businessId: ID!
    name: String!
    price: Float!
    currency: String
    images: [String]
    description: String
    category: String
    deliveryAvailable: Boolean!
    deliveryFee: Float
    deliveryAreas: [String]
    inStock: Boolean!
    createdAt: String!
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

  type TokenTier {
    label: String!
    pointCost: Int!
    discount: Int!
    description: String!
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
    myChats: [Chat]
    chat(id: ID!): Chat
    businessProducts(businessId: ID!): [Product]
    myProducts: [Product]
    searchSalons(search: String!): [SalonSearchResult]
    getSalonStaff(salonId: ID!): [SalonStaffMember]
  }

  type Mutation {
    register(name: String!, email: String!, password: String!, accountType: String): AuthPayload
    login(email: String!, password: String!): AuthPayload
    createPost(
      type: String
      image: String!
      imageKey: String
      images: [String]
      imageKeys: [String]
      styleName: String!
      barberName: String
      barberShop: String
      salonId: ID
      stylistId: ID
      location: String
      price: Float
      currency: String
      description: String
      gender: String
      hashtags: [String]
      bookingId: String
    ): Post
    repost(originalPostId: ID!): Post
    toggleLike(postId: ID!): Post
    addComment(postId: ID!, content: String!): Post
    editComment(postId: ID!, commentId: ID!, content: String!): Post
    deleteComment(postId: ID!, commentId: ID!): Post
    reportComment(postId: ID!, commentId: ID!, reason: String): Boolean
    toggleSavePost(postId: ID!): Post
    createBooking(
      postId: String
      barberId: String
      locationId: String
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
      bio: String
      avatar: String
      avatarKey: String
      location: String
      country: String
      currency: String
      businessName: String
      darkMode: Boolean
      language: String
    ): User
    updateProfileSettings(
      name: String
      bio: String
      avatar: String
      avatarKey: String
      location: String
      country: String
      currency: String
      businessName: String
      darkMode: Boolean
      language: String
    ): User
    createChat(type: String!, bookingId: String, participantId: ID!): Chat
    sendChatMessage(chatId: ID!, content: String!): Chat
    createProduct(
      name: String!
      price: Float!
      currency: String
      images: [String]
      description: String
      category: String
      deliveryAvailable: Boolean
      deliveryFee: Float
      deliveryAreas: [String]
    ): Product
    updateProduct(
      id: ID!
      name: String
      price: Float
      description: String
      inStock: Boolean
    ): Product
    deleteProduct(id: ID!): Boolean
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

async function formatPost(post, requestingUserId) {
  const obj = post.toObject ? post.toObject() : { ...post };
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;

  const uid = requestingUserId ? requestingUserId.toString() : null;
  obj.isLiked = uid ? obj.likedBy?.some(id => id.toString() === uid) : false;
  obj.isSaved = uid ? obj.savedBy?.some(id => id.toString() === uid) : false;
  obj.commentsCount = obj.comments?.length || 0;
  obj.createdAt = obj.createdAt ? obj.createdAt.toISOString() : new Date().toISOString();
  obj.type = obj.type || 'portfolio';

  if (obj.barberId) obj.barberId = obj.barberId.toString();
  if (obj.salonId) obj.salonId = obj.salonId.toString();
  if (obj.bookingId) obj.bookingId = obj.bookingId.toString();
  if (obj.originalPostId) obj.originalPostId = obj.originalPostId.toString();

  const referencedUserIds = [
    obj.userId,
    ...(obj.comments || []).map(c => c.userId),
  ].filter(Boolean).map(id => id.toString());
  const users = referencedUserIds.length
    ? await User.find({ _id: { $in: [...new Set(referencedUserIds)] } })
    : [];
  const usersById = new Map(users.map(user => [user._id.toString(), user]));
  const postUser = usersById.get(obj.userId?.toString());

  obj.imageKey = obj.imageKey || getObjectKey(obj.image);
  obj.image = getPublicMediaUrl(obj.imageKey || obj.image);
  obj.images = (obj.images || []).map((image, index) => getPublicMediaUrl((obj.imageKeys || [])[index] || image));
  obj.userName = postUser?.name || obj.userName || '';
  obj.userAvatarKey = postUser?.avatarKey || obj.userAvatarKey || getObjectKey(postUser?.avatar || obj.userAvatar);
  obj.userAvatar = getPublicMediaUrl(obj.userAvatarKey || postUser?.avatar || obj.userAvatar) || '';
  obj.salonName = obj.salonName || obj.barberShop || '';
  obj.stylistName = obj.stylistName || obj.barberName || '';
  obj.salonLogo = getPublicMediaUrl(obj.salonLogo);
  obj.stylistAvatar = getPublicMediaUrl(obj.stylistAvatar);

  obj.comments = (obj.comments || []).map(c => ({
    id: c._id.toString(),
    postId: obj.id,
    userId: c.userId.toString(),
    userName: usersById.get(c.userId.toString())?.name || c.userName || '',
    userAvatar: getPublicMediaUrl(usersById.get(c.userId.toString())?.avatarKey || usersById.get(c.userId.toString())?.avatar || c.userAvatar) || '',
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
  delete obj.products;
  return obj;
}

function formatSalon(user) {
  return {
    id: user._id.toString(),
    name: user.businessName || user.name,
    city: user.location || '',
    logo: getPublicMediaUrl(user.avatarKey || user.avatar),
  };
}

function formatSalonStaffMember(staffMember) {
  return {
    id: staffMember._id ? staffMember._id.toString() : staffMember.id,
    displayName: staffMember.name || 'Unnamed stylist',
    avatar: getPublicMediaUrl(staffMember.avatar),
    role: staffMember.role || 'stylist',
  };
}

async function getValidSalonAndStaff(salonId, stylistId) {
  if (!salonId || !mongoose.Types.ObjectId.isValid(salonId)) {
    throw new Error('A valid salon is required');
  }
  if (!stylistId) {
    throw new Error('A valid stylist is required');
  }

  const salon = await User.findOne({ _id: salonId, accountType: 'business' });
  if (!salon) throw new Error('Selected salon was not found');

  const stylist = (salon.staff || []).find(member => member._id?.toString() === stylistId);
  if (!stylist) throw new Error('Selected stylist is not registered with this salon');

  return { salon, stylist };
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
  obj.avatarKey = obj.avatarKey || getObjectKey(obj.avatar);
  obj.avatar = getPublicMediaUrl(obj.avatarKey || obj.avatar);

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
      avatar: getPublicMediaUrl(s.avatar),
    }));
  }

  obj.posts = 0;
  obj.totalSpent = 0;
  obj.loyaltyPoints = obj.loyaltyPoints || 0;
  obj.discountTokens = obj.discountTokens || 0;

  return obj;
}

function formatBooking(booking) {
  const obj = booking.toObject ? booking.toObject() : { ...booking };
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  obj.userId = obj.userId ? obj.userId.toString() : null;
  obj.barberId = obj.barberId ? obj.barberId.toString() : null;
  obj.locationId = obj.locationId ? obj.locationId.toString() : null;
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

function formatChat(chat) {
  const obj = chat.toObject ? chat.toObject() : { ...chat };
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  obj.participants = (obj.participants || []).map(p => p.toString());
  obj.bookingId = obj.bookingId ? obj.bookingId.toString() : null;
  obj.createdAt = obj.createdAt ? obj.createdAt.toISOString() : new Date().toISOString();
  obj.expiresAt = obj.expiresAt ? obj.expiresAt.toISOString() : null;
  obj.messages = (obj.messages || []).map(m => ({
    id: m._id.toString(),
    senderId: m.senderId.toString(),
    content: m.content,
    createdAt: m.createdAt ? m.createdAt.toISOString() : new Date().toISOString(),
  }));
  return obj;
}

function formatProduct(product) {
  const obj = product.toObject ? product.toObject() : { ...product };
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  obj.businessId = obj.businessId.toString();
  obj.images = (obj.images || []).map(image => getPublicMediaUrl(image));
  obj.createdAt = obj.createdAt ? obj.createdAt.toISOString() : new Date().toISOString();
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
        userAvatar: getPublicMediaUrl(otherUser.avatarKey || otherUser.avatar),
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

  myChats: async (_, { req }) => {
    const authUser = requireAuth(getUser(req));
    const uid = new mongoose.Types.ObjectId(authUser.id);
    const chats = await Chat.find({ participants: uid }).sort({ createdAt: -1 });
    return chats.map(formatChat);
  },

  chat: async ({ id }, { req }) => {
    const authUser = requireAuth(getUser(req));
    const chat = await Chat.findById(id);
    if (!chat) return null;
    const isParticipant = chat.participants.some(p => p.toString() === authUser.id);
    if (!isParticipant) throw new Error('Not authorized');
    return formatChat(chat);
  },

  businessProducts: async ({ businessId }) => {
    const products = await Product.find({ businessId }).sort({ createdAt: -1 });
    return products.map(formatProduct);
  },

  myProducts: async (_, { req }) => {
    const authUser = requireAuth(getUser(req));
    const products = await Product.find({ businessId: authUser.id }).sort({ createdAt: -1 });
    return products.map(formatProduct);
  },

  searchSalons: async ({ search }) => {
    const term = (search || '').trim();
    if (term.length < 2) return [];
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const salons = await User.find({
      accountType: 'business',
      $or: [
        { businessName: re },
        { name: re },
        { location: re },
      ],
    }).sort({ businessName: 1, name: 1 }).limit(12);
    return salons.map(formatSalon);
  },

  getSalonStaff: async ({ salonId }) => {
    if (!mongoose.Types.ObjectId.isValid(salonId)) throw new Error('Invalid salon');
    const salon = await User.findOne({ _id: salonId, accountType: 'business' });
    if (!salon) throw new Error('Salon not found');
    return (salon.staff || []).map(formatSalonStaffMember);
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
      price: args.price || 0,
      currency: args.currency,
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

  createBooking: async (args, { req }) => {
    const authUser = requireAuth(getUser(req));
    const booking = new Booking({
      ...args,
      userId: authUser.id,
      date: new Date(args.date),
      status: 'pending',
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
      const chat = await Chat.findOne({ bookingId: booking._id });
      if (chat) {
        chat.status = 'locked';
        await chat.save();
      }
    }

    if (status === 'confirmed' && booking.status !== 'confirmed') {
      const existingChat = await Chat.findOne({ bookingId: booking._id });
      if (!existingChat) {
        const chat = new Chat({
          type: 'booking',
          bookingId: booking._id,
          participants: [booking.userId, booking.barberId].filter(Boolean),
          status: 'active',
        });
        await chat.save();
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

  createChat: async ({ type, bookingId, participantId }, { req }) => {
    const authUser = requireAuth(getUser(req));
    const expiresAt = type === 'enquiry'
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : null;

    const chat = new Chat({
      type,
      bookingId: bookingId || undefined,
      participants: [authUser.id, participantId],
      status: 'active',
      expiresAt,
    });
    await chat.save();
    return formatChat(chat);
  },

  sendChatMessage: async ({ chatId, content }, { req }) => {
    const authUser = requireAuth(getUser(req));
    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error('Chat not found');
    if (chat.status === 'locked') throw new Error('This chat is locked');
    if (chat.status === 'expired') throw new Error('This chat has expired');

    const isParticipant = chat.participants.some(p => p.toString() === authUser.id);
    if (!isParticipant) throw new Error('Not a participant');

    chat.messages.push({
      senderId: new mongoose.Types.ObjectId(authUser.id),
      content,
    });
    await chat.save();
    return formatChat(chat);
  },

  createProduct: async (args, { req }) => {
    const authUser = requireAuth(getUser(req));
    const user = await User.findById(authUser.id);
    if (!user || user.accountType !== 'business') {
      throw new Error('Only business accounts can create products');
    }
    const product = new Product({
      ...args,
      images: (args.images || []).map(getPublicMediaUrl),
      businessId: authUser.id,
      deliveryAvailable: args.deliveryAvailable ?? false,
    });
    await product.save();
    return formatProduct(product);
  },

  updateProduct: async ({ id, ...updates }, { req }) => {
    const authUser = requireAuth(getUser(req));
    const product = await Product.findOne({ _id: id, businessId: authUser.id });
    if (!product) throw new Error('Product not found');
    if (updates.images) updates.images = updates.images.map(getPublicMediaUrl);
    Object.assign(product, updates);
    await product.save();
    return formatProduct(product);
  },

  deleteProduct: async ({ id }, { req }) => {
    const authUser = requireAuth(getUser(req));
    const result = await Product.deleteOne({ _id: id, businessId: authUser.id });
    return result.deletedCount > 0;
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

  updateProfile: async (args, { req }) => {
    const authUser = requireAuth(getUser(req));
    const user = await User.findById(authUser.id);
    if (!user) throw new Error('User not found');
    const updates = { ...args };
    delete updates.name;
    if (Object.prototype.hasOwnProperty.call(updates, 'avatar')) {
      updates.avatarKey = updates.avatarKey || getObjectKey(updates.avatar);
      updates.avatar = getPublicMediaUrl(updates.avatarKey || updates.avatar);
    }
    Object.assign(user, updates);
    await user.save();
    return formatUser(user, authUser.id, user.followingIds);
  },

  updateProfileSettings: async (args, { req }) => {
    const authUser = requireAuth(getUser(req));
    const user = await User.findById(authUser.id);
    if (!user) throw new Error('User not found');
    const updates = { ...args };
    if (Object.prototype.hasOwnProperty.call(updates, 'avatar')) {
      updates.avatarKey = updates.avatarKey || getObjectKey(updates.avatar);
      updates.avatar = getPublicMediaUrl(updates.avatarKey || updates.avatar);
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'name')) {
      updates.name = updates.name?.trim();
      if (!updates.name) throw new Error('Name cannot be empty');
    }
    Object.assign(user, updates);
    await user.save();
    return formatUser(user, authUser.id, user.followingIds);
  },
};

export { root };

const schema = buildSchema(typeDefs);
export default schema;
