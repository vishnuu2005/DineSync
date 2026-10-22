import React from 'react';
import { Clock, CheckCircle2, Flame, Bell, CheckCheck, XCircle, Utensils } from 'lucide-react';

const StatusBadge = ({ status, size = 'normal' }) => {
  const config = {
    Pending: {
      bg: 'bg-amber-100/90 text-amber-800 border-amber-300',
      icon: Clock,
      label: 'Pending',
    },
    Confirmed: {
      bg: 'bg-blue-100/90 text-blue-800 border-blue-300',
      icon: CheckCircle2,
      label: 'Confirmed',
    },
    Preparing: {
      bg: 'bg-orange-100/90 text-orange-800 border-orange-300',
      icon: Flame,
      label: 'Preparing',
    },
    Ready: {
      bg: 'bg-emerald-100/90 text-emerald-800 border-emerald-300',
      icon: Bell,
      label: 'Ready for Table',
    },
    Served: {
      bg: 'bg-purple-100/90 text-purple-800 border-purple-300',
      icon: Utensils,
      label: 'Served (Dining)',
    },
    Completed: {
      bg: 'bg-teal-100/90 text-teal-800 border-teal-300',
      icon: CheckCheck,
      label: 'Completed',
    },
    Cancelled: {
      bg: 'bg-red-100/90 text-red-800 border-red-300',
      icon: XCircle,
      label: 'Cancelled',
    },
  };

  const activeConfig = config[status] || config.Pending;
  const IconComponent = activeConfig.icon;

  const sizeClasses =
    size === 'small'
      ? 'px-2 py-0.5 text-[11px] gap-1'
      : 'px-3 py-1 text-xs gap-1.5 font-semibold';

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs font-medium ${activeConfig.bg} ${sizeClasses}`}
    >
      <IconComponent className={size === 'small' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {activeConfig.label}
    </span>
  );
};

export default StatusBadge;
