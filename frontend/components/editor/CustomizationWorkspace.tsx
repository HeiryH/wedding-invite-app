'use client';

import Image from 'next/image';
import { getTemplateCapabilities } from '@/components/templates/templateCapabilities';
import { sectionArrangement, moveIndependentSection } from '@/components/templates/sectionArrangement';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { templateStudioService, type StudioState } from '@/lib/api/templateStudio.service';
import { studioSample } from './studioSample';
import { LiveThumbnailCapture } from './LiveThumbnailCapture';
import { downloadBlob } from '@/lib/utils';
import {
  eventService,
  photoService,
  audioService,
  templateConfigService,
  templateService,
  eventFeatureService,
  itineraryService,
  tableService,
  type SeatingTable,
  Wedding,
  Photo,
  Template,
  ItineraryItem,
  TemplateSlots,
} from '@/lib/api';
import { navAppearance, navIconUrl, NAV_ADJUST_FIELDS, NAV_ADJUST_KEYS, NAV_BORDER_STYLES, navAdjustment, type NavLayout } from '@/components/templates/_shared/nav/appearance';
import { couplePhotoUrl, orderedCoupleGallery } from '@/components/templates/_shared/CoupleGallery';
import { TemplateLibrary } from '@/components/templates/TemplateLibrary';
import { buildDefaultConfig, getConfigFields } from '@/lib/templateConfigSchema';
import { TemplateConfigField } from '@/lib/api';
import { resolveSectionOrder } from '@/lib/templateUtils';
import { matchesEvent, urlSegmentForEventType } from '@/lib/eventTypes';
import { PRESETS, isShadowField, chipOf, useSchemaIndex } from '@/app/organizer-admin/customize/_components/SchemaField';
// The stage-layout dock (shared engine). `TEMPLATE_ENGINES` is the single per-template registry
// selecting {stages, keyPrefix, stageIds, reveal} — adding a template to the Adjust feature means
// a registry entry there, not a branch here.
import AdjustPanel from '@/components/templates/_shared/adjust/AdjustPanel';
import { TEMPLATE_ENGINES, sectionAnchorId } from '@/components/templates/_shared/registry';
import CinematicAdjustPanel from '@/components/templates/_shared/cinematic/CinematicAdjustPanel';
import { resolveCinematicTrackClip } from '@/components/templates/_shared/cinematic/sequence';
import { compileAssetAnimationTracks, retimeAssetAnimation, NEUTRAL_ASSET_MOTION } from '@/components/templates/_shared/cinematic/assetAnimations';
import { resolveCinematicDirection, saveCinematicDirection, normalizeMotion, type CinematicEffectPose } from '@/components/templates/_shared/cinematic/direction';
import { CINEMATIC_ENGINES, type CinematicEditorMode } from '@/components/templates/_shared/cinematic/registry';
import { cinematicWorldKey, resolveCinematicWorld, serializeCinematicWorld, type CinematicWorldGeometry, type CinematicWorldLayer } from '@/components/templates/_shared/cinematic/world';
import { cinematicAncestors, cinematicEditorLayers } from '@/components/templates/_shared/cinematic/parts';
import { baseBeatCameras, cinematicCameraKey, resolveCinematicCamera, serializeCinematicCamera, type CinematicBeatCamera } from '@/components/templates/_shared/cinematic/cameraLayout';
import { resolveCinematicSceneSets } from '@/components/templates/_shared/cinematic/sceneSets';
import { editCinematicSceneSets, type SceneSetAction } from '@/components/templates/_shared/cinematic/sceneSetEditing';
import {
  migrateCinematicConfigToProject, resetCinematicProjectConfig,
  resolveCinematicProjectConfig, updateCinematicProjectValue,
} from '@/components/templates/_shared/cinematic/project';
import {
  cinematicVisibilityKey, promoteLegacyCinematicVisibilityTracks,
  resolveCinematicVisibility, serializeCinematicVisibility, type CinematicVisibilitySet,
} from '@/components/templates/_shared/cinematic/visibility';
import {
  beatsFromSequence, cinematicSequenceKey, createCinematicTimingSet,
  deleteCinematicTimingSet, duplicateCinematicTimingSet, linkCinematicLayerTiming,
  relinkCinematicLayerToGroup, resolveCinematicLayerTiming, resolveCinematicSequence,
  removeCinematicNarrativeMoment, restoreCinematicNarrativeMoment, unlinkCinematicLayerTiming,
  serializeCinematicSequence, visibilityFromSequence,
  type CinematicCameraTransition, type CinematicSequence, type CinematicSequenceClip,
  type CinematicSequenceTrack,
} from '@/components/templates/_shared/cinematic/sequence';
import { sampleCamera, type CameraState } from '@/components/templates/_shared/cinematic/useCinematicScroll';
import { resolveStage, serializeStage, layoutKey, patchStageLayer, stageArtScale } from '@/components/templates/_shared/layout';
import type { Layer as LayerModel, Breakpoint, StageDef } from '@/components/templates/_shared/types';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Icon } from '@/components/ui/Icon';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import { PreviewPanel, frameFromPreset, type Device, type EditorMode, type PreviewFrame } from '@/app/organizer-admin/customize/_components/PreviewPanel';
import type { ReferencePatch } from '@/app/organizer-admin/customize/_components/CinematicReferenceRail';
import { defaultPresetFor } from '@/lib/devicePresets';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

const SAMPLE_TABLES: SeatingTable[] = [
  { tableId: 1, eventId: 0, tableName: 'Table 1', capacity: 8, sortOrder: 1, guestCount: 2, guests: [] },
  { tableId: 2, eventId: 0, tableName: 'Table 2', capacity: 6, sortOrder: 2, guestCount: 6, guests: [] },
];

const SAMPLE_WISHES = [
  { wishId: 1, weddingId: 0, guestName: 'Sarah', message: 'Wishing you a lifetime of happiness!', createdDate: new Date().toISOString() },
  { wishId: 2, weddingId: 0, guestName: 'James', message: 'Congratulations to the happy couple!', createdDate: new Date().toISOString() },
];

const SAMPLE_GALLERY: Photo[] = [
  ['couple', 'Sample couple portrait'],
  ['ring', 'Sample ring detail'],
  ['ceremony', 'Sample ceremony scene'],
].map(([name, caption], index) => ({
  photoId: -100 + index,
  eventId: 0,
  photoUrl: `/samples/couple-gallery/${name}.webp`,
  caption,
  fileSize: 0,
  contentType: 'image/webp',
  uploadedBy: 'COUPLE',
  templateSlot: TemplateSlots.COUPLE_GALLERY,
  isApproved: true,
  isVisible: true,
  isFeatured: false,
  createdDate: '',
}));

const ROMAN_GARDEN_SAMPLE_PHOTOS: Photo[] = [
  ['photobooth', 'Sample wedding guest photo'],
  ['garden-toast', 'Wedding guests laughing at the reception'],
  ['garden-guests', 'Wedding guests by the garden arch'],
].map(([name, caption], index) => ({
  photoId: -103 - index,
  eventId: 0,
  photoUrl: `/samples/roman-garden/${name}.webp`,
  caption,
  fileSize: 0,
  contentType: 'image/webp',
  uploadedBy: 'GUEST',
  isApproved: true,
  isVisible: true,
  isFeatured: false,
  createdDate: '',
}));

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
type BlockId = 'details' | 'welcome' | 'walimah' | 'rsvp' | 'seating' | 'itinerary' | 'wishes' | 'photobooth' | 'music' | 'navigation' | 'couple-gallery';

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
  return [...new Set(resolveSectionOrder(value, true, true, true))];
}

function scrollFractionFor(block: BlockId, order: string[]): number {
  if (block === 'details' || block === 'music' || block === 'navigation') return 0;
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
  seating:    { eyebrow: 'Guest RSVP', title: 'Seating', subtitle: 'Choose how guests are assigned to tables.' },
  itinerary:  { eyebrow: 'Section · Itinerary', title: 'Schedule', subtitle: 'Event timeline and programme.' },
  wishes:     { eyebrow: 'Section · Wishes', title: 'Wishes & Guestbook', subtitle: 'Messages from your guests.' },
  photobooth: { eyebrow: 'Section · Photo Booth', title: 'Photo Booth', subtitle: 'Guest photo gallery.' },
  music:      { eyebrow: 'Background Music', title: 'Music & playlist', subtitle: 'Audio that plays while guests browse.' },
  'couple-gallery': { eyebrow: 'Section · Gallery', title: 'Couple Gallery', subtitle: 'Photos you add to the invitation.' },
  navigation: { eyebrow: 'Navigation Bar', title: 'Navigation', subtitle: 'How guests move between sections.' },
};

// Group render order per rail block. Groups the schema declares but this list omits are
// appended at the end, so a newly-added field always surfaces somewhere rather than vanishing.
const GROUP_ORDER: Record<BlockId, string[]> = {
  details:    ['Wedding Details', 'Display', 'Advanced', 'Footer', 'Change Template'],
  welcome:    ['Heading', 'Welcome Style', 'Invitation Message', 'Countdown', 'Roman Garden Scene', 'Fairy Garden Scene', 'Stage Layout', 'Decorative Layers', 'Section Background', 'Page Background'],
  walimah:    ['Ceremony / Walimah', 'Ceremony Stages', 'Couple Names in Card'],
  rsvp:       ['Form layout', 'Fields', 'RSVP', 'Section Background'],
  seating:    ['Seating'],
  itinerary:  ['Schedule / Itinerary'],
  wishes:     ['Form layout', 'Wishes & Guestbook', 'Section Background'],
  photobooth: ['Photo Booth', 'Portrait & Gallery Slots', 'Section Headings'],
  music:      [],
  navigation: ['Navigation Bar', 'Menu Items', 'Navigation Icons', 'Navigation Labels'],
  'couple-gallery': ['Gallery'],
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
  navigation: ['Menu Items'],
  // Same bug as 'Wedding Details' above: the group only ever rendered when a template's schema
  // happened to contribute a 'Schedule / Itinerary'-grouped field, which only T5 (itinerary.item.
  // color) and T5/T7 (itinerary.title) do — every other template, T10 included, had no schema
  // field to trigger the group at all, so the ItineraryEditor (its `after:` addendum in
  // renderBlock) never rendered and the Itinerary tab showed nothing to add or edit.
  itinerary:  ['Schedule / Itinerary'],
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

function SelectField({ value, options, onChange, labels, disabled, ariaLabel }: {
  value: string; options: string[]; onChange: (v: string) => void; labels?: Record<string, string>;
  disabled?: boolean; ariaLabel?: string;
}) {
  return (
    <select
      aria-label={ariaLabel} disabled={disabled}
      value={value} onChange={(e) => onChange(e.target.value)}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)', color: 'var(--text-body)', background: 'var(--surface-card)', outline: 'none', appearance: 'none', WebkitAppearance: 'none', transition: 'var(--transition-control)' }}
      onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.boxShadow = 'var(--shadow-focus)'; }}
      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {options.map((o) => <option key={o} value={o}>{labels?.[o] ?? (o.charAt(0).toUpperCase() + o.slice(1))}</option>)}
    </select>
  );
}

function ToggleSwitch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
  return <Switch aria-label={label} checked={value} onChange={e => onChange(e.target.checked)} />;
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
function ColorRow({ value, onChange, onClear, presets, label }: {
  value: string; onChange: (v: string) => void; onClear: () => void; presets?: string[]; label?: string;
}) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border-subtle)' }}>
        <label style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border-default)', flexShrink: 0, position: 'relative', cursor: 'pointer', transition: 'transform 150ms', background: value || undefined, display: 'block' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.06)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
          {!value && <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'repeating-linear-gradient(45deg, #fff 0 4px, var(--border-subtle) 4px 5px)' }} />}
          <input type="color" aria-label={label} value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={e => onChange(e.target.value)}
            style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
        </label>
        <input
          className="color-hex-input" aria-label={label ? `${label} hex` : undefined}
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

function ItineraryEditor({ weddingId, items, onItemsChange, localOnly = false }: { localOnly?: boolean; weddingId: number; items: ItineraryItem[]; onItemsChange: (items: ItineraryItem[]) => void }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState({ label: '', detail: '' });
  const [newRow, setNewRow] = useState({ label: '', detail: '' });
  const [adding, setAdding] = useState(false);

  const nextSort = items.length > 0 ? Math.max(...items.map((i) => i.sortOrder)) + 1 : 1;

  const handleAdd = async () => {
    if (!newRow.label.trim()) return;
    const created = localOnly ? { itineraryItemId: Date.now(), eventId: 0, ...newRow, sortOrder: nextSort } : await itineraryService.create(weddingId, { ...newRow, label: newRow.label.trim(), detail: newRow.detail.trim(), sortOrder: nextSort });
    onItemsChange([...items, created]);
    setNewRow({ label: '', detail: '' });
    setAdding(false);
  };

  const handleSaveEdit = async (item: ItineraryItem) => {
    if (!editDraft.label.trim()) return;
    const updated = localOnly ? { ...item, ...editDraft } : await itineraryService.update(item.itineraryItemId, { label: editDraft.label.trim(), detail: editDraft.detail.trim(), sortOrder: item.sortOrder });
    onItemsChange(items.map((i) => i.itineraryItemId === updated.itineraryItemId ? updated : i));
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (!localOnly) await itineraryService.delete(id);
    onItemsChange(items.filter((i) => i.itineraryItemId !== id));
  };

  const handleMove = async (index: number, dir: 'up' | 'down') => {
    const swap = dir === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= items.length) return;
    const next = [...items];
    [next[index], next[swap]] = [next[swap], next[index]];
    const reordered = next.map((item, i) => ({ ...item, sortOrder: i + 1 }));
    onItemsChange(reordered);
    if (!localOnly) await itineraryService.reorder(weddingId, { items: reordered.map((i) => ({ itineraryItemId: i.itineraryItemId, sortOrder: i.sortOrder })) });
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '6px 10px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)', color: 'var(--text-body)', background: 'var(--surface-card)', outline: 'none', boxSizing: 'border-box' };

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
  url: string; loop: boolean; weddingId?: number;
  onUrlChange: (v: string) => void; onLoopChange: (v: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (weddingId === undefined) return;
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
      {weddingId !== undefined && <Group title="Upload Audio" chipAnchor="Audio">
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
      </Group>}

      <Group title={weddingId === undefined ? "Sample audio URL" : "Or Paste a URL"} chipAnchor={weddingId === undefined ? "Audio" : undefined}>
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

function BgImageField({ configKey, label, value, weddingId, onChange, upload, compact }: {
  configKey: string; label: string; value: string; weddingId: number; upload?: (file: File) => Promise<string>; onChange: (url: string) => void;
  compact?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const url = upload ? await upload(file) : (await photoService.upload(weddingId, '', `${label} background`, file, 'COUPLE', BG_SLOT[configKey])).photoUrl;
      onChange(url);
    } catch {
      alert('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const fileInput = (
    <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} aria-label={label}
      onChange={e => { const file = e.target.files?.[0]; if (file) void handleFile(file); e.target.value = ''; }} />
  );

  if (compact) return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={navIconUrl(value)} alt="" width={28} height={28} style={{ objectFit: 'contain' }} />
      )}
      <Button type="button" variant="secondary" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? 'Uploading…' : `${value ? 'Replace' : 'Upload'} ${label}`}
      </Button>
      {value && <Button type="button" variant="secondary" size="sm" disabled={uploading}
        aria-label={`Remove ${label}`} onClick={() => onChange('')}>Remove</Button>}
      {fileInput}
    </div>
  );

  return (
    <div>
      {value ? (
        <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '16/9', boxShadow: 'var(--shadow-sm)' }}>
          <Image fill unoptimized sizes="320px" src={`${API_BASE}${value}`} alt={label} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
      {fileInput}
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
          <Image fill unoptimized sizes="320px" src={`${API_BASE}${photo.photoUrl}`} alt={label} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

function SectionRail({ mode, onToggle, activeBlock, sectionOrder, onSelectBlock, hasMusic, hasNav, hasGallery, hasSeating }: {
  mode: EditorMode;
  onToggle: () => void;
  activeBlock: BlockId;
  sectionOrder: string[];
  onSelectBlock: (block: BlockId) => void;
  hasMusic: boolean;
  hasNav: boolean;
  hasGallery: boolean;
  hasSeating: boolean;
}) {
  const railItems = [
    RAIL_SECTIONS[0], // details always first
    ...sectionOrder.flatMap((code) => {
      const section = RAIL_SECTIONS.find((item) => item.id === code);
      if (!section) return [];
      return code === 'rsvp' && hasSeating
        ? [section, { id: 'seating' as const, label: 'Seating', icon: 'layout-grid' }]
        : [section];
    }),
    // only templates that actually play audio get a Music tab
    ...(hasGallery ? [{ id: 'couple-gallery' as BlockId, label: 'Gallery', icon: 'image' }] : []),
    ...(hasMusic ? [{ id: 'music' as BlockId, label: 'Music', icon: 'music' }] : []),
    // only templates with a couple-editable nav bar (T7/T10 today) get a Navigation tab
    ...(hasNav ? [{ id: 'navigation' as BlockId, label: 'Navigation', icon: 'menu' }] : []),
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

function SaveBar({ dirty, saving, onSave, master = false }: { dirty: boolean; saving: boolean; onSave: () => void; master?: boolean }) {
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
        {dirty ? master ? 'Save draft' : 'Save changes' : 'All saved'}
      </Button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CustomizationWorkspace({ masterTemplateId }: { masterTemplateId?: number }) {
  const master = masterTemplateId !== undefined;
  const [studio, setStudio] = useState<StudioState | null>(null);
  const [studioError, setStudioError] = useState('');
  const [studioNotice, setStudioNotice] = useState('');
  const [studioBusy, setStudioBusy] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [restoreRevision, setRestoreRevision] = useState('0');
  const [savedSample, setSavedSample] = useState('');
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const weddingId = master ? undefined : user?.weddingId;

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [eventSeating, setEventSeating] = useState({ enabled: false, tables: [] as SeatingTable[] });
  const [sampleSeating, setSampleSeating] = useState(false);
  const [previewSeating, setPreviewSeating] = useState(false);
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
  // Lifted out of PreviewPanel: "Reveal off-screen" pins each stage to the previewed device's
  // visible (svh) box *inside* the iframe, so the template needs this too — it rides the
  // PREVIEW_UPDATE editor payload below. Kept here (like `device`/`manualZoom`) so both consumers
  // read one source. See docs/FIX_QUEUE.md Issue 2 / lib/devicePresets.ts.
  const [frame, setFrame] = useState<PreviewFrame>(() => frameFromPreset(defaultPresetFor('mobile')));
  // Which stored layout (`t7.layout.mobile.*` vs `.desktop.*`) the preview is actually resolving —
  // derived from the *emulated* layout viewport (frame.w / frame.scale), matching useBreakpoint's
  // own `(min-width: 900px)` query, rather than from the device preset name. A literal
  // `device === 'mobile'` check would get a tablet-shaped preset wrong if its emulated width
  // crosses 900 while its device width doesn't (or vice versa) — the exact scale factor matters
  // here. Resolved 2026-09-08: a real iPad measured `visualViewport.scale` of exactly **1**, not
  // the iPhone's 0.765 — confirming the anomaly is iPhone-specific, not universal. `frame.scale`
  // (from `DevicePreset.scale`, lib/devicePresets.ts) carries the right per-device value instead of
  // a single global constant, so the `ipad` preset (820/1 = 820) now correctly stays under the 900
  // line into 'mobile', matching what a real iPad guest's `useBreakpoint` actually resolves to.
  const previewBreakpoint: Breakpoint =
    frame.w / frame.scale >= 900 ? 'desktop' : 'mobile';
  const [subSection, setSubSection] = useState('');
  // Adjust (stage-layout) dock: open state + which layer is selected, so the preview can outline it.
  const [adjusting, setAdjusting] = useState(false);
  const [adjustNavigation, setAdjustNavigation] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedLayer, setSelectedLayer] = useState<string | undefined>();
  const [selectedCinematicTimingTrack, setSelectedCinematicTimingTrack] = useState<string | undefined>();
  const [effectPoseRequest, setEffectPoseRequest] = useState<Pick<CinematicEffectPose, 'effectId' | 'side'>>();
  const [cinematicTimingSelectionRequest, setCinematicTimingSelectionRequest] = useState(0);
  const [selectedCinematicBeat, setSelectedCinematicBeat] = useState<string>('');
  const [cinematicProgress, setCinematicProgress] = useState(0.08);
  const [cinematicMode, setCinematicMode] = useState<CinematicEditorMode>('scene');
  const [composedCamera, setComposedCamera] = useState<CameraState | undefined>();
  const [cinematicReferenceVisible, setCinematicReferenceVisible] = useState(true);
  const cinematicReferenceOpacity = 0.45;

  // Undo/redo — a linear history of snapshots over the whole "unsaved draft" surface
  // (draftConfig/weddingDraft/sectionOrder). Snapshot-based rather than per-action, so it needs no
  // instrumentation at each of the many places that call setDraftConfig/setWeddingDraft/
  // setSectionOrder (schema fields, the Adjust dock's layer edits, section drag-reorder, switching
  // templates) — a single debounced effect below watches the combined state instead. Itinerary is
  // deliberately excluded: its CRUD calls (itineraryService.create/update/delete) hit the backend
  // immediately, so there is no client-side "unsaved" version of it to step through.
  type EditSnapshot = { draftConfig: Record<string, string>; weddingDraft: typeof emptyWed; sectionOrder: string[] };
  const [history, setHistory] = useState<{ stack: EditSnapshot[]; index: number }>({ stack: [], index: -1 });
  // Latest undo/redo/save, readable from the postMessage handler without making that effect
  // re-subscribe on every render (the preview iframe forwards its own Cmd+Z/Cmd+S — see
  // PREVIEW_HOTKEY). Assigned in an effect, never during render.
  const undoRef = useRef<(() => void) | undefined>(undefined);
  const redoRef = useRef<(() => void) | undefined>(undefined);
  const saveRef = useRef<(() => void) | undefined>(undefined);
  const isDirtyRef = useRef(false);
  const applyingHistoryRef = useRef(false);
  const canUndo = history.index > 0;
  const canRedo = history.index >= 0 && history.index < history.stack.length - 1;

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
  const sampleSnapshot = JSON.stringify({ itinerary, media: coupleMedia, eventType: wedding?.eventType });
  const isDirty = configDirty || weddingDirty || (master && sampleSnapshot !== savedSample);

  // The schema decides which controls exist for this template + role — never a templateId check.
  const fields = useMemo(
    () => getConfigFields(wedding?.templateId ?? 1, user?.role ?? 'ORGANIZER_ADMIN', user?.tier),
    [wedding?.templateId, user?.role, user?.tier],
  );
  const schema = useSchemaIndex(fields);
  const nav = navAppearance(draftConfig, schema.get('nav.layout')?.defaultValue as NavLayout | undefined);
  const showNavIcons = nav.content === 'icons' && nav.style !== 'hidden';
  const hasNavigationAdjust = schema.has('nav.style');
  const navigationSelected = hasNavigationAdjust && adjustNavigation;
  const hasGallery = schema.has('gallery.title');
  const showSampleGallery = hasGallery && !coupleMedia.some((photo) => photo.templateSlot === TemplateSlots.COUPLE_GALLERY);

  // ── Layout Adjust dock ──────────────────────────────────────────────────────
  const isPro = master || user?.role === 'SUPER_ADMIN' || user?.tier === 'PRO';

  // Stage and Cinematic share this parent shell (preview, undo/save, breakpoints), but remain
  // separate editing models. Stage edits isolated StageDefs; Cinematic directs beats in one world.
  const layout = useMemo(() => {
    const id = wedding?.templateId;
    const cinematicEngine = id ? CINEMATIC_ENGINES[id] : undefined;
    if (cinematicEngine) {
      const project = resolveCinematicProjectConfig(cinematicEngine.keyPrefix, draftConfig);
      const sequence = resolveCinematicSequence(
        cinematicEngine.keyPrefix, cinematicEngine.sequence, project.config,
      ).sequence;
      return {
        family: 'cinematic' as const,
        keyPrefix: cinematicEngine.keyPrefix,
        sequence,
        sequenceDefinition: cinematicEngine.sequence,
        config: project.config,
        projectSource: project.source,
        direction: resolveCinematicDirection(cinematicEngine.keyPrefix, cinematicEngine.direction, draftConfig),
        sceneSets: resolveCinematicSceneSets(
          cinematicEngine.keyPrefix, cinematicEngine.sceneSets, project.config,
        ).sceneSets,
        sceneSetDefinitions: cinematicEngine.sceneSets,
        beats: beatsFromSequence(sequence),
        world: cinematicEngine.world,
        camera: cinematicEngine.camera,
        visibility: visibilityFromSequence(sequence),
      };
    }
    const engine = id ? TEMPLATE_ENGINES[id] : undefined;
    if (engine) {
      const codes = resolveSectionOrder(
        draftConfig['section.order'] ?? sectionOrder.join(','),
        Boolean(draftConfig['walimah.body']) || id === 5,
        itinerary.length > 0,
        photoBoothEnabled,
      );
      const ctx = { codes, photoBoothEnabled, draftConfig };
      return {
        family: 'stage' as const,
        stages: engine.resolveStages(ctx),
        keyPrefix: engine.keyPrefix,
        stageIds: engine.stageIds(ctx),
        reveal: engine.reveal,
        slotTheme: Boolean(engine.slotTheme),
        slotThemeAccentDefault: engine.slotThemeAccentDefault,
        pageBackground: Boolean(engine.pageBackground),
        cardStyle: Boolean(engine.cardStyle),
        assetRoot: engine.assetRoot,
      };
    }
    // Authored templates (data, not code — see _shared/DataTemplate.tsx) have no registry entry;
    // their stage map ships on the wedding itself. `ta<id>` mirrors TemplateWrapper.tsx's identical
    // keyPrefix so a couple's saved deltas land under the same config namespace it already reads.
    // Always slot-theme-able: DataTemplate always renders through the shared slot registry.
    if (id && wedding?.templateStagesJson) {
      try {
        const stages = JSON.parse(wedding.templateStagesJson) as Record<string, StageDef>;
        return { family: 'stage' as const, stages, keyPrefix: `ta${id}`, stageIds: Object.keys(stages), reveal: true, slotTheme: true };
      } catch {
        return null;
      }
    }
    return null;
  }, [wedding?.templateId, wedding?.templateStagesJson, sectionOrder, draftConfig, itinerary.length, photoBoothEnabled]);

  const canAdjust = isPro && !!layout;
  const stageIds = layout?.family === 'stage' ? layout.stageIds : [];
  const activeStage = selectedStage && stageIds.includes(selectedStage) ? selectedStage : stageIds[0];
  const cinematicBeats = useMemo(
    () => layout?.family === 'cinematic' ? layout.beats : [],
    [layout],
  );
  const deletedCinematicBeats = useMemo(() => {
    if (layout?.family !== 'cinematic') return [];
    const activeIds = new Set(layout.sequence.beats.map((beat) => beat.id));
    return beatsFromSequence({
      ...layout.sequenceDefinition,
      beats: layout.sequenceDefinition.beats.filter((beat) => !activeIds.has(beat.id)),
    });
  }, [layout]);
  const activeCinematicBeat = cinematicBeats.find((beat) => beat.id === selectedCinematicBeat)
    ?? cinematicBeats[0];
  const cinematicWorldLayers = useMemo(() => layout?.family === 'cinematic'
    ? resolveCinematicWorld(layout.keyPrefix, layout.world, previewBreakpoint, layout.config,
      { frames: layout.direction.theme.memory.frames, programmeItems: itinerary.length })
    : [], [layout, previewBreakpoint, itinerary.length]);
  const cinematicCameraLayout = useMemo(() => layout?.family === 'cinematic'
    ? resolveCinematicCamera(layout.keyPrefix, layout.camera, layout.beats, previewBreakpoint, layout.config)
    : { beatCameras: [] as CinematicBeatCamera[], timeline: [] },
  [layout, previewBreakpoint]);
  const activeCinematicCamera = cinematicCameraLayout.beatCameras.find(
    (camera) => camera.id === activeCinematicBeat?.id,
  );
  const cinematicEditorCamera = cinematicMode === 'camera-compose'
    ? composedCamera ?? sampleCamera(cinematicProgress, cinematicCameraLayout.timeline)
    : activeCinematicCamera;
  const cinematicVisibilitySets = useMemo(() => layout?.family === 'cinematic'
    ? resolveCinematicVisibility(layout.keyPrefix, layout.visibility, previewBreakpoint, layout.config)
    : [], [layout, previewBreakpoint]);
  const cinematicTimelineTracks = useMemo(() => layout?.family === 'cinematic'
    ? promoteLegacyCinematicVisibilityTracks(layout.sequence.tracks, cinematicVisibilitySets)
    : [], [layout, cinematicVisibilitySets]);
  const cinematicAnimationTracks = useMemo(() => compileAssetAnimationTracks(cinematicWorldLayers, cinematicTimelineTracks), [cinematicWorldLayers, cinematicTimelineTracks]);
  const cinematicEffectPose = useMemo<CinematicEffectPose | undefined>(() => {
    if (!adjusting || cinematicMode !== 'scene' || layout?.family !== 'cinematic' || !effectPoseRequest) return;
    const base = layout.direction.effects.find((effect) => effect.id === effectPoseRequest.effectId);
    if (!base) return;
    const effect = previewBreakpoint === 'desktop' ? { ...base, ...base.desktop } : base;
    if (!effect.enabled || effect.target !== 'layer' || effect.targetId !== selectedLayer) return;
    return { ...effectPoseRequest, layerId: effect.targetId, motion: effect[effectPoseRequest.side] };
  }, [adjusting, cinematicMode, layout, effectPoseRequest, previewBreakpoint, selectedLayer]);
  useEffect(() => { setEffectPoseRequest(undefined); }, [selectedLayer, cinematicMode, adjusting, previewBreakpoint]);
  const editCinematicEffectPose = useCallback((pose?: Pick<CinematicEffectPose, 'effectId' | 'side'>) => {
    if (pose && layout?.family === 'cinematic') {
      const effect = layout.direction.effects.find((item) => item.id === pose.effectId);
      const track = cinematicTimelineTracks.find((item) => item.id === effect?.trackId);
      if (!track || !effect?.enabled) return;
      const clip = resolveCinematicTrackClip(track, new Map(cinematicTimelineTracks.map((item) => [item.id, item])));
      setCinematicProgress(pose.side === 'from' ? clip.start : clip.enterEnd);
    }
    setEffectPoseRequest(pose);
  }, [layout, cinematicTimelineTracks]);
  const cinematicDisplayTracks = useMemo(() => {
    const visible = new Set(cinematicEditorLayers(cinematicWorldLayers).map((layer) => layer.id));
    return [...cinematicTimelineTracks, ...cinematicAnimationTracks].filter((track) =>
      (track.target.type !== 'layer' || visible.has(track.target.id)) &&
      (!track.assetAnimation || visible.has(track.assetAnimation.layerId)));
  }, [cinematicTimelineTracks, cinematicAnimationTracks, cinematicWorldLayers]);
  const selectedCinematicAsset = useMemo(() => {
    if (layout?.family !== 'cinematic' || !selectedLayer) return undefined;
    const layer = cinematicWorldLayers.find((candidate) => candidate.id === selectedLayer);
    if (!layer) return undefined;
    const timing = resolveCinematicLayerTiming(layer.id, layer.group, cinematicTimelineTracks, layer.timingTrackId, cinematicWorldLayers);
    const track = timing.exact ?? timing.inherited;
    return {
      id: layer.id,
      label: layer.label,
      trackId: track?.id,
      sourceTrackId: timing.source?.id,
      timingStatus: timing.status,
      editableTrackId: timing.status === 'independent' ? timing.exact?.id : undefined,
      effectTrackIds: layout.direction.effects.filter((effect) => effect.target === 'layer' && effect.targetId === layer.id).map((effect) => effect.trackId),
    };
  }, [layout, selectedLayer, cinematicWorldLayers, cinematicTimelineTracks]);
  const selectedCinematicTimelineItem = useMemo(() => {
    const track = selectedCinematicTimingTrack
      ? cinematicDisplayTracks.find((candidate) => candidate.id === selectedCinematicTimingTrack)
      : undefined;
    if (!track) return selectedCinematicAsset;
    return {
      id: track.id,
      label: track.label,
      trackId: track.id,
      sourceTrackId: track.id,
      editableTrackId: track.id,
      timingStatus: 'independent' as const,
      effectTrackIds: selectedCinematicAsset?.effectTrackIds,
    };
  }, [selectedCinematicAsset, selectedCinematicTimingTrack, cinematicDisplayTracks]);
  useEffect(() => {
    if (selectedCinematicTimingTrack &&
      !cinematicDisplayTracks.some((track) => track.id === selectedCinematicTimingTrack)) {
      setSelectedCinematicTimingTrack(undefined);
    }
  }, [selectedCinematicTimingTrack, cinematicDisplayTracks]);
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

  const handleCinematicLayoutChange = useCallback((key: string, value: string) => {
    if (!layout || layout.family !== 'cinematic') return;
    setDraftConfig((previous) => updateCinematicProjectValue(
      layout.keyPrefix, previous, key, value,
    ));
  }, [layout]);

  const handleSceneSetAction = useCallback((action: SceneSetAction) => {
    const engine = wedding?.templateId ? CINEMATIC_ENGINES[wedding.templateId] : undefined;
    if (!engine) return;
    const nextConfig = editCinematicSceneSets(engine, draftConfig, action);
    if (nextConfig === draftConfig) return;
    // Set management uses discrete actions. Record their boundaries immediately rather than letting
    // the slider-oriented debounce merge a quick delete/duplicate/reorder into another operation.
    const before: EditSnapshot = { draftConfig, weddingDraft, sectionOrder };
    const after: EditSnapshot = { draftConfig: nextConfig, weddingDraft, sectionOrder };
    setHistory((previous) => {
      const stack = previous.stack.slice(0, previous.index + 1);
      if (JSON.stringify(stack.at(-1)) !== JSON.stringify(before)) stack.push(before);
      stack.push(after);
      const capped = stack.slice(-100);
      return { stack: capped, index: capped.length - 1 };
    });
    setDraftConfig(nextConfig);
    if (action.type === 'delete') {
      setSelectedLayer(undefined);
      setSelectedCinematicTimingTrack(undefined);
    }
  }, [wedding?.templateId, draftConfig, weddingDraft, sectionOrder]);

  const handleCinematicWorldChange = useCallback((layers: CinematicWorldLayer[]) => {
    if (!layout || layout.family !== 'cinematic') return;
    handleCinematicLayoutChange(
      cinematicWorldKey(layout.keyPrefix, previewBreakpoint),
      serializeCinematicWorld(layout.world, previewBreakpoint, layers),
    );
  }, [layout, previewBreakpoint, handleCinematicLayoutChange]);

  const patchCinematicLayerFromCanvas = useCallback((layerId: string, patch: Partial<CinematicWorldGeometry>) => {
    if (!layout || layout.family !== 'cinematic') return;
    if (cinematicEffectPose?.layerId === layerId) return; // Reject stale base-layout messages during pose editing.
    const target = cinematicWorldLayers.find((layer) => layer.id === layerId);
    if (!target || target.locked || cinematicAncestors(target, cinematicWorldLayers).some((parent) => parent.locked) ||
      layout.sceneSets.find((set) => set.id === target.group)?.locked) return;
    handleCinematicWorldChange(cinematicWorldLayers.map((layer) =>
      layer.id === layerId ? { ...layer, ...patch } : layer));
  }, [layout, cinematicWorldLayers, handleCinematicWorldChange, cinematicEffectPose]);

  const patchCinematicEffectPose = useCallback((request: { effectId: string; layerId: string; side: 'from' | 'to'; patch: unknown }) => {
    if (layout?.family !== 'cinematic' || !cinematicEffectPose || request.effectId !== cinematicEffectPose.effectId ||
      request.layerId !== cinematicEffectPose.layerId || request.side !== cinematicEffectPose.side) return;
    const target = cinematicWorldLayers.find((layer) => layer.id === request.layerId);
    if (!target || target.locked || cinematicAncestors(target, cinematicWorldLayers).some((parent) => parent.locked) ||
      layout.sceneSets.find((set) => set.id === target.group)?.locked) return;
    if (!request.patch || typeof request.patch !== 'object') return;
    // Canvas may change only screen offsets and scale, never layout or unrelated motion fields.
    const patch = Object.fromEntries(Object.entries(request.patch).filter(([key, value]) =>
      ['xVw', 'yVh', 'scale'].includes(key) && typeof value === 'number' && Number.isFinite(value)));
    setDraftConfig((previous) => {
      const direction = resolveCinematicDirection(layout.keyPrefix, layout.direction, previous);
      return saveCinematicDirection(layout.keyPrefix, previous, { ...direction, effects: direction.effects.map((base) => {
        if (base.id !== request.effectId) return base;
        const effect = previewBreakpoint === 'desktop' ? { ...base, ...base.desktop } : base;
        const rounded = Object.fromEntries(Object.entries(patch).map(([key, value]) => [key, Math.round(Number(value) * 1000) / 1000]));
        const motion = normalizeMotion({ ...effect[request.side], ...rounded });
        return previewBreakpoint === 'desktop' ? { ...base, desktop: { ...base.desktop, [request.side]: motion } } : { ...base, [request.side]: motion };
      }) });
    });
  }, [layout, cinematicEffectPose, cinematicWorldLayers, previewBreakpoint]);

  const handleCinematicCameraChange = useCallback((cameras: CinematicBeatCamera[]) => {
    if (!layout || layout.family !== 'cinematic') return;
    handleCinematicLayoutChange(
      cinematicCameraKey(layout.keyPrefix, previewBreakpoint),
      serializeCinematicCamera(layout.camera, layout.beats, cameras, previewBreakpoint),
    );
  }, [layout, previewBreakpoint, handleCinematicLayoutChange]);

  const patchCinematicCamera = useCallback((patch: Partial<CameraState>, beatId?: string) => {
    if (cinematicMode === 'camera-compose') {
      setComposedCamera((current) => ({
        ...(current ?? sampleCamera(cinematicProgress, cinematicCameraLayout.timeline)),
        ...patch,
      }));
      return;
    }
    const targetId = beatId ?? activeCinematicCamera?.id;
    if (!targetId) return;
    handleCinematicCameraChange(cinematicCameraLayout.beatCameras.map((camera) =>
      camera.id === targetId ? { ...camera, ...patch } : camera));
  }, [cinematicMode, cinematicProgress, cinematicCameraLayout.timeline,
    activeCinematicCamera, cinematicCameraLayout.beatCameras, handleCinematicCameraChange]);

  const handleCinematicSequenceChange = useCallback((sequence: CinematicSequence) => {
    if (!layout || layout.family !== 'cinematic') return;
    handleCinematicLayoutChange(
      cinematicSequenceKey(layout.keyPrefix),
      serializeCinematicSequence(layout.sequenceDefinition, sequence),
    );
  }, [layout, handleCinematicLayoutChange]);

  const handleCinematicTracksChange = useCallback((tracks: CinematicSequenceTrack[]) => {
    if (!layout || layout.family !== 'cinematic') return;
    handleCinematicSequenceChange({ ...layout.sequence, tracks });
    // Preserve any old breakpoint visibility edits by starting from `cinematicTimelineTracks`,
    // then retire the legacy key once those values live in the versioned sequence.
    handleCinematicLayoutChange(cinematicVisibilityKey(layout.keyPrefix, previewBreakpoint), '');
  }, [layout, previewBreakpoint, handleCinematicSequenceChange, handleCinematicLayoutChange]);

  const patchCinematicTrack = useCallback((id: string, patch: Partial<CinematicSequenceTrack>) => {
    const animation = cinematicAnimationTracks.find((track) => track.id === id)?.assetAnimation;
    if (animation) {
      if (patch.clip) handleCinematicWorldChange(cinematicWorldLayers.map((layer) => layer.id === animation.layerId
        ? retimeAssetAnimation(layer, animation.animationId, patch.clip!, cinematicTimelineTracks, cinematicWorldLayers) : layer));
      return;
    }
    handleCinematicTracksChange(cinematicTimelineTracks.map((track) => track.id === id ? {
      ...track,
      ...patch,
      id: track.id,
      clip: patch.clip ? { ...track.clip, ...patch.clip } : track.clip,
      enter: patch.enter ? { ...track.enter, ...patch.enter } : track.enter,
      exit: patch.exit ? { ...track.exit, ...patch.exit } : track.exit,
      timing: patch.timing ? { ...track.timing, ...patch.timing } as CinematicSequenceTrack['timing'] : track.timing,
    } : track));
  }, [cinematicAnimationTracks, cinematicWorldLayers, handleCinematicWorldChange, cinematicTimelineTracks, handleCinematicTracksChange]);

  const resetCinematicTrack = useCallback((id: string) => {
    if (!layout || layout.family !== 'cinematic') return;
    const animation = cinematicAnimationTracks.find((track) => track.id === id)?.assetAnimation;
    if (animation) {
      handleCinematicWorldChange(cinematicWorldLayers.map((layer) => layer.id === animation.layerId ? { ...layer,
        animations: layer.animations?.map((item) => item.id === animation.animationId ? { ...item, ...NEUTRAL_ASSET_MOTION } : item),
      } : layer));
      return;
    }
    const shipped = layout.sequenceDefinition.tracks.find((track) => track.id === id);
    handleCinematicTracksChange(cinematicTimelineTracks.map((track) => {
      if (track.id !== id) return track;
      if (shipped) return shipped;
      return {
        ...track,
        timing: { mode: 'independent' as const },
        clip: { start: 0, enterEnd: 0, exitStart: 1, end: 1 },
        enter: { kind: 'fade' as const, easing: 'ease-out' as const },
        exit: { kind: 'fade' as const, easing: 'ease-in' as const },
      };
    }));
  }, [layout, cinematicAnimationTracks, cinematicWorldLayers, handleCinematicWorldChange, cinematicTimelineTracks, handleCinematicTracksChange]);

  const resetCinematicSequence = useCallback(() => {
    if (!layout || layout.family !== 'cinematic') return;
    setDraftConfig((previous) => resetCinematicProjectConfig(layout.keyPrefix, previous));
    const first = layout.sequenceDefinition.beats[0];
    if (first) {
      setSelectedCinematicBeat(first.id);
      setCinematicProgress(first.at);
    }
    setSelectedLayer(undefined);
    setSelectedCinematicTimingTrack(undefined);
    setCinematicMode('scene');
    setComposedCamera(undefined);
  }, [layout]);

  const makeCinematicLayerTimingIndependent = useCallback((layerId: string) => {
    if (!layout || layout.family !== 'cinematic') return;
    const layer = cinematicWorldLayers.find((candidate) => candidate.id === layerId);
    if (!layer) return;
    handleCinematicTracksChange(unlinkCinematicLayerTiming(cinematicTimelineTracks, layer, cinematicWorldLayers));
  }, [layout, cinematicWorldLayers, cinematicTimelineTracks, handleCinematicTracksChange]);

  const relinkCinematicLayerTiming = useCallback((layerId: string, sourceTrackId?: string) => {
    const layer = cinematicWorldLayers.find((candidate) => candidate.id === layerId);
    if (!layer) return;
    handleCinematicTracksChange(sourceTrackId
      ? linkCinematicLayerTiming(cinematicTimelineTracks, layer, sourceTrackId)
      : relinkCinematicLayerToGroup(cinematicTimelineTracks, layerId));
  }, [cinematicWorldLayers, cinematicTimelineTracks, handleCinematicTracksChange]);

  const createCinematicAssetTimingSet = useCallback((label: string, layerIds: string[]) => {
    const members = layerIds.flatMap((id) => {
      const layer = cinematicWorldLayers.find((candidate) => candidate.id === id);
      return layer ? [layer] : [];
    });
    if (!members.length) return undefined;
    const created = createCinematicTimingSet(cinematicTimelineTracks, label, members);
    handleCinematicTracksChange(created.tracks);
    return created.setId;
  }, [cinematicWorldLayers, cinematicTimelineTracks, handleCinematicTracksChange]);

  const duplicateCinematicAssetTimingSet = useCallback((id: string) => {
    const duplicated = duplicateCinematicTimingSet(cinematicTimelineTracks, id);
    if (!duplicated.setId) return undefined;
    handleCinematicTracksChange(duplicated.tracks);
    return duplicated.setId;
  }, [cinematicTimelineTracks, handleCinematicTracksChange]);

  const deleteCinematicAssetTimingSet = useCallback((id: string) => {
    handleCinematicTracksChange(deleteCinematicTimingSet(cinematicTimelineTracks, id));
  }, [cinematicTimelineTracks, handleCinematicTracksChange]);

  const normalizeCinematicBeats = useCallback((beats: CinematicSequence['beats']) =>
    [...beats]
      .sort((left, right) => left.at - right.at || left.order - right.order)
      .map((beat, order) => ({ ...beat, order })), []);

  const createCinematicBeat = useCallback((label: string) => {
    if (!layout || layout.family !== 'cinematic') return;
    const cleanLabel = label.trim() || 'New camera beat';
    const baseId = cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'camera-beat';
    const used = new Set(layout.sequence.beats.map((beat) => beat.id));
    let id = baseId;
    let suffix = 2;
    while (used.has(id)) id = `${baseId}-${suffix++}`;
    const nextBeat = {
      id, label: cleanLabel, at: cinematicProgress, order: layout.sequence.beats.length,
      transitionIn: 'ease-out' as const,
    };
    const nextBeats = normalizeCinematicBeats([...layout.sequence.beats, nextBeat]);
    handleCinematicSequenceChange({ ...layout.sequence, beats: nextBeats });

    const camera = composedCamera ?? sampleCamera(cinematicProgress, cinematicCameraLayout.timeline);
    handleCinematicLayoutChange(
      cinematicCameraKey(layout.keyPrefix, previewBreakpoint),
      serializeCinematicCamera(
        layout.camera, beatsFromSequence({ ...layout.sequence, beats: nextBeats }),
        [...cinematicCameraLayout.beatCameras, { id, ...camera }], previewBreakpoint,
      ),
    );
    setSelectedCinematicBeat(id);
    setCinematicMode('camera-beat');
    setComposedCamera(undefined);
  }, [layout, cinematicProgress, composedCamera, cinematicCameraLayout.timeline,
    cinematicCameraLayout.beatCameras, normalizeCinematicBeats, handleCinematicSequenceChange,
    handleCinematicLayoutChange, previewBreakpoint]);

  const patchCinematicBeat = useCallback((id: string, patch: Partial<CinematicSequence['beats'][number]>) => {
    if (!layout || layout.family !== 'cinematic') return;
    const beats = normalizeCinematicBeats(layout.sequence.beats.map((beat) =>
      beat.id === id ? { ...beat, ...patch, id } : beat));
    handleCinematicSequenceChange({ ...layout.sequence, beats });
  }, [layout, normalizeCinematicBeats, handleCinematicSequenceChange]);

  const patchCinematicReference = useCallback((id: string, patch: ReferencePatch) => {
    if (!layout || layout.family !== 'cinematic') return;
    // Uploads can finish after changing beats. Merge into the latest draft, never an old snapshot.
    setDraftConfig((previous) => {
      const project = resolveCinematicProjectConfig(layout.keyPrefix, previous);
      const sequence = resolveCinematicSequence(layout.keyPrefix, layout.sequenceDefinition, project.config).sequence;
      if (!sequence.beats.some((beat) => beat.id === id)) return previous;
      return updateCinematicProjectValue(layout.keyPrefix, previous, cinematicSequenceKey(layout.keyPrefix),
        serializeCinematicSequence(layout.sequenceDefinition, { ...sequence, beats: sequence.beats.map((beat) => beat.id === id ? { ...beat, ...patch } : beat) }));
    });
  }, [layout]);

  const duplicateCinematicBeat = useCallback((id: string) => {
    if (!layout || layout.family !== 'cinematic') return;
    const source = layout.sequence.beats.find((beat) => beat.id === id);
    const sourceCamera = cinematicCameraLayout.beatCameras.find((camera) => camera.id === id);
    if (!source || !sourceCamera) return;
    const ordered = [...layout.sequence.beats].sort((left, right) => left.at - right.at);
    const index = ordered.findIndex((beat) => beat.id === id);
    const nextAt = ordered[index + 1]?.at ?? Math.min(1, source.at + .08);
    const at = Math.min(.995, source.at + Math.max(.01, (nextAt - source.at) / 2));
    let duplicateId = `${id}-copy`;
    let suffix = 2;
    const used = new Set(ordered.map((beat) => beat.id));
    while (used.has(duplicateId)) duplicateId = `${id}-copy-${suffix++}`;
    const duplicate = { ...source, id: duplicateId, label: `${source.label} copy`, at };
    const nextBeats = normalizeCinematicBeats([...layout.sequence.beats, duplicate]);
    handleCinematicSequenceChange({ ...layout.sequence, beats: nextBeats });
    handleCinematicLayoutChange(
      cinematicCameraKey(layout.keyPrefix, previewBreakpoint),
      serializeCinematicCamera(
        layout.camera, beatsFromSequence({ ...layout.sequence, beats: nextBeats }),
        [...cinematicCameraLayout.beatCameras, { ...sourceCamera, id: duplicateId }], previewBreakpoint,
      ),
    );
    setSelectedCinematicBeat(duplicateId);
    setCinematicProgress(at);
    setCinematicMode('camera-beat');
  }, [layout, cinematicCameraLayout.beatCameras, normalizeCinematicBeats,
    handleCinematicSequenceChange, handleCinematicLayoutChange, previewBreakpoint]);

  const deleteCinematicBeat = useCallback((id: string) => {
    if (!layout || layout.family !== 'cinematic' || layout.sequence.beats.length <= 1) return;
    const removal = removeCinematicNarrativeMoment(layout.sequence, id);
    const nextBeats = normalizeCinematicBeats(removal.sequence.beats);
    handleCinematicSequenceChange({ ...removal.sequence, beats: nextBeats });
    handleCinematicLayoutChange(
      cinematicCameraKey(layout.keyPrefix, previewBreakpoint),
      serializeCinematicCamera(
        layout.camera, beatsFromSequence({ ...layout.sequence, beats: nextBeats }),
        cinematicCameraLayout.beatCameras.filter((camera) => camera.id !== id), previewBreakpoint,
      ),
    );
    const next = nextBeats.find((beat) => beat.id === removal.nextBeatId) ?? nextBeats.reduce((best, beat) =>
      Math.abs(beat.at - cinematicProgress) < Math.abs(best.at - cinematicProgress) ? beat : best,
    nextBeats[0]);
    setSelectedCinematicBeat(next.id);
    setCinematicProgress(next.at);
  }, [layout, cinematicProgress, cinematicCameraLayout.beatCameras, normalizeCinematicBeats,
    handleCinematicSequenceChange, handleCinematicLayoutChange, previewBreakpoint]);

  const restoreDeletedCinematicBeat = useCallback((id: string) => {
    if (!layout || layout.family !== 'cinematic') return;
    const restored = restoreCinematicNarrativeMoment(
      layout.sequenceDefinition, layout.sequence, id,
    );
    const beats = normalizeCinematicBeats(restored.beats);
    const sequence = { ...restored, beats };
    const projectedBeats = beatsFromSequence(sequence);
    const restoredBeat = beats.find((beat) => beat.id === id);
    if (!restoredBeat) return;
    handleCinematicSequenceChange(sequence);

    const initialCamera = baseBeatCameras(
      layout.camera, projectedBeats, previewBreakpoint,
    ).find((camera) => camera.id === id);
    const cameras = cinematicCameraLayout.beatCameras.filter((camera) => camera.id !== id);
    if (initialCamera) cameras.push(initialCamera);
    handleCinematicLayoutChange(
      cinematicCameraKey(layout.keyPrefix, previewBreakpoint),
      serializeCinematicCamera(layout.camera, projectedBeats, cameras, previewBreakpoint),
    );
    setSelectedCinematicBeat(id);
    setCinematicProgress(restoredBeat.at);
    setCinematicMode('camera-beat');
    setComposedCamera(undefined);
  }, [layout, previewBreakpoint, cinematicCameraLayout.beatCameras, normalizeCinematicBeats,
    handleCinematicSequenceChange, handleCinematicLayoutChange]);

  const resetCinematicBeat = useCallback((id: string) => {
    if (!layout || layout.family !== 'cinematic') return;
    const shipped = layout.sequenceDefinition.beats.find((beat) => beat.id === id);
    if (!shipped) return;
    const beats = normalizeCinematicBeats(layout.sequence.beats.map((beat) =>
      beat.id === id ? { ...shipped } : beat));
    handleCinematicSequenceChange({ ...layout.sequence, beats });
    const initial = baseBeatCameras(
      layout.camera, beatsFromSequence({ ...layout.sequence, beats }), previewBreakpoint,
    ).find((camera) => camera.id === id);
    if (initial) {
      handleCinematicLayoutChange(
        cinematicCameraKey(layout.keyPrefix, previewBreakpoint),
        serializeCinematicCamera(
          layout.camera, beatsFromSequence({ ...layout.sequence, beats }),
          cinematicCameraLayout.beatCameras.map((camera) => camera.id === id ? initial : camera),
          previewBreakpoint,
        ),
      );
    }
    setCinematicProgress(shipped.at);
  }, [layout, previewBreakpoint, cinematicCameraLayout.beatCameras,
    normalizeCinematicBeats, handleCinematicSequenceChange, handleCinematicLayoutChange]);

  const handleCinematicVisibilityChange = useCallback((sets: CinematicVisibilitySet[]) => {
    if (!layout || layout.family !== 'cinematic') return;
    handleCinematicLayoutChange(
      cinematicVisibilityKey(layout.keyPrefix, previewBreakpoint),
      serializeCinematicVisibility(layout.visibility, sets),
    );
  }, [layout, previewBreakpoint, handleCinematicLayoutChange]);

  const handleCinematicProgressChange = useCallback((progress: number) => {
    setEffectPoseRequest(undefined);
    if (!cinematicBeats.length) return;
    const closest = cinematicBeats.reduce((best, beat) =>
      Math.abs(beat.progress - progress) < Math.abs(best.progress - progress) ? beat : best,
    cinematicBeats[0]);
    setSelectedCinematicBeat(closest.id);
    // Scene and Compose modes have a free playhead. Edit Beat is anchored to its exact keyframe so
    // the composition on screen is always the frame that the sliders/drag surface will persist.
    setCinematicProgress(cinematicMode === 'camera-beat' ? closest.progress : progress);
  }, [cinematicBeats, cinematicMode]);

  // Canvas drag/resize (see Layer.tsx's PREVIEW_LAYER_EDIT) lands here — the same patch-and-
  // reserialize AdjustPanel's own sliders already do, just triggered from the preview iframe
  // instead of the dock. `stageId` comes straight off the message (Layer.tsx always knows its own
  // stage — see its `stageId` prop) rather than being assumed to be `activeStage`: cross-section
  // selection means a drag can now start on a layer whose stage isn't the one the dock has open
  // yet (the click that started it is also what's asking the dock to switch there), so relying on
  // `activeStage` here would race that switch instead of just using the id the drag already knows.
  const patchLayerFromCanvas = useCallback((stageId: string, layerId: string, patch: Partial<LayerModel>) => {
    if (!layout || layout.family !== 'stage') return;
    const def = layout.stages[stageId];
    if (!def) return;
    const breakpoint: Breakpoint = previewBreakpoint;
    const { layers, groups, bgFit, bgPosition, bgScale, bgSrc } = resolveStage(layout.keyPrefix, def, breakpoint, draftConfig);
    const { layers: nextLayers, groups: nextGroups } = patchStageLayer(layers, groups, layerId, patch,
      stageArtScale(def, breakpoint, { w: frame.w, h: frame.svh }));
    handleLayoutChange(
      layoutKey(layout.keyPrefix, breakpoint, def.id),
      serializeStage(def, breakpoint, nextLayers, { bgFit, bgPosition, bgScale, bgSrc }, nextGroups),
    );
  }, [layout, previewBreakpoint, draftConfig, handleLayoutChange, frame.w, frame.svh]);

  // Opening the dock collapses the left inspector to its icon rail so the centred preview keeps room.
  const toggleAdjust = useCallback(() => {
    setAdjusting((a) => {
      const next = !a;
      setEditorMode(next ? 'collapsed' : 'expanded');
      return next;
    });
  }, []);

  // Upload an image for the Adjust panel (a layer image, or a stage-background replacement). Uses
  // the LAYER_IMAGE slot, which — unlike the portrait/bg slots — never upserts, so a stage can hold
  // many. Returns the /uploads/… URL the layer's `src` / `bgSrc` points at.
  const handleAdjustUpload = useCallback(async (file: File): Promise<string> => {
    if (masterTemplateId !== undefined) return templateService.uploadAsset(masterTemplateId, file);
    if (!weddingId) throw new Error('no wedding');
    const photo = await photoService.upload(weddingId, '', 'Layer image', file, 'COUPLE', TemplateSlots.LAYER_IMAGE);
    return photo.photoUrl;
  }, [weddingId, masterTemplateId]);

  // Quick-nav chips for the active block, in the same order the groups render.
  const blockChips = useMemo(() => {
    if (activeBlock === 'music') return ['Audio', 'Settings'];
    const groups = schema.groupsFor(activeBlock);
    const ordered = GROUP_ORDER[activeBlock] ?? [];
    const titles = [...ordered.filter((t) => groups.has(t)), ...[...groups.keys()].filter((t) => !ordered.includes(t))];
    const chips: string[] = [];
    for (const t of titles) {
      if (t === 'Navigation Icons' && !showNavIcons) continue;
      const chip = chipOf((groups.get(t) ?? []).filter((field) => field.fieldType !== 'hidden'));
      if (chip && !chips.includes(chip)) chips.push(chip);
    }
    return chips;
  }, [schema, activeBlock, showNavIcons]);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    if (master && u.role !== 'SUPER_ADMIN') { router.push('/login'); return; }
    setUser(master ? { ...u, tier: 'PRO' } : u);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (master && user?.role === 'SUPER_ADMIN') { loadMaster(); return; }
    if (!weddingId) return;
    load();
  }, [weddingId, masterTemplateId, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  // Push draft to iframe. Coalesced to one post per animation frame: dragging an Adjust slider
  // fires setDraftConfig many times a second, and re-serialising the whole payload each tick would
  // make the preview stutter.
  const postFrameRef = useRef(0);
  const getPreviewElement = useCallback(() => iframeRef.current?.parentElement ?? null, []);
  useEffect(() => {
    if (!wedding) return;
    const payload = {
      wedding: { ...wedding, ...weddingDraft, name1: weddingDraft.brideName, name2: weddingDraft.groomName, eventTitle: weddingDraft.eventTitle, displayName: wedding.eventType === 'WEDDING' ? `${weddingDraft.brideName} & ${weddingDraft.groomName}` : weddingDraft.eventTitle || weddingDraft.brideName },
      masterPreview: master,
      navigationAdjust: adjusting && hasNavigationAdjust ? (navigationSelected ? 'selected' : 'available') : undefined,
      coupleMedia: showSampleGallery ? [...coupleMedia, ...SAMPLE_GALLERY] : coupleMedia,
      photos: master && wedding.templateId === 7 ? ROMAN_GARDEN_SAMPLE_PHOTOS : undefined,
      wishes: SAMPLE_WISHES, photoBoothEnabled,
      previewSeating: previewSeating && (master || eventSeating.enabled) && draftConfig['seating.mode'] !== 'organizer',
      seatingEnabled: (master ? sampleSeating || previewSeating : eventSeating.enabled) && draftConfig['seating.mode'] !== 'organizer',
      tables: master ? (sampleSeating ? SAMPLE_TABLES : []) : eventSeating.tables,
      customConfig: draftConfig, itinerary,
      // Selection rides along so the preview can outline the layer being edited; the config
      // itself flows through customConfig, one-way — the panel no longer lives in the iframe.
      editor: {
        enabled: adjusting,
        breakpoint: previewBreakpoint,
        selectedStage: navigationSelected ? undefined : activeStage,
        selectedLayer: navigationSelected ? undefined : selectedLayer,
        cinematic: layout?.family === 'cinematic' && activeCinematicBeat
          ? {
              progress: cinematicProgress,
              beatId: activeCinematicBeat.id,
              mode: cinematicMode,
              effectPose: cinematicEffectPose,
              cameraOverride: cinematicMode === 'camera-compose' ? composedCamera : undefined,
              referenceSrc: cinematicReferenceVisible ? activeCinematicBeat.referenceSrc : undefined,
              referenceOpacity: activeCinematicBeat.referenceOpacity ?? cinematicReferenceOpacity,
              referenceFit: activeCinematicBeat.referenceFit,
            }
          : undefined,
        // The device box the stage pins itself to while revealing — the *emulated* layout size
        // (see previewBreakpoint above / lib/inviteViewport.ts), not the raw device box, so a
        // sheet or any other cqi/%-sized content pinned against this frame matches what a guest's
        // browser actually lays out, not a narrower box with no viewport-meta emulation applied.
        // frameW/frameH are kept for one release as a fallback for a stale cached payload; `frame`
        // is authoritative and additionally carries `svh` (what Reveal actually pins to — see
        // PreviewPanel's `visibleH`) and safe-area insets. Divides by `frame.scale`, this device's
        // own requested→effective ratio (lib/devicePresets.ts), not a single hardcoded constant.
        frameW: Math.round(frame.w / frame.scale),
        frameH: Math.round(frame.svh / frame.scale),
        frame: {
          w: Math.round(frame.w / frame.scale),
          h: Math.round(frame.lvh / frame.scale),
          svh: Math.round(frame.svh / frame.scale),
          safe: {
            top: Math.round(frame.safe.top / frame.scale),
            right: Math.round(frame.safe.right / frame.scale),
            bottom: Math.round(frame.safe.bottom / frame.scale),
            left: Math.round(frame.safe.left / frame.scale),
          },
        },
      },
    };
    payloadRef.current = payload;
    try { localStorage.setItem('preview_draft_v2', JSON.stringify(payload)); } catch {}
    if (postFrameRef.current) return;
    postFrameRef.current = requestAnimationFrame(() => {
      postFrameRef.current = 0;
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'PREVIEW_UPDATE', payload: payloadRef.current }, window.location.origin,
      );
    });
  }, [draftConfig, weddingDraft, coupleMedia, showSampleGallery, photoBoothEnabled, itinerary, wedding, adjusting, master, sampleSeating, previewSeating, eventSeating,
    previewBreakpoint, activeStage, selectedLayer, frame, layout, activeCinematicBeat, hasNavigationAdjust, navigationSelected,
    cinematicProgress, cinematicMode, cinematicEffectPose, composedCamera, cinematicReferenceVisible, cinematicReferenceOpacity]);

  // Replay the latest payload when the iframe (re)mounts, and handle canvas-originated selection
  // + drag/resize. Layer.tsx posts these directly (it has no callback prop into this tree — it's
  // the same component rendering on the public invitation, where none of this ever fires).
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'PREVIEW_CINEMATIC_EFFECT_POSE_EDIT') {
        if (event.source === iframeRef.current?.contentWindow) patchCinematicEffectPose(event.data);
        return;
      }
      if (event.data?.type === 'PREVIEW_READY' && payloadRef.current) {
        iframeRef.current?.contentWindow?.postMessage({ type: 'PREVIEW_UPDATE', payload: payloadRef.current }, window.location.origin);
      }
      if (event.data?.type === 'PREVIEW_SEATING_DISMISS' && event.source === iframeRef.current?.contentWindow) {
        setPreviewSeating(false);
      }
      if (event.data?.type === 'PREVIEW_NAVIGATION_SELECT' && event.source === iframeRef.current?.contentWindow) {
        setAdjustNavigation(true);
      }
      if (event.data?.type === 'PREVIEW_LAYER_SELECT') {
        setAdjustNavigation(false);
        // Cross-section selection: a click on canvas can now come from a stage other than the
        // one the dock currently has open (Layer.tsx always includes its own `stageId`) — jump
        // the dock's active tab to match so the layer list/detail panel reflect what was clicked,
        // without requiring the couple to click the section tab first.
        const stageId = event.data.stageId as string | undefined;
        if (stageId) setSelectedStage(stageId);
        setSelectedLayer(event.data.layerId as string);
      }
      if (event.data?.type === 'PREVIEW_HOTKEY') {
        // Same actions as the window-level handler below; the preview iframe forwards its own
        // keydowns because they never bubble out of it.
        const key = event.data.key as string;
        if (key === 's') { if (isDirtyRef.current) saveRef.current?.(); }
        else if (key === 'y' || (key === 'z' && event.data.shiftKey)) redoRef.current?.();
        else if (key === 'z') undoRef.current?.();
      }
      if (event.data?.type === 'PREVIEW_LAYER_EDIT') {
        const stageId = (event.data.stageId as string | undefined) ?? activeStage;
        patchLayerFromCanvas(stageId, event.data.layerId as string, event.data.patch as Partial<LayerModel>);
      }
      if (event.data?.type === 'PREVIEW_CINEMATIC_LAYER_SELECT') {
        setAdjustNavigation(false);
        const layerId = event.data.layerId as string | undefined;
        setSelectedLayer(layerId);
        setSelectedCinematicTimingTrack(undefined);
        if (layerId) setCinematicMode('scene');
      }
      if (event.data?.type === 'PREVIEW_CINEMATIC_LAYER_EDIT') {
        patchCinematicLayerFromCanvas(
          event.data.layerId as string,
          event.data.patch as Partial<CinematicWorldGeometry>,
        );
      }
      if (event.data?.type === 'PREVIEW_CINEMATIC_CAMERA_EDIT') {
        patchCinematicCamera(
          event.data.patch as Partial<CameraState>,
          event.data.beatId as string | undefined,
        );
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [patchLayerFromCanvas, patchCinematicLayerFromCanvas, patchCinematicCamera, patchCinematicEffectPose, activeStage]);

  // Record a history snapshot ~500ms after the draft settles — long enough that a slider drag or a
  // burst of rapid edits (the Adjust dock's own per-frame patches during a canvas drag included)
  // collapses into one undo step instead of one per intermediate value, short enough that a couple
  // of quick, separate edits still land as separate steps. Skipped entirely for the render that
  // applies an undo/redo itself (`applyingHistoryRef`), so navigating history never re-records the
  // state it just navigated to.
  useEffect(() => {
    if (loading) return;
    if (applyingHistoryRef.current) { applyingHistoryRef.current = false; return; }
    const snap: EditSnapshot = { draftConfig, weddingDraft, sectionOrder };
    const t = setTimeout(() => {
      setHistory((prev) => {
        const base = prev.stack.slice(0, prev.index + 1);
        const last = base[base.length - 1];
        if (last && JSON.stringify(last) === JSON.stringify(snap)) return prev;
        // Cap so a long editing session can't grow this without bound.
        const nextStack = [...base, snap].slice(-100);
        return { stack: nextStack, index: nextStack.length - 1 };
      });
    }, 500);
    return () => clearTimeout(t);
  }, [draftConfig, weddingDraft, sectionOrder, loading]);

  // Group commands are discrete edits, so even rapid create/rename/move commands each get an
  // undo step. Capture the current draft first in case the debounced recorder is still pending.
  const handleGroupLayoutChange = (key: string, value: string) => {
    if ((draftConfig[key] ?? '') === value) return;
    const nextConfig = { ...draftConfig };
    if (value === '') delete nextConfig[key];
    else nextConfig[key] = value;
    const before: EditSnapshot = { draftConfig, weddingDraft, sectionOrder };
    const after: EditSnapshot = { ...before, draftConfig: nextConfig };
    setHistory((previous) => {
      const stack = previous.stack.slice(0, previous.index + 1);
      if (JSON.stringify(stack.at(-1)) !== JSON.stringify(before)) stack.push(before);
      const next = [...stack, after].slice(-100);
      return { stack: next, index: next.length - 1 };
    });
    setDraftConfig(nextConfig);
  };

  // Reads `history` from the closure (this render's value) rather than a functional updater —
  // both handlers only ever run from a discrete user action (a click or a keydown), never from a
  // hot path where the value could go stale between calls, so this stays simple and keeps every
  // other draft-state setter (draftConfig/weddingDraft/sectionOrder) a plain top-level call instead
  // of nesting them inside setHistory's own updater.
  const handleUndo = useCallback(() => {
    if (history.index <= 0) return;
    const newIndex = history.index - 1;
    applyingHistoryRef.current = true;
    const snap = history.stack[newIndex];
    setDraftConfig(snap.draftConfig);
    setWeddingDraft(snap.weddingDraft);
    setSectionOrder(snap.sectionOrder);
    setHistory((prev) => ({ ...prev, index: newIndex }));
  }, [history]);

  const handleRedo = useCallback(() => {
    if (history.index < 0 || history.index >= history.stack.length - 1) return;
    const newIndex = history.index + 1;
    applyingHistoryRef.current = true;
    const snap = history.stack[newIndex];
    setDraftConfig(snap.draftConfig);
    setWeddingDraft(snap.weddingDraft);
    setSectionOrder(snap.sectionOrder);
    setHistory((prev) => ({ ...prev, index: newIndex }));
  }, [history]);

  useEffect(() => {
    undoRef.current = handleUndo;
    redoRef.current = handleRedo;
    saveRef.current = handleSave;
    isDirtyRef.current = isDirty;
  });

  // Keyboard shortcuts: Cmd+S to save, Cmd+Z to undo, Cmd+Shift+Z (and the Windows-standard
  // Cmd+Y) to redo.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === 's') { e.preventDefault(); if (isDirty) handleSave(); return; }
      if (e.key.toLowerCase() === 'z' && e.shiftKey) { e.preventDefault(); handleRedo(); return; }
      if (e.key.toLowerCase() === 'z') { e.preventDefault(); handleUndo(); return; }
      if (e.key.toLowerCase() === 'y') { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isDirty, handleUndo, handleRedo]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const showStudioError = (error: unknown) => {
    setStudioNotice('');
    setStudioError((error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not complete this action. Please try again.');
  };

  const applyMaster = (template: Template, state: StudioState) => {
    const sample = studioSample(template, state.sample);
    const config: Record<string, string> = {
      ...buildDefaultConfig(template.templateId),
      'walimah.body': '<p>With our families, we warmly invite you to join our celebration.</p>',
      ...state.config,
      ...state.sample.contentConfig,
    };
    setStudio(state); setTemplates([template]); setWedding(sample.wedding);
    setWeddingDraft(sample.details); setWeddingSaved(sample.details);
    setCoupleMedia(sample.media); setItinerary(sample.itinerary); setPhotoBoothEnabled(true);
    setDraftConfig(config); setSavedConfig(config); setSectionOrder(parseSectionOrder(config['section.order']));
    setSavedSample(JSON.stringify({ itinerary: sample.itinerary, media: sample.media, eventType: sample.wedding.eventType }));
    setHistory({ stack: [], index: -1 });
  };
  const loadMaster = async () => {
    if (masterTemplateId === undefined) return;
    setLoading(true); setStudioError('');
    try {
      const [template, state] = await Promise.all([templateService.getById(masterTemplateId), templateStudioService.get(masterTemplateId)]);
      applyMaster(template, state);
    } catch (e) { showStudioError(e); }
    finally { setLoading(false); }
  };
  const saveMaster = async () => {
    if (masterTemplateId === undefined || !studio || !wedding) return;
    setSaving(true); setStudioError(''); setStudioNotice('');
    try {
      const config = layout?.family === 'cinematic' ? migrateCinematicConfigToProject(layout.keyPrefix, draftConfig) : draftConfig;
      const state = await templateStudioService.save(masterTemplateId, studio.version, config,
        { wedding: weddingDraft, eventType: wedding.eventType, itinerary, media: coupleMedia });
      setStudio(state); setSavedConfig(config); setDraftConfig(config); setWeddingSaved({ ...weddingDraft });
      setSavedSample(sampleSnapshot); setStudioNotice('Draft saved. Published invitations are unchanged.');
    } catch (e) { showStudioError(e); }
    finally { setSaving(false); }
  };
  const publishMaster = async () => {
    if (masterTemplateId === undefined || !studio || isDirty) return;
    if (!window.confirm('Publish this master design? Existing invitations will inherit changes wherever they have no saved override.')) return;
    setStudioBusy(true); setStudioError(''); setStudioNotice('');
    try { setStudio(await templateStudioService.publish(masterTemplateId, studio.version)); setStudioNotice('Master published. Template previews and inherited invitation settings now use this design.'); }
    catch (e) { showStudioError(e); }
    finally { setStudioBusy(false); }
  };
  const restoreMaster = async () => {
    if (masterTemplateId === undefined || !studio) return;
    if (!window.confirm('Replace the current draft with this published design? Live invitations will not change until you publish.')) return;
    setStudioBusy(true); setStudioError(''); setStudioNotice('');
    try {
      const state = await templateStudioService.restore(masterTemplateId, studio.version, Number(restoreRevision));
      applyMaster(templates[0], state); setStudioNotice('Design loaded into draft. Review it before publishing.');
    } catch (e) { showStudioError(e); }
    finally { setStudioBusy(false); }
  };
  const exportMaster = async () => {
    if (masterTemplateId === undefined || !studio) return;
    setStudioBusy(true); setStudioError('');
    try { downloadBlob(`template-${masterTemplateId}-published.zip`, await templateStudioService.export(masterTemplateId, studio.version)); }
    catch (e) { showStudioError(e); }
    finally { setStudioBusy(false); }
  };
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const load = async () => {
    if (!weddingId) return;
    try {
      const [eventData, media, config, photoBooth, tmpl, itineraryItems, seating] = await Promise.all([
        eventService.getById(weddingId),
        photoService.getCoupleMediaByWeddingId(weddingId),
        templateConfigService.getByWeddingId(weddingId),
        eventFeatureService.isFeatureEnabled(weddingId, 'PHOTO_BOOTH'),
        templateService.getActive(),
        itineraryService.getByWeddingId(weddingId),
        eventFeatureService.isFeatureEnabled(weddingId, 'SEATING').then(async (enabled) => ({
          enabled, tables: enabled ? await tableService.getByWeddingId(weddingId) : [],
        })),
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
      setEventSeating(seating);
      setItinerary(itineraryItems);
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
    setDraftConfig((prev) => {
      const presetOverride = key === 'nav.size' ? 'nav.scalePercent' : key === 'nav.textSize' ? 'nav.textPercent' : undefined;
      return { ...prev, [key]: value, ...(presetOverride && prev[presetOverride] && { [presetOverride]: '' }) };
    });
  }, []);

  const handleSave = async () => {
    if (master) { await saveMaster(); return; }
    if (!weddingId || !wedding) return;
    setSaving(true);
    try {
      const configToSave = layout?.family === 'cinematic'
        ? migrateCinematicConfigToProject(layout.keyPrefix, draftConfig)
        : draftConfig;
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
      const supportedKeys = new Set(getConfigFields(t.templateId, 'SUPER_ADMIN').map((field) => field.key));
      const layoutPrefix = `t${t.templateId}.layout.`;
      const carried = Object.fromEntries(
        Object.entries({ ...draftConfig, ...serverConfig }).filter(
          ([k]) => supportedKeys.has(k) || k.startsWith(layoutPrefix),
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
    setPreviewSeating(block === 'seating');
    if (block === 'seating') {
      setSelectedLayer(undefined);
      if (master) setSampleSeating(true);
    }
    setAddMenuOpen(false);
    if (block === 'navigation' && adjusting && hasNavigationAdjust) setAdjustNavigation(true);
    if (editorMode === 'collapsed') setEditorMode('expanded');
    const previewBlock = block === 'seating' ? 'rsvp' : block;
    iframeRef.current?.contentWindow?.postMessage({
      type: 'PREVIEW_SCROLL',
      // sectionId lands on the exact element; fraction is the fallback the preview uses when a
      // template has no anchor for this block (e.g. 'details'/'music', or a template not yet
      // covered by sectionAnchorId).
      sectionId: wedding ? sectionAnchorId(wedding.templateId, previewBlock, { draftConfig }) : undefined,
      fraction: scrollFractionFor(previewBlock, order),
    }, window.location.origin);
  };

  const removedSections = SECTION_CODES
    .map((code) => `!${code}`)
    .filter((marker) => draftConfig['section.order']?.split(',').includes(marker));

  const updateSectionOrder = (visible: string[], removed = removedSections) => {
    const order = [...visible, ...removed].join(',');
    setSectionOrder(parseSectionOrder(order));
    setConfig('section.order', order);
  };

  const handleMoveBlock = (code: string, dir: 'up' | 'down') => {
    const next = moveIndependentSection(wedding?.templateId ?? 1, sectionOrder, code, dir);
    updateSectionOrder(next);
  };

  const handleAddBlock = (code: string) => {
    const remaining = removedSections.filter((marker) => marker !== `!${code}`);
    const restored = parseSectionOrder([...sectionOrder, ...remaining].join(','));
    updateSectionOrder(restored, remaining);
    selectBlock(code as BlockId, restored);
  };

  const handleRemoveBlock = (code: string) => {
    updateSectionOrder(sectionOrder.filter((entry) => entry !== code), [...removedSections, `!${code}`]);
    if (activeBlock === code) setActiveBlock('details');
  };

  const handlePhotoDrop = async (slot: number, file: File) => {
    if (!weddingId && !master) return;
    setUploadingSlot(slot);
    try {
      const uploaded: Photo = masterTemplateId !== undefined
        ? { photoId: Date.now(), eventId: 0, photoUrl: await templateService.uploadAsset(masterTemplateId, file), templateSlot: slot, guestName: '', caption: '', uploadedBy: 'COUPLE', isApproved: true, isVisible: true, isFeatured: false, fileSize: file.size, contentType: file.type, createdDate: new Date().toISOString() }
        : await photoService.upload(weddingId!, '', '', file, 'COUPLE', slot);
      setCoupleMedia((prev) => slot === TemplateSlots.COUPLE_GALLERY
        ? [...prev, uploaded]
        : [...prev.filter((p) => p.templateSlot !== slot), uploaded]);
    } catch { alert('Upload failed.'); }
    finally { setUploadingSlot(null); }
  };

  const handlePhotoRemove = async (photo: Photo) => {
    try {
      if (!master) await photoService.delete(photo.photoId);
      setCoupleMedia((prev) => prev.filter((p) => p.photoId !== photo.photoId));
      if (photo.templateSlot === TemplateSlots.COUPLE_GALLERY) {
        setDraftConfig((prev) => {
          if (prev['gallery.order'] === undefined) return prev;
          return { ...prev, 'gallery.order': prev['gallery.order'].split(',').filter((id) => id !== String(photo.photoId)).join(',') };
        });
      }
    } catch { alert('Could not remove photo.'); }
  };

  const cycleEditorMode = () => {
    setEditorMode(m => m === 'expanded' ? 'collapsed' : m === 'collapsed' ? 'hidden' : 'expanded');
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>Loading editor…</p></div>;
  }
  if (!wedding) return <div role="alert" style={{ padding: 32 }}>{studioError || 'Could not load editor.'} <button onClick={() => master ? loadMaster() : load()}>Retry</button></div>;

  const showPortraitSlots = [3, 4].includes(wedding.templateId);
  const portraitSlots = wedding.templateId === 4 ? PORTRAIT_SLOTS_T4 : PORTRAIT_SLOTS_T3;
  const canArrangeSections = schema.has('section.order') && !wedding.templateStagesJson && ['partial', 'dom', 'visual'].includes(getTemplateCapabilities(wedding.templateId).sectionOrder);
  const availableBlocks = canArrangeSections ? SECTION_BLOCKS.filter((b) => !sectionOrder.includes(b.code)) : [];
  const arrangement = sectionArrangement(wedding.templateId, sectionOrder);
  const activeSectionIndex = canArrangeSections ? arrangement.movable.indexOf(activeBlock) : -1;
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
            <ToggleSwitch label={f.label} value={value === 'true'} onChange={(v) => setConfig(f.key, v ? 'true' : 'false')} />
          </div>
        );
      }
      return null;
    });

  // One schema field → the matching primitive.
  const renderField = (f: TemplateConfigField) => {
    const value = f.key === 'nav.style' ? nav.style
      : f.key === 'nav.position' ? nav.position
      : f.key === 'nav.content' ? nav.content
        : draftConfig[f.key] ?? f.defaultValue;

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
            <ToggleSwitch label={f.label} value={value === 'true'} onChange={(v) => setConfig(f.key, v ? 'true' : 'false')} />
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
            <FieldLabel hint={f.key === 'nav.content' && nav.style === 'bubbles' ? 'Floating bubbles always use icons.' : f.hint}>{f.label}</FieldLabel>
            <SelectField value={value} options={f.options ?? []} labels={f.optionLabels} ariaLabel={f.label}
              disabled={f.key === 'nav.content' && nav.style === 'bubbles'} onChange={(v) => setConfig(f.key, v)} />
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
            compact={f.key.startsWith('nav.icon.')}
            upload={master || f.key.startsWith('nav.icon.') ? handleAdjustUpload : undefined}
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
            {eventType === 'PARTY' && (
              <>
                {recordField('event.eventTitle', 'Event Title', weddingDraft.eventTitle, 150, (v) => setWeddingDraft((d) => ({ ...d, eventTitle: v })), undefined, "e.g. Aiman's 21st Birthday")}
                {recordField('event.name1', "Honoree's Name", weddingDraft.brideName, 100, (v) => setWeddingDraft((d) => ({ ...d, brideName: v })), undefined, "e.g. Aiman")}
              </>
            )}
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
      if (master) return { before: <p>Choose a different master from Themes. Sample content here never changes client events.</p> };
      // A WEDDING event shouldn't be offered a PARTY/CEREMONY-only template to switch to (and
      // vice versa) — same matchesEvent gate the picker and admin create forms use.
      const switchableTemplates = templates.filter((t) => matchesEvent(t, wedding.eventType ?? 'WEDDING'));
      return {
        before: (
          <>
            {switchingTemplate && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>Switching template…</p>}
            <TemplateLibrary templates={switchableTemplates} userTier={user?.tier ?? 'BASIC'} currentTemplateId={wedding.templateId} onSelect={handleSwitchTemplate} compact />
          </>
        ),
      };
    }

    if (block === 'navigation' && title === 'Menu Items') {
      const configured = draftConfig['nav.items'];
      const codes = schema.has('gallery.title') ? [...SECTION_CODES, 'couple-gallery'] : SECTION_CODES;
      const defaults = schema.has('gallery.title') ? [...sectionOrder, 'couple-gallery'] : sectionOrder;
      const visible = (configured === undefined ? defaults : [...new Set(configured.split(','))])
        .filter((id) => codes.includes(id));
      const items = [...visible, ...codes.filter((id) => !visible.includes(id))];
      const changeItems = (next: string[]) => setConfig('nav.items', next.join(',') || 'none');
      const moveItem = (id: string, direction: number) => {
        const index = visible.indexOf(id);
        const next = [...visible];
        [next[index], next[index + direction]] = [next[index + direction], next[index]];
        changeItems(next);
      };
      return { before: (
        <div style={{ display: 'grid', gap: 8 }}>
          {items.map((id) => {
            const index = visible.indexOf(id);
            const label = id === 'couple-gallery' ? 'Gallery' : SECTION_BLOCKS.find((section) => section.code === id)?.label ?? id;
            return <div key={id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <label style={{ flex: 1, fontSize: 13 }}>
                <input type="checkbox" checked={index >= 0} onChange={(event) =>
                  changeItems(event.target.checked ? [...visible, id] : visible.filter((item) => item !== id))} /> {label}
              </label>
              <Button size="sm" variant="secondary" aria-label={`Move ${label} up`} disabled={index < 1} onClick={() => moveItem(id, -1)}>↑</Button>
              <Button size="sm" variant="secondary" aria-label={`Move ${label} down`} disabled={index < 0 || index === visible.length - 1} onClick={() => moveItem(id, 1)}>↓</Button>
            </div>;
          })}
        </div>
      ) };
    }

    if (block === 'couple-gallery' && title === 'Gallery') {
      const gallery = orderedCoupleGallery(coupleMedia, draftConfig['gallery.order']);
      const movePhoto = (index: number, direction: number) => {
        const ids = gallery.map((photo) => photo.photoId);
        [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
        setConfig('gallery.order', ids.join(','));
      };
      return { after: (
        <>
          {master && <p style={{ fontSize: 12, margin: 0 }}>Photos uploaded here are for the master preview.</p>}
          {showSampleGallery && <div>
            <p style={{ fontSize: 12, marginBlock: '0 8px' }}>Sample images are visible in this preview until you add your own.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {SAMPLE_GALLERY.map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={photo.photoId} src={photo.photoUrl} alt={photo.caption} width={48} height={48}
                  style={{ borderRadius: 6, objectFit: 'cover' }} />
              ))}
            </div>
          </div>}
          {gallery.length < 12 && (
            <PhotoDropZone slot={TemplateSlots.COUPLE_GALLERY} label="Add a photo" photo={undefined}
              uploading={uploadingSlot === TemplateSlots.COUPLE_GALLERY}
              onDrop={handlePhotoDrop} onRemove={handlePhotoRemove} />
          )}
          <div style={{ display: 'grid', gap: 8 }}>
            {gallery.map((photo, index) => (
              <div key={photo.photoId} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={couplePhotoUrl(photo.photoUrl)}
                  alt={`Gallery photo ${index + 1}`} width={48} height={48}
                  style={{ borderRadius: 6, width: 48, height: 48, objectFit: 'cover' }} />
                <Button variant="secondary" size="sm" aria-label={`Move photo ${index + 1} up`} disabled={index === 0} onClick={() => movePhoto(index, -1)}>↑</Button>
                <Button variant="secondary" size="sm" aria-label={`Move photo ${index + 1} down`} disabled={index === gallery.length - 1} onClick={() => movePhoto(index, 1)}>↓</Button>
                <Button variant="secondary" size="sm" aria-label={`Remove photo ${index + 1}`} onClick={() => handlePhotoRemove(photo)}>Remove</Button>
              </div>
            ))}
          </div>
        </>
      ) };
    }

    if (block === 'seating' && title === 'Seating') {
      return {
        before: master ? (
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            Preview with sample tables
            <ToggleSwitch label="Preview with sample tables" value={sampleSeating} onChange={setSampleSeating} />
          </label>
        ) : (
          <p style={{ fontSize: 12, margin: 0 }}>
            {eventSeating.enabled ? `${eventSeating.tables.length} tables available.` : 'Seating is disabled for this invitation.'}
            {' '}<a href="/organizer-admin" target="_blank" rel="noreferrer">Manage tables</a>
          </p>
        ),
      };
    }

    if (block === 'itinerary' && title === 'Schedule / Itinerary') {
      return { after: <ItineraryEditor localOnly={master} weddingId={weddingId!} items={itinerary} onItemsChange={setItinerary} /> };
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
      title === 'Portrait & Gallery Slots' ? showPortraitSlots
        : title === 'Menu Items' ? schema.has('nav.items')
          : templates.length > 0,
    );

    const ordered = GROUP_ORDER[block] ?? [];
    const titles = [
      ...ordered.filter((t) => groups.has(t) || synthetic.includes(t)),
      ...[...groups.keys()].filter((t) => !ordered.includes(t)),
    ];

    return titles.filter((title) => title !== 'Navigation Icons' || showNavIcons).map((title) => {
      const groupFields = (groups.get(title) ?? []).filter((field) => field.fieldType !== 'hidden');
      const extras = groupExtras(block, title);
      if (!groupFields.length && !extras.before && !extras.after) return null;
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
        weddingId={master ? undefined : weddingId}
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
        <button onClick={() => { if (!isDirty || window.confirm('Leave without saving your changes?')) router.push(master ? '/super-admin/themes' : '/organizer-admin'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-ui)', padding: '6px 10px', borderRadius: 6, transition: 'background 150ms' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-strong)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}>
          <Icon name="arrow-left" size={14} /> Back
        </button>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, margin: 0, color: 'var(--text-strong)', letterSpacing: 'var(--tracking-tight)', whiteSpace: 'nowrap' }}>
          {master ? `${wedding.templateName} · Master` : 'Customize Template'}
        </h1>


        <div style={{ flex: 1 }} />

        {/* Undo/Redo — steps through the `history` snapshot stack above. */}
        <button title="Undo (⌘Z)" disabled={!canUndo} onClick={handleUndo}
          style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', border: 'none', borderRadius: 6, cursor: canUndo ? 'pointer' : 'default', background: 'transparent', color: canUndo ? 'var(--text-muted)' : 'var(--text-faint)', opacity: canUndo ? 1 : 0.5, transition: 'background 150ms' }}
          onMouseEnter={e => { if (canUndo) (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
          <Icon name="undo" size={14} />
        </button>
        <button title="Redo (⌘⇧Z)" disabled={!canRedo} onClick={handleRedo}
          style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', border: 'none', borderRadius: 6, cursor: canRedo ? 'pointer' : 'default', background: 'transparent', color: canRedo ? 'var(--text-muted)' : 'var(--text-faint)', opacity: canRedo ? 1 : 0.5, transition: 'background 150ms' }}
          onMouseEnter={e => { if (canRedo) (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
          <Icon name="redo" size={14} />
        </button>

        {canAdjust && (
          <Button variant={adjusting ? 'secondary' : 'primary'} tone="brand" size="sm"
            onClick={toggleAdjust} style={{ borderRadius: 999 }}>
            <Icon name="sliders" size={14} /> {adjusting ? 'Close Adjust' : 'Adjust'}
          </Button>
        )}

        <div style={{ width: 1, height: 22, background: 'var(--border-subtle)', margin: '0 4px' }} />

        {!master && wedding && (
          <a href={`/${urlSegmentForEventType(wedding.eventType)}/${wedding.coupleName}`} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-ui)', padding: '9px 16px', borderRadius: 999, textDecoration: 'none', transition: 'background 150ms' }}
            className="hide-narrow"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-strong)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}>
            <Icon name="eye" size={14} /> Preview
          </a>
        )}

        {!master && <Button variant="secondary" tone="neutral" size="sm"
          onClick={() => { if (wedding?.coupleName) navigator.clipboard?.writeText(`${window.location.origin}/${urlSegmentForEventType(wedding.eventType)}/${wedding.coupleName}`); }}
          style={{ borderRadius: 999 }}>
          <Icon name="share" size={14} /> Share
        </Button>}

        <Button variant="primary" tone="brand" size="sm" onClick={handleSave} disabled={saving || !isDirty} loading={saving} style={{ borderRadius: 999 }}>
          <Icon name="save" size={14} /> {saving ? 'Saving…' : master ? 'Save draft' : 'Save changes'}
        </Button>
      </div>

      {master && <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-card)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>Template Studio · {studio?.version ? `Draft v${studio.version}` : 'Starting from published design'} · Sample content only</span>
        <label style={{ fontSize: 12 }}>Preview event <select aria-label="Sample event type" value={wedding.eventType} onChange={e => setWedding(w => w ? { ...w, eventType: e.target.value } : w)}>{(templates[0]?.eventTypes ?? 'WEDDING').split(',').map(type => <option key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</option>)}</select></label>
        <select aria-label="Design revision" value={restoreRevision} onChange={e => setRestoreRevision(e.target.value)}>
          <option value="0">Current published design</option>
          {studio?.revisions.map(r => <option key={r.revision} value={r.revision}>Revision {r.revision} · {new Date(r.publishedDate).toLocaleDateString()}</option>)}
        </select>
        <Button variant="secondary" tone="neutral" size="sm" disabled={studioBusy || saving} onClick={restoreMaster}>Load into draft</Button>
        <Button variant="secondary" tone="neutral" size="sm" disabled={studioBusy || saving} onClick={exportMaster}>Export published</Button>
        <LiveThumbnailCapture templateId={masterTemplateId!} getPreviewElement={getPreviewElement}
          disabled={studioBusy || saving} onBusyChange={setCaptureOpen}
          onApplied={() => { setStudioError(''); setStudioNotice('Thumbnail updated. The picker now uses your captured image.'); }} />
        <Button variant="primary" tone="brand" size="sm" disabled={!studio?.version || isDirty || studioBusy || saving || captureOpen} onClick={publishMaster}>Publish master</Button>
        {(studioError || studioNotice) && <div role={studioError ? 'alert' : 'status'} style={{ width: '100%', color: studioError ? 'var(--danger)' : 'var(--text-muted)', fontSize: 13 }}>{studioError || studioNotice}</div>}
      </div>}

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
              sectionOrder={arrangement.displayed}
              onSelectBlock={selectBlock}
              hasMusic={schema.has('music.url')}
              hasNav={schema.has('nav.layout')}
              hasGallery={hasGallery}
              hasSeating={schema.has('seating.mode')}
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 4 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, lineHeight: 1.1, letterSpacing: '0.01em', color: 'var(--text-strong)' }}>
                    {blockInfo.title}
                  </div>
                  <div style={{ display: 'flex', gap: 2, position: 'relative', flexShrink: 0 }}>
                    {activeSectionIndex >= 0 && <>
                      <Button variant="ghost" tone="neutral" size="sm" style={{ width: 28, padding: 0 }}
                        aria-label="Move section up" title="Move section up" disabled={activeSectionIndex === 0}
                        onClick={() => handleMoveBlock(activeBlock, 'up')}><Icon name="chevron-up" size={16} /></Button>
                      <Button variant="ghost" tone="neutral" size="sm" style={{ width: 28, padding: 0 }}
                        aria-label="Move section down" title="Move section down" disabled={activeSectionIndex === arrangement.movable.length - 1}
                        onClick={() => handleMoveBlock(activeBlock, 'down')}><Icon name="chevron-down" size={16} /></Button>
                      <Button variant="ghost" tone="danger" size="sm" style={{ width: 28, padding: 0 }}
                        aria-label="Remove section" title="Remove section"
                        onClick={() => handleRemoveBlock(activeBlock)}><Icon name="x" size={16} /></Button>
                    </>}
                    {availableBlocks.length > 0 && <>
                      <Button variant="ghost" tone="neutral" size="sm" style={{ width: 28, padding: 0 }}
                        aria-label="Add section" title="Add or restore a section" aria-expanded={addMenuOpen}
                        onClick={() => setAddMenuOpen((open) => !open)}><Icon name="plus" size={16} /></Button>
                      {addMenuOpen && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, minWidth: 152, background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', padding: 6, zIndex: 30, display: 'grid' }}>
                          {availableBlocks.map((block) => (
                            <Button key={block.code} variant="ghost" tone="neutral" size="sm"
                              style={{ justifyContent: 'flex-start' }} onClick={() => handleAddBlock(block.code)}>
                              <Icon name={block.icon} size={14} /> Restore {block.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </>}
                  </div>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12.5, marginTop: 4, fontFamily: 'var(--font-ui)' }}>
                  {blockInfo.subtitle}
                  {canArrangeSections && arrangement.note && <p style={{ marginTop: 8 }}>{arrangement.note}</p>}
                  {activeBlock === 'details' && availableBlocks.length > 0 && ' Use + to restore a section.'}
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

              </div>
            </div>
          )}

          {/* Sticky save bar */}
          {editorMode === 'expanded' && (
            <SaveBar dirty={isDirty} saving={saving} onSave={handleSave} master={master} />
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
          sectionOrder={arrangement.displayed}
          editorMode={editorMode}
          onShowEditor={() => setEditorMode('expanded')}
          wedding={wedding}
          frame={frame}
          setFrame={setFrame}
          cinematicReference={canAdjust && adjusting && layout?.family === 'cinematic' && activeCinematicBeat ? {
            beat: activeCinematicBeat,
            visible: cinematicReferenceVisible,
            opacity: cinematicReferenceOpacity,
            onVisibleChange: setCinematicReferenceVisible,
            onChange: patchCinematicReference,
            onUploadImage: handleAdjustUpload,
          } : undefined}
          cinematicTimeline={canAdjust && adjusting && layout?.family === 'cinematic' ? {
            progress: cinematicProgress,
            beats: cinematicBeats,
            tracks: cinematicDisplayTracks,
            selectedAsset: selectedCinematicTimelineItem,
            selectedBeat: activeCinematicBeat?.id,
            editableBeats: cinematicMode === 'camera-beat',
            dirty: isDirty,
            onChange: handleCinematicProgressChange,
            onBeatMove: (id, progress) => {
              patchCinematicBeat(id, { at: progress });
              setSelectedCinematicBeat(id);
              setCinematicProgress(progress);
            },
            onTrackClipChange: (id, clip: CinematicSequenceClip) =>
              patchCinematicTrack(id, { clip }),
            onTrackSelect: (id) => {
              setCinematicTimingSelectionRequest((request) => request + 1);
              setSelectedCinematicTimingTrack(id);
              setEffectPoseRequest(undefined);
              setSelectedLayer(cinematicAnimationTracks.find((track) => track.id === id)?.assetAnimation?.layerId ??
                (layout?.family === 'cinematic' ? layout.direction.effects.find((effect) => effect.trackId === id && effect.target === 'layer')?.targetId : undefined));
              setCinematicMode('scene');
            },
            onClearSelection: () => {
              setSelectedLayer(undefined);
              setSelectedCinematicTimingTrack(undefined);
            },
            onResetTrack: resetCinematicTrack,
          } : undefined}
        />

        {/* Right: the existing Stage dock or the separate continuous-world Cinematic director. */}
        {canAdjust && adjusting && ((layout?.family === 'stage' && activeStage) || layout?.family === 'cinematic' || navigationSelected) && (
          <aside style={{
            width: 340, flexShrink: 0,
            borderLeft: '1px solid var(--border-subtle)',
            background: 'var(--surface-card)',
            display: 'flex', flexDirection: 'column', minHeight: 0,
            // The dock's pop-up detail/theme/add card floats off its LEFT edge over the preview.
            position: 'relative', overflow: 'visible',
          }}>
            {hasNavigationAdjust && (
              <div role="group" aria-label="Adjust layers" style={{ display: 'flex', gap: 6, padding: 8, borderBottom: '1px solid var(--border-subtle)' }}>
                <Button size="sm" tone="neutral" variant={!navigationSelected ? 'soft' : 'ghost'}
                  aria-pressed={!navigationSelected} onClick={() => setAdjustNavigation(false)}>Scene layers</Button>
                <Button size="sm" tone="neutral" variant={navigationSelected ? 'soft' : 'ghost'}
                  aria-pressed={navigationSelected} onClick={() => setAdjustNavigation(true)}>
                  <Icon name="menu" size={14} /> Navigation
                </Button>
              </div>
            )}
            {navigationSelected ? (
              <div style={{ padding: 16, overflowY: 'auto' }}>
                <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Navigation layer</h2>
                {['nav.style', 'nav.position', 'nav.content'].map((key) => {
                  const field = schema.get(key);
                  return field && renderField(field);
                })}
                <div style={{ display: 'grid', gap: 10, marginBlock: 14 }}>
                  {NAV_ADJUST_FIELDS.filter((field) => field.key !== 'nav.activeBubblePercent' || nav.style === 'bubbles').map((field) => (
                    <div key={field.key}>
                      {field.key === 'nav.borderRadius' && <h3 style={{ margin: '8px 0 10px', fontSize: 14 }}>Border</h3>}
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span>{field.label}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input type="number" aria-label={field.label} min={field.min} max={field.max} step={1}
                            disabled={field.key === 'nav.scalePercent' && nav.style === 'bar'}
                            placeholder={field.key === 'nav.activeBubblePercent' ? '124' : 'Auto'}
                            value={draftConfig[field.key] ?? ''} style={{ width: 72 }}
                            onChange={(event) => setConfig(field.key, event.target.value)}
                            onBlur={(event) => {
                              const value = navAdjustment(field, event.target.value);
                              const normalized = value === undefined ? '' : String(value);
                              if (normalized !== event.target.value) setConfig(field.key, normalized);
                            }} />
                          {field.unit}
                        </span>
                      </label>
                    </div>
                  ))}
                  <div>
                    <FieldLabel>Border style</FieldLabel>
                    <SelectField ariaLabel="Border style" value={draftConfig['nav.borderStyle'] || ''}
                      options={['', ...NAV_BORDER_STYLES]} labels={{ '': 'Auto' }}
                      onChange={(value) => setConfig('nav.borderStyle', value)} />
                  </div>
                  <div>
                    <FieldLabel>Border color</FieldLabel>
                    <ColorRow label="Border color" value={draftConfig['nav.borderColor'] || ''}
                      onChange={(value) => setConfig('nav.borderColor', value)}
                      onClear={() => setConfig('nav.borderColor', '')} />
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Auto uses the template’s settings. Offsets respect device safe areas. Fine-tuning applies on mobile and desktop.</p>
                <Button variant="secondary" tone="neutral" size="sm"
                  disabled={!NAV_ADJUST_KEYS.some((key) => draftConfig[key])}
                  onClick={() => {
                    setDraftConfig((previous) => ({
                      ...previous, ...Object.fromEntries(NAV_ADJUST_KEYS.filter((key) => previous[key]).map((key) => [key, ''])),
                    }));
                  }}>Reset fine-tuning</Button>
              </div>
            ) : layout?.family === 'stage' && activeStage ? (
              <AdjustPanel
                stages={layout.stages}
                keyPrefix={layout.keyPrefix}
                assetRoot={layout.assetRoot}
                stageIds={stageIds}
                breakpoint={previewBreakpoint}
                config={draftConfig}
                onLayoutChange={handleLayoutChange}
                onGroupLayoutChange={handleGroupLayoutChange}
                groupMotion
                classicGroups={!layout.reveal}
                groupFrame={{ w: frame.w, h: frame.svh }}
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
                onSelectLayer={(id) => {
                  setPreviewSeating(false);
                  setSelectedLayer(id);
                  if (id) setSelectedCinematicTimingTrack(undefined);
                  if (master && id && draftConfig['seating.mode'] !== 'organizer' &&
                    layout.stages[activeStage]?.layers.some((layer) => layer.id === id && layer.slot === 'rsvpSeating')) {
                    setSampleSeating(true);
                  }
                }}
                onClose={toggleAdjust}
                onUploadImage={handleAdjustUpload}
                slotTheme={Boolean(layout.slotTheme)}
                slotThemeAccentDefault={layout.slotThemeAccentDefault ?? '#2b2a28'}
                pageBackground={Boolean(layout.pageBackground)}
                cardControl={Boolean(layout.cardStyle)}
              />
            ) : layout?.family === 'cinematic' && activeCinematicBeat ? (
              <CinematicAdjustPanel
                beats={cinematicBeats}
                deletedBeats={deletedCinematicBeats}
                breakpoint={previewBreakpoint}
                selectedBeat={activeCinematicBeat.id}
                progress={cinematicProgress}
                mode={cinematicMode}
                direction={layout.direction}
                effectPose={cinematicEffectPose}
                onEditEffectPose={editCinematicEffectPose}
                onDirectionChange={(direction) => setDraftConfig((previous) => saveCinematicDirection(layout.keyPrefix, previous, direction))}
                onAddEffectTrack={(id, label) => {
                  const layer = cinematicWorldLayers.find((item) => item.id === selectedLayer);
                  const timing = layer && resolveCinematicLayerTiming(layer.id, layer.group, cinematicTimelineTracks, layer.timingTrackId, cinematicWorldLayers);
                  const source = timing?.source;
                  const clip = source ? resolveCinematicTrackClip(source, new Map(cinematicTimelineTracks.map((item) => [item.id, item])))
                    : { start: 0, enterEnd: .1, exitStart: 1, end: 1 };
                  handleCinematicTracksChange([...cinematicTimelineTracks, {
                  id, label, kind: 'effect', target: { type: 'effect', id },
                  ownership: { kind: 'shared' },
                  timing: { mode: 'independent' }, clip: { ...clip, enterEnd: clip.enterEnd > clip.start ? clip.enterEnd : clip.exitStart },
                  enter: { kind: 'fade', easing: 'linear' }, exit: { kind: 'cut', easing: 'linear' },
                }]);
                }}
                layers={cinematicWorldLayers}
                sceneSets={layout.sceneSets}
                onSceneSetAction={handleSceneSetAction}
                selectedLayer={selectedLayer}
                camera={cinematicEditorCamera}
                visibilitySets={cinematicVisibilitySets}
                tracks={cinematicTimelineTracks}
                selectedTimingTrack={selectedCinematicTimingTrack}
                selectedAnimationTrack={cinematicAnimationTracks.some((track) => track.id === selectedCinematicTimingTrack) || layout.direction.effects.some((effect) => effect.trackId === selectedCinematicTimingTrack && effect.target === 'layer')}
                timingSelectionRequest={cinematicTimingSelectionRequest}
                onSelectBeat={(id) => {
                  setEffectPoseRequest(undefined);
                  const beat = cinematicBeats.find((candidate) => candidate.id === id);
                  if (!beat) return;
                  setSelectedCinematicBeat(id);
                  setCinematicProgress(beat.progress);
                  if (cinematicMode !== 'scene') {
                    setCinematicMode('camera-beat');
                    setComposedCamera(undefined);
                  }
                }}
                onProgressChange={handleCinematicProgressChange}
                onModeChange={(mode) => {
                  setCinematicMode(mode);
                  if (mode === 'camera-compose') {
                    setComposedCamera(sampleCamera(cinematicProgress, cinematicCameraLayout.timeline));
                  } else {
                    setComposedCamera(undefined);
                  }
                  if (mode === 'camera-beat' && cinematicMode !== 'scene' && activeCinematicBeat) {
                    setCinematicProgress(activeCinematicBeat.progress);
                  }
                }}
                onSelectLayer={setSelectedLayer}
                onLayersChange={handleCinematicWorldChange}
                onResetLayer={(id) => {
                  const initial = resolveCinematicWorld(
                    layout.keyPrefix, layout.world, previewBreakpoint, undefined,
                    { frames: layout.direction.theme.memory.frames, programmeItems: itinerary.length },
                  ).find((layer) => layer.id === id);
                  if (!initial) return;
                  handleCinematicWorldChange(cinematicWorldLayers.map((layer) =>
                    layer.id === id ? initial : layer));
                }}
                onResetWorld={() => {
                  handleCinematicLayoutChange(cinematicWorldKey(layout.keyPrefix, previewBreakpoint), '');
                  setSelectedLayer(undefined);
                }}
                onCameraChange={patchCinematicCamera}
                onTimingTrackChange={patchCinematicTrack}
                onResetTrack={resetCinematicTrack}
                onMakeTimingIndependent={makeCinematicLayerTimingIndependent}
                onRelinkTiming={relinkCinematicLayerTiming}
                onCreateTimingSet={createCinematicAssetTimingSet}
                onRenameTimingSet={(id, label) => patchCinematicTrack(id, { label })}
                onDuplicateTimingSet={duplicateCinematicAssetTimingSet}
                onDeleteTimingSet={deleteCinematicAssetTimingSet}
                onSelectTimingTrack={(id) => {
                  setSelectedCinematicTimingTrack(id);
                  if (id) setSelectedLayer(cinematicAnimationTracks.find((track) => track.id === id)?.assetAnimation?.layerId);
                }}
                onCreateBeat={createCinematicBeat}
                onRenameBeat={(id, label) => patchCinematicBeat(id, { label })}
                onDuplicateBeat={duplicateCinematicBeat}
                onDeleteBeat={deleteCinematicBeat}
                onRestoreBeat={restoreDeletedCinematicBeat}
                onTransitionChange={(id, transitionIn: CinematicCameraTransition) =>
                  patchCinematicBeat(id, { transitionIn })}
                onResetBeat={resetCinematicBeat}
                shippedBeatIds={layout.sequenceDefinition.beats.map((beat) => beat.id)}
                onResetCamera={() => {
                  if (!activeCinematicCamera) return;
                  const initial = baseBeatCameras(layout.camera, layout.beats, previewBreakpoint).find(
                    (camera) => camera.id === activeCinematicCamera.id,
                  );
                  if (!initial) return;
                  handleCinematicCameraChange(cinematicCameraLayout.beatCameras.map((camera) =>
                    camera.id === initial.id ? initial : camera));
                }}
                onCopyCameraToOther={() => {
                  const other: Breakpoint = previewBreakpoint === 'mobile' ? 'desktop' : 'mobile';
                  handleCinematicLayoutChange(
                    cinematicCameraKey(layout.keyPrefix, other),
                    serializeCinematicCamera(layout.camera, layout.beats, cinematicCameraLayout.beatCameras, other),
                  );
                }}
                onVisibilityChange={handleCinematicVisibilityChange}
                onResetVisibility={() => {
                  handleCinematicLayoutChange(cinematicVisibilityKey(layout.keyPrefix, previewBreakpoint), '');
                  handleCinematicTracksChange(layout.sequenceDefinition.tracks);
                }}
                onResetSequence={resetCinematicSequence}
                onUploadImage={handleAdjustUpload}
                shippedLayerIds={layout.world.map((layer) => layer.id)}
                onClose={toggleAdjust}
              />
            ) : null}
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
