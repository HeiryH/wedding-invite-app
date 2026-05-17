'use client';

import { motion } from 'framer-motion';
import { Guest } from '@/lib/api';
import Icon from '@/components/admin/Icon';

interface GuestsTabProps {
  guests: Guest[];
  allGuests: Guest[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterSide: 'All' | 'Bride' | 'Groom';
  setFilterSide: (value: 'All' | 'Bride' | 'Groom') => void;
  filterAttending: 'All' | 'Yes' | 'No';
  setFilterAttending: (value: 'All' | 'Yes' | 'No') => void;
  onDelete: (guestId: number) => void;
  onEdit?: (guest: Guest) => void;
  onExport: () => void;
}

const sel: React.CSSProperties = {
  padding: '9px 12px', border: '1px solid var(--line-2)', borderRadius: 10,
  fontSize: 13.5, color: 'var(--ink)', background: 'white', outline: 'none',
  width: '100%', boxSizing: 'border-box',
};

export default function GuestsTab({
  guests, allGuests, searchTerm, setSearchTerm,
  filterSide, setFilterSide, filterAttending, setFilterAttending,
  onDelete, onEdit, onExport,
}: GuestsTabProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }} className="md:flex-row md:items-center">
        <div style={{ position: 'relative', flex: '1 1 auto' }}>
          <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}>
            <Icon name="search" size={16} />
          </div>
          <input
            type="text"
            placeholder="Search guests…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ ...sel, paddingLeft: 34 }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--lavender-grey)'; e.currentTarget.style.boxShadow = '0 0 0 4px var(--lavender)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-2)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={filterSide} onChange={e => setFilterSide(e.target.value as any)}
            style={{ ...sel, width: 'auto', paddingRight: 28 }}>
            <option value="All">All sides</option>
            <option value="Bride">Bride's side</option>
            <option value="Groom">Groom's side</option>
          </select>
          <select value={filterAttending} onChange={e => setFilterAttending(e.target.value as any)}
            style={{ ...sel, width: 'auto', paddingRight: 28 }}>
            <option value="All">All status</option>
            <option value="Yes">Attending</option>
            <option value="No">Not attending</option>
          </select>
          <button onClick={onExport}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'white', color: 'var(--ink-2)', border: '1px solid var(--line-2)', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Icon name="copy" size={14} /> Export CSV
          </button>
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 12px' }}>
        Showing {guests.length} of {allGuests.length} guests
      </p>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--line)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
          <thead>
            <tr style={{ background: 'var(--floral)', borderBottom: '1px solid var(--line)' }}>
              {['Name', 'Contact', 'Side', 'Status', 'No.', 'Song', ''].map(h => (
                <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guests.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  No guests found
                </td>
              </tr>
            ) : (
              guests.map(guest => (
                <tr key={guest.guestId}
                  style={{ borderBottom: '1px solid var(--line)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--floral)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; }}>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', margin: 0 }}>{guest.guestName}</p>
                    {guest.respondedDate && <p style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 0' }}>{new Date(guest.respondedDate).toLocaleDateString()}</p>}
                  </td>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0 }}>{guest.email || '—'}</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>{guest.phoneNumber || ''}</p>
                  </td>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      display: 'inline-block', fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 999,
                      background: guest.brideOrGroomSide === 'Bride' ? 'var(--lavender)' : 'var(--veil)',
                      color: 'var(--lavender-grey-ink)',
                      border: `1px solid ${guest.brideOrGroomSide === 'Bride' ? 'var(--lavender-deep)' : 'var(--veil-deep)'}`,
                    }}>
                      {guest.brideOrGroomSide}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      display: 'inline-block', fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 999,
                      background: guest.isAttending ? '#e8f5ec' : 'var(--thistle-soft)',
                      color: guest.isAttending ? 'var(--success)' : 'var(--muted)',
                      border: `1px solid ${guest.isAttending ? '#b2d8bb' : 'var(--thistle)'}`,
                    }}>
                      {guest.isAttending ? 'Attending' : 'Declined'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                    {guest.numberOfAttendees}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--ink-2)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {guest.songRequest || '—'}
                  </td>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      {onEdit && (
                        <button onClick={() => onEdit(guest)}
                          style={{ padding: '5px 10px', background: 'var(--lavender)', color: 'var(--lavender-grey-ink)', border: '1px solid var(--lavender-deep)', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                          Edit
                        </button>
                      )}
                      <button onClick={() => onDelete(guest.guestId)}
                        style={{ padding: '5px 10px', background: 'var(--thistle-soft)', color: 'var(--danger)', border: '1px solid var(--thistle)', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
