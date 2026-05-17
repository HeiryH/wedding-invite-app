'use client';

import Icon from '@/components/admin/Icon';

const KNOWN_ICONS = new Set([
  'home-simple','calendar','map-pin','user-plus','check-circle','heart','eye','more-horiz',
  'search','filter','bell','menu','nav-arrow-left','nav-arrow-right','design-nib','gift',
  'lock-square','share-android','plus','trash','settings','sparks','group','puzzle','cast-out',
  'user-circle','clock','xmark-circle','arrow-up','sort','copy','pause','play','share-android',
]);

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: string;
  tint?: 1 | 2 | 3;
  color?: string;
}

export default function StatCard({ title, value, subtitle, icon, tint }: StatCardProps) {
  const tintStyle: React.CSSProperties = tint === 1
    ? { background: 'linear-gradient(170deg, var(--lavender) 0%, white 90%)', borderColor: 'var(--lavender-deep)' }
    : tint === 2
    ? { background: 'linear-gradient(170deg, var(--veil) 0%, white 90%)', borderColor: 'var(--veil-deep)' }
    : tint === 3
    ? { background: 'linear-gradient(170deg, var(--thistle-soft) 0%, white 90%)', borderColor: 'var(--thistle)' }
    : {};

  const isIconName = KNOWN_ICONS.has(icon);

  return (
    <div style={{
      background: 'white',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-md)',
      padding: 16,
      position: 'relative',
      overflow: 'hidden',
      ...tintStyle,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {isIconName ? <Icon name={icon} size={13} /> : <span style={{ fontSize: 13 }}>{icon}</span>}
        {title}
      </div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 38, lineHeight: 1, marginTop: 10, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
        {value}
        {subtitle && <span style={{ fontSize: 16, fontFamily: 'var(--sans)', color: 'var(--ink-2)', marginLeft: 6 }}>{subtitle}</span>}
      </div>
      <div style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 10, background: 'rgba(255,255,255,.7)', display: 'grid', placeItems: 'center', color: 'var(--lavender-grey-deep)', border: '1px solid rgba(255,255,255,.9)', fontSize: 14 }}>
        {isIconName ? <Icon name={icon} size={15} /> : icon}
      </div>
    </div>
  );
}
