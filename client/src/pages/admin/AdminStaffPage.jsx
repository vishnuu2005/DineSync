import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import {
  UserCheck,
  Plus,
  Trash2,
  Mail,
  Phone,
  Shield,
  ChefHat,
  Utensils,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const AdminStaffPage = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('waiter');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/staff');
      setStaffList(res.data || []);
    } catch (err) {
      console.error('Fetch staff error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setErrorMsg('Name, email, and password are required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await api.post('/users/staff', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
      });

      setModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      fetchStaff();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create staff account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id, staffName) => {
    if (!window.confirm(`Are you sure you want to remove staff account "${staffName}"?`)) {
      return;
    }
    try {
      await api.delete(`/users/staff/${id}`);
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove staff account.');
    }
  };

  const getRoleBadge = (r) => {
    switch (r) {
      case 'admin':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 flex items-center gap-1 w-max">
            <Shield className="w-3 h-3 text-purple-600" /> Admin
          </span>
        );
      case 'chef':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-max">
            <ChefHat className="w-3 h-3 text-amber-600" /> Kitchen Chef
          </span>
        );
      case 'waiter':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1 w-max">
            <Utensils className="w-3 h-3 text-blue-600" /> Floor Waiter
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <AdminSidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <AdminHeader setMobileOpen={setMobileSidebarOpen} title="Staff & Role Management" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          <div className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-[#Outfit] text-xl font-extrabold text-[#2C1810] flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#8B5E3C]" /> Restaurant Staff Registry ({staffList.length})
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Control permissions for administrators, kitchen chefs, and floor service captains.
                </p>
              </div>

              <button
                onClick={() => {
                  setErrorMsg('');
                  setModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#6F492E] text-white text-xs font-bold flex items-center gap-2 transition-all self-start sm:self-auto shadow-sm"
              >
                <Plus className="w-4 h-4" /> Provision Staff Account
              </button>
            </div>

            {loading ? (
              <LoadingSpinner text="Retrieving authorized staff list..." />
            ) : staffList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffList.map((staff) => (
                  <div
                    key={staff._id}
                    className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#D4A373]/30 space-y-3 relative hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-[#Outfit] font-extrabold text-base text-[#2C1810]">
                          {staff.name}
                        </h4>
                        {getRoleBadge(staff.role)}
                      </div>
                      <button
                        onClick={() => handleDeleteStaff(staff._id, staff.name)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-white transition-colors"
                        title="Remove staff account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-[#D4A373]/20 text-xs text-gray-600 space-y-1">
                      <p className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-mono">{staff.email}</span>
                      </p>
                      {staff.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{staff.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 text-xs">No staff accounts provisioned.</div>
            )}
          </div>
        </main>
      </div>

      {/* Staff Provision Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Provision New Staff Account"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          {errorMsg && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl">{errorMsg}</p>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Liam Patel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="liam@cafe.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone</label>
            <input
              type="tel"
              placeholder="9876500000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Temporary Password</label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Staff Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
            >
              <option value="waiter">Floor Waiter (Table delivery & service)</option>
              <option value="chef">Kitchen Chef (KDS order preparation)</option>
              <option value="admin">Administrator (Full console privileges)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-[#8B5E3C] hover:bg-[#6F492E] text-white font-bold text-xs rounded-xl shadow-md"
          >
            {submitting ? 'Creating...' : 'Provision Staff Account'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminStaffPage;
