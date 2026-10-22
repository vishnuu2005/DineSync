import React from 'react';
import { Coffee } from 'lucide-react';

const LoadingSpinner = ({ text = 'Loading delicious menu...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-3 border-[#D4A373]/30 border-t-[#8B5E3C] animate-spin"></div>
        <Coffee className="w-5 h-5 text-[#8B5E3C] absolute inset-0 m-auto" />
      </div>
      {text && <p className="text-xs font-semibold text-[#8B5E3C] tracking-wide animate-pulse">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
