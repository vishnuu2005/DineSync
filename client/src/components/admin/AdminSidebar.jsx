import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Users,
  BarChart3,
  MessageSquare,
  QrCode,
  CreditCard,
  Layers,
  UserCheck,
  Settings,
  ShieldAlert,
  LogOut,
  Coffee,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { path: '/admin/dashboard', label: '1. Overview', icon: LayoutDashboard },
  { path: '/admin/floors', label: '2. Floors & Tables', icon: Layers },
  { path: '/admin/menu', label: '3. Menu Management', icon: UtensilsCrossed },
  { path: '/admin/orders', label: '4. Live Order Pipeline', icon: ClipboardList },
  { path: '/admin/billing', label: '5. Payments & Billing', icon: CreditCard },
  { path: '/admin/staff', label: '6. Staff & Roles', icon: UserCheck },
  { path: '/admin/qr-codes', label: '7. Table QR Cards', icon: QrCode },
  { path: '/admin/analytics', label: '8. Sales & Reports', icon: BarChart3 },
  { path: '/admin/settings', label: '9. Restaurant Settings', icon: Settings },
  { path: '/admin/audit-logs', label: '10. Audit Trail Logs', icon: ShieldAlert },
];

const AdminSidebar = ({ mobileOpen, setMobileOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#1A0F0A] text-[#FAEDCD] flex flex-col justify-between border-r border-[#8B5E3C]/20 transition-transform duration-300 overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Header */}
          <div className="p-5 border-b border-[#8B5E3C]/20 flex items-center justify-between">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#8B5E3C] text-[#FAEDCD] flex items-center justify-center font-bold shadow-md">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <span className="font-[#Outfit] text-lg font-bold text-white tracking-tight">
                  Dine<span className="text-[#D4A373]">Sync</span>
                </span>
                <span className="block text-[9px] text-[#D4A373] uppercase tracking-widest font-bold">
                  Admin Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Nav List */}
          <div className="p-3.5 space-y-1">
            <p className="px-3 text-[10px] uppercase font-bold text-[#8B5E3C] tracking-wider mb-2">
              Management Modules
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen && setMobileOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-[#8B5E3C] text-white shadow-md'
                      : 'text-gray-300 hover:bg-[#281B15] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#D4A373]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {active && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer session info */}
        <div className="p-4 border-t border-[#8B5E3C]/20 bg-[#120A07]">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-[#281B15]">
            <div className="w-8 h-8 rounded-lg bg-[#8B5E3C] text-white font-bold flex items-center justify-center text-xs">
              {user?.name ? user.name.charAt(0) : 'A'}
            </div>
            <div className="overflow-hidden text-left">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-[#D4A373] truncate">{user?.email || 'Admin Session'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold flex items-center justify-center gap-2 border border-red-800/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
