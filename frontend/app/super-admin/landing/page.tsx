'use client';

import { useEffect, useMemo, useState } from 'react';
import { landingService } from '@/lib/api';
import type { LandingDto, LandingItemDto, LandingSectionDto } from '@/lib/api/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { LANDING_CONTENT_DEFAULTS, DEFAULT_FEATURE_ITEMS, DEFAULT_STORY_ITEMS, DEFAULT_PRICING_ITEMS, LandingDefaultItem } from '@/lib/landing/defaults';

const DEFAULT_ITEMS_BY_SECTION: Record<string, LandingDefaultItem[]> = {
  features: DEFAULT_FEATURE_ITEMS,
  pricing: DEFAULT_PRICING_ITEMS,
  stories: DEFAULT_STORY_ITEMS,
};

// Unsaved rows seeded from the live defaults get negative placeholder ids so the
// UI can tell them apart from real rows (id === 0 elsewhere in this app usually
// means "not yet created," but that clashes with LandingItemDto's shape here).
let nextDraftId = -1;

type ContentField = [string, string, boolean?]; // content key, label, isTextarea

// One entry per landing section, config-driven so the page renders a single card
// per section instead of scattering its text / visibility / item-list controls
// across separate cards. `items` is only set for sections that have a repeatable
// list (Feature cards, Pricing tiers, Testimonials) — About has none.
const MIDDLE_SECTIONS: {
  key: string;
  label: string;
  fields: ContentField[];
  items?: {
    label: string;
    metaLabel?: string;
    hasImage?: boolean;
    hasPrice?: boolean;
    hasFeatures?: boolean;
    hasCta?: boolean;
    hasHighlight?: boolean;
  };
}[] = [
  {
    key: 'features',
    label: 'Features',
    fields: [['features.title', 'Heading'], ['features.subtitle', 'Subtitle']],
    items: { label: 'Feature cards', metaLabel: 'Colour (hex)' },
  },
  {
    key: 'pricing',
    label: 'Pricing',
    fields: [['pricing.title', 'Heading'], ['pricing.subtitle', 'Subtitle']],
    items: { label: 'Pricing tiers', hasPrice: true, hasFeatures: true, hasCta: true, hasHighlight: true },
  },
  {
    key: 'stories',
    label: 'Stories',
    fields: [['stories.title', 'Heading'], ['stories.subtitle', 'Subtitle']],
    items: { label: 'Testimonials', metaLabel: 'Attribution' },
  },
  {
    key: 'about',
    label: 'About',
    fields: [['about.title', 'Heading'], ['about.heading', 'Lead paragraph', true], ['about.body', 'Body', true], ['about.stat1.value', 'Stat 1 value'], ['about.stat1.label', 'Stat 1 label'], ['about.stat2.value', 'Stat 2 value'], ['about.stat2.label', 'Stat 2 label']],
  },
];

// Hero and Footer are always shown on the public page (no visibility/order
// control), so they stay as plain single-field cards outside MIDDLE_SECTIONS.
const HERO_FIELDS: ContentField[] = [['hero.tagline', 'Tagline']];
const FOOTER_FIELDS: ContentField[] = [['footer.tagline', 'Tagline']];

export default function LandingAdminPage() {
  const [content, setContent] = useState<Record<string, string>>({});
  const [sections, setSections] = useState<LandingSectionDto[]>([]);
  const [items, setItems] = useState<LandingItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200); };

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const data: LandingDto = await landingService.get();
      // A stored override wins; otherwise prefill with the copy that's actually
      // live on the public page today (instead of leaving the field empty).
      setContent({ ...LANDING_CONTENT_DEFAULTS, ...(data.content ?? {}) });
      // Seed each item list from the live defaults if the CMS has no rows for it yet.
      const items = data.items ?? [];
      const seededItems = [...items];
      for (const key of Object.keys(DEFAULT_ITEMS_BY_SECTION)) {
        if (items.some((it) => it.sectionKey === key)) continue;
        DEFAULT_ITEMS_BY_SECTION[key].forEach((d, i) => {
          seededItems.push({
            id: nextDraftId--, sectionKey: key, sortOrder: i, isActive: true,
            title: d.title ?? '', body: d.body, imageUrl: '', meta: d.meta,
            price: d.price ?? '', features: d.features ?? '', cta: d.cta ?? '', ctaHref: d.ctaHref ?? '', highlighted: d.highlighted ?? false,
          });
        });
      }
      setItems(seededItems);
      // seed the 4 middle sections if the CMS has none yet
      const existing = data.sections ?? [];
      const seeded = MIDDLE_SECTIONS.map((m, i) => existing.find((s) => s.sectionKey === m.key) ?? { id: 0, sectionKey: m.key, title: m.label, sortOrder: i, isVisible: true });
      setSections(seeded.sort((a, b) => a.sortOrder - b.sortOrder));
    } finally {
      setLoading(false);
    }
  };

  // ── Content ──
  const setKey = (k: string, v: string) => setContent((c) => ({ ...c, [k]: v }));
  const resetGroup = (keys: string[]) => setContent((c) => {
    const next = { ...c };
    for (const k of keys) next[k] = LANDING_CONTENT_DEFAULTS[k] ?? '';
    return next;
  });

  // ── Sections (order + visibility) — these live in each section card's own
  // header now, and apply immediately (like a light switch) instead of behind
  // a separate "Save order" step elsewhere on the page. ──
  const persistSection = (s: LandingSectionDto) =>
    landingService.upsertSection({ sectionKey: s.sectionKey, title: s.title, sortOrder: s.sortOrder, isVisible: s.isVisible });

  const move = (key: string, dir: -1 | 1) => {
    setSections((s) => {
      const i = s.findIndex((x) => x.sectionKey === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= s.length) return s;
      const next = [...s];
      [next[i], next[j]] = [next[j], next[i]];
      const reordered = next.map((sec, idx) => ({ ...sec, sortOrder: idx }));
      reordered.forEach(persistSection); // order is relative across the group, so every row needs to stay in sync
      return reordered;
    });
  };
  const toggleVisible = (key: string) => {
    setSections((s) => {
      const next = s.map((sec) => (sec.sectionKey === key ? { ...sec, isVisible: !sec.isVisible } : sec));
      const row = next.find((sec) => sec.sectionKey === key);
      if (row) persistSection(row);
      return next;
    });
  };

  // ── Items ──
  const itemsBy = useMemo(() => {
    const map: Record<string, LandingItemDto[]> = {};
    for (const it of items) (map[it.sectionKey] ??= []).push(it);
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.sortOrder - b.sortOrder);
    return map;
  }, [items]);

  const patchItem = (id: number, patch: Partial<LandingItemDto>) => setItems((arr) => arr.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const addItem = async (sectionKey: string) => {
    const created = await landingService.createItem({ sectionKey, sortOrder: (itemsBy[sectionKey]?.length ?? 0), isActive: true, title: '', body: '', imageUrl: '', meta: '', price: '', features: '', cta: '', ctaHref: '', highlighted: false });
    setItems((arr) => [...arr, created]);
  };
  const removeItem = async (id: number) => {
    if (id < 0) { setItems((arr) => arr.filter((it) => it.id !== id)); return; } // unsaved draft row
    await landingService.deleteItem(id);
    setItems((arr) => arr.filter((it) => it.id !== id));
  };
  const uploadImage = async (it: LandingItemDto, file: File) => { const url = await landingService.uploadImage(file); patchItem(it.id, { imageUrl: url }); };

  // ── One save button for the whole page ── persists every card's text fields
  // (a single whole-bag PUT) plus every item row's edits (rows seeded from the
  // live defaults carry a negative id and are created for real on first save).
  // Add/Delete on an item row and the section visibility/order controls already
  // apply immediately, so this only ever has field edits left to flush.
  const saveAll = async () => {
    setSaving(true);
    try {
      await landingService.saveContent(content);
      for (const it of items) {
        const payload = {
          sectionKey: it.sectionKey, sortOrder: it.sortOrder, isActive: it.isActive, title: it.title, body: it.body, imageUrl: it.imageUrl, meta: it.meta,
          price: it.price, features: it.features, cta: it.cta, ctaHref: it.ctaHref, highlighted: it.highlighted,
        };
        if (it.id < 0) {
          const created = await landingService.createItem(payload);
          setItems((arr) => arr.map((row) => (row.id === it.id ? created : row)));
        } else {
          await landingService.updateItem(it.id, payload);
        }
      }
      flash('Saved');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 32, color: 'var(--muted)' }}>Loading…</div>;

  const sectionHeading: React.CSSProperties = { fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-strong)', margin: 0 };
  const subHeading: React.CSSProperties = { fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-strong)', margin: 0 };

  const contentFields = (fields: ContentField[]) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
      {fields.map(([key, label, area]) => area
        ? <Textarea key={key} label={label} value={content[key] ?? ''} onChange={(e) => setKey(key, e.target.value)} rows={2} />
        : <Input key={key} label={label} value={content[key] ?? ''} onChange={(e) => setKey(key, e.target.value)} />)}
    </div>
  );

  const itemRows = (g: NonNullable<(typeof MIDDLE_SECTIONS)[number]['items']>, sectionKey: string) => (
    <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border-subtle)' }}>
      <h3 style={{ ...subHeading, marginBottom: 12 }}>{g.label}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {(itemsBy[sectionKey] ?? []).map((it) => (
          <div key={it.id} style={{ padding: 14, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              <Input label={g.hasPrice ? 'Tier name' : 'Title'} value={it.title} onChange={(e) => patchItem(it.id, { title: e.target.value })} />
              {g.hasPrice && <Input label="Price" placeholder="e.g. Contact us, $99/mo" value={it.price} onChange={(e) => patchItem(it.id, { price: e.target.value })} />}
              {g.metaLabel && <Input label={g.metaLabel} value={it.meta} onChange={(e) => patchItem(it.id, { meta: e.target.value })} />}
            </div>
            <Textarea label={g.hasPrice ? 'Description' : 'Body'} value={it.body} onChange={(e) => patchItem(it.id, { body: e.target.value })} rows={2} />
            {g.hasFeatures && (
              <Textarea label="Features (one per line)" value={it.features} onChange={(e) => patchItem(it.id, { features: e.target.value })} rows={4} />
            )}
            {g.hasCta && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                <Input label="Button label" placeholder="e.g. Get started free" value={it.cta} onChange={(e) => patchItem(it.id, { cta: e.target.value })} />
                <Input label="Button link" placeholder="e.g. /personalise/picker" value={it.ctaHref} onChange={(e) => patchItem(it.id, { ctaHref: e.target.value })} />
              </div>
            )}
            {g.hasImage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Input label="Image URL" value={it.imageUrl} onChange={(e) => patchItem(it.id, { imageUrl: e.target.value })} />
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(it, f); }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Switch checked={it.isActive} onChange={() => patchItem(it.id, { isActive: !it.isActive })} label={it.isActive ? 'Active' : 'Hidden'} />
              {g.hasHighlight && <Switch checked={it.highlighted} onChange={() => patchItem(it.id, { highlighted: !it.highlighted })} label={it.highlighted ? 'Popular' : 'Not popular'} />}
              <div style={{ flex: 1 }} />
              <Button variant="ghost" onClick={() => removeItem(it.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        <Button variant="soft" onClick={() => addItem(sectionKey)}>+ Add {g.label.toLowerCase().replace(/s$/, '')}</Button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px clamp(16px, 4vw, 40px)', maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--text-strong)', margin: 0 }}>Landing page</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '6px 0 0' }}>Each card below is one section of the public page — its text, its visibility &amp; order, and its list of cards, all in one place. Visibility, order, adding and deleting apply right away; edit any field, then hit the save button in the corner to store your changes.</p>
      </div>

      {/* Hero — always shown, no visibility/order control, no item list. */}
      <Card style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 14px' }}>
          <h2 style={sectionHeading}>Hero</h2>
          <Button variant="ghost" size="sm" onClick={() => resetGroup(HERO_FIELDS.map(([key]) => key))}>Reset to default</Button>
        </div>
        {contentFields(HERO_FIELDS)}
      </Card>

      {/* Features / Pricing / Stories / About — one self-contained card each:
          visibility + reorder in the header (applies instantly), text content
          with its own Save, and — where the section has one — its item list. */}
      {sections.map((s, i) => {
        const cfg = MIDDLE_SECTIONS.find((m) => m.key === s.sectionKey);
        if (!cfg) return null;
        return (
          <Card key={s.sectionKey} style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 14px' }}>
              <h2 style={sectionHeading}>{cfg.label}</h2>
              <div style={{ flex: 1 }} />
              <Switch checked={s.isVisible} onChange={() => toggleVisible(s.sectionKey)} label={s.isVisible ? 'Visible' : 'Hidden'} />
              <Button variant="ghost" onClick={() => move(s.sectionKey, -1)} disabled={i === 0} title="Move up">↑</Button>
              <Button variant="ghost" onClick={() => move(s.sectionKey, 1)} disabled={i === sections.length - 1} title="Move down">↓</Button>
              <Button variant="ghost" size="sm" onClick={() => resetGroup(cfg.fields.map(([key]) => key))}>Reset to default</Button>
            </div>
            {contentFields(cfg.fields)}
            {cfg.items && itemRows(cfg.items, s.sectionKey)}
          </Card>
        );
      })}

      {/* Footer — always shown, no visibility/order control, no item list. */}
      <Card style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 14px' }}>
          <h2 style={sectionHeading}>Footer</h2>
          <Button variant="ghost" size="sm" onClick={() => resetGroup(FOOTER_FIELDS.map(([key]) => key))}>Reset to default</Button>
        </div>
        {contentFields(FOOTER_FIELDS)}
      </Card>

      {/* Save button + its toast share one fixed-position row so the toast floats
          to the button's left, vertically centred against it, instead of
          appearing separately at bottom-centre of the page. */}
      <div style={{ position: 'fixed', bottom: 28, right: 28, display: 'flex', alignItems: 'center', gap: 12, zIndex: 1000 }}>
        {toast && (
          <div style={{ background: 'var(--text-strong)', color: '#fff', padding: '10px 18px', borderRadius: 999, fontSize: 14, whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(0,0,0,.2)' }}>{toast}</div>
        )}
        <Button
          onClick={saveAll}
          loading={saving}
          aria-label="Save all changes"
          title="Save all changes"
          style={{ width: 56, height: 56, padding: 0, borderRadius: '50%', boxShadow: '0 8px 24px rgba(0,0,0,.28)', flexShrink: 0 }}
        >
          {!saving && <Icon name="save" size={22} />}
        </Button>
      </div>
    </div>
  );
}
