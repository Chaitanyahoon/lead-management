require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');

const { swaggerSpec } = require('./config/swagger');
const auditLogger = require('./middleware/auditLogger');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./modules/auth/auth.routes');
const leadsRoutes = require('./modules/leads/leads.routes');
const activityRoutes = require('./modules/activity/activity.routes');

const app = express();

// Trust Render's reverse proxy for correct client IP rate limiting
app.set('trust proxy', 1);

// ── Core middleware ─────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // disable CSP to avoid blocking Swagger UI assets in development
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors());
app.use(express.json());

// ── Audit logger (runs after response via res.on('finish')) ─
app.use(auditLogger);

// ── Rate limiting ───────────────────────────────────────────
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

// ── Swagger UI (no auth required) ───────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Root welcome handler ────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'Welcome to the LeadFlow CRM API Server 🚀' });
});

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'API is running 🚀' });
});

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/activity', activityRoutes);

// ── 404 handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Global error handler ────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('❌ Error:', err);

  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 ? 'Internal server error.' : err.message;

  res.status(statusCode).json({ success: false, message });
});

// ── Start server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  console.log(`📚 API docs available at http://localhost:${PORT}/api/docs`);
});

module.exports = app;
