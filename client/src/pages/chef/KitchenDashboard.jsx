import React, { useState, useEffect } from 'react';
import ChefHeader from '../../components/chef/ChefHeader';
import KitchenCard from '../../components/chef/KitchenCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import NewOrderModal from '../../components/common/NewOrderModal';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { playOrderChime } from '../../utils/audioAlert';
import {
  Clock,
  Flame,
  Bell,
  CheckCheck,
  RefreshCw,
  Layers,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';

const KitchenDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [floorFilter, setFloorFilter] = useState('All');
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    fetchKitchenOrders();

    // Socket.IO Real-time event listener
    const socket = getSocket();
    if (socket) {
      // Real-time new order received
      socket.on('newOrder', (newOrder) => {
        // Play notification chime
        if (soundEnabled) {
          playOrderChime();
        }

        // Show visual alert modal
        setNewOrderAlert(newOrder);

        // Add to orders list in state immediately
        setOrders((prev) => {
          const exists = prev.some((o) => o._id === newOrder._id);
          if (exists) return prev;
          return [newOrder, ...prev];
        });
      });

      // Real-time status update
      socket.on('orderStatusUpdated', (updatedOrder) => {
        setOrders((prev) =>
          prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
        );
      });

      // Real-time delete
      socket.on('orderDeleted', ({ orderId }) => {
        setOrders((prev) => prev.filter((o) => o._id !== orderId));
      });
    }

    // Fallback polling interval every 15 seconds in case of connection drop
    const interval = setInterval(fetchKitchenOrders, 15000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('newOrder');
        socket.off('orderStatusUpdated');
        socket.off('orderDeleted');
      }
    };
  }, [floorFilter, soundEnabled]);

  const fetchKitchenOrders = async () => {
    try {
      setRefreshing(true);
      let url = '/orders?paidOnly=true';
      if (floorFilter !== 'All') {
        url += `&floor=${floorFilter}`;
      }
      const res = await api.get(url);
      setOrders(res.data);
    } catch (err) {
      console.error('Fetch kitchen orders error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      // Optimistically update local order state immediately for responsive feedback
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update kitchen order status.';
      alert(msg);
    }
  };

  const handleAcceptModalOrder = async (orderId) => {
    setNewOrderAlert(null);
    await handleStatusChange(orderId, 'Preparing');
  };

  const testSound = () => {
    playOrderChime();
  };

  // Group orders into 4 KDS columns with complete state coupling
  const newOrders = orders.filter((o) => ['Pending', 'Confirmed', 'Accepted'].includes(o.status));
  const preparingOrders = orders.filter((o) => o.status === 'Preparing');
  const readyOrders = orders.filter((o) => o.status === 'Ready');
  const completedOrders = orders.filter((o) => ['Served', 'Completed'].includes(o.status)).slice(0, 15);

  const activeCount = newOrders.length + preparingOrders.length + readyOrders.length;

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <ChefHeader
        onRefresh={fetchKitchenOrders}
        refreshing={refreshing}
        activeOrderCount={activeCount}
      />

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Floor Filter & Sound Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#D4A373]/25 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-[#8B5E3C]" />
            <span className="text-xs font-bold text-[#2C1810]">Filter Floor Layout:</span>
            <div className="flex items-center gap-2">
              {['All', 'Ground Floor', 'First Floor'].map((floor) => (
                <button
                  key={floor}
                  onClick={() => setFloorFilter(floor)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    floorFilter === floor
                      ? 'bg-[#8B5E3C] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-gray-600 hover:bg-[#FAEDCD]'
                  }`}
                >
                  {floor}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Audio Alert Toggle & Test */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                soundEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}
              title={soundEnabled ? 'Order Audio Chime Enabled' : 'Order Audio Chime Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? 'Chime ON' : 'Muted'}</span>
            </button>

            <button
              onClick={testSound}
              className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#FAEDCD] text-[#8B5E3C] border border-[#D4A373]/30 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
              title="Test Chime Sound"
            >
              <Bell className="w-3.5 h-3.5" /> Test Sound
            </button>

            <span className="text-[11px] text-emerald-600 font-bold hidden md:inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              Live Socket Connected
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-20">
            <LoadingSpinner text="Connecting to Kitchen Display Stream..." />
          </div>
        ) : (
          /* 4 Kanban KDS Columns */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Column 1: NEW ORDERS */}
            <div className="bg-[#FAF7F2] rounded-3xl border border-blue-200/80 p-4 space-y-4 shadow-2xs flex flex-col">
              <div className="flex items-center justify-between bg-blue-100/80 text-blue-900 px-3.5 py-2 rounded-2xl font-bold text-xs border border-blue-200">
                <span className="flex items-center gap-2 font-[#Outfit]">
                  <Clock className="w-4 h-4 text-blue-600" /> NEW & ACCEPTED
                </span>
                <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold">
                  {newOrders.length}
                </span>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[75vh]">
                {newOrders.length > 0 ? (
                  newOrders.map((order) => (
                    <KitchenCard key={order._id} order={order} onStatusChange={handleStatusChange} />
                  ))
                ) : (
                  <p className="text-center text-xs text-gray-400 py-8 font-medium italic">
                    No new orders pending.
                  </p>
                )}
              </div>
            </div>

            {/* Column 2: PREPARING */}
            <div className="bg-[#FAF7F2] rounded-3xl border border-orange-200/80 p-4 space-y-4 shadow-2xs flex flex-col">
              <div className="flex items-center justify-between bg-orange-100/80 text-orange-900 px-3.5 py-2 rounded-2xl font-bold text-xs border border-orange-200">
                <span className="flex items-center gap-2 font-[#Outfit]">
                  <Flame className="w-4 h-4 text-orange-600 animate-pulse" /> PREPARING
                </span>
                <span className="bg-orange-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold">
                  {preparingOrders.length}
                </span>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[75vh]">
                {preparingOrders.length > 0 ? (
                  preparingOrders.map((order) => (
                    <KitchenCard key={order._id} order={order} onStatusChange={handleStatusChange} />
                  ))
                ) : (
                  <p className="text-center text-xs text-gray-400 py-8 font-medium italic">
                    No items currently brewing or cooking.
                  </p>
                )}
              </div>
            </div>

            {/* Column 3: READY */}
            <div className="bg-[#FAF7F2] rounded-3xl border border-emerald-200/80 p-4 space-y-4 shadow-2xs flex flex-col">
              <div className="flex items-center justify-between bg-emerald-100/80 text-emerald-900 px-3.5 py-2 rounded-2xl font-bold text-xs border border-emerald-200">
                <span className="flex items-center gap-2 font-[#Outfit]">
                  <Bell className="w-4 h-4 text-emerald-600 animate-bounce" /> READY TO SERVE
                </span>
                <span className="bg-emerald-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold">
                  {readyOrders.length}
                </span>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[75vh]">
                {readyOrders.length > 0 ? (
                  readyOrders.map((order) => (
                    <KitchenCard key={order._id} order={order} onStatusChange={handleStatusChange} />
                  ))
                ) : (
                  <p className="text-center text-xs text-gray-400 py-8 font-medium italic">
                    No orders waiting to be served.
                  </p>
                )}
              </div>
            </div>

            {/* Column 4: COMPLETED */}
            <div className="bg-[#FAF7F2] rounded-3xl border border-teal-200/80 p-4 space-y-4 shadow-2xs flex flex-col">
              <div className="flex items-center justify-between bg-teal-100/80 text-teal-900 px-3.5 py-2 rounded-2xl font-bold text-xs border border-teal-200">
                <span className="flex items-center gap-2 font-[#Outfit]">
                  <CheckCheck className="w-4 h-4 text-teal-600" /> RECENTLY SERVED
                </span>
                <span className="bg-teal-700 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold">
                  {completedOrders.length}
                </span>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[75vh]">
                {completedOrders.length > 0 ? (
                  completedOrders.map((order) => (
                    <KitchenCard key={order._id} order={order} onStatusChange={handleStatusChange} />
                  ))
                ) : (
                  <p className="text-center text-xs text-gray-400 py-8 font-medium italic">
                    No completed order history.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Real-Time New Order Modal Alert */}
      {newOrderAlert && (
        <NewOrderModal
          order={newOrderAlert}
          onAccept={handleAcceptModalOrder}
          onClose={() => setNewOrderAlert(null)}
        />
      )}
    </div>
  );
};

export default KitchenDashboard;

