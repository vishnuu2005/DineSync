import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import StatCard from '../../components/admin/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import OrderTable from '../../components/admin/OrderTable';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import {
  ClipboardList,
  Clock,
  Flame,
  CheckCheck,
  DollarSign,
  Users,
  TrendingUp,
  RefreshCw,
  Award,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const AdminDashboard = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchDashboardData();

    const socket = getSocket();
    if (socket) {
      socket.on('newOrder', () => {
        fetchDashboardData();
      });
      socket.on('orderStatusUpdated', () => {
        fetchDashboardData();
      });
      socket.on('orderDeleted', () => {
        fetchDashboardData();
      });
    }

    return () => {
      if (socket) {
        socket.off('newOrder');
        socket.off('orderStatusUpdated');
        socket.off('orderDeleted');
      }
    };
  }, []);


  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes] = await Promise.all([
        api.get('/users/stats'),
        api.get('/orders'),
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchDashboardData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update status.';
      alert(msg);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order entry?')) {
      try {
        await api.delete(`/orders/${orderId}`);
        fetchDashboardData();
      } catch (err) {
        alert('Failed to delete order.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <AdminSidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <AdminHeader
          title="Dashboard Overview"
          subtitle="Real-time café operations, revenue analytics, and order status pipeline"
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Action Row */}
          <div className="flex items-center justify-between">
            <h2 className="font-[#Outfit] text-lg font-bold text-[#2C1810]">
              Key Performance Metrics
            </h2>
            <button
              onClick={fetchDashboardData}
              className="px-3.5 py-1.5 bg-white border border-[#D4A373]/30 text-[#8B5E3C] hover:bg-[#FAEDCD] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
            </button>
          </div>

          {loading || !stats ? (
            <div className="py-16">
              <LoadingSpinner text="Compiling admin dashboard analytics..." />
            </div>
          ) : (
            <>
              {/* 6 Top Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <StatCard
                  title="Total Revenue"
                  value={`₹${stats.totalRevenue.toFixed(2)}`}
                  icon={DollarSign}
                  color="teal"
                  subtext="Net sales from completed orders"
                />
                <StatCard
                  title="Total Orders"
                  value={stats.totalOrders}
                  icon={ClipboardList}
                  color="brown"
                  subtext="All customer table orders"
                />
                <StatCard
                  title="Pending Orders"
                  value={stats.pendingOrders}
                  icon={Clock}
                  color="amber"
                  subtext="Needs kitchen confirmation"
                />
                <StatCard
                  title="Preparing Orders"
                  value={stats.preparingOrders}
                  icon={Flame}
                  color="orange"
                  subtext="Currently being cooked/brewed"
                />
                <StatCard
                  title="Completed Orders"
                  value={stats.completedOrders}
                  icon={CheckCheck}
                  color="emerald"
                  subtext="Successfully served to table"
                />
                <StatCard
                  title="Total Customers"
                  value={stats.totalCustomers}
                  icon={Users}
                  color="purple"
                  subtext="Registered customer accounts"
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Popular Menu Items Chart */}
                <div className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-[#Outfit] font-bold text-base text-[#2C1810] flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#8B5E3C]" /> Popular Menu Items
                      </h3>
                      <p className="text-xs text-gray-400">Most ordered coffees & food items</p>
                    </div>
                  </div>

                  <div className="h-64 w-full pt-2">
                    {stats.popularItems && stats.popularItems.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.popularItems} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#3C2A21' }} angle={-15} textAnchor="end" />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1A0F0A', color: '#FAEDCD', borderRadius: '12px', fontSize: '12px' }}
                          />
                          <Bar dataKey="quantity" fill="#8B5E3C" radius={[6, 6, 0, 0]} name="Units Sold" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-gray-400">
                        No sales data available yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Daily Revenue & Sales Chart */}
                <div className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-[#Outfit] font-bold text-base text-[#2C1810] flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#8B5E3C]" /> Revenue Breakdown (Past 7 Days)
                      </h3>
                      <p className="text-xs text-gray-400">Daily sales trend</p>
                    </div>
                  </div>

                  <div className="h-64 w-full pt-2">
                    {stats.dailySales && stats.dailySales.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.dailySales} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#3C2A21' }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1A0F0A', color: '#FAEDCD', borderRadius: '12px', fontSize: '12px' }}
                          />
                          <Line type="monotone" dataKey="revenue" stroke="#D4A373" strokeWidth={3} dot={{ r: 5, fill: '#8B5E3C' }} name="Revenue (₹)" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-gray-400">
                        No daily sales history available yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Orders Preview */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-[#Outfit] font-bold text-lg text-[#2C1810]">
                    Recent Customer Orders
                  </h3>
                  <a
                    href="/admin/orders"
                    className="text-xs font-bold text-[#8B5E3C] hover:underline"
                  >
                    View All Orders Pipeline →
                  </a>
                </div>

                <OrderTable
                  orders={recentOrders}
                  onStatusChange={handleStatusChange}
                  onDeleteOrder={handleDeleteOrder}
                  onViewOrder={(order) => setSelectedOrder(order)}
                />
              </div>
            </>
          )}
        </main>
      </div>

      {/* View Order Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Details #${selectedOrder._id}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b pb-2">
              <span className="font-bold text-gray-500">Customer:</span>
              <span className="font-bold text-[#2C1810]">{selectedOrder.customer?.name}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-bold text-gray-500">Table Number:</span>
              <span className="font-bold text-[#8B5E3C]">{selectedOrder.tableNumber}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-bold text-gray-500">Current Status:</span>
              <span className="font-bold">{selectedOrder.status}</span>
            </div>
            <div>
              <span className="font-bold text-gray-500 block mb-1">Items:</span>
              <ul className="bg-[#FAF7F2] p-3 rounded-xl divide-y space-y-1">
                {selectedOrder.items.map((i, idx) => (
                  <li key={idx} className="flex justify-between py-1">
                    <span>{i.quantity}x {i.name}</span>
                    <span className="font-bold">₹{(i.price * i.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-between text-sm font-extrabold pt-2">
              <span>Total Amount:</span>
              <span className="text-[#8B5E3C]">₹{selectedOrder.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;
