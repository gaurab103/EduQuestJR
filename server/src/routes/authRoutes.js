import express from 'express';
import {
  register,
  login,
  me,
  updateProfile,
  verifyEmail,
  resendVerification,
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, me);
router.patch('/profile', authMiddleware, updateProfile);

// Email verification
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Password reset
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

export default router;
