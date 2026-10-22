import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { Coffee, User, Mail, Phone, Lock, ArrowRight, AlertCircle, QrCode } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { name, email, phone, password, confirmPassword } = formData;

    if (!name || !email || !phone || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setSubmitting(true);
      await register(name, email, phone, password, confirmPassword);

      // Customer register: preserve specific scanned table!
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
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#D4A373]/30 shadow-xl p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#2C1810] via-[#8B5E3C] to-[#D4A373]" />

          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#8B5E3C] text-[#FAEDCD] flex items-center justify-center mx-auto shadow-md">
              <Coffee className="w-6 h-6" />
            </div>
            <h2 className="font-[#Outfit] text-2xl font-extrabold text-[#2C1810]">
              Join ArtisanCafé Rewards
            </h2>
            <p className="text-xs text-gray-500">
              Create an account for quick table ordering and order tracking.
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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-[#2C1810] mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Sarah Jenkins"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#D4A373]/30 rounded-xl text-xs text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C]"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-[#2C1810] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="sarah@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#D4A373]/30 rounded-xl text-xs text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C]"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-[#2C1810] mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 019-2834"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#D4A373]/30 rounded-xl text-xs text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-[#2C1810] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#D4A373]/30 rounded-xl text-xs text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C]"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-[#2C1810] mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#D4A373]/30 rounded-xl text-xs text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#8B5E3C] hover:bg-[#6F492E] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-70 mt-2"
            >
              {submitting ? (
                'Creating Account...'
              ) : (
                <>
                  Register & Continue <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-gray-500 border-t border-gray-100 flex items-center justify-between">
            <span>Already registered?</span>
            <Link
              to={selectedTable?.tableNumber ? `/login?table=${selectedTable.tableNumber}&token=${tableToken || ''}` : '/login'}
              state={location.state}
              className="font-bold text-[#8B5E3C] hover:underline"
            >
              Sign In Instead
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RegisterPage;
