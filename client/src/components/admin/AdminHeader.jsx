import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, Search, ShieldCheck } from 'lucide-react';

const AdminHeader = ({ title, subtitle, onToggleMobileSidebar }) => {
  const { user } = useAuth();
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#D4A373]/20 px-6 py-4 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-[#2C1810] hover:bg-[#FAF7F2] focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-[#Outfit] font-bold text-xl text-[#2C1810] leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 font-medium">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Date Display */}
        <div className="hidden sm:block text-right">
          <span className="block text-xs font-semibold text-[#8B5E3C]">{currentDate}</span>
          <span className="block text-[10px] text-gray-400 font-medium">Café Operational Hours</span>
        </div>

        {/* Notifications Icon */}
        <button
          className="relative p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#FAEDCD] text-[#2C1810] transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4 text-[#8B5E3C]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500"></span>
        </button>

        {/* Admin Badge */}
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-lg bg-[#2C1810] text-[#D4A373] flex items-center justify-center font-bold text-xs shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-left">
            <span className="block text-xs font-bold text-[#2C1810]">{user?.name || 'Admin'}</span>
            <span className="block text-[10px] text-emerald-600 font-semibold">Active Session</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
