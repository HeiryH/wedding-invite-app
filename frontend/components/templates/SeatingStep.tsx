'use client';

import { motion } from 'framer-motion';
import { SeatingTable } from '@/lib/api';

interface SeatingStepProps {
  tables: SeatingTable[];
  numberOfAttendees: number;
  selectedTableId: number | null;
  onSelect: (tableId: number) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  // Optional theme colors (defaults to rose)
  accentClass?: string;
  accentBorderClass?: string;
}

export default function SeatingStep({
  tables,
  numberOfAttendees,
  selectedTableId,
  onSelect,
  onBack,
  onSubmit,
  submitting,
  accentClass = 'bg-gradient-to-r from-rose-500 to-pink-500',
  accentBorderClass = 'border-rose-500 bg-rose-50',
}: SeatingStepProps) {
  const availableSeats = (table: SeatingTable) => table.capacity - table.guestCount;
  const canFit = (table: SeatingTable) => availableSeats(table) >= numberOfAttendees;
  const isFull = (table: SeatingTable) => table.guestCount >= table.capacity;

  const availableTables = tables.filter(canFit);

  return (
    <motion.div
      key="step2"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">Step 2 of 2</p>
        <h3 className="text-2xl font-bold text-gray-800">Choose Your Table 🪑</h3>
        <p className="text-gray-500 text-sm mt-1">
          Showing tables that can seat your party of{' '}
          <span className="font-semibold text-gray-700">{numberOfAttendees}</span>.
        </p>
      </div>

      {/* Table grid */}
      {tables.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">🪑</p>
          <p>No tables have been set up yet. Your seat will be assigned by the couple.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {tables.map((table) => {
            const fits = canFit(table);
            const full = isFull(table);
            const avail = availableSeats(table);
            const isSelected = selectedTableId === table.tableId;

            return (
              <motion.button
                key={table.tableId}
                type="button"
                whileHover={fits ? { scale: 1.03 } : {}}
                whileTap={fits ? { scale: 0.97 } : {}}
                onClick={() => fits && onSelect(table.tableId)}
                disabled={!fits}
                className={`relative rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                  !fits
                    ? 'opacity-40 cursor-not-allowed border-gray-200 bg-gray-50'
                    : isSelected
                    ? `${accentBorderClass} border-2 shadow-md`
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm cursor-pointer'
                }`}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center"
                  >
                    <span className="text-white text-xs">✓</span>
                  </motion.div>
                )}

                <p className="font-bold text-gray-800 text-sm leading-tight pr-5">{table.tableName}</p>

                {/* Capacity bar */}
                <div className="mt-2 mb-1">
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        full ? 'bg-red-400' : isSelected ? 'bg-rose-500' : 'bg-green-400'
                      }`}
                      style={{ width: `${Math.min((table.guestCount / table.capacity) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <p className={`text-xs font-medium ${full ? 'text-red-500' : !fits ? 'text-amber-500' : 'text-gray-500'}`}>
                  {full
                    ? 'Full'
                    : !fits
                    ? `Only ${avail} seat${avail !== 1 ? 's' : ''} left`
                    : `${avail} seat${avail !== 1 ? 's' : ''} available`}
                </p>
              </motion.button>
            );
          })}
        </div>
      )}

      {availableTables.length === 0 && tables.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 text-center">
          No tables have enough space for your party of {numberOfAttendees}. The couple will assign your seats.
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <motion.button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          whileHover={!submitting ? { scale: 1.02 } : {}}
          whileTap={!submitting ? { scale: 0.98 } : {}}
          className={`flex-1 py-3 rounded-xl font-semibold text-white transition-all ${
            submitting ? 'bg-gray-400 cursor-not-allowed' : accentClass + ' hover:shadow-lg'
          }`}
        >
          {submitting ? 'Submitting…' : 'Submit RSVP 💌'}
        </motion.button>
      </div>
    </motion.div>
  );
}
