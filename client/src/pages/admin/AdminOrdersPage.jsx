import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import OrderTable from '../../components/admin/OrderTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { handleImageError, getCategoryFallbackImage } from '../../utils/imageFallbacks';
import { Search, Filter, Hash, RefreshCw, ClipboardList, CheckCircle2 } from 'lucide-react';

const statusFilterOptions = ['All', 'Confirmed', 'Accepted', 'Preparing', 'Ready', 'Served', 'Completed', 'Cancelled', 'Pending_Payment'];

const AdminOrdersPage = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [tableFilter, setTableFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();

    const socket = getSocket();
    if (socket) {
      socket.on('newOrder', () => {
        fetchOrders();
      });
      socket.on('orderStatusUpdated', () => {
        fetchOrders();
      });
      socket.on('orderDeleted', () => {
        fetchOrders();
      });
    }

    return () => {
      if (socket) {
        socket.off('newOrder');
        socket.off('orderStatusUpdated');
        socket.off('orderDeleted');
      }
    };
  }, [selectedStatus, tableFilter]);


  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (selectedStatus !== 'All') {
        params.append('status', selectedStatus);
      }
      if (tableFilter.trim()) {
        params.append('tableNumber', tableFilter.trim());
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const res = await api.get(`/orders?${params.toString()}`);
      setOrders(res.data);
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
      fetchOrders();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update order status.';
      alert(msg);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to remove this order from registry?')) {
      try {
        await api.delete(`/orders/${orderId}`);
        fetchOrders();
      } catch (err) {
        alert('Failed to delete order entry.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <AdminSidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <AdminHeader
          title="Order Pipeline Management"
          subtitle="Monitor active table orders and update kitchen status transitions"
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Controls & Filter Bar */}
          <div className="bg-white p-5 rounded-3xl border border-[#D4A373]/25 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
                  placeholder="Search customer, ID or items..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#D4A373]/30 rounded-xl text-xs text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]"
                />
              </div>

              {/* Table Number Filter */}
              <div className="relative">
                <Hash className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={tableFilter}
                  onChange={(e) => setTableFilter(e.target.value)}
                  placeholder="Filter by Table # (e.g. Table 04)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#D4A373]/30 rounded-xl text-xs text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#D4A373]/30 rounded-xl text-xs font-bold text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]"
                >
                  {statusFilterOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      Status: {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Status Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 custom-scrollbar">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
                Filter Status:
              </span>
              {statusFilterOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedStatus === status
                      ? 'bg-[#8B5E3C] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-gray-600 hover:bg-[#FAEDCD]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-[#Outfit] text-lg font-bold text-[#2C1810] flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#8B5E3C]" /> Customer Table Orders ({orders.length})
            </h3>

            <button
              onClick={fetchOrders}
              className="px-3 py-1.5 bg-white border border-[#D4A373]/30 text-[#8B5E3C] hover:bg-[#FAEDCD] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Orders List
            </button>
          </div>

          {/* Orders Table */}
          {loading ? (
            <div className="py-16">
              <LoadingSpinner text="Loading orders pipeline..." />
            </div>
          ) : (
            <OrderTable
              orders={orders}
              onStatusChange={handleStatusChange}
              onDeleteOrder={handleDeleteOrder}
              onViewOrder={(order) => setSelectedOrder(order)}
            />
          )}
        </main>
      </div>

      {/* Detailed Order Receipt Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order #${selectedOrder._id}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center bg-[#FAF7F2] p-3 rounded-xl border border-[#D4A373]/30">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Customer Name</span>
                <span className="font-bold text-sm text-[#2C1810]">{selectedOrder.customer?.name}</span>
                <span className="block text-[11px] text-gray-500">{selectedOrder.customer?.phone || selectedOrder.customer?.email}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Table & Floor</span>
                <span className="font-extrabold text-base text-[#8B5E3C]">
                  Table {selectedOrder.tableNumber} ({selectedOrder.floor || 'Ground Floor'})
                </span>
                <span className="block text-[11px] text-gray-600 font-bold">
                  {selectedOrder.numberOfPersons || 1} Persons
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-600">Current Status:</span>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <div>
              <h4 className="font-bold text-[#2C1810] mb-2 uppercase text-[10px] tracking-wider text-gray-400">
                Itemized Order List
              </h4>
              <div className="divide-y border rounded-xl overflow-hidden bg-white">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image || getCategoryFallbackImage(item.category)}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover"
                        onError={(e) => handleImageError(e, item.category)}
                      />
                      <div>
                        <span className="font-bold text-[#2C1810] block">{item.name}</span>
                        <span className="text-[10px] text-gray-400">₹{item.price} x {item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-bold font-[#Outfit]">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t space-y-1 text-gray-600 text-xs">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-[#2C1810]">₹{selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (5%)</span>
                <span className="font-semibold text-[#2C1810]">₹{selectedOrder.tax.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t flex justify-between items-center text-base font-extrabold text-[#2C1810]">
                <span>Total Bill Amount</span>
                <span className="font-[#Outfit] text-xl text-[#8B5E3C]">
                  ₹{selectedOrder.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminOrdersPage;
