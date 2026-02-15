import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  criteriaType: { type: String, required: true, enum: ['games_played', 'perfect_score', 'streak', 'categories_tried', 'level_reached', 'total_xp', 'first_game'] },
  threshold: { type: Number, default: 1 },
}, { timestamps: true });

export default mongoose.model('Achievement', achievementSchema);
