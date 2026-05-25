// Usage: router.get('/route', protect, authorizeRole('farmer'), handler)
// Usage: router.get('/route', protect, authorizeRole('admin', 'farmer'), handler)

const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }
    next();
  };
};

module.exports = authorizeRole;
