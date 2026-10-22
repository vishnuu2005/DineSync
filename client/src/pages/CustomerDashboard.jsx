import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import CategoryFilter from '../components/customer/CategoryFilter';
import SearchBar from '../components/customer/SearchBar';
import ProductCard from '../components/customer/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';
import {
  Coffee,
  Sparkles,
  ShoppingBag,
  Utensils,
  ArrowRight,
  QrCode,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const {
    itemCount,
    totalAmount,
    selectedTable,
    isQrLocked,
    setTableFromToken,
    setTableFromQR,
    tableOccupiedNotice,
    numberOfPersons,
    setNumberOfPersons,
    restaurantBranding,
  } = useCart();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [vegOnlyFilter, setVegOnlyFilter] = useState(false);
  const [personsInputError, setPersonsInputError] = useState('');

  // Auto-resolve table from URL route /menu/t/:token or query ?t=... or ?table=...
  useEffect(() => {
    const qrToken = token || searchParams.get('t') || searchParams.get('token');
    const tableParam = searchParams.get('table');

    if (qrToken) {
      setTableFromToken(qrToken);
    } else if (tableParam) {
      setTableFromQR(tableParam);
    }
  }, [token, searchParams]);

  useEffect(() => {
    fetchMenuData();
  }, [activeCategory, searchTerm]);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      let url = '/products';
      const params = new URLSearchParams();

      if (activeCategory !== 'All') {
        params.append('category', activeCategory);
      }
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      params.append('availableOnly', 'true');

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const [productsRes, categoriesRes] = await Promise.all([
        api.get(url),
        api.get('/categories').catch(() => ({ data: [] })),
      ]);

      setProducts(productsRes.data);
      if (categoriesRes.data && categoriesRes.data.length > 0) {
        setCategories(categoriesRes.data.map((c) => c.name));
      } else {
        setCategories(['Coffee', 'Tea', 'Breakfast', 'Snacks', 'Desserts', 'Other']);
      }
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonsChange = (e) => {
    const val = e.target.value;
    setNumberOfPersons(val);

    if (!val || Number(val) < 1) {
      setPersonsInputError('Please enter at least 1 person.');
    } else if (selectedTable && Number(val) > selectedTable.capacity) {
      setPersonsInputError(`Table ${selectedTable.tableNumber} can accommodate max ${selectedTable.capacity} persons.`);
    } else {
      setPersonsInputError('');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (vegOnlyFilter && p.type !== 'veg') return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Table Banner or QR Notice */}
        {selectedTable ? (
          <div className="mb-8 p-5 bg-gradient-to-r from-[#2C1810] via-[#3A2218] to-[#2C1810] rounded-3xl text-white shadow-lg border border-[#D4A373]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B5E3C] to-[#2C1810] text-[#FAEDCD] flex flex-col items-center justify-center font-extrabold shadow-md border border-[#D4A373]/40 shrink-0">
                <span className="text-[9px] uppercase tracking-wider text-[#D4A373]">Table</span>
                <span className="font-[#Outfit] text-2xl font-black text-white leading-none">
                  {selectedTable.tableNumber}
                </span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-[#Outfit] text-lg sm:text-xl font-bold tracking-tight">
                    {restaurantBranding?.name || 'DineSync Restaurant'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Live Dine-In
                  </span>
                  {isQrLocked && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B5E3C]/40 text-[#FAEDCD] border border-[#D4A373]/40 flex items-center gap-1">
                      <QrCode className="w-3 h-3 text-[#D4A373]" /> QR Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#FAEDCD] mt-1 flex flex-wrap items-center gap-2">
                  <span>
                    Floor: <strong>{selectedTable.floor || 'Main Hall'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Table: <strong>{selectedTable.tableNumber}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Capacity: <strong>{selectedTable.capacity} Persons</strong>
                  </span>
                </p>
              </div>
            </div>

            {/* Guest Persons Selector */}
            <div className="flex items-center gap-3 bg-black/30 p-2 rounded-2xl border border-white/10">
              <Users className="w-4 h-4 text-[#D4A373]" />
              <label htmlFor="persons-count" className="text-xs font-semibold text-gray-200">
                Guests:
              </label>
              <input
                id="persons-count"
                type="number"
                min="1"
                max={selectedTable.capacity || 10}
                value={numberOfPersons}
                onChange={handlePersonsChange}
                className="w-14 px-2 py-1 bg-[#1A0F0A] border border-[#D4A373]/40 rounded-xl text-center text-xs font-bold text-white focus:outline-none focus:border-[#D4A373]"
              />
            </div>
          </div>
        ) : (
          <div className="mb-8 p-4 bg-[#FAEDCD]/70 border border-[#D4A373]/40 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <QrCode className="w-5 h-5 text-[#8B5E3C] shrink-0" />
              <p className="text-xs text-[#2C1810] font-medium">
                Browsing general menu. Scan a table QR code or select a table at checkout to order directly to your seats.
              </p>
            </div>
            <Link
              to="/cart"
              className="text-xs font-bold text-[#8B5E3C] hover:underline shrink-0"
            >
              Choose Table
            </Link>
          </div>
        )}

        {/* Occupied Warning Banner */}
        {tableOccupiedNotice && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{tableOccupiedNotice}</span>
          </div>
        )}

        {/* Persons Error */}
        {personsInputError && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{personsInputError}</span>
          </div>
        )}

        {/* Title & Tagline */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5E3C]/10 text-xs font-bold text-[#8B5E3C] mb-2">
              <Coffee className="w-3.5 h-3.5" /> Handcrafted Culinary Excellence
            </div>
            <h1 className="font-[#Outfit] text-3xl sm:text-4xl font-extrabold text-[#2C1810] tracking-tight">
              Artisan Food & Drinks Menu
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Select dishes and beverages. Place your order with instant online payment directly to our kitchen.
            </p>
          </div>

          {/* Quick Dietary Filters */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setVegOnlyFilter(!vegOnlyFilter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                vegOnlyFilter
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-600'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Veg Only
            </button>
          </div>
        </div>

        {/* Search & Categories */}
        <div className="space-y-6 mb-10">
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <CategoryFilter
            categories={['All', ...categories]}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <LoadingSpinner text="Fetching fresh menu items..." />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#D4A373]/20 p-8 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF7F2] text-[#8B5E3C] flex items-center justify-center mx-auto mb-4 border border-[#D4A373]/30">
              <Utensils className="w-8 h-8 opacity-60" />
            </div>
            <h3 className="font-[#Outfit] text-lg font-bold text-[#2C1810]">
              No dishes found matching your selection
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Try choosing another category or clearing your search term to see more handcrafted items.
            </p>
            <button
              onClick={() => {
                setActiveCategory('All');
                setSearchTerm('');
                setVegOnlyFilter(false);
              }}
              className="mt-5 px-5 py-2.5 bg-[#8B5E3C] text-white text-xs font-bold rounded-xl hover:bg-[#6F492E] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar (Sticky when cart has items) */}
      {itemCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-3xl mx-auto z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#1A0F0A] text-white p-4 rounded-3xl shadow-2xl border border-[#D4A373]/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-[#8B5E3C] text-white flex items-center justify-center font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-[#1A0F0A]">
                  {itemCount}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-300">
                  {selectedTable ? `Table ${selectedTable.tableNumber}` : 'Cart Total'} • {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </p>
                <p className="font-[#Outfit] text-lg font-extrabold text-[#D4A373] tracking-tight">
                  ₹{totalAmount}{' '}
                  <span className="text-[10px] font-normal text-gray-400 font-sans">
                    (incl. 5% GST)
                  </span>
                </p>
              </div>
            </div>

            <Link
              to="/cart"
              className="px-6 py-2.5 rounded-2xl bg-[#D4A373] hover:bg-[#C28E5E] text-[#1A0F0A] font-extrabold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-transform active:scale-95"
            >
              <span>Review & Pay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default CustomerDashboard;
