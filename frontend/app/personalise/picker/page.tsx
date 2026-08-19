'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { templateService, Template } from '@/lib/api';
import { TemplateDeck } from '@/components/marketing/TemplateDeck';
import { Wordmark } from '@/components/marketing/Wordmark';
import { EVENT_TYPES, EventTypeKey, matchesEvent } from '@/lib/eventTypes';

export default function PickerPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventTypeKey>('WEDDING');
  const router = useRouter();

  useEffect(() => {
    templateService.getActive()
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const shown = useMemo(() => templates.filter((t) => matchesEvent(t, event)), [templates, event]);

  const use = (t: Template) => {
    router.push(`/personalise?template=${t.templateId}&event=${event}`);
  };

  return (
    <div className="mkt" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '18px 20px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <button
          onClick={() => router.push('/home')}
          aria-label="Back"
          style={{ position: 'absolute', left: 20, width: 42, height: 42, borderRadius: 999, border: '2px solid var(--mkt-ink)', background: 'var(--mkt-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, color: 'var(--mkt-ink)' }}
        >
          ‹
        </button>
        <Wordmark size={22} />
      </div>

      <div style={{ textAlign: 'center', fontFamily: 'var(--mkt-sans)', fontWeight: 600, fontSize: 26, padding: '14px 0 2px' }}>Pick Your Event</div>

      {/* Event tabs */}
      <div style={{ display: 'flex', gap: 10, padding: '14px 18px 6px', maxWidth: 460, width: '100%', margin: '0 auto' }}>
        {EVENT_TYPES.map((ev) => {
          const on = event === ev.key;
          const count = templates.filter((t) => matchesEvent(t, ev.key)).length;
          return (
            <button
              key={ev.key}
              onClick={() => setEvent(ev.key)}
              style={{
                flex: 1, fontFamily: 'var(--mkt-sans)', fontWeight: 500, fontSize: 17, padding: '13px 4px',
                borderRadius: 999, border: '2px solid var(--mkt-ink)', cursor: 'pointer',
                background: on ? 'var(--mkt-gold)' : 'var(--mkt-sand)', color: 'var(--mkt-ink)',
                boxShadow: on ? '0 5px 0 rgba(23,19,13,.2)' : '0 3px 0 rgba(23,19,13,.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {ev.label}
              {!loading && (
                <span style={{ fontSize: 12, opacity: 0.65 }}>({count})</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', fontFamily: 'var(--mkt-sans)', fontWeight: 600, fontSize: 24, padding: '18px 0 4px' }}>Pick Your Template</div>

      {/* Deck */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
        {loading ? (
          <div style={{ fontFamily: 'var(--mkt-sans)', color: 'var(--mkt-muted)', fontSize: 15 }}>Loading designs…</div>
        ) : shown.length === 0 ? (
          <div className="mkt-card" style={{ maxWidth: 320, margin: '0 20px', padding: 26, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--mkt-serif)', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
              No {EVENT_TYPES.find((e) => e.key === event)?.label} designs yet
            </div>
            <p style={{ fontFamily: 'var(--mkt-sans)', fontSize: 14, color: 'var(--mkt-muted)', margin: '0 0 18px', lineHeight: 1.5 }}>
              More designs for this event are on the way. In the meantime, take a look at our wedding
              collection.
            </p>
            <button onClick={() => setEvent('WEDDING')} className="mkt-btn" style={{ fontSize: 15, padding: '11px 22px' }}>
              Browse wedding designs
            </button>
          </div>
        ) : (
          <TemplateDeck templates={shown} onUse={use} />
        )}
      </div>

      <div style={{ textAlign: 'center', fontFamily: 'var(--mkt-sans)', fontSize: 14, color: 'var(--mkt-muted)', padding: '6px 0 30px' }}>
        ← Swipe to browse · Tap a card to select →
      </div>
    </div>
  );
}
