const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  getAuditLogs,
} = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.route('/')
  .get(getSettings)
  .put(protect, adminOnly, updateSettings);

router.get('/audit-logs', protect, adminOnly, getAuditLogs);

module.exports = router;
