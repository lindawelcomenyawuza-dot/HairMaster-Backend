import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import { graphqlHTTP } from 'express-graphql';
import cors from 'cors';
import crypto from 'crypto';
import passport from 'passport';
import schema, { root } from './graphql/schema.js';
import Post from './models/Post.js';
import Chat from './models/Chat.js';
import authRoutes from './routes/auth.js';
import paymentRoutes, { applySuccessfulPayment } from './routes/payments.js';
import uploadRoutes from './routes/upload.js';

const app = express();
const PORT = process.env.PORT || 10000;

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:8081',
  'http://192.168.0.151:8081',
  'exp://192.168.0.151:8081',
  'https://hairmaster-backend-1.onrender.com',
  'https://hair-master-web.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.log('❌ Blocked by CORS:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.post('/paystack/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return res.sendStatus(500);
    const hash = crypto.createHmac('sha512', secret).update(req.body).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) return res.status(401).end();

    const event = JSON.parse(req.body);
    if (event.event === 'charge.success' || event.event === 'subscription.create' || event.event === 'invoice.payment_success') {
      const reference = event.data?.reference || event.data?.transaction?.reference;
      if (reference) {
        await applySuccessfulPayment({ reference, paystackData: event.data, source: 'root-webhook' });
      }
    }
    return res.sendStatus(200);
  } catch (err) {
    console.error('[Webhook] Error:', err);
    return res.sendStatus(500);
  }
});

app.use(express.json());
app.use(passport.initialize());

app.use('/auth', authRoutes);
app.use('/payments', paymentRoutes);
app.use('/media', uploadRoutes);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    startChatLifecycleCron();
  })
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/graphql', graphqlHTTP((req) => ({
  schema,
  rootValue: root,
  graphiql: true,
  context: { req },
})));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.get('/feed', async (req, res) => {
  try {
    const { location, category, limit = 20, offset = 0 } = req.query;

    const query = {};

    if (category) {
      const re = new RegExp(category, 'i');
      query.$or = [
        { styleName: re },
        { gender: re },
        { hashtags: re },
      ];
    }

    if (location) {
      const re = new RegExp(location, 'i');
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: [{ location: re }] }];
        delete query.$or;
      } else {
        query.location = re;
      }
    }

    const allPosts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const formatted = allPosts.map(post => {
      const obj = post.toObject();
      obj.id = obj._id.toString();
      delete obj._id;
      delete obj.__v;
      delete obj.likedBy;
      delete obj.savedBy;
      delete obj.products;
      obj.type = obj.type || 'portfolio';
      obj.commentsCount = obj.comments?.length || 0;
      delete obj.comments;
      obj.createdAt = obj.createdAt ? obj.createdAt.toISOString() : new Date().toISOString();
      if (obj.barberId) obj.barberId = obj.barberId.toString();
      if (obj.bookingId) obj.bookingId = obj.bookingId.toString();
      if (obj.originalPostId) obj.originalPostId = obj.originalPostId.toString();
      return obj;
    });

    const nearbyBarbers = [...new Map(
      formatted
        .filter(p => p.barberName)
        .map(p => [p.barberName, { barberName: p.barberName, location: p.location, barberId: p.barberId }])
    ).values()].slice(0, 10);

    const trending = [...formatted]
      .sort((a, b) => (b.likes + b.commentsCount) - (a.likes + a.commentsCount))
      .slice(0, 10);

    res.json({
      posts: formatted,
      nearbyBarbers,
      trending,
      total: formatted.length,
    });
  } catch (err) {
    console.error('[Feed] Error:', err);
    res.status(500).json({ error: 'Failed to load feed' });
  }
});

function startChatLifecycleCron() {
  const HOUR = 60 * 60 * 1000;

  const runLifecycle = async () => {
    try {
      const now = new Date();

      await Chat.updateMany(
        {
          type: 'enquiry',
          status: 'active',
          expiresAt: { $lt: now },
        },
        { $set: { status: 'expired' } }
      );

      const expiredThreshold = new Date(now.getTime() - 72 * 60 * 60 * 1000);
      await Chat.deleteMany({
        type: 'enquiry',
        status: 'expired',
        updatedAt: { $lt: expiredThreshold },
      });

      const archiveThreshold = new Date(now.getTime() - 72 * 60 * 60 * 1000);
      await Chat.deleteMany({
        type: 'booking',
        status: 'locked',
        updatedAt: { $lt: archiveThreshold },
      });

      console.log('[Chat Lifecycle] Cleanup complete');
    } catch (err) {
      console.error('[Chat Lifecycle] Error:', err);
    }
  };

  setInterval(runLifecycle, HOUR);
  runLifecycle();
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
});
