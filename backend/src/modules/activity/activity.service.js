const { query } = require('../../config/db');

/**
 * Log an activity against a lead.
 * Called internally by the leads service — not exposed as a route handler.
 *
 * @param {{ leadId: string, action: string, performedBy: string, meta?: object }} params
 * @returns {Promise<object>} the inserted activity_log row
 */
const logActivity = async ({ leadId, action, performedBy, meta }) => {
  const result = await query(
    `INSERT INTO activity_logs (lead_id, action, performed_by, meta)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [leadId, action, performedBy, meta ? JSON.stringify(meta) : null]
  );

  return result.rows[0];
};

/**
 * Fetch all activity logs for a given lead, newest first.
 * Joins users to surface the performer's name.
 *
 * @param {string} leadId
 * @returns {Promise<object[]>}
 */
const getActivityByLead = async (leadId) => {
  const result = await query(
    `SELECT
       al.*,
       u.name AS performed_by_name
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.performed_by
     WHERE al.lead_id = $1
     ORDER BY al.created_at DESC`,
    [leadId]
  );

  return result.rows;
};

module.exports = { logActivity, getActivityByLead };
