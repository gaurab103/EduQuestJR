const ROLES = ['parent', 'child', 'school_admin', 'super_admin'];

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const role = req.user.role;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

export function requireSuperAdmin(req, res, next) {
  return requireRole('super_admin')(req, res, next);
}

export function requireParent(req, res, next) {
  return requireRole('parent', 'super_admin')(req, res, next);
}
