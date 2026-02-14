const AuditLog = require('../models/auditLog');

/**
 * Fire-and-forget audit logger. Never throws — won't break existing flows.
 *
 * @param {Object} req          - Express request (must have req.user from auth middleware)
 * @param {string} action       - e.g. "CUSTOMER_APPROVED", "PASSWORD_CHANGED"
 * @param {string} targetModel  - e.g. "User", "Quotation"
 * @param {string|null} targetId - The _id of the affected document
 * @param {string} details      - Human-readable description
 * @param {Object} metadata     - Any extra data you want stored (optional)
 */
const logAudit = (req, action, targetModel, targetId, details, metadata = {}) => {
  try {
    const user = req.user;
    if (!user) return;

    AuditLog.create({
      performedBy: user._id,
      performedByEmail: user?.email || '',
      performedByType: user.type,
      action,
      targetModel,
      targetId: targetId || null,
      details,
      metadata,
    }).catch(() => {});
  } catch (_) {
    // silently ignore — audit logging must never break production
  }
};

module.exports = logAudit;
