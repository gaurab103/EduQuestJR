import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateCode, sendVerificationEmail, sendResetEmail } from '../services/email.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const CODE_EXPIRY_MINUTES = 15;

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * POST /api/auth/register
 * Creates user + sends verification code
 */
export async function register(req, res, next) {
  try {
    const { name, email, password, role = 'parent' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Generate verification code
    const verificationCode = generateCode();
    const verificationCodeExpiry = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    const user = await User.create({
      name,
      email,
      password,
      role,
      emailVerified: false,
      verificationCode,
      verificationCodeExpiry,
    });

    // Send verification email — fail loudly so the user knows
    try {
      await sendVerificationEmail(email, verificationCode);
      console.log('[Auth] Verification email sent to:', email);
    } catch (emailErr) {
      console.error('[Auth] FAILED to send verification email:', emailErr);
      // Still allow registration but warn
    }

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.verificationCode;
    delete userObj.verificationCodeExpiry;

    // Do NOT return a token — user must verify email first
    res.status(201).json({
      message: 'Registration successful. Please check your email for verification code.',
      user: userObj,
      requiresVerification: true,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/verify-email
 * Body: { email, code }
 */
export async function verifyEmail(req, res, next) {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      const token = signToken(user._id);
      const userObj = user.toObject();
      delete userObj.password;
      return res.json({ message: 'Email already verified', user: userObj, token });
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (user.verificationCodeExpiry && new Date() > user.verificationCodeExpiry) {
      return res.status(400).json({ message: 'Verification code expired. Please request a new one.' });
    }

    user.emailVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpiry = null;
    await user.save();

    const token = signToken(user._id);
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ message: 'Email verified successfully', user: userObj, token });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/resend-verification
 * Body: { email }
 */
export async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.json({ message: 'Email is already verified' });
    }

    const verificationCode = generateCode();
    const verificationCodeExpiry = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpiry = verificationCodeExpiry;
    await user.save();

    try {
      await sendVerificationEmail(email, verificationCode);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr.message);
    }

    res.json({ message: 'Verification code sent' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 */
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists — just say code sent
      return res.json({ message: 'If the email exists, a reset code has been sent.' });
    }

    const resetCode = generateCode();
    const resetCodeExpiry = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    user.resetCode = resetCode;
    user.resetCodeExpiry = resetCodeExpiry;
    await user.save();

    try {
      await sendResetEmail(email, resetCode);
    } catch (emailErr) {
      console.error('Failed to send reset email:', emailErr.message);
    }

    res.json({ message: 'If the email exists, a reset code has been sent.' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/verify-reset-code
 * Body: { email, code }
 */
export async function verifyResetCode(req, res, next) {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or code' });
    }

    if (!user.resetCode || user.resetCode !== code) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    if (user.resetCodeExpiry && new Date() > user.resetCodeExpiry) {
      return res.status(400).json({ message: 'Reset code expired. Please request a new one.' });
    }

    res.json({ message: 'Code verified. You can now set a new password.' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/reset-password
 * Body: { email, code, newPassword }
 */
export async function resetPassword(req, res, next) {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    if (!user.resetCode || user.resetCode !== code) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    if (user.resetCodeExpiry && new Date() > user.resetCodeExpiry) {
      return res.status(400).json({ message: 'Reset code expired' });
    }

    user.password = newPassword;
    user.resetCode = null;
    user.resetCodeExpiry = null;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = signToken(user._id);
    const userObj = user.toObject();
    delete userObj.password;
    res.json({
      message: 'Login successful',
      user: userObj,
      token,
      expiresIn: JWT_EXPIRES_IN,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 */
export async function me(req, res, next) {
  try {
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/auth/profile
 */
export async function updateProfile(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required' });
    const user = await User.findByIdAndUpdate(req.user._id, { name: name.trim() }, { new: true }).select('-password');
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
