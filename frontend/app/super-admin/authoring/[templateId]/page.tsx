'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { templateService, Template, Wedding, Wish, ItineraryItem } from '@/lib/api';
import AdjustPanel from '@/components/templates/_shared/adjust/AdjustPanel';
import { resolveStage, serializeStage, layoutKey } from '@/components/templates/_shared/layout';
import { flattenTemplate } from '@/components/templates/_shared/authoring/flatten';
import { SLOT_CATALOG } from '@/components/templates/_shared/slots/catalog';
import type { Layer as LayerModel, Breakpoint, StageDef } from '@/components/templates/_shared/types';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

const DEVICE_WIDTH: Record<Breakpoint, number> = { mobile: 390, desktop: 1280 };
const DEVICE_HEIGHT = 760;

// The Adjust panel and shared engine are both wedding-shaped: the whole draft goes through the
// SAME preview iframe/postMessage protocol the couple-admin customize page already uses
// (see app/(standalone)/couple-admin/preview/page.tsx) with a synthetic Wedding whose
// templateStagesJson carries the live-flattened draft — TemplateWrapper's authored-template
// fallthrough (see CLAUDE.md) already renders straight from that field, so no new preview route
// is needed. DataTemplate now renders real slot content (RSVP, itinerary, wishes, photo booth —
// see _shared/slots/), so the preview payload carries sample data (below) purely so those blocks
// aren't invisible while authoring — nothing here is ever submitted (RSVP/wish forms no-op while
// `editing`) or persisted.
function buildPreviewWedding(templateId: number, templateName: string, stagesJson: string): Wedding {
  return {
    weddingId: 0,
    coupleName: 'preview',
    brideName: 'Bride',
    groomName: 'Groom',
    weddingDate: new Date().toISOString(),
    venue: 'Sample Venue',
    venueAddress: '123 Sample Street',
    totalGuests: 0,
    totalAttending: 0,
    daysUntilWedding: 0,
    isActive: true,
    isPublic: false,
    totalPhotos: 0,
    enabledFeaturesCount: 0,
    templateId,
    templateName,
    templateStagesJson: stagesJson,
  };
}

// Sample content so SLOT_AVAILABLE-gated blocks (itinerary, photo booth) aren't dropped while
// authoring — mirrors customize/page.tsx's own SAMPLE_WISHES pattern.
const SAMPLE_WISHES: Wish[] = [
  { wishId: 1, weddingId: 0, guestName: 'Sarah', message: 'Wishing you a lifetime of happiness!', createdDate: new Date().toISOString() },
  { wishId: 2, weddingId: 0, guestName: 'James', message: 'Congratulations to the happy couple!', createdDate: new Date().toISOString() },
];
const SAMPLE_ITINERARY: ItineraryItem[] = [
  { itineraryItemId: 1, weddingId: 0, label: 'Guest Arrival', detail: '10:00 AM', sortOrder: 0 },
  { itineraryItemId: 2, weddingId: 0, label: 'Akad Nikah', detail: '11:00 AM', sortOrder: 1 },
  { itineraryItemId: 3, weddingId: 0, label: 'Feast', detail: '12:30 PM', sortOrder: 2 },
];

export default function AuthoringEditorPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = parseInt(params.templateId as string);

  const [template, setTemplate] = useState<Template | null>(null);
  const [skeleton, setSkeleton] = useState<Record<string, StageDef>>({});
  const [stageOrder, setStageOrder] = useState<string[]>([]);
  const [draftConfig, setDraftConfig] = useState<Record<string, string>>({});
  const [activeStage, setActiveStage] = useState('');
  const [selectedLayer, setSelectedLayer] = useState<string | undefined>();
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('mobile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [bgBusyId, setBgBusyId] = useState<string | null>(null);

  const savedSnapshot = useRef('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const payloadRef = useRef<unknown>(null);
  const postFrameRef = useRef(0);

  const flash = (msg: string) => { setNote(msg); setTimeout(() => setNote(''), 1800); };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const t = await templateService.getById(templateId);
      setTemplate(t);
      let parsed: Record<string, StageDef> = {};
      try {
        parsed = t.stagesJson ? (JSON.parse(t.stagesJson) as Record<string, StageDef>) : {};
      } catch {
        parsed = {};
      }
      let order = Object.keys(parsed);
      if (order.length === 0) {
        const id = 'stage-1';
        parsed = { [id]: { id, label: 'Stage 1', bg: '', bgFit: 'cover', layers: [] } };
        order = [id];
      }
      setSkeleton(parsed);
      setStageOrder(order);
      setActiveStage(order[0]);
      setSelectedLayer(undefined);
      setDraftConfig({});
      savedSnapshot.current = JSON.stringify({ skeleton: parsed, stageOrder: order });
    } catch {
      setError('Failed to load template');
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => { load(); }, [load]);

  const dirty = useMemo(() => {
    if (Object.keys(draftConfig).length > 0) return true;
    return JSON.stringify({ skeleton, stageOrder }) !== savedSnapshot.current;
  }, [skeleton, stageOrder, draftConfig]);

  // ── stage structural management (add/rename/reorder/delete/background) ─────────────────────
  const addStage = () => {
    const label = window.prompt('Stage name', `Stage ${stageOrder.length + 1}`);
    if (!label) return;
    // Non-numeric id — see flatten.ts's note on object-key ordering.
    const id = `stage-${Date.now().toString(36)}`;
    setSkeleton((prev) => ({ ...prev, [id]: { id, label, bg: '', bgFit: 'cover', layers: [] } }));
    setStageOrder((prev) => [...prev, id]);
    setActiveStage(id);
    setSelectedLayer(undefined);
  };

  const renameStage = (id: string, label: string) =>
    setSkeleton((prev) => ({ ...prev, [id]: { ...prev[id], label } }));

  // Structural, not a per-wedding delta — see StageDef.flow / Stage.tsx. A section whose real
  // content (a wish list, a photo grid, a tall ceremony stack) outgrows one screen should grow
  // to fit it instead of clipping.
  const toggleFlow = (id: string) =>
    setSkeleton((prev) => ({ ...prev, [id]: { ...prev[id], flow: !prev[id].flow } }));

  const deleteStage = (id: string) => {
    if (stageOrder.length <= 1) { flash('A template needs at least one stage'); return; }
    if (!window.confirm('Delete this stage? This is undone only if you leave without saving.')) return;
    setSkeleton((prev) => { const next = { ...prev }; delete next[id]; return next; });
    const nextOrder = stageOrder.filter((x) => x !== id);
    setStageOrder(nextOrder);
    setDraftConfig((prev) => {
      const next = { ...prev };
      delete next[layoutKey('author', 'mobile', id)];
      delete next[layoutKey('author', 'desktop', id)];
      return next;
    });
    if (activeStage === id) setActiveStage(nextOrder[0] ?? '');
  };

  const moveStage = (id: string, dir: -1 | 1) => {
    setStageOrder((prev) => {
      const idx = prev.indexOf(id);
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const out = [...prev];
      [out[idx], out[next]] = [out[next], out[idx]];
      return out;
    });
  };

  const handleStageBackground = async (id: string, file: File) => {
    setBgBusyId(id);
    try {
      const url = await templateService.uploadAsset(templateId, file);
      setSkeleton((prev) => ({ ...prev, [id]: { ...prev[id], bg: url, bgFit: prev[id].bgFit || 'cover' } }));
    } catch {
      flash('Background upload failed');
    } finally {
      setBgBusyId(null);
    }
  };

  const selectStage = (id: string) => {
    setActiveStage(id);
    setSelectedLayer(undefined);
    iframeRef.current?.contentWindow?.postMessage({ type: 'PREVIEW_SCROLL', sectionId: id }, window.location.origin);
  };

  // ── layer editing (Adjust panel + canvas drag/resize) ───────────────────────────────────────
  const handleLayoutChange = useCallback((key: string, value: string) => {
    setDraftConfig((prev) => {
      const next = { ...prev };
      if (value === '') delete next[key]; else next[key] = value;
      return next;
    });
  }, []);

  const patchLayerFromCanvas = useCallback((layerId: string, patch: Partial<LayerModel>) => {
    const def = skeleton[activeStage];
    if (!def) return;
    const { layers, bgFit, bgPosition, bgScale, bgSrc } = resolveStage('author', def, breakpoint, draftConfig);
    const nextLayers = layers.map((l) => (l.id === layerId ? { ...l, ...patch } : l));
    handleLayoutChange(
      layoutKey('author', breakpoint, def.id),
      serializeStage(def, breakpoint, nextLayers, { bgFit, bgPosition, bgScale, bgSrc }),
    );
  }, [skeleton, activeStage, breakpoint, draftConfig, handleLayoutChange]);

  const handleUploadImage = useCallback(async (file: File): Promise<string> => {
    return templateService.uploadAsset(templateId, file);
  }, [templateId]);

  // ── live preview: flatten + push to the (reused) couple-admin preview iframe ───────────────
  const previewStages = useMemo(
    () => flattenTemplate('author', skeleton, stageOrder, draftConfig),
    [skeleton, stageOrder, draftConfig],
  );

  useEffect(() => {
    if (!template) return;
    const payload = {
      wedding: buildPreviewWedding(templateId, template.templateName, JSON.stringify(previewStages)),
      coupleMedia: [],
      wishes: SAMPLE_WISHES,
      photoBoothEnabled: true,
      customConfig: {},
      itinerary: SAMPLE_ITINERARY,
      editor: {
        enabled: true,
        breakpoint,
        selectedStage: activeStage,
        selectedLayer,
        revealOverflow: false,
      },
    };
    payloadRef.current = payload;
    if (postFrameRef.current) return;
    postFrameRef.current = requestAnimationFrame(() => {
      postFrameRef.current = 0;
      iframeRef.current?.contentWindow?.postMessage({ type: 'PREVIEW_UPDATE', payload: payloadRef.current }, window.location.origin);
    });
  }, [previewStages, template, templateId, breakpoint, activeStage, selectedLayer]);

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

  // ── save: flatten the skeleton+deltas into one self-contained blob and persist ─────────────
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const finalStages = flattenTemplate('author', skeleton, stageOrder, draftConfig);
      const updated = await templateService.setStages(templateId, JSON.stringify(finalStages));
      setTemplate(updated);
      setSkeleton(finalStages);
      setDraftConfig({});
      savedSnapshot.current = JSON.stringify({ skeleton: finalStages, stageOrder });
      flash('Saved');
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '2.5px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ color: 'var(--text-subtle)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)' }}>Loading…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (!template) return (
    <div style={{ padding: 24 }}>
      <p style={{ fontFamily: 'var(--font-ui)', color: 'var(--danger)' }}>{error ?? 'Template not found'}</p>
    </div>
  );

  const activeDef = skeleton[activeStage];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 32px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/super-admin/authoring" style={{ color: 'var(--text-subtle)', display: 'flex' }}>
            <Icon name="arrow-left" size={18} />
          </Link>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, color: 'var(--text-strong)' }}>
              {template.templateName}
            </h1>
            <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-subtle)' }}>
              {template.templateCode} · <Link href="/super-admin/themes" style={{ color: 'var(--brand)' }}>edit name/tier/thumbnail →</Link>
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {note && <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>{note}</span>}
          <div style={{ display: 'flex', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {(['mobile', 'desktop'] as Breakpoint[]).map((bp) => (
              <button
                key={bp}
                onClick={() => setBreakpoint(bp)}
                style={{
                  padding: '6px 12px', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)',
                  border: 'none', cursor: 'pointer',
                  background: breakpoint === bp ? 'var(--brand)' : 'transparent',
                  color: breakpoint === bp ? 'var(--brand-on)' : 'var(--text-body)',
                }}
              >
                {bp === 'mobile' ? '📱 Mobile' : '🖥 Desktop'}
              </button>
            ))}
          </div>
          <Button variant="primary" tone="brand" onClick={handleSave} disabled={saving || !dirty}>
            {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'color-mix(in srgb, var(--danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 12 }}>
          <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', margin: 0, fontFamily: 'var(--font-ui)' }}>{error}</p>
        </div>
      )}

      {/* Three columns: stages · preview · adjust */}
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
        {/* Stage list */}
        <div style={{ width: 220, flexShrink: 0, overflowY: 'auto', borderRight: '1px solid var(--border-subtle)', paddingRight: 12 }}>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '4px 0 10px' }}>
            Stages
          </p>
          {stageOrder.map((id, i) => {
            const def = skeleton[id];
            if (!def) return null;
            return (
              <div
                key={id}
                style={{
                  border: `1px solid ${activeStage === id ? 'var(--brand)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)', padding: 8, marginBottom: 8,
                  background: activeStage === id ? 'var(--brand-subtle)' : 'var(--surface-card)',
                  cursor: 'pointer',
                }}
                onClick={() => selectStage(id)}
              >
                <input
                  value={def.label}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => renameStage(id, e.target.value)}
                  style={{
                    width: '100%', border: 'none', background: 'transparent', fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-strong)', marginBottom: 6,
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {def.bg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={def.bg} alt="" style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border-subtle)' }} />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: 4, border: '1px dashed var(--border-default)' }} />
                  )}
                  <label
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: 11, fontFamily: 'var(--font-ui)', color: 'var(--brand)', cursor: 'pointer' }}
                  >
                    {bgBusyId === id ? 'Uploading…' : def.bg ? 'Replace' : 'Set bg'}
                    <input
                      type="file" accept="image/*" hidden disabled={bgBusyId === id}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        if (f) handleStageBackground(id, f);
                      }}
                    />
                  </label>
                  <div style={{ flex: 1 }} />
                  <label
                    onClick={(e) => e.stopPropagation()}
                    title="Grows to fit tall content (a wish list, a photo grid) instead of clipping to one screen"
                    style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontFamily: 'var(--font-ui)', color: 'var(--text-subtle)', cursor: 'pointer' }}
                  >
                    <input type="checkbox" checked={Boolean(def.flow)} onChange={() => toggleFlow(id)} style={{ margin: 0 }} />
                    Flow
                  </label>
                  <button onClick={(e) => { e.stopPropagation(); moveStage(id, -1); }} disabled={i === 0}
                    style={{ border: 'none', background: 'none', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1 }}>
                    <Icon name="chevron-up" size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); moveStage(id, 1); }} disabled={i === stageOrder.length - 1}
                    style={{ border: 'none', background: 'none', cursor: i === stageOrder.length - 1 ? 'default' : 'pointer', opacity: i === stageOrder.length - 1 ? 0.3 : 1 }}>
                    <Icon name="chevron-down" size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteStage(id); }}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            );
          })}
          <Button variant="secondary" tone="neutral" size="sm" onClick={addStage} style={{ width: '100%', marginTop: 4 }}>
            + Add stage
          </Button>
        </div>

        {/* Live preview */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'auto', padding: '8px 0' }}>
          <div style={{
            width: DEVICE_WIDTH[breakpoint], height: DEVICE_HEIGHT, flexShrink: 0,
            border: '1px solid var(--border-default)', borderRadius: 12, overflow: 'hidden',
            boxShadow: 'var(--shadow-md, 0 4px 20px rgba(0,0,0,0.12))', background: '#fff',
          }}>
            <iframe
              ref={iframeRef}
              src="/couple-admin/preview"
              style={{ width: '100%', height: '100%', border: 0 }}
              title="Template preview"
            />
          </div>
        </div>

        {/* Adjust dock */}
        <div style={{ width: 320, flexShrink: 0, overflowY: 'auto' }}>
          {activeDef && (
            <AdjustPanel
              stages={skeleton}
              keyPrefix="author"
              stageIds={stageOrder}
              breakpoint={breakpoint}
              config={draftConfig}
              onLayoutChange={handleLayoutChange}
              selectedStage={activeStage}
              selectedLayer={selectedLayer}
              onSelectStage={selectStage}
              onSelectLayer={setSelectedLayer}
              onClose={() => router.push('/super-admin/authoring')}
              canReveal={false}
              revealOverflow={false}
              onToggleReveal={() => {}}
              onUploadImage={handleUploadImage}
              slotCatalog={SLOT_CATALOG}
            />
          )}
        </div>
      </div>
    </div>
  );
}
