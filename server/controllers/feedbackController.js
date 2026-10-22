const Feedback = require('../models/Feedback');
const Order = require('../models/Order');

// @desc    Submit feedback/rating for a completed order
// @route   POST /api/feedback
// @access  Private/Customer
const submitFeedback = async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;

    if (!orderId || !rating) {
      return res.status(400).json({ message: 'Order ID and rating are required' });
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5 stars' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify order belongs to customer
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to submit feedback for this order' });
    }

    // Rule: Order MUST be Completed
    if (order.status !== 'Completed') {
      return res.status(400).json({ message: 'Feedback can only be submitted for completed orders.' });
    }

    // Rule: No duplicate feedback for same order
    const existingFeedback = await Feedback.findOne({ order: orderId });
    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback has already been submitted for this order.' });
    }

    const feedback = new Feedback({
      customer: req.user._id,
      order: orderId,
      rating: ratingNum,
      comment: comment ? comment.trim() : '',
    });

    const savedFeedback = await feedback.save();
    await savedFeedback.populate('customer', 'name email');

    res.status(201).json(savedFeedback);
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: error.message || 'Failed to submit feedback' });
  }
};

// @desc    Get feedback for a specific order (Customer view)
// @route   GET /api/feedback/order/:orderId
// @access  Private
const getFeedbackForOrder = async (req, res) => {
  try {
    const feedback = await Feedback.findOne({ order: req.params.orderId }).populate('customer', 'name email');
    res.json(feedback || null);
  } catch (error) {
    res.status(500).json({ message: 'Error checking order feedback' });
  }
};

// @desc    Get all feedback and rating distribution analytics (Admin view)
// @route   GET /api/feedback
// @access  Private/Admin
const getAllFeedback = async (req, res) => {
  try {
    const reviews = await Feedback.find()
      .populate('customer', 'name email phone')
      .populate('order', 'tableNumber floor totalAmount orderDate')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    let sumRating = 0;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach((r) => {
      sumRating += r.rating;
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating] += 1;
      }
    });

    const averageRating = totalReviews > 0 ? Math.round((sumRating / totalReviews) * 10) / 10 : 0;

    res.json({
      averageRating,
      totalReviews,
      distribution,
      reviews,
    });
  } catch (error) {
    console.error('Get all feedback error:', error);
    res.status(500).json({ message: 'Error compiling feedback analytics' });
  }
};

module.exports = {
  submitFeedback,
  getFeedbackForOrder,
  getAllFeedback,
};
