import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { Coffee, Mail, Lock, ArrowRight, AlertCircle, Shield, QrCode, CheckCircle2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const { selectedTable, tableToken, setTableFromToken, setTableFromQR } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const urlTable = searchParams.get('table');
  const urlToken = searchParams.get('token') || searchParams.get('t');

  // Auto-sync table from URL if provided
  useEffect(() => {
    if (urlToken) {
      setTableFromToken(urlToken);
    } else if (urlTable) {
      setTableFromQR(urlTable);
    }
  }, [urlTable, urlToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setSubmitting(true);
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'chef') {
        navigate('/chef/dashboard');
      } else if (user.role === 'waiter') {
        navigate('/waiter/dashboard');
      } else {
        // Customer login: preserve specific scanned table!
        const returnUrl = location.state?.from?.pathname;
        const returnSearch = location.state?.from?.search || '';
        const activeToken = urlToken || tableToken || selectedTable?.qrToken;
        const activeTableNum = urlTable || selectedTable?.tableNumber;

        if (returnUrl && !returnUrl.includes('/login') && !returnUrl.includes('/register')) {
          navigate(returnUrl + returnSearch);
        } else if (activeToken) {
          navigate(`/menu/t/${activeToken}`);
        } else if (activeTableNum) {
          navigate(`/menu?table=${activeTableNum}`);
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#D4A373]/30 shadow-xl p-8 space-y-6 relative overflow-hidden">
          {/* Top Decorative Accent */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#8B5E3C] via-[#D4A373] to-[#2C1810]" />

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#8B5E3C] text-[#FAEDCD] flex items-center justify-center mx-auto shadow-md">
              <Coffee className="w-6 h-6" />
            </div>
            <h2 className="font-[#Outfit] text-2xl font-extrabold text-[#2C1810]">
              Welcome Back to ArtisanCafé
            </h2>
            <p className="text-xs text-gray-500">
              Sign in to browse menu items, place table orders, and track your orders.
            </p>
          </div>

          {/* Active Seated Table Banner */}
          {selectedTable && (
            <div className="p-3 bg-gradient-to-r from-[#2C1810] to-[#3C2A21] rounded-2xl text-white shadow-xs border border-[#D4A373]/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#8B5E3C] text-[#FAEDCD] flex items-center justify-center font-extrabold text-xs">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-[#Outfit] text-xs font-bold text-[#FAEDCD] flex items-center gap-1.5">
                    Seated at Table {selectedTable.tableNumber}
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  </p>
                  <p className="text-[10px] text-gray-300">
                    {selectedTable.floor || 'Ground Floor'} • Dine-In Ordering
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                QR Verified
              </span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#2C1810] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#D4A373]/30 rounded-xl text-xs text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#2C1810]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('Please contact café management to reset your credentials.')}
                  className="text-[11px] font-semibold text-[#8B5E3C] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#D4A373]/30 rounded-xl text-xs text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#8B5E3C] hover:bg-[#6F492E] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-70"
            >
              {submitting ? (
                'Signing In...'
              ) : (
                <>
                  Sign In & View Menu <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="pt-2 text-center text-xs text-gray-500 border-t border-gray-100 flex items-center justify-between">
            <span>Don't have an account?</span>
            <Link
              to={selectedTable?.tableNumber ? `/register?table=${selectedTable.tableNumber}&token=${tableToken || ''}` : '/register'}
              state={location.state}
              className="font-bold text-[#8B5E3C] hover:underline"
            >
              Create New Account
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;
