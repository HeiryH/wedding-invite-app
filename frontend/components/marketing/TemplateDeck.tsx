'use client';

import { useEffect, useRef, useState } from 'react';
import { TemplatePreview } from '@/components/templates/TemplatePreview';
import type { Template } from '@/lib/api';

// Swipeable 3-card deck (ported from the comp). Drag the top card to browse,
// tap it to select. On select, a "Use this template" CTA pops.
export function TemplateDeck({
  templates,
  onUse,
}: {
  templates: Template[];
  onUse: (t: Template) => void;
}) {
  // order[0] = top card. Templates load async, so keep the order list in sync
  // with the arriving list (a lazy useState initialiser would run only once,
  // while templates was still empty).
  const [order, setOrder] = useState<number[]>([]);
  const [selected, setSelected] = useState(false);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const start = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setOrder(templates.map((_, i) => i));
    setSelected(false);
  }, [templates]);

  if (templates.length === 0 || order.length === 0) return null;

  const top = templates[order[0]];
  const mid = templates[order[1 % order.length]];
  const back = templates[order[2 % order.length]];
  if (!top || !mid || !back) return null;

  const down = (e: React.PointerEvent) => {
    if (selected) return;
    start.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, active: true });
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };
  const move = (e: React.PointerEvent) => {
    if (!drag.active) return;
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y, active: true });
  };
  const up = () => {
    if (!drag.active) return;
    const { x, y } = drag;
    const dist = Math.abs(x) + Math.abs(y);
    if (Math.abs(x) > 110) {
      // cycle: send top to back
      setOrder((o) => [...o.slice(1), o[0]]);
      setDrag({ x: 0, y: 0, active: false });
    } else if (dist < 10) {
      setSelected(true);
      setDrag({ x: 0, y: 0, active: false });
    } else {
      setDrag({ x: 0, y: 0, active: false });
    }
  };

  const cardBox: React.CSSProperties = {
    position: 'absolute', inset: 0, borderRadius: 24, overflow: 'hidden',
    border: '3px solid var(--mkt-ink)', boxShadow: '0 16px 30px rgba(23,19,13,.24)',
    background: 'var(--mkt-card)',
  };

  const layers = [
    { t: back, z: 1, base: 'translate(-16px,-22px) rotate(-4deg) scale(.9)', op: selected ? 0.3 : 1, drag: false, key: 'back' },
    { t: mid, z: 2, base: 'translate(16px,-12px) rotate(4deg) scale(.95)', op: selected ? 0.3 : 1, drag: false, key: 'mid' },
    { t: top, z: 3, base: 'translate(0,0) rotate(0deg) scale(1)', op: 1, drag: true, key: 'top' },
  ];

  return (
    <div style={{ position: 'relative', width: 240, height: 420, margin: '0 auto' }}>
      {layers.map((l) => {
        const isTopDragging = l.drag && drag.active;
        const transform = isTopDragging
          ? `translate(${drag.x}px, ${drag.y * 0.4}px) rotate(${drag.x / 18}deg)`
          : l.base;
        const opacity = isTopDragging ? Math.max(0.35, 1 - Math.abs(drag.x) / 520) : l.op;
        return (
          <div
            key={l.key}
            onPointerDown={l.drag ? down : undefined}
            onPointerMove={l.drag ? move : undefined}
            onPointerUp={l.drag ? up : undefined}
            onPointerCancel={l.drag ? up : undefined}
            style={{
              position: 'absolute', inset: 0, zIndex: l.z, transform, opacity,
              transition: isTopDragging ? 'none' : 'transform .5s cubic-bezier(.2,.8,.2,1), opacity .35s ease',
              cursor: l.drag && !selected ? 'grab' : 'default', touchAction: 'pan-y',
            }}
          >
            <div style={cardBox}>
              <TemplatePreview templateCode={l.t.templateCode} thumbnailUrl={l.t.thumbnailUrl} />
            </div>
          </div>
        );
      })}

      {selected && (
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 9, animation: 'mkt-pop .3s ease both' }}>
          <button onClick={() => onUse(top)} className="mkt-btn mkt-btn-dark" style={{ fontSize: 18, padding: '15px 30px', whiteSpace: 'nowrap', boxShadow: '0 8px 22px rgba(23,19,13,.35)' }}>
            Use this template
          </button>
        </div>
      )}

      {/* tap-to-deselect hint zone */}
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
