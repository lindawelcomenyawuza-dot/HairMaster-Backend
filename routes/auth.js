import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

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

  const password = await bcrypt.hash(`google_${profile.id}`, 10);
  return User.create({
    googleId:    profile.id,
    name:        profile.displayName || email.split('@')[0],
    email,
    password,
    accountType: 'personal',
    avatar:      profile.photos?.[0]?.value || '',
  });
}

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
      { id: user._id.toString(), email: user.email, accountType: user.accountType },
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
