import express from 'express';
import crypto from 'crypto';
import https from 'https';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
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

router.post('/initiate', async (req, res) => {
  try {
    const user = getUser(req);
    requireAuth(user);

    const { bookingId, amount, currency = 'NGN', email } = req.body;

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

      const existing = await Payment.findOne({ reference });
      if (!existing) return res.sendStatus(200);
      if (existing.status === 'success') return res.sendStatus(200);

      existing.status = 'success';
      existing.paystackData = event.data;
      await existing.save();

      if (metadata?.bookingId) {
        await Booking.findByIdAndUpdate(metadata.bookingId, {
          paymentStatus: 'completed',
          depositPaid:   true,
        });
      }

      console.log(`[Webhook] Payment success: ${reference}`);
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

    const payment = await Payment.findOne({
      reference: req.params.reference,
      userId:    user.id,
    });

    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    return res.json({
      reference:  payment.reference,
      status:     payment.status,
      amount:     payment.amount,
      currency:   payment.currency,
      bookingId:  payment.bookingId,
      createdAt:  payment.createdAt,
    });
  } catch (err) {
    return res.status(err.message === 'Authentication required' ? 401 : 500)
      .json({ error: err.message });
  }
});

export default router;
