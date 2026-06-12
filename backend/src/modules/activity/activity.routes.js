const { Router } = require('express');
const authenticate = require('../../middleware/auth');
const activityController = require('./activity.controller');

const router = Router();

// All activity routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/activity/lead/{leadId}:
 *   get:
 *     summary: Get activity log for a lead
 *     tags: [Activity]
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of activity logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ActivityLog'
 */
router.get('/lead/:leadId', activityController.getLeadActivity);

module.exports = router;
