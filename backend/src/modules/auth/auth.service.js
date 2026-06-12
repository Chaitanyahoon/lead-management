const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../../config/db');
const { sendWelcomeEmail } = require('../../utils/emailService');

/**
 * Register a new user.
 * @param {{ name: string, email: string, password: string, role: string }} data
 * @returns {Promise<object>} created user (without password_hash)
 */
const registerUser = async ({ name, email, password, role }) => {
  // Check for duplicate email
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    const err = new Error('A user with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  const result = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, is_active, created_at`,
    [name, email, password_hash, role]
  );

  const user = result.rows[0];

  // Fire-and-forget welcome email
  sendWelcomeEmail({ userEmail: user.email, userName: user.name, role: user.role });

  return user;
};

/**
 * Authenticate a user and return a JWT.
 * @param {{ email: string, password: string }} data
 * @returns {Promise<{ user: object, token: string }>}
 */
const loginUser = async ({ email, password }) => {
  const result = await query(
    'SELECT id, name, email, password_hash, role, is_active, created_at FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const user = result.rows[0];

  if (!user.is_active) {
    const err = new Error('Account is deactivated. Contact an administrator.');
    err.statusCode = 403;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const payload = { userId: user.id, email: user.email, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  // Remove password_hash before returning
  const { password_hash: _, ...safeUser } = user;

  return { user: safeUser, token };
};

/**
 * Fetch a user by id (excludes password_hash).
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
const getUserById = async (userId) => {
  const result = await query(
    'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  return result.rows[0];
};

module.exports = { registerUser, loginUser, getUserById };
