'use client';

import { useEffect, useMemo, useState } from 'react';
import { landingService } from '@/lib/api';
import type { LandingDto, LandingItemDto, LandingSectionDto } from '@/lib/api/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Card } from '@/components/ui/Card';
import { LANDING_CONTENT_DEFAULTS, DEFAULT_FEATURE_ITEMS, DEFAULT_STORY_ITEMS } from '@/lib/landing/defaults';

const DEFAULT_ITEMS_BY_SECTION: Record<string, { title?: string; body: string; meta: string }[]> = {
  features: DEFAULT_FEATURE_ITEMS,
  stories: DEFAULT_STORY_ITEMS,
};

// Unsaved rows seeded from the live defaults get negative placeholder ids so the
// UI can tell them apart from real rows (id === 0 elsewhere in this app usually
// means "not yet created," but that clashes with LandingItemDto's shape here).
let nextDraftId = -1;

// Scalar content fields, grouped for the editor. Keys match app/home/page.tsx.
const CONTENT_GROUPS: { title: string; fields: [string, string, boolean?][] }[] = [
  { title: 'Hero', fields: [['hero.tagline', 'Tagline']] },
  { title: 'Features', fields: [['features.title', 'Heading'], ['features.subtitle', 'Subtitle']] },
  { title: 'Pricing', fields: [['pricing.title', 'Heading'], ['pricing.subtitle', 'Subtitle']] },
  { title: 'Stories', fields: [['stories.title', 'Heading'], ['stories.subtitle', 'Subtitle']] },
  { title: 'About', fields: [['about.title', 'Heading'], ['about.heading', 'Lead paragraph', true], ['about.body', 'Body', true], ['about.stat1.value', 'Stat 1 value'], ['about.stat1.label', 'Stat 1 label'], ['about.stat2.value', 'Stat 2 value'], ['about.stat2.label', 'Stat 2 label']] },
  { title: 'Footer', fields: [['footer.tagline', 'Tagline']] },
];

const MIDDLE_SECTIONS: { key: string; label: string }[] = [
  { key: 'features', label: 'Features' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'stories', label: 'Stories' },
  { key: 'about', label: 'About' },
];

const ITEM_GROUPS: { key: string; label: string; metaLabel: string; hasImage: boolean }[] = [
  { key: 'features', label: 'Feature cards', metaLabel: 'Colour (hex)', hasImage: false },
  { key: 'stories', label: 'Testimonials', metaLabel: 'Attribution', hasImage: false },
];

export default function LandingAdminPage() {
  const [content, setContent] = useState<Record<string, string>>({});
  const [sections, setSections] = useState<LandingSectionDto[]>([]);
  const [items, setItems] = useState<LandingItemDto[]>([]);
  const [loading, setLoading] = useState(true);
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
          seededItems.push({ id: nextDraftId--, sectionKey: key, sortOrder: i, isActive: true, title: d.title ?? '', body: d.body, imageUrl: '', meta: d.meta });
        });
      }
      setItems(seededItems);
      // seed the 4 middle sections if the CMS has none yet
      const existing = data.sections ?? [];
      const seeded = MIDDLE_SECTIONS.map((m, i) => existing.find((s) => s.sectionKey === m.key) ?? { id: 0, sectionKey: m.key, title: m.label, sortOrder: i, isVisible: true });
      setSections(seeded);
    } finally {
      setLoading(false);
    }
  };

  // ── Content ──
  const setKey = (k: string, v: string) => setContent((c) => ({ ...c, [k]: v }));
  const saveContent = async () => { await landingService.saveContent(content); flash('Content saved'); };
  const resetGroup = (keys: string[]) => setContent((c) => {
    const next = { ...c };
    for (const k of keys) next[k] = LANDING_CONTENT_DEFAULTS[k] ?? '';
    return next;
  });

  // ── Sections (order + visibility) ──
  const move = (i: number, dir: -1 | 1) => {
    setSections((s) => {
      const next = [...s];
      const j = i + dir;
      if (j < 0 || j >= next.length) return s;
      [next[i], next[j]] = [next[j], next[i]];
      return next.map((sec, idx) => ({ ...sec, sortOrder: idx }));
    });
  };
  const toggleVisible = (i: number) => setSections((s) => s.map((sec, idx) => (idx === i ? { ...sec, isVisible: !sec.isVisible } : sec)));
  const saveSections = async () => {
    for (const s of sections) {
      await landingService.upsertSection({ sectionKey: s.sectionKey, title: s.title, sortOrder: s.sortOrder, isVisible: s.isVisible });
    }
    flash('Section order saved');
    load();
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
    const created = await landingService.createItem({ sectionKey, sortOrder: (itemsBy[sectionKey]?.length ?? 0), isActive: true, title: '', body: '', imageUrl: '', meta: '' });
    setItems((arr) => [...arr, created]);
  };
  // Rows seeded from the live defaults carry a negative placeholder id (never
  // persisted) — the first save creates them for real instead of PUTing to a
  // row that doesn't exist yet.
  const saveItem = async (it: LandingItemDto) => {
    const payload = { sectionKey: it.sectionKey, sortOrder: it.sortOrder, isActive: it.isActive, title: it.title, body: it.body, imageUrl: it.imageUrl, meta: it.meta };
    if (it.id < 0) {
      const created = await landingService.createItem(payload);
      setItems((arr) => arr.map((row) => (row.id === it.id ? created : row)));
    } else {
      const saved = await landingService.updateItem(it.id, payload);
      patchItem(it.id, saved);
    }
    flash('Item saved');
  };
  const saveAllItems = async (sectionKey: string) => {
    for (const it of itemsBy[sectionKey] ?? []) await saveItem(it);
    flash(`${MIDDLE_SECTIONS.find((m) => m.key === sectionKey)?.label ?? sectionKey} saved`);
  };
  const removeItem = async (id: number) => {
    if (id < 0) { setItems((arr) => arr.filter((it) => it.id !== id)); return; } // unsaved draft row
    await landingService.deleteItem(id);
    setItems((arr) => arr.filter((it) => it.id !== id));
  };
  const uploadImage = async (it: LandingItemDto, file: File) => { const url = await landingService.uploadImage(file); patchItem(it.id, { imageUrl: url }); };

  if (loading) return <div style={{ padding: 32, color: 'var(--muted)' }}>Loading…</div>;

  const sectionHeading: React.CSSProperties = { fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-strong)', margin: '0 0 12px' };

  return (
    <div style={{ padding: '24px clamp(16px, 4vw, 40px)', maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--text-strong)', margin: 0 }}>Landing page</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '6px 0 0' }}>Manage the public landing content, section order, and the Features & Stories lists.</p>
      </div>

      {/* Content */}
      <Card style={{ padding: 20 }}>
        <h2 style={sectionHeading}>Text content</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {CONTENT_GROUPS.map((g) => (
            <div key={g.title}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 10px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-subtle)', margin: 0 }}>{g.title}</p>
                <Button variant="ghost" size="sm" onClick={() => resetGroup(g.fields.map(([key]) => key))}>Reset to default</Button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                {g.fields.map(([key, label, area]) => area
                  ? <Textarea key={key} label={label} value={content[key] ?? ''} onChange={(e) => setKey(key, e.target.value)} rows={2} />
                  : <Input key={key} label={label} value={content[key] ?? ''} onChange={(e) => setKey(key, e.target.value)} />)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18 }}><Button onClick={saveContent}>Save content</Button></div>
      </Card>

      {/* Sections */}
      <Card style={{ padding: 20 }}>
        <h2 style={sectionHeading}>Sections — order & visibility</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sections.map((s, i) => (
            <div key={s.sectionKey} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ flex: 1, fontFamily: 'var(--font-ui)', fontWeight: 600, color: 'var(--text-strong)' }}>{MIDDLE_SECTIONS.find((m) => m.key === s.sectionKey)?.label ?? s.sectionKey}</span>
              <Switch checked={s.isVisible} onChange={() => toggleVisible(i)} label={s.isVisible ? 'Visible' : 'Hidden'} />
              <Button variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}>↑</Button>
              <Button variant="ghost" onClick={() => move(i, 1)} disabled={i === sections.length - 1}>↓</Button>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}><Button onClick={saveSections}>Save order</Button></div>
      </Card>

      {/* Item lists */}
      {ITEM_GROUPS.map((g) => (
        <Card key={g.key} style={{ padding: 20 }}>
          <h2 style={sectionHeading}>{g.label}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(itemsBy[g.key] ?? []).map((it) => (
              <div key={it.id} style={{ padding: 14, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                  <Input label="Title" value={it.title} onChange={(e) => patchItem(it.id, { title: e.target.value })} />
                  <Input label={g.metaLabel} value={it.meta} onChange={(e) => patchItem(it.id, { meta: e.target.value })} />
                </div>
                <Textarea label="Body" value={it.body} onChange={(e) => patchItem(it.id, { body: e.target.value })} rows={2} />
                {g.hasImage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Input label="Image URL" value={it.imageUrl} onChange={(e) => patchItem(it.id, { imageUrl: e.target.value })} />
                    <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(it, f); }} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Switch checked={it.isActive} onChange={() => patchItem(it.id, { isActive: !it.isActive })} label={it.isActive ? 'Active' : 'Hidden'} />
                  <div style={{ flex: 1 }} />
                  <Button variant="secondary" onClick={() => saveItem(it)}>Save</Button>
                  <Button variant="ghost" onClick={() => removeItem(it.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
            <Button variant="soft" onClick={() => addItem(g.key)}>+ Add {g.label.toLowerCase()}</Button>
            <Button variant="secondary" onClick={() => saveAllItems(g.key)}>Save all</Button>
          </div>
        </Card>
      ))}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--text-strong)', color: '#fff', padding: '10px 20px', borderRadius: 999, fontSize: 14, zIndex: 1000 }}>{toast}</div>
      )}
    </div>
  );
}
