import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { createSecureToken, getFutureDate, hashToken } from '../utils/authTokens.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '../utils/email.js';

const router = express.Router();
const PRODUCTION_FRONTEND_URL = 'https://hair-master-web.vercel.app';
const PRODUCTION_BACKEND_CALLBACK_URL = 'https://hairmaster-backend-1.onrender.com/auth/google/callback';
let googleStrategyConfigured = false;

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || process.env.WEB_URL || PRODUCTION_FRONTEND_URL).trim().replace(/\/+$/, '');
}

function getGoogleCallbackUrl() {
  return (process.env.GOOGLE_CALLBACK_URL || PRODUCTION_BACKEND_CALLBACK_URL).trim();
}

function redirectToAuthFailure(res, reason = 'google_failed') {
  const frontendUrl = getFrontendUrl();
  res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(reason)}`);
}

async function findOrCreateGoogleUser(profile) {
  const email = profile.emails?.[0]?.value;
  if (!email) throw new Error('No email from Google');

  const existingUser = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });
  if (existingUser) {
    if (!existingUser.googleId) {
      existingUser.googleId = profile.id;
      await existingUser.save();
    }
    return existingUser;
  }

  const { token, tokenHash } = createSecureToken();
  const password = await bcrypt.hash(`google_${profile.id}`, 10);
  const user = await User.create({
    googleId:    profile.id,
    name:        profile.displayName || email.split('@')[0],
    email,
    phone:       `google-${profile.id}`,
    password,
    accountType: 'personal',
    avatar:      profile.photos?.[0]?.value || '',
    isVerified: false,
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpires: getFutureDate(24 * 60),
    consentAccepted: true,
    consentTimestamp: new Date(),
  });
  await sendVerificationEmail(user, token);
  return user;
}

router.get('/verify-email', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const user = await User.findOne({
      emailVerificationTokenHash: hashToken(token),
      emailVerificationExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired verification token' });

    user.isVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    console.error('[Auth] Email verification failed:', err);
    return res.status(500).json({ error: 'Could not verify email' });
  }
});

router.post('/resend-verification', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    if (user && !user.isVerified) {
      const { token, tokenHash } = createSecureToken();
      user.emailVerificationTokenHash = tokenHash;
      user.emailVerificationExpires = getFutureDate(24 * 60);
      await user.save();
      await sendVerificationEmail(user, token);
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('[Auth] Resend verification failed:', err);
    return res.status(500).json({ error: 'Could not resend verification email' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    if (user) {
      const { token, tokenHash } = createSecureToken();
      user.passwordResetTokenHash = tokenHash;
      user.passwordResetExpires = getFutureDate(30);
      user.passwordResetUsedAt = undefined;
      await user.save();
      await sendPasswordResetEmail(user, token);
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('[Auth] Forgot password failed:', err);
    return res.status(500).json({ error: 'Could not start password reset' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const token = String(req.body?.token || '');
    const password = String(req.body?.password || '');
    if (!token || password.length < 8) {
      return res.status(400).json({ error: 'Valid token and password are required' });
    }

    const user = await User.findOne({
      passwordResetTokenHash: hashToken(token),
      passwordResetExpires: { $gt: new Date() },
      passwordResetUsedAt: { $exists: false },
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetUsedAt = new Date();
    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    console.error('[Auth] Reset password failed:', err);
    return res.status(500).json({ error: 'Could not reset password' });
  }
});

function configureGoogleStrategy() {
  if (googleStrategyConfigured) return true;
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return false;

  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  getGoogleCallbackUrl(),
        proxy: true,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await findOrCreateGoogleUser(profile);
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
  googleStrategyConfigured = true;
  return true;
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

router.get(
  '/google',
  (req, res, next) => {
    if (!configureGoogleStrategy()) {
      console.error('[Google OAuth] Google auth requested but OAuth is not configured');
      return redirectToAuthFailure(res, 'google_not_configured');
    }
    console.info('[Google OAuth] Starting Google OAuth flow');
    return passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
      prompt: 'select_account',
    })(req, res, next);
  }
);

router.get(
  '/google/callback',
  (req, res, next) => {
    if (!configureGoogleStrategy()) {
      console.error('[Google OAuth] Callback received but OAuth is not configured');
      return redirectToAuthFailure(res, 'google_not_configured');
    }
    passport.authenticate('google', { session: false }, (err, user) => {
      if (err) {
        console.error('[Google OAuth] Callback failed:', err);
        return redirectToAuthFailure(res, 'google_failed');
      }
      if (!user) {
        console.error('[Google OAuth] Callback denied by provider');
        return redirectToAuthFailure(res, 'google_denied');
      }

      console.info(`[Google OAuth] Authentication succeeded for user ${user._id.toString()}`);
      req.user = user;
      return next();
    })(req, res, next);
  },
  (req, res) => {
    const user = req.user;
    if (!process.env.JWT_SECRET) {
      console.error('[Google OAuth] Missing JWT_SECRET');
      return redirectToAuthFailure(res, 'server_config');
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, accountType: user.accountType, isVerified: user.isVerified },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.info(`[Google OAuth] JWT generated for user ${user._id.toString()}`);

    const frontendUrl = getFrontendUrl();
    const redirectUrl = `${frontendUrl}/auth/success?token=${encodeURIComponent(token)}`;
    console.info(`[Google OAuth] Redirecting user ${user._id.toString()} to ${redirectUrl}`);
    return res.redirect(redirectUrl);
  }
);

export default router;
