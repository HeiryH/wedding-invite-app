'use client';

import Link from 'next/link';

import { storeValue, useStoredValue } from '@/lib/useStoredValue';

const STORAGE_KEY = 'cookie-consent';

export function CookieConsent() {
  const visible = !useStoredValue(STORAGE_KEY, 'pending');
  const accept = () => storeValue(STORAGE_KEY, 'accepted');

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      style={{
        position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 9999,
        maxWidth: 560, margin: '0 auto',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12,
        padding: '14px 18px', borderRadius: 12,
        background: 'var(--surface-card, #fff)', color: 'var(--text-body, #333)',
        border: '1px solid var(--border-default, #e5e5e5)',
        boxShadow: '0 8px 30px rgba(0,0,0,.14)',
        fontFamily: 'var(--font-ui, sans-serif)', fontSize: 14, lineHeight: 1.5,
      }}
    >
      <span style={{ flex: 1, minWidth: 220 }}>
        We use essential cookies to keep you signed in and run the site. See our{' '}
        <Link href="/privacy" style={{ color: 'var(--brand, #b06)', textDecoration: 'underline' }}>Privacy Policy</Link>.
      </span>
      <button
        onClick={accept}
        style={{
          padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: 'var(--brand, #b06)', color: 'var(--brand-on, #fff)',
          fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
        }}
      >
        Got it
      </button>
    </div>
  );
}
