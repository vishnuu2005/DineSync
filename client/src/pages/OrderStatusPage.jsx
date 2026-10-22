import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import OrderTracker from '../components/customer/OrderTracker';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FeedbackForm from '../components/customer/FeedbackForm';
import api from '../services/api';
import { getSocket } from '../services/socket';
import {
  CheckCircle2,
  Clock,
  Download,
  Share2,
  RefreshCw,
  ArrowLeft,
  FileText,
  Utensils,
  MapPin,
  Calendar,
  CreditCard,
  ChefHat,
  Sparkles,
} from 'lucide-react';

const OrderStatusPage = () => {
  const { token } = useParams();
  const [order, setOrder] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    fetchOrderDetails();

    // Trigger celebratory confetti on initial confirmed page load
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    // Real-time Socket.IO listener for live kitchen updates
    const socket = getSocket();
    if (socket) {
      socket.on('orderStatusUpdated', (updatedOrder) => {
        if (updatedOrder.publicAccessToken === token || updatedOrder._id === order?._id) {
          setOrder((prev) => ({ ...prev, ...updatedOrder }));
        }
      });
    }

    // Polling fallback every 15s
    const interval = setInterval(fetchOrderDetails, 15000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('orderStatusUpdated');
      }
    };
  }, [token]);

  const fetchOrderDetails = async () => {
    try {
      setRefreshing(true);
      const [orderRes, receiptRes] = await Promise.all([
        api.get(`/public/orders/${token}`),
        api.get(`/public/orders/${token}/receipt`).catch(() => ({ data: null })),
      ]);

      setOrder(orderRes.data);
      if (receiptRes.data) {
        setReceipt(receiptRes.data);
      }
    } catch (err) {
      console.error('Fetch order tracking error:', err);
      setError('Could not locate order. Please check the link or contact restaurant staff.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!order) return;
    setDownloadingPdf(true);

    try {
      const doc = new jsPDF();
      const restaurantName = receipt?.restaurant?.name || 'DineSync Demo Restaurant';
      const gstin = receipt?.restaurant?.gstin || '29ABCDE1234F1Z5';
      const address = receipt?.restaurant?.address || '100 Feet Road, Indiranagar, Bengaluru 560038';
      const invoiceNum = order.invoiceNumber || `REC-${order.orderNumber}`;

      // Header Branding
      doc.setFillColor(44, 24, 16); // #2C1810
      doc.rect(0, 0, 210, 36, 'F');

      doc.setTextColor(250, 237, 205); // #FAEDCD
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(restaurantName.toUpperCase(), 14, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('ORIGINAL TAX INVOICE & DINING RECEIPT', 14, 26);
      doc.text(`GSTIN: ${gstin}`, 14, 31);

      // Invoice Details Block
      doc.setTextColor(44, 24, 16);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Invoice No: ${invoiceNum}`, 14, 48);
      doc.setFont('helvetica', 'normal');
      doc.text(`Order No: ${order.orderNumber}`, 14, 54);
      doc.text(`Table: ${order.tableNumber} (${order.floor || 'Ground Floor'})`, 14, 60);
      doc.text(`Date & Time: ${new Date(order.paidAt || order.createdAt).toLocaleString()}`, 14, 66);

      doc.text(`Customer: ${order.customerName || 'Guest Customer'}`, 120, 48);
      doc.text(`Payment: ${order.paymentStatus === 'PAID' ? 'PAID ONLINE (SUCCESS)' : order.paymentStatus}`, 120, 54);
      doc.text(`Payment Ref: ${order.paymentTransaction?.gatewayPaymentId || 'Online Gateway'}`, 120, 60);

      // Table line
      doc.setDrawColor(212, 163, 115);
      doc.setLineWidth(0.5);
      doc.line(14, 72, 196, 72);

      // Table Headers
      doc.setFont('helvetica', 'bold');
      doc.text('Item Description', 14, 78);
      doc.text('Qty', 120, 78);
      doc.text('Unit Price', 145, 78);
      doc.text('Amount (INR)', 175, 78);

      doc.line(14, 81, 196, 81);

      // Items Rows
      let y = 88;
      doc.setFont('helvetica', 'normal');
      order.items.forEach((item) => {
        doc.text(`${item.name}`, 14, y);
        doc.text(`${item.quantity}`, 122, y);
        doc.text(`Rs. ${item.price.toFixed(2)}`, 145, y);
        doc.text(`Rs. ${(item.price * item.quantity).toFixed(2)}`, 175, y);
        y += 7;
      });

      doc.line(14, y + 2, 196, y + 2);
      y += 10;

      // Summary
      doc.text('Subtotal:', 130, y);
      doc.text(`Rs. ${order.subtotal.toFixed(2)}`, 175, y);
      y += 6;

      doc.text(`CGST + SGST (${order.taxRate || 5}%):`, 130, y);
      doc.text(`Rs. ${order.tax.toFixed(2)}`, 175, y);
      y += 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Grand Total Paid:', 130, y);
      doc.text(`Rs. ${order.totalAmount.toFixed(2)}`, 175, y);

      // Footer
      y += 20;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120, 120, 120);
      doc.text('Thank you for dining with DineSync! We look forward to serving you again.', 14, y);
      doc.text(`${address} • contact@dinesync.com`, 14, y + 5);

      doc.save(`${invoiceNum}.pdf`);
    } catch (e) {
      console.error('PDF export error:', e);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner text="Retrieving confirmed kitchen order..." />
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
            <h3 className="font-bold text-lg text-red-600 mb-2">Order Not Located</h3>
            <p className="text-xs text-gray-500 mb-6">{error || 'Order token is invalid.'}</p>
            <Link
              to="/menu"
              className="px-6 py-2.5 bg-[#8B5E3C] text-white text-xs font-bold rounded-xl"
            >
              Browse Menu
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Navigation back */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#8B5E3C] hover:text-[#2C1810]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Menu
          </Link>

          <button
            onClick={fetchOrderDetails}
            disabled={refreshing}
            className="text-xs font-semibold text-gray-600 hover:text-[#8B5E3C] flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>

        {/* Hero Success Banner */}
        <div className="bg-gradient-to-r from-[#2C1810] via-[#3D2318] to-[#2C1810] rounded-3xl text-white p-6 sm:p-8 shadow-xl border border-[#D4A373]/30 mb-8 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" /> Payment Confirmed & Order Sent to Kitchen
              </div>
              <h1 className="font-[#Outfit] text-2xl sm:text-3xl font-extrabold tracking-tight">
                Preparing for Table {order.tableNumber}
              </h1>
              <p className="text-xs text-[#FAEDCD]">
                {order.floor || 'Ground Floor'} • Order: <strong>{order.orderNumber}</strong> • Invoice:{' '}
                <strong>{order.invoiceNumber || 'Processing'}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadPDF}
                disabled={downloadingPdf}
                className="px-5 py-3 rounded-2xl bg-[#D4A373] hover:bg-[#C28E5E] text-[#1A0F0A] font-extrabold text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>{downloadingPdf ? 'Exporting...' : 'Download Invoice PDF'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Kitchen Status Pipeline Tracker */}
        <div className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-[#Outfit] text-base font-bold text-[#2C1810] flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-[#8B5E3C]" /> Live Kitchen Preparation Tracker
            </h3>
            <StatusBadge status={order.status} />
          </div>

          <OrderTracker status={order.status} />
        </div>

        {/* Order Details & Official Receipt Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Items Summary (2 cols) */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-[#D4A373]/25 p-6 shadow-xs space-y-4">
            <h3 className="font-[#Outfit] text-base font-bold text-[#2C1810] pb-3 border-b border-gray-100 flex items-center justify-between">
              <span>Ordered Items ({order.items?.reduce((acc, i) => acc + i.quantity, 0)})</span>
              <span className="text-xs font-normal text-gray-500">
                {new Date(order.paidAt || order.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </h3>

            <div className="divide-y divide-gray-100">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[#FAF7F2] font-bold text-[#8B5E3C] flex items-center justify-center border border-[#D4A373]/30">
                      {item.quantity}×
                    </span>
                    <div>
                      <p className="font-bold text-[#2C1810] text-sm">{item.name}</p>
                      <p className="text-[11px] text-gray-500">₹{item.price} each</p>
                    </div>
                  </div>
                  <span className="font-bold text-[#2C1810] text-sm">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {order.specialInstructions && (
              <div className="pt-3 border-t border-gray-100 bg-[#FAF7F2] p-3 rounded-2xl text-xs text-gray-700">
                <span className="font-bold text-[#8B5E3C]">Kitchen Instructions:</span>{' '}
                {order.specialInstructions}
              </div>
            )}
          </div>

          {/* Tax Invoice Breakdown (1 col) */}
          <div className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 shadow-xs space-y-4">
            <h3 className="font-[#Outfit] text-base font-bold text-[#2C1810] pb-3 border-b border-gray-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#8B5E3C]" /> Bill Breakdown
            </h3>

            <div className="space-y-2.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-gray-900">₹{order.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax ({order.taxRate || 5}%)</span>
                <span className="font-bold text-gray-900">₹{order.tax?.toFixed(2)}</span>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline text-sm">
                <span className="font-bold text-[#2C1810]">Total Paid</span>
                <span className="font-[#Outfit] font-extrabold text-xl text-[#8B5E3C]">
                  ₹{order.totalAmount?.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-500 space-y-1">
              <p>
                <strong>Payment Mode:</strong> Online (UPI / Cards)
              </p>
              <p>
                <strong>Ref ID:</strong> {order.paymentTransaction?.gatewayPaymentId || 'pay_verified'}
              </p>
              <p>
                <strong>GSTIN:</strong> {receipt?.restaurant?.gstin || '29ABCDE1234F1Z5'}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Feedback Card */}
        <FeedbackForm orderId={order._id} />
      </main>

      <Footer />
    </div>
  );
};

export default OrderStatusPage;
