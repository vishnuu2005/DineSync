import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { Eye, Trash2, CheckCircle, Clock } from 'lucide-react';

const statusOptions = ['Confirmed', 'Accepted', 'Preparing', 'Ready', 'Served', 'Completed', 'Cancelled'];

const OrderTable = ({ orders, onStatusChange, onDeleteOrder, onViewOrder }) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-[#D4A373]/20">
        <Clock className="w-12 h-12 text-[#8B5E3C]/40 mx-auto mb-3" />
        <h3 className="font-[#Outfit] font-bold text-lg text-[#2C1810]">No Orders Found</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
          No customer orders match the current filter parameters. Check back when customers place orders from their table!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#D4A373]/25 shadow-xs overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAF7F2] border-b border-[#D4A373]/20 text-[11px] font-bold text-[#8B5E3C] uppercase tracking-wider">
              <th className="py-3.5 px-4">Order ID</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Table</th>
              <th className="py-3.5 px-4">Items Summary</th>
              <th className="py-3.5 px-4">Total (₹)</th>
              <th className="py-3.5 px-4">Date / Time</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {orders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                month: 'short',
                day: 'numeric',
              });

              return (
                <tr key={order._id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                  {/* Order ID */}
                  <td className="py-3.5 px-4 font-mono font-bold text-[#8B5E3C]">
                    #{order._id.substring(order._id.length - 6)}
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-4">
                    <span className="block font-bold text-[#2C1810]">
                      {order.customer?.name || 'Guest Customer'}
                    </span>
                    <span className="block text-[10px] text-gray-400">
                      {order.customer?.phone || order.customer?.email || 'N/A'}
                    </span>
                  </td>

                  {/* Table Number */}
                  <td className="py-3.5 px-4">
                    <span className="inline-block bg-[#FAEDCD] text-[#2C1810] px-2.5 py-1 rounded-lg font-extrabold text-xs border border-[#D4A373]/30">
                      {order.tableNumber}
                    </span>
                  </td>

                  {/* Items */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="line-clamp-2 font-medium text-gray-700">
                      {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>
                    <span className="text-[10px] text-gray-400">{order.items.length} unique item(s)</span>
                  </td>

                  {/* Total */}
                  <td className="py-3.5 px-4 font-[#Outfit] font-extrabold text-sm text-[#2C1810]">
                    ₹{order.totalAmount.toFixed(2)}
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">{formattedDate}</td>

                  {/* Status Change Selector */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={order.status} size="small" />
                      <select
                        value={order.status}
                        onChange={(e) => onStatusChange(order._id, e.target.value)}
                        className="mt-1 bg-white border border-[#D4A373]/40 rounded-lg text-[11px] font-semibold text-[#2C1810] py-1 px-2 focus:outline-none focus:ring-1 focus:ring-[#8B5E3C]"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            Change to: {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewOrder(order)}
                        className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#FAEDCD] text-[#8B5E3C] transition-colors"
                        title="View Full Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteOrder(order._id)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                        title="Delete Order Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderTable;
