import mongoose from 'mongoose';
import User from '../../models/User.js';
import Message from '../../models/Message.js';
import Chat from '../../models/Chat.js';
import { getUser, requireAuth } from '../../middleware/auth.js';
import { getPublicMediaUrl } from '../../utils/media.js';
import { formatChat, formatMessage } from './shared.js';

export const resolvers = {
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
};
