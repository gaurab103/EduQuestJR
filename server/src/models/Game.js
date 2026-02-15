import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: {
      type: String,
      enum: [
        'cognitive',
        'literacy',
        'numeracy',
        'creativity',
        'sel',
        'future_skills',
        'motor',
        'auditory',
      ],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy',
    },
    isPremium: { type: Boolean, default: false },
    rewards: {
      xp: { type: Number, default: 10 },
      coins: { type: Number, default: 5 },
    },
    minAge: { type: Number, default: 1 },
    maxAge: { type: Number, default: 8 },
    icon: { type: String, default: '' },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Game', gameSchema);
