'use client';

import { useEffect, useRef, useState } from 'react';
import { TemplatePreview } from '@/components/templates/TemplatePreview';
import type { Template } from '@/lib/api';

const CARD_ASPECT = '39 / 70';
const FLY_MS = 260;
const SNAP_MS = 320;
const FLY_EASE = 'cubic-bezier(.32,.72,.35,1)';
const SNAP_EASE = 'cubic-bezier(.22,1.1,.36,1)';
const TAP_DIST = 12;
const TAP_MS = 250;
const COMMIT_FRACTION = 0.28; // of card width
const COMMIT_VELOCITY = 0.5; // px/ms

const ROLE_BASE: Record<'top' | 'mid' | 'back', { transform: string; z: number }> = {
  top: { transform: 'translate(0,0) rotate(0deg) scale(1)', z: 3 },
  mid: { transform: 'translate(16px,-12px) rotate(4deg) scale(.95)', z: 2 },
  back: { transform: 'translate(-16px,-22px) rotate(-4deg) scale(.9)', z: 1 },
};

const cardBoxStyle: React.CSSProperties = {
  position: 'absolute', inset: 0, borderRadius: 24, overflow: 'hidden',
  border: '3px solid var(--mkt-ink)', boxShadow: '0 16px 30px rgba(23,19,13,.24)',
  background: 'var(--mkt-card)',
};

// Swipeable card deck. The top card's drag follows the finger via direct DOM
// mutation (no re-render per pointermove); a released swipe spawns a short-lived
// "ghost" that continues flying off-screen while `order` cycles instantly
// underneath, so the promoted card never visibly slides back into place.
export function TemplateDeck({
  templates,
  onUse,
}: {
  templates: Template[];
  onUse: (t: Template) => void;
}) {
  const [order, setOrder] = useState<number[]>([]);
  const [selected, setSelected] = useState(false);
  const [ghost, setGhost] = useState<{ template: Template; startTransform: string; dir: 1 | -1 } | null>(null);

  const boxRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, x: 0, y: 0, startX: 0, startY: 0, startT: 0, lastX: 0, lastT: 0, vx: 0, width: 240 });

  useEffect(() => {
    setOrder(templates.map((_, i) => i));
    setSelected(false);
    setGhost(null);
  }, [templates]);

  if (templates.length === 0 || order.length === 0) return null;

  const n = Math.min(templates.length, 3);
  const roles: Array<'top' | 'mid' | 'back'> = ['top', 'mid', 'back'].slice(0, n) as Array<'top' | 'mid' | 'back'>;
  const cards = roles.map((role, i) => ({ role, t: templates[order[i % order.length]] }));
  const top = cards.find((c) => c.role === 'top')!.t;
  // Swipe-to-next only makes sense with >1 card, but tap-to-select must still work with exactly
  // one (e.g. a PARTY/CEREMONY deck showing its single template) — gating `down` itself on
  // `canDrag` used to swallow the pointerdown entirely for one-card decks, so the tap-detection
  // logic in `up()` never even ran and the card could never be selected. `canDrag` still governs
  // the drag-follow affordance/cursor and (via the `templates.length > 1` check already in `up`)
  // whether a swipe actually commits to the next card.
  const canDrag = templates.length > 1 && !selected;
  const canSelect = !selected;

  const applyTopTransform = (transform: string, opacity: number, transition: string) => {
    const el = topRef.current;
    if (!el) return;
    el.style.transition = transition;
    el.style.transform = transform;
    el.style.opacity = String(opacity);
  };

  const down = (e: React.PointerEvent) => {
    if (!canSelect) return;
    const d = drag.current;
    d.active = true; d.x = 0; d.y = 0;
    d.startX = e.clientX; d.startY = e.clientY; d.startT = performance.now();
    d.lastX = e.clientX; d.lastT = d.startT; d.vx = 0;
    d.width = boxRef.current?.offsetWidth ?? 240;
    applyTopTransform(ROLE_BASE.top.transform, 1, 'none');
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    d.x = e.clientX - d.startX;
    d.y = e.clientY - d.startY;
    const now = performance.now();
    const dt = now - d.lastT;
    if (dt > 0) d.vx = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX; d.lastT = now;

    const rotate = Math.max(-14, Math.min(14, d.x / 22));
    const opacity = Math.max(0.4, 1 - Math.abs(d.x) / 520);
    applyTopTransform(`translate(${d.x}px, ${d.y * 0.4}px) rotate(${rotate}deg)`, opacity, 'none');
  };

  const commitSwipe = (dirSign: 1 | -1) => {
    const d = drag.current;
    const dist = Math.abs(d.x) + Math.abs(d.y);
    // Continue from wherever the finger left off, not from the base position.
    const rotate = Math.max(-14, Math.min(14, d.x / 22));
    const startTransform = dist > 0
      ? `translate(${d.x}px, ${d.y * 0.4}px) rotate(${rotate}deg)`
      : ROLE_BASE.top.transform;

    setGhost({ template: top, startTransform, dir: dirSign });

    // Reset the real "top" slot to its resting transform with no transition
    // *before* the content swap below, so React's re-render is a no-op visually.
    applyTopTransform(ROLE_BASE.top.transform, 1, 'none');
    setOrder((o) => [...o.slice(1), o[0]]);
  };

  const up = () => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    const dist = Math.abs(d.x) + Math.abs(d.y);
    const duration = performance.now() - d.startT;

    const swiped = Math.abs(d.x) > d.width * COMMIT_FRACTION || Math.abs(d.vx) > COMMIT_VELOCITY;

    if (dist < TAP_DIST && duration < TAP_MS) {
      applyTopTransform(ROLE_BASE.top.transform, 1, 'none');
      setSelected(true);
      return;
    }
    if (swiped && templates.length > 1) {
      commitSwipe(d.x >= 0 ? 1 : -1);
      return;
    }
    // Snap back.
    applyTopTransform(ROLE_BASE.top.transform, 1, `transform ${SNAP_MS}ms ${SNAP_EASE}`);
  };

  return (
    <div ref={boxRef} style={{ position: 'relative', width: 'min(240px, 62vw)', aspectRatio: CARD_ASPECT, margin: '0 auto' }}>
      {cards.map(({ role, t }) => {
        const base = ROLE_BASE[role];
        const isTop = role === 'top';
        const opacity = selected && !isTop ? 0.3 : 1;
        return (
          <div
            key={role}
            ref={isTop ? topRef : undefined}
            onPointerDown={isTop ? down : undefined}
            onPointerMove={isTop ? move : undefined}
            onPointerUp={isTop ? up : undefined}
            onPointerCancel={isTop ? up : undefined}
            style={{
              position: 'absolute', inset: 0, zIndex: base.z,
              transform: base.transform, opacity,
              transition: 'opacity .35s ease',
              cursor: isTop && canDrag ? 'grab' : 'default', touchAction: 'pan-y',
            }}
          >
            <div style={cardBoxStyle}>
              <TemplatePreview templateCode={t.templateCode} thumbnailUrl={t.thumbnailUrl} aspect={CARD_ASPECT} />
            </div>
          </div>
        );
      })}

      {ghost && (
        <GhostCard
          template={ghost.template}
          startTransform={ghost.startTransform}
          dir={ghost.dir}
          onDone={() => setGhost(null)}
        />
      )}

      {selected && (
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 9 }}>
          <div style={{ animation: 'mkt-pop .3s ease both' }}>
            <button onClick={() => onUse(top)} className="mkt-btn mkt-btn-dark" style={{ fontSize: 16, padding: '13px 24px', whiteSpace: 'nowrap', boxShadow: '0 8px 22px rgba(23,19,13,.35)' }}>
              Use this template
            </button>
          </div>
        </div>
      )}

      {selected && (
        <button
          onClick={() => setSelected(false)}
          aria-label="Browse other templates"
          style={{ position: 'absolute', inset: 0, zIndex: 8, background: 'transparent', border: 'none', cursor: 'pointer' }}
        />
      )}
    </div>
  );
}

function GhostCard({
  template,
  startTransform,
  dir,
  onDone,
}: {
  template: Template;
  startTransform: string;
  dir: 1 | -1;
  onDone: () => void;
}) {
  const [flown, setFlown] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setFlown(true));
    const timeout = setTimeout(onDone, FLY_MS + 40);
    return () => { cancelAnimationFrame(raf); clearTimeout(timeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endTransform = `translate(${dir * 160}%, ${dir * -12}%) rotate(${dir * 22}deg)`;

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 5,
        transform: flown ? endTransform : startTransform,
        opacity: flown ? 0 : 1,
        transition: `transform ${FLY_MS}ms ${FLY_EASE}, opacity ${FLY_MS}ms ${FLY_EASE}`,
        pointerEvents: 'none',
      }}
    >
      <div style={cardBoxStyle}>
        <TemplatePreview templateCode={template.templateCode} thumbnailUrl={template.thumbnailUrl} aspect={CARD_ASPECT} />
      </div>
    </div>
  );
}
