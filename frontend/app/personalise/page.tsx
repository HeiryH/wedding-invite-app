'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { templateService, Template, authService } from '@/lib/api';
import type { TemplateConfigField } from '@/lib/api/types';
import { getGuestFields, buildDefaultConfig, blockOf } from '@/lib/templateConfigSchema';
import { resolveSectionOrder, SectionCode } from '@/lib/templateUtils';
import { getUser } from '@/lib/auth';
import { EVENT_TYPES, EventTypeKey } from '@/lib/eventTypes';

const DRAFT_KEY = 'personalise_draft_v1';

type ItineraryRow = { label: string; detail: string; sortOrder: number };

// WEDDING: brideName + groomName. PARTY: brideName holds the honoree's single name (minimal
// plumbing disruption — see eventType-driven branching below). CEREMONY: eventTitle only.
interface WeddingDraft {
  brideName: string;
  groomName: string;
  eventTitle: string;
  weddingDate: string;
  venue: string;
  venueAddress: string;
}

interface Draft {
  templateId: number;
  event?: string;
  wedding: WeddingDraft;
  config: Record<string, string>;
  itinerary: ItineraryRow[];
}

/** Validates the picker's ?event= query param against the known vocabulary, defaulting to WEDDING
 *  — mirrors parseEventTypes' fallback behaviour elsewhere in the codebase. */
function parseEventType(raw: string | null): EventTypeKey {
  const upper = (raw ?? '').toUpperCase();
  return (EVENT_TYPES.some((e) => e.key === upper) ? upper : 'WEDDING') as EventTypeKey;
}

/** Mirrors backend EventNaming.GetDisplayName so the live preview matches what the server would
 *  compute once the event is actually created. */
function computeDisplayName(eventType: EventTypeKey, w: WeddingDraft): string {
  if (eventType === 'WEDDING' && w.brideName.trim() && w.groomName.trim()) return `${w.brideName} & ${w.groomName}`;
  if (eventType === 'PARTY' && w.brideName.trim()) return w.brideName;
  if (eventType === 'CEREMONY' && w.eventTitle.trim()) return w.eventTitle;
  if (w.eventTitle.trim()) return w.eventTitle;
  return 'Event Invitation';
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '';

const SECTION_LABELS: Record<SectionCode, string> = {
  welcome: 'Invitation',
  walimah: 'Ceremony',
  rsvp: 'RSVP',
  itinerary: 'Schedule',
  wishes: 'Wishes',
  photobooth: 'Photo Booth',
};

// ── Marketing-styled field primitives ────────────────────────────────────────
const fieldInput: React.CSSProperties = {
  width: '100%', fontFamily: 'var(--mkt-sans)', fontSize: 16, color: 'var(--mkt-ink)',
  padding: '11px 13px', border: '2px solid var(--mkt-ink)', borderRadius: 14,
  background: 'var(--mkt-card)', outline: 'none', boxSizing: 'border-box',
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: 'var(--mkt-sans)', fontSize: 13, fontWeight: 500, color: 'var(--mkt-muted)', textTransform: 'uppercase', letterSpacing: '.03em' }}>{children}</span>;
}

function MText({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <FieldLabel>{label}</FieldLabel>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={fieldInput} />
    </label>
  );
}

function MArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <FieldLabel>{label}</FieldLabel>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} style={{ ...fieldInput, resize: 'vertical', lineHeight: 1.5 }} />
    </label>
  );
}

function MToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%' }}>
      <FieldLabel>{label}</FieldLabel>
      <span style={{ flex: 'none', width: 46, height: 26, borderRadius: 999, border: '2px solid var(--mkt-ink)', background: value ? 'var(--mkt-gold)' : 'var(--mkt-sand)', position: 'relative', transition: 'background .15s' }}>
        <span style={{ position: 'absolute', top: 2, left: value ? 22 : 2, width: 18, height: 18, borderRadius: 999, background: 'var(--mkt-ink)', transition: 'left .15s' }} />
      </span>
    </button>
  );
}

function GuestField({ field, value, onChange }: { field: TemplateConfigField; value: string; onChange: (v: string) => void }) {
  if (field.fieldType === 'boolean') {
    return <MToggle label={field.label} value={value === 'true'} onChange={(v) => onChange(v ? 'true' : 'false')} />;
  }
  if (field.fieldType === 'richtext') {
    return <MArea label={field.label} value={value} onChange={onChange} />;
  }
  return <MText label={field.label} value={value} onChange={onChange} />;
}

// ── Local itinerary editor (array-backed, no network) ────────────────────────
function LocalItineraryEditor({ rows, onChange }: { rows: ItineraryRow[]; onChange: (r: ItineraryRow[]) => void }) {
  const update = (i: number, patch: Partial<ItineraryRow>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const add = () => onChange([...rows, { label: '', detail: '', sortOrder: rows.length }]);
  const remove = (i: number) => onChange(rows.filter((_, j) => j !== i).map((r, k) => ({ ...r, sortOrder: k })));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map((r, i) => (
        <div key={i} className="mkt-card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, boxShadow: 'none' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={r.label} placeholder="e.g. Akad Nikah" onChange={(e) => update(i, { label: e.target.value })} style={{ ...fieldInput, padding: '9px 11px' }} />
            <button onClick={() => remove(i)} aria-label="Remove" style={{ flex: 'none', width: 40, borderRadius: 12, border: '2px solid var(--mkt-ink)', background: 'var(--mkt-card)', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
          <input value={r.detail} placeholder="e.g. 10:00 AM · Main Hall" onChange={(e) => update(i, { detail: e.target.value })} style={{ ...fieldInput, padding: '9px 11px' }} />
        </div>
      ))}
      <button onClick={add} className="mkt-btn" style={{ fontSize: 15, padding: '10px', boxShadow: '0 4px 0 rgba(23,19,13,.14)' }}>+ Add schedule item</button>
    </div>
  );
}

// ── Collapsible section card ─────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    // flexShrink: 0 matters here — this card's own `overflow: hidden` (for the
    // rounded-corner clip) makes it a flex "scroll container", which per the flex
    // spec gets an automatic min-height of 0. Without an explicit flexShrink:0 the
    // column flex layout would compress this card (and its siblings) to fit the
    // available height instead of letting the scroll parent grow and scroll.
    <details className="mkt-card" style={{ padding: 0, overflow: 'hidden', flexShrink: 0 }}>
      <summary style={{ listStyle: 'none', cursor: 'pointer', padding: '14px 16px', fontFamily: 'var(--mkt-serif)', fontWeight: 600, fontSize: 19, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {title}
        <span style={{ fontSize: 13, color: 'var(--mkt-muted)' }}>▾</span>
      </summary>
      <div style={{ padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </details>
  );
}

// ── Sign-up modal (marketing style) ──────────────────────────────────────────
function SignUpModal({ open, onClose, onSubmit, loading, error }: {
  open: boolean; onClose: () => void; onSubmit: (email: string, password: string) => void; loading: boolean; error: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localErr, setLocalErr] = useState('');
  if (!open) return null;
  const submit = () => {
    setLocalErr('');
    if (!email.trim() || !password) return setLocalErr('Email and password are required.');
    if (password.length < 6) return setLocalErr('Password must be at least 6 characters.');
    if (password !== confirm) return setLocalErr('Passwords do not match.');
    onSubmit(email.trim().toLowerCase(), password);
  };
  const displayErr = localErr || error;
  return (
    <div className="mkt" style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(23,19,13,.5)', animation: 'mkt-fadeIn .25s ease both' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '100%', maxWidth: 420, margin: '0 16px', background: 'var(--mkt-card)', border: '2.5px solid var(--mkt-ink)', borderRadius: 26, padding: '28px 26px', boxShadow: '0 24px 50px rgba(0,0,0,.35)', animation: 'mkt-pop .3s ease both' }}>
        <div style={{ fontFamily: 'var(--mkt-serif)', fontWeight: 700, fontSize: 26 }}>Publish your invite ✦</div>
        <p style={{ fontFamily: 'var(--mkt-sans)', fontSize: 14, color: 'var(--mkt-muted-2)', marginTop: 6, lineHeight: 1.5 }}>Create a free account to publish your invitation and share it with guests. Everything you&apos;ve made carries over, and you start on the free tier — no card needed.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
          <MText label="Email" value={email} onChange={setEmail} type="email" placeholder="you@example.com" />
          <MText label="Password" value={password} onChange={setPassword} type="password" placeholder="At least 6 characters" />
          <MText label="Confirm password" value={confirm} onChange={setConfirm} type="password" placeholder="Repeat password" />
        </div>
        {displayErr && <div style={{ marginTop: 12, fontFamily: 'var(--mkt-sans)', fontSize: 14, color: '#b23b2e' }}>{displayErr}</div>}
        <button onClick={submit} disabled={loading} className="mkt-btn mkt-btn-dark" style={{ width: '100%', marginTop: 18, fontSize: 17, padding: 13 }}>
          {loading ? 'Creating account…' : 'Create free account'}
        </button>
        <button onClick={onClose} style={{ width: '100%', marginTop: 10, fontFamily: 'var(--mkt-sans)', fontSize: 14, color: 'var(--mkt-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Keep editing</button>
        <p style={{ marginTop: 14, fontFamily: 'var(--mkt-sans)', fontSize: 12, color: 'var(--mkt-muted)', textAlign: 'center' }}>
          Already have an account? <a href="/login" style={{ fontWeight: 600 }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}

// ── Main editor ──────────────────────────────────────────────────────────────
function PersonaliseEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId] = useState<number>(Number(searchParams.get('template')) || 1);
  // The picker's ?event= choice, load-bearing here: drives which fields the form shows and what
  // shape the preview/submit payloads take. Fixed for the life of this page (same as templateId).
  const eventType = parseEventType(searchParams.get('event'));
  const [wedding, setWedding] = useState<WeddingDraft>({ brideName: 'Aisyah', groomName: 'Hariz', eventTitle: '', weddingDate: '', venue: 'Grand Ballroom', venueAddress: '' });
  const [config, setConfig] = useState<Record<string, string>>({});
  const [itinerary, setItinerary] = useState<ItineraryRow[]>([]);
  const [previewReady, setPreviewReady] = useState(false);
  // Guards the "persist draft" effect below from firing before the "seed defaults" effect has
  // actually committed its result. Must be STATE, not a ref: under React StrictMode's dev-mode
  // double-invoke, both effects run twice back-to-back with no commit in between, so a ref flag
  // set during the seed effect's first pass is already true by the time persist's first pass
  // runs in that SAME pass — persist would still read the stale `wedding` closure and write it to
  // localStorage. The second (StrictMode) pass of the seed effect would then read that
  // self-written stale draft back as if it were real saved data (templateId/eventType still
  // match) and "rehydrate" from it, permanently locking in the wrong WEDDING-shaped placeholder
  // fields for a PARTY/CEREMONY draft. Gating on state instead means persist's guard clause is
  // still `false` in both pre-commit passes (state doesn't update synchronously across passes),
  // so it never writes prematurely; it only runs for real once React commits the seeded values.
  const [hasSeeded, setHasSeeded] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false); // mobile bottom-sheet expanded?

  // If logged in, hand off to the full dashboard.
  useEffect(() => { if (getUser()) router.replace('/organizer-admin'); }, [router]);

  // Load templates.
  useEffect(() => { templateService.getActive().then(setTemplates).catch(() => {}); }, []);

  // Init: rehydrate a matching draft, else seed type-aware defaults.
  useEffect(() => {
    let draft: Draft | null = null;
    try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch {}
    if (draft && draft.templateId === templateId && parseEventType(draft.event ?? null) === eventType) {
      setWedding({ ...draft.wedding, eventTitle: draft.wedding.eventTitle ?? '' });
      setConfig(draft.config);
      setItinerary(draft.itinerary || []);
    } else {
      const d = new Date(); d.setMonth(d.getMonth() + 6);
      const defaultDate = d.toISOString().slice(0, 10);
      const seeded =
        eventType === 'PARTY'
          ? { brideName: 'Aisyah', groomName: '', eventTitle: '', weddingDate: defaultDate, venue: 'Grand Ballroom', venueAddress: '' }
          : eventType === 'CEREMONY'
          ? { brideName: '', groomName: '', eventTitle: "Ali's Aqiqah", weddingDate: defaultDate, venue: 'Grand Ballroom', venueAddress: '' }
          : { brideName: 'Aisyah', groomName: 'Hariz', eventTitle: '', weddingDate: defaultDate, venue: 'Grand Ballroom', venueAddress: '' };
      setWedding(seeded);
      setConfig(buildDefaultConfig(templateId));
      setItinerary([]);
    }
    setHasSeeded(true);
  }, [templateId, eventType]);

  // Persist draft on any change — gated on hasSeeded, see its declaration above for why.
  useEffect(() => {
    if (!hasSeeded) return;
    const draft: Draft = { templateId, event: eventType, wedding, config, itinerary };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [hasSeeded, templateId, eventType, wedding, config, itinerary]);

  // Listen for preview handshake.
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'PREVIEW_READY') setPreviewReady(true);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const pushPreview = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    // Native Event fields for Template8 (PARTY)/Template9 (CEREMONY) — mirrors exactly what
    // AuthController.SelfRegister would persist onto the real Event row for this event type.
    const name1 = eventType === 'WEDDING' || eventType === 'PARTY' ? (wedding.brideName || null) : null;
    const name2 = eventType === 'WEDDING' ? (wedding.groomName || null) : null;
    const eventTitle = eventType === 'CEREMONY' ? (wedding.eventTitle || null) : null;
    const coupleName =
      eventType === 'WEDDING' ? `${slugify(wedding.brideName || 'bride')}-and-${slugify(wedding.groomName || 'groom')}`
      : eventType === 'PARTY' ? slugify(wedding.brideName || 'party')
      : slugify(wedding.eventTitle || 'ceremony');
    const payload = {
      wedding: {
        weddingId: 0,
        coupleName,
        brideName: wedding.brideName || 'Bride',
        groomName: wedding.groomName || 'Groom',
        weddingDate: wedding.weddingDate ? `${wedding.weddingDate}T10:00:00Z` : new Date(Date.now() + 6 * 30 * 864e5).toISOString(),
        venue: wedding.venue || 'Venue TBD',
        venueAddress: wedding.venueAddress || '',
        totalGuests: 0, totalAttending: 0, daysUntilWedding: 180, isActive: true,
        totalPhotos: 0, enabledFeaturesCount: 0, templateId,
        templateName: templates.find((t) => t.templateId === templateId)?.templateName ?? '',
        isRsvpOpen: false,
        // Native Event fields, read by Template8/9 instead of brideName/groomName.
        name1, name2, eventTitle,
        eventType,
        displayName: computeDisplayName(eventType, wedding),
      },
      coupleMedia: [],
      wishes: [
        { wishId: 1, weddingId: 0, guestName: 'Sarah', message: 'Wishing you a lifetime of joy! 🌸', createdDate: new Date().toISOString() },
        { wishId: 2, weddingId: 0, guestName: 'James', message: 'Congratulations to the beautiful couple!', createdDate: new Date().toISOString() },
      ],
      photoBoothEnabled: false,
      customConfig: config,
      itinerary: itinerary.map((r, i) => ({ itineraryItemId: i + 1, weddingId: 0, label: r.label, detail: r.detail, sortOrder: r.sortOrder })),
    };
    localStorage.setItem('preview_draft_v2', JSON.stringify(payload));
    iframe.contentWindow.postMessage({ type: 'PREVIEW_UPDATE', payload }, window.location.origin);
  }, [wedding, config, itinerary, templateId, templates, eventType]);

  useEffect(() => { if (previewReady) pushPreview(); }, [previewReady, pushPreview]);

  // Guest fields grouped by block + ordered by the template's section order.
  const { blocks, order, detailsFields } = useMemo(() => {
    const fields = getGuestFields(templateId);
    const byBlock: Record<string, TemplateConfigField[]> = {};
    for (const f of fields) { (byBlock[blockOf(f)] ??= []).push(f); }
    const hasWalimah = (byBlock['walimah']?.length ?? 0) > 0;
    const hasPhotobooth = (byBlock['photobooth']?.length ?? 0) > 0;
    const codes = resolveSectionOrder(config['section.order'], hasWalimah, true, hasPhotobooth);
    return { blocks: byBlock, order: codes, detailsFields: byBlock['details'] ?? [] };
  }, [templateId, config]);

  const setKey = (key: string, v: string) => setConfig((c) => ({ ...c, [key]: v }));

  const handleRegister = async (email: string, password: string) => {
    setSaveError(''); setSaving(true);
    try {
      const res = await authService.selfRegister({
        email, password,
        name1: eventType === 'WEDDING' || eventType === 'PARTY' ? wedding.brideName : undefined,
        name2: eventType === 'WEDDING' ? wedding.groomName : undefined,
        eventTitle: eventType === 'CEREMONY' ? wedding.eventTitle : undefined,
        eventType,
        eventDate: wedding.weddingDate ? `${wedding.weddingDate}T10:00:00Z` : '',
        venue: wedding.venue, venueAddress: wedding.venueAddress, templateId,
        config, itinerary,
      });
      localStorage.setItem('user', JSON.stringify({ email: res.email, role: res.role, weddingId: res.weddingId, tier: res.tier }));
      localStorage.removeItem(DRAFT_KEY);
      router.push('/organizer-admin');
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSaveError(msg ?? 'Registration failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const selected = templates.find((t) => t.templateId === templateId);

  return (
    <>
      <div className="mkt pers-shell">
        {/* ── Form rail (desktop) / bottom sheet (mobile) ───────────────────── */}
        <aside className={`pers-form${sheetOpen ? ' open' : ''}`}>
          {/* Mobile handle — tap to expand/collapse the sheet over the invite */}
          <button
            className="pers-handle"
            onClick={() => setSheetOpen((o) => !o)}
            style={{ flexShrink: 0, height: 68, alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--mkt-card)', border: 'none', borderBottom: '2px solid var(--mkt-ink)', cursor: 'pointer', position: 'relative' }}
          >
            <span style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 40, height: 4, borderRadius: 999, background: 'var(--mkt-ink)', opacity: 0.4 }} />
            <span style={{ fontFamily: 'var(--mkt-sans)', fontWeight: 600, fontSize: 19, color: 'var(--mkt-ink)' }}>{sheetOpen ? 'Hide' : 'Personalise'}</span>
            <span style={{ fontSize: 14, color: 'var(--mkt-muted)' }}>{sheetOpen ? '▾' : '▴'}</span>
          </button>

          <div className="pers-form-header" style={{ padding: '14px 18px', borderBottom: '2px solid var(--mkt-ink)', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <button onClick={() => router.push('/personalise/picker')} aria-label="Back" style={{ width: 38, height: 38, borderRadius: 999, border: '2px solid var(--mkt-ink)', background: 'var(--mkt-card)', cursor: 'pointer', fontSize: 18 }}>‹</button>
            <div style={{ fontFamily: 'var(--mkt-sans)', fontWeight: 600, fontSize: 22 }}>Personalise</div>
            <div style={{ width: 38 }} />
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Your details */}
            <SectionCard title="Your details">
              {eventType === 'WEDDING' && (
                <>
                  <MText label="Bride's name" value={wedding.brideName} onChange={(v) => setWedding((w) => ({ ...w, brideName: v }))} placeholder="e.g. Aisyah" />
                  <MText label="Groom's name" value={wedding.groomName} onChange={(v) => setWedding((w) => ({ ...w, groomName: v }))} placeholder="e.g. Hariz" />
                </>
              )}
              {eventType === 'PARTY' && (
                <MText label="Honoree's name" value={wedding.brideName} onChange={(v) => setWedding((w) => ({ ...w, brideName: v }))} placeholder="e.g. Aiman" />
              )}
              {eventType === 'CEREMONY' && (
                <MText label="Event title" value={wedding.eventTitle} onChange={(v) => setWedding((w) => ({ ...w, eventTitle: v }))} placeholder="e.g. Ali's Aqiqah" />
              )}
              <MText label="Date" value={wedding.weddingDate} onChange={(v) => setWedding((w) => ({ ...w, weddingDate: v }))} type="date" />
              <MText label="Venue" value={wedding.venue} onChange={(v) => setWedding((w) => ({ ...w, venue: v }))} placeholder="e.g. Grand Ballroom" />
              <MText label="Venue address" value={wedding.venueAddress} onChange={(v) => setWedding((w) => ({ ...w, venueAddress: v }))} placeholder="Optional" />
              {detailsFields.map((f) => (
                <GuestField key={f.key} field={f} value={config[f.key] ?? f.defaultValue} onChange={(v) => setKey(f.key, v)} />
              ))}
            </SectionCard>

            {/* Content sections in the template's own order */}
            {order.map((code) => {
              if (code === 'itinerary') {
                return (
                  <SectionCard key="itinerary" title={SECTION_LABELS.itinerary}>
                    <LocalItineraryEditor rows={itinerary} onChange={setItinerary} />
                  </SectionCard>
                );
              }
              const fields = blocks[code];
              if (!fields || fields.length === 0) return null;
              return (
                <SectionCard key={code} title={SECTION_LABELS[code] ?? code}>
                  {fields.map((f) => (
                    <GuestField key={f.key} field={f} value={config[f.key] ?? f.defaultValue} onChange={(v) => setKey(f.key, v)} />
                  ))}
                </SectionCard>
              );
            })}
          </div>

          <div style={{ padding: '14px 18px', borderTop: '2px solid var(--mkt-ink)', flexShrink: 0 }}>
            <button onClick={() => setShowModal(true)} className="mkt-btn mkt-btn-dark" style={{ width: '100%', fontSize: 18, padding: 14 }}>
              Publish invite ✦
            </button>
            <p style={{ margin: '8px 0 0', fontFamily: 'var(--mkt-sans)', fontSize: 12, color: 'var(--mkt-muted)', textAlign: 'center' }}>Editing is free — no sign-up needed. Sign up only to publish.</p>
          </div>
        </aside>

        {/* ── Live preview ──────────────────────────────────────────────────── */}
        <div className="pers-preview">
          <div style={{ height: 44, flexShrink: 0, background: 'var(--mkt-card)', borderBottom: '2px solid var(--mkt-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
            <span style={{ fontFamily: 'var(--mkt-sans)', fontSize: 13, color: 'var(--mkt-muted-2)' }}>
              {selected ? `${selected.templateName} · Live preview` : 'Live preview'}{previewReady ? '' : ' · loading…'}
            </span>
          </div>
          <iframe ref={iframeRef} src="/organizer-admin/preview" onLoad={() => setTimeout(pushPreview, 300)} style={{ flex: 1, border: 'none', width: '100%' }} title="Invitation preview" />
        </div>
      </div>

      <SignUpModal open={showModal} onClose={() => setShowModal(false)} onSubmit={handleRegister} loading={saving} error={saveError} />
    </>
  );
}

export default function PersonalisePage() {
  return (
    <Suspense>
      <PersonaliseEditor />
    </Suspense>
  );
}
