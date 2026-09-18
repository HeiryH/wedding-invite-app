'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { templateService, Template } from '@/lib/api';
import { TemplateDeck } from '@/components/marketing/TemplateDeck';
import { TemplateGrid } from '@/components/marketing/TemplateGrid';
import { Wordmark } from '@/components/marketing/Wordmark';
import { EVENT_TYPES, EventTypeKey, matchesEvent } from '@/lib/eventTypes';

type TierKey = 'BASIC' | 'PREMIUM' | 'PRO';
type TierFilter = 'ALL' | TierKey;
type View = 'cards' | 'grid';

const TIERS: Array<{ key: TierFilter; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'BASIC', label: 'Basic' },
  { key: 'PREMIUM', label: 'Premium' },
  { key: 'PRO', label: 'Pro' },
];

function parseTier(raw: string | null): TierFilter {
  const u = (raw ?? '').toUpperCase();
  return u === 'BASIC' || u === 'PREMIUM' || u === 'PRO' ? u : 'ALL';
}

// Same breakpoint as `.pers-form` in globals.css — above it the page is a desktop layout.
const DESKTOP_MQ = '(min-width: 769px)';
function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return desktop;
}

const pillStyle = (on: boolean, size: 'lg' | 'sm'): React.CSSProperties => ({
  flex: size === 'lg' ? 1 : 'none', fontFamily: 'var(--mkt-sans)', fontWeight: 500,
  fontSize: size === 'lg' ? 17 : 14, padding: size === 'lg' ? '13px 4px' : '8px 16px',
  borderRadius: 999, border: '2px solid var(--mkt-ink)', cursor: 'pointer',
  background: on ? 'var(--mkt-gold)' : 'var(--mkt-sand)', color: 'var(--mkt-ink)',
  boxShadow: on ? `0 ${size === 'lg' ? 5 : 3}px 0 rgba(23,19,13,.2)` : `0 ${size === 'lg' ? 3 : 2}px 0 rgba(23,19,13,.1)`,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
});

function PickerInner() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventTypeKey>('WEDDING');
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useIsDesktop();

  // Deep-linkable from the pricing cards: /personalise/picker?tier=PRO&view=grid
  const [tier, setTier] = useState<TierFilter>(() => parseTier(searchParams.get('tier')));
  const [mobileView, setMobileView] = useState<View>(() => (searchParams.get('view') === 'grid' ? 'grid' : 'cards'));
  // Desktop always shows the grid; the swipe deck is a phone affordance.
  const view: View = isDesktop ? 'grid' : mobileView;

  useEffect(() => {
    templateService.getActive()
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const byEvent = useMemo(() => templates.filter((t) => matchesEvent(t, event)), [templates, event]);
  const shown = useMemo(
    () => (tier === 'ALL' ? byEvent : byEvent.filter((t) => (t.tier ?? 'BASIC').toUpperCase() === tier)),
    [byEvent, tier],
  );

  const use = (t: Template) => {
    router.push(`/personalise?template=${t.templateId}&event=${event}`);
  };

  const tierLabel = TIERS.find((x) => x.key === tier)?.label ?? '';
  const eventLabel = EVENT_TYPES.find((e) => e.key === event)?.label ?? '';

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
      <div style={{ display: 'flex', gap: 10, padding: '14px 18px 6px', maxWidth: 460, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {EVENT_TYPES.map((ev) => {
          const on = event === ev.key;
          return (
            <button key={ev.key} onClick={() => setEvent(ev.key)} style={pillStyle(on, 'lg')}>
              {ev.label}
            </button>
          );
        })}
      </div>

      {/* Tier filter */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 18px 0', justifyContent: 'center', flexWrap: 'wrap' }}>
        {TIERS.map((t) => {
          const on = tier === t.key;
          return (
            <button key={t.key} onClick={() => setTier(t.key)} style={pillStyle(on, 'sm')} aria-pressed={on}>
              {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '18px 0 4px' }}>
        <div style={{ textAlign: 'center', fontFamily: 'var(--mkt-sans)', fontWeight: 600, fontSize: 24 }}>Pick Your Template</div>
        {/* Mobile-only cards ↔ grid toggle (desktop is always a grid). */}
        {!isDesktop && (
          <button
            type="button"
            onClick={() => setMobileView((v) => (v === 'cards' ? 'grid' : 'cards'))}
            aria-label={mobileView === 'cards' ? 'Show as grid' : 'Show as cards'}
            title={mobileView === 'cards' ? 'Show as grid' : 'Show as cards'}
            style={{ width: 40, height: 40, borderRadius: 999, border: '2px solid var(--mkt-ink)', background: 'var(--mkt-card)', boxShadow: '0 3px 0 rgba(23,19,13,.14)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mkt-ink)', flex: 'none' }}
          >
            {mobileView === 'cards' ? (
              // grid icon
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            ) : (
              // stacked cards icon
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="6" y="5" width="12" height="16" rx="2.5" />
                <path d="M3 8v10M21 8v10" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Deck / grid */}
      <div style={{ flex: 1, display: 'flex', alignItems: view === 'grid' ? 'flex-start' : 'center', justifyContent: 'center', padding: '10px 0' }}>
        {loading ? (
          <div style={{ fontFamily: 'var(--mkt-sans)', color: 'var(--mkt-muted)', fontSize: 15 }}>Loading designs…</div>
        ) : shown.length === 0 ? (
          <div className="mkt-card" style={{ maxWidth: 320, margin: '0 20px', padding: 26, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--mkt-serif)', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
              No {tier !== 'ALL' ? `${tierLabel} ` : ''}{eventLabel} designs yet
            </div>
            <p style={{ fontFamily: 'var(--mkt-sans)', fontSize: 14, color: 'var(--mkt-muted)', margin: '0 0 18px', lineHeight: 1.5 }}>
              {tier !== 'ALL' && byEvent.length > 0
                ? 'Try another tier, or browse every design for this event.'
                : 'More designs for this event are on the way. In the meantime, take a look at our wedding collection.'}
            </p>
            {tier !== 'ALL' && byEvent.length > 0 ? (
              <button onClick={() => setTier('ALL')} className="mkt-btn" style={{ fontSize: 15, padding: '11px 22px' }}>
                Show all tiers
              </button>
            ) : (
              <button onClick={() => { setEvent('WEDDING'); setTier('ALL'); }} className="mkt-btn" style={{ fontSize: 15, padding: '11px 22px' }}>
                Browse wedding designs
              </button>
            )}
          </div>
        ) : view === 'grid' ? (
          <TemplateGrid templates={shown} onUse={use} />
        ) : (
          <TemplateDeck templates={shown} onUse={use} />
        )}
      </div>

      <div style={{ textAlign: 'center', fontFamily: 'var(--mkt-sans)', fontSize: 14, color: 'var(--mkt-muted)', padding: '6px 0 30px' }}>
        {view === 'grid' ? 'Tap a design to select it' : '← Swipe to browse · Tap a card to select →'}
      </div>
    </div>
  );
}

export default function PickerPage() {
  return (
    <Suspense>
      <PickerInner />
    </Suspense>
  );
}
