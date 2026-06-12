const { validationResult } = require('express-validator');
const authService = require('./auth.service');

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, role } = req.body;
    const user = await authService.registerUser({ name, email, password, role });

    return res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const { user, token } = await authService.loginUser({ email, password });

    return res.status(200).json({ success: true, data: { user, token } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me  (protected)
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.userId);
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout  (protected)
 * Stateless JWT — nothing to invalidate server-side.
 */
const logout = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully. Please discard the token on the client.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, logout };
