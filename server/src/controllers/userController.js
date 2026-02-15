import User from '../models/User.js';

export async function getProfile(req, res, next) {
  try {
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
}
