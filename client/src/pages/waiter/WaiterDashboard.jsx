import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Utensils,
  CheckCircle2,
  Clock,
  Layers,
  Users,
  LogOut,
  RefreshCw,
  BellRing,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Check,
  AlertCircle,
  ChefHat,
  X,
  Coffee,
  Info,
} from 'lucide-react';

const WaiterDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [floors, setFloors] = useState([]);
  const [activeFloor, setActiveFloor] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Occupied' | 'Available'
  const [searchTable, setSearchTable] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [resettingTableId, setResettingTableId] = useState(null);

  // Modal & Toast states
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, table: null, activeOrder: null });
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetchWaiterData();

    const socket = getSocket();
    if (socket) {
      socket.on('newOrder', () => fetchWaiterData());
      socket.on('orderStatusUpdated', (updated) => {
        setOrders((prev) => prev.map((o) => (o._id === updated._id ? { ...o, ...updated } : o)));
      });
      socket.on('tableStatusUpdated', (updatedTable) => {
        setTables((prev) =>
          prev.map((t) =>
            t._id === updatedTable._id || t.tableNumber === updatedTable.tableNumber
              ? { ...t, ...updatedTable }
              : t
          )
        );
      });
    }

    const interval = setInterval(fetchWaiterData, 12000);
    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('newOrder');
        socket.off('orderStatusUpdated');
        socket.off('tableStatusUpdated');
      }
    };
  }, []);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const fetchWaiterData = async () => {
    try {
      const [ordersRes, tablesRes, floorsRes] = await Promise.all([
        api.get('/orders?paidOnly=true'),
        api.get('/tables'),
        api.get('/floors').catch(() => ({ data: [] })),
      ]);

      setOrders(ordersRes.data || []);
      setTables(tablesRes.data?.all || []);
      setFloors(floorsRes.data || []);
    } catch (err) {
      console.error('Waiter dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mark order served to table
  const handleMarkServed = async (orderId) => {
    try {
      setUpdatingOrderId(orderId);
      const res = await api.put(`/orders/${orderId}/status`, { status: 'Served' });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? res.data : o)));
      showToast(`Order served! Guests are now dining at Table ${res.data.tableNumber}.`);
    } catch (err) {
      console.error('Mark served error:', err);
      showToast(err.response?.data?.message || 'Failed to update order status.', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Reset table occupancy after dine completion
  const handleResetOccupancy = async (tableToReset) => {
    if (!tableToReset) return;
    try {
      setResettingTableId(tableToReset._id);
      
      // Call dedicated reset-occupancy endpoint (with fallback to status update)
      let res;
      try {
        res = await api.post(`/tables/${tableToReset._id}/reset-occupancy`);
      } catch (postErr) {
        // Fallback to PUT /tables/:id/status
        res = await api.put(`/tables/${tableToReset._id}/status`, { status: 'Available' });
      }

      const updatedTable = res.data?.table || res.data;

      // Optimistically update tables in state
      setTables((prev) =>
        prev.map((t) => (t._id === tableToReset._id ? { ...t, status: 'Available' } : t))
      );

      // Optimistically complete served orders for this table in state
      setOrders((prev) =>
        prev.map((o) =>
          o.tableNumber === tableToReset.tableNumber && ['Served', 'Ready', 'Preparing', 'Accepted', 'Confirmed'].includes(o.status)
            ? { ...o, status: 'Completed', completedAt: new Date() }
            : o
        )
      );

      setConfirmModal({ isOpen: false, table: null, activeOrder: null });
      showToast(
        `Table T-${tableToReset.tableNumber} occupancy reset to Available! Dine completed and table is ready for new guests.`,
        'success'
      );
    } catch (err) {
      console.error('Reset occupancy error:', err);
      showToast(err.response?.data?.message || 'Failed to reset table occupancy.', 'error');
    } finally {
      setResettingTableId(null);
    }
  };

  // Quick manual toggle table status (e.g. walk-in guest or maintenance)
  const handleToggleTableStatus = async (table, targetStatus) => {
    try {
      setResettingTableId(table._id);
      const res = await api.put(`/tables/${table._id}/status`, { status: targetStatus });
      const updated = res.data?.table || res.data;
      setTables((prev) => prev.map((t) => (t._id === table._id ? { ...t, status: targetStatus } : t)));
      showToast(`Table T-${table.tableNumber} status set to ${targetStatus}.`);
    } catch (err) {
      console.error('Toggle status error:', err);
      showToast('Failed to update table status.', 'error');
    } finally {
      setResettingTableId(null);
    }
  };

  // Categorize orders
  const readyOrders = useMemo(() => orders.filter((o) => o.status === 'Ready'), [orders]);
  const diningOrders = useMemo(() => orders.filter((o) => o.status === 'Served'), [orders]);
  const cookingOrders = useMemo(
    () => orders.filter((o) => ['Confirmed', 'Accepted', 'Preparing'].includes(o.status)),
    [orders]
  );
  const completedTodayOrders = useMemo(() => orders.filter((o) => o.status === 'Completed'), [orders]);

  // Filtered tables
  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const matchesFloor = activeFloor === 'All' || table.floor === activeFloor;
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Occupied' && table.status === 'Occupied') ||
        (statusFilter === 'Available' && table.status === 'Available');
      const matchesSearch =
        !searchTable.trim() ||
        table.tableNumber.toLowerCase().includes(searchTable.toLowerCase().trim());
      return matchesFloor && matchesStatus && matchesSearch;
    });
  }, [tables, activeFloor, statusFilter, searchTable]);

  const occupiedCount = tables.filter((t) => t.status === 'Occupied').length;
  const availableCount = tables.filter((t) => t.status === 'Available').length;

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce transition-all">
          <div
            className={`px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold border ${
              toastMessage.type === 'error'
                ? 'bg-red-950 text-red-200 border-red-800'
                : 'bg-[#1A0F0A] text-[#FAEDCD] border-[#D4A373]'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-[#1A0F0A] text-white border-b border-[#8B5E3C]/30 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8B5E3C] to-[#5C381E] text-[#FAEDCD] flex items-center justify-center font-bold shadow-inner">
            <Utensils className="w-5 h-5 text-[#FAEDCD]" />
          </div>
          <div>
            <h1 className="font-[#Outfit] text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              DineSync <span className="text-[#D4A373]">Floor Service</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Staff
              </span>
            </h1>
            <p className="text-[11px] text-[#FAEDCD]/80">
              Floor Captain: {user?.name || 'Liam Staff'} • Table Service & Dine Completion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchWaiterData}
            title="Refresh floor and order status"
            className="p-2.5 rounded-xl bg-[#281B15] hover:bg-[#3A2218] text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#8B5E3C]/30"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => {
              logout();
              navigate('/waiter/login');
            }}
            className="px-3.5 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold flex items-center gap-1.5 border border-red-800/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Real-time KPI Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#D4A373]/30 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Ready to Deliver</p>
              <h3 className="text-2xl sm:text-3xl font-black text-[#2C1810] mt-0.5">{readyOrders.length}</h3>
              <p className="text-[10px] text-amber-700 font-semibold mt-0.5">Kitchen counter ready</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#D4A373]/30 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Guests Dining</p>
              <h3 className="text-2xl sm:text-3xl font-black text-purple-950 mt-0.5">{diningOrders.length}</h3>
              <p className="text-[10px] text-purple-700 font-semibold mt-0.5">Food served & enjoying</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
              <Utensils className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#D4A373]/30 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Active Tables</p>
              <h3 className="text-2xl sm:text-3xl font-black text-[#8B5E3C] mt-0.5">
                {occupiedCount} <span className="text-base text-gray-400 font-medium">/ {tables.length}</span>
              </h3>
              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">{availableCount} tables available</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FAEDCD] text-[#8B5E3C] flex items-center justify-center border border-[#D4A373]/40">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#D4A373]/30 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Cooking in Kitchen</p>
              <h3 className="text-2xl sm:text-3xl font-black text-orange-950 mt-0.5">{cookingOrders.length}</h3>
              <p className="text-[10px] text-orange-700 font-semibold mt-0.5">Chef preparation active</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-200">
              <ChefHat className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* SECTION 1: Ready Orders (Needs Delivery to Table) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-[#Outfit] text-xl font-extrabold text-[#2C1810] flex items-center gap-2">
              <BellRing className="w-5 h-5 text-amber-600" />
              Orders Ready to Serve ({readyOrders.length})
            </h2>
            <span className="text-xs font-semibold text-gray-500">Pick up from Kitchen Counter</span>
          </div>

          {readyOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {readyOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white rounded-3xl border-2 border-amber-400 p-6 shadow-md hover:shadow-xl transition-all space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        Ready For Table
                      </span>
                      <h3 className="font-[#Outfit] text-2xl font-black text-[#2C1810] mt-1.5">
                        Table {order.tableNumber}
                      </h3>
                      <p className="text-xs text-gray-500">{order.floor || 'Ground Floor'} • {order.customerName || 'Guest'}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-gray-500 block">
                        #{order.orderNumber}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600">PAID ₹{order.totalAmount}</span>
                    </div>
                  </div>

                  <div className="bg-[#FAF7F2] p-3 rounded-2xl divide-y divide-gray-200/60 text-xs">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="py-1.5 flex justify-between">
                        <span className="font-semibold text-gray-800">
                          {item.quantity}× {item.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.specialInstructions && (
                    <p className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      <strong>Note:</strong> {order.specialInstructions}
                    </p>
                  )}

                  <button
                    onClick={() => handleMarkServed(order._id)}
                    disabled={updatingOrderId === order._id}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{updatingOrderId === order._id ? 'Updating...' : 'Acknowledge: Served to Table'}</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#D4A373]/20 p-6 text-center text-gray-500 text-xs flex flex-col items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-500 mb-1.5 opacity-80" />
              <p className="font-semibold text-gray-700">All prepared dishes delivered to tables</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Kitchen counter is clear. No dishes waiting for pickup.</p>
            </div>
          )}
        </section>

        {/* SECTION 2: GUESTS CURRENTLY DINING & RESET TABLE OCCUPANCY */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-[#Outfit] text-xl font-extrabold text-[#2C1810] flex items-center gap-2">
                <Utensils className="w-5 h-5 text-purple-700" />
                Guests Currently Dining ({diningOrders.length})
              </h2>
              <p className="text-xs text-gray-500">
                Food has been served. When customers finish their dine, reset the table occupancy to make it Available.
              </p>
            </div>
            {diningOrders.length > 0 && (
              <span className="text-[11px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full w-fit">
                {diningOrders.length} active dining session{diningOrders.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {diningOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {diningOrders.map((order) => {
                const correspondingTable = tables.find((t) => t.tableNumber === order.tableNumber);
                const isResetting = resettingTableId === (correspondingTable?._id || order.tableNumber);

                return (
                  <div
                    key={order._id}
                    className="bg-white rounded-3xl border-2 border-purple-200 p-6 shadow-md hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                            Dining in Progress
                          </span>
                          <h3 className="font-[#Outfit] text-2xl font-black text-[#2C1810] mt-1.5">
                            Table {order.tableNumber}
                          </h3>
                          <p className="text-xs text-gray-500">{order.floor || 'Ground Floor'} • {order.customerName || 'Guest Customer'}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs font-bold text-gray-500 block">
                            #{order.orderNumber}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-600">PAID ₹{order.totalAmount}</span>
                        </div>
                      </div>

                      {/* Items brief */}
                      <div className="bg-[#FAF7F2] p-3 rounded-2xl text-xs space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Served Dishes</p>
                        <p className="font-semibold text-gray-800 line-clamp-2">
                          {order.items?.map((item) => `${item.quantity}× ${item.name}`).join(', ')}
                        </p>
                      </div>

                      {/* Timeline info */}
                      <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-purple-600" />
                          Served: {new Date(order.servedAt || order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-purple-700 font-semibold">
                          {order.numberOfPersons || 2} Guests
                        </span>
                      </div>
                    </div>

                    {/* Reset Occupancy Action Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          if (correspondingTable) {
                            setConfirmModal({
                              isOpen: true,
                              table: correspondingTable,
                              activeOrder: order,
                            });
                          } else {
                            // Direct complete order fallback
                            handleResetOccupancy({ tableNumber: order.tableNumber });
                          }
                        }}
                        disabled={isResetting}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                        <span>
                          {isResetting
                            ? 'Resetting Table...'
                            : 'Customer Completed Dine → Reset Table'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#D4A373]/20 p-6 text-center text-gray-500 text-xs flex flex-col items-center justify-center">
              <Utensils className="w-7 h-7 text-purple-400 mb-1.5 opacity-70" />
              <p className="font-semibold text-gray-700">No guests currently dining</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                When kitchen orders are acknowledged as served, active tables appear here for dine completion and table reset.
              </p>
            </div>
          )}
        </section>

        {/* SECTION 3: FLOOR TABLE OCCUPANCY & RESET MANAGEMENT */}
        <section className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="font-[#Outfit] text-xl font-bold text-[#2C1810] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#8B5E3C]" /> Floor Table Occupancy & Reset Management
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Monitor real-time floor occupancy and reset tables as soon as guests complete their meal.
              </p>
            </div>

            {/* Status Filter Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setStatusFilter('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'All'
                    ? 'bg-[#2C1810] text-[#FAEDCD] shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Tables ({tables.length})
              </button>
              <button
                onClick={() => setStatusFilter('Occupied')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'Occupied'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Occupied ({occupiedCount})
              </button>
              <button
                onClick={() => setStatusFilter('Available')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'Available'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Available ({availableCount})
              </button>
            </div>
          </div>

          {/* Floor Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setActiveFloor('All')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  activeFloor === 'All'
                    ? 'bg-[#8B5E3C] text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-gray-600 hover:bg-[#F3ECE4]'
                }`}
              >
                All Floors
              </button>
              {floors.map((fl) => (
                <button
                  key={fl._id || fl.name}
                  onClick={() => setActiveFloor(fl.name)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    activeFloor === fl.name
                      ? 'bg-[#8B5E3C] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-gray-600 hover:bg-[#F3ECE4]'
                  }`}
                >
                  {fl.name}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search table number..."
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F2] border border-[#D4A373]/30 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#8B5E3C]"
              />
              {searchTable && (
                <button
                  onClick={() => setSearchTable('')}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Grid of Interactive Table Cards */}
          {filteredTables.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTables.map((table) => {
                const isOccupied = table.status === 'Occupied';
                const isResetting = resettingTableId === table._id;
                
                // Find any active order for this table
                const diningOrderForTable = diningOrders.find((o) => o.tableNumber === table.tableNumber);
                const readyOrderForTable = readyOrders.find((o) => o.tableNumber === table.tableNumber);
                const cookingOrderForTable = cookingOrders.find((o) => o.tableNumber === table.tableNumber);
                const activeOrder = diningOrderForTable || readyOrderForTable || cookingOrderForTable;

                return (
                  <div
                    key={table._id}
                    className={`rounded-3xl border-2 p-5 transition-all flex flex-col justify-between ${
                      isOccupied
                        ? 'bg-amber-50/70 border-amber-300 shadow-sm'
                        : 'bg-emerald-50/40 border-emerald-200'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="block font-[#Outfit] text-2xl font-black text-[#2C1810]">
                            T-{table.tableNumber}
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium">{table.floor}</span>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                            isOccupied
                              ? 'bg-amber-200/80 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOccupied ? 'bg-amber-600 animate-pulse' : 'bg-emerald-500'
                            }`}
                          />
                          {table.status}
                        </span>
                      </div>

                      {/* Capacity & Details */}
                      <div className="mt-3 py-2 px-3 rounded-2xl bg-white/80 border border-gray-100 text-[11px] space-y-1">
                        <div className="flex justify-between text-gray-600">
                          <span>Capacity:</span>
                          <span className="font-bold text-gray-800">{table.capacity} Persons</span>
                        </div>

                        {activeOrder && (
                          <div className="pt-1 border-t border-gray-100 flex justify-between items-center text-[10px]">
                            <span className="font-semibold text-gray-600 truncate max-w-[120px]">
                              {activeOrder.customerName || 'Guest'} (#{activeOrder.orderNumber})
                            </span>
                            <span className="font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                              {activeOrder.status}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Table Actions */}
                    <div className="mt-4 pt-3 border-t border-gray-200/60">
                      {isOccupied ? (
                        <div className="space-y-1.5">
                          <button
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                table,
                                activeOrder,
                              })
                            }
                            disabled={isResetting}
                            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs hover:shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                            <span>{isResetting ? 'Resetting...' : 'Reset Occupancy'}</span>
                          </button>
                          <p className="text-[10px] text-center text-amber-800/80 font-medium">
                            Customer completed dine? Click to free table
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Ready for Guests
                          </span>
                          <button
                            onClick={() => handleToggleTableStatus(table, 'Occupied')}
                            className="text-[10px] text-gray-500 hover:text-amber-800 font-bold underline cursor-pointer"
                            title="Mark table as Occupied for manual walk-in guests"
                          >
                            Mark Occupied
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 text-xs">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-gray-400" />
              No tables match your active filters.
            </div>
          )}
        </section>

        {/* SECTION 4: Kitchen Preparation Status */}
        <section className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-[#Outfit] text-lg font-bold text-[#2C1810] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#8B5E3C]" /> Orders Currently Cooking in Kitchen ({cookingOrders.length})
            </h3>
            <span className="text-xs text-gray-400">Live Kitchen KDS Sync</span>
          </div>

          {cookingOrders.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {cookingOrders.map((order) => (
                <div key={order._id} className="py-3 flex items-center justify-between text-xs gap-4">
                  <div>
                    <span className="font-bold text-sm text-[#2C1810]">
                      Table {order.tableNumber} • #{order.orderNumber}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({order.floor || 'Ground Floor'} • {order.customerName || 'Guest'})
                    </span>
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      {order.items?.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-3 text-center">No orders currently in the kitchen cooking queue.</p>
          )}
        </section>
      </main>

      {/* CONFIRM RESET TABLE OCCUPANCY MODAL */}
      {confirmModal.isOpen && confirmModal.table && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#8B5E3C]/20 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <RotateCcw className="w-6 h-6" />
              </div>
              <button
                onClick={() => setConfirmModal({ isOpen: false, table: null, activeOrder: null })}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="font-[#Outfit] text-xl font-black text-[#2C1810]">
                Reset Table T-{confirmModal.table.tableNumber} Occupancy?
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Confirm that the customer has completed their dine and the table has been cleaned. This will immediately free the table for incoming guests.
              </p>
            </div>

            {confirmModal.activeOrder && (
              <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-gray-200/80 text-xs space-y-1.5">
                <div className="flex justify-between font-bold text-gray-800">
                  <span>Active Dining Order:</span>
                  <span className="font-mono text-purple-700">#{confirmModal.activeOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-[11px]">
                  <span>Customer:</span>
                  <span>{confirmModal.activeOrder.customerName || 'Guest Customer'}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-[11px]">
                  <span>Floor Location:</span>
                  <span>{confirmModal.table.floor || 'Ground Floor'}</span>
                </div>
                <p className="text-[10px] text-emerald-700 font-semibold pt-1 border-t border-gray-200">
                  ✓ This will mark the order as Completed and update all dashboards in real-time.
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, table: null, activeOrder: null })}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resettingTableId === confirmModal.table._id}
                onClick={() => handleResetOccupancy(confirmModal.table)}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>
                  {resettingTableId === confirmModal.table._id
                    ? 'Freeing Table...'
                    : 'Confirm & Reset Table'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterDashboard;
