import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { Users, Layers, AlertCircle, CheckCircle2, Clock, Lock, QrCode } from 'lucide-react';

const TableSelector = ({ selectedTable, onSelectTable, isQrLocked }) => {
  const [tables, setTables] = useState({ 'Ground Floor': [], 'First Floor': [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();

    const socket = getSocket();
    if (socket) {
      socket.on('tableStatusUpdated', (updatedTable) => {
        setTables((prev) => {
          const newGrouped = { ...prev };
          Object.keys(newGrouped).forEach((floor) => {
            newGrouped[floor] = newGrouped[floor].map((t) =>
              t._id === updatedTable._id || t.tableNumber === updatedTable.tableNumber
                ? updatedTable
                : t
            );
          });
          return newGrouped;
        });
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
      if (res.data && res.data.grouped) {
        setTables(res.data.grouped);
      }
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-xs text-gray-400 font-semibold animate-pulse">
        Loading café table layout...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {isQrLocked && selectedTable && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
          <span className="flex items-center gap-1.5 font-bold">
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            Table {selectedTable.tableNumber} is locked from QR Code Scan
          </span>
          <span className="text-[10px] bg-amber-200/60 px-2 py-0.5 rounded-md font-extrabold uppercase">
            QR Active
          </span>
        </div>
      )}

      {Object.entries(tables).map(([floorName, floorTables]) => (
        <div key={floorName} className="space-y-3">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-1.5">
            <Layers className="w-4 h-4 text-[#8B5E3C]" />
            <h4 className="font-[#Outfit] font-bold text-xs text-[#2C1810] uppercase tracking-wider">
              {floorName}
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {floorTables.map((table) => {
              const isSelected = selectedTable && (selectedTable._id === table._id || selectedTable.tableNumber === table.tableNumber);
              const isAvailable = table.status === 'Available';
              const isDisabled = isQrLocked ? !isSelected : !isAvailable;

              return (
                <button
                  type="button"
                  key={table._id}
                  disabled={isDisabled}
                  onClick={() => !isQrLocked && onSelectTable(table)}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#2C1810] text-[#FAEDCD] border-[#8B5E3C] ring-2 ring-[#8B5E3C] shadow-md scale-102 cursor-default'
                      : isAvailable
                      ? isQrLocked
                        ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                        : 'bg-white text-[#2C1810] border-[#D4A373]/30 hover:border-[#8B5E3C] hover:bg-[#FAEDCD]/30 shadow-2xs cursor-pointer'
                      : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-[#Outfit] font-extrabold text-sm">
                      Table {table.tableNumber}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-[#8B5E3C] text-white'
                          : isAvailable
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {table.status}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-1 text-[11px] font-medium opacity-90">
                    <Users className="w-3 h-3 text-[#D4A373]" />
                    <span>Max {table.capacity} Persons</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TableSelector;

