/**
 * Audit logger middleware.
 *
 * Runs AFTER route handlers via res.on('finish').
 * Logs successful requests (status < 400) as structured JSON.
 *
 * NOTE: In production this would write to a logging service like
 * Datadog, CloudWatch, or an ELK stack instead of console.log.
 */
function auditLogger(req, res, next) {
  res.on('finish', () => {
    if (res.statusCode < 400) {
      const log = {
        method: req.method,
        path: req.path,
        userId: req.user?.userId || 'anonymous',
        role: req.user?.role || 'none',
        statusCode: res.statusCode,
        timestamp: new Date().toISOString(),
        ip: req.ip,
      };
      console.log('[AUDIT]', JSON.stringify(log));
    }
  });
  next();
}

module.exports = auditLogger;
