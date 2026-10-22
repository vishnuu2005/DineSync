import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Building,
  Receipt,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

const AdminSettingsPage = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    restaurantName: '',
    tagline: '',
    gstin: '',
    address: '',
    phone: '',
    email: '',
    taxRatePercent: 5.0,
    paymentMode: 'test',
    requirePaymentBeforeKitchen: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data) {
        setFormData({
          restaurantName: res.data.restaurantName || 'DineSync Demo Restaurant',
          tagline: res.data.tagline || 'Artisan Coffee & Culinary Experience',
          gstin: res.data.gstin || '29ABCDE1234F1Z5',
          address: res.data.address || '100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
          phone: res.data.phone || '+91 98765 43210',
          email: res.data.email || 'contact@dinesync.com',
          taxRatePercent: res.data.taxRatePercent !== undefined ? res.data.taxRatePercent : 5.0,
          paymentMode: res.data.paymentMode || 'test',
          requirePaymentBeforeKitchen: res.data.requirePaymentBeforeKitchen ?? true,
        });
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    try {
      setSaving(true);
      await api.put('/settings', formData);
      setSuccessMsg('Restaurant configuration updated successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <AdminSidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <AdminHeader setMobileOpen={setMobileSidebarOpen} title="Restaurant Configuration" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-4xl">
          <div className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="font-[#Outfit] text-xl font-extrabold text-[#2C1810] flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#8B5E3C]" /> Business & Billing Profile
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                These details appear on customer invoices, tax receipts, and payment statements.
              </p>
            </div>

            {successMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {loading ? (
              <LoadingSpinner text="Loading restaurant configuration..." />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#8B5E3C]" /> Restaurant Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.restaurantName}
                      onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                      className="w-full px-3.5 py-2.5 border rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Brand Tagline
                    </label>
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      className="w-full px-3.5 py-2.5 border rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-[#8B5E3C]" /> Official GSTIN / Tax ID
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                      className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Applicable GST Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="28"
                      required
                      value={formData.taxRatePercent}
                      onChange={(e) =>
                        setFormData({ ...formData, taxRatePercent: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3.5 py-2.5 border rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#8B5E3C]" /> Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 border rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#8B5E3C]" /> Official Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 border rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#8B5E3C]" /> Physical Address
                  </label>
                  <textarea
                    rows="2"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs"
                  />
                </div>

                {/* Gateway Policy */}
                <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#8B5E3C]" /> Payment Mode
                    </label>
                    <select
                      value={formData.paymentMode}
                      onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                      className="w-full px-3.5 py-2.5 border rounded-xl text-xs bg-white"
                    >
                      <option value="test">Test Mode (Razorpay Sandbox Simulator)</option>
                      <option value="live">Live Mode (Production Gateway Active)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="require-payment"
                      checked={formData.requirePaymentBeforeKitchen}
                      onChange={(e) =>
                        setFormData({ ...formData, requirePaymentBeforeKitchen: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-[#8B5E3C]"
                    />
                    <label htmlFor="require-payment" className="text-xs font-semibold text-gray-700">
                      Require full payment before order enters Kitchen KDS
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 rounded-2xl bg-[#8B5E3C] hover:bg-[#6F492E] text-white text-xs font-extrabold flex items-center gap-2 shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Updating Settings...' : 'Save Configuration Changes'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
