const activityService = require('./activity.service');

/**
 * GET /api/activity/lead/:leadId
 * Return all activity logs for a specific lead.
 */
const getLeadActivity = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const logs = await activityService.getActivityByLead(leadId);

    return res.status(200).json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLeadActivity };
