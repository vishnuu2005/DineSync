import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Utensils, Lock, Mail, ArrowRight, AlertCircle, Coffee } from 'lucide-react';

const ChefLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter kitchen staff credentials.');
      return;
    }

    try {
      setSubmitting(true);
      const user = await login(email, password);

      if (user.role !== 'chef' && user.role !== 'admin') {
        setError('Access denied: You do not have Chef / Kitchen privileges.');
        return;
      }

      navigate('/chef/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid chef login credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A0F0A] p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#8B5E3C_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

      <div className="w-full max-w-md bg-[#281B15] text-[#FAEDCD] rounded-3xl border border-[#8B5E3C]/30 shadow-2xl p-8 space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-600 text-white flex items-center justify-center mx-auto shadow-lg border border-[#D4A373]/30">
            <Utensils className="w-7 h-7" />
          </div>
          <h2 className="font-[#Outfit] text-2xl font-extrabold text-white tracking-tight">
            Kitchen Display Portal
          </h2>
          <p className="text-xs text-gray-400">
            Authorized Chef & Kitchen Staff portal for real-time table order preparation.
          </p>
        </div>

        {error && (
          <div className="bg-red-950/80 border border-red-800/60 text-red-200 p-3.5 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
              Chef Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chef@restaurant.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[#120A07] border border-[#8B5E3C]/40 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
              Chef Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[#120A07] border border-[#8B5E3C]/40 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] disabled:opacity-70 mt-2"
          >
            {submitting ? (
              'Verifying Kitchen Access...'
            ) : (
              <>
                Open Kitchen Display <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-gray-400 border-t border-[#8B5E3C]/20 flex items-center justify-between">
          <Link to="/" className="text-[#D4A373] hover:underline flex items-center gap-1">
            <Coffee className="w-3.5 h-3.5" /> Customer Café
          </Link>
          <Link to="/admin/login" className="text-gray-400 hover:text-white">
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ChefLoginPage;
