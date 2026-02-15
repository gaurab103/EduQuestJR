import Achievement from '../models/Achievement.js';
import Progress from '../models/Progress.js';

export async function checkAchievements(child) {
  const allAchievements = await Achievement.find().lean();
  const earnedSlugs = new Set((child.achievements || []).map(a => a.slug));
  const newlyEarned = [];

  for (const ach of allAchievements) {
    if (earnedSlugs.has(ach.slug)) continue;

    let earned = false;

    switch (ach.criteriaType) {
      case 'first_game': {
        const count = await Progress.countDocuments({ childId: child._id });
        earned = count >= 1;
        break;
      }
      case 'games_played': {
        const count = await Progress.countDocuments({ childId: child._id });
        earned = count >= ach.threshold;
        break;
      }
      case 'perfect_score': {
        const perfect = await Progress.findOne({ childId: child._id, accuracy: { $gte: ach.threshold } });
        earned = !!perfect;
        break;
      }
      case 'streak': {
        earned = (child.currentStreak || 0) >= ach.threshold;
        break;
      }
      case 'categories_tried': {
        const cats = await Progress.distinct('gameId', { childId: child._id });
        // We need to get unique categories from games
        if (cats.length > 0) {
          const Game = (await import('../models/Game.js')).default;
          const games = await Game.find({ _id: { $in: cats } }).select('category').lean();
          const uniqueCats = new Set(games.map(g => g.category));
          earned = uniqueCats.size >= ach.threshold;
        }
        break;
      }
      case 'level_reached': {
        earned = (child.level || 1) >= ach.threshold;
        break;
      }
      case 'total_xp': {
        earned = (child.xp || 0) >= ach.threshold;
        break;
      }
    }

    if (earned) {
      newlyEarned.push({ slug: ach.slug, title: ach.title, icon: ach.icon, description: ach.description });
      child.achievements = child.achievements || [];
      child.achievements.push({ slug: ach.slug, unlockedAt: new Date() });
    }
  }

  return newlyEarned;
}
