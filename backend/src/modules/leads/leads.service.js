const { query, pool } = require('../../config/db');
const { logActivity } = require('../activity/activity.service');
const { sendLeadAssignmentEmail } = require('../../utils/emailService');

// ─── Allowed sort fields (whitelist to prevent SQL injection) ────────────────
const ALLOWED_SORT_FIELDS = ['name', 'created_at', 'status', 'source'];
const ALLOWED_SORT_ORDERS = ['ASC', 'DESC'];

/**
 * 1. Create a lead with least-loaded agent auto-assignment.
 *    Runs inside a transaction to avoid race conditions.
 */
const createLead = async (data, createdBy) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Concurrency Lock: Serialize agent workload assignment calculation
    await client.query('SELECT pg_advisory_xact_lock(1001)');

    // ── Least-loaded agent ──────────────────────────────────
    const agentResult = await client.query(
      `SELECT u.id, COUNT(l.id) AS lead_count
       FROM users u
       LEFT JOIN leads l ON l.assigned_to = u.id
         AND l.status NOT IN ('won', 'lost')
         AND l.deleted_at IS NULL
       WHERE u.role = 'agent' AND u.is_active = true
       GROUP BY u.id
       ORDER BY lead_count ASC, MAX(COALESCE(l.created_at, '1970-01-01')) ASC
       LIMIT 1`
    );

    const assignedTo = agentResult.rows.length > 0 ? agentResult.rows[0].id : null;

    // ── Insert lead ─────────────────────────────────────────
    const result = await client.query(
      `INSERT INTO leads (name, email, phone, source, status, notes, assigned_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.name,
        data.email || null,
        data.phone || null,
        data.source || null,
        data.status || 'new',
        data.notes || null,
        assignedTo,
        createdBy,
      ]
    );

    await client.query('COMMIT');

    const lead = result.rows[0];

    // ── Log activity (outside txn — best-effort) ────────────
    await logActivity({
      leadId: lead.id,
      action: 'lead_created',
      performedBy: createdBy,
      meta: { assigned_to: assignedTo },
    });

    // ── Fire-and-forget assignment email ─────────────────────
    if (assignedTo) {
      query('SELECT name, email FROM users WHERE id = $1', [assignedTo])
        .then((res) => {
          if (res.rows.length > 0) {
            const agent = res.rows[0];
            sendLeadAssignmentEmail({
              agentEmail: agent.email,
              agentName: agent.name,
              leadName: lead.name,
              leadId: lead.id,
            });
          }
        })
        .catch((err) => console.error('❌ Failed to fetch agent for email:', err.message));
    }

    return lead;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * 2. List leads with filtering, pagination, sorting, and role-based access.
 */
const getLeads = async (filters = {}, pagination = {}, sort = {}, requestingUser) => {
  const { status, source, search } = filters;
  const page = Math.max(parseInt(pagination.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(pagination.limit, 10) || 10, 1), 100);
  const offset = (page - 1) * limit;

  // ── Sort ──────────────────────────────────────────────────
  let sortField = 'created_at';
  let sortOrder = 'DESC';

  if (sort.field && ALLOWED_SORT_FIELDS.includes(sort.field)) {
    sortField = sort.field;
  }
  if (sort.order && ALLOWED_SORT_ORDERS.includes(sort.order.toUpperCase())) {
    sortOrder = sort.order.toUpperCase();
  }

  // ── WHERE clauses ─────────────────────────────────────────
  const conditions = ['l.deleted_at IS NULL'];
  const params = [];
  let paramIdx = 1;

  // Role-based filtering: agents see only their own leads
  if (requestingUser.role === 'agent') {
    conditions.push(`l.assigned_to = $${paramIdx++}`);
    params.push(requestingUser.userId);
  }

  if (status) {
    conditions.push(`l.status = $${paramIdx++}`);
    params.push(status);
  }

  if (source) {
    conditions.push(`l.source = $${paramIdx++}`);
    params.push(source);
  }

  if (search) {
    conditions.push(
      `(l.name ILIKE $${paramIdx} OR l.email ILIKE $${paramIdx} OR l.phone ILIKE $${paramIdx})`
    );
    params.push(`%${search}%`);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // ── Count total ───────────────────────────────────────────
  const countResult = await query(
    `SELECT COUNT(*) AS total FROM leads l ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].total, 10);

  // ── Fetch page ────────────────────────────────────────────
  const dataResult = await query(
    `SELECT
       l.*,
       u.name AS assigned_agent_name
     FROM leads l
     LEFT JOIN users u ON u.id = l.assigned_to
     ${whereClause}
     ORDER BY l.${sortField} ${sortOrder}
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  return {
    data: dataResult.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * 3. Get a single lead by ID (with role-based access).
 */
const getLeadById = async (leadId, requestingUser) => {
  const result = await query(
    `SELECT
       l.*,
       u.name AS assigned_agent_name
     FROM leads l
     LEFT JOIN users u ON u.id = l.assigned_to
     WHERE l.id = $1 AND l.deleted_at IS NULL`,
    [leadId]
  );

  if (result.rows.length === 0) {
    const err = new Error('Lead not found.');
    err.statusCode = 404;
    throw err;
  }

  const lead = result.rows[0];

  // Agents can only view their own leads
  if (requestingUser.role === 'agent' && lead.assigned_to !== requestingUser.userId) {
    const err = new Error('Forbidden. You can only view leads assigned to you.');
    err.statusCode = 403;
    throw err;
  }

  return lead;
};

/**
 * 4. Update a lead (with role-based rules).
 */
const updateLead = async (leadId, data, requestingUser) => {
  // Fetch current lead (also enforces role-based read access)
  const currentLead = await getLeadById(leadId, requestingUser);

  // Agents cannot change assigned_to
  if (requestingUser.role === 'agent' && data.assigned_to !== undefined) {
    const err = new Error('Agents cannot reassign leads.');
    err.statusCode = 403;
    throw err;
  }

  // ── Build dynamic SET clause ──────────────────────────────
  const allowedFields = ['name', 'email', 'phone', 'source', 'status', 'notes', 'assigned_to'];
  const setClauses = [];
  const params = [];
  let paramIdx = 1;

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      setClauses.push(`${field} = $${paramIdx++}`);
      params.push(data[field]);
    }
  }

  if (setClauses.length === 0) {
    const err = new Error('No valid fields to update.');
    err.statusCode = 400;
    throw err;
  }

  // Always update updated_at
  setClauses.push(`updated_at = NOW()`);

  params.push(leadId);
  const result = await query(
    `UPDATE leads SET ${setClauses.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
    params
  );

  const updatedLead = result.rows[0];

  // ── Activity logging ──────────────────────────────────────

  // Status change
  if (data.status !== undefined && data.status !== currentLead.status) {
    await logActivity({
      leadId,
      action: 'status_changed',
      performedBy: requestingUser.userId,
      meta: { from: currentLead.status, to: data.status },
    });
  }

  // Assignment change
  if (data.assigned_to !== undefined && data.assigned_to !== currentLead.assigned_to) {
    await logActivity({
      leadId,
      action: 'lead_assigned',
      performedBy: requestingUser.userId,
      meta: { to: data.assigned_to },
    });
  }

  // General update log
  await logActivity({
    leadId,
    action: 'lead_updated',
    performedBy: requestingUser.userId,
    meta: { updatedFields: Object.keys(data).filter((k) => allowedFields.includes(k)) },
  });

  return updatedLead;
};

/**
 * 5. Delete a lead (admin/manager only — enforced at route level).
 */
const deleteLead = async (leadId, requestingUser) => {
  // Verify the lead exists
  const existing = await query('SELECT id FROM leads WHERE id = $1 AND deleted_at IS NULL', [leadId]);

  if (existing.rows.length === 0) {
    const err = new Error('Lead not found.');
    err.statusCode = 404;
    throw err;
  }

  // Log before deleting (logs will be preserved because of soft delete)
  await logActivity({
    leadId,
    action: 'lead_deleted',
    performedBy: requestingUser.userId,
    meta: null,
  });

  await query('UPDATE leads SET deleted_at = NOW() WHERE id = $1', [leadId]);

  return { message: 'Lead deleted successfully.' };
};

/**
 * 6. Dashboard statistics.
 */
const getLeadStats = async () => {
  // Total leads
  const totalResult = await query('SELECT COUNT(*) AS total FROM leads WHERE deleted_at IS NULL');
  const total = parseInt(totalResult.rows[0].total, 10);

  // By status
  const statusResult = await query(
    `SELECT status, COUNT(*) AS count FROM leads WHERE deleted_at IS NULL GROUP BY status`
  );
  const byStatus = { new: 0, contacted: 0, qualified: 0, won: 0, lost: 0 };
  for (const row of statusResult.rows) {
    byStatus[row.status] = parseInt(row.count, 10);
  }

  // By source
  const sourceResult = await query(
    `SELECT COALESCE(source, 'unknown') AS source, COUNT(*) AS count FROM leads WHERE deleted_at IS NULL GROUP BY source`
  );
  const bySource = {};
  for (const row of sourceResult.rows) {
    bySource[row.source] = parseInt(row.count, 10);
  }

  // Agent load (active leads per agent)
  const agentLoadResult = await query(
    `SELECT u.name AS "agentName", COUNT(l.id) AS "activeLeads"
     FROM users u
     LEFT JOIN leads l ON l.assigned_to = u.id AND l.status NOT IN ('won', 'lost') AND l.deleted_at IS NULL
     WHERE u.role = 'agent' AND u.is_active = true
     GROUP BY u.id, u.name
     ORDER BY "activeLeads" DESC`
  );
  const agentLoad = agentLoadResult.rows.map((r) => ({
    agentName: r.agentName,
    activeLeads: parseInt(r.activeLeads, 10),
  }));

  return { total, byStatus, bySource, agentLoad };
};

/**
 * 7. Export leads to CSV.
 */
const exportLeadsToCSV = async (requestingUser) => {
  const conditions = ['l.deleted_at IS NULL'];
  const params = [];
  let paramIdx = 1;

  if (requestingUser.role === 'agent') {
    conditions.push(`l.assigned_to = $${paramIdx++}`);
    params.push(requestingUser.userId);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const result = await query(
    `SELECT
       l.name,
       l.email,
       l.phone,
       l.source,
       l.status,
       u.name AS assigned_agent,
       l.notes,
       l.created_at
     FROM leads l
     LEFT JOIN users u ON u.id = l.assigned_to
     ${whereClause}
     ORDER BY l.created_at DESC`,
    params
  );

  const headers = ['Name', 'Email', 'Phone', 'Source', 'Status', 'Assigned Agent', 'Notes', 'Created At'];
  const csvRows = [headers.join(',')];

  for (const row of result.rows) {
    const values = [
      row.name,
      row.email || '',
      row.phone || '',
      row.source || '',
      row.status || '',
      row.assigned_agent || 'Unassigned',
      (row.notes || '').replace(/"/g, '""').replace(/\n/g, ' '),
      row.created_at ? new Date(row.created_at).toISOString() : ''
    ].map(val => `"${val}"`);
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  getLeadStats,
  exportLeadsToCSV,
};
