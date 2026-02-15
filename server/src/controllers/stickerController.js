import Child from '../models/Child.js';
import Sticker from '../models/Sticker.js';

export async function listStickers(req, res, next) {
  try {
    const stickers = await Sticker.find().sort({ price: 1 }).lean();
    res.json({ stickers });
  } catch (err) {
    next(err);
  }
}

export async function buySticker(req, res, next) {
  try {
    const { childId, stickerSlug } = req.body;
    if (!childId || !stickerSlug) return res.status(400).json({ message: 'childId and stickerSlug required' });

    const child = await Child.findOne({ _id: childId, parentId: req.user._id });
    if (!child) return res.status(404).json({ message: 'Child not found' });

    const sticker = await Sticker.findOne({ slug: stickerSlug });
    if (!sticker) return res.status(404).json({ message: 'Sticker not found' });

    if ((child.ownedStickers || []).includes(stickerSlug)) {
      return res.status(400).json({ message: 'Already owned' });
    }

    if ((child.coins || 0) < sticker.price) {
      return res.status(400).json({ message: 'Not enough coins' });
    }

    child.coins -= sticker.price;
    child.ownedStickers = child.ownedStickers || [];
    child.ownedStickers.push(stickerSlug);
    await child.save();

    res.json({ child: { coins: child.coins, ownedStickers: child.ownedStickers }, sticker });
  } catch (err) {
    next(err);
  }
}

export async function equipStickers(req, res, next) {
  try {
    const { childId, stickerSlugs } = req.body;
    if (!childId || !stickerSlugs) return res.status(400).json({ message: 'childId and stickerSlugs required' });

    const child = await Child.findOne({ _id: childId, parentId: req.user._id });
    if (!child) return res.status(404).json({ message: 'Child not found' });

    // Validate all selected stickers are owned
    const owned = new Set(child.ownedStickers || []);
    const valid = stickerSlugs.filter(s => owned.has(s)).slice(0, 5);

    child.equippedStickers = valid;
    await child.save();

    res.json({ equippedStickers: child.equippedStickers });
  } catch (err) {
    next(err);
  }
}
