import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Utensils, LogOut, RefreshCw, Clock, Coffee, Shield } from 'lucide-react';

const ChefHeader = ({ onRefresh, refreshing, activeOrderCount }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/chef/login');
  };

  return (
    <header className="bg-[#1A0F0A] text-[#FAEDCD] border-b border-[#8B5E3C]/30 px-6 py-4 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-md">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-[#Outfit] text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Kitchen Display System (KDS)
              <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-500/40">
                {activeOrderCount} Active Orders
              </span>
            </h1>
            <span className="block text-[11px] text-[#D4A373]">
              Head Chef: <strong className="text-white">{user?.name || 'Chef Mario'}</strong>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className={`px-3.5 py-2 rounded-xl bg-[#281B15] hover:bg-[#3C2A21] text-[#FAEDCD] text-xs font-bold flex items-center gap-2 border border-[#8B5E3C]/30 transition-all ${
              refreshing ? 'opacity-70' : ''
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${refreshing ? 'animate-spin' : ''}`} />
            Auto-Sync Live
          </button>

          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className="px-3.5 py-2 rounded-xl bg-[#281B15] text-[#FAEDCD] hover:bg-[#3C2A21] text-xs font-bold flex items-center gap-1.5 border border-[#8B5E3C]/30"
            >
              <Shield className="w-3.5 h-3.5 text-[#D4A373]" /> Admin Console
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-bold flex items-center gap-1.5 border border-red-800/40 transition-colors"
            title="Sign out kitchen portal"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default ChefHeader;
