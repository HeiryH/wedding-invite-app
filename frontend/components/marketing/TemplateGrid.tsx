'use client';

import { useState } from 'react';
import { TemplatePreview } from '@/components/templates/TemplatePreview';
import type { Template } from '@/lib/api';

const TIER_LABEL: Record<string, string> = { BASIC: 'Basic', PREMIUM: 'Premium', PRO: 'Pro' };
const CARD_ASPECT = '39 / 70';

// Grid alternative to the swipeable TemplateDeck: every template at once, in marketing-styled
// cards. Tapping a card selects it (highlighted + "Use this template"), tapping again deselects;
// the Use button hands off to the caller exactly like the deck does.
export function TemplateGrid({
  templates,
  onUse,
}: {
  templates: Template[];
  onUse: (t: Template) => void;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <div
      style={{
        width: '100%', maxWidth: 1100, margin: '0 auto', padding: '4px 18px 24px',
        display: 'grid', gap: 22,
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(150px, 42vw), 1fr))',
        boxSizing: 'border-box',
      }}
    >
      {templates.map((t) => {
        const selected = selectedId === t.templateId;
        return (
          <div key={t.templateId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => setSelectedId(selected ? null : t.templateId)}
              aria-pressed={selected}
              aria-label={`${t.templateName} — ${TIER_LABEL[t.tier?.toUpperCase() ?? 'BASIC'] ?? t.tier}`}
              style={{
                position: 'relative', width: '100%', aspectRatio: CARD_ASPECT, padding: 0,
                borderRadius: 22, overflow: 'hidden', cursor: 'pointer', background: 'var(--mkt-card)',
                border: `3px solid ${selected ? 'var(--mkt-gold)' : 'var(--mkt-ink)'}`,
                boxShadow: selected ? '0 0 0 4px rgba(226,162,60,.35), 0 16px 30px rgba(23,19,13,.24)' : '0 10px 22px rgba(23,19,13,.18)',
                transform: selected ? 'translateY(-4px)' : 'none',
                transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
              }}
            >
              <TemplatePreview templateCode={t.templateCode} thumbnailUrl={t.thumbnailUrl} aspect={CARD_ASPECT} />
              {selected && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(23,19,13,.18)' }}>
                  <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); onUse(t); }}
                    className="mkt-btn mkt-btn-dark"
                    style={{ display: 'inline-block', fontSize: 15, padding: '12px 20px', whiteSpace: 'nowrap', animation: 'mkt-pop .3s ease both', boxShadow: '0 8px 22px rgba(23,19,13,.35)' }}
                  >
                    Use this template
                  </span>
                </div>
              )}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', textAlign: 'center' }}>
              <span style={{ fontFamily: 'var(--mkt-serif)', fontWeight: 600, fontSize: 15, color: 'var(--mkt-ink)' }}>{t.templateName}</span>
              <span style={{ flexShrink: 0, fontFamily: 'var(--mkt-sans)', fontWeight: 600, fontSize: 11, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--mkt-gold-ink)', border: '1.5px solid var(--mkt-gold)', borderRadius: 999, padding: '2px 8px' }}>
                {TIER_LABEL[t.tier?.toUpperCase() ?? 'BASIC'] ?? t.tier}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
