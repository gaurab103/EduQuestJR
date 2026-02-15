import nodemailer from 'nodemailer';

// Generate a 6-digit code
export function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create transporter based on available config.
 * Priority:
 *   1. SMTP_HOST + SMTP_USER env vars (any SMTP provider: Brevo, SendGrid, Mailgun, etc.)
 *   2. GMAIL_USER + GMAIL_APP_PASSWORD env vars (Gmail SMTP shortcut)
 *   3. Ethereal test account (dev fallback — emails NOT delivered, preview URL logged)
 */
let transporterPromise = null;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    // Option 1: Custom SMTP (Brevo, SendGrid, Mailgun, etc.)
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      console.log('[Email] Using custom SMTP:', process.env.SMTP_HOST);
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    // Option 2: Gmail shortcut
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      console.log('[Email] Using Gmail SMTP for:', process.env.GMAIL_USER);
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });
    }

    // Option 3: Ethereal (fake test emails — NOT delivered to real inboxes)
    console.log('[Email] WARNING: No SMTP configured. Using Ethereal test account.');
    console.log('[Email] Emails will NOT be delivered. Check server logs for preview URLs.');
    console.log('[Email] To send real emails, set GMAIL_USER + GMAIL_APP_PASSWORD in .env');
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  })();

  return transporterPromise;
}

function getFromAddress() {
  if (process.env.GMAIL_USER) return `"EduQuestJr" <${process.env.GMAIL_USER}>`;
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  return '"EduQuestJr" <noreply@eduquestjr.com>';
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(to, code) {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject: 'Verify your EduQuestJr email',
    html: `
      <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 16px;">
          <h1 style="color: #1e293b; font-size: 22px;">Welcome to EduQuestJr!</h1>
        </div>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Thank you for signing up! Use this code to verify your email:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; background: linear-gradient(135deg, #38bdf8, #818cf8); color: white; font-size: 28px; font-weight: 900; padding: 12px 32px; border-radius: 12px; letter-spacing: 6px;">
            ${code}
          </span>
        </div>
        <p style="color: #94a3b8; font-size: 13px; text-align: center;">
          This code expires in 15 minutes. If you didn't sign up, ignore this email.
        </p>
      </div>
    `,
  });

  // Log preview URL for Ethereal test emails
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('[Email] Verification email preview:', previewUrl);
  } else {
    console.log('[Email] Verification email sent to:', to);
  }

  return info;
}

/**
 * Send password reset email
 */
export async function sendResetEmail(to, code) {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject: 'Reset your EduQuestJr password',
    html: `
      <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 16px;">
          <h1 style="color: #1e293b; font-size: 22px;">Password Reset</h1>
        </div>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          You requested a password reset for your EduQuestJr account. Use this code:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; background: linear-gradient(135deg, #fb923c, #f472b6); color: white; font-size: 28px; font-weight: 900; padding: 12px 32px; border-radius: 12px; letter-spacing: 6px;">
            ${code}
          </span>
        </div>
        <p style="color: #94a3b8; font-size: 13px; text-align: center;">
          This code expires in 15 minutes. If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('[Email] Reset email preview:', previewUrl);
  } else {
    console.log('[Email] Reset email sent to:', to);
  }

  return info;
}
