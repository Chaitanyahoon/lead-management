const { Router } = require('express');
const { body } = require('express-validator');
const authenticate = require('../../middleware/auth');
const allowRoles = require('../../middleware/roleCheck');
const leadsController = require('./leads.controller');

const router = Router();

// All lead routes require authentication
router.use(authenticate);

// ── Validation chains ───────────────────────────────────────

const createLeadValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail().withMessage('Must be a valid email.'),
  body('phone')
    .optional({ values: 'falsy' })
    .trim(),
  body('source')
    .optional({ values: 'falsy' })
    .isIn(['web', 'referral', 'cold_call', 'social', 'other'])
    .withMessage('Source must be one of: web, referral, cold_call, social, other.'),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(['new', 'contacted', 'qualified', 'won', 'lost'])
    .withMessage('Status must be one of: new, contacted, qualified, won, lost.'),
];

const updateLeadValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail().withMessage('Must be a valid email.'),
  body('phone')
    .optional({ values: 'falsy' })
    .trim(),
  body('source')
    .optional({ values: 'falsy' })
    .isIn(['web', 'referral', 'cold_call', 'social', 'other'])
    .withMessage('Source must be one of: web, referral, cold_call, social, other.'),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(['new', 'contacted', 'qualified', 'won', 'lost'])
    .withMessage('Status must be one of: new, contacted, qualified, won, lost.'),
];

// ── Routes ──────────────────────────────────────────────────

/**
 * @swagger
 * /api/leads/stats:
 *   get:
 *     summary: Get lead statistics for dashboard
 *     tags: [Leads]
 *     responses:
 *       200:
 *         description: Lead stats by status, source, and agent load
 *       403:
 *         description: Forbidden — admin/manager only
 */
// GET /stats MUST be defined before /:id to avoid treating "stats" as an id param
router.get('/stats', allowRoles('admin', 'manager'), leadsController.getLeadStats);

// GET /export MUST be defined before /:id to avoid treating "export" as an id param
router.get('/export', allowRoles('admin', 'manager'), leadsController.exportLeads);

/**
 * @swagger
 * /api/leads:
 *   post:
 *     summary: Create a new lead (auto-assigns to least loaded agent)
 *     tags: [Leads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: Rahul Sharma }
 *               email: { type: string, example: rahul@example.com }
 *               phone: { type: string, example: '+91-9876543210' }
 *               source: { type: string, enum: [web, referral, cold_call, social, other] }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Lead created and auto-assigned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lead'
 *       403:
 *         description: Forbidden — managers and admins only
 */
router.post('/', allowRoles('admin', 'manager'), createLeadValidation, leadsController.createLead);

/**
 * @swagger
 * /api/leads:
 *   get:
 *     summary: List leads with pagination, search, sort, and filter
 *     tags: [Leads]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [new, contacted, qualified, won, lost] }
 *       - in: query
 *         name: source
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string, description: "Search by name, email, or phone" }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: created_at }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated list of leads
 */
router.get('/', leadsController.getLeads);

/**
 * @swagger
 * /api/leads/{id}:
 *   get:
 *     summary: Get a lead by ID
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Lead details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lead'
 *       404:
 *         description: Lead not found
 */
router.get('/:id', leadsController.getLeadById);

/**
 * @swagger
 * /api/leads/{id}:
 *   put:
 *     summary: Update a lead
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
 *     responses:
 *       200:
 *         description: Lead updated
 */
router.put('/:id', updateLeadValidation, leadsController.updateLead);

/**
 * @swagger
 * /api/leads/{id}:
 *   delete:
 *     summary: Delete a lead (admin/manager only)
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Lead deleted
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', allowRoles('admin', 'manager'), leadsController.deleteLead);

module.exports = router;
