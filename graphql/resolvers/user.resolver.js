import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../../models/User.js';
import DiscountToken from '../../models/DiscountToken.js';
import { getUser, requireAuth } from '../../middleware/auth.js';
import { getObjectKey, getPublicMediaUrl } from '../../utils/media.js';
import { createSecureToken, getFutureDate, hashToken } from '../../utils/authTokens.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '../../utils/email.js';
import { formatDiscountToken, formatUser } from './shared.js';

const tokenTiers = [
  { label: 'Bronze', pointCost: 100, discount: 5, description: 'Get 5% off your next booking' },
  { label: 'Silver', pointCost: 250, discount: 10, description: 'Get 10% off your next booking' },
  { label: 'Gold', pointCost: 500, discount: 15, description: 'Get 15% off your next booking' },
  { label: 'Platinum', pointCost: 1000, discount: 25, description: 'Get 25% off your next booking' },
];

async function createUnverifiedEmailUser({ name, email, password, phone, consentAccepted = true, accountType }) {
  if (consentAccepted !== true) throw new Error('Terms and consent must be accepted');
  if (phone !== undefined && !String(phone).trim()) throw new Error('Phone number is required');

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw new Error('Email already in use');

  const hashed = await bcrypt.hash(password, 10);
  const { token, tokenHash } = createSecureToken();
  const expiresAt = getFutureDate(60);
  const user = new User({
    name,
    email: normalizedEmail,
    phone: phone ? phone.trim() : '',
    password: hashed,
    accountType: accountType || 'personal',
    avatar: '',
    bio: '',
    followers: 0,
    following: 0,
    isVerified: false,
    emailVerified: false,
    authProvider: 'email',
    verificationToken: tokenHash,
    verificationTokenExpires: expiresAt,
    consentAccepted: true,
    consentTimestamp: new Date(),
  });
  await user.save();
  await sendVerificationEmail(user, token);
  return user;
}

async function verifyEmailToken(rawToken) {
  const token = String(rawToken || '');
  if (!token) throw new Error('Verification token is required');

  const tokenHash = hashToken(token);
  const user = await User.findOne({
    $or: [
      { verificationToken: tokenHash, verificationTokenExpires: { $gt: new Date() } },
      { emailVerificationTokenHash: tokenHash, emailVerificationExpires: { $gt: new Date() } },
    ],
  });
  if (!user) throw new Error('Invalid or expired verification token');

  user.isVerified = true;
  user.emailVerified = true;
  user.verificationToken = null;
  user.verificationTokenExpires = null;
  // Clear legacy fields used by older pending verification emails.
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
  return user;
}

export const resolvers = {
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

  myTokens: async (_, { req }) => {
    const authUser = requireAuth(getUser(req));
    const tokens = await DiscountToken.find({ userId: authUser.id }).sort({ createdAt: -1 });
    return tokens.map(formatDiscountToken);
  },

  tokenTiers: async () => tokenTiers,

  register: async ({ name, email, password, phone, consentAccepted, accountType }) => {
    const user = await createUnverifiedEmailUser({ name, email, password, phone, consentAccepted, accountType });
    return { token: '', user: formatUser(user, user._id.toString(), []) };
  },

  signup: async ({ name, email, password, phone, consentAccepted, accountType }) => {
    const user = await createUnverifiedEmailUser({ name, email, password, phone, consentAccepted, accountType });
    return {
      success: true,
      message: 'Signup successful. Please check your email to verify your account.',
      user: formatUser(user, user._id.toString(), []),
    };
  },

  login: async ({ email, password }) => {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) throw new Error('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid credentials');
    if (user.authProvider !== 'google' && !user.emailVerified && !user.isVerified) {
      throw new Error('Please verify your email before logging in');
    }
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        accountType: user.accountType,
        isVerified: user.isVerified,
        emailVerified: user.emailVerified || user.isVerified,
        authProvider: user.authProvider || 'email',
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return { token, user: formatUser(user, user._id.toString(), user.followingIds) };
  },

  verifyEmail: async ({ token }) => {
    const user = await verifyEmailToken(token);
    return {
      success: true,
      message: 'Email verified successfully. You can now log in.',
      user: formatUser(user, user._id.toString(), user.followingIds),
    };
  },

  forgotPassword: async ({ email }) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) throw new Error('Email is required');

    const user = await User.findOne({ email: normalizedEmail });
    if (user) {
      const { token, tokenHash } = createSecureToken();
      user.passwordResetTokenHash = tokenHash;
      user.passwordResetExpires = getFutureDate(30);
      user.passwordResetUsedAt = undefined;
      await user.save();
      await sendPasswordResetEmail(user, token);
    }

    return true;
  },

  resetPassword: async ({ token, password }) => {
    const rawToken = String(token || '');
    const newPassword = String(password || '');
    if (!rawToken || newPassword.length < 8) {
      throw new Error('Valid token and password are required');
    }

    const user = await User.findOne({
      passwordResetTokenHash: hashToken(rawToken),
      passwordResetExpires: { $gt: new Date() },
      passwordResetUsedAt: { $exists: false },
    });
    if (!user) throw new Error('Invalid or expired reset token');

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetUsedAt = new Date();
    await user.save();

    return true;
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

  redeemPoints: async ({ pointCost }, { req }) => {
    const authUser = requireAuth(getUser(req));
    const user = await User.findById(authUser.id);
    if (!user) throw new Error('User not found');

    const tier = tokenTiers.find(t => t.pointCost === pointCost);
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
