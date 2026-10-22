import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'brown', trend, subtext }) => {
  const colorSchemes = {
    brown: {
      bg: 'bg-[#FAF7F2]',
      border: 'border-[#D4A373]/30',
      iconBg: 'bg-[#8B5E3C] text-white',
      valueColor: 'text-[#2C1810]',
    },
    amber: {
      bg: 'bg-amber-50/70',
      border: 'border-amber-200',
      iconBg: 'bg-amber-500 text-white',
      valueColor: 'text-amber-900',
    },
    orange: {
      bg: 'bg-orange-50/70',
      border: 'border-orange-200',
      iconBg: 'bg-orange-500 text-white',
      valueColor: 'text-orange-900',
    },
    emerald: {
      bg: 'bg-emerald-50/70',
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-600 text-white',
      valueColor: 'text-emerald-900',
    },
    teal: {
      bg: 'bg-teal-50/70',
      border: 'border-teal-200',
      iconBg: 'bg-teal-600 text-white',
      valueColor: 'text-teal-900',
    },
    purple: {
      bg: 'bg-indigo-50/70',
      border: 'border-indigo-200',
      iconBg: 'bg-indigo-600 text-white',
      valueColor: 'text-indigo-900',
    },
  };

  const scheme = colorSchemes[color] || colorSchemes.brown;

  return (
    <div className={`p-5 rounded-2xl border ${scheme.bg} ${scheme.border} shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</span>
        <div className={`w-9 h-9 rounded-xl ${scheme.iconBg} flex items-center justify-center shadow-xs`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div>
        <div className={`font-[#Outfit] font-extrabold text-2xl ${scheme.valueColor}`}>
          {value}
        </div>
        {(trend || subtext) && (
          <p className="text-[11px] font-medium text-gray-500 mt-1 flex items-center gap-1">
            {trend && <span className="text-emerald-600 font-bold">{trend}</span>}
            <span>{subtext}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
