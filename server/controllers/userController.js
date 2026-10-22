const User = require('../models/User');
const Order = require('../models/Order');
const Table = require('../models/Table');
const PaymentTransaction = require('../models/PaymentTransaction');
const AuditLog = require('../models/AuditLog');

// @desc    Get all customers with metrics
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('-password')
      .sort({ createdAt: -1 });

    const userStats = await Order.aggregate([
      {
        $group: {
          _id: '$customer',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
        },
      },
    ]);

    const statsMap = {};
    userStats.forEach((stat) => {
      if (stat._id) {
        statsMap[stat._id.toString()] = {
          totalOrders: stat.totalOrders,
          totalSpent: Math.round(stat.totalSpent * 100) / 100,
        };
      }
    });

    const customersWithMetrics = customers.map((user) => {
      const stats = statsMap[user._id.toString()] || { totalOrders: 0, totalSpent: 0 };
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        totalOrders: stats.totalOrders,
        totalSpent: stats.totalSpent,
      };
    });

    res.json(customersWithMetrics);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error fetching customer directory.' });
  }
};

// @desc    Get all restaurant staff members
// @route   GET /api/users/staff
// @access  Private/Admin
const getStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ['admin', 'chef', 'waiter'] } })
      .select('-password')
      .sort({ role: 1, name: 1 });
    res.json(staff);
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ message: 'Error fetching staff registry.' });
  }
};

// @desc    Create new staff member
// @route   POST /api/users/staff
// @access  Private/Admin
const createStaff = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }

    if (!['admin', 'chef', 'waiter'].includes(role)) {
      return res.status(400).json({ message: 'Role must be admin, chef, or waiter.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'A user with this email address already exists.' });
    }

    const staffUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : '',
      password,
      role,
    });

    if (req.user) {
      await AuditLog.create({
        action: 'STAFF_CREATED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        role: req.user.role,
        targetType: 'Staff',
        targetId: staffUser._id.toString(),
        details: { name: staffUser.name, email: staffUser.email, role: staffUser.role },
      });
    }

    res.status(201).json({
      _id: staffUser._id,
      name: staffUser.name,
      email: staffUser.email,
      phone: staffUser.phone,
      role: staffUser.role,
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ message: error.message || 'Failed to create staff member.' });
  }
};

// @desc    Update staff member
// @route   PUT /api/users/staff/:id
// @access  Private/Admin
const updateStaff = async (req, res) => {
  try {
    const { name, phone, role, password } = req.body;
    const staff = await User.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found.' });
    }

    if (name) staff.name = name.trim();
    if (phone !== undefined) staff.phone = phone.trim();
    if (role && ['admin', 'chef', 'waiter'].includes(role)) staff.role = role;
    if (password && password.trim().length >= 6) {
      staff.password = password.trim(); // pre-save will hash
    }

    await staff.save();

    res.json({
      _id: staff._id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update staff member.' });
  }
};

// @desc    Delete staff member
// @route   DELETE /api/users/staff/:id
// @access  Private/Admin
const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found.' });
    }

    if (staff._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own logged in administrator account.' });
    }

    await User.deleteOne({ _id: req.params.id });

    if (req.user) {
      await AuditLog.create({
        action: 'STAFF_DELETED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        role: req.user.role,
        targetType: 'Staff',
        targetId: req.params.id,
        details: { name: staff.name, email: staff.email },
      });
    }

    res.json({ message: 'Staff account removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete staff account.' });
  }
};

// @desc    Get real database-derived admin overview metrics
// @route   GET /api/users/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalOrders = await Order.countDocuments();
    const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });
    const pendingOrders = await Order.countDocuments({ status: { $in: ['Pending_Payment', 'Confirmed', 'Accepted'] } });
    const preparingOrders = await Order.countDocuments({ status: 'Preparing' });
    const readyOrders = await Order.countDocuments({ status: 'Ready' });
    const completedOrders = await Order.countDocuments({ status: 'Completed' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // Active dining tables count
    const activeTables = await Table.countDocuments({ status: 'Occupied', isArchived: false });
    const totalTables = await Table.countDocuments({ isArchived: false });

    // Failed payments count
    const paymentFailures = await PaymentTransaction.countDocuments({ status: 'FAILED' });

    // Total Paid Revenue
    const revenueData = await Order.aggregate([
      { $match: { paymentStatus: 'PAID', status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueData.length > 0 ? Math.round(revenueData[0].total * 100) / 100 : 0;

    // Today's Paid Sales
    const todayRevenueData = await Order.aggregate([
      { $match: { createdAt: { $gte: today }, paymentStatus: 'PAID', status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const todaySales = todayRevenueData.length > 0 ? Math.round(todayRevenueData[0].total * 100) / 100 : 0;

    // Popular Menu Items (Top 5)
    const popularItems = await Order.aggregate([
      { $match: { paymentStatus: 'PAID' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 6 },
    ]);

    // Daily sales breakdown for past 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailySales = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, paymentStatus: 'PAID' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalOrders,
      todayOrders,
      todaySales,
      pendingOrders,
      preparingOrders,
      readyOrders,
      completedOrders,
      totalCustomers,
      totalRevenue,
      activeTables,
      totalTables,
      paymentFailures,
      popularItems,
      dailySales,
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Error compiling analytics dashboard.' });
  }
};

module.exports = {
  getUsers,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getAdminStats,
};
