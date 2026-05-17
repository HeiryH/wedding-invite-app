'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tableService, SeatingTable, Guest, CreateSeatingTable, UpdateSeatingTable } from '@/lib/api';
import Icon from '@/components/admin/Icon';

interface SeatingTabProps {
  weddingId: number;
  tables: SeatingTable[];
  guests: Guest[];
  onRefresh: () => void;
}

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--line-2)', borderRadius: 10,
  fontSize: 14, color: 'var(--ink)', background: 'white', outline: 'none', boxSizing: 'border-box',
};

// ── Table Form Modal ──────────────────────────────────────────────────────────
function TableModal({ weddingId, table, onClose, onSaved }: {
  weddingId: number; table: SeatingTable | null; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({ tableName: table?.tableName ?? '', capacity: table?.capacity ?? 8, sortOrder: table?.sortOrder ?? 0 });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tableName.trim()) return;
    setSaving(true);
    try {
      if (table) { await tableService.update(table.tableId, form as UpdateSeatingTable); }
      else { await tableService.create({ weddingId, ...form } as CreateSeatingTable); }
      onSaved(); onClose();
    } catch { alert('Failed to save table. Please try again.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(42,42,53,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16, backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: 'var(--floral)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 380 }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', fontFamily: 'var(--serif)', fontSize: 20, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
          {table ? 'Edit Table' : 'Add Table'}
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Table Name *</label>
            <input type="text" value={form.tableName} onChange={e => setForm({ ...form, tableName: e.target.value })}
              placeholder="e.g. Table 1, VIP Table" style={inp}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--lavender-grey)'; e.currentTarget.style.boxShadow = '0 0 0 4px var(--lavender)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-2)'; e.currentTarget.style.boxShadow = 'none'; }}
              required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Capacity</label>
              <input type="number" min={1} max={100} value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })} style={inp}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--lavender-grey)'; e.currentTarget.style.boxShadow = '0 0 0 4px var(--lavender)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-2)'; e.currentTarget.style.boxShadow = 'none'; }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Sort Order</label>
              <input type="number" min={0} value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} style={inp}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--lavender-grey)'; e.currentTarget.style.boxShadow = '0 0 0 4px var(--lavender)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-2)'; e.currentTarget.style.boxShadow = 'none'; }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px 14px', background: 'var(--lavender-grey-ink)', color: 'var(--floral)', border: 'none', borderRadius: 12, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px 14px', background: 'white', color: 'var(--ink)', border: '1px solid var(--line-2)', borderRadius: 12, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Assign Guest Modal ────────────────────────────────────────────────────────
function AssignGuestModal({ table, unassignedGuests, onClose, onAssigned }: {
  table: SeatingTable; unassignedGuests: Guest[]; onClose: () => void; onAssigned: () => void;
}) {
  const [selectedGuestId, setSelectedGuestId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const attendingUnassigned = unassignedGuests.filter(g => g.isAttending);

  const handleAssign = async () => {
    if (!selectedGuestId) return;
    setSaving(true);
    try { await tableService.assignGuest(table.tableId, selectedGuestId as number); onAssigned(); onClose(); }
    catch { alert('Failed to assign guest. Please try again.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(42,42,53,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16, backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: 'var(--floral)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 380 }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', fontFamily: 'var(--serif)', fontSize: 20, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
          Assign to {table.tableName}
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {attendingUnassigned.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '16px 0' }}>No unassigned attending guests available.</p>
          ) : (
            <select value={selectedGuestId} onChange={e => setSelectedGuestId(e.target.value ? parseInt(e.target.value) : '')}
              style={inp}>
              <option value="">Select a guest…</option>
              {attendingUnassigned.map(g => (
                <option key={g.guestId} value={g.guestId}>
                  {g.guestName} ({g.numberOfAttendees} {g.numberOfAttendees === 1 ? 'person' : 'people'})
                </option>
              ))}
            </select>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleAssign} disabled={saving || !selectedGuestId}
              style={{ flex: 1, padding: '10px 14px', background: 'var(--lavender-grey-ink)', color: 'var(--floral)', border: 'none', borderRadius: 12, fontSize: 13.5, fontWeight: 500, cursor: !selectedGuestId || saving ? 'not-allowed' : 'pointer', opacity: !selectedGuestId || saving ? 0.5 : 1 }}>
              {saving ? 'Assigning…' : 'Assign'}
            </button>
            <button onClick={onClose} style={{ flex: 1, padding: '10px 14px', background: 'white', color: 'var(--ink)', border: '1px solid var(--line-2)', borderRadius: 12, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>
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

  const assignedGuestIds = new Set(tables.flatMap(t => t.guests.map(g => g.guestId)));
  const unassignedGuests = guests.filter(g => !assignedGuestIds.has(g.guestId));
  const unassignedAttending = unassignedGuests.filter(g => g.isAttending);
  const totalCapacity = tables.reduce((s, t) => s + t.capacity, 0);
  const totalSeated = tables.reduce((s, t) => s + t.guestCount, 0);

  const handleDeleteTable = async (tableId: number) => {
    if (!confirm('Delete this table? Assigned guests will become unassigned.')) return;
    try { await tableService.delete(tableId); onRefresh(); }
    catch { alert('Failed to delete table.'); }
  };

  const handleUnassignGuest = async (guestId: number) => {
    try { await tableService.unassignGuest(guestId); onRefresh(); }
    catch { alert('Failed to unassign guest.'); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

      {/* Stats + Add button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }} className="sm:flex-row sm:items-center sm:justify-between">
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Tables', value: tables.length, color: 'var(--ink)' },
            { label: 'Seated', value: totalSeated, color: 'var(--lavender-grey-ink)' },
            { label: 'Capacity', value: totalCapacity, color: 'var(--muted)' },
            { label: 'Unassigned', value: unassignedAttending.length, color: unassignedAttending.length > 0 ? 'var(--warn)' : 'var(--muted)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--serif)', fontSize: 28, lineHeight: 1, color: s.color, margin: 0, letterSpacing: '-0.01em' }}>{s.value}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => { setEditingTable(null); setShowTableModal(true); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', background: 'var(--lavender-grey-ink)', color: 'var(--floral)', border: 'none', borderRadius: 12, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}
        >
          <Icon name="plus" size={15} /> Add Table
        </button>
      </div>

      {/* Tables grid */}
      {tables.length === 0 ? (
        <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--muted)', border: '1px dashed var(--line-2)', borderRadius: 12, background: 'var(--floral)', marginBottom: 16 }}>
          <Icon name="group" size={28} style={{ color: 'var(--thistle)', display: 'block', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 4px', fontWeight: 500 }}>No tables yet</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Add tables to start assigning guests to seats.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" style={{ marginBottom: 16 }}>
          {tables.map(table => {
            const isFull = table.guestCount >= table.capacity;
            return (
              <motion.div key={table.tableId} layout
                style={{ background: 'var(--floral)', border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{table.tableName}</h3>
                    <span style={{
                      display: 'inline-block', fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999,
                      background: isFull ? 'var(--thistle-soft)' : '#e8f5ec',
                      color: isFull ? 'var(--danger)' : 'var(--success)',
                      border: `1px solid ${isFull ? 'var(--thistle)' : '#b2d8bb'}`,
                    }}>
                      {table.guestCount} / {table.capacity} seats
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => { setEditingTable(table); setShowTableModal(true); }}
                      style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,.8)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--lavender-grey-deep)' }}
                      title="Edit table">
                      <Icon name="settings" size={13} />
                    </button>
                    <button onClick={() => handleDeleteTable(table.tableId)}
                      style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,.8)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--danger)' }}
                      title="Delete table">
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 36 }}>
                  {table.guests.length === 0 ? (
                    <p style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>No guests assigned yet</p>
                  ) : (
                    table.guests.map(g => (
                      <div key={g.guestId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderRadius: 8, padding: '6px 10px', border: '1px solid var(--line)' }}>
                        <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{g.guestName}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>×{g.numberOfAttendees}</span>
                          <button onClick={() => handleUnassignGuest(g.guestId)}
                            style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '2px 4px', borderRadius: 4 }}
                            title="Remove from table"
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; }}>
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {!isFull && (
                  <button
                    onClick={() => setAssigningTable(table)}
                    style={{ marginTop: 10, width: '100%', padding: '7px', border: '1.5px dashed var(--lavender-deep)', background: 'transparent', color: 'var(--lavender-grey-deep)', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Icon name="plus" size={12} /> Assign Guest
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Unassigned attending guests */}
      {unassignedAttending.length > 0 && (
        <div style={{ background: 'var(--veil)', border: '1px solid var(--veil-deep)', borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Unassigned ({unassignedAttending.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {unassignedAttending.map(g => (
              <span key={g.guestId} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,.7)', border: '1px solid rgba(255,255,255,.9)', color: 'var(--lavender-grey-ink)', fontSize: 12.5, padding: '4px 10px', borderRadius: 999, fontWeight: 500 }}>
                {g.guestName}
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>×{g.numberOfAttendees}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showTableModal && <TableModal weddingId={weddingId} table={editingTable} onClose={() => setShowTableModal(false)} onSaved={onRefresh} />}
        {assigningTable && <AssignGuestModal table={assigningTable} unassignedGuests={unassignedGuests} onClose={() => setAssigningTable(null)} onAssigned={onRefresh} />}
      </AnimatePresence>
    </motion.div>
  );
}
