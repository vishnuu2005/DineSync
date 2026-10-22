import React from 'react';
import { Clock, CheckCircle2, Flame, Bell, Utensils, CheckCheck, AlertCircle } from 'lucide-react';

const steps = [
  { status: 'Confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { status: 'Preparing', label: 'Preparing', icon: Flame },
  { status: 'Ready', label: 'Ready', icon: Bell },
  { status: 'Served', label: 'Served', icon: Utensils },
  { status: 'Completed', label: 'Completed', icon: CheckCheck },
];

const OrderTracker = ({ currentStatus }) => {
  if (currentStatus === 'Cancelled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
        <AlertCircle className="w-6 h-6 shrink-0 text-red-600" />
        <div>
          <h4 className="font-bold text-sm">Order Cancelled</h4>
          <p className="text-xs text-red-600">This order was cancelled. Please speak to café staff or place a new order.</p>
        </div>
      </div>
    );
  }

  const statusRank = {
    Pending: 0,
    Pending_Payment: 0,
    Confirmed: 0,
    Accepted: 0,
    Preparing: 1,
    Ready: 2,
    Served: 3,
    Completed: 4,
  };
  const activeIndex = statusRank[currentStatus] !== undefined ? statusRank[currentStatus] : 0;

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Connection Line */}
        <div className="absolute top-5 left-6 right-6 h-1 bg-gray-200 -z-0">
          <div
            className="h-full bg-gradient-to-r from-[#8B5E3C] to-[#D4A373] transition-all duration-500"
            style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx <= activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div key={step.status} className="flex flex-col items-center relative z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCurrent
                    ? 'bg-[#8B5E3C] text-white ring-4 ring-[#8B5E3C]/20 scale-110 shadow-md'
                    : isDone
                    ? 'bg-[#2C1810] text-[#FAEDCD]'
                    : 'bg-white text-gray-400 border border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[11px] font-bold mt-2 text-center ${
                  isCurrent
                    ? 'text-[#8B5E3C]'
                    : isDone
                    ? 'text-[#2C1810]'
                    : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTracker;
