import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import OrderTracker from '../components/customer/OrderTracker';
import FeedbackForm from '../components/customer/FeedbackForm';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { ClipboardList, Clock, ArrowRight, Eye, RefreshCw, Utensils } from 'lucide-react';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchMyOrders();

    const socket = getSocket();
    if (socket) {
      socket.on('orderStatusUpdated', (updatedOrder) => {
        setOrders((prev) =>
          prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
        );

        setSelectedOrder((prev) => {
          if (prev && prev._id === updatedOrder._id) {
            return updatedOrder;
          }
          return prev;
        });
      });
    }

    return () => {
      if (socket) {
        socket.off('orderStatusUpdated');
      }
    };
  }, []);


  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/my-orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Fetch my orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetailModal = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-[#Outfit] text-3xl font-extrabold text-[#2C1810] flex items-center gap-3">
              <ClipboardList className="w-7 h-7 text-[#8B5E3C]" /> My Order History
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Track active kitchen orders and review your past café receipts.
            </p>
          </div>

          <button
            onClick={fetchMyOrders}
            className="px-4 py-2 bg-white border border-[#D4A373]/30 text-[#8B5E3C] hover:bg-[#FAEDCD] text-xs font-bold rounded-xl flex items-center gap-2 shadow-2xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Orders
          </button>
        </div>

        {loading ? (
          <div className="py-16">
            <LoadingSpinner text="Loading your café order history..." />
          </div>
        ) : orders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {orders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#8B5E3C]">
                        #{order._id.substring(order._id.length - 8)}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" /> {formattedDate}
                      </span>
                      <span className="font-bold text-[#2C1810] bg-[#FAEDCD] px-2.5 py-0.5 rounded-lg border border-[#D4A373]/30">
                        Table {order.tableNumber?.toString().replace(/^table\s*/i, '')}
                      </span>
                    </div>

                    {/* Item list summary */}
                    <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#D4A373]/20 space-y-1">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-gray-700">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-[11px] text-[#8B5E3C] font-bold pt-1">
                          + {order.items.length - 3} more items...
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Total Amount</span>
                      <span className="font-[#Outfit] text-lg font-extrabold text-[#2C1810]">
                        ₹{order.totalAmount.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDetailModal(order)}
                        className="px-3.5 py-2 bg-[#FAF7F2] hover:bg-[#FAEDCD] text-[#8B5E3C] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-[#D4A373]/30"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                      <Link
                        to={`/order-confirmation/${order._id}`}
                        className="px-3.5 py-2 bg-[#8B5E3C] hover:bg-[#6F492E] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        Track <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#D4A373]/25 shadow-xs max-w-md mx-auto my-8 space-y-4">
            <ClipboardList className="w-16 h-16 text-[#8B5E3C]/30 mx-auto" />
            <h3 className="font-[#Outfit] font-bold text-xl text-[#2C1810]">No Order History</h3>
            <p className="text-xs text-gray-500">
              You haven't placed any café orders yet. Select your table number and place an order from the menu!
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B5E3C] hover:bg-[#6F492E] text-white font-bold text-xs rounded-xl transition-colors shadow-md"
            >
              <Utensils className="w-4 h-4" /> Go to Café Menu
            </Link>
          </div>
        )}
      </main>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Order Receipt #${selectedOrder._id.substring(selectedOrder._id.length - 6)}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-gray-400 font-medium block">Table Number</span>
                <span className="font-extrabold text-sm text-[#2C1810]">{selectedOrder.tableNumber}</span>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <OrderTracker currentStatus={selectedOrder.status} />

            <div>
              <h4 className="font-bold text-[#2C1810] mb-2 uppercase text-[10px] tracking-wider text-gray-400">
                Item Breakdown
              </h4>
              <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#D4A373]/20 space-y-2">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-[#2C1810]">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-bold font-[#Outfit]">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 space-y-1.5 text-gray-600 text-xs border-b pb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-[#2C1810]">₹{selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (5%)</span>
                <span className="font-semibold text-[#2C1810]">₹{selectedOrder.tax.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-sm font-extrabold text-[#2C1810]">
                <span>Total Amount Paid</span>
                <span className="font-[#Outfit] text-lg text-[#8B5E3C]">
                  ₹{selectedOrder.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Post-Completion Feedback */}
            <FeedbackForm orderId={selectedOrder._id} isCompleted={selectedOrder.status === 'Completed'} />
          </div>
        </Modal>
      )}

      <Footer />
    </div>
  );
};

export default MyOrdersPage;
