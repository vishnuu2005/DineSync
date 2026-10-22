const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Administrator privileges required.' });
};

const chefOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'chef' || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Kitchen Chef privileges required.' });
};

const waiterOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'waiter' || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Waiter staff privileges required.' });
};

const staffOnly = (req, res, next) => {
  if (req.user && ['admin', 'chef', 'waiter'].includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Authorized restaurant staff privileges required.' });
};

module.exports = {
  adminOnly,
  chefOnly,
  waiterOnly,
  staffOnly,
};
