export function requirePremium(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const status = req.user.subscriptionStatus;
  const expiry = req.user.subscriptionExpiry;
  const isPremium = (status === 'active' || status === 'trial') && (!expiry || new Date(expiry) > new Date());
  if (!isPremium) {
    return res.status(403).json({
      message: 'Premium subscription required',
      code: 'PREMIUM_REQUIRED',
    });
  }
  next();
}
