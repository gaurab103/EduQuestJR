import Game from '../models/Game.js';
import Child from '../models/Child.js';
import Progress from '../models/Progress.js';

function hashDate(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Build personalized daily tasks based on child's progress.
 * Includes game-specific "Complete Level X-Y" tasks.
 */
function getDailyTasks(dateStr, games, childProgress) {
  const h = hashDate(dateStr);

  // Find games the child has played and their current levels
  const progressMap = {};
  for (const p of (childProgress || [])) {
    const slug = p.gameId?.slug || p.gameSlug;
    if (!slug) continue;
    if (!progressMap[slug] || p.level > progressMap[slug].level) {
      progressMap[slug] = { level: p.level, slug, title: p.gameId?.title || slug };
    }
  }

  // Pick 2 games for personalized level tasks
  const playedGames = Object.values(progressMap).filter(g => g.level < 30);
  const unplayedGames = games.filter(g => !progressMap[g.slug]);

  // Task 1: Always a "play games" task
  const tasks = [
    {
      taskId: 'play-3',
      title: 'Play 3 Games',
      description: 'Complete any 3 games today',
      icon: '🎮',
      target: 3,
      type: 'games_count',
      reward: { coins: 15, xp: 20 },
    },
  ];

  // Task 2: Personalized game-level task
  if (playedGames.length > 0) {
    const g = playedGames[h % playedGames.length];
    const fromLevel = g.level + 1;
    const toLevel = Math.min(30, fromLevel + 1);
    tasks.push({
      taskId: `level-${g.slug}-${fromLevel}`,
      title: `${g.title} Lvl ${fromLevel}-${toLevel}`,
      description: `Complete ${g.title} from level ${fromLevel} to ${toLevel}`,
      icon: '📈',
      target: toLevel - fromLevel + 1,
      type: 'game_levels',
      gameSlug: g.slug,
      fromLevel,
      toLevel,
      reward: { coins: 20, xp: 25 },
    });
  } else if (unplayedGames.length > 0) {
    // If no played games, suggest trying a new game
    const g = unplayedGames[h % unplayedGames.length];
    tasks.push({
      taskId: `try-${g.slug}`,
      title: `Try ${g.title}`,
      description: `Play ${g.title} for the first time — complete level 1!`,
      icon: '🆕',
      target: 1,
      type: 'game_levels',
      gameSlug: g.slug,
      fromLevel: 1,
      toLevel: 1,
      reward: { coins: 15, xp: 20 },
    });
  } else {
    tasks.push({
      taskId: 'perfect-1',
      title: 'Perfect Score',
      description: 'Get 100% accuracy on any game',
      icon: '💎',
      target: 1,
      type: 'perfect_score',
      reward: { coins: 20, xp: 30 },
    });
  }

  // Task 3: Rotating task based on date
  const extraTasks = [
    { taskId: 'streak-play', title: 'Keep Your Streak', description: 'Play at least 1 game today', icon: '🔥', target: 1, type: 'games_count', reward: { coins: 5, xp: 10 } },
    { taskId: 'high-score', title: 'Score 80%+', description: 'Get 80% or higher accuracy', icon: '⭐', target: 80, type: 'accuracy_min', reward: { coins: 10, xp: 15 } },
    { taskId: 'category-2', title: 'Try 2 Categories', description: 'Play games from 2 different categories', icon: '🧭', target: 2, type: 'category_variety', reward: { coins: 10, xp: 15 } },
    { taskId: 'play-5', title: 'Play 5 Games', description: 'Complete 5 games today', icon: '🏆', target: 5, type: 'games_count', reward: { coins: 25, xp: 35 } },
  ];
  tasks.push(extraTasks[h % extraTasks.length]);

  // Task 4: Second personalized game task (different game)
  if (playedGames.length > 1) {
    const g2 = playedGames[(h + 1) % playedGames.length];
    if (g2.slug !== (playedGames[h % playedGames.length]?.slug)) {
      const fromLevel = g2.level + 1;
      const toLevel = Math.min(30, fromLevel + 1);
      tasks.push({
        taskId: `level-${g2.slug}-${fromLevel}`,
        title: `${g2.title} Lvl ${fromLevel}-${toLevel}`,
        description: `Complete ${g2.title} from level ${fromLevel} to ${toLevel}`,
        icon: '🎯',
        target: toLevel - fromLevel + 1,
        type: 'game_levels',
        gameSlug: g2.slug,
        fromLevel,
        toLevel,
        reward: { coins: 20, xp: 25 },
      });
    }
  }

  return tasks;
}

export async function getDailyChallenge(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const games = await Game.find({ isActive: true, isPremium: false }).lean();
    if (!games.length) return res.json({ challenge: null, dailyTasks: [] });

    const index = hashDate(today) % games.length;
    const game = games[index];

    // Get child's progress for personalized tasks
    const childId = req.query.childId;
    let childProgress = [];
    if (childId) {
      childProgress = await Progress.find({ childId })
        .populate('gameId', 'slug title category')
        .sort({ level: -1 })
        .lean();
    }

    const dailyTasks = getDailyTasks(today, games, childProgress);

    res.json({
      challenge: {
        date: today,
        game: { _id: game._id, title: game.title, slug: game.slug, category: game.category },
        bonusMultiplier: 2,
        label: 'Daily Challenge - 2x XP!',
      },
      dailyTasks,
    });
  } catch (err) {
    next(err);
  }
}

export async function getDailyTaskProgress(req, res, next) {
  try {
    const { childId } = req.query;
    if (!childId) return res.status(400).json({ message: 'childId required' });

    const child = await Child.findOne({ _id: childId, parentId: req.user._id });
    if (!child) return res.status(404).json({ message: 'Child not found' });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Reset daily tasks if new day
    const lastReset = child.lastDailyTaskReset ? new Date(child.lastDailyTaskReset) : new Date(0);
    lastReset.setUTCHours(0, 0, 0, 0);
    if (lastReset.getTime() < today.getTime()) {
      child.dailyTasksCompleted = [];
      child.lastDailyTaskReset = new Date();
      await child.save();
    }

    // Count today's progress
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayProgress = await Progress.find({ childId: child._id, completedAt: { $gte: todayStart } })
      .populate('gameId', 'category slug')
      .lean();

    const gamesPlayedToday = todayProgress.length;
    const categoriesPlayedToday = new Set(todayProgress.map(p => p.gameId?.category).filter(Boolean)).size;
    const bestAccuracyToday = todayProgress.length > 0 ? Math.max(...todayProgress.map(p => p.accuracy)) : 0;
    const hasPerfectToday = todayProgress.some(p => p.accuracy >= 100);

    // Game-specific level progress for personalized tasks
    const gameLevelsToday = {};
    for (const p of todayProgress) {
      const slug = p.gameId?.slug;
      if (!slug) continue;
      if (!gameLevelsToday[slug]) gameLevelsToday[slug] = [];
      gameLevelsToday[slug].push(p.level);
    }

    const completedTaskIds = new Set((child.dailyTasksCompleted || []).map(t => t.taskId));

    res.json({
      progress: {
        gamesPlayedToday,
        categoriesPlayedToday,
        bestAccuracyToday,
        hasPerfectToday,
        gameLevelsToday,
      },
      completedTaskIds: [...completedTaskIds],
    });
  } catch (err) {
    next(err);
  }
}

export async function completeDailyTask(req, res, next) {
  try {
    const { childId, taskId } = req.body;
    if (!childId || !taskId) return res.status(400).json({ message: 'childId and taskId required' });

    const child = await Child.findOne({ _id: childId, parentId: req.user._id });
    if (!child) return res.status(404).json({ message: 'Child not found' });

    const alreadyDone = (child.dailyTasksCompleted || []).some(t => t.taskId === taskId);
    if (alreadyDone) return res.json({ message: 'Already completed', child: { coins: child.coins, xp: child.xp } });

    child.dailyTasksCompleted = child.dailyTasksCompleted || [];
    child.dailyTasksCompleted.push({ taskId, completedAt: new Date() });

    // Give reward
    const taskRewards = { coins: 15, xp: 20 };
    child.coins = (child.coins || 0) + taskRewards.coins;
    child.xp = (child.xp || 0) + taskRewards.xp;
    await child.save();

    res.json({ message: 'Task completed!', child: { coins: child.coins, xp: child.xp }, reward: taskRewards });
  } catch (err) {
    next(err);
  }
}
