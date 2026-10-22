import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { Users, Mail, Phone, Calendar, ShoppingBag, DollarSign, Search } from 'lucide-react';

const AdminCustomersPage = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setCustomers(res.data);
    } catch (err) {
      console.error('Fetch customers error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <AdminSidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <AdminHeader
          title="Registered Customer Directory"
          subtitle="View customer order frequency, total spending metrics, and contact info"
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Action Bar */}
          <div className="bg-white p-5 rounded-3xl border border-[#D4A373]/25 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer name, email or phone..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#D4A373]/30 rounded-xl text-xs text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]"
              />
            </div>

            <div className="text-xs font-bold text-[#8B5E3C] bg-[#FAEDCD] px-3.5 py-2 rounded-xl border border-[#D4A373]/30">
              Total Customers Registered: {filteredCustomers.length}
            </div>
          </div>

          {/* Directory Table */}
          {loading ? (
            <div className="py-16">
              <LoadingSpinner text="Fetching customer directory..." />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#D4A373]/25 shadow-xs overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF7F2] border-b border-[#D4A373]/20 text-[11px] font-bold text-[#8B5E3C] uppercase tracking-wider">
                      <th className="py-3.5 px-4">Customer Name</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">Phone Number</th>
                      <th className="py-3.5 px-4">Orders Placed</th>
                      <th className="py-3.5 px-4">Total Spending (₹)</th>
                      <th className="py-3.5 px-4">Registration Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredCustomers.map((customer) => {
                      const regDate = new Date(customer.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });

                      return (
                        <tr key={customer._id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                          {/* Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#8B5E3C] text-[#FAEDCD] flex items-center justify-center font-bold text-xs">
                                {customer.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-[#2C1810] text-sm">
                                {customer.name}
                              </span>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="py-3.5 px-4 text-gray-600 font-medium">
                            {customer.email}
                          </td>

                          {/* Phone */}
                          <td className="py-3.5 px-4 text-gray-600 font-mono">
                            {customer.phone || 'N/A'}
                          </td>

                          {/* Orders */}
                          <td className="py-3.5 px-4 font-bold text-[#2C1810]">
                            <span className="inline-flex items-center gap-1 bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-[#D4A373]/30">
                              <ShoppingBag className="w-3.5 h-3.5 text-[#8B5E3C]" />
                              {customer.totalOrders} order(s)
                            </span>
                          </td>

                          {/* Spending */}
                          <td className="py-3.5 px-4 font-[#Outfit] font-extrabold text-sm text-[#8B5E3C]">
                            ₹{customer.totalSpent.toFixed(2)}
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-4 text-gray-400 whitespace-nowrap">
                            {regDate}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminCustomersPage;
