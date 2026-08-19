'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { templateService, eventService, TemplateWithUsage, UpdateTemplate, Event } from '@/lib/api';
import { TemplatePreview } from '@/components/templates/TemplatePreview';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { EVENT_TYPES, parseEventTypes } from '@/lib/eventTypes';

type Tier = 'FREE' | 'PREMIUM' | 'PRO';

const TIERS: { value: Tier; label: string }[] = [
  { value: 'FREE', label: 'Free' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'PRO', label: 'Pro' },
];

const tierBadge: Record<Tier, { tone: 'neutral' | 'gold' | 'brand'; label: string }> = {
  FREE: { tone: 'neutral', label: 'Free' },
  PREMIUM: { tone: 'gold', label: 'Premium' },
  PRO: { tone: 'brand', label: 'Pro' },
};

interface EditForm {
  templateName: string;
  description: string;
  tier: Tier;
  eventTypes: string[];
}

export default function ThemesPage() {
  const [themes, setThemes] = useState<TemplateWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EditForm>({ templateName: '', description: '', tier: 'FREE', eventTypes: ['WEDDING'] });
  const [saving, setSaving] = useState(false);

  // Per-template "starting design" state.
  const [weddings, setWeddings] = useState<Event[]>([]);
  const [defaultCounts, setDefaultCounts] = useState<Record<number, number>>({});
  const [pickWeddingId, setPickWeddingId] = useState<Record<number, number>>({});
  const [designBusyId, setDesignBusyId] = useState<number | null>(null);

  // Manual thumbnail upload.
  const [thumbBusyId, setThumbBusyId] = useState<number | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [themeData, weddingData] = await Promise.all([
        templateService.getUsage(),
        eventService.getAll(),
      ]);
      setThemes(themeData);
      setWeddings(weddingData);
      // Load each template's starting-design status (small N — one call per template).
      const statuses = await Promise.all(
        themeData.map(t => templateService.getDefaultConfig(t.templateId).catch(() => ({ templateId: t.templateId, keyCount: 0 }))),
      );
      setDefaultCounts(Object.fromEntries(statuses.map(s => [s.templateId, s.keyCount])));
    } catch {
      setError('Failed to load themes');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (theme: TemplateWithUsage) => {
    const weddingId = pickWeddingId[theme.templateId];
    if (!weddingId) return;
    if (defaultCounts[theme.templateId] > 0 &&
        !window.confirm(`Replace the current starting design for "${theme.templateName}"?`)) return;
    setDesignBusyId(theme.templateId);
    setError(null);
    try {
      const status = await templateService.setDefaultFromWedding(theme.templateId, weddingId);
      setDefaultCounts(prev => ({ ...prev, [theme.templateId]: status.keyCount }));
    } catch {
      setError('Failed to save starting design');
    } finally {
      setDesignBusyId(null);
    }
  };

  const handleClearDefault = async (theme: TemplateWithUsage) => {
    if (!window.confirm(`Clear the starting design for "${theme.templateName}"? New invites will use the built-in layout.`)) return;
    setDesignBusyId(theme.templateId);
    setError(null);
    try {
      await templateService.clearDefaultConfig(theme.templateId);
      setDefaultCounts(prev => ({ ...prev, [theme.templateId]: 0 }));
    } catch {
      setError('Failed to clear starting design');
    } finally {
      setDesignBusyId(null);
    }
  };

  const handleUploadThumbnail = async (theme: TemplateWithUsage, file: File) => {
    setThumbBusyId(theme.templateId);
    setError(null);
    try {
      const updated = await templateService.uploadThumbnail(theme.templateId, file, file.name);
      setThemes(prev => prev.map(t => t.templateId === theme.templateId ? { ...t, ...updated } : t));
    } catch {
      setError('Failed to upload thumbnail');
    } finally {
      setThumbBusyId(null);
    }
  };

  const persist = (theme: TemplateWithUsage, changes: Partial<UpdateTemplate>) => {
    const payload: UpdateTemplate = {
      templateName: theme.templateName,
      description: theme.description,
      tier: theme.tier,
      isActive: theme.isActive,
      sortOrder: theme.sortOrder,
      eventTypes: theme.eventTypes,
      ...changes,
    };
    return templateService.update(theme.templateId, payload);
  };

  const handleToggleActive = async (theme: TemplateWithUsage) => {
    const next = !theme.isActive;
    setBusyId(theme.templateId);
    setThemes(prev => prev.map(t => t.templateId === theme.templateId ? { ...t, isActive: next } : t));
    try {
      await persist(theme, { isActive: next });
    } catch {
      setThemes(prev => prev.map(t => t.templateId === theme.templateId ? { ...t, isActive: theme.isActive } : t));
      setError('Failed to update theme');
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (theme: TemplateWithUsage) => {
    setForm({ templateName: theme.templateName, description: theme.description, tier: theme.tier, eventTypes: parseEventTypes(theme.eventTypes) });
    setEditingId(theme.templateId);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent, theme: TemplateWithUsage) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await persist(theme, { ...form, eventTypes: form.eventTypes.join(',') });
      setThemes(prev => prev.map(t => t.templateId === theme.templateId ? { ...t, ...updated } : t));
      setEditingId(null);
    } catch {
      setError('Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  const activeCount = themes.filter(t => t.isActive).length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '2.5px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ color: 'var(--text-subtle)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)' }}>Loading themes…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 400, letterSpacing: 'var(--tracking-tight)', lineHeight: 1, color: 'var(--text-strong)' }}>
            Manage <em style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>themes</em>
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-subtle)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)' }}>
            {activeCount} active · ranked by how many weddings use each theme.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'color-mix(in srgb, var(--danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="alert-circle" size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', margin: 0, fontFamily: 'var(--font-ui)' }}>{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {themes.map((theme, index) => {
          const isEditing = editingId === theme.templateId;
          const tb = tierBadge[theme.tier] ?? tierBadge.FREE;
          return (
            <motion.div
              key={theme.templateId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Card padding="0" style={{ opacity: theme.isActive ? 1 : 0.55, overflow: 'hidden' }}>
                {/* Thumbnail */}
                <div style={{ position: 'relative', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <TemplatePreview templateCode={theme.templateCode} thumbnailUrl={theme.thumbnailUrl} />
                  </div>
                  {/* Color swatches */}
                  <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: 6 }}>
                    {[theme.primaryColor, theme.secondaryColor].filter(Boolean).map((c, i) => (
                      <span key={i} title={c} style={{ width: 18, height: 18, borderRadius: 'var(--radius-full)', background: c, border: '2px solid #fff', boxShadow: 'var(--shadow-xs)' }} />
                    ))}
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-strong)' }}>
                      {theme.templateName}
                    </h3>
                    <Badge tone={tb.tone}>{tb.label}</Badge>
                    {!theme.isActive && <Badge tone="neutral">Inactive</Badge>}
                    {parseEventTypes(theme.eventTypes).map(ev => (
                      <Badge key={ev} tone="neutral">{EVENT_TYPES.find(e => e.key === ev)?.label ?? ev}</Badge>
                    ))}
                  </div>

                  {theme.description && (
                    <p style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)', color: 'var(--text-body)', margin: '0 0 10px', lineHeight: 1.5 }}>
                      {theme.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                    <Icon name="users" size={13} style={{ color: 'var(--text-subtle)' }} />
                    <span style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)', color: 'var(--text-muted)' }}>
                      Used by <strong style={{ color: 'var(--text-strong)' }}>{theme.weddingCount}</strong> {theme.weddingCount === 1 ? 'wedding' : 'weddings'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Switch
                        checked={theme.isActive}
                        disabled={busyId === theme.templateId}
                        onChange={() => handleToggleActive(theme)}
                      />
                      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-body)' }}>
                        Active
                      </span>
                    </div>
                    <Button variant="soft" tone="brand" size="sm" onClick={() => (isEditing ? setEditingId(null) : openEdit(theme))}>
                      {isEditing ? 'Close' : 'Edit'}
                    </Button>
                  </div>

                  {/* Starting design — the config a NEW invite of this theme is seeded with. */}
                  {(() => {
                    const count = defaultCounts[theme.templateId] ?? 0;
                    const themeWeddings = weddings.filter(w => w.templateId === theme.templateId);
                    const busy = designBusyId === theme.templateId;
                    return (
                      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <Icon name="layout-grid" size={13} style={{ color: 'var(--text-subtle)' }} />
                          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-strong)' }}>
                            Starting design
                          </span>
                          {count > 0
                            ? <Badge tone="brand">Set · {count} keys</Badge>
                            : <Badge tone="neutral">Built-in</Badge>}
                        </div>
                        <p style={{ margin: '0 0 8px', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-ui)', color: 'var(--text-subtle)', lineHeight: 1.5 }}>
                          Capture a finished invite&rsquo;s design (layout, colours, scene) so new invites of this theme
                          start there instead of the raw default. Couple content (wording, music) is excluded.
                        </p>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <select
                            value={pickWeddingId[theme.templateId] ?? ''}
                            onChange={e => setPickWeddingId(prev => ({ ...prev, [theme.templateId]: Number(e.target.value) }))}
                            disabled={busy || themeWeddings.length === 0}
                            style={{
                              flex: 1, minWidth: 140, padding: '7px 10px', fontFamily: 'var(--font-ui)',
                              fontSize: 'var(--text-sm)', color: 'var(--text-body)', background: 'var(--surface)',
                              border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                            }}
                          >
                            <option value="">
                              {themeWeddings.length === 0 ? 'No invites on this theme' : 'Choose an invite…'}
                            </option>
                            {themeWeddings.map(w => (
                              <option key={w.eventId} value={w.eventId}>
                                {w.slug} ({w.displayName})
                              </option>
                            ))}
                          </select>
                          <Button
                            variant="primary" tone="brand" size="sm"
                            disabled={busy || !pickWeddingId[theme.templateId]}
                            onClick={() => handleSetDefault(theme)}
                          >
                            {busy ? 'Saving…' : 'Set as default'}
                          </Button>
                          {count > 0 && (
                            <Button variant="secondary" tone="neutral" size="sm" disabled={busy} onClick={() => handleClearDefault(theme)}>
                              Clear
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Inline edit form */}
                  <AnimatePresence>
                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <form onSubmit={e => handleSave(e, theme)} style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                          <div style={{ marginBottom: 14 }}>
                            <Input
                              label="Theme Name"
                              required
                              value={form.templateName}
                              onChange={e => setForm({ ...form, templateName: e.target.value })}
                            />
                          </div>
                          <div style={{ marginBottom: 14 }}>
                            <Textarea
                              label="Description"
                              value={form.description}
                              onChange={e => setForm({ ...form, description: e.target.value })}
                              rows={2}
                            />
                          </div>
                          {/* Thumbnail upload */}
                          <div style={{ marginBottom: 14 }}>
                            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-strong)', margin: '0 0 8px' }}>
                              Thumbnail
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={thumbBusyId === theme.templateId}
                                onChange={e => {
                                  const f = e.target.files?.[0];
                                  e.target.value = '';
                                  if (f) handleUploadThumbnail(theme, f);
                                }}
                                style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}
                              />
                              {thumbBusyId === theme.templateId && (
                                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-subtle)' }}>
                                  Uploading…
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Tier selector */}
                          <div style={{ marginBottom: 16 }}>
                            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-strong)', margin: '0 0 8px' }}>
                              Tier
                            </p>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {TIERS.map(t => (
                                <Button
                                  key={t.value}
                                  type="button"
                                  size="sm"
                                  variant={form.tier === t.value ? 'primary' : 'secondary'}
                                  tone={form.tier === t.value ? 'brand' : 'neutral'}
                                  onClick={() => setForm({ ...form, tier: t.value })}
                                >
                                  {t.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                          {/* Event types */}
                          <div style={{ marginBottom: 16 }}>
                            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-strong)', margin: '0 0 8px' }}>
                              Event types
                            </p>
                            <div style={{ display: 'flex', gap: 16 }}>
                              {EVENT_TYPES.map(ev => (
                                <Checkbox
                                  key={ev.key}
                                  label={ev.label}
                                  checked={form.eventTypes.includes(ev.key)}
                                  onChange={e => setForm({
                                    ...form,
                                    eventTypes: e.target.checked
                                      ? [...form.eventTypes, ev.key]
                                      : form.eventTypes.filter(k => k !== ev.key),
                                  })}
                                />
                              ))}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <Button variant="secondary" tone="neutral" type="button" onClick={() => setEditingId(null)}>
                              Cancel
                            </Button>
                            <Button variant="primary" tone="brand" type="submit" disabled={saving}>
                              {saving ? 'Saving…' : 'Save changes'}
                            </Button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
