import crypto from 'crypto';

export function createSecureToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    tokenHash: hashToken(token),
  };
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getFutureDate(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}
