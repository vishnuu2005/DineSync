const express = require('express');
const router = express.Router();
const {
  getFloors,
  createFloor,
  updateFloor,
  archiveFloor,
} = require('../controllers/floorController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.route('/')
  .get(getFloors)
  .post(protect, adminOnly, createFloor);

router.route('/:id')
  .put(protect, adminOnly, updateFloor)
  .delete(protect, adminOnly, archiveFloor);

module.exports = router;
