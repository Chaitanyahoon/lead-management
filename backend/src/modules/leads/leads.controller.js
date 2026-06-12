const { validationResult } = require('express-validator');
const leadsService = require('./leads.service');

/**
 * POST /api/leads
 * Create a new lead (admin/manager only).
 */
const createLead = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, phone, source, notes, status } = req.body;
    const lead = await leadsService.createLead(
      { name, email, phone, source, notes, status },
      req.user.userId
    );

    return res.status(201).json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/leads
 * List leads with filtering, pagination, sorting.
 */
const getLeads = async (req, res, next) => {
  try {
    const { page, limit, status, source, search, sortBy, order } = req.query;

    const result = await leadsService.getLeads(
      { status, source, search },
      { page, limit },
      { field: sortBy, order },
      req.user
    );

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/leads/stats
 * Dashboard statistics (admin/manager only).
 */
const getLeadStats = async (req, res, next) => {
  try {
    const stats = await leadsService.getLeadStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/leads/:id
 * Fetch a single lead by ID.
 */
const getLeadById = async (req, res, next) => {
  try {
    const lead = await leadsService.getLeadById(req.params.id, req.user);
    return res.status(200).json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/leads/:id
 * Update a lead.
 */
const updateLead = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, phone, source, status, notes, assigned_to } = req.body;
    const data = {};

    // Only include fields that were actually sent
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (source !== undefined) data.source = source;
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (assigned_to !== undefined) data.assigned_to = assigned_to;

    const lead = await leadsService.updateLead(req.params.id, data, req.user);
    return res.status(200).json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/leads/:id
 * Delete a lead (admin/manager only).
 */
const deleteLead = async (req, res, next) => {
  try {
    const result = await leadsService.deleteLead(req.params.id, req.user);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/leads/export
 * Export leads to CSV (admin/manager only).
 */
const exportLeads = async (req, res, next) => {
  try {
    const csvData = await leadsService.exportLeadsToCSV(req.user);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads_export.csv');
    return res.status(200).send(csvData);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createLead,
  getLeads,
  getLeadStats,
  getLeadById,
  updateLead,
  deleteLead,
  exportLeads,
};
