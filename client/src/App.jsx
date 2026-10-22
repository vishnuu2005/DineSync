import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Customer Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CustomerDashboard from './pages/CustomerDashboard';
import CartPage from './pages/CartPage';
import OrderStatusPage from './pages/OrderStatusPage';
import MyOrdersPage from './pages/MyOrdersPage';
import NotFoundPage from './pages/NotFoundPage';

// Chef KDS Pages
import ChefLoginPage from './pages/chef/ChefLoginPage';
import KitchenDashboard from './pages/chef/KitchenDashboard';

// Waiter Service Pages
import WaiterLoginPage from './pages/waiter/WaiterLoginPage';
import WaiterDashboard from './pages/waiter/WaiterDashboard';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminMenuPage from './pages/admin/AdminMenuPage';
import AdminFloorsPage from './pages/admin/AdminFloorsPage';
import AdminBillingPage from './pages/admin/AdminBillingPage';
import AdminStaffPage from './pages/admin/AdminStaffPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminFeedbackPage from './pages/admin/AdminFeedbackPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminQRCodesPage from './pages/admin/AdminQRCodesPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* Public Customer Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/menu" element={<CustomerDashboard />} />
            <Route path="/menu/t/:token" element={<CustomerDashboard />} />
            <Route path="/dashboard" element={<CustomerDashboard />} />
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/order-status/:token" element={<OrderStatusPage />} />
            <Route path="/order-confirmation/:id" element={<OrderStatusPage />} />

            {/* Customer Account Order History (Protected) */}
            <Route
              path="/my-orders"
              element={
                <ProtectedRoute>
                  <MyOrdersPage />
                </ProtectedRoute>
              }
            />

            {/* Chef KDS Routes */}
            <Route path="/chef/login" element={<ChefLoginPage />} />
            <Route
              path="/chef/dashboard"
              element={
                <ProtectedRoute staffOnly>
                  <KitchenDashboard />
                </ProtectedRoute>
              }
            />

            {/* Waiter Service Routes */}
            <Route path="/waiter/login" element={<WaiterLoginPage />} />
            <Route
              path="/waiter/dashboard"
              element={
                <ProtectedRoute staffOnly>
                  <WaiterDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Management Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/floors"
              element={
                <ProtectedRoute adminOnly>
                  <AdminFloorsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/menu"
              element={
                <ProtectedRoute adminOnly>
                  <AdminMenuPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute adminOnly>
                  <AdminOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/billing"
              element={
                <ProtectedRoute adminOnly>
                  <AdminBillingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/staff"
              element={
                <ProtectedRoute adminOnly>
                  <AdminStaffPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/qr-codes"
              element={
                <ProtectedRoute adminOnly>
                  <AdminQRCodesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/customers"
              element={
                <ProtectedRoute adminOnly>
                  <AdminCustomersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/feedback"
              element={
                <ProtectedRoute adminOnly>
                  <AdminFeedbackPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute adminOnly>
                  <AdminAnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute adminOnly>
                  <AdminSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute adminOnly>
                  <AdminAuditLogsPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
