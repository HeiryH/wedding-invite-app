'use client';

import { motion } from 'framer-motion';
import { Wish } from '@/lib/api';
import Icon from '@/components/admin/Icon';

interface WishesTabProps {
  wishes: Wish[];
  onDelete: (wishId: number) => void;
  onExport: () => void;
}

export default function WishesTab({ wishes, onDelete, onExport }: WishesTabProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
          {wishes.length} message{wishes.length !== 1 ? 's' : ''} received
        </p>
        <button
          onClick={onExport}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'white', color: 'var(--ink-2)', border: '1px solid var(--line-2)', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          <Icon name="copy" size={14} /> Export CSV
        </button>
      </div>

      {wishes.length === 0 ? (
        <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13, border: '1px dashed var(--line-2)', borderRadius: 12, background: 'var(--floral)' }}>
          No wishes yet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...wishes]
            .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
            .map(wish => (
              <div
                key={wish.wishId}
                style={{
                  position: 'relative', padding: '14px 16px',
                  background: 'var(--lavender)', borderRadius: 12,
                  borderLeft: '3px solid var(--lavender-deep)',
                  border: '1px solid var(--lavender-deep)',
                }}
                className="group"
              >
                <button
                  onClick={() => onDelete(wish.wishId)}
                  style={{ position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: 8, background: 'rgba(255,255,255,.6)', border: '1px solid rgba(255,255,255,.8)', display: 'grid', placeItems: 'center', cursor: 'pointer', opacity: 0, transition: 'opacity .15s ease', color: 'var(--danger)' }}
                  className="group-hover:opacity-100"
                  title="Delete wish"
                >
                  <Icon name="trash" size={13} />
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, paddingRight: 28 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{wish.guestName}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {new Date(wish.createdDate).toLocaleDateString()}
                  </p>
                </div>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>"{wish.message}"</p>
              </div>
            ))}
        </div>
      )}
    </motion.div>
  );
}
