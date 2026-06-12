/**
 * Middleware factory: restrict access to specific roles.
 * Usage: router.get('/admin-only', authenticate, allowRoles('admin'), handler)
 *
 * @param  {...string} roles – allowed role names
 * @returns {import('express').RequestHandler}
 */
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have the required permissions.',
      });
    }
    next();
  };
};

module.exports = allowRoles;
