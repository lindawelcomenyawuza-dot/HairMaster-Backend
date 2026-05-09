import Booking from '../../models/Booking.js';
import User from '../../models/User.js';
import Chat from '../../models/Chat.js';
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
};
