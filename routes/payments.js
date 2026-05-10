import express from 'express';
import crypto from 'crypto';
import https from 'https';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { getUser, requireAuth } from '../middleware/auth.js';

const router = express.Router();

function paystackRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path,
      method,
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch { reject(new Error('Invalid JSON from Paystack')); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

async function activateSubscription(payment, paystackData) {
  const now = new Date();
  const expiresAt = addMonths(now, 1);
  const plan = payment.subscriptionPlan || paystackData?.metadata?.subscriptionPlan || 'monthly';

  const user = await User.findById(payment.userId);
  if (!user) {
    console.error(`[Payments] subscription update failed: user not found for payment ${payment.reference}`);
    return;
  }

  user.subscription = {
    ...(user.subscription?.toObject ? user.subscription.toObject() : user.subscription || {}),
    isActive: true,
    subscriptionStatus: 'active',
    subscriptionPlan: plan,
    activatedAt: now,
    expiresAt,
    startDate: now,
    endDate: expiresAt,
    isTrial: false,
    trialEndsAt: undefined,
    monthlyFee: payment.amount,
    currency: payment.currency,
    paymentHistory: [
      ...((user.subscription?.paymentHistory || []).map(record => (
        record?.toObject ? record.toObject() : record
      ))),
      {
        amount: payment.amount,
        currency: payment.currency,
        date: now,
        status: 'completed',
        type: 'subscription',
      },
    ],
  };

  await user.save();
  console.info(`[Payments] subscription updated: user=${user._id.toString()} reference=${payment.reference}`);
}

export async function applySuccessfulPayment({ reference, paystackData, source = 'unknown' }) {
  const payment = await Payment.findOne({ reference });
  if (!payment) {
    console.warn(`[Payments] ${source}: payment not found for reference=${reference}`);
    return null;
  }

  if (payment.status === 'success' && payment.processedAt) {
    console.info(`[Payments] ${source}: duplicate success ignored for reference=${reference}`);
    return payment;
  }

  payment.status = 'success';
  payment.paystackData = paystackData || payment.paystackData;
  payment.verifiedAt = payment.verifiedAt || new Date();
  payment.processedAt = payment.processedAt || new Date();
  await payment.save();
  console.info(`[Payments] ${source}: payment verified reference=${reference}`);

  if (payment.type === 'subscription' || paystackData?.metadata?.type === 'subscription') {
    await activateSubscription(payment, paystackData);
  } else if (payment.bookingId || paystackData?.metadata?.bookingId) {
    await Booking.findByIdAndUpdate(payment.bookingId || paystackData.metadata.bookingId, {
      paymentStatus: 'completed',
      depositPaid:   true,
    });
    console.info(`[Payments] booking updated reference=${reference}`);
  }

  console.info(`[Payments] database save successful reference=${reference}`);
  return payment;
}

async function verifyPaystackTransaction(reference) {
  const response = await paystackRequest('GET', `/transaction/verify/${encodeURIComponent(reference)}`);
  if (!response.status || response.data?.status !== 'success') {
    console.warn(`[Payments] verification failed reference=${reference}: ${response.message || response.data?.status || 'unknown'}`);
    return null;
  }
  return response.data;
}

router.post('/initiate', async (req, res) => {
  try {
    const user = getUser(req);
    requireAuth(user);

    const { bookingId, amount, currency = 'NGN', email, type = bookingId ? 'booking' : 'subscription', subscriptionPlan = 'monthly' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const reference = `hm_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

    const paystackResponse = await paystackRequest('POST', '/transaction/initialize', {
      email: email || user.email,
      amount: Math.round(amount * 100),
      currency,
      reference,
      metadata: {
        userId: user.id,
        bookingId: bookingId || null,
        type,
        subscriptionPlan: type === 'subscription' ? subscriptionPlan : null,
      },
    });

    if (!paystackResponse.status) {
      return res.status(502).json({ error: paystackResponse.message || 'Paystack error' });
    }

    await Payment.create({
      userId:   user.id,
      bookingId: bookingId || undefined,
      reference,
      amount,
      currency,
      type,
      subscriptionPlan: type === 'subscription' ? subscriptionPlan : undefined,
      status:   'pending',
      paystackData: paystackResponse.data,
    });

    return res.json({
      authorizationUrl: paystackResponse.data.authorization_url,
      accessCode:       paystackResponse.data.access_code,
      reference,
    });
  } catch (err) {
    console.error('[Payments] initiate error:', err);
    return res.status(err.message === 'Authentication required' ? 401 : 500)
      .json({ error: err.message });
  }
});

router.post('/paystack/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const hash = crypto
      .createHmac('sha512', secret)
      .update(req.body)
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(req.body);

    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data;

      await applySuccessfulPayment({ reference, paystackData: event.data, source: 'webhook' });
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error('[Webhook] Error:', err);
    return res.sendStatus(500);
  }
});

router.get('/status/:reference', async (req, res) => {
  try {
    const user = getUser(req);
    requireAuth(user);

    let payment = await Payment.findOne({
      reference: req.params.reference,
      userId:    user.id,
    });

    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    if (payment.status === 'pending') {
      const verified = await verifyPaystackTransaction(payment.reference);
      if (verified) {
        payment = await applySuccessfulPayment({
          reference: payment.reference,
          paystackData: verified,
          source: 'status-check',
        }) || payment;
      }
    }

    return res.json({
      reference:  payment.reference,
      status:     payment.status,
      amount:     payment.amount,
      currency:   payment.currency,
      bookingId:  payment.bookingId,
      type:       payment.type,
      createdAt:  payment.createdAt,
    });
  } catch (err) {
    return res.status(err.message === 'Authentication required' ? 401 : 500)
      .json({ error: err.message });
  }
});

export default router;
