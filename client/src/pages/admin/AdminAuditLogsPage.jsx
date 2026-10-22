import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import {
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  User,
  Clock,
  Activity,
  Tag,
} from 'lucide-react';

const AdminAuditLogsPage = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/audit-logs');
      setLogs(res.data || []);
    } catch (err) {
      console.error('Fetch audit logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const action = (log.action || '').toLowerCase();
    const performer = (log.performedByName || '').toLowerCase();
    const target = (log.targetType || '').toLowerCase();
    return action.includes(term) || performer.includes(term) || target.includes(term);
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <AdminSidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <AdminHeader setMobileOpen={setMobileSidebarOpen} title="Audit Trail & System Logs" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          <div className="bg-white rounded-3xl border border-[#D4A373]/25 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-[#Outfit] text-xl font-extrabold text-[#2C1810] flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#8B5E3C]" /> Security & Operational Audit Log
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Immutable record of administrative operations, price edits, QR regenerations, and financial actions.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Filter logs by action or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-xl text-xs"
                />
              </div>
            </div>

            {loading ? (
              <LoadingSpinner text="Retrieving verified audit trail..." />
            ) : filteredLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-gray-600 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Target Entity</th>
                      <th className="py-3 px-4">Performed By</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Details Snapshot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-[#8B5E3C]">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-700">
                          {log.targetType} {log.targetId ? `(${log.targetId.slice(-6)})` : ''}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {log.performedByName || 'System'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                            {log.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-[11px]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-gray-500 font-mono truncate max-w-xs">
                          {JSON.stringify(log.details || {})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 text-xs">No audit logs recorded.</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminAuditLogsPage;
