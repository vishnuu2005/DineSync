import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Printer, Users, Eye, Coffee, CheckCircle2, QrCode, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const TableQRCode = ({ table, onView, onRegenerate }) => {
  const qrRef = useRef(null);
  const [regenerating, setRegenerating] = useState(false);

  // Dynamic QR Code target URL pointing to public opaque table token
  const origin = window.location.origin;
  const qrUrl = `${origin}/menu/t/${table.qrToken || table.tableNumber}`;

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    exportCanvas.width = 420;
    exportCanvas.height = 540;

    // Background
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Decorative Border
    ctx.strokeStyle = '#8B5E3C';
    ctx.lineWidth = 4;
    ctx.strokeRect(15, 15, exportCanvas.width - 30, exportCanvas.height - 30);

    // Header Title
    ctx.fillStyle = '#2C1810';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DINESYNC RESTAURANT', 210, 55);

    ctx.fillStyle = '#8B5E3C';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('SMART TABLE DINING', 210, 78);

    // Draw Table Number
    ctx.fillStyle = '#2C1810';
    ctx.font = 'bold 28px Outfit, sans-serif';
    ctx.fillText(`Table ${table.tableNumber}`, 210, 120);

    ctx.fillStyle = '#6F492E';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${table.floor} • Seating: ${table.capacity} Persons`, 210, 142);

    // Draw QR Code Image
    ctx.drawImage(canvas, 90, 165, 240, 240);

    // Scan instruction footer
    ctx.fillStyle = '#8B5E3C';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Scan to Order Without Waiting', 210, 445);

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '9px monospace';
    ctx.fillText(qrUrl, 210, 475);

    const link = document.createElement('a');
    link.download = `DineSync-Table-${table.tableNumber}-QR.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const canvas = qrRef.current?.querySelector('canvas');
    const qrDataUrl = canvas ? canvas.toDataURL('image/png') : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Label - Table ${table.tableNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;800&display=swap');
            body {
              font-family: 'Plus Jakarta Sans', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background-color: #f3f4f6;
            }
            .card {
              background: #FAF7F2;
              border: 3px solid #8B5E3C;
              border-radius: 24px;
              padding: 32px;
              width: 320px;
              text-align: center;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            .brand {
              font-family: 'Outfit', sans-serif;
              font-size: 20px;
              font-weight: 800;
              color: #2C1810;
              margin: 0;
            }
            .sub-brand {
              font-size: 10px;
              font-weight: 700;
              color: #8B5E3C;
              letter-spacing: 2px;
              margin: 2px 0 16px 0;
            }
            .table-badge {
              font-family: 'Outfit', sans-serif;
              font-size: 26px;
              font-weight: 800;
              color: #2C1810;
              margin: 0;
            }
            .floor {
              font-size: 11px;
              font-weight: 600;
              color: #6F492E;
              margin: 4px 0 16px 0;
            }
            .qr-wrapper {
              background: white;
              padding: 12px;
              border-radius: 16px;
              display: inline-block;
              border: 1px solid #D4A373;
              margin-bottom: 12px;
            }
            .scan-text {
              font-size: 12px;
              font-weight: 800;
              color: #8B5E3C;
              margin: 0;
            }
            .url-text {
              font-size: 8px;
              color: #9CA3AF;
              font-family: monospace;
              margin-top: 6px;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1 class="brand">DINESYNC</h1>
            <p class="sub-brand">SMART DINING</p>
            <h2 class="table-badge">Table ${table.tableNumber}</h2>
            <p class="floor">${table.floor} • Capacity: ${table.capacity} Persons</p>
            <div class="qr-wrapper">
              <img src="${qrDataUrl}" width="200" height="200" alt="Table QR" />
            </div>
            <p class="scan-text">Scan to View Menu & Order</p>
            <p class="url-text">${qrUrl}</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleRegenerateClick = async () => {
    if (
      !window.confirm(
        `Are you sure you want to regenerate the QR code for Table ${table.tableNumber}? Any existing physical printouts of this table QR will be permanently revoked.`
      )
    ) {
      return;
    }

    try {
      setRegenerating(true);
      await api.post(`/tables/${table._id}/qr/regenerate`);
      if (onRegenerate) onRegenerate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to regenerate QR code.');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#D4A373]/30 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <span className="font-[#Outfit] text-xl font-extrabold text-[#2C1810]">
            Table {table.tableNumber}
          </span>
          <p className="text-[11px] text-[#8B5E3C] font-semibold">{table.floor}</p>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            table.status === 'Occupied'
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          }`}
        >
          {table.status} ({table.capacity} Seats)
        </span>
      </div>

      {/* QR Canvas Display */}
      <div className="flex flex-col items-center justify-center p-3 bg-[#FAF7F2] rounded-2xl border border-[#D4A373]/20">
        <div ref={qrRef} className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-inner">
          <QRCodeCanvas
            value={qrUrl}
            size={140}
            level="M"
            includeMargin={true}
          />
        </div>
        <span className="text-[10px] text-gray-500 font-mono mt-2 truncate max-w-[200px]">
          /menu/t/{table.qrToken ? table.qrToken.slice(0, 10) + '...' : table.tableNumber}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={() => onView && onView(table, qrUrl)}
          className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#8B5E3C] hover:text-white text-[#8B5E3C] text-xs font-bold border border-[#D4A373]/30 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
        >
          <Eye className="w-3.5 h-3.5" /> Preview Card & Test Link
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDownload}
            className="py-2 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#8B5E3C] hover:text-white text-[#8B5E3C] text-xs font-bold border border-[#D4A373]/30 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> PNG Label
          </button>
          <button
            onClick={handlePrint}
            className="py-2 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#2C1810] hover:text-white text-[#2C1810] text-xs font-bold border border-[#D4A373]/30 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>

        <button
          onClick={handleRegenerateClick}
          disabled={regenerating}
          className="w-full py-1.5 rounded-xl text-[11px] font-semibold text-gray-500 hover:text-red-700 hover:bg-red-50 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          title="Revoke and issue a new secure QR token"
        >
          <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
          <span>{regenerating ? 'Regenerating...' : 'Revoke & Issue New QR Token'}</span>
        </button>
      </div>
    </div>
  );
};

export default TableQRCode;
