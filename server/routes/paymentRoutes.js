const express = require('express');
const router = express.Router();
const {
  initiatePayment,
  verifyPayment,
  getAdminPayments,
  processRefund,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Public customer payment routes
router.post('/orders/:id/payment', initiatePayment);
router.post('/verify', verifyPayment);

// Admin billing routes
router.get('/admin', protect, adminOnly, getAdminPayments);
router.post('/admin/:id/refund', protect, adminOnly, processRefund);

module.exports = router;
