import mongoose from 'mongoose';
import User from '../../models/User.js';
import { getObjectKey, getPublicMediaUrl } from '../../utils/media.js';

export function formatId(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
}

export async function formatPost(post, requestingUserId) {
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
  obj.price = Number(obj.price || 0);
  obj.currency = obj.currency || 'ZAR';
  obj.isService = Boolean(obj.isService || obj.price > 0);

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
  obj.userAvatarKey = obj.userAvatarKey || getObjectKey(postUser?.avatar || obj.userAvatar);
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

export function formatSalon(user) {
  return {
    id: user._id.toString(),
    name: user.businessName || user.name,
    city: user.location || '',
    logo: getPublicMediaUrl(user.avatarKey || user.avatar),
  };
}

export function formatSalonStaffMember(staffMember) {
  return {
    id: staffMember._id ? staffMember._id.toString() : staffMember.id,
    displayName: staffMember.name || 'Unnamed stylist',
    avatar: getPublicMediaUrl(staffMember.avatar),
    role: staffMember.role || 'stylist',
  };
}

export async function getValidSalonAndStaff(salonId, stylistId) {
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

export function formatUser(user, requestingUserId, followingIds) {
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

export function formatBooking(booking) {
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

export function formatMessage(message) {
  const obj = message.toObject ? message.toObject() : { ...message };
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  obj.senderId = obj.senderId.toString();
  obj.receiverId = obj.receiverId.toString();
  obj.timestamp = obj.createdAt ? obj.createdAt.toISOString() : new Date().toISOString();
  return obj;
}

export function formatChat(chat) {
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

export function formatProduct(product) {
  const obj = product.toObject ? product.toObject() : { ...product };
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  obj.businessId = obj.businessId.toString();
  obj.images = (obj.images || []).map(image => getPublicMediaUrl(image));
  obj.createdAt = obj.createdAt ? obj.createdAt.toISOString() : new Date().toISOString();
  return obj;
}

export function formatDiscountToken(token) {
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
