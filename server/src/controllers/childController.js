import Child from '../models/Child.js';
import User from '../models/User.js';

const FREE_CHILD_LIMIT = 1;

export async function list(req, res, next) {
  try {
    const children = await Child.find({ parentId: req.user._id }).sort({ createdAt: -1 });
    res.json({ children });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { name, age, avatarConfig } = req.body;
    if (!name || age == null) {
      return res.status(400).json({ message: 'Name and age are required' });
    }
    const user = await User.findById(req.user._id).select('subscriptionStatus');
    const isPremium = user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trial';
    const childCount = await Child.countDocuments({ parentId: req.user._id });
    if (!isPremium && childCount >= FREE_CHILD_LIMIT) {
      return res.status(403).json({
        message: `Free accounts can add up to ${FREE_CHILD_LIMIT} child. Upgrade to Premium for unlimited children.`,
        code: 'CHILD_LIMIT_REACHED',
      });
    }
    const child = await Child.create({
      parentId: req.user._id,
      name,
      age: Number(age),
      avatarConfig: avatarConfig || {},
    });
    res.status(201).json({ child });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const child = await Child.findOne({
      _id: req.params.id,
      parentId: req.user._id,
    });
    if (!child) return res.status(404).json({ message: 'Child not found' });
    res.json({ child });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const child = await Child.findOneAndUpdate(
      { _id: req.params.id, parentId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!child) return res.status(404).json({ message: 'Child not found' });
    res.json({ child });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const child = await Child.findOneAndDelete({
      _id: req.params.id,
      parentId: req.user._id,
    });
    if (!child) return res.status(404).json({ message: 'Child not found' });
    res.json({ message: 'Child profile deleted' });
  } catch (err) {
    next(err);
  }
}
