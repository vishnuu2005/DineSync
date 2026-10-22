import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Heart, MapPin, Phone, Mail, Clock } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#1A0F0A] text-[#FAEDCD]/80 pt-12 pb-8 border-t border-[#8B5E3C]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#8B5E3C] flex items-center justify-center text-[#FAEDCD]">
                <Coffee className="w-5 h-5" />
              </div>
              <span className="font-[#Outfit] text-xl font-bold text-white">
                Artisan<span className="text-[#D4A373]">Café</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-gray-400">
              Crafting premium roasted espresso, artisanal pastries, and freshly prepared warm food items delivered right to your café table.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-[#Outfit] text-sm font-bold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/dashboard" className="hover:text-[#D4A373] transition-colors">
                  Menu & Categories
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-[#D4A373] transition-colors">
                  Table Order Checkout
                </Link>
              </li>
              <li>
                <Link to="/my-orders" className="hover:text-[#D4A373] transition-colors">
                  Track My Order
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-[#D4A373] transition-colors text-amber-500/90 font-medium">
                  Staff Admin Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Operating Hours */}
          <div>
            <h4 className="font-[#Outfit] text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D4A373]" /> Opening Hours
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex justify-between">
                <span>Mon - Fri:</span>
                <span className="text-white font-medium">7:00 AM - 10:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Sat - Sun:</span>
                <span className="text-white font-medium">8:00 AM - 11:00 PM</span>
              </li>
              <li className="pt-2 text-[11px] text-[#D4A373]">
                * Kitchen & espresso bar active continuously
              </li>
            </ul>
          </div>

          {/* Contact & Location */}
          <div>
            <h4 className="font-[#Outfit] text-sm font-bold text-white uppercase tracking-wider mb-4">
              Café Location
            </h4>
            <ul className="space-y-3 text-xs text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D4A373] shrink-0 mt-0.5" />
                <span>124 Gourmet Boulevard, Coffee District, Suite 10</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#D4A373] shrink-0" />
                <span>+1 (555) 849-2049</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#D4A373] shrink-0" />
                <span>orders@artisancafe.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} ArtisanCafé Management System. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Designed for seamless in-house table ordering <Heart className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
