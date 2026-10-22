import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import OrderTracker from '../components/customer/OrderTracker';
import StatusBadge from '../components/common/StatusBadge';
import FeedbackForm from '../components/customer/FeedbackForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { CheckCircle2, Clock, Hash, Utensils, RefreshCw, ArrowLeft, ClipboardList } from 'lucide-react';

const OrderConfirmationPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrderDetails();

    // Real-time socket listener for instant order status change
    const socket = getSocket();
    if (socket) {
      socket.emit('joinOrder', id);

      socket.on('orderStatusUpdated', (updatedOrder) => {
        if (updatedOrder._id === id) {
          setOrder(updatedOrder);
        }
      });
    }

    // Fallback polling every 20 seconds
    const interval = setInterval(fetchOrderDetails, 20000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('orderStatusUpdated');
      }
    };
  }, [id]);


  const fetchOrderDetails = async () => {
    try {
      setRefreshing(true);
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      console.error('Fetch order error:', err);
      setError('Could not retrieve order receipt details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner text="Generating order receipt & status..." />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-red-200 shadow-md">
            <h3 className="font-bold text-lg text-red-600 mb-2">Order Receipt Not Found</h3>
            <p className="text-xs text-gray-500 mb-4">{error || 'Order ID does not exist.'}</p>
            <Link
              to="/dashboard"
              className="px-6 py-2.5 bg-[#8B5E3C] text-white text-xs font-bold rounded-xl"
            >
              Back to Menu
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Success Header Box */}
        <div className="bg-gradient-to-r from-[#2C1810] via-[#3C2A21] to-[#1A0F0A] text-white rounded-3xl p-8 shadow-xl text-center space-y-3 relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>

          <h1 className="font-[#Outfit] text-3xl font-extrabold tracking-tight">
            Order Placed Successfully! 🎉
          </h1>

          <p className="text-xs text-gray-300 max-w-md mx-auto">
            Our kitchen staff and baristas have received your table order. Sit back, relax, and monitor status updates below.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-mono font-bold text-[#FAEDCD]">
            <span>Order ID: #{order._id}</span>
          </div>
        </div>

        {/* Live Status Tracker Component */}
        <div className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-[#Outfit] font-bold text-base text-[#2C1810] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#8B5E3C]" /> Kitchen Progress Tracker
            </h3>

            <div className="flex items-center gap-3">
              <StatusBadge status={order.status} />
              <button
                onClick={fetchOrderDetails}
                className={`p-1.5 rounded-lg bg-[#FAF7F2] text-[#8B5E3C] hover:bg-[#FAEDCD] transition-colors ${
                  refreshing ? 'animate-spin' : ''
                }`}
                title="Refresh Status"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <OrderTracker currentStatus={order.status} />
        </div>

        {/* Order Details Receipt Card */}
        <div className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <span className="text-[10px] font-bold text-[#8B5E3C] uppercase tracking-wider">
                Assigned Table & Floor
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-[#Outfit] text-2xl font-extrabold text-[#2C1810]">
                  Table {order.tableNumber}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#FAEDCD] text-[#8B5E3C] text-[10px] font-bold">
                  {order.floor || 'Ground Floor'} ({order.numberOfPersons || 1} Persons)
                </span>
              </div>
            </div>

            <div className="text-right sm:text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Order Timestamp
              </span>
              <span className="text-xs font-semibold text-[#2C1810]">{formattedDate}</span>
            </div>
          </div>

          {/* Special Instructions Callout */}
          {order.specialInstructions && (
            <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#D4A373]/30 text-xs">
              <span className="font-bold text-[#8B5E3C] block mb-0.5">Special Instructions:</span>
              <p className="text-gray-700 italic">"{order.specialInstructions}"</p>
            </div>
          )}

          {/* Itemized List */}
          <div>
            <h4 className="font-[#Outfit] font-bold text-sm text-[#2C1810] mb-3 uppercase tracking-wider text-gray-500">
              Ordered Items
            </h4>
            <div className="divide-y divide-gray-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#FAF7F2] border border-[#D4A373]/30 font-bold text-[#8B5E3C] flex items-center justify-center">
                      {item.quantity}x
                    </div>
                    <div>
                      <span className="font-bold text-[#2C1810] block">{item.name}</span>
                      <span className="text-[10px] text-gray-400">₹{item.price} each</span>
                    </div>
                  </div>
                  <span className="font-bold font-[#Outfit] text-sm text-[#2C1810]">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-[#2C1810]">₹{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (5% GST)</span>
              <span className="font-semibold text-[#2C1810]">₹{order.tax.toFixed(2)}</span>
            </div>
            <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-base">
              <span className="font-extrabold text-[#2C1810]">Grand Total</span>
              <span className="font-[#Outfit] font-extrabold text-2xl text-[#8B5E3C]">
                ₹{order.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Post-Completion Customer Feedback System */}
        <FeedbackForm orderId={order._id} isCompleted={order.status === 'Completed'} />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <Link
            to="/my-orders"
            className="w-full sm:w-auto px-6 py-3 bg-white border border-[#D4A373]/40 text-[#8B5E3C] hover:bg-[#FAF7F2] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <ClipboardList className="w-4 h-4" /> View All My Orders
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-6 py-3 bg-[#8B5E3C] hover:bg-[#6F492E] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors"
          >
            <Utensils className="w-4 h-4" /> Order Additional Items
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderConfirmationPage;
