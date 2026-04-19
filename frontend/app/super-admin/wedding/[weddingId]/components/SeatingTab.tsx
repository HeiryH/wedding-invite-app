'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tableService, SeatingTable, Guest, CreateSeatingTable, UpdateSeatingTable } from '@/lib/api';

interface SeatingTabProps {
  weddingId: number;
  tables: SeatingTable[];
  guests: Guest[];
  onRefresh: () => void;
}

// ── Table Form Modal ──────────────────────────────────────────────────────────
function TableModal({
  weddingId,
  table,
  onClose,
  onSaved,
}: {
  weddingId: number;
  table: SeatingTable | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    tableName: table?.tableName ?? '',
    capacity: table?.capacity ?? 8,
    sortOrder: table?.sortOrder ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tableName.trim()) return;
    setSaving(true);
    try {
      if (table) {
        await tableService.update(table.tableId, form as UpdateSeatingTable);
      } else {
        await tableService.create({ weddingId, ...form } as CreateSeatingTable);
      }
      onSaved();
      onClose();
    } catch {
      alert('Failed to save table. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            {table ? 'Edit Table' : 'Add Table'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Table Name *</label>
            <input
              type="text"
              value={form.tableName}
              onChange={(e) => setForm({ ...form, tableName: e.target.value })}
              placeholder="e.g. Table 1, VIP Table, Family Table"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 focus:outline-none text-black"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 focus:outline-none text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 focus:outline-none text-black"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-rose-500 text-white rounded-lg font-medium text-sm hover:bg-rose-600 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Assign Guest Modal ────────────────────────────────────────────────────────
function AssignGuestModal({
  table,
  unassignedGuests,
  onClose,
  onAssigned,
}: {
  table: SeatingTable;
  unassignedGuests: Guest[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [selectedGuestId, setSelectedGuestId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);

  const attendingUnassigned = unassignedGuests.filter((g) => g.isAttending);

  const handleAssign = async () => {
    if (!selectedGuestId) return;
    setSaving(true);
    try {
      await tableService.assignGuest(table.tableId, selectedGuestId as number);
      onAssigned();
      onClose();
    } catch {
      alert('Failed to assign guest. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Assign Guest to {table.tableName}</h2>
        </div>
        <div className="p-6 space-y-4">
          {attendingUnassigned.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No unassigned attending guests available.
            </p>
          ) : (
            <select
              value={selectedGuestId}
              onChange={(e) => setSelectedGuestId(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 focus:outline-none text-black"
            >
              <option value="">Select a guest…</option>
              {attendingUnassigned.map((g) => (
                <option key={g.guestId} value={g.guestId}>
                  {g.guestName} ({g.numberOfAttendees} {g.numberOfAttendees === 1 ? 'person' : 'people'})
                </option>
              ))}
            </select>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleAssign}
              disabled={saving || !selectedGuestId}
              className="flex-1 py-2.5 bg-rose-500 text-white rounded-lg font-medium text-sm hover:bg-rose-600 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Assigning…' : 'Assign'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main SeatingTab ───────────────────────────────────────────────────────────
export default function SeatingTab({ weddingId, tables, guests, onRefresh }: SeatingTabProps) {
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState<SeatingTable | null>(null);
  const [assigningTable, setAssigningTable] = useState<SeatingTable | null>(null);

  const assignedGuestIds = new Set(tables.flatMap((t) => t.guests.map((g) => g.guestId)));
  const unassignedGuests = guests.filter((g) => !assignedGuestIds.has(g.guestId));
  const unassignedAttending = unassignedGuests.filter((g) => g.isAttending);

  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
  const totalSeated = tables.reduce((sum, t) => sum + t.guestCount, 0);

  const handleDeleteTable = async (tableId: number) => {
    if (!confirm('Delete this table? Assigned guests will become unassigned.')) return;
    try {
      await tableService.delete(tableId);
      onRefresh();
    } catch {
      alert('Failed to delete table.');
    }
  };

  const handleUnassignGuest = async (guestId: number) => {
    try {
      await tableService.unassignGuest(guestId);
      onRefresh();
    } catch {
      alert('Failed to unassign guest.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header stats + Add button */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{tables.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Tables</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-rose-600">{totalSeated}</p>
              <p className="text-xs text-gray-500 mt-0.5">Seated</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">{totalCapacity}</p>
              <p className="text-xs text-gray-500 mt-0.5">Capacity</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">{unassignedAttending.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Unassigned</p>
            </div>
          </div>
          <button
            onClick={() => { setEditingTable(null); setShowTableModal(true); }}
            className="px-4 py-2 bg-rose-500 text-white rounded-lg font-medium text-sm hover:bg-rose-600 transition-colors"
          >
            + Add Table
          </button>
        </div>
      </div>

      {/* Tables grid */}
      {tables.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-4xl mb-3">🪑</p>
          <p className="text-gray-500 font-medium">No tables yet</p>
          <p className="text-gray-400 text-sm mt-1">Add tables to start assigning guests to seats.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {tables.map((table) => {
            const isFull = table.guestCount >= table.capacity;
            return (
              <motion.div
                key={table.tableId}
                layout
                className="bg-white rounded-xl shadow-md p-5"
              >
                {/* Table header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800">{table.tableName}</h3>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${
                      isFull
                        ? 'bg-red-100 text-red-600'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {table.guestCount} / {table.capacity} seats
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingTable(table); setShowTableModal(true); }}
                      className="p-1.5 text-gray-400 hover:text-blue-500 rounded transition-colors"
                      title="Edit table"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteTable(table.tableId)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                      title="Delete table"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Assigned guests */}
                <div className="space-y-1.5 min-h-[40px]">
                  {table.guests.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No guests assigned yet</p>
                  ) : (
                    table.guests.map((g) => (
                      <div key={g.guestId} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5">
                        <span className="text-sm text-gray-700 font-medium">{g.guestName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">×{g.numberOfAttendees}</span>
                          <button
                            onClick={() => handleUnassignGuest(g.guestId)}
                            className="text-gray-300 hover:text-red-400 text-xs transition-colors leading-none"
                            title="Remove from table"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Assign guest button */}
                {!isFull && (
                  <button
                    onClick={() => setAssigningTable(table)}
                    className="mt-3 w-full py-1.5 border-2 border-dashed border-rose-200 text-rose-400 rounded-lg text-xs font-medium hover:border-rose-400 hover:text-rose-500 transition-colors"
                  >
                    + Assign Guest
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Unassigned attending guests */}
      {unassignedAttending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="font-semibold text-amber-800 mb-3">
            Unassigned Guests ({unassignedAttending.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {unassignedAttending.map((g) => (
              <span
                key={g.guestId}
                className="inline-flex items-center gap-1 bg-white border border-amber-200 text-amber-700 text-sm px-3 py-1 rounded-full"
              >
                {g.guestName}
                <span className="text-amber-400 text-xs">×{g.numberOfAttendees}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showTableModal && (
          <TableModal
            weddingId={weddingId}
            table={editingTable}
            onClose={() => setShowTableModal(false)}
            onSaved={onRefresh}
          />
        )}
        {assigningTable && (
          <AssignGuestModal
            table={assigningTable}
            unassignedGuests={unassignedGuests}
            onClose={() => setAssigningTable(null)}
            onAssigned={onRefresh}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
