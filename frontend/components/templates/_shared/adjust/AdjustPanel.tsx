'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { AnimOutType, AnimType, Breakpoint, Layer, ObjectFit, StageDef, StageId } from '../types';
import { ANIM_OPTIONS, ANIM_OUT_OPTIONS } from '../types';
import { resolveStage, serializeStage, baseStage, layoutKey, type StageBg } from '../layout';
import styles from './AdjustPanel.module.css';

const ANIM_LABELS: Record<AnimType, string> = {
  rise: 'Rise (default)', fade: 'Fade', 'slide-up': 'Slide up', 'slide-down': 'Slide down',
  'slide-left': 'Slide left', 'slide-right': 'Slide right', 'zoom-in': 'Zoom in',
  'zoom-out': 'Zoom out', 'scroll-fade': 'Fade on scroll', none: 'None',
};

const ANIM_OUT_LABELS: Record<AnimOutType, string> = {
  none: 'None', 'fade-out': 'Fade out',
  'slide-out-up': 'Slide out up', 'slide-out-down': 'Slide out down',
  'slide-out-left': 'Slide out left', 'slide-out-right': 'Slide out right',
  'zoom-out': 'Shrink out', 'zoom-in': 'Grow out',
};

interface Props {
  /** The template's stage-definition map (e.g. T7_STAGES). */
  stages: Record<string, StageDef>;
  /** Config-key namespace for this template's layouts ('t7', 't5', …). */
  keyPrefix: string;
  stageIds: StageId[];
  breakpoint: Breakpoint;
  config: Record<string, string>;
  /** '' deletes the key, restoring the stage's shipped defaults. */
  onLayoutChange: (key: string, value: string) => void;
  selectedStage: StageId;
  selectedLayer?: string;
  onSelectStage: (id: StageId) => void;
  onSelectLayer: (id: string | undefined) => void;
  /** Close the dock (the parent turns Adjust off). */
  onClose: () => void;
  /** True only for full-screen Stage-compositor templates (T7). "Reveal off-screen" widens the
   *  preview canvas and pins the stage — meaningless for fluid DOM overlays (T5), so hide it. */
  canReveal: boolean;
  /** Editor-only overflow reveal — lets you see/grab layers nudged past the viewport. */
  revealOverflow: boolean;
  onToggleReveal: () => void;
  /** Uploads a file and resolves to its /uploads/… URL. Absent ⇒ image controls are hidden. */
  onUploadImage?: (file: File) => Promise<string>;
}

const FIT_OPTIONS: ObjectFit[] = ['cover', 'contain', 'fill'];
/** Sentinel selection for the synthetic background row. */
const BG_ID = '__bg';

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className={styles.control}>
      <span>{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <input
        className={styles.num} type="number" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export default function AdjustPanel({
  stages, keyPrefix, stageIds, breakpoint, config, onLayoutChange,
  selectedStage, selectedLayer, onSelectStage, onSelectLayer, onClose,
  canReveal, revealOverflow, onToggleReveal, onUploadImage,
}: Props) {
  const [note, setNote] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  // Layer-detail tab: geometry vs animation. Sticky across layer selection.
  const [detailTab, setDetailTab] = useState<'layout' | 'anim'>('layout');
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<'layer' | 'bg'>('layer');

  const def = stages[selectedStage];
  const { layers, bgFit, bgPosition, bgScale, bgSrc } = useMemo(
    () => resolveStage(keyPrefix, def, breakpoint, config),
    [keyPrefix, def, breakpoint, config],
  );
  const bgState: StageBg = useMemo(
    () => ({ bgFit, bgPosition, bgScale, bgSrc }),
    [bgFit, bgPosition, bgScale, bgSrc],
  );

  // Front-most first, which is how you think about a stack of art.
  const ordered = useMemo(() => [...layers].sort((a, b) => b.z - a.z), [layers]);
  const current = layers.find((l) => l.id === selectedLayer);

  // ── layer tree (sub-layers) ─────────────────────────────────────────────────
  // A layer with a `parent` present in this stage renders indented under it. `parent` is a
  // shipped structural field (T5's countdown/ceremony groups), never part of a saved delta.
  const idSet = useMemo(() => new Set(layers.map((l) => l.id)), [layers]);
  const childrenOf = useMemo(() => {
    const m = new Map<string, Layer[]>();
    for (const l of ordered) {
      if (l.parent && idSet.has(l.parent)) {
        const arr = m.get(l.parent) ?? [];
        arr.push(l);
        m.set(l.parent, arr);
      }
    }
    return m;
  }, [ordered, idSet]);
  const roots = ordered.filter((l) => !l.parent || !idSet.has(l.parent));

  const commit = useCallback(
    (nextLayers: Layer[], nextBg: StageBg = bgState) => {
      onLayoutChange(
        layoutKey(keyPrefix, breakpoint, def.id),
        serializeStage(def, breakpoint, nextLayers, nextBg),
      );
    },
    [keyPrefix, def, breakpoint, bgState, onLayoutChange],
  );

  const patchLayer = useCallback(
    (id: string, patch: Partial<Layer>) =>
      commit(layers.map((l) => (l.id === id ? { ...l, ...patch } : l))),
    [layers, commit],
  );

  const patchBg = (patch: Partial<StageBg>) => commit(layers, { ...bgState, ...patch });

  const set = (field: keyof Layer) => (v: number) =>
    current && patchLayer(current.id, { [field]: v } as Partial<Layer>);

  // ── z-stack reorder (drag) ──────────────────────────────────────────────────
  // Only art participates in z-stacking; anchors are transforms on real DOM, so we leave their z
  // alone. restack rewrites the reordered ids to a dense descending sequence so moves can't drift.
  const stackIds = useMemo(() => ordered.filter((l) => l.kind !== 'anchor').map((l) => l.id), [ordered]);
  const restack = (ids: string[]) => {
    const zById = new Map(ids.map((id, i) => [id, ids.length - i]));
    commit(layers.map((l) => ({ ...l, z: zById.get(l.id) ?? l.z })));
  };
  const reorder = (dragged: string, target: string) => {
    if (dragged === target) return;
    const ids = [...stackIds];
    const from = ids.indexOf(dragged);
    const to = ids.indexOf(target);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, dragged);
    restack(ids);
  };

  const addLayer = (kind: 'text' | 'shape' | 'img', extra?: Partial<Layer>) => {
    const id = `custom-${Date.now().toString(36)}`;
    const maxZ = Math.max(0, ...layers.map((l) => l.z));
    const styled: Partial<Layer> =
      kind === 'text' ? { text: 'Your text here', color: '#3F3524', fontSize: 4, fontWeight: 600 }
      : kind === 'shape' ? { shape: 'rect', fill: '#C98A54', radius: 0 }
      : {}; // img — src comes in via `extra`
    const layer: Layer = {
      id, kind,
      x: 50, y: 50, w: kind === 'text' ? 60 : 30, h: 22, s: 1,
      z: maxZ + 1, order: layers.length,
      // Uploaded images have no size manifest, so an aspect-linked box has no intrinsic height to
      // follow — start them fixed-box (the Link toggle can switch it). Text stays aspect-free.
      chain: kind === 'text',
      hidden: false, opacity: 1,
      ...styled, ...extra,
    };
    commit([...layers, layer]);
    onSelectLayer(id);
  };

  // Deleting an anchor can't tombstone it — resolveStage would then drop the anchor and the real
  // element would spring back to its default spot. A sticky `hidden` removes it from the page and
  // Reset stage still restores it. Art layers tombstone as before.
  const removeLayer = (id: string) => {
    const layer = layers.find((l) => l.id === id);
    if (layer?.kind === 'anchor') {
      patchLayer(id, { hidden: true });
    } else {
      commit(layers.filter((l) => l.id !== id));
    }
    if (selectedLayer === id) onSelectLayer(undefined);
  };

  const resetLayer = () => {
    if (!current) return;
    const original = baseStage(def, breakpoint).layers.find((l) => l.id === current.id);
    if (!original) return removeLayer(current.id); // a custom layer has no default to fall back to
    commit(layers.map((l) => (l.id === current.id ? original : l)));
  };

  const resetStage = () => {
    onLayoutChange(layoutKey(keyPrefix, breakpoint, def.id), '');
    onSelectLayer(undefined);
    flash('Stage reset to defaults');
  };

  const copyToOther = () => {
    const other: Breakpoint = breakpoint === 'mobile' ? 'desktop' : 'mobile';
    // Re-serialize against the OTHER breakpoint's defaults — the same absolute geometry is a
    // different delta over there, and writing this breakpoint's delta verbatim would be wrong.
    onLayoutChange(layoutKey(keyPrefix, other, def.id), serializeStage(def, other, layers, bgState));
    flash(`Copied to ${other}`);
  };

  const pickImage = (target: 'layer' | 'bg') => {
    uploadTarget.current = target;
    fileRef.current?.click();
  };
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onUploadImage) return;
    flash('Uploading…');
    try {
      const url = await onUploadImage(file);
      if (uploadTarget.current === 'bg') patchBg({ bgSrc: url });
      else addLayer('img', { src: url });
      flash('Image added');
    } catch (err) {
      // Surface the server's reason (e.g. an unsupported format) instead of a blank failure.
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      flash(msg || 'Upload failed');
    }
  };

  const flash = (msg: string) => {
    setNote(msg);
    setTimeout(() => setNote(''), 1800);
  };

  const toggleCollapse = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const dirty = Boolean(config[layoutKey(keyPrefix, breakpoint, def.id)]);
  const isImage = current?.kind === 'img';
  // Anchors are existing DOM elements, not overlay art: they can't be resized (only nudged), so
  // the panel shows a reduced, transform-only control set for them.
  const isAnchor = current?.kind === 'anchor';
  // scrollVideo (Template 5's envelope) has no geometry at all — it's an effect, not a
  // positioned rectangle — so it gets its own control set in place of X/Y/Width/etc, and no
  // Animation tab (the enter/exit vocabulary doesn't apply to a scroll-scrubbed effect).
  const isScrollVideo = current?.kind === 'scrollVideo';
  const bgSelected = selectedLayer === BG_ID;

  const nameOf = (l: Layer) =>
    l.label ?? (l.kind === 'slot' ? `▤ ${l.slot}` : l.id);

  // ── a single layer row (optionally a sub-layer) ────────────────────────────
  const renderRow = (l: Layer, indent: boolean) => {
    const kids = childrenOf.get(l.id);
    const hasKids = !!kids?.length;
    const isOpen = !collapsed.has(l.id);
    const draggable = l.kind !== 'anchor';
    return (
      <div key={l.id}>
        <div
          className={`${styles.row} ${l.id === selectedLayer ? styles.rowActive : ''} ${dragId === l.id ? styles.rowDragging : ''}`}
          style={indent ? { marginLeft: 16 } : undefined}
          draggable={draggable}
          onDragStart={draggable ? () => setDragId(l.id) : undefined}
          onDragEnd={draggable ? () => setDragId(null) : undefined}
          onDragOver={draggable && dragId ? (e) => e.preventDefault() : undefined}
          onDrop={draggable && dragId ? (e) => { e.preventDefault(); reorder(dragId, l.id); setDragId(null); } : undefined}
        >
          {hasKids ? (
            <button className={styles.caret} onClick={() => toggleCollapse(l.id)} title={isOpen ? 'Collapse' : 'Expand'}>
              {isOpen ? '▾' : '▸'}
            </button>
          ) : (
            <span className={styles.grip} title={draggable ? 'Drag to reorder' : undefined}>
              {draggable ? '⠿' : ' '}
            </span>
          )}
          <button
            className={`${styles.name} ${l.hidden ? styles.nameHidden : ''}`}
            onClick={() => onSelectLayer(l.id)}
          >
            {nameOf(l)}
          </button>
          <button
            className={`${styles.iconBtn} ${l.hidden ? styles.iconBtnOff : ''}`}
            onClick={() => patchLayer(l.id, { hidden: !l.hidden })}
            title={l.hidden ? 'Show' : 'Hide'}
          >
            {l.hidden ? '○' : '●'}
          </button>
          <button
            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
            onClick={() => removeLayer(l.id)}
            title={l.kind === 'anchor' ? 'Remove from invitation' : 'Delete layer'}
          >
            ✕
          </button>
        </div>
        {hasKids && isOpen && kids!.map((c) => renderRow(c, true))}
      </div>
    );
  };

  return (
    <div className={styles.panel} data-adjust-panel>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

      <div className={styles.header}>
        <span className={styles.title}>Adjust · {breakpoint}</span>
        <button className={styles.close} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.label}>Stage</div>
        <div className={styles.tabs}>
          {stageIds.map((id) => (
            <button
              key={id}
              className={`${styles.tab} ${id === selectedStage ? styles.tabActive : ''}`}
              onClick={() => {
                // Scrolling the preview to this stage is the parent's job now — the stage lives in
                // the preview iframe, which this panel (in the parent tree) can't reach directly.
                onSelectStage(id);
                onSelectLayer(undefined);
              }}
            >
              {stages[id].label}
            </button>
          ))}
        </div>

        <div className={styles.label}>Layers · front to back</div>
        <div className={styles.layers}>
          {roots.map((l) => renderRow(l, false))}
          {def.bg && (
            <div
              className={`${styles.row} ${bgSelected ? styles.rowActive : ''}`}
              onClick={() => onSelectLayer(BG_ID)}
              role="button"
            >
              <span className={styles.grip}> </span>
              <span className={`${styles.name} ${styles.bgRow}`}>▦ Background</span>
            </div>
          )}
        </div>

        <div className={styles.btnRow}>
          <button className={styles.btn} onClick={() => addLayer('text')}>+ Text</button>
          <button className={styles.btn} onClick={() => addLayer('shape')}>+ Shape</button>
          {onUploadImage && (
            <button className={styles.btn} onClick={() => pickImage('layer')}>+ Image</button>
          )}
        </div>

        {canReveal && (
          <button
            className={`${styles.btn} ${revealOverflow ? '' : styles.btnGhost}`}
            onClick={onToggleReveal}
            style={{ width: '100%', marginTop: 6 }}
            title="Show art cropped by the device edge"
          >
            {revealOverflow ? '✓ Revealing off-screen' : 'Reveal off-screen'}
          </button>
        )}

        {bgSelected && def.bg ? (
          <>
            <div className={styles.label}>Background</div>
            <div className={styles.control} style={{ gridTemplateColumns: '54px 1fr' }}>
              <span>Fit</span>
              <select
                className={styles.select}
                value={bgFit}
                onChange={(e) => patchBg({ bgFit: e.target.value as ObjectFit })}
              >
                {FIT_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            {(() => {
              const [px, py] = (bgPosition ?? '50% 50%').split(' ').map((s) => parseFloat(s) || 50);
              return (
                <>
                  <Slider label="Pos X" value={px} min={0} max={100} step={1} onChange={(v) => patchBg({ bgPosition: `${v}% ${py}%` })} />
                  <Slider label="Pos Y" value={py} min={0} max={100} step={1} onChange={(v) => patchBg({ bgPosition: `${px}% ${v}%` })} />
                </>
              );
            })()}
            <Slider label="Scale" value={bgScale ?? 1} min={0.5} max={3} step={0.02} onChange={(v) => patchBg({ bgScale: v })} />
            {onUploadImage && (
              <div className={styles.btnRow}>
                <button className={styles.btn} onClick={() => pickImage('bg')}>Replace image</button>
                {bgSrc && (
                  <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => patchBg({ bgSrc: undefined })}>
                    Reset image
                  </button>
                )}
              </div>
            )}
          </>
        ) : current ? (
          <>
            <div className={styles.label}>{current.label ?? current.id}</div>

            {/* Geometry and animation are split into two tabs so neither crowds the column.
                scrollVideo has no entrance/exit vocabulary, so it only ever shows Layout. */}
            {!isScrollVideo && (
              <div className={styles.tabs} style={{ marginBottom: 8 }}>
                <button
                  className={`${styles.tab} ${detailTab === 'layout' ? styles.tabActive : ''}`}
                  onClick={() => setDetailTab('layout')}
                >
                  Layout
                </button>
                <button
                  className={`${styles.tab} ${detailTab === 'anim' ? styles.tabActive : ''}`}
                  onClick={() => setDetailTab('anim')}
                >
                  Animation
                </button>
              </div>
            )}

            {isScrollVideo || detailTab === 'layout' ? (
              <>
                <div className={styles.control} style={{ gridTemplateColumns: '54px 1fr' }}>
                  <span>Name</span>
                  <input
                    className={styles.select}
                    value={current.label ?? ''}
                    onChange={(e) => patchLayer(current.id, { label: e.target.value || undefined })}
                    placeholder={current.id}
                  />
                </div>

                {current.kind === 'text' && (
                  <input
                    className={styles.select}
                    style={{ marginBottom: 8 }}
                    value={current.text ?? ''}
                    onChange={(e) => patchLayer(current.id, { text: e.target.value })}
                    placeholder="Type text…"
                  />
                )}

                {isScrollVideo ? (
                  <>
                    {/* No video-replace upload yet — PhotoService (backend) only accepts image
                        extensions/content-types today; wiring this up needs that widened first. */}
                    <Slider label="Trigger Start %" value={current.triggerStart ?? 85} min={0} max={100} step={1} onChange={set('triggerStart')} />
                    <Slider label="Trigger End %" value={current.triggerEnd ?? 15} min={0} max={100} step={1} onChange={set('triggerEnd')} />
                    <Slider label="Scrub" value={current.scrub ?? 0.5} min={0} max={2} step={0.1} onChange={set('scrub')} />
                    <Slider label="Pivot" value={current.pivot ?? 0.5} min={0.1} max={0.9} step={0.01} onChange={set('pivot')} />
                    <Slider label="Hold Width" value={current.holdWidth ?? 0.04} min={0} max={0.3} step={0.01} onChange={set('holdWidth')} />
                    <Slider label="Video Start (s)" value={current.videoStartSec ?? 0.5} min={0} max={3} step={0.1} onChange={set('videoStartSec')} />
                    <Slider label="Open Threshold" value={current.openThreshold ?? 0.85} min={0.5} max={0.99} step={0.01} onChange={set('openThreshold')} />
                    <Slider label="Reset Time (s)" value={current.resetSec ?? 0.2} min={0} max={2} step={0.1} onChange={set('resetSec')} />
                    <Slider label="Chroma Threshold" value={current.chromaThreshold ?? 30} min={0} max={100} step={1} onChange={set('chromaThreshold')} />
                    <Slider label="Chroma Fade" value={current.chromaFade ?? 20} min={0} max={100} step={1} onChange={set('chromaFade')} />
                  </>
                ) : (
                  <>
                    {/* Anchors nudge an existing element by an offset — X/Y here is a translate, not
                        an absolute position. 50 = no offset. */}
                    <Slider label={isAnchor ? 'Nudge X' : 'X'} value={current.x} min={-20} max={120} step={0.5} onChange={set('x')} />
                    <Slider label={isAnchor ? 'Nudge Y' : 'Y'} value={current.y} min={-20} max={120} step={0.5} onChange={set('y')} />

                    {!isAnchor && (
                      <>
                        <Slider label="Width" value={current.w} min={3} max={200} step={0.5} onChange={set('w')} />
                        {!current.chain && (
                          <Slider label="Height" value={current.h} min={3} max={200} step={0.5} onChange={set('h')} />
                        )}
                        {isImage && (
                          <button
                            className={`${styles.chain} ${current.chain ? '' : styles.chainOff}`}
                            onClick={() => patchLayer(current.id, { chain: !current.chain })}
                          >
                            {current.chain ? '— Linked: height follows width —' : '— Free: height set separately —'}
                          </button>
                        )}
                      </>
                    )}

                    <Slider label="Scale" value={current.s} min={0.2} max={3} step={0.02} onChange={set('s')} />
                    <Slider label="Opacity" value={current.opacity} min={0} max={1} step={0.05} onChange={set('opacity')} />

                    {!isAnchor && (
                      <Slider label="Depth" value={current.depth ?? current.z / 10} min={0} max={3} step={0.1} onChange={set('depth')} />
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                {/* Enter — one-shot when the section scrolls into view, staggered by Phase. */}
                <div className={styles.label}>On enter</div>
                <div className={styles.control} style={{ gridTemplateColumns: '54px 1fr' }}>
                  <span>Type</span>
                  <select
                    className={styles.select}
                    value={current.anim ?? 'rise'}
                    onChange={(e) => patchLayer(current.id, { anim: e.target.value as AnimType })}
                  >
                    {ANIM_OPTIONS.map((a) => (
                      <option key={a} value={a}>{ANIM_LABELS[a]}</option>
                    ))}
                  </select>
                </div>
                {(current.anim ?? 'rise') !== 'scroll-fade' && (current.anim ?? 'rise') !== 'none' && (
                  <Slider label="Duration" value={current.animDur ?? 1} min={0.2} max={3} step={0.1} onChange={set('animDur')} />
                )}
                {(current.anim ?? 'rise') !== 'scroll-fade' && (
                  <Slider label="Phase" value={current.order} min={0} max={12} step={1} onChange={set('order')} />
                )}

                {/* Exit — scroll-scrubbed as the layer leaves the top of the viewport (reversible). */}
                <div className={styles.label} style={{ marginTop: 4 }}>On scroll out</div>
                <div className={styles.control} style={{ gridTemplateColumns: '54px 1fr' }}>
                  <span>Type</span>
                  <select
                    className={styles.select}
                    value={current.animOut ?? 'none'}
                    onChange={(e) => patchLayer(current.id, { animOut: e.target.value as AnimOutType })}
                  >
                    {ANIM_OUT_OPTIONS.map((a) => (
                      <option key={a} value={a}>{ANIM_OUT_LABELS[a]}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={resetLayer} style={{ width: '100%', marginTop: 8 }}>
              {isAnchor ? 'Reset position' : 'Reset layer'}
            </button>
          </>
        ) : (
          <p style={{ fontSize: 12, color: '#8A7A63', marginTop: 8 }}>
            Pick a layer above, or add one with + Text / + Shape / + Image.
          </p>
        )}

        <div className={styles.divider}>
          <div className={styles.btnRow}>
            <button className={styles.btn} onClick={copyToOther}>
              Copy to {breakpoint === 'mobile' ? 'desktop' : 'mobile'}
            </button>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={resetStage} disabled={!dirty}>
              Reset stage
            </button>
          </div>
          <div className={styles.note}>{note}</div>
        </div>
      </div>
    </div>
  );
}
