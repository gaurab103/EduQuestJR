import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
    gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
    score: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

progressSchema.index({ childId: 1, gameId: 1 });

export default mongoose.model('Progress', progressSchema);
