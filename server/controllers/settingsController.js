const RestaurantSettings = require('../models/RestaurantSettings');
const AuditLog = require('../models/AuditLog');

// @desc    Get restaurant settings
// @route   GET /api/settings
// @access  Public
const getSettings = async (req, res) => {
  try {
    let settings = await RestaurantSettings.findOne();
    if (!settings) {
      settings = await RestaurantSettings.create({
        restaurantName: process.env.RESTAURANT_NAME || 'DineSync Demo Restaurant',
      });
    }
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Error fetching restaurant settings.' });
  }
};

// @desc    Update restaurant settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
  try {
    const {
      restaurantName,
      tagline,
      gstin,
      address,
      phone,
      email,
      taxRatePercent,
      paymentMode,
      requirePaymentBeforeKitchen,
    } = req.body;

    let settings = await RestaurantSettings.findOne();
    if (!settings) {
      settings = new RestaurantSettings();
    }

    if (restaurantName) settings.restaurantName = restaurantName.trim();
    if (tagline !== undefined) settings.tagline = tagline.trim();
    if (gstin !== undefined) settings.gstin = gstin.trim();
    if (address !== undefined) settings.address = address.trim();
    if (phone !== undefined) settings.phone = phone.trim();
    if (email !== undefined) settings.email = email.trim();
    if (taxRatePercent !== undefined) settings.taxRatePercent = Number(taxRatePercent);
    if (paymentMode !== undefined) settings.paymentMode = paymentMode;
    if (requirePaymentBeforeKitchen !== undefined) {
      settings.requirePaymentBeforeKitchen = Boolean(requirePaymentBeforeKitchen);
    }

    if (req.user) settings.updatedBy = req.user._id;

    const updated = await settings.save();

    if (req.user) {
      await AuditLog.create({
        action: 'SETTINGS_UPDATED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        role: req.user.role,
        targetType: 'Settings',
        targetId: updated._id.toString(),
        details: { restaurantName: updated.restaurantName, taxRate: updated.taxRatePercent },
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Failed to update restaurant configuration.' });
  }
};

// @desc    Get audit logs
// @route   GET /api/settings/audit-logs
// @access  Private/Admin
const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Error retrieving audit logs.' });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getAuditLogs,
};
