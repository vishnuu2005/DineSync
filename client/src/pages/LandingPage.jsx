import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useCart } from '../context/CartContext';
import { Coffee, Utensils, QrCode, Clock, Sparkles, ChevronRight, Award, ShieldCheck } from 'lucide-react';

const LandingPage = () => {
  const { selectedTable, tableToken } = useCart();

  const menuLink = tableToken
    ? `/menu/t/${tableToken}`
    : selectedTable?.tableNumber
    ? `/menu?table=${selectedTable.tableNumber}`
    : '/dashboard';

  const loginLink = selectedTable?.tableNumber
    ? `/login?table=${selectedTable.tableNumber}&token=${tableToken || ''}`
    : '/login';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1A0F0A] via-[#281B15] to-[#1A0F0A] text-[#FAEDCD] py-20 lg:py-28">
        {/* Background Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#D4A373_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Copy */}
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8B5E3C]/30 border border-[#D4A373]/30 text-xs font-bold text-[#D4A373]">
                <Sparkles className="w-3.5 h-3.5" />
                Modern In-House Table Ordering System
              </div>

              <h1 className="font-[#Outfit] text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
                Savor Fresh Coffee <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4A373] via-[#E5E5CB] to-[#8B5E3C]">
                  Right at Your Table
                </span>
              </h1>

              <p className="text-sm sm:text-base text-gray-300 max-w-xl leading-relaxed mx-auto lg:mx-0 font-normal">
                No waiting in long counters. Select your table number, browse our handcrafted espresso, fresh bakery pastries, warm breakfasts, and track kitchen status in real time.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to={menuLink}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#8B5E3C] hover:bg-[#6F492E] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                  <Coffee className="w-5 h-5" />
                  Explore Menu & Order
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  to={loginLink}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 flex items-center justify-center gap-2 backdrop-blur-xs transition-colors"
                >
                  Customer Sign In
                </Link>
              </div>

              {/* Stats badges */}
              <div className="pt-8 border-t border-white/10 grid grid-cols-3 gap-4">
                <div>
                  <span className="font-[#Outfit] font-extrabold text-2xl text-white">100%</span>
                  <p className="text-[11px] text-gray-400">Fresh Arabica Roast</p>
                </div>
                <div>
                  <span className="font-[#Outfit] font-extrabold text-2xl text-white">&lt;12 min</span>
                  <p className="text-[11px] text-gray-400">Average Serving Time</p>
                </div>
                <div>
                  <span className="font-[#Outfit] font-extrabold text-2xl text-[#D4A373]">Live</span>
                  <p className="text-[11px] text-gray-400">Order Progress Tracking</p>
                </div>
              </div>
            </div>

            {/* Right Card / Visual */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-md bg-gradient-to-b from-[#2C1810] to-[#1A0F0A] p-6 rounded-3xl border border-[#D4A373]/30 shadow-2xl">
                <div className="relative h-64 rounded-2xl overflow-hidden mb-5">
                  <img
                    src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80"
                    alt="Café Interior"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-[#1A0F0A]/90 backdrop-blur-xs text-xs font-bold text-[#FAEDCD] px-3 py-1 rounded-full border border-[#D4A373]/40 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" /> Premium Café Experience
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-300">
                    <span>Table Side Ordering</span>
                    <span className="text-[#D4A373] font-bold">Fast & Contactless</span>
                  </div>
                  <h3 className="font-[#Outfit] font-bold text-lg text-white">
                    Ready to order from your current table?
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Simply open the menu, pick your favorite coffee or snack, enter your table number, and submit!
                  </p>
                  <Link
                    to={menuLink}
                    className="w-full py-2.5 bg-[#D4A373] hover:bg-[#b88554] text-[#1A0F0A] font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors mt-2"
                  >
                    Start Table Order Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Feature Steps */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-[#Outfit] text-3xl font-extrabold text-[#2C1810]">
            How Table Ordering Works
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-2">
            Four simple steps to get handcrafted coffee and hot snacks delivered straight to your café seat.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#D4A373]/25 shadow-2xs hover:shadow-md transition-shadow text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FAEDCD] text-[#8B5E3C] font-extrabold text-lg flex items-center justify-center mx-auto">
              1
            </div>
            <h3 className="font-[#Outfit] font-bold text-base text-[#2C1810]">Find Your Table</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Take a comfortable seat in our cozy café lounge and note down your table number tag.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#D4A373]/25 shadow-2xs hover:shadow-md transition-shadow text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FAEDCD] text-[#8B5E3C] font-extrabold text-lg flex items-center justify-center mx-auto">
              2
            </div>
            <h3 className="font-[#Outfit] font-bold text-base text-[#2C1810]">Browse & Pick</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Explore espresso drinks, herbal teas, sandwiches, burgers, and decadent desserts.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#D4A373]/25 shadow-2xs hover:shadow-md transition-shadow text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FAEDCD] text-[#8B5E3C] font-extrabold text-lg flex items-center justify-center mx-auto">
              3
            </div>
            <h3 className="font-[#Outfit] font-bold text-base text-[#2C1810]">Enter Table & Order</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Enter your table number on the cart page and click "Place Order" to notify our barista.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#D4A373]/25 shadow-2xs hover:shadow-md transition-shadow text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FAEDCD] text-[#8B5E3C] font-extrabold text-lg flex items-center justify-center mx-auto">
              4
            </div>
            <h3 className="font-[#Outfit] font-bold text-base text-[#2C1810]">Live Order Tracking</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Watch real-time status updates as your order transitions from Preparing to Served!
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
