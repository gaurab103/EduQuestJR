import mongoose from 'mongoose';

const skillStatSchema = new mongoose.Schema({
  skillId: String,
  masteryPercent: { type: Number, default: 0 },
  lastPlayedAt: Date,
});

const childSchema = new mongoose.Schema(
  {
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 1, max: 8 },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    avatarConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
    skillStats: [skillStatSchema],
    dailyPlayMinutesUsed: { type: Number, default: 0 },
    lastDailyReset: { type: Date, default: Date.now },
    currentStreak: { type: Number, default: 0 },
    lastPlayedDate: { type: Date, default: null },
    achievements: [{ slug: String, unlockedAt: { type: Date, default: Date.now } }],
    ownedStickers: [String],
    equippedStickers: [String],
    profileFrame: { type: String, default: '' },
    dailyTasksCompleted: [{ taskId: String, completedAt: { type: Date, default: Date.now } }],
    lastDailyTaskReset: { type: Date, default: Date.now },
    favoriteGameSlug: { type: String, default: '' },
    // Track completed game levels for locking/replay detection
    completedGameLevels: [{
      gameSlug: { type: String, required: true },
      level: { type: Number, required: true },
      completedAt: { type: Date, default: Date.now },
      bestAccuracy: { type: Number, default: 0 },
      bestScore: { type: Number, default: 0 },
    }],
    // Daily challenge tracking
    lastDailyChallengeDate: { type: String, default: '' },
    dailyChallengeUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Child', childSchema);
