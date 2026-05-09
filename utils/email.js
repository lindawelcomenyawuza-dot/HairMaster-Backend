const DEFAULT_FROM = 'Hair Master <no-reply@hairmaster.app>';

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
  const frontendUrl = (process.env.FRONTEND_URL || process.env.WEB_URL || 'https://hair-master-web.vercel.app').replace(/\/+$/, '');
  const link = `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your Hair Master email',
    text: `Verify your Hair Master email: ${link}`,
    html: `
      <p>Hi ${user.name},</p>
      <p>Verify your Hair Master account to unlock the app.</p>
      <p><a href="${link}">Verify email</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });
}

export async function sendPasswordResetEmail(user, token) {
  const frontendUrl = (process.env.FRONTEND_URL || process.env.WEB_URL || 'https://hair-master-web.vercel.app').replace(/\/+$/, '');
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
