import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Coffee, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Utensils } from 'lucide-react';

const WaiterLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'waiter' || user.role === 'admin') {
        navigate('/waiter/dashboard');
      } else {
        setError('Access denied: Waiter or Administrator privileges required.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A0F0A] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-[#24150E] rounded-3xl border border-[#8B5E3C]/30 p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#8B5E3C] text-[#FAEDCD] flex items-center justify-center mx-auto mb-4 font-bold shadow-lg">
            <Utensils className="w-7 h-7" />
          </div>
          <h2 className="font-[#Outfit] text-2xl font-extrabold text-white tracking-tight">
            Floor Staff & Waiter Portal
          </h2>
          <p className="text-xs text-[#D4A373] mt-1 font-medium">
            DineSync Table Service & Order Dispatch
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-950/60 border border-red-800 text-red-300 p-3.5 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Staff Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="staff@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#120A07] border border-[#8B5E3C]/30 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4A373]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#120A07] border border-[#8B5E3C]/30 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4A373]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#8B5E3C] hover:bg-[#6F492E] text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 mt-6 active:scale-98"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Service Screen'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#8B5E3C]/20 text-center">
          <Link to="/" className="text-xs text-gray-400 hover:text-[#D4A373] transition-colors">
            ← Return to Main Website
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WaiterLoginPage;
