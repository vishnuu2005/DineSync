import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Coffee, ShoppingBag, User, LogOut, ClipboardList, Shield, Menu as MenuIcon, X, QrCode } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount, selectedTable, tableToken, isQrLocked } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuLink = tableToken
    ? `/menu/t/${tableToken}`
    : selectedTable?.tableNumber
    ? `/menu?table=${selectedTable.tableNumber}`
    : '/dashboard';

  const loginLink = selectedTable?.tableNumber
    ? `/login?table=${selectedTable.tableNumber}&token=${tableToken || ''}`
    : '/login';

  const registerLink = selectedTable?.tableNumber
    ? `/register?table=${selectedTable.tableNumber}&token=${tableToken || ''}`
    : '/register';

  const isMenuPathActive =
    location.pathname === '/dashboard' ||
    location.pathname === '/menu' ||
    location.pathname.startsWith('/menu/t/') ||
    (location.pathname === '/' && !location.search);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 glass-panel border-b border-[#D4A373]/20 shadow-xs transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5E3C] to-[#2C1810] flex items-center justify-center text-[#FAEDCD] shadow-md group-hover:scale-105 transition-transform">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <span className="font-[#Outfit] text-xl font-bold text-[#2C1810] tracking-tight group-hover:text-[#8B5E3C] transition-colors">
                Dine<span className="text-[#8B5E3C]">Sync</span>
              </span>
              <span className="block text-[10px] uppercase tracking-widest font-semibold text-[#8B5E3C]">
                Restaurant Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links & Table Badge */}
          <div className="hidden md:flex items-center gap-6 font-medium text-sm">
            <Link
              to={menuLink}
              className={`transition-colors py-1 border-b-2 ${
                isMenuPathActive
                  ? 'border-[#8B5E3C] text-[#8B5E3C] font-semibold'
                  : 'border-transparent text-[#3C2A21]/80 hover:text-[#8B5E3C]'
              }`}
            >
              Menu & Order
            </Link>

            {/* Desktop Active Seated Table Indicator */}
            {selectedTable ? (
              <Link
                to={menuLink}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAEDCD]/90 border border-[#D4A373] text-[#2C1810] shadow-2xs hover:bg-[#FAEDCD] hover:border-[#8B5E3C] transition-all group"
                title={`Seated at Table ${selectedTable.tableNumber} (${selectedTable.floor || 'Main Hall'})`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-[#Outfit] text-xs font-black text-[#2C1810] group-hover:text-[#8B5E3C] transition-colors">
                  Table {selectedTable.tableNumber}
                </span>
                <span className="text-[11px] text-[#8B5E3C] font-semibold hidden lg:inline">
                  • {selectedTable.floor || 'Ground Floor'}
                </span>
                {isQrLocked && (
                  <span className="text-[9px] bg-[#8B5E3C] text-white px-1.5 py-0.2 rounded font-black uppercase tracking-wider flex items-center gap-0.5">
                    <QrCode className="w-2.5 h-2.5" /> QR
                  </span>
                )}
              </Link>
            ) : (
              <Link
                to="/dashboard"
                className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-[#D4A373]/30 text-gray-500 hover:text-[#8B5E3C] text-xs font-semibold hover:border-[#8B5E3C] transition-all"
                title="No table active. Scan table QR code to dine in."
              >
                <QrCode className="w-3.5 h-3.5 text-[#8B5E3C]" />
                <span>Scan Table QR</span>
              </Link>
            )}

            {user && !isAdmin && (
              <Link
                to="/my-orders"
                className={`transition-colors py-1 border-b-2 flex items-center gap-1.5 ${
                  isActive('/my-orders')
                    ? 'border-[#8B5E3C] text-[#8B5E3C] font-semibold'
                    : 'border-transparent text-[#3C2A21]/80 hover:text-[#8B5E3C]'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                My Orders
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="bg-[#2C1810] hover:bg-[#3C2A21] text-[#FAEDCD] px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Shield className="w-3.5 h-3.5 text-[#D4A373]" />
                Admin Portal
              </Link>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="hidden md:flex items-center gap-4">
            {/* Cart Button */}
            {!isAdmin && (
              <Link
                to="/cart"
                className="relative p-2.5 rounded-xl bg-[#FAEDCD]/60 hover:bg-[#FAEDCD] text-[#2C1810] transition-all hover:scale-105"
                title="View Cart"
              >
                <ShoppingBag className="w-5 h-5 text-[#8B5E3C]" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#8B5E3C] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse-subtle shadow-xs">
                    {itemCount}
                  </span>
                )}
              </Link>
            )}

            {/* Auth / Profile section */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-white/80 border border-[#D4A373]/30 hover:border-[#8B5E3C] transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#8B5E3C] text-[#FAEDCD] flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left text-xs">
                    <span className="block font-semibold text-[#2C1810] line-clamp-1">{user.name}</span>
                    <span className="block text-[10px] text-[#8B5E3C] capitalize">{user.role}</span>
                  </div>
                </button>

                {/* Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#D4A373]/30 py-1 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-bold text-[#2C1810]">{user.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                    </div>
                    {isAdmin ? (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-[#2C1810] hover:bg-[#FAF7F2]"
                      >
                        <Shield className="w-4 h-4 text-[#8B5E3C]" />
                        Admin Dashboard
                      </Link>
                    ) : (
                      <Link
                        to="/my-orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-[#2C1810] hover:bg-[#FAF7F2]"
                      >
                        <ClipboardList className="w-4 h-4 text-[#8B5E3C]" />
                        My Orders
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 border-t border-gray-100"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to={loginLink}
                  state={{ from: location }}
                  className="px-4 py-2 text-xs font-semibold text-[#8B5E3C] hover:text-[#2C1810] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to={registerLink}
                  state={{ from: location }}
                  className="px-4 py-2 text-xs font-semibold bg-[#8B5E3C] hover:bg-[#6F492E] text-white rounded-xl shadow-xs transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Bar: Table Badge, Cart, Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {selectedTable && (
              <Link
                to={menuLink}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAEDCD] border border-[#D4A373] text-[#2C1810] text-xs font-black shadow-2xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Table {selectedTable.tableNumber}</span>
              </Link>
            )}

            {!isAdmin && (
              <Link
                to="/cart"
                className="relative p-2 text-[#2C1810]"
              >
                <ShoppingBag className="w-6 h-6 text-[#8B5E3C]" />
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-[#8B5E3C] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#2C1810] focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#D4A373]/30 px-4 pt-3 pb-6 space-y-3">
          {/* Seated Table Banner in Mobile Drawer */}
          {selectedTable ? (
            <div className="p-3.5 bg-gradient-to-r from-[#2C1810] via-[#3C2A21] to-[#2C1810] rounded-2xl text-white shadow-sm border border-[#D4A373]/30 mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4A373] flex items-center gap-1">
                  <QrCode className="w-3 h-3 text-[#D4A373]" /> Active Dine-In Table
                </span>
                {isQrLocked && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    QR Verified
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-[#Outfit] text-lg font-black text-white">
                  Table {selectedTable.tableNumber}
                </span>
                <span className="text-xs text-[#FAEDCD]">
                  ({selectedTable.floor || 'Ground Floor'})
                </span>
              </div>
              <p className="text-[11px] text-gray-300 mt-0.5">
                Capacity: {selectedTable.capacity} Persons • Live Dine-In Ordering
              </p>
            </div>
          ) : (
            <div className="p-3 bg-[#FAEDCD]/50 border border-[#D4A373]/30 rounded-2xl text-xs text-[#8B5E3C] font-semibold flex items-center gap-2 mb-2">
              <QrCode className="w-4 h-4 text-[#8B5E3C] shrink-0" />
              <span>No table active. Scan table QR code to dine in.</span>
            </div>
          )}

          <Link
            to={menuLink}
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-[#2C1810] hover:text-[#8B5E3C]"
          >
            Menu & Order
          </Link>
          {user && !isAdmin && (
            <Link
              to="/my-orders"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#2C1810] hover:text-[#8B5E3C]"
            >
              My Orders
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#8B5E3C]"
            >
              Admin Dashboard
            </Link>
          )}
          {user ? (
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#8B5E3C]" />
                <span className="text-xs font-bold text-[#2C1810]">{user.name} ({user.role})</span>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left py-2 text-xs font-bold text-red-600 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
              <Link
                to={loginLink}
                state={{ from: location }}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-xs font-bold text-[#8B5E3C] border border-[#8B5E3C] rounded-lg"
              >
                Sign In
              </Link>
              <Link
                to={registerLink}
                state={{ from: location }}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-xs font-bold bg-[#8B5E3C] text-white rounded-lg"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
