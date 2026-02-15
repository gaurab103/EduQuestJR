import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ['parent', 'child', 'school_admin', 'super_admin'],
      default: 'parent',
    },
    subscriptionStatus: {
      type: String,
      enum: ['free', 'active', 'cancelled', 'expired'],
      default: 'free',
    },
    subscriptionExpiry: { type: Date, default: null },
    // Email verification
    emailVerified: { type: Boolean, default: false },
    verificationCode: { type: String, default: null },
    verificationCodeExpiry: { type: Date, default: null },
    // Password reset
    resetCode: { type: String, default: null },
    resetCodeExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
