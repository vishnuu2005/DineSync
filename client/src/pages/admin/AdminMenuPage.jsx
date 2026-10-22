import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import { handleImageError, getCategoryFallbackImage } from '../../utils/imageFallbacks';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Check,
  X,
  Search,
  Coffee,
  Sparkles,
  Upload,
  CheckCircle2,
} from 'lucide-react';

const categories = ['Coffee', 'Tea', 'Snacks', 'Breakfast', 'Desserts', 'Other'];

const FOOD_IMAGE_PRESETS = [
  { label: 'Espresso', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cappuccino', url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cold Brew', url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80' },
  { label: 'Croissant', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80' },
  { label: 'Sandwich', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cheesecake', url: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?auto=format&fit=crop&w=600&q=80' },
  { label: 'Chai Tea', url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80' },
  { label: 'Pancakes', url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80' },
];

const AdminMenuPage = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Coffee',
    image: '',
    type: 'veg',
    available: true,
  });

  const [formError, setFormError] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = '/products';
      if (selectedCategory !== 'All') {
        url += `?category=${selectedCategory}`;
      }
      const res = await api.get(url);
      setProducts(res.data);
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, image: reader.result }));
      setFormError('');
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAddModal = () => {
    setEditMode(false);
    setCurrentItemId(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Coffee',
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      type: 'veg',
      available: true,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditMode(true);
    setCurrentItemId(product._id);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category,
      image: product.image || getCategoryFallbackImage(product.category),
      type: product.type || 'veg',
      available: product.available,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || formData.price === '' || !formData.category) {
      setFormError('Please fill in required fields (Name, Price, Category).');
      return;
    }

    try {
      setSubmitting(true);
      if (editMode) {
        await api.put(`/products/${currentItemId}`, formData);
        setSaveSuccessMsg(`Item "${formData.name}" and food image updated successfully!`);
      } else {
        await api.post('/products', formData);
        setSaveSuccessMsg(`New item "${formData.name}" created with custom food image!`);
      }
      setModalOpen(false);
      fetchProducts();
      setTimeout(() => setSaveSuccessMsg(''), 5000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAvailability = async (product) => {
    try {
      await api.put(`/products/${product._id}`, { available: !product.available });
      fetchProducts();
    } catch (err) {
      alert('Failed to update availability.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this menu item permanently?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (err) {
        alert('Failed to delete menu item.');
      }
    }
  };

  const filteredProducts = products.filter((p) => {
    if (searchQuery.trim()) {
      return p.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <AdminSidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <AdminHeader
          title="Menu Item Management"
          subtitle="Add new coffee and food items, update pricing, images, and availability"
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Action & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search menu items..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D4A373]/30 rounded-xl text-xs text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2.5 bg-white border border-[#D4A373]/30 rounded-xl text-xs font-bold text-[#2C1810] focus:outline-none"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#8B5E3C] hover:bg-[#6F492E] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" /> Add New Menu Item
            </button>
          </div>

          {saveSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs font-bold text-emerald-800 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Product Items Table */}
          {loading ? (
            <div className="py-16">
              <LoadingSpinner text="Fetching menu items catalog..." />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#D4A373]/25 shadow-xs overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF7F2] border-b border-[#D4A373]/20 text-[11px] font-bold text-[#8B5E3C] uppercase tracking-wider">
                      <th className="py-3.5 px-4">Item Image</th>
                      <th className="py-3.5 px-4">Item Name</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Price (₹)</th>
                      <th className="py-3.5 px-4">Availability</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredProducts.map((product) => (
                      <tr key={product._id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                        {/* Image */}
                        <td className="py-3.5 px-4">
                          <img
                            src={product.image || getCategoryFallbackImage(product.category)}
                            alt={product.name}
                            className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                            onError={(e) => handleImageError(e, product.category)}
                          />
                        </td>

                        {/* Name & Desc */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <span className="block font-bold text-[#2C1810] text-sm">
                            {product.name}
                          </span>
                          <span className="block text-[11px] text-gray-500 line-clamp-1">
                            {product.description || 'No description provided'}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <span className="bg-[#FAEDCD] text-[#2C1810] px-2.5 py-1 rounded-lg font-extrabold text-[11px] border border-[#D4A373]/30">
                            {product.category}
                          </span>
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              product.type === 'veg'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.type}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4 font-[#Outfit] font-extrabold text-sm text-[#8B5E3C]">
                          ₹{product.price}
                        </td>

                        {/* Availability Switch */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleAvailability(product)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                              product.available
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-gray-100 text-gray-500 border border-gray-300'
                            }`}
                          >
                            {product.available ? (
                              <>
                                <Check className="w-3 h-3" /> Available
                              </>
                            ) : (
                              <>
                                <X className="w-3 h-3" /> Out of Stock
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(product)}
                              className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#FAEDCD] text-[#8B5E3C] transition-colors"
                              title="Edit Menu Item"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product._id)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit Menu Item Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editMode ? 'Edit Menu Item' : 'Add New Menu Item'}
          maxWidth="max-w-lg"
        >
          {formError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#2C1810] mb-1">Item Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Caramel Macchiato"
                required
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D4A373]/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2C1810] mb-1">Price (₹) *</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="180"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D4A373]/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2C1810] mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D4A373]/30 rounded-xl font-bold focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2C1810] mb-1">Food Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D4A373]/30 rounded-xl font-bold focus:outline-none"
                >
                  <option value="veg">Vegetarian</option>
                  <option value="non-veg">Non-Vegetarian</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2C1810] mb-1">Stock Availability</label>
                <label className="flex items-center gap-2 pt-2.5 cursor-pointer font-bold text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="w-4 h-4 accent-[#8B5E3C] rounded"
                  />
                  <span>Available in Kitchen</span>
                </label>
              </div>
            </div>

            {/* Food Image Management: Preview + Upload + Presets + URL */}
            <div className="space-y-2.5 bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#D4A373]/30">
              <label className="block font-bold text-[#2C1810]">
                Food Item Image
              </label>

              {/* Preview and Controls */}
              <div className="flex items-start gap-3.5">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-[#8B5E3C] bg-white shadow-xs shrink-0 flex items-center justify-center">
                  {formData.image ? (
                    <img
                      src={formData.image}
                      alt="Food preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getCategoryFallbackImage(formData.category);
                      }}
                    />
                  ) : (
                    <UtensilsCrossed className="w-8 h-8 text-[#8B5E3C]/40" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="Enter image URL or choose upload below..."
                    className="w-full px-3 py-2 bg-white border border-[#D4A373]/30 rounded-xl font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]"
                  />

                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-1.5 bg-[#8B5E3C] hover:bg-[#6F492E] text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      Upload File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    {formData.image && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="text-[11px] text-red-600 hover:underline font-semibold"
                      >
                        Reset Image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Image Presets */}
              <div className="pt-2 border-t border-[#D4A373]/20">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Or select high-res café photo preset:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {FOOD_IMAGE_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => setFormData({ ...formData, image: preset.url })}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                        formData.image === preset.url
                          ? 'bg-[#8B5E3C] text-white border-[#8B5E3C] shadow-2xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-[#8B5E3C]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#2C1810] mb-1">Description</label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief appetizing description of coffee or food item..."
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D4A373]/30 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-[#8B5E3C] hover:bg-[#6F492E] text-white rounded-xl font-bold shadow-md"
              >
                {submitting ? 'Saving Item...' : editMode ? 'Update Item' : 'Create Item'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminMenuPage;
