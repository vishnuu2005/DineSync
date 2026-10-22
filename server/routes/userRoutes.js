const express = require('express');
const router = express.Router();
const {
  getUsers,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getAdminStats,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Customer directory
router.get('/', protect, adminOnly, getUsers);

// Dashboard real metrics
router.get('/stats', protect, adminOnly, getAdminStats);

// Staff management
router.route('/staff')
  .get(protect, adminOnly, getStaff)
  .post(protect, adminOnly, createStaff);

router.route('/staff/:id')
  .put(protect, adminOnly, updateStaff)
  .delete(protect, adminOnly, deleteStaff);

module.exports = router;
