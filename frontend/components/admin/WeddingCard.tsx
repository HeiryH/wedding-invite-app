'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { tierLabel } from '@/lib/tierRank';

interface WeddingCardData {
  eventId: number;
  name1: string | null;
  name2: string | null;
  displayName: string;
  slug: string;
  eventType: string;
  eventDate: string;
  venue: string;
  templateName?: string | null;
  isActive: boolean;
  totalAttending: number;
  totalGuests: number;
  ownerTier?: string;
}

interface WeddingCardProps {
  wedding: WeddingCardData;
  onManage: (id: number) => void;
  onPreview: (slug: string, eventType: string) => void;
  onToggleActive: (id: number, current: boolean) => void;
  onDelete: (id: number, slug: string) => void;
  onExport: (id: number, slug: string) => void;
}

function getStatus(w: WeddingCardData): 'upcoming' | 'live' | 'draft' {
  if (!w.isActive) return 'draft';
  if (new Date(w.eventDate) > new Date()) return 'upcoming';
  return 'live';
}

function daysTo(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

const RAIL: Record<string, string> = {
  upcoming: 'var(--brand)',
  live: 'var(--success)',
  draft: 'var(--border-default)',
};

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  upcoming: { bg: 'var(--brand-subtle)',   color: 'var(--brand)' },
  live:     { bg: '#e5f1ea',               color: 'var(--success)' },
  draft:    { bg: 'var(--surface-sunken)', color: 'var(--text-subtle)' },
};

const STATUS_LABEL: Record<string, string> = { upcoming: 'Upcoming', live: 'Live', draft: 'Draft' };

const TIER_COLOR: Record<string, { bg: string; color: string }> = {
  BASIC:    { bg: 'var(--surface-sunken)',                                 color: 'var(--text-muted)' },
  PREMIUM: { bg: 'color-mix(in srgb, var(--accent) 14%, transparent)',    color: 'var(--accent-deep)' },
  PRO:     { bg: 'color-mix(in srgb, var(--brand) 10%, transparent)',     color: 'var(--brand)' },
};

export default function WeddingCard({ wedding, onManage, onPreview, onToggleActive, onDelete, onExport }: WeddingCardProps) {
  const status = getStatus(wedding);
  const days = daysTo(wedding.eventDate);
  const date = new Date(wedding.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const sc = STATUS_COLOR[status];
  const tier = (wedding.ownerTier ?? 'BASIC').toUpperCase();
  const tc = TIER_COLOR[tier] ?? TIER_COLOR.BASIC;

  return (
    <article
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        display: 'flex',
        transition: 'border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand-border)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
      onClick={() => onManage(wedding.eventId)}
    >
      {/* Left rail */}
      <div style={{ width: 4, flexShrink: 0, background: RAIL[status] }} />

      {/* Body */}
      <div style={{ padding: '16px 16px 14px', flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Top row: names + status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, lineHeight: 1.1, letterSpacing: 'var(--tracking-tight)', color: 'var(--text-strong)' }}>
              {wedding.displayName}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-subtle)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              /{wedding.slug}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 6 }}>
              {wedding.templateName && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--brand-subtle)', padding: '3px 8px', borderRadius: 'var(--radius-full)', fontSize: 11, color: 'var(--brand)', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>
                  <Icon name="design-nib" size={11} /> {wedding.templateName}
                </div>
              )}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: tc.bg, padding: '3px 8px', borderRadius: 'var(--radius-full)', fontSize: 11, color: tc.color, fontFamily: 'var(--font-ui)', fontWeight: 600, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase' }}>
                <Icon name="star" size={11} /> {tierLabel[tier] ?? tier}
              </div>
            </div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 'var(--radius-full)', fontSize: 10, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', fontWeight: 600, flexShrink: 0, fontFamily: 'var(--font-ui)', background: sc.bg, color: sc.color }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
            {STATUS_LABEL[status]}
          </span>
        </div>

        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 12, color: 'var(--text-body)', fontFamily: 'var(--font-ui)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <Icon name="calendar" size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{date}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <Icon name="map-pin" size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wedding.venue}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="user-plus" size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span>{wedding.totalAttending} attending</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="check-circle" size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span>{wedding.totalGuests} RSVPs</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: '1px dashed var(--border-subtle)' }}>
          <div style={{ flex: '1 1 auto', fontSize: 12, fontFamily: 'var(--font-ui)' }}>
            {status === 'upcoming' && days > 0 && (
              <span style={{ color: 'var(--text-body)' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--text-strong)', marginRight: 4 }}>{days}</span>days to go
              </span>
            )}
            {status === 'live' && <span style={{ color: 'var(--success)', fontWeight: 500 }}>Live now</span>}
            {status === 'draft' && <span style={{ color: 'var(--text-subtle)' }}>Not published</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onPreview(wedding.slug, wedding.eventType)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-ui)', background: 'var(--surface-card)', border: '1px solid var(--border-default)', color: 'var(--text-body)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'var(--transition-control)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand-border)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            >
              <Icon name="external-link" size={12} /> Visit
            </button>
            {/* Activate/Export/Delete live behind one kebab: four inline buttons overflowed the
                card on a phone (and crowded it on desktop), and a one-click Delete sitting next to
                Export is its own hazard. */}
            <CardMenu
              isActive={wedding.isActive}
              onToggleActive={() => onToggleActive(wedding.eventId, wedding.isActive)}
              onExport={() => onExport(wedding.eventId, wedding.slug)}
              onDelete={() => onDelete(wedding.eventId, wedding.slug)}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

/** The card's overflow menu — activate/deactivate, export, delete. */
function CardMenu({ isActive, onToggleActive, onExport, onDelete }: {
  isActive: boolean;
  onToggleActive: () => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="More actions"
        aria-expanded={open}
        title="More actions"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 30, height: 30, borderRadius: 'var(--radius-md)',
          background: open ? 'var(--surface-sunken)' : 'var(--surface-card)',
          border: '1px solid var(--border-default)', color: 'var(--text-muted)',
          cursor: 'pointer', transition: 'var(--transition-control)',
        }}
      >
        <Icon name="more-vertical" size={15} />
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', bottom: 'calc(100% + 6px)', right: 0,
            minWidth: 176, padding: 5, zIndex: 40,
            background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
          }}
        >
          <CardMenuItem icon={isActive ? 'pause' : 'play'} onClick={() => { setOpen(false); onToggleActive(); }}>
            {isActive ? 'Deactivate' : 'Activate'}
          </CardMenuItem>
          <CardMenuItem icon="download" onClick={() => { setOpen(false); onExport(); }}>
            Export data
          </CardMenuItem>
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
          <CardMenuItem icon="trash" danger onClick={() => { setOpen(false); onDelete(); }}>
            Delete
          </CardMenuItem>
        </div>
      )}
    </div>
  );
}

function CardMenuItem({ icon, danger, onClick, children }: {
  icon: string; danger?: boolean; onClick: () => void; children: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      role="menuitem"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 9, width: '100%',
        padding: '8px 11px', borderRadius: 'var(--radius-sm)',
        background: hover ? (danger ? 'color-mix(in srgb, var(--danger) 8%, transparent)' : 'var(--surface-sunken)') : 'transparent',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        color: danger ? 'var(--danger)' : 'var(--text-body)',
        fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-ui)',
        transition: 'var(--transition-control)',
      }}
    >
      <Icon name={icon} size={13} /> {children}
    </button>
  );
}
