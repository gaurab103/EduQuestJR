import Child from '../models/Child.js';
import Progress from '../models/Progress.js';
import Game from '../models/Game.js';

export async function getAnalytics(req, res, next) {
  try {
    const { childId } = req.params;
    const child = await Child.findOne({ _id: childId, parentId: req.user._id });
    if (!child) return res.status(404).json({ message: 'Child not found' });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // All progress records in last 30 days
    const recentProgress = await Progress.find({
      childId: child._id,
      completedAt: { $gte: thirtyDaysAgo },
    }).populate('gameId', 'title slug category').sort({ completedAt: -1 }).lean();

    // Total games ever
    const totalGames = await Progress.countDocuments({ childId: child._id });

    // Average accuracy
    const avgResult = await Progress.aggregate([
      { $match: { childId: child._id } },
      { $group: { _id: null, avgAccuracy: { $avg: '$accuracy' }, avgScore: { $avg: '$score' } } },
    ]);
    const avgAccuracy = avgResult[0]?.avgAccuracy || 0;
    const avgScore = avgResult[0]?.avgScore || 0;

    // Games per day (last 30 days)
    const dailyActivity = {};
    for (const p of recentProgress) {
      const day = new Date(p.completedAt).toISOString().slice(0, 10);
      dailyActivity[day] = (dailyActivity[day] || 0) + 1;
    }

    // Category breakdown
    const categoryBreakdown = {};
    const categoryAccuracy = {};
    for (const p of recentProgress) {
      const cat = p.gameId?.category || 'unknown';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
      if (!categoryAccuracy[cat]) categoryAccuracy[cat] = [];
      categoryAccuracy[cat].push(p.accuracy);
    }
    const categoryStats = Object.entries(categoryBreakdown).map(([cat, count]) => ({
      category: cat,
      count,
      avgAccuracy: Math.round(categoryAccuracy[cat].reduce((a, b) => a + b, 0) / categoryAccuracy[cat].length),
    })).sort((a, b) => b.count - a.count);

    // Top 5 games
    const gameCount = {};
    for (const p of recentProgress) {
      const slug = p.gameId?.slug || 'unknown';
      const title = p.gameId?.title || slug;
      if (!gameCount[slug]) gameCount[slug] = { title, slug, count: 0 };
      gameCount[slug].count++;
    }
    const topGames = Object.values(gameCount).sort((a, b) => b.count - a.count).slice(0, 5);

    // Accuracy trend (last 10 games)
    const accuracyTrend = recentProgress.slice(0, 10).reverse().map(p => ({
      accuracy: p.accuracy,
      date: p.completedAt,
      game: p.gameId?.title || '',
    }));

    res.json({
      child: { _id: child._id, name: child.name, level: child.level, xp: child.xp, coins: child.coins, currentStreak: child.currentStreak },
      totalGames,
      avgAccuracy: Math.round(avgAccuracy),
      avgScore: Math.round(avgScore),
      dailyActivity,
      categoryStats,
      topGames,
      accuracyTrend,
      recentGames: recentProgress.slice(0, 10).map(p => ({
        game: p.gameId?.title || '',
        slug: p.gameId?.slug || '',
        category: p.gameId?.category || '',
        score: p.score,
        accuracy: p.accuracy,
        date: p.completedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}
