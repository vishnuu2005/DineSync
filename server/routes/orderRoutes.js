const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderByAccessToken,
  getOrderReceipt,
  getOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly, staffOnly } = require('../middleware/adminMiddleware');

// Public passwordless order tracking and receipt routes
router.get('/public/token/:publicAccessToken', getOrderByAccessToken);
router.get('/public/token/:publicAccessToken/receipt', getOrderReceipt);

// Order creation: public for QR orders or logged in customers
router.post('/public', createOrder);

router.route('/')
  .post(createOrder)
  .get(protect, staffOnly, getOrders);

router.get('/my-orders', protect, getMyOrders);

router.route('/:id')
  .get(protect, getOrderById)
  .delete(protect, adminOnly, deleteOrder);

router.put('/:id/status', protect, staffOnly, updateOrderStatus);

module.exports = router;
