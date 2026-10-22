import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { BarChart3, TrendingUp, Award, DollarSign, RefreshCw, Layers } from 'lucide-react';
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

const AdminAnalyticsPage = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Fetch analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <AdminSidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <AdminHeader
          title="Sales & Revenue Analytics"
          subtitle="Financial performance metrics, product sales share, and daily trends"
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <h2 className="font-[#Outfit] text-lg font-bold text-[#2C1810] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#8B5E3C]" /> Financial Performance Overview
            </h2>
            <button
              onClick={fetchAnalytics}
              className="px-3.5 py-1.5 bg-white border border-[#D4A373]/30 text-[#8B5E3C] hover:bg-[#FAEDCD] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reload Analytics
            </button>
          </div>

          {loading || !stats ? (
            <div className="py-16">
              <LoadingSpinner text="Compiling financial reports..." />
            </div>
          ) : (
            <>
              {/* Summary Banner */}
              <div className="bg-gradient-to-r from-[#2C1810] via-[#3C2A21] to-[#1A0F0A] text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#D4A373]">
                    Net Revenue Accumulated
                  </span>
                  <h1 className="font-[#Outfit] text-4xl font-extrabold text-white mt-1">
                    ₹{stats.totalRevenue.toFixed(2)}
                  </h1>
                  <p className="text-xs text-gray-300 mt-1">
                    Generated across {stats.completedOrders} completed customer table orders
                  </p>
                </div>

                <div className="flex gap-4">
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/10 text-center min-w-[120px]">
                    <span className="block text-2xl font-bold font-[#Outfit]">{stats.totalOrders}</span>
                    <span className="block text-[10px] text-gray-300">Total Orders</span>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/10 text-center min-w-[120px]">
                    <span className="block text-2xl font-bold font-[#Outfit] text-[#D4A373]">{stats.totalCustomers}</span>
                    <span className="block text-[10px] text-gray-300">Registered Users</span>
                  </div>
                </div>
              </div>

              {/* Visual Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 shadow-2xs space-y-4">
                  <h3 className="font-[#Outfit] font-bold text-base text-[#2C1810] flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#8B5E3C]" /> Best Selling Menu Items (Units Sold)
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.popularItems}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1A0F0A', color: '#FAEDCD', borderRadius: '12px' }} />
                        <Bar dataKey="quantity" fill="#8B5E3C" radius={[6, 6, 0, 0]} name="Units" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 shadow-2xs space-y-4">
                  <h3 className="font-[#Outfit] font-bold text-base text-[#2C1810] flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#8B5E3C]" /> Daily Revenue Growth Trend
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.dailySales}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1A0F0A', color: '#FAEDCD', borderRadius: '12px' }} />
                        <Line type="monotone" dataKey="revenue" stroke="#D4A373" strokeWidth={3} dot={{ r: 5 }} name="Revenue (₹)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Item Revenue Table */}
              <div className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 shadow-2xs space-y-4">
                <h3 className="font-[#Outfit] font-bold text-base text-[#2C1810]">
                  Top Product Revenue Breakdown
                </h3>
                <div className="divide-y text-xs">
                  {stats.popularItems && stats.popularItems.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#FAEDCD] text-[#8B5E3C] font-bold flex items-center justify-center text-[11px]">
                          #{idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-[#2C1810] block">{item._id}</span>
                          <span className="text-[10px] text-gray-400">{item.quantity} total units sold</span>
                        </div>
                      </div>
                      <span className="font-[#Outfit] font-extrabold text-base text-[#8B5E3C]">
                        ₹{item.revenue.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
