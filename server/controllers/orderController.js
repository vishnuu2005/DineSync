const mongoose = require('mongoose');
const Order = require('../models/Order');
const Table = require('../models/Table');
const Product = require('../models/Product');
const RestaurantSettings = require('../models/RestaurantSettings');
const AuditLog = require('../models/AuditLog');
const { getIO } = require('../utils/socket');

// @desc    Create new public customer order from QR scan (Passwordless)
// @route   POST /api/public/orders or POST /api/orders
// @access  Public
const createOrder = async (req, res) => {
  try {
    const {
      tableNumber,
      tableToken,
      tableId,
      table: tableField,
      numberOfPersons,
      customerName,
      customerPhone,
      specialInstructions,
      items,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty. Please add menu items to order.' });
    }

    // Resolve table with resilient multi-step fallback (Table Number, Table ID, QR token, Prefix Stripping)
    let table = null;
    const rawTableNumber = tableNumber || (tableField && tableField.tableNumber);
    const potentialId =
      tableId ||
      (tableField && (tableField._id || tableField.id || (typeof tableField === 'string' && tableField)));

    // 1. If explicit tableNumber is provided, prioritize it to prevent stale tableToken in client localStorage from hijacking
    if (rawTableNumber !== undefined && rawTableNumber !== null && rawTableNumber.toString().trim() !== '') {
      const raw = rawTableNumber.toString().trim();

      // Check if raw is ObjectId
      if (mongoose.Types.ObjectId.isValid(raw)) {
        table = await Table.findOne({ _id: raw, isArchived: false });
      }

      // Exact match
      if (!table) {
        table = await Table.findOne({ tableNumber: raw, isArchived: false });
      }

      // Case-insensitive match
      if (!table) {
        table = await Table.findOne({
          tableNumber: { $regex: new RegExp(`^${raw}$`, 'i') },
          isArchived: false,
        });
      }

      // Handle prefixes like "Table 1", "Table-1", "T-1", "T-01", "T1"
      if (!table) {
        const cleaned = raw.replace(/^(table|t)[-\s]*/i, '').trim();
        if (cleaned) {
          const strippedZero = cleaned.replace(/^0+/, '') || '0';
          table = await Table.findOne({
            $or: [
              { tableNumber: cleaned },
              { tableNumber: strippedZero },
              { tableNumber: { $regex: new RegExp(`^0*${strippedZero}$`, 'i') } },
            ],
            isArchived: false,
          });
        }
      }
    }

    // 2. Try tableId or table._id if provided and not yet resolved
    if (!table && potentialId && mongoose.Types.ObjectId.isValid(potentialId)) {
      table = await Table.findOne({ _id: potentialId, isArchived: false });
    }

    // 3. Try QR token if provided (e.g. customer ordered purely via token)
    if (!table && tableToken && typeof tableToken === 'string' && tableToken.trim()) {
      table = await Table.findOne({ qrToken: tableToken.trim(), isArchived: false });

      // Fallback: check if tableToken was actually a table number or table ID
      if (!table) {
        const rawToken = tableToken.trim();
        if (mongoose.Types.ObjectId.isValid(rawToken)) {
          table = await Table.findOne({ _id: rawToken, isArchived: false });
        }
        if (!table) {
          table = await Table.findOne({ tableNumber: rawToken, isArchived: false });
        }
        if (!table) {
          const stripped = rawToken.replace(/^(table|t)[-\s]*/i, '').trim();
          if (stripped) {
            table = await Table.findOne({ tableNumber: stripped, isArchived: false });
          }
        }
      }
    }

    // 5. Fallback: check unarchived tables if previously archived
    if (!table && (rawTableNumber || tableToken)) {
      const searchTerms = [];
      if (rawTableNumber) searchTerms.push({ tableNumber: rawTableNumber.toString().trim() });
      if (tableToken) searchTerms.push({ qrToken: tableToken.trim() });
      const archivedTable = await Table.findOne({ $or: searchTerms });
      if (archivedTable) {
        archivedTable.isArchived = false;
        archivedTable.isActive = true;
        await archivedTable.save();
        table = archivedTable;
      }
    }

    if (!table) {
      return res.status(404).json({ message: 'Selected table could not be found in the restaurant layout.' });
    }

    if (!table.isActive) {
      return res.status(400).json({ message: `Table ${table.tableNumber} is not currently active for dining.` });
    }

    const persons = Number(numberOfPersons) || 1;
    if (persons < 1) {
      return res.status(400).json({ message: 'Number of persons must be at least 1.' });
    }

    if (persons > table.capacity) {
      return res.status(400).json({
        message: `Table ${table.tableNumber} has a seating capacity limit of ${table.capacity} persons.`,
      });
    }

    // Fetch authoritative products from Database to prevent client price tampering
    const productIds = items.map((i) => i._id || i.product || i.productId);
    const dbProducts = await Product.find({
      _id: { $in: productIds },
      isArchived: false,
    });

    const dbProductMap = new Map();
    dbProducts.forEach((p) => dbProductMap.set(p._id.toString(), p));

    // Verify all items exist and are available
    let calculatedSubtotalInPaise = 0;
    const validatedItems = [];

    for (const item of items) {
      const pid = (item._id || item.product || item.productId || '').toString();
      const dbProduct = dbProductMap.get(pid);

      if (!dbProduct) {
        return res.status(400).json({
          message: `Item "${item.name || 'Unknown'}" is no longer available on the menu.`,
        });
      }

      if (!dbProduct.available) {
        return res.status(400).json({
          message: `"${dbProduct.name}" is currently sold out. Please remove it from your cart.`,
        });
      }

      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      const unitPriceInPaise = dbProduct.priceInPaise || Math.round(dbProduct.price * 100);
      const itemSubtotalInPaise = unitPriceInPaise * quantity;

      calculatedSubtotalInPaise += itemSubtotalInPaise;

      validatedItems.push({
        product: dbProduct._id,
        name: dbProduct.name,
        quantity,
        price: dbProduct.price,
        priceInPaise: unitPriceInPaise,
        image: dbProduct.image,
        type: dbProduct.type || 'veg',
      });
    }

    // Fetch tax settings (e.g. 5% GST)
    const settings = await RestaurantSettings.findOne();
    const taxRatePercent = settings?.taxRatePercent || 5.0;

    const subtotal = calculatedSubtotalInPaise / 100;
    const taxInPaise = Math.round(calculatedSubtotalInPaise * (taxRatePercent / 100));
    const tax = taxInPaise / 100;
    const totalAmountInPaise = calculatedSubtotalInPaise + taxInPaise;
    const totalAmount = totalAmountInPaise / 100;

    // Create Order with initial Pending_Payment state
    const order = new Order({
      customer: req.user ? req.user._id : null,
      customerName: customerName ? customerName.trim() : (req.user?.name || 'Guest Customer'),
      customerPhone: customerPhone ? customerPhone.trim() : (req.user?.phone || ''),
      table: table._id,
      tableNumber: table.tableNumber,
      floor: table.floor,
      floorId: table.floorId || null,
      numberOfPersons: persons,
      specialInstructions: specialInstructions ? specialInstructions.trim() : '',
      items: validatedItems,
      subtotal,
      subtotalInPaise: calculatedSubtotalInPaise,
      taxRate: taxRatePercent,
      tax,
      taxInPaise,
      totalAmount,
      totalAmountInPaise,
      currency: 'INR',
      paymentStatus: 'UNPAID',
      status: 'Pending_Payment',
    });

    const createdOrder = await order.save();

    // Log audit trail
    await AuditLog.create({
      action: 'ORDER_CREATED',
      performedByName: order.customerName,
      role: req.user ? req.user.role : 'guest',
      targetType: 'Order',
      targetId: createdOrder._id.toString(),
      details: {
        orderNumber: createdOrder.orderNumber,
        tableNumber: createdOrder.tableNumber,
        totalAmount: createdOrder.totalAmount,
        itemCount: validatedItems.length,
      },
      ipAddress: req.ip || '',
    });

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: error.message || 'Failed to submit order.' });
  }
};

// @desc    Get order details by public access token (Passwordless)
// @route   GET /api/public/orders/:publicAccessToken
// @access  Public
const getOrderByAccessToken = async (req, res) => {
  try {
    const { publicAccessToken } = req.params;
    const order = await Order.findOne({ publicAccessToken })
      .populate('table', 'tableNumber floor capacity')
      .populate('paymentTransaction');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order by access token error:', error);
    res.status(500).json({ message: 'Error fetching order tracking status.' });
  }
};

// @desc    Get complete order receipt data by public access token
// @route   GET /api/public/orders/:publicAccessToken/receipt
// @access  Public
const getOrderReceipt = async (req, res) => {
  try {
    const { publicAccessToken } = req.params;
    const order = await Order.findOne({ publicAccessToken })
      .populate('paymentTransaction');

    if (!order) {
      return res.status(404).json({ message: 'Receipt not found.' });
    }

    const settings = await RestaurantSettings.findOne();

    res.json({
      receiptNumber: order.invoiceNumber || `REC-${order.orderNumber}`,
      orderNumber: order.orderNumber,
      orderDate: order.paidAt || order.createdAt,
      status: order.paymentStatus === 'PAID' ? 'PAID' : 'PAYMENT_PENDING',
      kitchenStatus: order.status,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      tableNumber: order.tableNumber,
      floor: order.floor,
      numberOfPersons: order.numberOfPersons,
      items: order.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.price,
        itemTotal: i.price * i.quantity,
        type: i.type,
      })),
      subtotal: order.subtotal,
      taxRate: order.taxRate || 5.0,
      tax: order.tax,
      totalAmount: order.totalAmount,
      currency: order.currency || 'INR',
      currencySymbol: '₹',
      paymentMethod: order.paymentTransaction?.method || 'Online Checkout (UPI/Card)',
      paymentReference: order.paymentTransaction?.gatewayPaymentId || 'N/A',
      restaurant: {
        name: settings?.restaurantName || 'DineSync Demo Restaurant',
        gstin: settings?.gstin || '29ABCDE1234F1Z5',
        address: settings?.address || '100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
        phone: settings?.phone || '+91 98765 43210',
        email: settings?.email || 'contact@dinesync.com',
      },
    });
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({ message: 'Error generating receipt.' });
  }
};

// @desc    Get all orders (Chef / Admin / Waiter view with filters)
// @route   GET /api/orders
// @access  Private/Staff
const getOrders = async (req, res) => {
  try {
    const { status, tableNumber, floor, search, paidOnly } = req.query;
    let query = {};

    // Chef KDS should only see confirmed/paid orders
    if (paidOnly === 'true' || req.user.role === 'chef') {
      query.paymentStatus = 'PAID';
      query.status = { $ne: 'Pending_Payment' };
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (floor && floor !== 'All') {
      query.floor = floor;
    }

    if (tableNumber) {
      query.tableNumber = { $regex: tableNumber.toString(), $options: 'i' };
    }

    let orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .populate('paymentTransaction')
      .sort({ createdAt: -1 });

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      orders = orders.filter((order) => {
        const matchesCustomer =
          (order.customer && order.customer.name.match(searchRegex)) ||
          (order.customerName && order.customerName.match(searchRegex));
        const matchesTable = order.tableNumber.match(searchRegex);
        const matchesOrderNum = order.orderNumber && order.orderNumber.match(searchRegex);
        const matchesInvoice = order.invoiceNumber && order.invoiceNumber.match(searchRegex);
        return matchesCustomer || matchesTable || matchesOrderNum || matchesInvoice;
      });
    }

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Error fetching orders.' });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private/Customer
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('paymentTransaction')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order history.' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private/Staff or Public with Token
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('paymentTransaction');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Authorization check
    if (
      req.user &&
      (['admin', 'chef', 'waiter'].includes(req.user.role) ||
        (order.customer && order.customer._id.toString() === req.user._id.toString()))
    ) {
      return res.json(order);
    }

    res.status(403).json({ message: 'Not authorized to view this order.' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order details.' });
  }
};

// @desc    Update order kitchen status with valid transition enforcement
// @route   PUT /api/orders/:id/status
// @access  Private/Staff
const updateOrderStatus = async (req, res) => {
  try {
    let { status } = req.body;

    // Normalize legacy status names
    if (status === 'Pending') status = 'Confirmed';

    const validStatuses = [
      'Pending_Payment',
      'Confirmed',
      'Accepted',
      'Preparing',
      'Ready',
      'Served',
      'Completed',
      'Cancelled',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status "${status}".` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Role restrictions
    if (req.user && req.user.role === 'waiter' && !['Ready', 'Served', 'Completed'].includes(status)) {
      return res.status(403).json({ message: 'Waiters can only mark orders as Served or Completed.' });
    }

    // Unpaid orders cannot advance to kitchen workflow
    if (order.paymentStatus !== 'PAID' && ['Accepted', 'Preparing', 'Ready', 'Served', 'Completed'].includes(status)) {
      return res.status(400).json({
        message: 'Cannot advance kitchen status on an unpaid order. Payment must be confirmed first.',
      });
    }

    // Disallow transitions from terminal states
    if (['Completed', 'Cancelled'].includes(order.status)) {
      return res.status(400).json({ message: `Cannot change status of an already ${order.status} order.` });
    }

    // Auto-generate invoice number if confirmed/paid and not present
    if (order.paymentStatus === 'PAID' && !order.invoiceNumber) {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const invoiceCount = await Order.countDocuments({ invoiceNumber: { $exists: true, $ne: null } });
      order.invoiceNumber = `INV-${dateStr}-${String(invoiceCount + 1).padStart(4, '0')}`;
      order.paidAt = order.paidAt || new Date();
    }

    // Record milestone timestamps
    if (status === 'Accepted') {
      order.acceptedAt = order.acceptedAt || new Date();
    } else if (status === 'Preparing') {
      order.preparedAt = order.preparedAt || new Date();
    } else if (status === 'Served') {
      order.servedAt = order.servedAt || new Date();
    } else if (status === 'Completed') {
      order.completedAt = order.completedAt || new Date();
    } else if (status === 'Cancelled') {
      order.cancelledAt = order.cancelledAt || new Date();
    }

    order.status = status;
    const updatedOrder = await order.save();

    // Free table when Completed or Cancelled
    let freedTable = null;
    if (status === 'Completed' || status === 'Cancelled') {
      const activeOrders = await Order.findOne({
        _id: { $ne: order._id },
        tableNumber: order.tableNumber,
        status: { $in: ['Confirmed', 'Accepted', 'Preparing', 'Ready'] },
      });

      if (!activeOrders) {
        const table = await Table.findOne({ tableNumber: order.tableNumber, isArchived: false });
        if (table && table.status === 'Occupied') {
          table.status = 'Available';
          freedTable = await table.save();
        }
      }
    }

    // Audit log state update
    if (req.user) {
      await AuditLog.create({
        action: 'ORDER_STATUS_UPDATED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        role: req.user.role,
        targetType: 'Order',
        targetId: order._id.toString(),
        details: { orderNumber: order.orderNumber, newStatus: status },
      });
    }

    // Broadcast real-time Socket.IO events
    try {
      const io = getIO();
      if (io) {
        io.emit('orderStatusUpdated', updatedOrder);
        if (freedTable) {
          io.emit('tableStatusUpdated', freedTable);
        }
      }
    } catch (socketErr) {
      console.error('Socket emission error:', socketErr);
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Failed to update order status.' });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    await Order.deleteOne({ _id: req.params.id });

    try {
      const io = getIO();
      if (io) {
        io.emit('orderDeleted', { orderId: req.params.id });
      }
    } catch (e) {}

    res.json({ message: 'Order deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete order.' });
  }
};

module.exports = {
  createOrder,
  getOrderByAccessToken,
  getOrderReceipt,
  getOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
};
