const express = require('express');
const router = express.Router();
const { submitFeedback, getFeedbackForOrder, getAllFeedback } = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.post('/', protect, submitFeedback);
router.get('/order/:orderId', protect, getFeedbackForOrder);
router.get('/', protect, adminOnly, getAllFeedback);

module.exports = router;
