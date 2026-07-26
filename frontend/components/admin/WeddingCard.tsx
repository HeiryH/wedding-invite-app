'use client';

import Icon from './Icon';

interface WeddingCardData {
  weddingId: number;
  brideName: string;
  groomName: string;
  coupleName: string;
  weddingDate: string;
  venue: string;
  templateName?: string;
  isActive: boolean;
  totalAttending: number;
  totalGuests: number;
}

interface WeddingCardProps {
  wedding: WeddingCardData;
  onManage: (id: number) => void;
  onPreview: (coupleName: string) => void;
  onToggleActive: (id: number, current: boolean) => void;
  onDelete: (id: number, coupleName: string) => void;
  onExport: (id: number, coupleName: string) => void;
}

function getStatus(w: WeddingCardData): 'upcoming' | 'live' | 'draft' {
  if (!w.isActive) return 'draft';
  if (new Date(w.weddingDate) > new Date()) return 'upcoming';
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

export default function WeddingCard({ wedding, onManage, onPreview, onToggleActive, onDelete, onExport }: WeddingCardProps) {
  const status = getStatus(wedding);
  const days = daysTo(wedding.weddingDate);
  const date = new Date(wedding.weddingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const sc = STATUS_COLOR[status];

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
      onClick={() => onManage(wedding.weddingId)}
    >
      {/* Left rail */}
      <div style={{ width: 4, flexShrink: 0, background: RAIL[status] }} />

      {/* Body */}
      <div style={{ padding: '16px 16px 14px', flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Top row: names + status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, lineHeight: 1.1, letterSpacing: 'var(--tracking-tight)', color: 'var(--text-strong)' }}>
              {wedding.brideName}{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--text-muted)', margin: '0 3px' }}>&amp;</span>
              {' '}{wedding.groomName}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-subtle)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              /{wedding.coupleName}
            </div>
            {wedding.templateName && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, background: 'var(--brand-subtle)', padding: '3px 8px', borderRadius: 'var(--radius-full)', fontSize: 11, color: 'var(--brand)', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>
                <Icon name="design-nib" size={11} /> {wedding.templateName}
              </div>
            )}
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
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onPreview(wedding.coupleName)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-ui)', background: 'var(--surface-card)', border: '1px solid var(--border-default)', color: 'var(--text-body)', cursor: 'pointer', transition: 'var(--transition-control)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand-border)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            >
              <Icon name="external-link" size={12} /> Visit Website
            </button>
            <button
              onClick={() => onToggleActive(wedding.weddingId, wedding.isActive)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-ui)', background: wedding.isActive ? 'var(--surface-sunken)' : '#e5f1ea', color: wedding.isActive ? 'var(--text-subtle)' : 'var(--success)', border: '1px solid var(--border-default)', cursor: 'pointer', transition: 'var(--transition-control)' }}
            >
              <Icon name={wedding.isActive ? 'pause' : 'play'} size={12} />
              {wedding.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={() => onExport(wedding.weddingId, wedding.coupleName)}
              style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 8px', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: '1px solid var(--border-default)', color: 'var(--text-subtle)', cursor: 'pointer', transition: 'background var(--dur-fast) var(--ease-standard)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-sunken)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-card)')}
              aria-label="Export data"
              title="Export data"
            >
              <Icon name="download" size={12} />
            </button>
            <button
              onClick={() => onDelete(wedding.weddingId, wedding.coupleName)}
              style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 8px', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: '1px solid var(--border-default)', color: 'var(--danger)', cursor: 'pointer', transition: 'background var(--dur-fast) var(--ease-standard)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--danger) 8%, transparent)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-card)')}
              aria-label="Delete"
            >
              <Icon name="trash" size={12} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
