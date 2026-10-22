import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import TableSelector from '../components/customer/TableSelector';
import api from '../services/api';
import { handleImageError, getCategoryFallbackImage } from '../utils/imageFallbacks';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Utensils,
  Users,
  MessageSquare,
  CreditCard,
  QrCode,
  ShieldCheck,
  Phone,
  User,
  Sparkles,
  Lock,
} from 'lucide-react';

const CartPage = () => {
  const {
    cartItems,
    selectedTable,
    setSelectedTable,
    tableToken,
    isQrLocked,
    unlockTable,
    tableOccupiedNotice,
    numberOfPersons,
    setNumberOfPersons,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    specialInstructions,
    setSpecialInstructions,
    updateQuantity,
    removeFromCart,
    clearCart,
    resetGuestInfo,
    subtotal,
    taxRate,
    tax,
    totalAmount,
    restaurantBranding,
  } = useCart();

  const { user } = useAuth();
  const navigate = useNavigate();

  const [tableError, setTableError] = useState('');
  const [personsError, setPersonsError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [paymentStep, setPaymentStep] = useState(false);

  const handleSelectTable = (table) => {
    if (isQrLocked) return;
    setSelectedTable(table);
    setTableError('');

    if (numberOfPersons && Number(numberOfPersons) > table.capacity) {
      setPersonsError(`This table can accommodate only ${table.capacity} persons.`);
    } else {
      setPersonsError('');
    }
  };

  const handlePersonsChange = (e) => {
    const val = e.target.value;
    setNumberOfPersons(val);

    if (!val || Number(val) < 1) {
      setPersonsError('Number of persons is required.');
    } else if (selectedTable && Number(val) > selectedTable.capacity) {
      setPersonsError(`This table can accommodate only ${selectedTable.capacity} persons.`);
    } else {
      setPersonsError('');
    }
  };

  // Submit order & open Razorpay Checkout
  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    setTableError('');
    setPersonsError('');
    setServerError('');

    if (!selectedTable) {
      setTableError('Please choose or scan an available table.');
      return;
    }

    if (selectedTable.status !== 'Available') {
      setTableError(`Table ${selectedTable.tableNumber} is currently occupied.`);
      return;
    }

    if (!numberOfPersons || Number(numberOfPersons) < 1) {
      setPersonsError('Number of persons is required.');
      return;
    }

    if (cartItems.length === 0) {
      setServerError('Your cart is empty.');
      return;
    }

    try {
      setSubmitting(true);

      // 1. Create Order on Server (Passwordless)
      const orderPayload = {
        tableNumber: selectedTable.tableNumber.toString(),
        tableToken: selectedTable.qrToken || tableToken,
        tableId: selectedTable._id,
        numberOfPersons: Number(numberOfPersons),
        customerName: customerName || (user?.name ? user.name : 'Guest Customer'),
        customerPhone: customerPhone || (user?.phone ? user.phone : ''),
        specialInstructions: specialInstructions ? specialInstructions.trim() : '',
        items: cartItems.map((item) => ({
          _id: item._id,
          quantity: item.quantity,
        })),
      };

      const res = await api.post('/public/orders', orderPayload);
      const newOrder = res.data;

      // 2. Initialize Payment Gateway Order
      const paymentRes = await api.post(`/public/orders/${newOrder._id}/payment`, {
        publicAccessToken: newOrder.publicAccessToken,
        customerName: orderPayload.customerName,
        customerPhone: orderPayload.customerPhone,
      });

      const gatewayData = paymentRes.data;

      // 3. Process Checkout (supports Razorpay standard checkout script if loaded or sandbox simulation)
      if (window.Razorpay && !gatewayData.isTestMode) {
        const options = {
          key: gatewayData.keyId,
          amount: gatewayData.amountInPaise,
          currency: gatewayData.currency,
          name: restaurantBranding?.name || 'DineSync Restaurant',
          description: `Order ${newOrder.orderNumber} - Table ${selectedTable.tableNumber}`,
          order_id: gatewayData.gatewayOrderId,
          handler: async function (response) {
            try {
              await api.post('/public/payments/verify', {
                orderId: newOrder._id,
                publicAccessToken: newOrder.publicAccessToken,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              clearCart();
              resetGuestInfo();
              navigate(`/order-status/${newOrder.publicAccessToken}`);
            } catch (verErr) {
              setServerError('Payment verification error. Please notify staff with order ID: ' + newOrder.orderNumber);
            }
          },
          prefill: {
            name: orderPayload.customerName,
            contact: orderPayload.customerPhone,
          },
          theme: { color: '#8B5E3C' },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Instant verified test transaction
        const simPaymentId = `pay_test_${Date.now()}`;
        await api.post('/public/payments/verify', {
          orderId: newOrder._id,
          publicAccessToken: newOrder.publicAccessToken,
          razorpay_order_id: gatewayData.gatewayOrderId,
          razorpay_payment_id: simPaymentId,
          razorpay_signature: 'test_signature_valid',
        });

        clearCart();
        resetGuestInfo();
        navigate(`/order-status/${newOrder.publicAccessToken}`);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setServerError(err.response?.data?.message || 'Payment initiation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Link
          to={tableToken ? `/menu/t/${tableToken}` : selectedTable?.tableNumber ? `/menu?table=${selectedTable.tableNumber}` : '/menu'}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#8B5E3C] hover:text-[#2C1810] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Continue Adding Menu Items
        </Link>

        <h1 className="font-[#Outfit] text-3xl font-extrabold text-[#2C1810] mb-6 flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-[#8B5E3C]" /> Review Order & Pay
        </h1>

        {serverError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs flex items-center gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col: Cart Items & Table Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Selected Items Card */}
              <div className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">
                    Selected Dishes ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})
                  </span>
                  <button
                    onClick={() => clearCart(false)}
                    className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear All
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {cartItems.map((item) => (
                    <div key={item._id} className="py-4 flex items-center gap-4">
                      <img
                        src={item.image || getCategoryFallbackImage(item.category)}
                        alt={item.name}
                        className="w-16 h-16 rounded-2xl object-cover border border-gray-200 shrink-0"
                        onError={(e) => handleImageError(e, item.category)}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-[#Outfit] font-bold text-sm text-[#2C1810] truncate">
                            {item.name}
                          </h4>
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              item.type === 'veg' ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                        </div>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">₹{item.price} each</p>
                      </div>

                      <div className="flex items-center gap-2 bg-[#FAF7F2] p-1 rounded-xl border border-[#D4A373]/30">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-white text-[#8B5E3C] flex items-center justify-center hover:bg-[#8B5E3C] hover:text-white transition-colors border border-gray-200"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs px-1 text-[#2C1810]">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-white text-[#8B5E3C] flex items-center justify-center hover:bg-[#8B5E3C] hover:text-white transition-colors border border-gray-200"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <span className="font-[#Outfit] font-extrabold text-sm text-[#2C1810]">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guest & Table Information */}
              <div className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 shadow-xs space-y-6">
                <h3 className="font-[#Outfit] text-base font-bold text-[#2C1810] flex items-center gap-2">
                  <User className="w-5 h-5 text-[#8B5E3C]" /> Guest Information (Optional)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Guest Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Aarav Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#8B5E3C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Mobile Number (for SMS / WhatsApp receipt)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#8B5E3C]"
                    />
                  </div>
                </div>

                {/* Special Cooking Instructions */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-[#8B5E3C]" /> Cooking Instructions / Dietary Notes
                  </label>
                  <textarea
                    rows="2"
                    placeholder="e.g., Less spicy, almond milk for latte, extra napkins..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>
              </div>

              {/* Table Selector (if not locked by QR) */}
              <div className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-[#Outfit] text-base font-bold text-[#2C1810] flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-[#8B5E3C]" /> Dining Table Assignment
                  </h3>
                  {isQrLocked && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Locked to QR Code
                    </span>
                  )}
                </div>

                {tableError && (
                  <p className="text-xs text-red-600 font-semibold">{tableError}</p>
                )}

                {selectedTable ? (
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#D4A373]/40 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-[#2C1810]">
                        Table {selectedTable.tableNumber} • {selectedTable.floor}
                      </p>
                      <p className="text-xs text-gray-500">
                        Seating Capacity: {selectedTable.capacity} Persons
                      </p>
                    </div>
                    {isQrLocked ? (
                      <button
                        type="button"
                        onClick={unlockTable}
                        className="text-xs font-bold text-[#8B5E3C] hover:underline"
                        title="Unlock to switch to another table"
                      >
                        Switch Table
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedTable(null)}
                        className="text-xs font-bold text-[#8B5E3C] hover:underline"
                      >
                        Change Table
                      </button>
                    )}
                  </div>
                ) : (
                  <TableSelector
                    selectedTable={selectedTable}
                    onSelectTable={handleSelectTable}
                  />
                )}
              </div>
            </div>

            {/* Right Col: Price Breakdown & Payment */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl border border-[#D4A373]/30 p-6 shadow-lg sticky top-6 space-y-6">
                <h3 className="font-[#Outfit] text-lg font-bold text-[#2C1810] pb-3 border-b border-gray-100">
                  Payment Summary
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span className="flex items-center gap-1">
                      GST Tax ({taxRate || 5}%)
                    </span>
                    <span className="font-semibold text-gray-900">₹{tax.toFixed(2)}</span>
                  </div>

                  <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                    <span className="font-bold text-sm text-[#2C1810]">Grand Total</span>
                    <span className="font-[#Outfit] text-2xl font-extrabold text-[#8B5E3C]">
                      ₹{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#D4A373]/30 text-[11px] text-[#8B5E3C] space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Secure Instant Payment
                  </p>
                  <p className="text-gray-600">
                    UPI, Credit/Debit Cards, NetBanking supported. Upon payment confirmation, your order is sent directly to the kitchen display screen.
                  </p>
                </div>

                <button
                  onClick={handleProceedToPayment}
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#8B5E3C] to-[#6F492E] hover:from-[#6F492E] hover:to-[#573720] text-white font-extrabold text-sm shadow-xl hover:shadow-2xl transition-all transform active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <span>Processing Payment...</span>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Pay ₹{totalAmount.toFixed(2)} & Send to Kitchen</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-gray-400">
                  Powered by DineSync Integrated Payment Services • 256-bit TLS Encrypted
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#D4A373]/20 p-8 max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF7F2] text-[#8B5E3C] flex items-center justify-center mx-auto mb-4 border border-[#D4A373]/30">
              <ShoppingBag className="w-8 h-8 opacity-60" />
            </div>
            <h3 className="font-[#Outfit] text-lg font-bold text-[#2C1810]">
              Your Cart is Empty
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Browse our handcrafted menu to pick fresh coffee, breakfast, and delicious snacks.
            </p>
            <Link
              to="/menu"
              className="inline-block mt-5 px-6 py-2.5 bg-[#8B5E3C] text-white text-xs font-bold rounded-xl hover:bg-[#6F492E] transition-colors"
            >
              Explore Menu
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CartPage;
