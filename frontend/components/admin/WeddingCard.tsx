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
}

function getStatus(w: WeddingCardData): 'upcoming' | 'active' | 'inactive' {
  if (!w.isActive) return 'inactive';
  if (new Date(w.weddingDate) > new Date()) return 'upcoming';
  return 'active';
}

function daysTo(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

const STATUS_LABEL: Record<string, string> = { upcoming: 'Upcoming', active: 'Live', inactive: 'Draft' };

const RAIL_STYLE: Record<string, React.CSSProperties> = {
  upcoming: { background: 'linear-gradient(180deg, var(--lavender-deep), var(--lavender-grey))' },
  active:   { background: 'linear-gradient(180deg, var(--veil-deep), var(--lavender-grey-deep))' },
  inactive: { background: 'var(--thistle)', opacity: 0.6 },
};

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  upcoming: { background: 'var(--lavender)', color: 'var(--lavender-grey-ink)' },
  active:   { background: '#e5f1ea', color: 'var(--success)' },
  inactive: { background: 'var(--floral-deep)', color: 'var(--muted)' },
};

export default function WeddingCard({ wedding, onManage, onPreview, onToggleActive, onDelete }: WeddingCardProps) {
  const status = getStatus(wedding);
  const days = daysTo(wedding.weddingDate);
  const date = new Date(wedding.weddingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <article
      style={{
        background: 'white',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        display: 'flex',
        transition: 'border-color .15s ease, box-shadow .15s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--thistle)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
      onClick={() => onManage(wedding.weddingId)}
    >
      {/* Left rail */}
      <div style={{ width: 5, flexShrink: 0, ...RAIL_STYLE[status] }} />

      {/* Body */}
      <div style={{ padding: '16px 16px 14px', flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Top row: names + status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 20, lineHeight: 1.1, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
              {wedding.brideName}{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--lavender-grey)', margin: '0 3px' }}>&amp;</span>
              {' '}{wedding.groomName}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              /{wedding.coupleName}
            </div>
            {wedding.templateName && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, background: 'var(--lavender)', padding: '3px 8px', borderRadius: 999, fontSize: 11.5, color: 'var(--lavender-grey-deep)' }}>
                <Icon name="design-nib" size={12} /> {wedding.templateName}
              </div>
            )}
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 999, fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500, flexShrink: 0, ...STATUS_STYLE[status] }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
            {STATUS_LABEL[status]}
          </span>
        </div>

        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 12.5, color: 'var(--ink-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <Icon name="calendar" size={14} style={{ color: 'var(--lavender-grey)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{date}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <Icon name="map-pin" size={14} style={{ color: 'var(--lavender-grey)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wedding.venue}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="user-plus" size={14} style={{ color: 'var(--lavender-grey)', flexShrink: 0 }} />
            <span>{wedding.totalAttending} attending</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="check-circle" size={14} style={{ color: 'var(--lavender-grey)', flexShrink: 0 }} />
            <span>{wedding.totalGuests} RSVPs</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: '1px dashed var(--line)' }}>
          <div style={{ flex: '1 1 auto', fontSize: 12, color: 'var(--ink-2)' }}>
            {status === 'upcoming' && days > 0 && (
              <span><span style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)', marginRight: 4 }}>{days}</span>days to go</span>
            )}
            {status === 'active' && <span style={{ color: 'var(--success)', fontSize: 12 }}>Live now</span>}
            {status === 'inactive' && <span style={{ color: 'var(--muted)', fontSize: 12 }}>Not published</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onPreview(wedding.coupleName)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10, fontSize: 12.5, fontWeight: 500, background: 'white', border: '1px solid var(--line-2)', color: 'var(--ink)', cursor: 'pointer', transition: 'border-color .15s ease' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--lavender-grey)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line-2)')}
            >
              <Icon name="eye" size={13} /> Preview
            </button>
            <button
              onClick={() => onToggleActive(wedding.weddingId, wedding.isActive)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 10, fontSize: 12.5, fontWeight: 500, background: wedding.isActive ? 'var(--floral-deep)' : '#e5f1ea', color: wedding.isActive ? 'var(--muted)' : 'var(--success)', border: '1px solid var(--line-2)', cursor: 'pointer' }}
            >
              <Icon name={wedding.isActive ? 'pause' : 'play'} size={13} />
              {wedding.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={() => onDelete(wedding.weddingId, wedding.coupleName)}
              style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 8px', borderRadius: 10, background: 'white', border: '1px solid var(--line-2)', color: 'var(--danger)', cursor: 'pointer', transition: 'background .15s ease' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f5e6e6')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
              aria-label="Delete"
            >
              <Icon name="trash" size={13} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
