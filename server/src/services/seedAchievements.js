import Achievement from '../models/Achievement.js';

const ACHIEVEMENTS = [
  { slug: 'first-steps', title: 'First Steps', description: 'Complete your first game', icon: '👣', criteriaType: 'first_game', threshold: 1 },
  { slug: 'rising-star', title: 'Rising Star', description: 'Complete 5 games', icon: '⭐', criteriaType: 'games_played', threshold: 5 },
  { slug: 'game-master', title: 'Game Master', description: 'Complete 25 games', icon: '🏅', criteriaType: 'games_played', threshold: 25 },
  { slug: 'century', title: 'Century Club', description: 'Complete 100 games', icon: '💯', criteriaType: 'games_played', threshold: 100 },
  { slug: 'perfectionist', title: 'Perfectionist', description: 'Get a perfect score', icon: '💎', criteriaType: 'perfect_score', threshold: 100 },
  { slug: 'streak-3', title: 'Hot Streak', description: '3-day play streak', icon: '🔥', criteriaType: 'streak', threshold: 3 },
  { slug: 'streak-7', title: 'Streak Master', description: '7-day play streak', icon: '🌟', criteriaType: 'streak', threshold: 7 },
  { slug: 'streak-30', title: 'Unstoppable', description: '30-day play streak', icon: '🏆', criteriaType: 'streak', threshold: 30 },
  { slug: 'explorer-3', title: 'Explorer', description: 'Try 3 different categories', icon: '🧭', criteriaType: 'categories_tried', threshold: 3 },
  { slug: 'explorer-all', title: 'World Traveler', description: 'Try all 7 categories', icon: '🌍', criteriaType: 'categories_tried', threshold: 7 },
  { slug: 'level-5', title: 'Growing Up', description: 'Reach level 5', icon: '🌱', criteriaType: 'level_reached', threshold: 5 },
  { slug: 'level-10', title: 'Super Learner', description: 'Reach level 10', icon: '🚀', criteriaType: 'level_reached', threshold: 10 },
  { slug: 'xp-500', title: 'XP Hunter', description: 'Earn 500 XP total', icon: '✨', criteriaType: 'total_xp', threshold: 500 },
  { slug: 'xp-2000', title: 'XP Legend', description: 'Earn 2000 XP total', icon: '👑', criteriaType: 'total_xp', threshold: 2000 },
  { slug: 'brain-power', title: 'Brain Power', description: 'Complete 50 games', icon: '🧠', criteriaType: 'games_played', threshold: 50 },
];

export async function seedAchievements() {
  for (const a of ACHIEVEMENTS) {
    await Achievement.findOneAndUpdate({ slug: a.slug }, a, { upsert: true });
  }
}
