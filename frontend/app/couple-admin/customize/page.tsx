'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import {
  weddingService,
  photoService,
  audioService,
  templateConfigService,
  templateService,
  weddingFeatureService,
  itineraryService,
  Wedding,
  Photo,
  Template,
  ItineraryItem,
  TemplateSlots,
} from '@/lib/api';
import { TemplateLibrary } from '@/components/templates/TemplateLibrary';
import { buildDefaultConfig } from '@/lib/templateConfigSchema';
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

// Block metadata for form header
const BLOCK_INFO: Record<string, { eyebrow: string; title: string; subtitle: string; chips: string[] }> = {
  details:    { eyebrow: 'Global', title: 'Details & Theme', subtitle: 'Wedding info and template settings.', chips: ['Layout', 'Details', 'Display', 'Footer'] },
  welcome:    { eyebrow: 'Section · Cover', title: 'Welcome screen', subtitle: 'The first thing guests see when they open the invitation.', chips: ['Content', 'Style', 'Background'] },
  walimah:    { eyebrow: 'Section · Ceremony', title: 'The ceremony', subtitle: 'Ceremony details and walimah text.', chips: ['Content', 'Style'] },
  rsvp:       { eyebrow: 'Section · RSVP', title: 'RSVP', subtitle: 'Guest confirmation section.', chips: ['RSVP'] },
  itinerary:  { eyebrow: 'Section · Itinerary', title: 'Schedule', subtitle: 'Event timeline and programme.', chips: ['Schedule', 'Background'] },
  wishes:     { eyebrow: 'Section · Wishes', title: 'Wishes & Guestbook', subtitle: 'Messages from your guests.', chips: ['Content'] },
  photobooth: { eyebrow: 'Section · Photo Booth', title: 'Photo Booth', subtitle: 'Guest photo gallery.', chips: ['Content', 'Media', 'Background'] },
  music:      { eyebrow: 'Background Music', title: 'Music & playlist', subtitle: 'Audio that plays while guests browse.', chips: ['Audio', 'Settings'] },
};

// Preset color swatches per field type
const PRESETS = {
  bride:   ['#9a244f', '#b0506b', '#6f5bb5', '#1a1718', '#b8945a', '#ffffff'],
  groom:   ['#1a1718', '#6f5bb5', '#0a3a5c', '#2d6a4f', '#4a90d9', '#b8945a'],
  amp:     ['#1a1718', '#b8945a', '#6f5bb5', '#ffffff', '#9a244f', '#cccccc'],
  heading: ['#ffffff', '#f4d9e2', '#e8e2f4', '#b8945a', '#1a1718', '#9a244f'],
  date:    ['#ffffff', '#d6c4a3', '#b8945a', '#9a244f', '#6f5bb5', '#1a1718'],
  venue:   ['#ffffff', '#d6c4a3', '#b8945a', '#6f5bb5', '#9a244f', '#1a1718'],
  body:    ['#ffffff', '#f0ebe0', '#d6c4a3', '#b8945a', '#1a1718', '#6b6469'],
  generic: ['#ffffff', '#1a1718', '#b8945a', '#6f5bb5', '#9a244f', '#6b6469'],
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

function SectionRail({ mode, onToggle, activeBlock, sectionOrder, onSelectBlock }: {
  mode: EditorMode;
  onToggle: () => void;
  activeBlock: BlockId;
  sectionOrder: string[];
  onSelectBlock: (block: BlockId) => void;
}) {
  const railItems = [
    RAIL_SECTIONS[0], // details always first
    ...sectionOrder.map(code => RAIL_SECTIONS.find(s => s.id === code)).filter(Boolean) as typeof RAIL_SECTIONS,
    { id: 'music' as BlockId, label: 'Music', icon: 'music' }, // music always last
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

  const emptyWed = { brideName: '', groomName: '', weddingDate: '', venue: '', venueAddress: '', maxPax: 0 };
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

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    setUser(u);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!weddingId) return;
    load();
  }, [weddingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Push draft to iframe
  useEffect(() => {
    if (!wedding) return;
    const payload = {
      wedding: { ...wedding, ...weddingDraft },
      coupleMedia, wishes: SAMPLE_WISHES, photoBoothEnabled,
      customConfig: draftConfig, itinerary,
    };
    payloadRef.current = payload;
    try { localStorage.setItem('preview_draft', JSON.stringify(payload)); } catch {}
    iframeRef.current?.contentWindow?.postMessage({ type: 'PREVIEW_UPDATE', payload }, window.location.origin);
  }, [draftConfig, weddingDraft, coupleMedia, photoBoothEnabled, itinerary, wedding]);

  // Replay to iframe on PREVIEW_READY
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'PREVIEW_READY' && payloadRef.current) {
        iframeRef.current?.contentWindow?.postMessage({ type: 'PREVIEW_UPDATE', payload: payloadRef.current }, window.location.origin);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

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
    const firstChip = BLOCK_INFO[activeBlock]?.chips[0] ?? '';
    setSubSection(firstChip);
    if (formScrollRef.current) formScrollRef.current.scrollTop = 0;
  }, [activeBlock]);

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
      const [w, media, config, photoBooth, tmpl] = await Promise.all([
        weddingService.getById(weddingId),
        photoService.getCoupleMediaByWeddingId(weddingId),
        templateConfigService.getByWeddingId(weddingId),
        weddingFeatureService.isFeatureEnabled(weddingId, 'PHOTO_BOOTH'),
        templateService.getActive(),
      ]);
      setTemplates(tmpl);
      setWedding(w);
      setCoupleMedia(media);
      setPhotoBoothEnabled(photoBooth);
      const wd = { brideName: w.brideName, groomName: w.groomName, weddingDate: w.weddingDate.slice(0, 16), venue: w.venue, venueAddress: w.venueAddress, maxPax: w.maxPax ?? 0 };
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
        tasks.push(weddingService.update(weddingId, { brideName: weddingDraft.brideName, groomName: weddingDraft.groomName, weddingDate: weddingDraft.weddingDate, venue: weddingDraft.venue, venueAddress: weddingDraft.venueAddress, maxPax: weddingDraft.maxPax }));
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
      await weddingService.updateTemplate(weddingId, t.templateId);
      const updatedWedding = { ...wedding, templateId: t.templateId, templateName: t.templateName };
      setWedding(updatedWedding);
      const newDefaults = buildDefaultConfig(t.templateId);
      const merged = { ...newDefaults, ...draftConfig };
      setDraftConfig(merged);
      setSavedConfig(merged);
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

  // Inspector content per block
  const inspectorContent = (
    <>
      {/* ═══════════════ DETAILS & THEME ═══════════════ */}
      {activeBlock === 'details' && (
        <>
          <Group title="Invitation Layout" chipAnchor="Layout">
            <FieldCard label="Layout Style">
              <SelectField value={draftConfig['invite.layout'] ?? 'classic'} options={['classic', 'minimal', 'ornate']} onChange={v => setConfig('invite.layout', v)} />
            </FieldCard>
          </Group>

          <Group title="Wedding Details" count={2} chipAnchor="Details">
            <FieldCard label="Bride's Name" count={weddingDraft.brideName.length} max={100}>
              <input className="field-text-input" value={weddingDraft.brideName} onChange={e => setWeddingDraft(d => ({ ...d, brideName: e.target.value }))} placeholder="Bride's full name" maxLength={100}
                style={{ width: '100%', fontSize: 14, fontWeight: 500, color: 'var(--text-strong)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-ui)', padding: '2px 0' }} />
              {wedding.templateId === 5 && (
                <ColorRow value={draftConfig['names.bride.color'] ?? ''} onChange={v => setConfig('names.bride.color', v)} onClear={() => setConfig('names.bride.color', '')} presets={PRESETS.bride} />
              )}
              {wedding.templateId === 5 && (
                <ShadowSeg value={draftConfig['names.bride.shadow'] ?? 'none'} onChange={v => setConfig('names.bride.shadow', v)} options={['none', 'soft', 'strong', 'glow']} />
              )}
            </FieldCard>

            <FieldCard label="Groom's Name" count={weddingDraft.groomName.length} max={100}>
              <input className="field-text-input" value={weddingDraft.groomName} onChange={e => setWeddingDraft(d => ({ ...d, groomName: e.target.value }))} placeholder="Groom's full name" maxLength={100}
                style={{ width: '100%', fontSize: 14, fontWeight: 500, color: 'var(--text-strong)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-ui)', padding: '2px 0' }} />
              {wedding.templateId === 5 && (
                <ColorRow value={draftConfig['names.groom.color'] ?? ''} onChange={v => setConfig('names.groom.color', v)} onClear={() => setConfig('names.groom.color', '')} presets={PRESETS.groom} />
              )}
              {wedding.templateId === 5 && (
                <ShadowSeg value={draftConfig['names.groom.shadow'] ?? 'none'} onChange={v => setConfig('names.groom.shadow', v)} options={['none', 'soft', 'strong', 'glow']} />
              )}
            </FieldCard>

            {wedding.templateId === 5 && (
              <FieldCard label="Ampersand (&) Color">
                <ColorRow value={draftConfig['names.ampersand.color'] ?? ''} onChange={v => setConfig('names.ampersand.color', v)} onClear={() => setConfig('names.ampersand.color', '')} presets={PRESETS.amp} />
              </FieldCard>
            )}

            <FieldCard label="Wedding Date & Time">
              <input type="datetime-local" value={weddingDraft.weddingDate} onChange={e => setWeddingDraft(d => ({ ...d, weddingDate: e.target.value }))}
                style={{ width: '100%', fontSize: 14, fontWeight: 500, color: 'var(--text-strong)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-ui)', padding: '2px 0' }} />
              {wedding.templateId === 5 && (
                <ColorRow value={draftConfig['date.color'] ?? ''} onChange={v => setConfig('date.color', v)} onClear={() => setConfig('date.color', '')} presets={PRESETS.date} />
              )}
            </FieldCard>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-ui)', color: 'var(--text-strong)' }}>Add to Calendar button</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'var(--font-ui)' }}>Guests can save the date in one tap</p>
              </div>
              <ToggleSwitch value={draftConfig['general.showAddToCalendar'] === 'true'} onChange={v => setConfig('general.showAddToCalendar', v ? 'true' : 'false')} />
            </div>

            <FieldCard label="Venue" count={weddingDraft.venue.length} max={200}>
              <input className="field-text-input" value={weddingDraft.venue} onChange={e => setWeddingDraft(d => ({ ...d, venue: e.target.value }))} placeholder="e.g. Dewan Seri Mayang" maxLength={200}
                style={{ width: '100%', fontSize: 14, fontWeight: 500, color: 'var(--text-strong)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-ui)', padding: '2px 0' }} />
              {wedding.templateId === 5 && (
                <ColorRow value={draftConfig['venue.color'] ?? ''} onChange={v => setConfig('venue.color', v)} onClear={() => setConfig('venue.color', '')} presets={PRESETS.venue} />
              )}
            </FieldCard>

            <FieldCard label="Venue Address" count={weddingDraft.venueAddress.length} max={500}>
              <input value={weddingDraft.venueAddress} onChange={e => setWeddingDraft(d => ({ ...d, venueAddress: e.target.value }))} maxLength={500}
                style={{ width: '100%', fontSize: 14, fontWeight: 500, color: 'var(--text-strong)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-ui)', padding: '2px 0' }} />
            </FieldCard>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-ui)', color: 'var(--text-strong)' }}>Show venue map</p>
              <ToggleSwitch value={draftConfig['general.showVenueMap'] === 'true'} onChange={v => setConfig('general.showVenueMap', v ? 'true' : 'false')} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-ui)', color: 'var(--text-strong)' }}>Max Pax per RSVP</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'var(--font-ui)' }}>Set to 0 for no limit</p>
              </div>
              <input type="number" min={0} value={weddingDraft.maxPax} onChange={e => setWeddingDraft(d => ({ ...d, maxPax: parseInt(e.target.value) || 0 }))}
                style={{ width: 80, padding: '6px 10px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', textAlign: 'right', color: 'var(--text-body)', background: 'var(--surface-card)', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand)'; }} onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; }} />
            </div>
          </Group>

          <Group title="Display" chipAnchor="Display">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-ui)', color: 'var(--text-strong)' }}>Bride&apos;s name first</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'var(--font-ui)' }}>Toggle to put groom&apos;s name first</p>
              </div>
              <ToggleSwitch value={draftConfig['general.brideFirst'] !== 'false'} onChange={v => setConfig('general.brideFirst', v ? 'true' : 'false')} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-ui)', color: 'var(--text-strong)' }}>Show Islamic (Hijri) Date</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'var(--font-ui)' }}>Auto-calculated from wedding date</p>
              </div>
              <ToggleSwitch value={draftConfig['general.showIslamicDate'] === 'true'} onChange={v => setConfig('general.showIslamicDate', v ? 'true' : 'false')} />
            </div>
          </Group>

          <Group title="Footer" chipAnchor="Footer">
            <FieldCard label="Footer Tagline" count={draftConfig['footer.tagline']?.length ?? 0} max={80}>
              <input value={draftConfig['footer.tagline'] ?? ''} onChange={e => setConfig('footer.tagline', e.target.value)} maxLength={80} placeholder="Made with love for our special day"
                style={{ width: '100%', fontSize: 14, fontWeight: 500, color: 'var(--text-strong)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-ui)', padding: '2px 0' }} />
              {wedding.templateId === 5 && (
                <ColorRow value={draftConfig['footer.tagline.color'] ?? ''} onChange={v => setConfig('footer.tagline.color', v)} onClear={() => setConfig('footer.tagline.color', '')} presets={PRESETS.generic} />
              )}
            </FieldCard>
          </Group>

          {templates.length > 0 && (
            <Group title="Change Template" defaultOpen={false}>
              {switchingTemplate && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>Switching template…</p>}
              <TemplateLibrary templates={templates} userTier={user?.tier ?? 'FREE'} currentTemplateId={wedding.templateId} onSelect={handleSwitchTemplate} compact />
            </Group>
          )}
        </>
      )}

      {/* ═══════════════ COVER / WELCOME ═══════════════ */}
      {activeBlock === 'welcome' && (
        <>
          <Group title="Heading" chipAnchor="Content">
            <FieldCard label="Heading Text" count={draftConfig['invite.heading']?.length ?? 0} max={50}>
              <input value={draftConfig['invite.heading'] ?? ''} onChange={e => setConfig('invite.heading', e.target.value)} maxLength={50}
                style={{ width: '100%', fontSize: 14, fontWeight: 500, color: 'var(--text-strong)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-ui)', padding: '2px 0' }} />
              <ColorRow value={draftConfig['invite.heading.color'] ?? ''} onChange={v => setConfig('invite.heading.color', v)} onClear={() => setConfig('invite.heading.color', '')} presets={PRESETS.heading} />
              <ShadowSeg value={draftConfig['invite.heading.shadow'] ?? 'none'} onChange={v => setConfig('invite.heading.shadow', v)} options={['none', 'soft', 'strong', 'glow']} />
            </FieldCard>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <FieldLabel>Alignment</FieldLabel>
                <SelectField value={draftConfig['invite.heading.align'] ?? 'center'} options={['left', 'center', 'right']} onChange={v => setConfig('invite.heading.align', v)} />
              </div>
              <div style={{ flex: 1 }}>
                <FieldLabel>Animation</FieldLabel>
                <SelectField value={draftConfig['invite.heading.animation'] ?? 'none'} options={['none', 'fade', 'slide', 'typewriter']} onChange={v => setConfig('invite.heading.animation', v)} />
              </div>
            </div>
          </Group>

          <Group title="Invitation Message">
            <RichTextEditor value={draftConfig['invite.body'] ?? ''} onChange={html => setConfig('invite.body', html)} maxLength={200} />
            <div>
              <FieldLabel>Alignment</FieldLabel>
              <SelectField value={draftConfig['invite.body.align'] ?? 'center'} options={['left', 'center', 'right']} onChange={v => setConfig('invite.body.align', v)} />
            </div>
          </Group>

          {wedding.templateId === 5 && (
            <Group title="Countdown" chipAnchor="Style">
              <FieldCard label="Countdown Label" count={draftConfig['invite.countdown_prefix']?.length ?? 0} max={60}>
                <input value={draftConfig['invite.countdown_prefix'] ?? ''} onChange={e => setConfig('invite.countdown_prefix', e.target.value)} maxLength={60} placeholder="Counting down to our special day"
                  style={{ width: '100%', fontSize: 14, fontWeight: 500, color: 'var(--text-strong)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-ui)', padding: '2px 0' }} />
                <ColorRow value={draftConfig['countdown.label.color'] ?? ''} onChange={v => setConfig('countdown.label.color', v)} onClear={() => setConfig('countdown.label.color', '')} presets={PRESETS.date} />
              </FieldCard>
              <FieldCard label="Number Color">
                <ColorRow value={draftConfig['countdown.number.color'] ?? ''} onChange={v => setConfig('countdown.number.color', v)} onClear={() => setConfig('countdown.number.color', '')} presets={PRESETS.heading} />
              </FieldCard>
            </Group>
          )}

          <Group title="Section Background" chipAnchor="Background">
            <BgImageField configKey="section.welcome.bg" label="Welcome" value={draftConfig['section.welcome.bg'] ?? ''} weddingId={weddingId!} onChange={url => setConfig('section.welcome.bg', url)} />
          </Group>

          {wedding.templateId === 5 && (
            <Group title="Page Background">
              <BgImageField configKey="template.bg" label="Page Background" value={draftConfig['template.bg'] ?? ''} weddingId={weddingId!} onChange={url => setConfig('template.bg', url)} />
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <FieldLabel>Size</FieldLabel>
                  <SelectField value={draftConfig['template.bgSize'] ?? 'cover'} options={['cover', 'contain', 'auto']} labels={{ auto: 'Natural' }} onChange={v => setConfig('template.bgSize', v)} />
                </div>
                <div style={{ flex: 1 }}>
                  <FieldLabel>Position</FieldLabel>
                  <SelectField value={draftConfig['template.bgPosition'] ?? 'center'} options={['center', 'top center', 'bottom center', 'left center', 'right center']} labels={{ 'top center': 'Top', 'bottom center': 'Bottom', 'left center': 'Left', 'right center': 'Right' }} onChange={v => setConfig('template.bgPosition', v)} />
                </div>
              </div>
            </Group>
          )}
        </>
      )}

      {/* ═══════════════ CEREMONY / WALIMAH ═══════════════ */}
      {activeBlock === 'walimah' && (
        <>
          <Group title="Ceremony / Walimah" chipAnchor="Content">
            <FieldCard label="Section Title" count={draftConfig['walimah.title']?.length ?? 0} max={40}>
              <input value={draftConfig['walimah.title'] ?? ''} onChange={e => setConfig('walimah.title', e.target.value)} maxLength={40} placeholder="Walimatul Urus"
                style={{ width: '100%', fontSize: 14, fontWeight: 500, color: 'var(--text-strong)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-ui)', padding: '2px 0' }} />
              {wedding.templateId === 5 && (
                <ColorRow value={draftConfig['ceremony.title.color'] ?? ''} onChange={v => setConfig('ceremony.title.color', v)} onClear={() => setConfig('ceremony.title.color', '')} presets={PRESETS.heading} />
              )}
              {wedding.templateId === 5 && (
                <ShadowSeg value={draftConfig['ceremony.title.shadow'] ?? 'none'} onChange={v => setConfig('ceremony.title.shadow', v)} options={['none', 'soft', 'strong', 'glow']} />
              )}
            </FieldCard>

            <div>
              <FieldLabel hint="Supports bold and italic formatting">Ceremony Details</FieldLabel>
              <RichTextEditor value={draftConfig['walimah.body'] ?? ''} onChange={html => setConfig('walimah.body', html)} maxLength={500} />
            </div>
            <div>
              <FieldLabel>Text Alignment</FieldLabel>
              <SelectField value={draftConfig['walimah.body.align'] ?? 'center'} options={['left', 'center', 'right']} onChange={v => setConfig('walimah.body.align', v)} />
            </div>
            {wedding.templateId === 5 && (
              <FieldCard label="Body Text Color">
                <ColorRow value={draftConfig['walimah.body.color'] ?? ''} onChange={v => setConfig('walimah.body.color', v)} onClear={() => setConfig('walimah.body.color', '')} presets={PRESETS.body} />
              </FieldCard>
            )}
          </Group>

          {wedding.templateId === 5 && (
            <Group title="Couple Names in Card" chipAnchor="Style">
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <FieldLabel>Color</FieldLabel>
                  <input type="color" value={draftConfig['ceremony.names.color'] || '#ffffff'} onChange={e => setConfig('ceremony.names.color', e.target.value)} style={{ width: '100%', height: 36, cursor: 'pointer', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', padding: 2 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <FieldLabel>Shadow</FieldLabel>
                  <SelectField value={draftConfig['ceremony.names.shadow'] ?? 'none'} options={['none', 'soft', 'strong', 'glow']} onChange={v => setConfig('ceremony.names.shadow', v)} />
                </div>
              </div>
            </Group>
          )}
        </>
      )}

      {/* ═══════════════ RSVP ═══════════════ */}
      {activeBlock === 'rsvp' && (
        <Group title="RSVP" chipAnchor="RSVP">
          <FieldCard label="RSVP Subtitle" count={draftConfig['rsvp.subtitle']?.length ?? 0} max={80}>
            <input value={draftConfig['rsvp.subtitle'] ?? ''} onChange={e => setConfig('rsvp.subtitle', e.target.value)} maxLength={80}
              style={{ width: '100%', fontSize: 14, fontWeight: 500, color: 'var(--text-strong)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-ui)', padding: '2px 0' }} />
            {wedding.templateId === 5 && (
              <ColorRow value={draftConfig['rsvp.subtitle.color'] ?? ''} onChange={v => setConfig('rsvp.subtitle.color', v)} onClear={() => setConfig('rsvp.subtitle.color', '')} presets={PRESETS.body} />
            )}
          </FieldCard>
        </Group>
      )}

      {/* ═══════════════ ITINERARY ═══════════════ */}
      {activeBlock === 'itinerary' && (
        <>
          <Group title="Schedule / Itinerary" chipAnchor="Schedule">
            <FieldCard label="Section Title" count={draftConfig['itinerary.title']?.length ?? 0} max={40}>
              <input value={draftConfig['itinerary.title'] ?? ''} onChange={e => setConfig('itinerary.title', e.target.value)} maxLength={40} placeholder="Aturcara Majlis"
                style={{ width: '100%', fontSize: 14, fontWeight: 500, color: 'var(--text-strong)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-ui)', padding: '2px 0' }} />
              {wedding.templateId === 5 && (
                <ColorRow value={draftConfig['itinerary.title.color'] ?? ''} onChange={v => setConfig('itinerary.title.color', v)} onClear={() => setConfig('itinerary.title.color', '')} presets={PRESETS.heading} />
              )}
            </FieldCard>
            {wedding.templateId === 5 && (
              <FieldCard label="Item Text Color">
                <ColorRow value={draftConfig['itinerary.item.color'] ?? ''} onChange={v => setConfig('itinerary.item.color', v)} onClear={() => setConfig('itinerary.item.color', '')} presets={PRESETS.body} />
              </FieldCard>
            )}
            <ItineraryEditor weddingId={weddingId!} onItemsChange={setItinerary} />
          </Group>
          <Group title="Section Background" chipAnchor="Background">
            <BgImageField configKey="section.ceremony.bg" label="Ceremony" value={draftConfig['section.ceremony.bg'] ?? ''} weddingId={weddingId!} onChange={url => setConfig('section.ceremony.bg', url)} />
          </Group>
        </>
      )}

      {/* ═══════════════ WISHES ═══════════════ */}
      {activeBlock === 'wishes' && (
        <Group title="Wishes & Guestbook" chipAnchor="Content">
          <FieldCard label="Section Title" count={draftConfig['wish.title']?.length ?? 0} max={40}>
            <input value={draftConfig['wish.title'] ?? ''} onChange={e => setConfig('wish.title', e.target.value)} maxLength={40} placeholder="Wishes & Blessings"
              style={{ width: '100%', fontSize: 14, fontWeight: 500, color: 'var(--text-strong)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-ui)', padding: '2px 0' }} />
          </FieldCard>
          <FieldCard label="Wish Prompt" count={draftConfig['wish.prompt']?.length ?? 0} max={80}>
            <input value={draftConfig['wish.prompt'] ?? ''} onChange={e => setConfig('wish.prompt', e.target.value)} maxLength={80}
              style={{ width: '100%', fontSize: 14, fontWeight: 500, color: 'var(--text-strong)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-ui)', padding: '2px 0' }} />
            {wedding.templateId === 5 && (
              <ColorRow value={draftConfig['wish.prompt.color'] ?? ''} onChange={v => setConfig('wish.prompt.color', v)} onClear={() => setConfig('wish.prompt.color', '')} presets={PRESETS.body} />
            )}
          </FieldCard>
        </Group>
      )}

      {/* ═══════════════ PHOTO BOOTH ═══════════════ */}
      {activeBlock === 'photobooth' && (
        <>
          <Group title="Photo Booth" chipAnchor="Content">
            <FieldCard label="Section Title" count={draftConfig['photobooth.title']?.length ?? 0} max={40}>
              <input value={draftConfig['photobooth.title'] ?? ''} onChange={e => setConfig('photobooth.title', e.target.value)} maxLength={40} placeholder="Photo Booth"
                style={{ width: '100%', fontSize: 14, fontWeight: 500, color: 'var(--text-strong)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-ui)', padding: '2px 0' }} />
            </FieldCard>
            <FieldCard label="Navigation Label" count={draftConfig['nav.photos']?.length ?? 0} max={20}>
              <input value={draftConfig['nav.photos'] ?? 'Photos'} onChange={e => setConfig('nav.photos', e.target.value)} maxLength={20}
                style={{ width: '100%', fontSize: 14, fontWeight: 500, color: 'var(--text-strong)', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-ui)', padding: '2px 0' }} />
            </FieldCard>
            {photoBoothEnabled && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-ui)', color: 'var(--text-strong)' }}>Auto-approve Guest Photos</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'var(--font-ui)' }}>When off, photos require manual approval</p>
                </div>
                <ToggleSwitch value={draftConfig['photobooth.autoApprove'] !== 'false'} onChange={v => setConfig('photobooth.autoApprove', v ? 'true' : 'false')} />
              </div>
            )}
          </Group>

          {showPortraitSlots && (
            <Group title="Portrait & Gallery Slots" chipAnchor="Media">
              {wedding.templateId === 4 && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', lineHeight: 1.6, margin: 0 }}>
                  <strong>Hero Background</strong> appears full-screen behind the couple&apos;s names.
                </p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {portraitSlots.map(({ slot, label }) => (
                  <PhotoDropZone key={slot} slot={slot} label={label}
                    photo={coupleMedia.find(m => m.templateSlot === slot)}
                    uploading={uploadingSlot === slot}
                    onDrop={handlePhotoDrop} onRemove={handlePhotoRemove} />
                ))}
              </div>
            </Group>
          )}

          {wedding.templateId === 5 && (
            <Group title="Section Headings">
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', margin: '0 0 8px' }}>Applies to Wishes &amp; Photo Booth headings</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <FieldLabel>Color</FieldLabel>
                  <input type="color" value={draftConfig['section.heading.color'] || '#ffffff'} onChange={e => setConfig('section.heading.color', e.target.value)} style={{ width: '100%', height: 36, cursor: 'pointer', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', padding: 2 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <FieldLabel>Shadow</FieldLabel>
                  <SelectField value={draftConfig['section.heading.shadow'] ?? 'none'} options={['none', 'soft', 'strong', 'glow']} onChange={v => setConfig('section.heading.shadow', v)} />
                </div>
              </div>
            </Group>
          )}

          <Group title="Section Background" chipAnchor="Background">
            <BgImageField configKey="section.celebration.bg" label="Celebration" value={draftConfig['section.celebration.bg'] ?? ''} weddingId={weddingId!} onChange={url => setConfig('section.celebration.bg', url)} />
          </Group>
        </>
      )}

      {/* ═══════════════ MUSIC ═══════════════ */}
      {activeBlock === 'music' && (
        <MusicTab
          url={draftConfig['music.url'] ?? ''}
          loop={draftConfig['music.loop'] !== 'false'}
          weddingId={weddingId!}
          onUrlChange={v => setConfig('music.url', v)}
          onLoopChange={v => setConfig('music.loop', v ? 'true' : 'false')}
        />
      )}
    </>
  );

  return (
    <div style={{ height: '100vh', background: 'var(--surface-app)', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'var(--font-ui)' }}>

      {/* ── Page header ── */}
      <div style={{ height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-card)' }}>
        <button onClick={() => router.push('/couple-admin')}
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

        <div style={{ width: 1, height: 22, background: 'var(--border-subtle)', margin: '0 4px' }} />

        {wedding && (
          <a href={`/wedding/${wedding.coupleName}`} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-ui)', padding: '9px 16px', borderRadius: 999, textDecoration: 'none', transition: 'background 150ms' }}
            className="hide-narrow"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-strong)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}>
            <Icon name="eye" size={14} /> Preview
          </a>
        )}

        <Button variant="secondary" tone="neutral" size="sm"
          onClick={() => { if (wedding?.coupleName) navigator.clipboard?.writeText(`${window.location.origin}/wedding/${wedding.coupleName}`); }}
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
                {blockInfo.chips.map(chip => (
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

        {/* Right: Preview panel */}
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
        />
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
