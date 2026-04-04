import nodemailer from 'nodemailer';

// Reusable transporter (SMTP configuration)
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,          // TLS required for port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Builds a complete email object with required headers.
 * Always use this function when sending any automated email.
 */
export function buildEmail(
  to: string,
  subject: string,
  html: string,
  replyTo?: string,
  unsubscribe?: string
) {
  // Simple plain-text version (strip HTML tags and compress spaces)
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    from: `"Only Bangers" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text,
    replyTo: replyTo || 'support@onlybangers.co.za',
    headers: {
      // Required by Gmail and CAN-SPAM / POPIA
      'List-Unsubscribe': unsubscribe
        ? `<mailto:${unsubscribe}>`
        : '<mailto:support@onlybangers.co.za?subject=unsubscribe>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      // Identifies your sending domain
      'X-Mailer': 'Only Bangers Platform v3',
    },
  };
}