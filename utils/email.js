import emailjs from '@emailjs/nodejs';

const DEFAULT_FROM = 'Hair Master <no-reply@hairmaster.app>';
const DEFAULT_FRONTEND_URL = 'https://hairmaster.com';

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || process.env.WEB_URL || DEFAULT_FRONTEND_URL).trim().replace(/\/+$/, '');
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function buildVerificationLink(token) {
  const frontendUrl = getFrontendUrl();
  return `${frontendUrl}/verify?token=${encodeURIComponent(token)}`;
}

async function sendViaResend({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) return false;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email provider failed: ${body}`);
  }
  return true;
}

export async function sendEmail({ to, subject, html, text }) {
  const sent = await sendViaResend({ to, subject, html });
  if (sent) return;

  console.info('[Email] No email provider configured. Message preview:', {
    to,
    subject,
    text,
  });
}

export async function sendVerificationEmail(user, token) {
  const verificationLink = buildVerificationLink(token);

  try {
    await emailjs.send(
      requireEnv('EMAILJS_SERVICE_ID'),
      requireEnv('EMAILJS_TEMPLATE_ID'),
      {
        to_name: user.name,
        to_email: user.email,
        verification_link: verificationLink,
      },
      {
        publicKey: requireEnv('EMAILJS_PUBLIC_KEY'),
        privateKey: requireEnv('EMAILJS_PRIVATE_KEY'),
      }
    );

    console.info('[EmailJS] Verification email sent');
  } catch (error) {
    console.error('[EmailJS] Verification email failed:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(user, token) {
  const frontendUrl = getFrontendUrl();
  const link = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset your Hair Master password',
    text: `Reset your Hair Master password: ${link}`,
    html: `
      <p>Hi ${user.name},</p>
      <p>Use this link to reset your Hair Master password.</p>
      <p><a href="${link}">Reset password</a></p>
      <p>This link expires in 30 minutes and can only be used once.</p>
    `,
  });
}
