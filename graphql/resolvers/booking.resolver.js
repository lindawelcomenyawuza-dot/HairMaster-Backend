import mongoose from 'mongoose';
import Booking from '../../models/Booking.js';
import User from '../../models/User.js';
import Chat from '../../models/Chat.js';
import Post from '../../models/Post.js';
import { getUser, requireAuth } from '../../middleware/auth.js';
import { formatBooking } from './shared.js';

export const resolvers = {
  bookings: async (_, { req }) => {
    const authUser = requireAuth(getUser(req));
    const bookings = await Booking.find({ userId: authUser.id }).sort({ date: -1 });
    return bookings.map(formatBooking);
  },

  createBooking: async (args, { req }) => {
    const authUser = requireAuth(getUser(req));
    const sourcePost = args.postId && args.postId !== 'custom' && mongoose.Types.ObjectId.isValid(args.postId)
      ? await Post.findById(args.postId)
      : null;

    const bookingPayload = {
      ...args,
      userId: authUser.id,
      date: new Date(args.date),
      status: 'pending',
    };

    if (sourcePost) {
      bookingPayload.postId = sourcePost._id;
      bookingPayload.barberId = sourcePost.barberId || sourcePost.salonId || undefined;
      bookingPayload.styleName = sourcePost.styleName;
      bookingPayload.barberName = sourcePost.stylistName || sourcePost.barberName;
      bookingPayload.location = sourcePost.location;
      bookingPayload.price = sourcePost.price || 0;
      bookingPayload.currency = sourcePost.currency || 'ZAR';
      bookingPayload.depositAmount = args.depositAmount ?? bookingPayload.depositAmount;
    }

    const booking = new Booking({
      ...bookingPayload,
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
};
