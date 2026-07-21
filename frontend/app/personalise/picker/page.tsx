'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { templateService, Template } from '@/lib/api';
import { TemplateDeck } from '@/components/marketing/TemplateDeck';
import { Wordmark } from '@/components/marketing/Wordmark';

const EVENTS = ['Ceremony', 'Wedding', 'Party'] as const;
type EventType = (typeof EVENTS)[number];

export default function PickerPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [event, setEvent] = useState<EventType>('Wedding');
  const router = useRouter();

  useEffect(() => {
    templateService.getActive().then(setTemplates).catch(() => {});
  }, []);

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
        {EVENTS.map((ev) => {
          const on = event === ev;
          return (
            <button
              key={ev}
              onClick={() => setEvent(ev)}
              style={{
                flex: 1, fontFamily: 'var(--mkt-sans)', fontWeight: 500, fontSize: 17, padding: '13px 4px',
                borderRadius: 999, border: '2px solid var(--mkt-ink)', cursor: 'pointer',
                background: on ? 'var(--mkt-gold)' : 'var(--mkt-sand)', color: 'var(--mkt-ink)',
                boxShadow: on ? '0 5px 0 rgba(23,19,13,.2)' : '0 3px 0 rgba(23,19,13,.1)',
              }}
            >
              {ev}
            </button>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', fontFamily: 'var(--mkt-sans)', fontWeight: 600, fontSize: 24, padding: '18px 0 4px' }}>Pick Your Template</div>

      {/* Deck */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
        <TemplateDeck templates={templates} onUse={use} />
      </div>

      <div style={{ textAlign: 'center', fontFamily: 'var(--mkt-sans)', fontSize: 14, color: 'var(--mkt-muted)', padding: '6px 0 30px' }}>
        ← Swipe to browse · Tap a card to select →
      </div>
    </div>
  );
}
