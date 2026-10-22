import React from 'react';
import { Bell, Users, Clock, CheckCircle2, X, Utensils } from 'lucide-react';

const NewOrderModal = ({ order, onAccept, onClose }) => {
  if (!order) return null;

  const orderShortId = order._id ? order._id.substring(order._id.length - 6).toUpperCase() : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#FAF7F2] rounded-3xl border-2 border-[#D4A373] max-w-lg w-full p-6 shadow-2xl space-y-5 text-[#2C1810] relative overflow-hidden transform animate-scale-up">
        {/* Animated Glow Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#8B5E3C] via-[#D4A373] to-[#8B5E3C] animate-pulse" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 border border-amber-500/30 flex items-center justify-center animate-bounce">
              <Bell className="w-7 h-7 text-[#8B5E3C]" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold tracking-widest text-[#8B5E3C] uppercase block">
                KITCHEN REAL-TIME ALERT
              </span>
              <h2 className="font-[#Outfit] text-2xl font-extrabold text-[#2C1810]">
                🔔 NEW ORDER RECEIVED
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center border border-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Details Header Card */}
        <div className="bg-white p-4 rounded-2xl border border-[#D4A373]/30 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-bold text-gray-500 block">
              ORDER #{orderShortId}
            </span>
            <span className="font-[#Outfit] text-xl font-extrabold text-[#2C1810]">
              Table {order.tableNumber}
            </span>
            <span className="text-xs text-[#8B5E3C] font-bold block">
              {order.floor || 'Ground Floor'}
            </span>
          </div>

          <div className="text-right space-y-1">
            <span className="inline-flex items-center gap-1.5 font-bold text-xs bg-[#FAEDCD] text-[#2C1810] px-3 py-1 rounded-xl border border-[#D4A373]/40">
              <Users className="w-3.5 h-3.5 text-[#8B5E3C]" />
              {order.numberOfPersons || 1} Persons
            </span>
            <span className="text-[10px] text-gray-400 font-semibold block">
              Customer: {order.customer?.name || 'In-House Customer'}
            </span>
          </div>
        </div>

        {/* Item List */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
            Items to Prepare ({order.items?.length || 0})
          </span>
          <div className="bg-white rounded-2xl border border-[#D4A373]/30 p-3 max-h-48 overflow-y-auto divide-y divide-gray-100">
            {order.items?.map((item, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#8B5E3C] text-white font-extrabold flex items-center justify-center text-[11px] shrink-0">
                    {item.quantity}×
                  </span>
                  <span className="font-bold text-[#2C1810]">{item.name}</span>
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    item.type === 'veg'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {item.type || 'veg'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
            <span className="font-bold block mb-0.5">Special Kitchen Request:</span>
            <p className="italic font-medium">"{order.specialInstructions}"</p>
          </div>
        )}

        {/* Total Bill */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-200">
          <span className="text-xs font-bold text-gray-500">Total Bill Amount:</span>
          <span className="font-[#Outfit] text-xl font-extrabold text-[#8B5E3C]">
            ₹{order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs transition-colors"
          >
            Dismiss Alert
          </button>
          <button
            onClick={() => onAccept(order._id)}
            className="py-3 px-4 rounded-xl bg-[#8B5E3C] hover:bg-[#6F492E] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            Accept Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewOrderModal;
