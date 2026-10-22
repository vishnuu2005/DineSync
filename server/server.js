const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initSocket } = require('./utils/socket');

// Load environment variables
dotenv.config();

// Connect to MongoDB Database (with seamless failover)
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with HTTP server
const io = initSocket(server);
app.set('io', io);

// Security & Parsing Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.APP_BASE_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly permissive for local testing
    },
    credentials: true,
  })
);

app.use(cookieParser());

// Express JSON with raw body capture for webhook HMAC signature verification & high-res image payloads
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin/auth', require('./routes/authRoutes'));
app.use('/api/chef/auth', require('./routes/authRoutes'));
app.use('/api/waiter/auth', require('./routes/authRoutes'));

app.use('/api/floors', require('./routes/floorRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/tables', require('./routes/tableRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/webhooks', require('./routes/webhookRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));

// Public Customer Endpoints (Section 16 Specification)
const tableController = require('./controllers/tableController');
const productController = require('./controllers/productController');
const categoryController = require('./controllers/categoryController');
const orderController = require('./controllers/orderController');
const paymentController = require('./controllers/paymentController');

app.get('/api/public/tables/:token', tableController.getTableByToken);
app.get('/api/public/menu', productController.getPublicMenu);
app.get('/api/public/menu/categories', categoryController.getCategories);
app.post('/api/public/orders', orderController.createOrder);
app.get('/api/public/orders/:publicAccessToken', orderController.getOrderByAccessToken);
app.get('/api/public/orders/:publicAccessToken/receipt', orderController.getOrderReceipt);
app.post('/api/public/orders/:id/payment', paymentController.initiatePayment);
app.post('/api/public/payments/verify', paymentController.verifyPayment);

// Explicit Admin Routes (Section 16 Specification & Client Compatibility)
const { protect } = require('./middleware/authMiddleware');
const { adminOnly } = require('./middleware/adminMiddleware');
const userController = require('./controllers/userController');
const settingsController = require('./controllers/settingsController');

app.get('/api/admin/dashboard', protect, adminOnly, userController.getAdminStats);
app.get('/api/admin/payments', protect, adminOnly, paymentController.getAdminPayments);
app.post('/api/admin/payments/:id/refund', protect, adminOnly, paymentController.processRefund);
app.get('/api/admin/orders', protect, adminOnly, orderController.getOrders);
app.get('/api/admin/reports', protect, adminOnly, userController.getAdminStats);
app.get('/api/admin/staff', protect, adminOnly, userController.getStaff);
app.get('/api/admin/audit-logs', protect, adminOnly, settingsController.getAuditLogs);
app.get('/api/audit-logs', protect, adminOnly, settingsController.getAuditLogs);


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: 'connected',
    service: 'DineSync API',
  });
});

// Serve frontend SPA build in production if compiled
const path = require('path');
const fs = require('fs');
const clientDistPath = path.join(__dirname, '../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      status: 'healthy',
      platform: 'DineSync Restaurant Management API',
      socketIO: true,
      timestamp: new Date().toISOString(),
    });
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 DineSync server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = { app, server };
