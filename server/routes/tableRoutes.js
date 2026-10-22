const express = require('express');
const router = express.Router();
const {
  getTables,
  getTableByNumber,
  getTableByToken,
  createTable,
  updateTable,
  regenerateTableQR,
  updateTableStatus,
  resetTableOccupancy,
  archiveTable,
} = require('../controllers/tableController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly, staffOnly } = require('../middleware/adminMiddleware');

// Public route to resolve table by QR token
router.get('/public/token/:token', getTableByToken);
router.get('/token/:token', getTableByToken);

// Standard table routes
router.route('/')
  .get(getTables)
  .post(protect, adminOnly, createTable);

router.route('/:id')
  .put(protect, adminOnly, updateTable)
  .delete(protect, adminOnly, archiveTable);

router.get('/number/:tableNumber', getTableByNumber);
router.put('/:id/status', protect, staffOnly, updateTableStatus);
router.post('/:id/reset-occupancy', protect, staffOnly, resetTableOccupancy);
router.post('/:id/qr/regenerate', protect, adminOnly, regenerateTableQR);

module.exports = router;
