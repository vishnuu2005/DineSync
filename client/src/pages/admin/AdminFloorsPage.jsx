import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

const AdminFloorsPage = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [floors, setFloors] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Floor modal
  const [floorModalOpen, setFloorModalOpen] = useState(false);
  const [floorEditMode, setFloorEditMode] = useState(false);
  const [currentFloorId, setCurrentFloorId] = useState(null);
  const [floorName, setFloorName] = useState('');
  const [floorDesc, setFloorDesc] = useState('');
  const [floorOrder, setFloorOrder] = useState('0');

  // Table modal
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableEditMode, setTableEditMode] = useState(false);
  const [currentTableId, setCurrentTableId] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [tableFloor, setTableFloor] = useState('');
  const [tableCapacity, setTableCapacity] = useState('4');

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [floorsRes, tablesRes] = await Promise.all([
        api.get('/floors'),
        api.get('/tables'),
      ]);
      setFloors(floorsRes.data || []);
      const allTables = tablesRes.data?.all || [];
      allTables.sort((a, b) =>
        (a.tableNumber || '').localeCompare(b.tableNumber || '', undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      );
      setTables(allTables);
    } catch (err) {
      console.error('Fetch floors error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFloorModal = (floor = null) => {
    setErrorMsg('');
    if (floor) {
      setFloorEditMode(true);
      setCurrentFloorId(floor._id);
      setFloorName(floor.name);
      setFloorDesc(floor.description || '');
      setFloorOrder(floor.displayOrder?.toString() || '0');
    } else {
      setFloorEditMode(false);
      setCurrentFloorId(null);
      setFloorName('');
      setFloorDesc('');
      setFloorOrder((floors.length + 1).toString());
    }
    setFloorModalOpen(true);
  };

  const handleSaveFloor = async (e) => {
    e.preventDefault();
    if (!floorName.trim()) {
      setErrorMsg('Floor name is required.');
      return;
    }
    try {
      setSubmitting(true);
      setErrorMsg('');
      if (floorEditMode) {
        await api.put(`/floors/${currentFloorId}`, {
          name: floorName.trim(),
          description: floorDesc.trim(),
          displayOrder: Number(floorOrder),
        });
      } else {
        await api.post('/floors', {
          name: floorName.trim(),
          description: floorDesc.trim(),
          displayOrder: Number(floorOrder),
        });
      }
      setFloorModalOpen(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save floor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenTableModal = (table = null) => {
    setErrorMsg('');
    if (table) {
      setTableEditMode(true);
      setCurrentTableId(table._id);
      setTableNumber(table.tableNumber);
      setTableFloor(table.floor);
      setTableCapacity(table.capacity?.toString() || '4');
    } else {
      setTableEditMode(false);
      setCurrentTableId(null);
      setTableNumber(`T-${tables.length + 1}`);
      setTableFloor(floors[0]?.name || 'Ground Floor');
      setTableCapacity('4');
    }
    setTableModalOpen(true);
  };

  const handleSaveTable = async (e) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      setErrorMsg('Table number is required.');
      return;
    }
    const cap = Number(tableCapacity);
    if (isNaN(cap) || cap < 1 || cap > 50) {
      setErrorMsg('Capacity must be a positive integer between 1 and 50.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      if (tableEditMode) {
        await api.put(`/tables/${currentTableId}`, {
          tableNumber: tableNumber.trim(),
          floor: tableFloor,
          capacity: cap,
        });
      } else {
        await api.post('/tables', {
          tableNumber: tableNumber.trim(),
          floor: tableFloor,
          capacity: cap,
        });
      }
      setTableModalOpen(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save table.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <AdminSidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <AdminHeader setMobileOpen={setMobileSidebarOpen} title="Floors & Table Seating" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-8 flex-1">
          {/* Top Floor Management Section */}
          <div className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-[#Outfit] text-xl font-extrabold text-[#2C1810] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#8B5E3C]" /> Restaurant Floors
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Organize dining zones, terraces, and mezzanine areas.
                </p>
              </div>

              <button
                onClick={() => handleOpenFloorModal()}
                className="px-4 py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#6F492E] text-white text-xs font-bold flex items-center gap-2 transition-all self-start sm:self-auto shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add New Floor
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {floors.map((floor) => (
                <div
                  key={floor._id}
                  className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#D4A373]/30 space-y-3 relative hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-[#Outfit] font-extrabold text-base text-[#2C1810]">
                        {floor.name}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-1">{floor.description || 'No description'}</p>
                    </div>
                    <button
                      onClick={() => handleOpenFloorModal(floor)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#8B5E3C] hover:bg-white transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-[#D4A373]/20 flex items-center justify-between text-xs font-semibold text-gray-600">
                    <span>{floor.tableCount || 0} Tables</span>
                    <span>Total Seats: {floor.totalCapacity || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tables Management Section */}
          <div className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-[#Outfit] text-xl font-extrabold text-[#2C1810] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#8B5E3C]" /> Dining Tables & Capacities ({tables.length})
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Change seat counts, assign floors, and review operational status.
                </p>
              </div>

              <button
                onClick={() => handleOpenTableModal()}
                className="px-4 py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#6F492E] text-white text-xs font-bold flex items-center gap-2 transition-all self-start sm:self-auto shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Table
              </button>
            </div>

            {loading ? (
              <LoadingSpinner text="Loading tables..." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tables.map((table) => (
                  <div
                    key={table._id}
                    className="p-4 rounded-2xl border border-gray-200 hover:border-[#8B5E3C]/40 bg-white shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-[#Outfit] font-extrabold text-lg text-[#2C1810]">
                        Table {table.tableNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          table.status === 'Occupied'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {table.status}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1">
                      <p>
                        Floor: <strong>{table.floor}</strong>
                      </p>
                      <p>
                        Seats: <strong>{table.capacity} Persons</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenTableModal(table)}
                      className="w-full py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#8B5E3C] hover:text-white text-[#8B5E3C] font-bold text-xs border border-[#D4A373]/30 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Table & Seats
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floor Modal */}
      <Modal
        isOpen={floorModalOpen}
        onClose={() => setFloorModalOpen(false)}
        title={floorEditMode ? 'Edit Restaurant Floor' : 'Create Restaurant Floor'}
      >
        <form onSubmit={handleSaveFloor} className="space-y-4">
          {errorMsg && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl">{errorMsg}</p>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Floor Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Rooftop Terrace"
              value={floorName}
              onChange={(e) => setFloorName(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
            <input
              type="text"
              placeholder="e.g. Open-air panoramic evening dining"
              value={floorDesc}
              onChange={(e) => setFloorDesc(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Display Order</label>
            <input
              type="number"
              value={floorOrder}
              onChange={(e) => setFloorOrder(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-[#8B5E3C] hover:bg-[#6F492E] text-white font-bold text-xs rounded-xl shadow-md"
          >
            {submitting ? 'Saving...' : 'Save Floor'}
          </button>
        </form>
      </Modal>

      {/* Table Modal */}
      <Modal
        isOpen={tableModalOpen}
        onClose={() => setTableModalOpen(false)}
        title={tableEditMode ? 'Edit Table & Seat Capacity' : 'Add New Table'}
      >
        <form onSubmit={handleSaveTable} className="space-y-4">
          {errorMsg && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl">{errorMsg}</p>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Table Identifier / Number
            </label>
            <input
              type="text"
              required
              placeholder="e.g. G-01, 14, T-05"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Floor</label>
            <select
              value={tableFloor}
              onChange={(e) => setTableFloor(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs"
            >
              {floors.map((f) => (
                <option key={f._id} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Seating Capacity (Persons)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              required
              value={tableCapacity}
              onChange={(e) => setTableCapacity(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-[#8B5E3C] hover:bg-[#6F492E] text-white font-bold text-xs rounded-xl shadow-md"
          >
            {submitting ? 'Saving...' : 'Save Table Configuration'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminFloorsPage;
