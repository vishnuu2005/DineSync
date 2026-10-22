import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { Coffee, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 py-16">
        <div className="text-center max-w-md bg-white p-8 rounded-3xl border border-[#D4A373]/30 shadow-xl space-y-4">
          <div className="w-16 h-16 bg-[#FAEDCD] text-[#8B5E3C] rounded-full flex items-center justify-center mx-auto">
            <Coffee className="w-8 h-8" />
          </div>
          <h1 className="font-[#Outfit] text-4xl font-extrabold text-[#2C1810]">404</h1>
          <h2 className="font-bold text-lg text-[#8B5E3C]">Page Not Found</h2>
          <p className="text-xs text-gray-500">
            Looks like this page took a coffee break! Let's get you back to our main café menu.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B5E3C] hover:bg-[#6F492E] text-white font-bold text-xs rounded-xl transition-colors shadow-md mt-2"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Menu
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFoundPage;
