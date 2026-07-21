'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const LINKS = [
  { label: 'Home', id: 'top' },
  { label: 'Features', id: 'features' },
  { label: 'Pricing', id: 'pricing' },
  { label: 'Stories', id: 'stories' },
  { label: 'About', id: 'about' },
];

// Floating circular hamburger (matching the comp) — no full nav bar. Opens a
// menu panel; links smooth-scroll to on-page sections, or navigate to /home#id
// from other pages.
export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const go = (id: string) => {
    setOpen(false);
    const onHome = pathname === '/home' || pathname === '/';
    if (onHome) {
      if (id === 'top') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      router.push(id === 'top' ? '/home' : `/home#${id}`);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        style={{
          position: 'fixed', top: 20, left: 20, zIndex: 60,
          width: 56, height: 56, borderRadius: 999,
          border: '2.5px solid var(--mkt-ink)', background: 'var(--mkt-card)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          boxShadow: '0 6px 14px rgba(23,19,13,.14)',
        }}
      >
        {open ? (
          <span style={{ fontSize: 24, lineHeight: 1, color: 'var(--mkt-ink)' }}>✕</span>
        ) : (
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 24 }}>
            <span style={{ height: 2.5, background: 'var(--mkt-ink)', borderRadius: 2 }} />
            <span style={{ height: 2.5, background: 'var(--mkt-ink)', borderRadius: 2 }} />
            <span style={{ height: 2.5, background: 'var(--mkt-ink)', borderRadius: 2 }} />
          </span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'rgba(23,19,13,.04)' }} />
          <div
            style={{
              position: 'fixed', top: 86, left: 20, zIndex: 60, width: 220,
              background: 'var(--mkt-card)', border: '2.5px solid var(--mkt-ink)', borderRadius: 22,
              padding: '14px 8px', boxShadow: '0 20px 40px rgba(23,19,13,.22)', animation: 'mkt-menuIn .22s ease both',
            }}
          >
            {LINKS.map((l) => (
              <button
                key={l.id}
                onClick={() => go(l.id)}
                style={{ display: 'block', width: '100%', textAlign: 'left', fontFamily: 'var(--mkt-sans)', fontWeight: 500, fontSize: 22, color: 'var(--mkt-ink)', background: 'none', border: 'none', padding: '10px 16px', cursor: 'pointer', borderRadius: 12 }}
              >
                {l.label}
              </button>
            ))}
            <button
              onClick={() => { setOpen(false); router.push('/personalise/picker'); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', fontFamily: 'var(--mkt-sans)', fontWeight: 600, fontSize: 22, color: 'var(--mkt-gold)', background: 'none', border: 'none', padding: '10px 16px', cursor: 'pointer', borderRadius: 12 }}
            >
              Try For Free
            </button>
          </div>
        </>
      )}
    </>
  );
}
