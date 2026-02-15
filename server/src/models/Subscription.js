import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planType: { type: String, enum: ['free', 'monthly', '6months', 'yearly'], default: 'free' },
    paypalSubscriptionId: { type: String, default: null },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'pending'],
      default: 'pending',
    },
    currentPeriodEnd: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Subscription', subscriptionSchema);
