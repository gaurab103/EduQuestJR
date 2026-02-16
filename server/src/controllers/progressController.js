import Child from '../models/Child.js';
import Game from '../models/Game.js';
import Progress from '../models/Progress.js';
import User from '../models/User.js';
import { ensureDailyReset } from '../services/dailyLimit.js';
import { checkAchievements } from '../services/achievementChecker.js';
import {
  DAILY_FREE_PLAY_MINUTES,
  levelFromXP,
  xpToNextLevel,
  progressToNextLevel,
} from '../utils/gamification.js';

const PREMIUM_LEVEL_THRESHOLD = 16; // levels 16+ require subscription

/**
 * GET /api/children/:childId/play-status?gameSlug=...
 * Returns child, game, canPlay, minutesLeftToday, reason (if cannot play).
 * Also returns completedLevels for lock system.
 */
export async function getPlayStatus(req, res, next) {
  try {
    const { childId } = req.params;
    const { gameSlug } = req.query;
    if (!gameSlug) {
      return res.status(400).json({ message: 'gameSlug is required' });
    }

    const child = await Child.findOne({ _id: childId, parentId: req.user._id });
    if (!child) return res.status(404).json({ message: 'Child not found' });

    const didReset = ensureDailyReset(child);
    if (didReset) await child.save();

    const game = await Game.findOne({ slug: gameSlug, isActive: true });
    if (!game) return res.status(404).json({ message: 'Game not found' });

    const user = await User.findById(req.user._id).select('subscriptionStatus subscriptionExpiry');
    const isPremium =
      (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trial') &&
      (!user.subscriptionExpiry || new Date(user.subscriptionExpiry) > new Date());

    const dailyUsed = child.dailyPlayMinutesUsed ?? 0;
    const minutesLeft = isPremium ? 999 : Math.max(0, DAILY_FREE_PLAY_MINUTES - dailyUsed);
    let canPlay = true;
    let reason = null;

    if (game.isPremium && !isPremium) {
      canPlay = false;
      reason = 'PREMIUM_REQUIRED';
    } else if (!isPremium && minutesLeft <= 0) {
      canPlay = false;
      reason = 'DAILY_LIMIT_REACHED';
    }

    // Get completed levels for this game
    const completedLevels = (child.completedGameLevels || [])
      .filter(cl => cl.gameSlug === gameSlug)
      .map(cl => ({
        level: cl.level,
        bestAccuracy: cl.bestAccuracy || 0,
        bestScore: cl.bestScore || 0,
      }));

    const xpToNext = xpToNextLevel(child.xp);
    const progressPct = progressToNextLevel(child.xp);

    res.json({
      child: {
        _id: child._id,
        name: child.name,
        age: child.age,
        level: child.level,
        xp: child.xp,
        coins: child.coins,
        dailyPlayMinutesUsed: child.dailyPlayMinutesUsed,
        currentStreak: child.currentStreak,
        xpToNextLevel: xpToNext,
        progressToNextLevel: progressPct,
      },
      game: {
        _id: game._id,
        title: game.title,
        slug: game.slug,
        category: game.category,
        rewards: game.rewards,
      },
      canPlay,
      minutesLeftToday: minutesLeft,
      reason,
      isPremium,
      completedLevels,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/progress
 * Body: { childId, gameSlug, score, accuracy, timeSpentSeconds, gameLevel }
 * Creates progress record, updates child XP/coins/level, enforces daily limit.
 * Handles level locking, premium level gates, and no-repeat XP.
 */
export async function submitProgress(req, res, next) {
  try {
    const { childId, gameSlug, score = 0, accuracy = 0, timeSpentSeconds = 0, gameLevel = 1 } = req.body;
    if (!childId || !gameSlug) {
      return res.status(400).json({ message: 'childId and gameSlug are required' });
    }

    const child = await Child.findOne({ _id: childId, parentId: req.user._id });
    if (!child) return res.status(404).json({ message: 'Child not found' });

    const didReset = ensureDailyReset(child);
    if (didReset) await child.save();

    const game = await Game.findOne({ slug: gameSlug, isActive: true });
    if (!game) return res.status(404).json({ message: 'Game not found' });
    const gameId = game._id;

    const user = await User.findById(req.user._id).select('subscriptionStatus subscriptionExpiry');
    const isPremium =
      (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trial') &&
      (!user.subscriptionExpiry || new Date(user.subscriptionExpiry) > new Date());

    if (game.isPremium && !isPremium) {
      return res.status(403).json({ message: 'Premium subscription required', code: 'PREMIUM_REQUIRED' });
    }

    // Premium level gate: levels 16+ require subscription
    if (gameLevel >= PREMIUM_LEVEL_THRESHOLD && !isPremium) {
      return res.status(403).json({
        message: `Level ${gameLevel} requires a Premium subscription!`,
        code: 'PREMIUM_LEVEL_REQUIRED',
      });
    }

    // Level lock check: must complete previous level first (level 1 always unlocked)
    if (gameLevel > 1) {
      const prevCompleted = (child.completedGameLevels || []).some(
        cl => cl.gameSlug === gameSlug && cl.level === gameLevel - 1
      );
      if (!prevCompleted) {
        return res.status(403).json({
          message: `Complete level ${gameLevel - 1} first!`,
          code: 'LEVEL_LOCKED',
        });
      }
    }

    // Check if this level was already completed (replay detection)
    const existingCompletion = (child.completedGameLevels || []).find(
      cl => cl.gameSlug === gameSlug && cl.level === gameLevel
    );
    const isReplay = !!existingCompletion;

    // Daily play time tracking
    const dailyUsed = child.dailyPlayMinutesUsed ?? 0;
    const minutesLeft = isPremium ? 999 : Math.max(0, DAILY_FREE_PLAY_MINUTES - dailyUsed);
    const minutesToCharge = isPremium
      ? timeSpentSeconds / 60
      : Math.min(timeSpentSeconds / 60, minutesLeft);
    const newDailyUsed = (child.dailyPlayMinutesUsed ?? 0) + minutesToCharge;
    child.dailyPlayMinutesUsed = newDailyUsed;

    // Level-scaled rewards: higher game levels = much more XP & coins
    const baseXP = (game.rewards?.xp) || 10;
    const baseCoins = (game.rewards?.coins) || 5;
    // Level multiplier: level 1 = 0.5x, level 10 = 1.5x, level 20 = 2.5x, level 30 = 3.5x
    const levelMultiplier = 0.5 + (gameLevel - 1) * 0.1;
    // Accuracy multiplier: 0% = 0.3x, 100% = 1.2x
    const accuracyMultiplier = 0.3 + (accuracy / 100) * 0.9;
    let xpEarned = Math.max(1, Math.round(baseXP * levelMultiplier * accuracyMultiplier));
    let coinsEarned = Math.max(0, Math.round(baseCoins * levelMultiplier * accuracyMultiplier));

    // Check daily challenge 2x bonus
    const todayStr = new Date().toISOString().split('T')[0];
    let dailyBonusApplied = false;
    if (child.lastDailyChallengeDate !== todayStr) {
      // First completion of the day: apply 2x bonus
      xpEarned *= 2;
      coinsEarned *= 2;
      child.lastDailyChallengeDate = todayStr;
      child.dailyChallengeUsed = true;
      dailyBonusApplied = true;
    }

    // NO XP/COINS for replays - can still play but zero rewards
    if (isReplay) {
      xpEarned = 0;
      coinsEarned = 0;
    }

    const progress = await Progress.create({
      childId: child._id,
      gameId,
      score,
      accuracy,
      timeSpent: timeSpentSeconds,
      completedAt: new Date(),
      metadata: { gameLevel, isReplay },
    });

    const previousLevel = child.level;
    child.xp = (child.xp || 0) + xpEarned;
    child.coins = (child.coins || 0) + coinsEarned;
    child.level = levelFromXP(child.xp);
    const levelUp = child.level > previousLevel;

    // Update streak
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const lastPlayed = child.lastPlayedDate ? new Date(child.lastPlayedDate) : null;
    if (lastPlayed) lastPlayed.setUTCHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    if (!lastPlayed || lastPlayed.getTime() < yesterday.getTime()) {
      child.currentStreak = 1;
    } else if (lastPlayed.getTime() === yesterday.getTime()) {
      child.currentStreak = (child.currentStreak || 0) + 1;
    }
    child.lastPlayedDate = today;

    // Record level completion (or update best score)
    if (!isReplay && accuracy >= 50) {
      // Only mark as complete if accuracy >= 50%
      if (!child.completedGameLevels) child.completedGameLevels = [];
      child.completedGameLevels.push({
        gameSlug,
        level: gameLevel,
        completedAt: new Date(),
        bestAccuracy: accuracy,
        bestScore: score,
      });
    } else if (isReplay) {
      // Update best score if improved
      const idx = child.completedGameLevels.findIndex(
        cl => cl.gameSlug === gameSlug && cl.level === gameLevel
      );
      if (idx >= 0) {
        if (accuracy > child.completedGameLevels[idx].bestAccuracy) {
          child.completedGameLevels[idx].bestAccuracy = accuracy;
        }
        if (score > child.completedGameLevels[idx].bestScore) {
          child.completedGameLevels[idx].bestScore = score;
        }
      }
    }

    // Check for new achievements
    const newAchievements = await checkAchievements(child);
    await child.save();

    res.status(201).json({
      progress: {
        _id: progress._id,
        score: progress.score,
        accuracy: progress.accuracy,
        timeSpent: progress.timeSpent,
      },
      child: {
        _id: child._id,
        level: child.level,
        xp: child.xp,
        coins: child.coins,
        dailyPlayMinutesUsed: child.dailyPlayMinutesUsed,
        currentStreak: child.currentStreak,
      },
      rewards: {
        xp: xpEarned,
        coins: coinsEarned,
        levelUp,
        previousLevel,
        newLevel: child.level,
        newAchievements,
        isReplay,
        dailyBonusApplied,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/children/:childId/progress - list progress records for analytics
 */
export async function listProgress(req, res, next) {
  try {
    const { childId } = req.params;
    const child = await Child.findOne({ _id: childId, parentId: req.user._id });
    if (!child) return res.status(404).json({ message: 'Child not found' });

    const list = await Progress.find({ childId: child._id })
      .populate('gameId', 'title slug category')
      .sort({ completedAt: -1 })
      .limit(50)
      .lean();

    res.json({ progress: list });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/children/:childId/completed-levels?gameSlug=...
 * Returns all completed levels for a game.
 */
export async function getCompletedLevels(req, res, next) {
  try {
    const { childId } = req.params;
    const { gameSlug } = req.query;
    const child = await Child.findOne({ _id: childId, parentId: req.user._id });
    if (!child) return res.status(404).json({ message: 'Child not found' });

    const completed = (child.completedGameLevels || [])
      .filter(cl => !gameSlug || cl.gameSlug === gameSlug)
      .map(cl => ({
        gameSlug: cl.gameSlug,
        level: cl.level,
        bestAccuracy: cl.bestAccuracy,
        bestScore: cl.bestScore,
      }));

    res.json({ completedLevels: completed });
  } catch (err) {
    next(err);
  }
}
