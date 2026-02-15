import Game from '../models/Game.js';

export async function list(req, res, next) {
  try {
    const { category, isPremium } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (isPremium !== undefined) filter.isPremium = isPremium === 'true';
    const games = await Game.find(filter).sort({ category: 1, title: 1 });
    res.json({ games });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const game = await Game.findOne({ slug: req.params.slug, isActive: true });
    if (!game) return res.status(404).json({ message: 'Game not found' });
    res.json({ game });
  } catch (err) {
    next(err);
  }
}
