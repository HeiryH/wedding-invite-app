'use client';

import { useEffect, useRef } from 'react';
import { TemplatePreview } from '@/components/templates/TemplatePreview';
import type { Template } from '@/lib/api';

const TIER_LABEL: Record<string, string> = { FREE: 'Free', PREMIUM: 'Premium', PRO: 'Pro' };

// Auto-scrolling, drag-scrubbable marquee of the real template previews.
// Ported from the comp's rAF marquee; the card list is duplicated so the
// translateX loop is seamless.
export function TemplateMarquee({ templates }: { templates: Template[] }) {
  const vpRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const state = useRef({ pos: 0, speed: 0.4, dragging: false, lastX: 0, raf: 0 });

  useEffect(() => {
    const track = trackRef.current;
    if (!track || templates.length === 0) return;
    const s = state.current;

    const loop = () => {
      const half = (track.scrollWidth / 2) || 1;
      if (!s.dragging) s.pos += s.speed;
      if (s.pos >= half) s.pos -= half;
      if (s.pos < 0) s.pos += half;
      track.style.transform = `translateX(${-s.pos}px)`;
      s.raf = requestAnimationFrame(loop);
    };
    s.raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(s.raf);
  }, [templates]);

  const down = (e: React.PointerEvent) => {
    const s = state.current;
    s.dragging = true; s.lastX = e.clientX;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };
  const move = (e: React.PointerEvent) => {
    const s = state.current;
    if (!s.dragging) return;
    s.pos -= (e.clientX - s.lastX); s.lastX = e.clientX;
  };
  const up = () => { state.current.dragging = false; };

  // duplicate for a seamless loop
  const cards = [...templates, ...templates];

  return (
    <div
      ref={vpRef}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      style={{ position: 'relative', overflow: 'hidden', touchAction: 'pan-y', cursor: 'grab', width: '100%', maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)' }}
    >
      <div ref={trackRef} style={{ display: 'flex', gap: 22, alignItems: 'center', padding: '4px 22px', willChange: 'transform' }}>
        {cards.map((t, i) => (
          <div key={`${t.templateId}-${i}`} style={{ flex: 'none', width: 200 }}>
            <div style={{ borderRadius: 22, overflow: 'hidden', border: '3px solid var(--mkt-ink)', boxShadow: '0 16px 30px rgba(23,19,13,.24)' }}>
              <TemplatePreview templateCode={t.templateCode} thumbnailUrl={t.thumbnailUrl} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <span style={{ fontFamily: 'var(--mkt-serif)', fontWeight: 600, fontSize: 16, color: 'var(--mkt-ink)' }}>{t.templateName}</span>
              <span style={{ fontFamily: 'var(--mkt-sans)', fontWeight: 600, fontSize: 11, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--mkt-gold-ink)', border: '1.5px solid var(--mkt-gold)', borderRadius: 999, padding: '2px 8px' }}>
                {TIER_LABEL[t.tier?.toUpperCase() ?? 'FREE'] ?? t.tier}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
