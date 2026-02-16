import * as ai from '../services/ai.js';
import Progress from '../models/Progress.js';
import Game from '../models/Game.js';
import Child from '../models/Child.js';

export async function getHint(req, res, next) {
  try {
    const { gameType, context, score, accuracy, childAge } = req.query;
    if (!gameType) return res.status(400).json({ message: 'gameType required' });
    const hint = score != null
      ? await ai.getAdaptiveHint(gameType, score || 0, accuracy || 0, childAge || 5)
      : await ai.getHint(gameType, context || '');
    res.json({ hint: hint || 'Keep trying! You can do it!' });
  } catch (err) {
    next(err);
  }
}

export async function getRecommendation(req, res, next) {
  try {
    const { childId } = req.query;
    if (!childId) return res.status(400).json({ message: 'childId required' });
    const child = await Child.findOne({ _id: childId, parentId: req.user._id });
    if (!child) return res.status(404).json({ message: 'Child not found' });
    const recent = await Progress.find({ childId }).populate('gameId', 'slug category').sort({ completedAt: -1 }).limit(10);
    const recentGames = recent.map((r) => ({ slug: r.gameId?.slug, category: r.gameId?.category, accuracy: r.accuracy }));
    const weakCategories = [];
    const byCat = {};
    recent.forEach((r) => {
      const c = r.gameId?.category || 'other';
      if (!byCat[c]) byCat[c] = { sum: 0, n: 0 };
      byCat[c].sum += r.accuracy;
      byCat[c].n += 1;
    });
    Object.entries(byCat).forEach(([cat, v]) => {
      if (v.n >= 2 && v.sum / v.n < 60) weakCategories.push(cat);
    });
    const slug = await ai.getPersonalizedRecommendation(child._id, child.age, recentGames, weakCategories);
    const game = await Game.findOne({ slug, isActive: true });
    res.json({ recommendedSlug: slug, game: game ? { title: game.title, slug: game.slug } : null });
  } catch (err) {
    next(err);
  }
}

export async function getEncouragement(req, res, next) {
  try {
    const { childName, childAge, level, streak, recentAccuracy } = req.query;
    const name = childName || 'friend';
    const streakNum = parseInt(streak) || 0;
    const levelNum = parseInt(level) || 1;
    const accNum = parseInt(recentAccuracy) || 0;

    const msg = `You are Buddy the Bear, a warm, gentle mascot for a children's learning app called EduQuestJr.
Generate a SHORT personalized greeting (under 20 words) for ${name}, age ${childAge || 5}.
They are level ${levelNum} with a ${streakNum}-day streak.
${streakNum >= 3 ? 'Mention their amazing streak!' : ''}
${levelNum >= 5 ? 'Mention how far they have come!' : ''}
${accNum >= 80 ? 'They are doing great - be excited!' : accNum <= 30 ? 'They might need encouragement - be extra gentle and warm.' : ''}
Use simple words a 4-year-old would understand. Be warm, excited, and personal. Use their name "${name}".
Just the greeting, no quotes or prefixes.`;

    const result = await ai.smartChat([{ role: 'user', content: msg }], { max_tokens: 40 });

    const fallbacks = [];
    const timeWord = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';
    fallbacks.push(`Good ${timeWord}, ${name}! Ready for some fun learning today?`);
    fallbacks.push(`Hey ${name}! Let's discover something amazing today! 🌟`);
    fallbacks.push(`Welcome back, ${name}! Your brain is going to grow so much today!`);
    if (streakNum >= 3) fallbacks.push(`Wow ${name}, ${streakNum} days in a row! You're a superstar! ⭐`);
    if (levelNum >= 5) fallbacks.push(`Level ${levelNum} already, ${name}! You're becoming a super learner! 🚀`);
    const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];

    res.json({ message: result || fallback });
  } catch (err) {
    const name = req.query.childName || 'friend';
    res.json({ message: `Hey ${name}! Let's learn something amazing today! 🌟` });
  }
}

export async function getSuggestedLevel(req, res, next) {
  try {
    const { childId, gameSlug } = req.query;
    if (!childId) return res.status(400).json({ message: 'childId required' });

    const child = await Child.findOne({ _id: childId, parentId: req.user._id });
    if (!child) return res.status(404).json({ message: 'Child not found' });

    // Find the highest completed level for this game
    const completedForGame = (child.completedGameLevels || [])
      .filter(cl => cl.gameSlug === gameSlug)
      .sort((a, b) => b.level - a.level);

    if (completedForGame.length === 0) {
      return res.json({ suggestedLevel: 1, reason: 'First time playing! Start here! 🌱' });
    }

    const highestCompleted = completedForGame[0].level;
    const avgAccuracy = completedForGame.slice(0, 3).reduce((s, cl) => s + cl.bestAccuracy, 0)
      / Math.min(3, completedForGame.length);

    // Suggest the next unlocked level
    let suggested = Math.min(30, highestCompleted + 1);
    
    // If recent accuracy is low, suggest replaying the current level
    if (avgAccuracy < 60 && highestCompleted > 1) {
      suggested = highestCompleted;
    }

    const reason = suggested > highestCompleted
      ? 'Ready for the next challenge! 🚀'
      : 'Let\'s practice this level more! 💪';

    res.json({
      suggestedLevel: suggested,
      reason,
      highestCompleted,
      recentAccuracy: Math.round(avgAccuracy),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/ai/chat - AI Chat Friend (Buddy the Bear)
 * Body: { childId, message, history }
 */
export async function chatWithBuddy(req, res, next) {
  try {
    const { childId, message, history = [], lang = 'en' } = req.body;
    if (!message) return res.status(400).json({ message: 'message required' });

    let childName = 'friend';
    let childAge = 5;

    if (childId) {
      const child = await Child.findOne({ _id: childId, parentId: req.user._id });
      if (child) {
        childName = child.name;
        childAge = child.age;
      }
    }

    const reply = await ai.chatWithBuddy(childName, childAge, message, history, lang);
    res.json({ reply });
  } catch (err) {
    next(err);
  }
}
