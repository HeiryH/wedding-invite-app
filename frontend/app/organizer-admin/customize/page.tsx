'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import {
  eventService,
  photoService,
  audioService,
  templateConfigService,
  templateService,
  eventFeatureService,
  itineraryService,
  Wedding,
  Photo,
  Template,
  ItineraryItem,
  TemplateSlots,
} from '@/lib/api';
import { TemplateLibrary } from '@/components/templates/TemplateLibrary';
import { buildDefaultConfig, getConfigFields } from '@/lib/templateConfigSchema';
import { TemplateConfigField } from '@/lib/api';
import { resolveSectionOrder } from '@/lib/templateUtils';
import { matchesEvent, urlSegmentForEventType } from '@/lib/eventTypes';
import { PRESETS, isShadowField, chipOf, useSchemaIndex } from './_components/SchemaField';
// The stage-layout dock (shared engine). `TEMPLATE_ENGINES` is the single per-template registry
// selecting {stages, keyPrefix, stageIds, reveal} — adding a template to the Adjust feature means
// a registry entry there, not a branch here.
import AdjustPanel from '@/components/templates/_shared/adjust/AdjustPanel';
import { TEMPLATE_ENGINES } from '@/components/templates/_shared/registry';
import { resolveStage, serializeStage, layoutKey } from '@/components/templates/_shared/layout';
import type { Layer as LayerModel, Breakpoint, StageDef } from '@/components/templates/_shared/types';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Icon } from '@/components/ui/Icon';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import { PreviewPanel, type Device, type EditorMode } from './_components/PreviewPanel';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

const SAMPLE_WISHES = [
  { wishId: 1, weddingId: 0, guestName: 'Sarah', message: 'Wishing you a lifetime of happiness!', createdDate: new Date().toISOString() },
  { wishId: 2, weddingId: 0, guestName: 'James', message: 'Congratulations to the happy couple!', createdDate: new Date().toISOString() },
];

const PORTRAIT_SLOTS_T3 = [
  { slot: TemplateSlots.GROOM_PORTRAIT, label: 'Groom Portrait' },
  { slot: TemplateSlots.BRIDE_PORTRAIT, label: 'Bride Portrait' },
  { slot: TemplateSlots.EXTRA_1, label: 'Extra Image 1' },
  { slot: TemplateSlots.EXTRA_2, label: 'Extra Image 2' },
  { slot: TemplateSlots.EXTRA_3, label: 'Extra Image 3' },
];

const PORTRAIT_SLOTS_T4 = [
  { slot: TemplateSlots.GROOM_PORTRAIT, label: 'Hero Background (Couple Photo)' },
  { slot: TemplateSlots.BRIDE_PORTRAIT, label: 'Mid-Page Photo' },
  { slot: TemplateSlots.EXTRA_1, label: 'Photo Booth — Card 1' },
  { slot: TemplateSlots.EXTRA_2, label: 'Photo Booth — Card 2' },
  { slot: TemplateSlots.EXTRA_3, label: 'Photo Booth — Card 3' },
];

// ── Block model ───────────────────────────────────────────────────────────────
type BlockId = 'details' | 'welcome' | 'walimah' | 'rsvp' | 'itinerary' | 'wishes' | 'photobooth' | 'music';

const SECTION_BLOCKS: { code: string; label: string; icon: string }[] = [
  { code: 'welcome',    label: 'Cover',       icon: 'image' },
  { code: 'walimah',   label: 'Ceremony',    icon: 'calendar' },
  { code: 'rsvp',      label: 'RSVP',        icon: 'star' },
  { code: 'itinerary', label: 'Itinerary',   icon: 'clock' },
  { code: 'wishes',    label: 'Wishes',      icon: 'message-circle' },
  { code: 'photobooth',label: 'Photo Booth', icon: 'camera' },
];
const SECTION_CODES = SECTION_BLOCKS.map((b) => b.code);
const DEFAULT_SECTION_ORDER = SECTION_CODES.slice();

function parseSectionOrder(value: string | undefined): string[] {
  if (!value) return DEFAULT_SECTION_ORDER.slice();
  const codes = value.split(',').map((c) => c.trim()).filter((c) => SECTION_CODES.includes(c));
  const ordered = Array.from(new Set(codes));
  return ordered.length ? ordered : DEFAULT_SECTION_ORDER.slice();
}

function scrollFractionFor(block: BlockId, order: string[]): number {
  if (block === 'details' || block === 'music') return 0;
  const i = order.indexOf(block);
  return i <= 0 ? 0 : i / Math.max(1, order.length);
}

// Block metadata for the form header. Chips are NOT listed here — they're derived from the
// chips the template's schema fields actually declare, so a chip can never scroll to a group
// that doesn't exist for this template.
const BLOCK_INFO: Record<string, { eyebrow: string; title: string; subtitle: string }> = {
  details:    { eyebrow: 'Global', title: 'Details & Theme', subtitle: 'Wedding info and template settings.' },
  welcome:    { eyebrow: 'Section · Cover', title: 'Welcome screen', subtitle: 'The first thing guests see when they open the invitation.' },
  walimah:    { eyebrow: 'Section · Ceremony', title: 'The ceremony', subtitle: 'Ceremony details and walimah text.' },
  rsvp:       { eyebrow: 'Section · RSVP', title: 'RSVP', subtitle: 'Guest confirmation section.' },
  itinerary:  { eyebrow: 'Section · Itinerary', title: 'Schedule', subtitle: 'Event timeline and programme.' },
  wishes:     { eyebrow: 'Section · Wishes', title: 'Wishes & Guestbook', subtitle: 'Messages from your guests.' },
  photobooth: { eyebrow: 'Section · Photo Booth', title: 'Photo Booth', subtitle: 'Guest photo gallery.' },
  music:      { eyebrow: 'Background Music', title: 'Music & playlist', subtitle: 'Audio that plays while guests browse.' },
};

// Group render order per rail block. Groups the schema declares but this list omits are
// appended at the end, so a newly-added field always surfaces somewhere rather than vanishing.
const GROUP_ORDER: Record<BlockId, string[]> = {
  details:    ['Invitation Layout', 'Wedding Details', 'Display', 'Navigation Labels', 'Advanced', 'Footer', 'Change Template'],
  welcome:    ['Heading', 'Invitation Message', 'Countdown', 'Roman Garden Scene', 'Fairy Garden Scene', 'Stage Layout', 'Decorative Layers', 'Section Background', 'Page Background'],
  walimah:    ['Ceremony / Walimah', 'Ceremony Stages', 'Couple Names in Card'],
  rsvp:       ['RSVP'],
  itinerary:  ['Schedule / Itinerary', 'Section Background'],
  wishes:     ['Wishes & Guestbook'],
  photobooth: ['Photo Booth', 'Portrait & Gallery Slots', 'Section Headings', 'Section Background'],
  music:      [],
};

// Groups that exist only to host a hand-written widget — they hold no schema fields.
// 'Wedding Details' is genuinely pre-existing (the bride/groom/date/venue/maxPax inputs in
// groupExtras below are hand-written record fields, not schema-declared) — but it was missing
// from this list, so `renderBlock`'s `groups.has(title)` check only ever saw it exist when a
// template's schema happened to contribute a field with that literal `group` string (today, only
// Template5's `names.ampersand.color`). Every other template silently never rendered the block at
// all — no way to edit the couple's/honoree's name, date, venue, or address. Listing it here
// (like 'Change Template') makes it always render, independent of any attached schema fields.
const SYNTHETIC_GROUPS: Partial<Record<BlockId, string[]>> = {
  details:    ['Wedding Details', 'Change Template'],
  photobooth: ['Portrait & Gallery Slots'],
};

// ── Existing sub-components (functional, restyled inputs) ─────────────────────

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-strong)' }}>{children}</p>
      {hint && <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-subtle)' }}>{hint}</p>}
    </div>
  );
}

function TextField({ value, onChange, maxLength, placeholder, type }: {
  value: string; onChange: (v: string) => void; maxLength: number; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <input
        type={type ?? 'text'} value={value} onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength} placeholder={placeholder}
        style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)', color: 'var(--text-body)', background: 'var(--surface-card)', outline: 'none', boxSizing: 'border-box', transition: 'var(--transition-control)' }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.boxShadow = 'var(--shadow-focus)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = 'none'; }}
      />
      <p style={{ textAlign: 'right', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', marginTop: 2, color: value.length >= maxLength ? 'var(--danger)' : 'var(--text-subtle)' }}>
        {value.length} / {maxLength}
      </p>
    </div>
  );
}

function SelectField({ value, options, onChange, labels }: {
  value: string; options: string[]; onChange: (v: string) => void; labels?: Record<string, string>;
}) {
  return (
    <select
      value={value} onChange={(e) => onChange(e.target.value)}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)', color: 'var(--text-body)', background: 'var(--surface-card)', outline: 'none', appearance: 'none', WebkitAppearance: 'none', transition: 'var(--transition-control)' }}
      onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.boxShadow = 'var(--shadow-focus)'; }}
      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {options.map((o) => <option key={o} value={o}>{labels?.[o] ?? (o.charAt(0).toUpperCase() + o.slice(1))}</option>)}
    </select>
  );
}

function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return <Switch checked={value} onChange={e => onChange(e.target.checked)} />;
}

// ── New Eveline-design primitives ────────────────────────────────────────────

// Collapsible form group
function Group({ title, children, count, defaultOpen = true, chipAnchor }: {
  title: string; children: React.ReactNode; count?: number; defaultOpen?: boolean; chipAnchor?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div data-chip={chipAnchor || undefined} style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--text-subtle)', fontWeight: 600, fontFamily: 'var(--font-ui)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 14, height: 1, background: 'var(--border-default)', display: 'inline-block' }} />
          {title}
          {count != null && (
            <span style={{ fontSize: 9, padding: '1px 6px', background: 'var(--surface-sunken)', borderRadius: 999, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
          )}
        </div>
        <button
          onClick={() => setOpen(!open)}
          style={{ width: 22, height: 22, display: 'grid', placeItems: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-subtle)', borderRadius: 4, transition: 'background 150ms' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-strong)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-subtle)'; }}
        >
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} />
        </button>
      </div>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {children}
        </div>
      )}
    </div>
  );
}

// Borderless input used inside a FieldCard — the card supplies the chrome.
const BARE_INPUT: React.CSSProperties = {
  width: '100%', fontSize: 14, fontWeight: 500, color: 'var(--text-strong)',
  background: 'transparent', border: 'none', outline: 'none',
  fontFamily: 'var(--font-ui)', padding: '2px 0',
};

// Styled field card
function FieldCard({ label, count, max, children }: {
  label?: string; count?: number; max?: number; children: React.ReactNode;
}) {
  return (
    <div
      style={{ background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 14px', transition: 'border-color 150ms' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; }}
      onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(67,106,138,0.1)'; }}
      onBlurCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      {(label || count != null) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, fontFamily: 'var(--font-ui)' }}>{label}</span>
          {count != null && <span style={{ fontSize: 10, color: 'var(--text-subtle)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono)' }}>{count} / {max}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

// Color row: swatch + hex input + reset + preset swatches
function ColorRow({ value, onChange, onClear, presets }: {
  value: string; onChange: (v: string) => void; onClear: () => void; presets?: string[];
}) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border-subtle)' }}>
        <label style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border-default)', flexShrink: 0, position: 'relative', cursor: 'pointer', transition: 'transform 150ms', background: value || undefined, display: 'block' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.06)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
          {!value && <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'repeating-linear-gradient(45deg, #fff 0 4px, var(--border-subtle) 4px 5px)' }} />}
          <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)}
            style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
        </label>
        <input
          className="color-hex-input"
          value={value || ''} placeholder="Default"
          onChange={e => onChange(e.target.value)}
          style={{ flex: 1, fontFamily: "'SF Mono', ui-monospace, monospace", fontSize: 12, fontWeight: 500, color: 'var(--text-strong)', letterSpacing: '0.02em', background: 'transparent', border: 'none', outline: 'none' }}
        />
        <button onClick={onClear}
          style={{ fontSize: 11, color: 'var(--text-subtle)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', flexShrink: 0, padding: '4px 8px', borderRadius: 'var(--radius-sm)', transition: 'color 150ms' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--brand)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-subtle)'; }}>
          Reset
        </button>
      </div>
      {presets && (
        <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
          {presets.map(p => (
            <button key={p} onClick={() => onChange(p)} title={p}
              style={{
                width: 18, height: 18, borderRadius: 6, cursor: 'pointer',
                background: p, border: value?.toLowerCase() === p.toLowerCase()
                  ? '1.5px solid var(--text-strong)' : '1.5px solid transparent',
                boxShadow: value?.toLowerCase() === p.toLowerCase()
                  ? '0 0 0 2px #fff, 0 0 0 3px var(--text-strong)' : 'none',
                transition: 'transform 150ms',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            />
          ))}
        </div>
      )}
    </>
  );
}

// Segmented control for shadow/effect options
function ShadowSeg({ value, onChange, options = ['none', 'shadow', 'glow'] }: {
  value: string; onChange: (v: string) => void; options?: string[];
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border-subtle)' }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, fontFamily: 'var(--font-ui)' }}>Effect</span>
      <div style={{ display: 'inline-flex', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 999, padding: 2 }}>
        {options.map(opt => (
          <button key={opt} onClick={() => onChange(opt)}
            style={{
              padding: '4px 10px', borderRadius: 999, fontSize: 11,
              fontWeight: value === opt ? 600 : 500,
              fontFamily: 'var(--font-ui)',
              background: value === opt ? 'var(--text-strong)' : 'transparent',
              color: value === opt ? '#fff' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer', transition: 'all 150ms',
            }}>
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Rich text editor ──────────────────────────────────────────────────────────

function RichTextEditor({ value, onChange, maxLength }: {
  value: string; onChange: (html: string) => void; maxLength: number;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false, bulletList: false, orderedList: false, blockquote: false, codeBlock: false, horizontalRule: false }),
      CharacterCount.configure({ limit: maxLength }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });
  const count = editor?.storage.characterCount.characters() ?? 0;
  return (
    <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden', transition: 'border-color 150ms' }}
      onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-focus)'; }}
      onBlurCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', gap: 4, padding: '6px 8px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-sunken)' }}>
        <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()}
          style={{ padding: '3px 8px', fontSize: 13, borderRadius: 'var(--radius-sm)', fontWeight: 700, fontFamily: 'var(--font-ui)', background: editor?.isActive('bold') ? 'var(--brand-subtle)' : 'transparent', color: editor?.isActive('bold') ? 'var(--brand)' : 'var(--text-body)', border: 'none', cursor: 'pointer' }}>B</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()}
          style={{ padding: '3px 8px', fontSize: 13, borderRadius: 'var(--radius-sm)', fontStyle: 'italic', fontFamily: 'var(--font-ui)', background: editor?.isActive('italic') ? 'var(--brand-subtle)' : 'transparent', color: editor?.isActive('italic') ? 'var(--brand)' : 'var(--text-body)', border: 'none', cursor: 'pointer' }}>I</button>
      </div>
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-3 min-h-[80px] [&_.ProseMirror]:outline-none" />
      <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', padding: '3px 12px', borderTop: '1px solid var(--border-subtle)', color: count >= maxLength ? 'var(--danger)' : 'var(--text-subtle)', background: 'var(--surface-sunken)' }}>
        {count} / {maxLength}
      </div>
    </div>
  );
}

// ── Itinerary editor ──────────────────────────────────────────────────────────

function ItineraryEditor({ weddingId, onItemsChange }: { weddingId: number; onItemsChange?: (items: ItineraryItem[]) => void }) {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState({ label: '', detail: '' });
  const [newRow, setNewRow] = useState({ label: '', detail: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    itineraryService.getByWeddingId(weddingId).then((data) => { setItems(data); setLoading(false); });
  }, [weddingId]);

  useEffect(() => { onItemsChange?.(items); }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextSort = items.length > 0 ? Math.max(...items.map((i) => i.sortOrder)) + 1 : 1;

  const handleAdd = async () => {
    if (!newRow.label.trim()) return;
    const created = await itineraryService.create(weddingId, { ...newRow, label: newRow.label.trim(), detail: newRow.detail.trim(), sortOrder: nextSort });
    setItems((p) => [...p, created]);
    setNewRow({ label: '', detail: '' });
    setAdding(false);
  };

  const handleSaveEdit = async (item: ItineraryItem) => {
    if (!editDraft.label.trim()) return;
    const updated = await itineraryService.update(item.itineraryItemId, { label: editDraft.label.trim(), detail: editDraft.detail.trim(), sortOrder: item.sortOrder });
    setItems((p) => p.map((i) => i.itineraryItemId === updated.itineraryItemId ? updated : i));
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    await itineraryService.delete(id);
    setItems((p) => p.filter((i) => i.itineraryItemId !== id));
  };

  const handleMove = async (index: number, dir: 'up' | 'down') => {
    const swap = dir === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= items.length) return;
    const next = [...items];
    [next[index], next[swap]] = [next[swap], next[index]];
    const reordered = next.map((item, i) => ({ ...item, sortOrder: i + 1 }));
    setItems(reordered);
    await itineraryService.reorder(weddingId, { items: reordered.map((i) => ({ itineraryItemId: i.itineraryItemId, sortOrder: i.sortOrder })) });
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '6px 10px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)', color: 'var(--text-body)', background: 'var(--surface-card)', outline: 'none', boxSizing: 'border-box' };

  if (loading) return <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)', padding: '8px 0' }}>Loading…</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.length === 0 && !adding && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)', textAlign: 'center', padding: '12px 0' }}>No items yet.</p>
      )}
      {items.map((item, index) => (
        <div key={item.itineraryItemId} style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 12, background: 'var(--surface-sunken)' }}>
          {editingId === item.itineraryItemId ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input autoFocus type="text" value={editDraft.label} onChange={e => setEditDraft(d => ({ ...d, label: e.target.value }))} placeholder="Label" style={inputStyle} />
              <input type="text" value={editDraft.detail} onChange={e => setEditDraft(d => ({ ...d, detail: e.target.value }))} placeholder="Detail" style={inputStyle} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => handleSaveEdit(item)} style={{ padding: '4px 12px', background: 'var(--brand)', color: '#fff', fontSize: 11, borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>Save</button>
                <button onClick={() => setEditingId(null)} style={{ padding: '4px 12px', background: 'var(--surface-card)', color: 'var(--text-body)', fontSize: 11, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <button onClick={() => handleMove(index, 'up')} disabled={index === 0} style={{ fontSize: 10, color: 'var(--text-subtle)', background: 'none', border: 'none', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.2 : 1, lineHeight: 1 }}>▲</button>
                <button onClick={() => handleMove(index, 'down')} disabled={index === items.length - 1} style={{ fontSize: 10, color: 'var(--text-subtle)', background: 'none', border: 'none', cursor: index === items.length - 1 ? 'default' : 'pointer', opacity: index === items.length - 1 ? 0.2 : 1, lineHeight: 1 }}>▼</button>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-strong)', fontFamily: 'var(--font-ui)' }}>{item.label}</p>
                {item.detail && <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>{item.detail}</p>}
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => { setEditingId(item.itineraryItemId); setEditDraft({ label: item.label, detail: item.detail }); }} style={{ padding: '3px 8px', fontSize: 11, color: 'var(--text-body)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>Edit</button>
                <button onClick={() => handleDelete(item.itineraryItemId)} style={{ padding: '3px 8px', fontSize: 11, color: 'var(--danger)', border: '1px solid var(--danger-border, #fca5a5)', borderRadius: 'var(--radius-sm)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>Del</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <div style={{ border: '1px solid var(--brand-border)', borderRadius: 'var(--radius-md)', padding: 12, background: 'var(--brand-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input autoFocus type="text" value={newRow.label} onChange={e => setNewRow(d => ({ ...d, label: e.target.value }))} placeholder="Label (e.g. Akad Nikah)" onKeyDown={e => e.key === 'Enter' && handleAdd()} style={inputStyle} />
          <input type="text" value={newRow.detail} onChange={e => setNewRow(d => ({ ...d, detail: e.target.value }))} placeholder="Detail (e.g. 10:00 AM · Grand Mosque)" onKeyDown={e => e.key === 'Enter' && handleAdd()} style={inputStyle} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleAdd} style={{ padding: '4px 12px', background: 'var(--brand)', color: '#fff', fontSize: 11, borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>Add</button>
            <button onClick={() => { setAdding(false); setNewRow({ label: '', detail: '' }); }} style={{ padding: '4px 12px', background: 'var(--surface-card)', color: 'var(--text-body)', fontSize: 11, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ width: '100%', padding: 10, border: '1.5px dashed var(--border-default)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)', color: 'var(--text-muted)', cursor: 'pointer', background: 'transparent', transition: 'var(--transition-control)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
          + Add schedule item
        </button>
      )}
    </div>
  );
}

// ── Music Tab ─────────────────────────────────────────────────────────────────

function MusicTab({ url, loop, weddingId, onUrlChange, onLoopChange }: {
  url: string; loop: boolean; weddingId: number;
  onUrlChange: (v: string) => void; onLoopChange: (v: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const audioUrl = await audioService.upload(weddingId, file);
      onUrlChange(audioUrl);
    } catch {
      alert('Upload failed. Make sure the file is a valid audio format (mp3, wav, ogg, aac, m4a, flac) under 20 MB.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Group title="Upload Audio" chipAnchor="Audio">
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('audio/')) handleFile(f); }}
          style={{ borderRadius: 12, border: `2px dashed ${dragOver ? 'var(--brand)' : 'var(--border-default)'}`, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'var(--transition-control)', background: dragOver ? 'var(--brand-subtle)' : 'var(--surface-sunken)' }}
        >
          {uploading ? <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Uploading…</p> : (
            <>
              <span style={{ fontSize: 28 }}>🎵</span>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-body)', fontFamily: 'var(--font-ui)' }}>Drop audio file here or click to browse</p>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>MP3, WAV, OGG, AAC, M4A, FLAC · max 20 MB</p>
            </>
          )}
        </div>
        <input ref={inputRef} type="file" accept="audio/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      </Group>

      <Group title="Or Paste a URL">
        <TextField value={url} onChange={onUrlChange} maxLength={500} placeholder="https://..." />
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--warning)', background: 'var(--warning-subtle)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-md)', padding: '8px 12px', margin: 0, fontFamily: 'var(--font-ui)', lineHeight: 1.6 }}>
          Must be a <strong>direct link</strong> to an audio file (.mp3, .wav, etc.). YouTube, Spotify, and SoundCloud won&apos;t work.
        </p>
      </Group>

      {url && (
        <Group title="Preview">
          <audio key={url} controls src={url.startsWith('/') ? API_BASE + url : url} style={{ width: '100%', borderRadius: 8 }} />
          <button type="button" onClick={() => onUrlChange('')}
            style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 500, textAlign: 'left' }}>
            Remove music
          </button>
        </Group>
      )}

      <Group title="Settings" chipAnchor="Settings">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 500, fontFamily: 'var(--font-ui)', color: 'var(--text-strong)' }}>Loop Music</p>
            <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-subtle)', fontFamily: 'var(--font-ui)' }}>Music restarts from the beginning when it ends</p>
          </div>
          <ToggleSwitch value={loop} onChange={onLoopChange} />
        </div>
      </Group>
    </div>
  );
}

// ── Background image upload ───────────────────────────────────────────────────

const BG_SLOT: Record<string, number> = {
  'section.welcome.bg': TemplateSlots.WELCOME_BG,
  'section.ceremony.bg': TemplateSlots.CEREMONY_BG,
  'section.celebration.bg': TemplateSlots.CELEBRATION_BG,
  'template.bg': TemplateSlots.TEMPLATE5_GLOBAL_BG,
};

function BgImageField({ configKey, label, value, weddingId, onChange }: {
  configKey: string; label: string; value: string; weddingId: number; onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const photo = await photoService.upload(weddingId, '', `${label} background`, file, 'COUPLE', BG_SLOT[configKey]);
      onChange(photo.photoUrl);
    } catch {
      alert('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {value ? (
        <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '16/9', boxShadow: 'var(--shadow-sm)' }}>
          <img src={`${API_BASE}${value}`} alt={label} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 150ms' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}>
            <button type="button" onClick={() => onChange('')} style={{ background: 'var(--danger)', color: '#fff', fontSize: 11, padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>Remove</button>
          </div>
        </div>
      ) : (
        <div onClick={() => inputRef.current?.click()}
          style={{ aspectRatio: '16/9', borderRadius: 8, border: '2px dashed var(--border-default)', background: 'var(--surface-sunken)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'var(--transition-control)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}>
          {uploading ? <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Uploading…</p>
            : <><span style={{ fontSize: 22, marginBottom: 4 }}>🖼️</span><p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>Click to upload background image</p></>
          }
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
    </div>
  );
}

// ── Stage layout launcher ─────────────────────────────────────────────────────

// ── Portrait photo slot ───────────────────────────────────────────────────────

function PhotoDropZone({ slot, label, photo, uploading, onDrop, onRemove }: {
  slot: number; label: string; photo: Photo | undefined; uploading: boolean;
  onDrop: (slot: number, file: File) => void; onRemove: (photo: Photo) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p style={{ margin: '0 0 6px', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-strong)', fontFamily: 'var(--font-ui)' }}>{label}</p>
      {photo ? (
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '3/4', boxShadow: 'var(--shadow-sm)' }}>
          <img src={`${API_BASE}${photo.photoUrl}`} alt={label} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 150ms' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}>
            <button type="button" onClick={() => onRemove(photo)} style={{ background: 'var(--danger)', color: '#fff', fontSize: 11, padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>Remove</button>
          </div>
        </div>
      ) : (
        <div onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) onDrop(slot, f); }}
          style={{ aspectRatio: '3/4', borderRadius: 12, border: `2px dashed ${dragOver ? 'var(--brand)' : 'var(--border-default)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'var(--transition-control)', background: dragOver ? 'var(--brand-subtle)' : 'var(--surface-sunken)' }}>
          {uploading ? <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>Uploading…</p>
            : <><span style={{ fontSize: 28, marginBottom: 6 }}>📷</span><p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center', padding: '0 8px', fontFamily: 'var(--font-ui)' }}>Drop image here<br />or click to browse</p></>
          }
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onDrop(slot, f); e.target.value = ''; }} />
    </div>
  );
}

// ── Section Rail ──────────────────────────────────────────────────────────────

const RAIL_SECTIONS = [
  { id: 'details' as BlockId,   label: 'Details', icon: 'settings'   },
  { id: 'welcome' as BlockId,   label: 'Cover',   icon: 'image'      },
  { id: 'walimah' as BlockId,   label: 'Ceremony',icon: 'calendar'   },
  { id: 'rsvp' as BlockId,      label: 'RSVP',    icon: 'star'       },
  { id: 'itinerary' as BlockId, label: 'Itinerary',icon: 'clock'     },
  { id: 'wishes' as BlockId,    label: 'Wishes',  icon: 'message-circle' },
  { id: 'photobooth' as BlockId,label: 'Photos',  icon: 'camera'     },
];

function SectionRail({ mode, onToggle, activeBlock, sectionOrder, onSelectBlock, hasMusic }: {
  mode: EditorMode;
  onToggle: () => void;
  activeBlock: BlockId;
  sectionOrder: string[];
  onSelectBlock: (block: BlockId) => void;
  hasMusic: boolean;
}) {
  const railItems = [
    RAIL_SECTIONS[0], // details always first
    ...sectionOrder.map(code => RAIL_SECTIONS.find(s => s.id === code)).filter(Boolean) as typeof RAIL_SECTIONS,
    // only templates that actually play audio get a Music tab
    ...(hasMusic ? [{ id: 'music' as BlockId, label: 'Music', icon: 'music' }] : []),
  ];

  return (
    <div style={{
      width: 60, flexShrink: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '14px 0', gap: 4,
      background: 'var(--surface-sunken)',
      borderRight: '1px solid var(--border-subtle)',
    }}>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        title={mode === 'expanded' ? 'Collapse to icons' : mode === 'collapsed' ? 'Hide panel' : 'Show panel'}
        style={{
          width: 36, height: 36, borderRadius: 6,
          display: 'grid', placeItems: 'center',
          color: 'var(--text-muted)', border: 'none', cursor: 'pointer',
          background: 'transparent', marginBottom: 10, transition: 'all 150ms',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-raised)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-strong)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
      >
        <Icon name={mode === 'expanded' ? 'panel-left-close' : 'panel-left-open'} size={18} />
      </button>

      {/* Section items */}
      {railItems.map((s, idx) => {
        // Separator before Music
        const isMusicSep = s.id === 'music' && idx > 0;
        const isActive = activeBlock === s.id;
        return (
          <div key={s.id} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {isMusicSep && <div style={{ width: 30, height: 1, background: 'var(--border-subtle)', margin: '6px 0' }} />}
            <button
              onClick={() => {
                onSelectBlock(s.id);
              }}
              title={s.label}
              style={{
                width: 44, padding: '8px 0',
                borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                color: isActive ? 'var(--text-strong)' : 'var(--text-muted)',
                background: isActive ? 'var(--surface-card)' : 'transparent',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                fontWeight: isActive ? 600 : 500,
                fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase',
                fontFamily: 'var(--font-ui)', border: 'none', cursor: 'pointer',
                position: 'relative', transition: 'all 150ms',
              }}
              onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'var(--surface-raised)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-strong)'; }}}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}}
            >
              {/* Left accent bar for active */}
              {isActive && (
                <span style={{
                  position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)',
                  width: 3, height: 22, background: 'var(--brand)', borderRadius: 2,
                }} />
              )}
              <span style={{ color: isActive ? 'var(--brand)' : 'inherit', display: 'grid', placeItems: 'center', width: 22, height: 22 }}>
                <Icon name={s.icon} size={17} color="currentColor" />
              </span>
              <span>{s.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Save Bar ──────────────────────────────────────────────────────────────────

function SaveBar({ dirty, saving, onSave }: { dirty: boolean; saving: boolean; onSave: () => void }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 60, right: 0, width: 320,
      padding: '12px 22px',
      background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, var(--surface-card) 28%)',
      display: 'flex', alignItems: 'center', gap: 10,
      pointerEvents: 'none',
    }}>
      <div style={{ pointerEvents: 'auto', flex: 1, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', lineHeight: 1.4 }}>
        {dirty
          ? <><b style={{ color: 'var(--brand)' }}>●</b> Unsaved changes</>
          : <>Last saved · <kbd style={{ display: 'inline-block', padding: '1px 5px', fontFamily: 'var(--font-mono)', fontSize: 10, background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderBottomWidth: 2, borderRadius: 3, color: 'var(--text-muted)' }}>⌘</kbd> <kbd style={{ display: 'inline-block', padding: '1px 5px', fontFamily: 'var(--font-mono)', fontSize: 10, background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderBottomWidth: 2, borderRadius: 3, color: 'var(--text-muted)' }}>S</kbd></>
        }
      </div>
      <Button
        variant="primary" tone="brand" size="sm"
        onClick={onSave}
        disabled={saving || !dirty}
        loading={saving}
        style={{ pointerEvents: 'auto' }}
      >
        {dirty ? 'Save changes' : 'All saved'}
      </Button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CustomizePage() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const weddingId = user?.weddingId;

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [coupleMedia, setCoupleMedia] = useState<Photo[]>([]);

  const [draftConfig, setDraftConfig] = useState<Record<string, string>>({});
  const [savedConfig, setSavedConfig] = useState<Record<string, string>>({});

  const emptyWed = { brideName: '', groomName: '', eventTitle: '', weddingDate: '', venue: '', venueAddress: '', maxPax: 0 };
  const [weddingDraft, setWeddingDraft] = useState(emptyWed);
  const [weddingSaved, setWeddingSaved] = useState(emptyWed);

  const [activeBlock, setActiveBlock] = useState<BlockId>('details');
  const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_SECTION_ORDER.slice());
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  // New: editor panel mode and preview device
  const [editorMode, setEditorMode] = useState<EditorMode>('expanded');
  const [device, setDevice] = useState<Device>('mobile');
  const [manualZoom, setManualZoom] = useState<number | null>(null);
  const [subSection, setSubSection] = useState('');
  // Adjust (stage-layout) dock: open state + which layer is selected, so the preview can outline it.
  const [adjusting, setAdjusting] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedLayer, setSelectedLayer] = useState<string | undefined>();
  // "Reveal off-screen" relaxes the stage clip in the preview so nudged-out layers stay grabbable.
  const [revealOverflow, setRevealOverflow] = useState(false);

  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [photoBoothEnabled, setPhotoBoothEnabled] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [switchingTemplate, setSwitchingTemplate] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const payloadRef = useRef<unknown>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  const configDirty = JSON.stringify(draftConfig) !== JSON.stringify(savedConfig);
  const weddingDirty = JSON.stringify(weddingDraft) !== JSON.stringify(weddingSaved);
  const isDirty = configDirty || weddingDirty;

  // The schema decides which controls exist for this template + role — never a templateId check.
  const fields = useMemo(
    () => getConfigFields(wedding?.templateId ?? 1, user?.role ?? 'ORGANIZER_ADMIN', user?.tier),
    [wedding?.templateId, user?.role, user?.tier],
  );
  const schema = useSchemaIndex(fields);

  // ── Stage-layout Adjust dock ────────────────────────────────────────────────
  const isPro = user?.tier === 'PRO';

  // Which layer engine (if any) this template exposes, and the stages it can edit — gated exactly
  // like the template renders them. Adding a template to the Adjust feature means a
  // `TEMPLATE_ENGINES` registry entry (see _shared/registry.ts), not a branch here.
  const layout = useMemo(() => {
    const id = wedding?.templateId;
    const engine = id ? TEMPLATE_ENGINES[id] : undefined;
    if (engine) {
      const codes = resolveSectionOrder(
        sectionOrder.join(','),
        Boolean(draftConfig['walimah.body']),
        itinerary.length > 0,
        photoBoothEnabled,
      );
      const ctx = { codes, photoBoothEnabled, draftConfig };
      return {
        stages: engine.resolveStages(ctx),
        keyPrefix: engine.keyPrefix,
        stageIds: engine.stageIds(ctx),
        reveal: engine.reveal,
        slotTheme: Boolean(engine.slotTheme),
      };
    }
    // Authored templates (data, not code — see _shared/DataTemplate.tsx) have no registry entry;
    // their stage map ships on the wedding itself. `ta<id>` mirrors TemplateWrapper.tsx's identical
    // keyPrefix so a couple's saved deltas land under the same config namespace it already reads.
    // Always slot-theme-able: DataTemplate always renders through the shared slot registry.
    if (id && wedding?.templateStagesJson) {
      try {
        const stages = JSON.parse(wedding.templateStagesJson) as Record<string, StageDef>;
        return { stages, keyPrefix: `ta${id}`, stageIds: Object.keys(stages), reveal: true, slotTheme: true };
      } catch {
        return null;
      }
    }
    return null;
  }, [wedding?.templateId, wedding?.templateStagesJson, sectionOrder, draftConfig, itinerary.length, photoBoothEnabled]);

  const canAdjust = isPro && !!layout;
  const canReveal = Boolean(layout?.reveal);
  const stageIds = layout?.stageIds ?? [];
  const activeStage = selectedStage && stageIds.includes(selectedStage) ? selectedStage : stageIds[0];

  // The dock owns config directly (it lives in this tree, not the iframe): '' deletes the key,
  // restoring a stage to its shipped defaults. This is the whole cross-iframe patch protocol,
  // collapsed to a setState now that the panel and draftConfig share a component tree.
  const handleLayoutChange = useCallback((key: string, value: string) => {
    setDraftConfig((prev) => {
      const next = { ...prev };
      if (value === '') delete next[key];
      else next[key] = value;
      return next;
    });
  }, []);

  // Canvas drag/resize (see Layer.tsx's PREVIEW_LAYER_EDIT) lands here — the same patch-and-
  // reserialize AdjustPanel's own sliders already do, just triggered from the preview iframe
  // instead of the dock. The layer always belongs to `activeStage`: every template scopes
  // `editing` to `editor.selectedStage`, so a layer can only be interactive on canvas while its
  // stage is the one the dock has open.
  const patchLayerFromCanvas = useCallback((layerId: string, patch: Partial<LayerModel>) => {
    if (!layout) return;
    const def = layout.stages[activeStage];
    if (!def) return;
    const breakpoint: Breakpoint = device === 'mobile' ? 'mobile' : 'desktop';
    const { layers, bgFit, bgPosition, bgScale, bgSrc } = resolveStage(layout.keyPrefix, def, breakpoint, draftConfig);
    const nextLayers = layers.map((l) => (l.id === layerId ? { ...l, ...patch } : l));
    handleLayoutChange(
      layoutKey(layout.keyPrefix, breakpoint, def.id),
      serializeStage(def, breakpoint, nextLayers, { bgFit, bgPosition, bgScale, bgSrc }),
    );
  }, [layout, activeStage, device, draftConfig, handleLayoutChange]);

  // Opening the dock collapses the left inspector to its icon rail so the centred preview keeps room.
  const toggleAdjust = useCallback(() => {
    setAdjusting((a) => {
      const next = !a;
      setEditorMode(next ? 'collapsed' : 'expanded');
      if (!next) setRevealOverflow(false); // don't leave the clip relaxed after closing the dock
      return next;
    });
  }, []);

  // Upload an image for the Adjust panel (a layer image, or a stage-background replacement). Uses
  // the LAYER_IMAGE slot, which — unlike the portrait/bg slots — never upserts, so a stage can hold
  // many. Returns the /uploads/… URL the layer's `src` / `bgSrc` points at.
  const handleAdjustUpload = useCallback(async (file: File): Promise<string> => {
    if (!weddingId) throw new Error('no wedding');
    const photo = await photoService.upload(weddingId, '', 'Layer image', file, 'COUPLE', TemplateSlots.LAYER_IMAGE);
    return photo.photoUrl;
  }, [weddingId]);

  // Quick-nav chips for the active block, in the same order the groups render.
  const blockChips = useMemo(() => {
    if (activeBlock === 'music') return ['Audio', 'Settings'];
    const groups = schema.groupsFor(activeBlock);
    const ordered = GROUP_ORDER[activeBlock] ?? [];
    const titles = [...ordered.filter((t) => groups.has(t)), ...[...groups.keys()].filter((t) => !ordered.includes(t))];
    const chips: string[] = [];
    for (const t of titles) {
      const chip = chipOf(groups.get(t) ?? []);
      if (chip && !chips.includes(chip)) chips.push(chip);
    }
    return chips;
  }, [schema, activeBlock]);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    setUser(u);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!weddingId) return;
    load();
  }, [weddingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Push draft to iframe. Coalesced to one post per animation frame: dragging an Adjust slider
  // fires setDraftConfig many times a second, and re-serialising the whole payload each tick would
  // make the preview stutter.
  const postFrameRef = useRef(0);
  useEffect(() => {
    if (!wedding) return;
    const payload = {
      wedding: { ...wedding, ...weddingDraft },
      coupleMedia, wishes: SAMPLE_WISHES, photoBoothEnabled,
      customConfig: draftConfig, itinerary,
      // Selection rides along so the preview can outline the layer being edited; the config
      // itself flows through customConfig, one-way — the panel no longer lives in the iframe.
      editor: {
        enabled: adjusting,
        breakpoint: device === 'mobile' ? 'mobile' : 'desktop',
        selectedStage: activeStage,
        selectedLayer,
        revealOverflow: revealOverflow && canReveal,
      },
    };
    payloadRef.current = payload;
    try { localStorage.setItem('preview_draft', JSON.stringify(payload)); } catch {}
    if (postFrameRef.current) return;
    postFrameRef.current = requestAnimationFrame(() => {
      postFrameRef.current = 0;
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'PREVIEW_UPDATE', payload: payloadRef.current }, window.location.origin,
      );
    });
  }, [draftConfig, weddingDraft, coupleMedia, photoBoothEnabled, itinerary, wedding, adjusting, device, activeStage, selectedLayer, revealOverflow, canReveal]);

  // Replay the latest payload when the iframe (re)mounts, and handle canvas-originated selection
  // + drag/resize. Layer.tsx posts these directly (it has no callback prop into this tree — it's
  // the same component rendering on the public invitation, where none of this ever fires).
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'PREVIEW_READY' && payloadRef.current) {
        iframeRef.current?.contentWindow?.postMessage({ type: 'PREVIEW_UPDATE', payload: payloadRef.current }, window.location.origin);
      }
      if (event.data?.type === 'PREVIEW_LAYER_SELECT') {
        setSelectedLayer(event.data.layerId as string);
      }
      if (event.data?.type === 'PREVIEW_LAYER_EDIT') {
        patchLayerFromCanvas(event.data.layerId as string, event.data.patch as Partial<LayerModel>);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [patchLayerFromCanvas]);

  // Keyboard shortcut: Cmd+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); if (isDirty) handleSave(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isDirty]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset active chip + scroll position when block changes
  useEffect(() => {
    setSubSection(blockChips[0] ?? '');
    if (formScrollRef.current) formScrollRef.current.scrollTop = 0;
  }, [activeBlock, blockChips]);

  // Keep active chip in sync as user scrolls the form
  useEffect(() => {
    const container = formScrollRef.current;
    if (!container) return;
    const handler = () => {
      const anchors = Array.from(container.querySelectorAll('[data-chip]')) as HTMLElement[];
      const containerTop = container.getBoundingClientRect().top;
      let active = anchors[0];
      for (const el of anchors) {
        const elTop = el.getBoundingClientRect().top - containerTop;
        if (elTop <= 24) active = el;
        else break;
      }
      if (active) setSubSection(active.dataset.chip ?? '');
    };
    container.addEventListener('scroll', handler, { passive: true });
    return () => container.removeEventListener('scroll', handler);
  }, [activeBlock, editorMode]);

  const load = async () => {
    if (!weddingId) return;
    try {
      const [eventData, media, config, photoBooth, tmpl] = await Promise.all([
        eventService.getById(weddingId),
        photoService.getCoupleMediaByWeddingId(weddingId),
        templateConfigService.getByWeddingId(weddingId),
        eventFeatureService.isFeatureEnabled(weddingId, 'PHOTO_BOOTH'),
        templateService.getActive(),
      ]);
      // AdjustPanel/PreviewPanel/the standalone preview iframe (out of scope for this migration)
      // still expect the legacy `Wedding` shape — adapt once here, at the fetch boundary.
      const w: Wedding = {
        weddingId: eventData.eventId,
        coupleName: eventData.slug,
        brideName: eventData.name1 ?? '',
        groomName: eventData.name2 ?? '',
        weddingDate: eventData.eventDate,
        venue: eventData.venue,
        venueAddress: eventData.venueAddress,
        totalGuests: eventData.totalGuests,
        totalAttending: eventData.totalAttending,
        daysUntilWedding: eventData.daysUntilEvent,
        isActive: eventData.isActive,
        isPublic: eventData.isPublic,
        totalPhotos: eventData.totalPhotos,
        enabledFeaturesCount: eventData.enabledFeaturesCount,
        templateId: eventData.templateId,
        templateName: eventData.templateName ?? '',
        maxPax: eventData.maxPax,
        maxCapacity: eventData.maxCapacity,
        showCapacityWarning: eventData.showCapacityWarning,
        isRsvpOpen: eventData.isRsvpOpen,
        createdByUserId: eventData.createdByUserId,
        createdByEmail: eventData.createdByEmail,
        domain: eventData.domain,
        // Native Event fields — the "Wedding Details" block below reads eventType to decide
        // which naming fields to show (bride/groom vs. honoree vs. event title), and Template8/9
        // read name1/name2/eventTitle/displayName directly instead of brideName/groomName.
        name1: eventData.name1,
        name2: eventData.name2,
        eventTitle: eventData.eventTitle,
        eventType: eventData.eventType,
        displayName: eventData.displayName,
      };
      setTemplates(tmpl);
      setWedding(w);
      setCoupleMedia(media);
      setPhotoBoothEnabled(photoBooth);
      const wd = { brideName: w.brideName, groomName: w.groomName, eventTitle: eventData.eventTitle ?? '', weddingDate: w.weddingDate.slice(0, 16), venue: w.venue, venueAddress: w.venueAddress, maxPax: w.maxPax ?? 0 };
      setWeddingDraft(wd);
      setWeddingSaved(wd);
      const merged = { ...buildDefaultConfig(w.templateId), ...config };
      setDraftConfig(merged);
      setSavedConfig(merged);
      setSectionOrder(parseSectionOrder(merged['section.order']));
    } finally {
      setLoading(false);
    }
  };

  const setConfig = useCallback((key: string, value: string) => {
    setDraftConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    if (!weddingId || !wedding) return;
    setSaving(true);
    try {
      const configToSave = { ...draftConfig, 'section.order': sectionOrder.join(',') };
      const tasks: Promise<unknown>[] = [templateConfigService.save(weddingId, configToSave)];
      if (weddingDirty) {
        tasks.push(eventService.update(weddingId, { name1: weddingDraft.brideName, name2: weddingDraft.groomName, eventTitle: weddingDraft.eventTitle, eventDate: weddingDraft.weddingDate, venue: weddingDraft.venue, venueAddress: weddingDraft.venueAddress, maxPax: weddingDraft.maxPax }));
      }
      await Promise.all(tasks);
      setSavedConfig(configToSave);
      setDraftConfig(configToSave);
      setWeddingSaved({ ...weddingDraft });
    } catch {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchTemplate = async (t: Template) => {
    if (!weddingId || !wedding || t.templateId === wedding.templateId) return;
    setSwitchingTemplate(true);
    try {
      await eventService.updateTemplate(weddingId, t.templateId);
      const updatedWedding = { ...wedding, templateId: t.templateId, templateName: t.templateName };
      setWedding(updatedWedding);
      // The new template's captured "starting design" is applied live at read time, so re-read the
      // (merged) config to pick those inherited keys up — carrying them into draftConfig at their
      // default values so the next save treats them as no-op deltas rather than materializing this
      // template's schema defaults over them. Then keep only what the new template understands: its
      // own defaults, overlaid with existing values for keys it shares, plus its layout blobs.
      const serverConfig = await templateConfigService.getByWeddingId(weddingId);
      const newDefaults = buildDefaultConfig(t.templateId);
      const layoutPrefix = `t${t.templateId}.layout.`;
      const carried = Object.fromEntries(
        Object.entries({ ...draftConfig, ...serverConfig }).filter(
          ([k]) => k in newDefaults || k.startsWith(layoutPrefix),
        ),
      );
      const merged = { ...newDefaults, ...carried };
      setDraftConfig(merged);
      setSavedConfig(merged);
      setSectionOrder(parseSectionOrder(merged['section.order']));
    } catch {
      alert('Failed to switch template.');
    } finally {
      setSwitchingTemplate(false);
    }
  };

  const handleChipClick = (chip: string) => {
    setSubSection(chip);
    const container = formScrollRef.current;
    if (!container) return;
    const el = container.querySelector(`[data-chip="${chip}"]`) as HTMLElement | null;
    if (!el) return;
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    container.scrollTo({ top: container.scrollTop + elRect.top - containerRect.top - 12, behavior: 'smooth' });
  };

  const selectBlock = (block: BlockId, order: string[] = sectionOrder) => {
    setActiveBlock(block);
    if (editorMode === 'collapsed') setEditorMode('expanded');
    iframeRef.current?.contentWindow?.postMessage({ type: 'PREVIEW_SCROLL', fraction: scrollFractionFor(block, order) }, window.location.origin);
  };

  const handleMoveBlock = (code: string, dir: 'up' | 'down') => {
    const idx = sectionOrder.indexOf(code);
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= sectionOrder.length) return;
    const next = [...sectionOrder];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setSectionOrder(next);
    setConfig('section.order', next.join(','));
  };

  const handleAddBlock = (code: string) => {
    if (sectionOrder.includes(code)) return;
    const next = [...sectionOrder, code];
    setSectionOrder(next);
    setConfig('section.order', next.join(','));
    selectBlock(code as BlockId, next);
  };

  const handleRemoveBlock = (code: string) => {
    const next = sectionOrder.filter((c) => c !== code);
    setSectionOrder(next);
    setConfig('section.order', next.join(','));
    if (activeBlock === code) setActiveBlock('details');
  };

  const handlePhotoDrop = async (slot: number, file: File) => {
    if (!weddingId) return;
    setUploadingSlot(slot);
    try {
      const uploaded = await photoService.upload(weddingId, '', '', file, 'COUPLE', slot);
      setCoupleMedia((prev) => [...prev.filter((p) => p.templateSlot !== slot), uploaded]);
    } catch { alert('Upload failed.'); }
    finally { setUploadingSlot(null); }
  };

  const handlePhotoRemove = async (photo: Photo) => {
    try {
      await photoService.delete(photo.photoId);
      setCoupleMedia((prev) => prev.filter((p) => p.photoId !== photo.photoId));
    } catch { alert('Could not remove photo.'); }
  };

  const cycleEditorMode = () => {
    setEditorMode(m => m === 'expanded' ? 'collapsed' : m === 'collapsed' ? 'hidden' : 'expanded');
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>Loading editor…</p></div>;
  }
  if (!wedding) return null;

  const showPortraitSlots = [3, 4].includes(wedding.templateId);
  const portraitSlots = wedding.templateId === 4 ? PORTRAIT_SLOTS_T4 : PORTRAIT_SLOTS_T3;
  const availableBlocks = SECTION_BLOCKS.filter((b) => !sectionOrder.includes(b.code));
  const blockInfo = BLOCK_INFO[activeBlock] ?? BLOCK_INFO.details;

  // ── Schema-driven inspector ─────────────────────────────────────────────────
  // Every control below comes from getConfigFields(templateId, role). There are no
  // `templateId === N` branches: if a template's schema doesn't declare a key, the control
  // for it simply isn't there. Hand-written widgets (wedding-record inputs, the itinerary
  // editor, photo slots, the template library) are injected into named groups.

  // Renders the colour / shadow / toggle fields that attach to a given anchor, inside its card.
  const renderAttachments = (anchor: string) =>
    schema.attachmentsFor(anchor).map((f) => {
      const value = draftConfig[f.key] ?? f.defaultValue;
      if (f.fieldType === 'color') {
        return (
          <ColorRow
            key={f.key}
            value={draftConfig[f.key] ?? ''}
            onChange={(v) => setConfig(f.key, v)}
            onClear={() => setConfig(f.key, '')}
            presets={f.presets ? PRESETS[f.presets] : undefined}
          />
        );
      }
      if (isShadowField(f)) {
        return <ShadowSeg key={f.key} value={value || 'none'} onChange={(v) => setConfig(f.key, v)} options={f.options} />;
      }
      if (f.fieldType === 'boolean') {
        return (
          <div key={f.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border-subtle)' }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-ui)', color: 'var(--text-strong)' }}>{f.label}</p>
              {f.hint && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'var(--font-ui)' }}>{f.hint}</p>}
            </div>
            <ToggleSwitch value={value === 'true'} onChange={(v) => setConfig(f.key, v ? 'true' : 'false')} />
          </div>
        );
      }
      return null;
    });

  // One schema field → the matching primitive.
  const renderField = (f: TemplateConfigField) => {
    const value = draftConfig[f.key] ?? f.defaultValue;

    switch (f.fieldType) {
      case 'text':
        return (
          <FieldCard key={f.key} label={f.label} count={value.length} max={f.maxLength}>
            <input
              value={value}
              onChange={(e) => setConfig(f.key, e.target.value)}
              maxLength={f.maxLength}
              placeholder={f.defaultValue}
              style={BARE_INPUT}
            />
            {f.hint && <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'var(--font-ui)' }}>{f.hint}</p>}
            {renderAttachments(f.key)}
          </FieldCard>
        );

      case 'richtext':
        return (
          <div key={f.key}>
            <FieldLabel hint={f.hint}>{f.label}</FieldLabel>
            <RichTextEditor value={draftConfig[f.key] ?? ''} onChange={(html) => setConfig(f.key, html)} maxLength={f.maxLength} />
          </div>
        );

      case 'boolean':
        return (
          <div key={f.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-ui)', color: 'var(--text-strong)' }}>{f.label}</p>
              {f.hint && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'var(--font-ui)' }}>{f.hint}</p>}
            </div>
            <ToggleSwitch value={value === 'true'} onChange={(v) => setConfig(f.key, v ? 'true' : 'false')} />
          </div>
        );

      case 'select':
        if (isShadowField(f)) {
          return (
            <FieldCard key={f.key} label={f.label}>
              <ShadowSeg value={value || 'none'} onChange={(v) => setConfig(f.key, v)} options={f.options} />
            </FieldCard>
          );
        }
        return (
          <div key={f.key} style={{ flex: 1 }}>
            <FieldLabel hint={f.hint}>{f.label}</FieldLabel>
            <SelectField value={value} options={f.options ?? []} labels={f.optionLabels} onChange={(v) => setConfig(f.key, v)} />
          </div>
        );

      case 'color':
        return (
          <FieldCard key={f.key} label={f.label}>
            {f.hint && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', margin: '0 0 8px' }}>{f.hint}</p>}
            <ColorRow
              value={draftConfig[f.key] ?? ''}
              onChange={(v) => setConfig(f.key, v)}
              onClear={() => setConfig(f.key, f.defaultValue)}
              presets={f.presets ? PRESETS[f.presets] : undefined}
            />
          </FieldCard>
        );

      case 'image':
        return (
          <BgImageField
            key={f.key}
            configKey={f.key}
            label={f.label}
            value={draftConfig[f.key] ?? ''}
            weddingId={weddingId!}
            onChange={(url) => setConfig(f.key, url)}
          />
        );

      default:
        return null;
    }
  };

  // A wedding-record input (not a config key) that can still host schema attachments.
  const recordField = (
    anchor: string,
    label: string,
    value: string,
    max: number,
    onChange: (v: string) => void,
    type?: string,
    placeholder?: string,
  ) => (
    <FieldCard key={anchor} label={label} count={type ? undefined : value.length} max={max}>
      <input
        type={type ?? 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={max}
        placeholder={placeholder}
        style={BARE_INPUT}
      />
      {renderAttachments(anchor)}
    </FieldCard>
  );

  // Hand-written widgets, injected into the named group they belong to.
  const groupExtras = (block: BlockId, title: string): { before?: React.ReactNode; after?: React.ReactNode } => {
    if (block === 'details' && title === 'Wedding Details') {
      // Type-aware: WEDDING keeps both name fields; PARTY has a single honoree name (still stored
      // in weddingDraft.brideName — minimal plumbing disruption, same slot the load/save mapping
      // above already uses); CEREMONY has no individual names, just an event title. The anchors
      // used here ('event.name1' / 'event.eventTitle') are what TEMPLATE8/9_EXTRA_FIELDS' colour
      // + shadow controls attach to in templateConfigSchema.ts — renderAttachments resolves those
      // by this exact string, so no separate wiring is needed for that gap to close.
      const eventType = wedding.eventType ?? 'WEDDING';
      return {
        before: (
          <>
            {eventType === 'WEDDING' && (
              <>
                {recordField('wedding.brideName', "Bride's Name", weddingDraft.brideName, 100, (v) => setWeddingDraft((d) => ({ ...d, brideName: v })), undefined, "Bride's full name")}
                {recordField('wedding.groomName', "Groom's Name", weddingDraft.groomName, 100, (v) => setWeddingDraft((d) => ({ ...d, groomName: v })), undefined, "Groom's full name")}
              </>
            )}
            {eventType === 'PARTY' &&
              recordField('event.name1', "Honoree's Name", weddingDraft.brideName, 100, (v) => setWeddingDraft((d) => ({ ...d, brideName: v })), undefined, "e.g. Aiman")}
            {eventType === 'CEREMONY' &&
              recordField('event.eventTitle', 'Event Title', weddingDraft.eventTitle, 150, (v) => setWeddingDraft((d) => ({ ...d, eventTitle: v })), undefined, "e.g. Ali's Aqiqah")}
            {recordField('wedding.weddingDate', eventType === 'WEDDING' ? 'Wedding Date & Time' : 'Event Date & Time', weddingDraft.weddingDate, 16, (v) => setWeddingDraft((d) => ({ ...d, weddingDate: v })), 'datetime-local')}
            {recordField('wedding.venue', 'Venue', weddingDraft.venue, 200, (v) => setWeddingDraft((d) => ({ ...d, venue: v })), undefined, 'e.g. Dewan Seri Mayang')}
            {recordField('wedding.venueAddress', 'Venue Address', weddingDraft.venueAddress, 500, (v) => setWeddingDraft((d) => ({ ...d, venueAddress: v })))}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-ui)', color: 'var(--text-strong)' }}>Max Pax per RSVP</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'var(--font-ui)' }}>Set to 0 for no limit</p>
              </div>
              <input type="number" min={0} value={weddingDraft.maxPax} onChange={(e) => setWeddingDraft((d) => ({ ...d, maxPax: parseInt(e.target.value) || 0 }))}
                style={{ width: 80, padding: '6px 10px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', textAlign: 'right', color: 'var(--text-body)', background: 'var(--surface-card)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </>
        ),
      };
    }

    if (block === 'details' && title === 'Change Template') {
      // A WEDDING event shouldn't be offered a PARTY/CEREMONY-only template to switch to (and
      // vice versa) — same matchesEvent gate the picker and admin create forms use.
      const switchableTemplates = templates.filter((t) => matchesEvent(t, wedding.eventType ?? 'WEDDING'));
      return {
        before: (
          <>
            {switchingTemplate && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>Switching template…</p>}
            <TemplateLibrary templates={switchableTemplates} userTier={user?.tier ?? 'FREE'} currentTemplateId={wedding.templateId} onSelect={handleSwitchTemplate} compact />
          </>
        ),
      };
    }

    if (block === 'itinerary' && title === 'Schedule / Itinerary') {
      return { after: <ItineraryEditor weddingId={weddingId!} onItemsChange={setItinerary} /> };
    }

    if (block === 'photobooth' && title === 'Portrait & Gallery Slots') {
      return {
        before: (
          <>
            {wedding.templateId === 4 && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', lineHeight: 1.6, margin: 0 }}>
                <strong>Hero Background</strong> appears full-screen behind the couple&apos;s names.
              </p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {portraitSlots.map(({ slot, label }) => (
                <PhotoDropZone key={slot} slot={slot} label={label}
                  photo={coupleMedia.find((m) => m.templateSlot === slot)}
                  uploading={uploadingSlot === slot}
                  onDrop={handlePhotoDrop} onRemove={handlePhotoRemove} />
              ))}
            </div>
          </>
        ),
      };
    }

    return {};
  };

  const renderBlock = (block: BlockId) => {
    const groups = schema.groupsFor(block);
    const synthetic = (SYNTHETIC_GROUPS[block] ?? []).filter((title) =>
      // the photo slots only exist on templates that have portrait slots
      title === 'Portrait & Gallery Slots' ? showPortraitSlots : templates.length > 0,
    );

    const ordered = GROUP_ORDER[block] ?? [];
    const titles = [
      ...ordered.filter((t) => groups.has(t) || synthetic.includes(t)),
      ...[...groups.keys()].filter((t) => !ordered.includes(t)),
    ];

    return titles.map((title) => {
      const groupFields = groups.get(title) ?? [];
      const extras = groupExtras(block, title);
      // 'Wedding Details' is the group's technical id (from names.ampersand.color's `group` key,
      // used for the schema.groupsFor lookup above) — the displayed heading is type-aware.
      const displayTitle =
        title === 'Wedding Details'
          ? wedding.eventType === 'PARTY' ? 'Party Details'
            : wedding.eventType === 'CEREMONY' ? 'Ceremony Details'
            : 'Wedding Details'
          : title;
      return (
        <Group key={title} title={displayTitle} chipAnchor={chipOf(groupFields)} defaultOpen={title !== 'Change Template'}>
          {extras.before}
          {groupFields.map(renderField)}
          {extras.after}
        </Group>
      );
    });
  };

  const inspectorContent =
    activeBlock === 'music' ? (
      <MusicTab
        url={draftConfig['music.url'] ?? ''}
        loop={draftConfig['music.loop'] !== 'false'}
        weddingId={weddingId!}
        onUrlChange={(v) => setConfig('music.url', v)}
        onLoopChange={(v) => setConfig('music.loop', v ? 'true' : 'false')}
      />
    ) : (
      <>{renderBlock(activeBlock)}</>
    );

  return (
    <div style={{ height: '100vh', background: 'var(--surface-app)', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'var(--font-ui)' }}>

      {/* ── Page header ── */}
      <div style={{ height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-card)' }}>
        <button onClick={() => router.push('/organizer-admin')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-ui)', padding: '6px 10px', borderRadius: 6, transition: 'background 150ms' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-strong)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}>
          <Icon name="arrow-left" size={14} /> Back
        </button>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, margin: 0, color: 'var(--text-strong)', letterSpacing: 'var(--tracking-tight)', whiteSpace: 'nowrap' }}>
          Customize Template
        </h1>

        <div style={{ paddingLeft: 12, borderLeft: '1px solid var(--border-subtle)', color: 'var(--text-subtle)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap' }} className="hide-narrow">
          {blockInfo.eyebrow.split(' · ').map((seg, i, arr) => (
            <span key={i}>{i > 0 && ' · '}<b style={{ color: i === arr.length - 1 ? 'var(--text-strong)' : undefined, fontWeight: i === arr.length - 1 ? 600 : 400 }}>{seg}</b></span>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Undo/Redo (visual only for now) */}
        <button title="Undo" style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent', color: 'var(--text-muted)', transition: 'background 150ms' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
          <Icon name="undo" size={14} />
        </button>
        <button title="Redo" style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent', color: 'var(--text-muted)', transition: 'background 150ms' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
          <Icon name="redo" size={14} />
        </button>

        {canAdjust && (
          <Button variant={adjusting ? 'secondary' : 'primary'} tone="brand" size="sm"
            onClick={toggleAdjust} style={{ borderRadius: 999 }}>
            <Icon name="sliders" size={14} /> {adjusting ? 'Close Adjust' : 'Adjust'}
          </Button>
        )}

        <div style={{ width: 1, height: 22, background: 'var(--border-subtle)', margin: '0 4px' }} />

        {wedding && (
          <a href={`/${urlSegmentForEventType(wedding.eventType)}/${wedding.coupleName}`} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-ui)', padding: '9px 16px', borderRadius: 999, textDecoration: 'none', transition: 'background 150ms' }}
            className="hide-narrow"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-strong)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}>
            <Icon name="eye" size={14} /> Preview
          </a>
        )}

        <Button variant="secondary" tone="neutral" size="sm"
          onClick={() => { if (wedding?.coupleName) navigator.clipboard?.writeText(`${window.location.origin}/${urlSegmentForEventType(wedding.eventType)}/${wedding.coupleName}`); }}
          style={{ borderRadius: 999 }}>
          <Icon name="share" size={14} /> Share
        </Button>

        <Button variant="primary" tone="brand" size="sm" onClick={handleSave} disabled={saving || !isDirty} loading={saving} style={{ borderRadius: 999 }}>
          <Icon name="save" size={14} /> {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      {/* ── Body: Editor panel | Preview panel ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* Left: Editor panel (rail + form) */}
        <aside style={{
          display: 'flex', flexShrink: 0,
          background: 'var(--surface-card)',
          borderRight: '1px solid var(--border-subtle)',
          width: editorMode === 'expanded' ? 380 : editorMode === 'collapsed' ? 60 : 0,
          transition: 'width 280ms cubic-bezier(0.22, 1, 0.36, 1)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 10,
        }}>
          {/* Section rail (always visible when not hidden) */}
          {editorMode !== 'hidden' && (
            <SectionRail
              mode={editorMode}
              onToggle={cycleEditorMode}
              activeBlock={activeBlock}
              sectionOrder={sectionOrder}
              onSelectBlock={selectBlock}
              hasMusic={schema.has('music.url')}
            />
          )}

          {/* Form area (only when expanded) */}
          {editorMode === 'expanded' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, width: 320 }}>
              {/* Form header */}
              <div style={{ padding: '16px 20px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: 600, fontFamily: 'var(--font-ui)' }}>
                  {blockInfo.eyebrow}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, lineHeight: 1.1, marginTop: 4, letterSpacing: '0.01em', color: 'var(--text-strong)' }}>
                  {blockInfo.title}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12.5, marginTop: 4, fontFamily: 'var(--font-ui)' }}>
                  {blockInfo.subtitle}
                </div>
              </div>

              {/* Sub-section chips */}
              <div style={{ display: 'flex', gap: 4, padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {blockChips.map(chip => (
                  <button key={chip}
                    onClick={() => handleChipClick(chip)}
                    style={{
                      padding: '5px 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 500,
                      color: subSection === chip ? '#fff' : 'var(--text-muted)',
                      background: subSection === chip ? 'var(--text-strong)' : 'transparent',
                      border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-ui)',
                      transition: 'all 150ms',
                    }}
                    onMouseEnter={e => { if (subSection !== chip) (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; }}
                    onMouseLeave={e => { if (subSection !== chip) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    {chip}
                  </button>
                ))}
              </div>

              {/* Form scroll area */}
              <div ref={formScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 100px', scrollBehavior: 'smooth' }}
                className="form-scroll-area">
                {inspectorContent}

                {/* Add / remove section blocks (only for welcome/walimah/etc blocks, not details/music) */}
                {activeBlock !== 'details' && activeBlock !== 'music' && (
                  <div style={{ marginTop: 12 }}>
                    {availableBlocks.length > 0 && (
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setAddMenuOpen(o => !o)}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 11px', border: '1.5px dashed var(--border-default)', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', cursor: 'pointer', transition: 'var(--transition-control)' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          <Icon name="plus" size={14} /> Add section
                        </button>
                        {addMenuOpen && (
                          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', padding: 6, zIndex: 30, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {availableBlocks.map(b => (
                              <button key={b.code} onClick={() => { handleAddBlock(b.code); setAddMenuOpen(false); }}
                                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'transparent', color: 'var(--text-body)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', cursor: 'pointer', textAlign: 'left' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                                <Icon name={b.icon} size={15} /> {b.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {sectionOrder.includes(activeBlock) && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <button
                          onClick={() => handleMoveBlock(activeBlock, 'up')}
                          disabled={sectionOrder.indexOf(activeBlock) === 0}
                          title="Move section up"
                          style={{ flex: 1, padding: '7px 0', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', cursor: sectionOrder.indexOf(activeBlock) === 0 ? 'default' : 'pointer', opacity: sectionOrder.indexOf(activeBlock) === 0 ? 0.4 : 1, transition: 'background 150ms', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                          onMouseEnter={e => { if (sectionOrder.indexOf(activeBlock) !== 0) e.currentTarget.style.background = 'var(--surface-sunken)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                          ↑ Move up
                        </button>
                        <button
                          onClick={() => handleMoveBlock(activeBlock, 'down')}
                          disabled={sectionOrder.indexOf(activeBlock) === sectionOrder.length - 1}
                          title="Move section down"
                          style={{ flex: 1, padding: '7px 0', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', cursor: sectionOrder.indexOf(activeBlock) === sectionOrder.length - 1 ? 'default' : 'pointer', opacity: sectionOrder.indexOf(activeBlock) === sectionOrder.length - 1 ? 0.4 : 1, transition: 'background 150ms', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                          onMouseEnter={e => { if (sectionOrder.indexOf(activeBlock) !== sectionOrder.length - 1) e.currentTarget.style.background = 'var(--surface-sunken)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                          ↓ Move down
                        </button>
                        <button onClick={() => handleRemoveBlock(activeBlock)}
                          style={{ padding: '7px 14px', border: '1px solid var(--danger-border, #fca5a5)', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--danger)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', cursor: 'pointer', transition: 'background 150ms', display: 'flex', alignItems: 'center', gap: 4 }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-subtle, #fef2f2)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                          <Icon name="x" size={13} /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sticky save bar */}
          {editorMode === 'expanded' && (
            <SaveBar dirty={isDirty} saving={saving} onSave={handleSave} />
          )}
        </aside>

        {/* Centre: Preview panel */}
        <PreviewPanel
          iframeRef={iframeRef}
          device={device}
          setDevice={d => { setDevice(d); setManualZoom(null); }}
          manualZoom={manualZoom}
          setManualZoom={setManualZoom}
          activeBlock={activeBlock}
          onSelectBlock={block => selectBlock(block as BlockId)}
          sectionOrder={sectionOrder}
          editorMode={editorMode}
          onShowEditor={() => setEditorMode('expanded')}
          wedding={wedding}
          revealOverflow={canAdjust && adjusting && revealOverflow && canReveal}
        />

        {/* Right: stage-layout Adjust dock (PRO, Template 7). Config flows straight into
            draftConfig; the Save button persists it like any other change. */}
        {canAdjust && adjusting && activeStage && (
          <aside style={{
            width: 340, flexShrink: 0,
            borderLeft: '1px solid var(--border-subtle)',
            background: 'var(--surface-card)',
            display: 'flex', flexDirection: 'column', minHeight: 0,
          }}>
            <AdjustPanel
              stages={layout!.stages}
              keyPrefix={layout!.keyPrefix}
              stageIds={stageIds}
              breakpoint={device === 'mobile' ? 'mobile' : 'desktop'}
              config={draftConfig}
              onLayoutChange={handleLayoutChange}
              selectedStage={activeStage}
              selectedLayer={selectedLayer}
              onSelectStage={(id) => {
                setSelectedStage(id);
                setSelectedLayer(undefined);
                // Scroll the preview iframe to the picked stage (it can't reach its own DOM here).
                iframeRef.current?.contentWindow?.postMessage(
                  { type: 'PREVIEW_SCROLL', sectionId: id }, window.location.origin,
                );
              }}
              onSelectLayer={setSelectedLayer}
              onClose={toggleAdjust}
              canReveal={canReveal}
              revealOverflow={revealOverflow}
              onToggleReveal={() => setRevealOverflow((r) => !r)}
              onUploadImage={handleAdjustUpload}
              slotTheme={Boolean(layout?.slotTheme)}
              slotThemeAccentDefault={wedding.templateId === 7 ? '#3d3833' : '#2b2a28'}
            />
          </aside>
        )}
      </div>

      <style>{`
        .hide-narrow { display: flex; }
        @media (max-width: 1180px) { .hide-narrow { display: none !important; } }
        .form-scroll-area::-webkit-scrollbar { width: 6px; }
        .form-scroll-area::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 999px; }
      `}</style>
    </div>
  );
}
