import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import TableQRCode from '../../components/admin/TableQRCode';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import {
  QrCode,
  Printer,
  Download,
  Layers,
  Users,
  RefreshCw,
  ExternalLink,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

const AdminQRCodesPage = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [floorFilter, setFloorFilter] = useState('All');
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedUrl, setSelectedUrl] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    fetchTables();

    // Socket.IO real-time table status updates
    const socket = getSocket();
    if (socket) {
      socket.on('tableStatusUpdated', (updatedTable) => {
        setTables((prev) =>
          prev.map((t) => (t._id === updatedTable._id || t.tableNumber === updatedTable.tableNumber ? updatedTable : t))
        );
      });
    }

    return () => {
      if (socket) {
        socket.off('tableStatusUpdated');
      }
    };
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tables');
      if (res.data && res.data.all) {
        const sorted = [...res.data.all].sort((a, b) =>
          (a.tableNumber || '').localeCompare(b.tableNumber || '', undefined, {
            numeric: true,
            sensitivity: 'base',
          })
        );
        setTables(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (table, url) => {
    setSelectedTable(table);
    setSelectedUrl(url);
    setViewModalOpen(true);
  };

  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank');
    const origin = window.location.origin;

    const cardsHtml = tables
      .map(
        (table) => `
      <div class="card">
        <h1 class="brand">ARTISANCAFÉ</h1>
        <p class="sub-brand">COFFEE & DINING</p>
        <h2 class="table-badge">Table ${table.tableNumber}</h2>
        <p class="floor">${table.floor} • Capacity: ${table.capacity} Persons</p>
        <div class="qr-wrapper">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
            `${origin}/menu/t/${table.qrToken || table.tableNumber}`
          )}" alt="Table ${table.tableNumber} QR" />
        </div>
        <p class="scan-text">Scan to Order</p>
      </div>
    `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print All 15 Café Table QR Codes</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;800&display=swap');
            body {
              font-family: 'Outfit', sans-serif;
              margin: 20px;
              background-color: #fff;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 25px;
            }
            .card {
              padding: 25px 20px;
              background: #FAF7F2;
              border: 3px solid #8B5E3C;
              border-radius: 20px;
              text-align: center;
              page-break-inside: avoid;
            }
            .brand {
              font-size: 18px;
              font-weight: 800;
              letter-spacing: 2px;
              color: #2C1810;
              margin: 0;
            }
            .sub-brand {
              font-size: 9px;
              font-weight: 700;
              letter-spacing: 3px;
              color: #8B5E3C;
              margin: 3px 0 10px 0;
            }
            .table-badge {
              font-size: 24px;
              font-weight: 800;
              color: #2C1810;
              margin: 0;
            }
            .floor {
              font-size: 11px;
              color: #6F492E;
              margin: 2px 0 10px 0;
            }
            .qr-wrapper {
              background: white;
              padding: 10px;
              border-radius: 14px;
              display: inline-block;
              border: 1px solid #D4A373;
              margin: 5px 0;
            }
            .qr-wrapper img {
              display: block;
              width: 150px;
              height: 150px;
            }
            .scan-text {
              font-size: 14px;
              font-weight: 800;
              color: #8B5E3C;
              margin: 10px 0 0 0;
            }
            @media print {
              body {
                margin: 0;
              }
              .grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="grid">
            ${cardsHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredTables = tables.filter((t) => {
    if (floorFilter === 'All') return true;
    return t.floor === floorFilter;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <AdminSidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <AdminHeader
          title="Table QR Codes"
          subtitle="Manage, view, download, and print table QR codes for customer contactless mobile ordering"
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Action Row */}
          <div className="bg-white p-5 rounded-3xl border border-[#D4A373]/25 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Floor Filter Tabs */}
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#8B5E3C] shrink-0" />
              <span className="text-xs font-bold text-[#2C1810] mr-1">Floor Layout:</span>
              {['All', 'Ground Floor', 'First Floor'].map((floor) => (
                <button
                  key={floor}
                  onClick={() => setFloorFilter(floor)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    floorFilter === floor
                      ? 'bg-[#8B5E3C] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-gray-600 hover:bg-[#FAEDCD]'
                  }`}
                >
                  {floor === 'All' ? `All Tables (${tables.length})` : floor}
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={fetchTables}
                className="px-3.5 py-2 bg-white border border-[#D4A373]/30 text-[#8B5E3C] hover:bg-[#FAEDCD] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
              <button
                onClick={handlePrintAll}
                className="px-4 py-2 bg-[#8B5E3C] hover:bg-[#6F492E] text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-colors ml-auto sm:ml-0"
              >
                <Printer className="w-4 h-4" /> Print All 15 QR Codes
              </button>
            </div>
          </div>

          {/* QR Code Cards Grid */}
          {loading ? (
            <div className="py-20">
              <LoadingSpinner text="Generating dynamic table QR codes..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredTables.map((table) => (
                <TableQRCode key={table._id} table={table} onView={handleView} onRegenerate={fetchTables} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Enlarged QR Preview Modal */}
      {selectedTable && (
        <Modal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          title={`Table ${selectedTable.tableNumber} QR Code Card`}
          maxWidth="max-w-md"
        >
          <div className="text-center space-y-4 text-xs">
            <div className="bg-[#FAF7F2] p-6 rounded-2xl border-2 border-[#8B5E3C] text-center space-y-3">
              <p className="font-[#Outfit] font-extrabold text-sm tracking-wider text-[#2C1810] uppercase">
                ARTISANCAFÉ
              </p>
              <p className="text-[10px] font-bold tracking-widest text-[#8B5E3C] uppercase">
                COFFEE & DINING
              </p>

              <h2 className="font-[#Outfit] font-extrabold text-2xl text-[#2C1810]">
                Table {selectedTable.tableNumber}
              </h2>
              <p className="text-xs text-[#6F492E] font-semibold">
                {selectedTable.floor} • Seating Capacity: Max {selectedTable.capacity} Persons
              </p>

              <div className="bg-white p-4 rounded-2xl inline-block shadow-md border border-[#D4A373]/30 my-2">
                <QRCodeCanvas
                  value={selectedUrl}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>

              <p className="font-[#Outfit] font-extrabold text-sm text-[#8B5E3C]">Scan to Order</p>
            </div>

            {/* Test Customer View Link */}
            <div className="pt-2">
              <a
                href={selectedUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 bg-[#8B5E3C] hover:bg-[#6F492E] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Open Customer Menu for Table {selectedTable.tableNumber}
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminQRCodesPage;
