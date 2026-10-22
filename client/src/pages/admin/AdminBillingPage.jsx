import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Download,
  Calendar,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';

const AdminBillingPage = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Refund Modal
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState('');
  const [refundSuccess, setRefundSuccess] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      let url = '/payments/admin';
      if (statusFilter !== 'All') {
        url += `?status=${statusFilter}`;
      }
      const res = await api.get(url);
      setPayments(res.data || []);
    } catch (err) {
      console.error('Fetch payments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRefund = (payment) => {
    setSelectedPayment(payment);
    setRefundReason('');
    setRefundError('');
    setRefundSuccess('');
    setRefundModalOpen(true);
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!refundReason.trim()) {
      setRefundError('Please provide a reason for the refund.');
      return;
    }

    try {
      setRefunding(true);
      setRefundError('');
      await api.post(`/payments/admin/${selectedPayment._id}/refund`, {
        reason: refundReason.trim(),
        amount: selectedPayment.amount,
      });

      setRefundSuccess('Refund processed successfully.');
      setTimeout(() => {
        setRefundModalOpen(false);
        fetchPayments();
      }, 1500);
    } catch (err) {
      setRefundError(err.response?.data?.message || 'Failed to process refund.');
    } finally {
      setRefunding(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const payId = (p.gatewayPaymentId || '').toLowerCase();
    const orderNum = (p.orderId?.orderNumber || '').toLowerCase();
    const invoiceNum = (p.orderId?.invoiceNumber || '').toLowerCase();
    const custName = (p.customerName || '').toLowerCase();
    return payId.includes(term) || orderNum.includes(term) || invoiceNum.includes(term) || custName.includes(term);
  });

  const totalCaptured = payments
    .filter((p) => p.status === 'CAPTURED')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <AdminSidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <AdminHeader setMobileOpen={setMobileSidebarOpen} title="Payments & Billing Ledger" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* Top Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#D4A373]/25 shadow-xs">
              <span className="text-xs font-semibold text-gray-500">Total Captured Revenue</span>
              <p className="font-[#Outfit] text-2xl font-extrabold text-[#2C1810] mt-1">
                ₹{totalCaptured.toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#D4A373]/25 shadow-xs">
              <span className="text-xs font-semibold text-gray-500">Verified Transactions</span>
              <p className="font-[#Outfit] text-2xl font-extrabold text-emerald-700 mt-1">
                {payments.filter((p) => p.status === 'CAPTURED').length}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#D4A373]/25 shadow-xs">
              <span className="text-xs font-semibold text-gray-500">Refunds Processed</span>
              <p className="font-[#Outfit] text-2xl font-extrabold text-amber-700 mt-1">
                {payments.filter((p) => p.status === 'REFUNDED').length}
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by Payment ID, Order, Invoice, or Guest..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-xl text-xs focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-xl text-xs font-semibold text-gray-700 bg-white"
                >
                  <option value="All">All Payment States</option>
                  <option value="CAPTURED">Captured & Paid</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="FAILED">Failed Attempts</option>
                </select>
              </div>
            </div>

            {/* Transactions Table */}
            {loading ? (
              <LoadingSpinner text="Retrieving financial transaction records..." />
            ) : filteredPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-gray-600 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Invoice / Order</th>
                      <th className="py-3 px-4">Gateway Payment ID</th>
                      <th className="py-3 px-4">Guest & Table</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPayments.map((p) => {
                      const isCaptured = p.status === 'CAPTURED';
                      const isRefunded = p.status === 'REFUNDED';
                      return (
                        <tr key={p._id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#2C1810]">
                            {p.orderId?.invoiceNumber || p.orderId?.orderNumber || 'Pending Invoice'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-gray-600">
                            {p.gatewayPaymentId || p.gatewayOrderId || 'N/A'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-[#2C1810] block">{p.customerName || 'Guest'}</span>
                            <span className="text-[10px] text-gray-500">
                              Table {p.orderId?.tableNumber || 'N/A'} ({p.orderId?.floor || 'Floor'})
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-[#Outfit] font-extrabold text-sm text-[#2C1810]">
                            ₹{p.amount?.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isCaptured
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isRefunded
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                            {new Date(p.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {isCaptured && (
                              <button
                                onClick={() => handleOpenRefund(p)}
                                className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
                              >
                                Refund
                              </button>
                            )}
                            {isRefunded && (
                              <span className="text-[10px] text-gray-400 font-semibold italic">
                                Refunded {p.refundId}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 text-xs">
                No payment transactions found matching the filter.
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Refund Modal */}
      <Modal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        title="Issue Authorized Customer Refund"
      >
        <form onSubmit={handleProcessRefund} className="space-y-4">
          {refundError && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl">{refundError}</p>
          )}
          {refundSuccess && (
            <p className="text-xs text-emerald-600 bg-emerald-50 p-2.5 rounded-xl font-bold">
              {refundSuccess}
            </p>
          )}

          <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#D4A373]/30 text-xs space-y-1">
            <p>
              <strong>Order:</strong> {selectedPayment?.orderId?.orderNumber}
            </p>
            <p>
              <strong>Transaction ID:</strong> {selectedPayment?.gatewayPaymentId}
            </p>
            <p>
              <strong>Refund Amount:</strong> ₹{selectedPayment?.amount}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Refund Reason (Recorded in Audit Trail)
            </label>
            <textarea
              required
              rows="3"
              placeholder="e.g. Customer cancelled order before preparation began / item out of stock..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={refunding}
            className="w-full py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-md"
          >
            {refunding ? 'Processing Refund...' : `Confirm Refund of ₹${selectedPayment?.amount}`}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminBillingPage;
