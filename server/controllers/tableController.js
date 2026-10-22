const crypto = require('crypto');
const mongoose = require('mongoose');
const Table = require('../models/Table');
const Floor = require('../models/Floor');
const Order = require('../models/Order');
const RestaurantSettings = require('../models/RestaurantSettings');
const AuditLog = require('../models/AuditLog');
const { getIO } = require('../utils/socket');

// @desc    Get all tables with floor groupings
// @route   GET /api/tables
// @access  Public
const getTables = async (req, res) => {
  try {
    const tables = await Table.find({ isArchived: false });
    
    // Sort naturally so Table 1 is followed by Table 2..9, 10 rather than alphabetical string sort
    tables.sort((a, b) =>
      (a.tableNumber || '').localeCompare(b.tableNumber || '', undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    );

    // Group by floor dynamically
    const grouped = {};
    tables.forEach((t) => {
      const floorKey = t.floor || 'Ground Floor';
      if (!grouped[floorKey]) {
        grouped[floorKey] = [];
      }
      grouped[floorKey].push(t);
    });

    res.json({
      all: tables,
      grouped,
    });
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ message: 'Error fetching restaurant table layout.' });
  }
};

// @desc    Resolve public table by unique QR token or table number
// @route   GET /api/public/tables/:token
// @access  Public (Passwordless Customer Scanning)
const getTableByToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Invalid or missing QR code token.' });
    }

    const trimmedToken = token.trim();

    // 1. First priority: match exact qrToken
    let table = await Table.findOne({ qrToken: trimmedToken, isArchived: false });

    // 2. Second priority: match tableNumber directly (e.g. "1", "10")
    if (!table) {
      table = await Table.findOne({ tableNumber: trimmedToken, isArchived: false });
    }

    // 3. Third priority: match normalized tableNumber stripping prefixes (e.g. "Table 1", "T-1")
    if (!table) {
      const strippedNumber = trimmedToken.replace(/^(table|t)[-\s]*/i, '').trim();
      if (strippedNumber) {
        table = await Table.findOne({ tableNumber: strippedNumber, isArchived: false });
      }
    }

    // 4. Fourth priority: match by MongoDB ObjectId if valid
    if (!table && mongoose.Types.ObjectId.isValid(trimmedToken)) {
      table = await Table.findOne({ _id: trimmedToken, isArchived: false });
    }

    if (!table) {
      return res.status(404).json({
        message: 'This QR code is either invalid or has been revoked by restaurant management. Please ask staff for assistance.',
      });
    }

    if (!table.isActive) {
      return res.status(400).json({
        message: `Table ${table.tableNumber} is currently inactive for dining.`,
      });
    }

    // Fetch restaurant branding and settings
    const settings = await RestaurantSettings.findOne();

    res.json({
      table: {
        _id: table._id,
        tableNumber: table.tableNumber,
        floor: table.floor,
        capacity: table.capacity,
        status: table.status,
        qrToken: table.qrToken,
      },
      restaurant: {
        name: settings?.restaurantName || 'DineSync Demo Restaurant',
        tagline: settings?.tagline || 'Artisan Coffee & Culinary Experience',
        taxRatePercent: settings?.taxRatePercent || 5.0,
        currency: settings?.currency || 'INR',
        currencySymbol: settings?.currencySymbol || '₹',
        requirePaymentBeforeKitchen: settings?.requirePaymentBeforeKitchen ?? true,
      },
    });
  } catch (error) {
    console.error('Resolve table by token error:', error);
    res.status(500).json({ message: 'Error validating table QR token.' });
  }
};

// @desc    Get single table by table number or token
// @route   GET /api/tables/:tableNumber
// @access  Public
const getTableByNumber = async (req, res) => {
  try {
    const rawIdentifier = req.params.tableNumber.toString().trim();
    let table = await Table.findOne({
      tableNumber: rawIdentifier,
      isArchived: false,
    });

    if (!table) {
      const strippedNumber = rawIdentifier.replace(/^(table|t)[-\s]*/i, '').trim();
      if (strippedNumber) {
        table = await Table.findOne({
          tableNumber: strippedNumber,
          isArchived: false,
        });
      }
    }

    if (!table) {
      table = await Table.findOne({
        qrToken: rawIdentifier,
        isArchived: false,
      });
    }

    if (!table && mongoose.Types.ObjectId.isValid(rawIdentifier)) {
      table = await Table.findOne({
        _id: rawIdentifier,
        isArchived: false,
      });
    }

    if (!table) {
      return res.status(404).json({ message: `Table ${rawIdentifier} not found in the restaurant layout.` });
    }

    res.json(table);
  } catch (error) {
    console.error('Get table by number error:', error);
    res.status(500).json({ message: 'Error fetching table details.' });
  }
};

// @desc    Create new table
// @route   POST /api/tables
// @access  Private/Admin
const createTable = async (req, res) => {
  try {
    const { tableNumber, floor, floorId, capacity, description } = req.body;

    if (!tableNumber) {
      return res.status(400).json({ message: 'Table number or label is required.' });
    }

    const tableNumStr = tableNumber.toString().trim();
    const existing = await Table.findOne({ tableNumber: tableNumStr });
    if (existing) {
      if (existing.isArchived) {
        existing.isArchived = false;
        existing.floor = floor || existing.floor;
        existing.capacity = capacity || existing.capacity;
        existing.status = 'Available';
        await existing.save();
        return res.json(existing);
      }
      return res.status(400).json({ message: `Table ${tableNumStr} already exists.` });
    }

    const seatCapacity = Number(capacity);
    if (isNaN(seatCapacity) || seatCapacity < 1 || seatCapacity > 50) {
      return res.status(400).json({ message: 'Seating capacity must be a positive integer between 1 and 50.' });
    }

    const newTable = await Table.create({
      tableNumber: tableNumStr,
      floor: floor || 'Ground Floor',
      floorId: floorId || null,
      capacity: seatCapacity,
      description: description ? description.trim() : '',
      status: 'Available',
      qrToken: crypto.randomBytes(16).toString('hex'),
      isActive: true,
      isArchived: false,
    });

    if (req.user) {
      await AuditLog.create({
        action: 'TABLE_CREATED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        role: req.user.role,
        targetType: 'Table',
        targetId: newTable._id.toString(),
        details: { tableNumber: newTable.tableNumber, floor: newTable.floor, capacity: newTable.capacity },
      });
    }

    // Real-time broadcast
    try {
      const io = getIO();
      if (io) io.emit('tableStatusUpdated', newTable);
    } catch (e) {}

    res.status(201).json(newTable);
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({ message: error.message || 'Failed to create table.' });
  }
};

// @desc    Update table (floor, capacity, description, status)
// @route   PUT /api/tables/:id
// @access  Private/Admin
const updateTable = async (req, res) => {
  try {
    const { tableNumber, floor, floorId, capacity, description, status, isActive } = req.body;
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found.' });
    }

    if (capacity !== undefined) {
      const seatCapacity = Number(capacity);
      if (isNaN(seatCapacity) || seatCapacity < 1 || seatCapacity > 50) {
        return res.status(400).json({ message: 'Capacity must be a positive integer between 1 and 50.' });
      }
      table.capacity = seatCapacity;
    }

    if (tableNumber) table.tableNumber = tableNumber.toString().trim();
    if (floor) table.floor = floor;
    if (floorId !== undefined) table.floorId = floorId;
    if (description !== undefined) table.description = description.trim();
    if (status) table.status = status;
    if (isActive !== undefined) table.isActive = Boolean(isActive);

    const updatedTable = await table.save();

    if (req.user) {
      await AuditLog.create({
        action: 'TABLE_UPDATED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        role: req.user.role,
        targetType: 'Table',
        targetId: updatedTable._id.toString(),
        details: { tableNumber: updatedTable.tableNumber, capacity: updatedTable.capacity, floor: updatedTable.floor },
      });
    }

    try {
      const io = getIO();
      if (io) io.emit('tableStatusUpdated', updatedTable);
    } catch (e) {}

    res.json(updatedTable);
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({ message: 'Failed to update table.' });
  }
};

// @desc    Regenerate/revoke QR token for a table
// @route   POST /api/admin/tables/:id/qr/regenerate
// @access  Private/Admin
const regenerateTableQR = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found.' });
    }

    const previousToken = table.qrToken;
    const newToken = table.regenerateQRToken();
    await table.save();

    if (req.user) {
      await AuditLog.create({
        action: 'TABLE_QR_REGENERATED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        role: req.user.role,
        targetType: 'Table',
        targetId: table._id.toString(),
        details: {
          tableNumber: table.tableNumber,
          previousToken: previousToken.slice(0, 8) + '...',
          newToken: newToken.slice(0, 8) + '...',
        },
      });
    }

    res.json({
      message: `New QR code generated for Table ${table.tableNumber}. The previous QR code has been permanently revoked.`,
      table,
      newToken,
    });
  } catch (error) {
    console.error('Regenerate QR token error:', error);
    res.status(500).json({ message: 'Failed to regenerate table QR token.' });
  }
};

// @desc    Update table operational status
// @route   PUT /api/tables/:id/status
// @access  Private/Staff
const updateTableStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Available', 'Occupied', 'Reserved', 'Maintenance'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid table status.' });
    }

    const tableId = req.params.id;
    let table = null;
    if (mongoose.Types.ObjectId.isValid(tableId)) {
      table = await Table.findById(tableId);
    }
    if (!table) {
      table = await Table.findOne({ tableNumber: tableId.toString().trim(), isArchived: false });
    }

    if (!table) {
      return res.status(404).json({ message: 'Table not found.' });
    }

    const previousStatus = table.status;
    table.status = status;
    const updatedTable = await table.save();

    // If table status was reset/set to Available, automatically complete active dining orders
    let completedOrders = [];
    if (status === 'Available') {
      const activeOrders = await Order.find({
        tableNumber: table.tableNumber,
        status: { $in: ['Served', 'Ready', 'Preparing', 'Accepted', 'Confirmed'] },
      });

      for (const ord of activeOrders) {
        ord.status = 'Completed';
        ord.completedAt = ord.completedAt || new Date();
        await ord.save();
        completedOrders.push(ord);
      }
    }

    if (req.user) {
      await AuditLog.create({
        action: status === 'Available' && previousStatus === 'Occupied' ? 'TABLE_OCCUPANCY_RESET' : 'TABLE_STATUS_UPDATED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        role: req.user.role,
        targetType: 'Table',
        targetId: updatedTable._id.toString(),
        details: {
          tableNumber: updatedTable.tableNumber,
          previousStatus,
          newStatus: status,
          completedOrdersCount: completedOrders.length,
          orderNumbers: completedOrders.map((o) => o.orderNumber),
        },
      });
    }

    try {
      const io = getIO();
      if (io) {
        io.emit('tableStatusUpdated', updatedTable);
        for (const ord of completedOrders) {
          io.emit('orderStatusUpdated', ord);
        }
      }
    } catch (e) {}

    const resObj = updatedTable.toObject();
    resObj.completedOrders = completedOrders;
    res.json(resObj);
  } catch (error) {
    console.error('Update table status error:', error);
    res.status(500).json({ message: 'Failed to update table status.' });
  }
};

// @desc    Explicitly reset table occupancy (Customer completed dine -> Table becomes Available)
// @route   POST /api/tables/:id/reset-occupancy
// @access  Private/Staff (Waiter, Admin)
const resetTableOccupancy = async (req, res) => {
  try {
    const tableId = req.params.id;
    let table = null;

    if (mongoose.Types.ObjectId.isValid(tableId)) {
      table = await Table.findById(tableId);
    }
    if (!table) {
      table = await Table.findOne({ tableNumber: tableId.toString().trim(), isArchived: false });
    }

    if (!table) {
      return res.status(404).json({ message: 'Table not found in restaurant layout.' });
    }

    const previousStatus = table.status;
    table.status = 'Available';
    const updatedTable = await table.save();

    // Conclude all active / served dining orders for this table
    const activeOrders = await Order.find({
      tableNumber: table.tableNumber,
      status: { $in: ['Served', 'Ready', 'Preparing', 'Accepted', 'Confirmed'] },
    });

    const completedOrders = [];
    for (const ord of activeOrders) {
      ord.status = 'Completed';
      ord.completedAt = ord.completedAt || new Date();
      await ord.save();
      completedOrders.push(ord);
    }

    if (req.user) {
      await AuditLog.create({
        action: 'TABLE_OCCUPANCY_RESET',
        performedBy: req.user._id,
        performedByName: req.user.name,
        role: req.user.role,
        targetType: 'Table',
        targetId: table._id.toString(),
        details: {
          tableNumber: table.tableNumber,
          previousStatus,
          newStatus: 'Available',
          completedOrdersCount: completedOrders.length,
          orderNumbers: completedOrders.map((o) => o.orderNumber),
          reason: 'Customer completed dine / Waiter cleared table occupancy',
        },
      });
    }

    // Real-time broadcast
    try {
      const io = getIO();
      if (io) {
        io.emit('tableStatusUpdated', updatedTable);
        for (const ord of completedOrders) {
          io.emit('orderStatusUpdated', ord);
        }
      }
    } catch (e) {
      console.error('Socket emission error on reset table occupancy:', e);
    }

    res.json({
      success: true,
      message: `Table ${table.tableNumber} occupancy reset to Available successfully.`,
      table: updatedTable,
      completedOrders,
    });
  } catch (error) {
    console.error('Reset table occupancy error:', error);
    res.status(500).json({ message: 'Failed to reset table occupancy.' });
  }
};

// @desc    Archive table
// @route   DELETE /api/tables/:id
// @access  Private/Admin
const archiveTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found.' });
    }

    table.isArchived = true;
    table.isActive = false;
    await table.save();

    if (req.user) {
      await AuditLog.create({
        action: 'TABLE_ARCHIVED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        role: req.user.role,
        targetType: 'Table',
        targetId: table._id.toString(),
        details: { tableNumber: table.tableNumber },
      });
    }

    res.json({ message: `Table ${table.tableNumber} archived.` });
  } catch (error) {
    console.error('Archive table error:', error);
    res.status(500).json({ message: 'Failed to archive table.' });
  }
};

module.exports = {
  getTables,
  getTableByNumber,
  getTableByToken,
  createTable,
  updateTable,
  regenerateTableQR,
  updateTableStatus,
  resetTableOccupancy,
  archiveTable,
};
