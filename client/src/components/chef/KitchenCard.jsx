import React from 'react';
import { Clock, Users, User, CheckCircle2, Flame, Bell, CheckCheck, MessageSquare, ShieldCheck } from 'lucide-react';

const KitchenCard = ({ order, onStatusChange }) => {
  const formattedTime = new Date(order.paidAt || order.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate elapsed time in minutes
  const elapsedMinutes = Math.floor((Date.now() - new Date(order.paidAt || order.createdAt).getTime()) / 60000);

  const renderActionButton = () => {
    switch (order.status) {
      case 'Confirmed':
      case 'Pending':
        return (
          <button
            onClick={() => onStatusChange(order._id, 'Accepted')}
            className="w-full py-2.5 bg-[#8B5E3C] hover:bg-[#6F492E] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" /> Accept Kitchen Order
          </button>
        );
      case 'Accepted':
        return (
          <button
            onClick={() => onStatusChange(order._id, 'Preparing')}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
          >
            <Flame className="w-4 h-4" /> Start Cooking / Brew
          </button>
        );
      case 'Preparing':
        return (
          <button
            onClick={() => onStatusChange(order._id, 'Ready')}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
          >
            <Bell className="w-4 h-4" /> Mark Ready for Service
          </button>
        );
      case 'Ready':
        return (
          <button
            onClick={() => onStatusChange(order._id, 'Served')}
            className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
          >
            <CheckCheck className="w-4 h-4" /> Handed to Floor Waiter
          </button>
        );
      case 'Served':
      case 'Completed':
        return (
          <div className="w-full py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-xs text-center flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Served to Guests
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#D4A373]/30 p-5 shadow-sm hover:shadow-lg transition-all space-y-3.5 relative overflow-hidden">
      {/* Top Header: Order ID & Elapsed Timer */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="bg-[#1A0F0A] text-[#FAEDCD] font-mono font-extrabold px-2.5 py-1 rounded-lg text-xs">
            {order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" /> PAID
          </span>
        </div>
        <span
          className={`text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-md ${
            elapsedMinutes > 15
              ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
              : 'text-gray-500'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> {elapsedMinutes}m ago ({formattedTime})
        </span>
      </div>

      {/* Guest Name & Instructions */}
      <div className="flex items-center gap-2 text-xs text-[#2C1810]">
        <User className="w-4 h-4 text-[#8B5E3C]" />
        <span className="font-bold">Guest:</span>
        <span className="font-semibold text-gray-700">
          {order.customerName || order.customer?.name || 'In-House Guest'}
        </span>
      </div>

      {/* Table, Floor & Persons */}
      <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#D4A373]/25 flex items-center justify-between text-xs">
        <div>
          <span className="font-[#Outfit] font-extrabold text-base text-[#2C1810] block">
            Table {order.tableNumber}
          </span>
          <span className="text-[11px] font-bold text-[#8B5E3C]">{order.floor || 'Ground Floor'}</span>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 font-bold text-gray-700 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
            <Users className="w-3.5 h-3.5 text-[#8B5E3C]" />
            {order.numberOfPersons || 1} Guests
          </span>
        </div>
      </div>

      {/* Ordered Items */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Dishes to Prepare
        </span>
        <div className="divide-y divide-gray-100 bg-[#FAF7F2]/60 rounded-2xl p-3 border border-gray-100">
          {order.items?.map((item, idx) => (
            <div key={idx} className="py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#8B5E3C] text-white font-extrabold flex items-center justify-center text-[11px] shrink-0 shadow-xs">
                  {item.quantity}×
                </span>
                <span className="font-bold text-[#2C1810] text-sm">{item.name}</span>
              </div>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  item.type === 'veg' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {item.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Special Cooking Instructions */}
      {order.specialInstructions && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-0.5">
          <span className="font-bold text-amber-900 flex items-center gap-1 text-[11px]">
            <MessageSquare className="w-3.5 h-3.5 text-amber-700" /> Instructions:
          </span>
          <p className="text-amber-950 font-semibold italic text-[11px]">
            "{order.specialInstructions}"
          </p>
        </div>
      )}

      {/* Action Button */}
      <div className="pt-1">{renderActionButton()}</div>
    </div>
  );
};

export default KitchenCard;
