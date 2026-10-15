'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { Breakpoint } from '../types';
import type { CinematicBeat, CinematicEditorMode } from './registry';
import type { CinematicLayerGroup, CinematicWorldGeometry, CinematicWorldLayer } from './world';
import type { CameraState } from './useCinematicScroll';
import {
  resolveCinematicTrackClip,
  type CinematicAssetTransition, type CinematicCameraTransition,
  type CinematicEasing, type CinematicSequenceClip, type CinematicSequenceTrack,
} from './sequence';
import { cinematicSetOpacity, type CinematicVisibilitySet } from './visibility';
import { BINDING_TOKENS } from '../bindings';
import { CURATED_FONTS } from '@/lib/fonts/registry';
import { Icon } from '@/components/ui/Icon';
import styles from './CinematicAdjustPanel.module.css';

interface Props {
  beats: CinematicBeat[];
  breakpoint: Breakpoint;
  selectedBeat: string;
  progress: number;
  mode: CinematicEditorMode;
  referenceVisible: boolean;
  referenceOpacity: number;
  layers: CinematicWorldLayer[];
  selectedLayer?: string;
  camera?: CameraState & { id?: string };
  visibilitySets: CinematicVisibilitySet[];
  tracks?: CinematicSequenceTrack[];
  onSelectBeat: (id: string) => void;
  onProgressChange: (progress: number) => void;
  onModeChange: (mode: CinematicEditorMode) => void;
  onReferenceVisibleChange: (visible: boolean) => void;
  onReferenceOpacityChange: (opacity: number) => void;
  onSelectLayer: (id: string | undefined) => void;
  onLayersChange: (layers: CinematicWorldLayer[]) => void;
  onResetLayer: (id: string) => void;
  onResetWorld: () => void;
  onCameraChange: (patch: Partial<CameraState>) => void;
  onTimingTrackChange?: (id: string, patch: Partial<CinematicSequenceTrack>) => void;
  onMakeTimingIndependent?: (layerId: string) => void;
  onRelinkTiming?: (layerId: string) => void;
  onCreateBeat?: (label: string) => void;
  onRenameBeat?: (id: string, label: string) => void;
  onDuplicateBeat?: (id: string) => void;
  onDeleteBeat?: (id: string) => void;
  onTransitionChange?: (id: string, transition: CinematicCameraTransition) => void;
  onResetBeat?: (id: string) => void;
  shippedBeatIds?: string[];
  onResetCamera: () => void;
  onCopyCameraToOther: () => void;
  onVisibilityChange: (sets: CinematicVisibilitySet[]) => void;
  onResetVisibility: () => void;
  onUploadImage?: (file: File) => Promise<string>;
  shippedLayerIds: string[];
  onClose: () => void;
}

const GROUP_LABELS: Record<CinematicLayerGroup, string> = {
  background: 'Cloud backdrop',
  welcome: 'Welcome ring action',
  custom: 'Added layers',
  venue: 'Venue structure',
  dais: 'Bridal dais',
  programme: 'Programme',
  table: 'Reception table',
  'table-wishes': 'Table guest book',
  rsvp: 'RSVP interaction',
  wishes: 'Best Wishes interaction',
  memory: 'Memory wall',
};

const GROUP_ORDER = Object.keys(GROUP_LABELS) as CinematicLayerGroup[];
const ADD_GROUP_BY_BEAT: Record<string, CinematicLayerGroup> = {
  ring: 'welcome', dais: 'dais', groom: 'dais', bride: 'dais', 'dais-return': 'dais',
  'programme-wide': 'programme', 'programme-focus': 'programme',
  'table-rsvp': 'table', 'rsvp-letter': 'rsvp', 'table-wishes': 'table-wishes',
  'wishes-book': 'wishes', 'memory-wall': 'memory',
};
const spaceForGroup = (group: CinematicLayerGroup) =>
  group === 'welcome' || group === 'rsvp' || group === 'wishes' || group === 'memory'
    ? 'viewport' as const
    : 'world' as const;

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className={styles.control}>
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(event) => onChange(Number(event.target.value))} />
      <input className={styles.number} type="number" min={min} max={max} step={step} value={value}
        onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

export default function CinematicAdjustPanel({
  beats, breakpoint, selectedBeat, progress, mode, referenceVisible, referenceOpacity,
  layers, selectedLayer,
  camera, visibilitySets, tracks = [],
  onSelectBeat, onProgressChange, onModeChange, onReferenceVisibleChange,
  onReferenceOpacityChange, onSelectLayer, onLayersChange, onResetWorld,
  onResetLayer,
  onCameraChange, onResetCamera, onCopyCameraToOther,
  onTimingTrackChange, onMakeTimingIndependent, onRelinkTiming,
  onCreateBeat, onRenameBeat, onDuplicateBeat, onDeleteBeat,
  onTransitionChange, onResetBeat, shippedBeatIds = [],
  onResetVisibility, onUploadImage, shippedLayerIds, onClose,
}: Props) {
  const [popover, setPopover] = useState<'add' | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newBeatName, setNewBeatName] = useState('New camera beat');
  const [beatName, setBeatName] = useState('');
  const [deleteConfirmBeat, setDeleteConfirmBeat] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceLayerRef = useRef<string | null>(null);
  const customLayerCounter = useRef(0);
  const shipped = new Set(shippedLayerIds);
  const activeBeat = beats.find((beat) => beat.id === selectedBeat) ?? beats[0];
  const activeLayer = layers.find((layer) => layer.id === selectedLayer);
  const frontToBack = [...layers].sort((a, b) => b.z - a.z);
  const activeTimingTrack = activeLayer ? tracks.find((track) =>
    track.target.type === 'layer' && track.target.id === activeLayer.id) : undefined;
  const inheritedTimingTrack = activeLayer ? tracks.find((track) =>
    track.target.type === 'group' && track.target.id === activeLayer.group) : undefined;
  const groupedLayers = GROUP_ORDER.map((group) => ({
    group,
    layers: frontToBack.filter((layer) => layer.group === group),
    visibility: visibilitySets.find((set) => set.group === group),
  })).filter((entry) => entry.layers.length > 0);
  const activeBeatIndex = Math.max(0, beats.findIndex((beat) => beat.id === activeBeat?.id));
  const isShippedBeat = Boolean(activeBeat && shippedBeatIds.includes(activeBeat.id));
  const ownedTracks = activeBeat ? tracks.filter((track) =>
    track.ownership.kind === 'beat' && track.ownership.beatId === activeBeat.id) : [];

  useEffect(() => setBeatName(activeBeat?.label ?? ''), [activeBeat?.id, activeBeat?.label]);
  useEffect(() => setDeleteConfirmBeat(undefined), [activeBeat?.id]);

  const patchLayer = (id: string, patch: Partial<CinematicWorldGeometry>) => {
    onLayersChange(layers.map((layer) => layer.id === id ? { ...layer, ...patch } : layer));
  };

  const nextCustomId = () => {
    let id = '';
    do {
      id = `custom-cinematic-${customLayerCounter.current++}`;
    } while (layers.some((layer) => layer.id === id));
    return id;
  };

  const addLayer = (kind: 'text' | 'shape' | 'img', src?: string) => {
    const id = nextCustomId();
    const group = ADD_GROUP_BY_BEAT[activeBeat?.id ?? ''] ?? 'custom';
    const space = spaceForGroup(group);
    const peers = layers.filter((layer) => layer.space === space);
    const groupDepths = peers.filter((layer) => layer.group === group).map((layer) => layer.z);
    const frontDepth = Math.max(0, ...peers.map((layer) => layer.z)) + 1;
    // Uploaded scenic art starts behind the existing set. For example, a dais added while the
    // Full dais/Groom/Bride beat is active lands behind the seated people instead of over them.
    const z = kind === 'img' && groupDepths.length ? Math.min(...groupDepths) - 1 : frontDepth;
    const layer: CinematicWorldLayer = {
      id,
      label: kind === 'text' ? 'Custom text' : kind === 'shape' ? 'Custom shape' : 'Uploaded image',
      group,
      space,
      kind,
      src,
      text: kind === 'text' ? 'Your text here' : undefined,
      color: kind === 'text' ? '#4a3a32' : undefined,
      fontSize: kind === 'text' ? 4 : undefined,
      fontWeight: kind === 'text' ? 600 : undefined,
      textAlign: kind === 'text' ? 'center' : undefined,
      shape: kind === 'shape' ? 'rect' : undefined,
      fill: kind === 'shape' ? '#c98a54' : undefined,
      radius: kind === 'shape' ? 12 : undefined,
      x: 50, y: 50, w: kind === 'text' ? 46 : 30, h: kind === 'text' ? 14 : 24,
      z, rotation: 0, flipX: false, hidden: false, locked: false, opacity: 1,
      fit: 'contain',
    };
    onLayersChange([...layers, layer]);
    onSelectLayer(id);
    setPopover(null);
  };

  const chooseImage = (replaceId?: string) => {
    replaceLayerRef.current = replaceId ?? null;
    fileRef.current?.click();
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !onUploadImage) return;
    setUploading(true);
    try {
      const src = await onUploadImage(file);
      const replaceId = replaceLayerRef.current;
      if (replaceId) patchLayer(replaceId, { src });
      else addLayer('img', src);
    } finally {
      replaceLayerRef.current = null;
      setUploading(false);
    }
  };

  const removeLayer = (id: string) => {
    if (shipped.has(id)) return;
    onLayersChange(layers.filter((layer) => layer.id !== id));
    onSelectLayer(undefined);
  };

  const placeBehindCurrentSet = (layer: CinematicWorldLayer) => {
    const group = ADD_GROUP_BY_BEAT[activeBeat?.id ?? ''] ?? layer.group;
    const space = spaceForGroup(group);
    const setDepths = layers.filter((candidate) =>
      candidate.id !== layer.id && candidate.group === group && candidate.space === space)
      .map((candidate) => candidate.z);
    const spaceDepths = layers.filter((candidate) =>
      candidate.id !== layer.id && candidate.space === space)
      .map((candidate) => candidate.z);
    const z = setDepths.length
      ? Math.min(...setDepths) - 1
      : spaceDepths.length ? Math.min(...spaceDepths) - 1 : layer.z;
    patchLayer(layer.id, { group, space, z });
  };

  const moveLayer = (id: string, direction: 'forward' | 'backward') => {
    const active = layers.find((layer) => layer.id === id);
    if (!active) return;
    const depths = layers.filter((layer) => layer.space === active.space && layer.id !== id)
      .map((layer) => layer.z);
    if (!depths.length) return;
    patchLayer(id, { z: direction === 'forward' ? Math.max(...depths) + 1 : Math.min(...depths) - 1 });
  };

  const selectLayer = (layer: CinematicWorldLayer) => {
    setPopover(null);
    if (selectedLayer === layer.id) {
      onSelectLayer(undefined);
      return;
    }
    onSelectLayer(layer.id);
    const track = tracks.find((candidate) =>
      candidate.target.type === 'layer' && candidate.target.id === layer.id)
      ?? tracks.find((candidate) =>
        candidate.target.type === 'group' && candidate.target.id === layer.group);
    if (track) {
      const clip = resolveCinematicTrackClip(track, tracks);
      if (progress < clip.start || progress > clip.end) {
        onProgressChange((clip.enterEnd + clip.exitStart) / 2);
      }
    }
  };

  const patchTimingClip = (field: keyof CinematicSequenceClip, raw: number) => {
    if (!activeTimingTrack || !onTimingTrackChange) return;
    const value = Math.min(1, Math.max(0, raw));
    const clip = { ...activeTimingTrack.clip };
    if (field === 'start') clip.start = Math.min(value, clip.enterEnd);
    else if (field === 'enterEnd') clip.enterEnd = Math.max(clip.start, Math.min(value, clip.exitStart));
    else if (field === 'exitStart') clip.exitStart = Math.max(clip.enterEnd, Math.min(value, clip.end));
    else clip.end = Math.max(clip.exitStart, value);
    onTimingTrackChange(activeTimingTrack.id, { clip });
  };

  const stepBeat = (direction: -1 | 1) => {
    const next = beats[Math.min(beats.length - 1, Math.max(0, activeBeatIndex + direction))];
    if (next) onSelectBeat(next.id);
  };

  return (
    <div className={styles.panel}>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />

      {mode === 'scene' && (activeLayer || popover === 'add') && (
        <div className={styles.card} data-cinematic-card={popover ?? 'detail'}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>{popover === 'add' ? 'Add to scene' : activeLayer?.label}</span>
            <button
              className={styles.close}
              onClick={() => popover ? setPopover(null) : onSelectLayer(undefined)}
              aria-label="Close card"
            >×</button>
          </div>
          <div className={styles.cardBody}>
            {popover === 'add' ? (
              <div className={styles.addGrid}>
                <button type="button" className={styles.addTile} onClick={() => addLayer('text')}>
                  <Icon name="type" size={16} />
                  <span><strong>Text</strong><small>Literal copy or a dynamic token</small></span>
                </button>
                <button type="button" className={styles.addTile} onClick={() => addLayer('shape')}>
                  <Icon name="grid" size={16} />
                  <span><strong>Shape</strong><small>Rectangle or ellipse</small></span>
                </button>
                <button type="button" className={styles.addTile} disabled={!onUploadImage || uploading} onClick={() => chooseImage()}>
                  <Icon name="image" size={16} />
                  <span><strong>{uploading ? 'Uploading…' : 'Image'}</strong><small>Upload a prop or artwork</small></span>
                </button>
              </div>
            ) : activeLayer ? (
              <>
                <div className={styles.control} style={{ gridTemplateColumns: '52px 1fr' }}>
                  <span>Name</span>
                  <input className={styles.field} value={activeLayer.label}
                    onChange={(event) => patchLayer(activeLayer.id, { label: event.target.value })} />
                </div>

                {!shipped.has(activeLayer.id) && (
                  <div className={styles.control} style={{ gridTemplateColumns: '52px 1fr' }}>
                    <span>Set</span>
                    <select className={styles.field} value={activeLayer.group}
                      onChange={(event) => {
                        const group = event.target.value as CinematicLayerGroup;
                        patchLayer(activeLayer.id, { group, space: spaceForGroup(group) });
                      }}>
                      {GROUP_ORDER.filter((group) => group !== 'background').map((group) => (
                        <option key={group} value={group}>{GROUP_LABELS[group]}</option>
                      ))}
                    </select>
                  </div>
                )}

                {activeLayer.kind === 'text' && (
                  <>
                    <textarea className={styles.textarea} value={activeLayer.text ?? ''}
                      onChange={(event) => patchLayer(activeLayer.id, { text: event.target.value })}
                      placeholder="Type text…" />
                    <select className={styles.field} value="" onChange={(event) => {
                      if (!event.target.value) return;
                      patchLayer(activeLayer.id, { text: `${activeLayer.text ?? ''}{{${event.target.value}}}` });
                    }}>
                      <option value="">Insert token…</option>
                      {BINDING_TOKENS.map((binding) => (
                        <option key={binding.token} value={binding.token}>{binding.label}</option>
                      ))}
                    </select>
                    <div className={styles.twoColumn}>
                      <label className={styles.compactField}>
                        <span>Colour</span>
                        <input type="color" value={activeLayer.color ?? '#4a3a32'}
                          onChange={(event) => patchLayer(activeLayer.id, { color: event.target.value })} />
                      </label>
                      <label className={styles.compactField}>
                        <span>Align</span>
                        <select value={activeLayer.textAlign ?? 'center'}
                          onChange={(event) => patchLayer(activeLayer.id, { textAlign: event.target.value as CinematicWorldLayer['textAlign'] })}>
                          <option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option>
                        </select>
                      </label>
                    </div>
                    <div className={styles.control} style={{ gridTemplateColumns: '52px 1fr' }}>
                      <span>Font</span>
                      <select className={styles.field} value={activeLayer.fontFamily ?? ''}
                        onChange={(event) => patchLayer(activeLayer.id, { fontFamily: event.target.value || undefined })}>
                        <option value="">Template default</option>
                        {CURATED_FONTS.map((font) => <option key={font.key} value={font.key}>{font.label}</option>)}
                      </select>
                    </div>
                    <Slider label="Type size" value={activeLayer.fontSize ?? 4} min={1} max={14} step={0.25}
                      onChange={(value) => patchLayer(activeLayer.id, { fontSize: value })} />
                    <Slider label="Weight" value={activeLayer.fontWeight ?? 600} min={100} max={900} step={100}
                      onChange={(value) => patchLayer(activeLayer.id, { fontWeight: value })} />
                    <Slider label="Spacing" value={activeLayer.letterSpacing ?? 0} min={-0.1} max={0.5} step={0.01}
                      onChange={(value) => patchLayer(activeLayer.id, { letterSpacing: value })} />
                  </>
                )}

                {activeLayer.kind === 'shape' && (
                  <>
                    <div className={styles.twoColumn}>
                      <label className={styles.compactField}>
                        <span>Fill</span>
                        <input type="color" value={activeLayer.fill ?? '#c98a54'}
                          onChange={(event) => patchLayer(activeLayer.id, { fill: event.target.value })} />
                      </label>
                      <label className={styles.compactField}>
                        <span>Shape</span>
                        <select value={activeLayer.shape ?? 'rect'}
                          onChange={(event) => patchLayer(activeLayer.id, { shape: event.target.value as CinematicWorldLayer['shape'] })}>
                          <option value="rect">Rectangle</option><option value="ellipse">Ellipse</option>
                        </select>
                      </label>
                    </div>
                    {activeLayer.shape !== 'ellipse' && (
                      <Slider label="Corners" value={activeLayer.radius ?? 0} min={0} max={100} step={1}
                        onChange={(value) => patchLayer(activeLayer.id, { radius: value })} />
                    )}
                  </>
                )}

                {(activeLayer.kind ?? 'img') === 'img' && !shipped.has(activeLayer.id) && (
                  <div className={styles.imageActions}>
                    <button type="button" className={styles.replaceButton}
                      onClick={() => placeBehindCurrentSet(activeLayer)}>Place behind current set</button>
                    <button type="button" className={styles.replaceButton} disabled={!onUploadImage || uploading}
                      onClick={() => chooseImage(activeLayer.id)}>{uploading ? 'Uploading…' : 'Replace image'}</button>
                  </div>
                )}

                <div className={styles.control} style={{ gridTemplateColumns: '52px 1fr' }}>
                  <span>Space</span>
                  <select className={styles.field} value={activeLayer.space}
                    onChange={(event) => patchLayer(activeLayer.id, { space: event.target.value as CinematicWorldLayer['space'] })}>
                    <option value="world">Scene · moves with camera</option>
                    <option value="viewport">Screen · stays with viewer</option>
                  </select>
                </div>

                {activeLayer.locked ? (
                  <p className={styles.note}>Unlock this layer in the list to move or resize it.</p>
                ) : (
                  <>
                    <Slider label="X" value={activeLayer.x} min={-25} max={125} step={0.5}
                      onChange={(value) => patchLayer(activeLayer.id, { x: value })} />
                    <Slider label="Y" value={activeLayer.y} min={-25} max={125} step={0.5}
                      onChange={(value) => patchLayer(activeLayer.id, { y: value })} />
                    <Slider label="Width" value={activeLayer.w} min={3} max={200} step={0.5}
                      onChange={(value) => patchLayer(activeLayer.id, { w: value })} />
                    {activeLayer.h !== undefined && <Slider label="Height" value={activeLayer.h} min={3} max={200} step={0.5}
                      onChange={(value) => patchLayer(activeLayer.id, { h: value })} />}
                    <Slider label="Rotate" value={activeLayer.rotation} min={-180} max={180} step={1}
                      onChange={(value) => patchLayer(activeLayer.id, { rotation: value })} />
                    <Slider label="Opacity" value={activeLayer.opacity} min={0} max={1} step={0.05}
                      onChange={(value) => patchLayer(activeLayer.id, { opacity: value })} />
                    <Slider label="Depth" value={activeLayer.z} min={-10}
                      max={Math.max(40, ...layers.filter((layer) => layer.space === activeLayer.space).map((layer) => layer.z + 5))}
                      step={1} onChange={(value) => patchLayer(activeLayer.id, { z: value })} />
                    <div className={styles.actionRow}>
                      {(activeLayer.kind ?? 'img') === 'img' && <button type="button"
                        onClick={() => patchLayer(activeLayer.id, { flipX: !activeLayer.flipX })}>
                        {activeLayer.flipX ? '✓ Mirrored' : 'Mirror'}
                      </button>}
                      <button type="button" onClick={() => moveLayer(activeLayer.id, 'backward')}>Send to back</button>
                      <button type="button" onClick={() => moveLayer(activeLayer.id, 'forward')}>Bring to front</button>
                      {shipped.has(activeLayer.id)
                        ? <button type="button" onClick={() => onResetLayer(activeLayer.id)}>Reset prop</button>
                        : <button type="button" className={styles.dangerButton} onClick={() => removeLayer(activeLayer.id)}>Delete layer</button>}
                    </div>
                  </>
                )}

                <div className={styles.timingEditor}>
                  <strong>Appearance timing</strong>
                  {activeTimingTrack ? (
                    <>
                      <p className={styles.note}>Drag the four gold handles in the timeline, or enter exact story positions here.</p>
                      <div className={styles.timingGrid}>
                        {([
                          ['start', 'Starts'], ['enterEnd', 'Fully visible'],
                          ['exitStart', 'Leaves'], ['end', 'Hidden'],
                        ] as const).map(([field, label]) => (
                          <label key={field}>
                            <span>{label}</span>
                            <input type="number" min={0} max={100} step={.5}
                              value={Number((activeTimingTrack.clip[field] * 100).toFixed(1))}
                              onChange={(event) => patchTimingClip(field, Number(event.target.value) / 100)} />
                            <em>%</em>
                          </label>
                        ))}
                      </div>
                      <div className={styles.transitionGrid}>
                        {(['enter', 'exit'] as const).map((phase) => (
                          <div key={phase}>
                            <span>{phase === 'enter' ? 'Entrance' : 'Exit'}</span>
                            <select value={activeTimingTrack[phase].kind}
                              onChange={(event) => onTimingTrackChange?.(activeTimingTrack.id, {
                                [phase]: { ...activeTimingTrack[phase], kind: event.target.value as CinematicAssetTransition },
                              })}>
                              <option value="cut">Cut</option><option value="fade">Fade</option>
                              <option value="slide">Slide</option><option value="scale">Scale</option>
                              <option value="fade-slide">Fade + slide</option>
                            </select>
                            <select value={activeTimingTrack[phase].easing}
                              onChange={(event) => onTimingTrackChange?.(activeTimingTrack.id, {
                                [phase]: { ...activeTimingTrack[phase], easing: event.target.value as CinematicEasing },
                              })}>
                              <option value="linear">Linear</option><option value="ease-in">Ease in</option>
                              <option value="ease-out">Ease out</option><option value="ease-in-out">Ease in / out</option>
                            </select>
                          </div>
                        ))}
                      </div>
                      <button type="button" className={styles.timingLinkButton}
                        onClick={() => onRelinkTiming?.(activeLayer.id)}>
                        {inheritedTimingTrack ? `Follow ${inheritedTimingTrack.label} again` : 'Return to always visible'}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className={styles.note}>
                        {inheritedTimingTrack
                          ? `Following ${inheritedTimingTrack.label}. Changes to that set affect this asset too.`
                          : 'Always visible. Give this asset its own timing to animate it independently.'}
                      </p>
                      <button type="button" className={styles.timingLinkButton}
                        onClick={() => onMakeTimingIndependent?.(activeLayer.id)}>Edit separately</button>
                    </>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      <div className={styles.header}>
        <span className={styles.title}>Cinematic · {breakpoint}</span>
        <button className={styles.close} onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className={styles.body}>
        <div className={styles.label}>Editing mode</div>
        <div className={styles.modeSwitch}>
          <button
            type="button"
            className={`${styles.modeButton} ${mode === 'scene' ? styles.modeActive : ''}`}
            onClick={() => onModeChange('scene')}
          >
            Scene
          </button>
          <button
            type="button"
            className={`${styles.modeButton} ${mode !== 'scene' ? styles.modeActive : ''}`}
            onClick={() => onModeChange(mode === 'camera-beat' ? 'camera-beat' : 'camera-compose')}
          >
            Camera
          </button>
        </div>
        <p className={styles.modeNote}>
          {mode === 'scene'
            ? 'Scene mode will move the physical artwork without changing the camera.'
            : 'Camera mode changes the viewer’s framing without moving the physical artwork.'}
        </p>

        {mode !== 'scene' && camera && (
          <div className={`${styles.cameraEditor} ${mode === 'camera-compose' ? styles.cameraCompose : ''}`}>
            <div className={styles.cameraModeSwitch}>
              <button type="button" className={mode === 'camera-compose' ? styles.cameraModeActive : ''}
                onClick={() => onModeChange('camera-compose')}>Compose</button>
              <button type="button" className={mode === 'camera-beat' ? styles.cameraModeActive : ''}
                onClick={() => onModeChange('camera-beat')}>Edit beat</button>
            </div>
            <strong>{mode === 'camera-compose' ? 'Compose camera' : activeBeat?.label}</strong>
            <p className={styles.note}>
              {mode === 'camera-compose'
                ? 'Explore freely at the current playhead. Nothing is committed until you set it as a beat.'
                : 'Editing this saved beat. Drag the preview to pan; use the wheel or trackpad to zoom.'}
            </p>
            <Slider label="Pan X" value={camera.x} min={-100} max={100} step={0.5}
              onChange={(value) => onCameraChange({ x: value })} />
            <Slider label="Pan Y" value={camera.y} min={-100} max={100} step={0.5}
              onChange={(value) => onCameraChange({ y: value })} />
            <Slider label="Zoom" value={camera.scale} min={0.3} max={4} step={0.01}
              onChange={(value) => onCameraChange({ scale: value })} />
            <Slider label="Rotate" value={camera.rotate} min={-15} max={15} step={0.1}
              onChange={(value) => onCameraChange({ rotate: value })} />
            {mode === 'camera-compose' ? (
              <div className={styles.composeCommit}>
                <label>
                  <span>Beat name</span>
                  <input value={newBeatName} onChange={(event) => setNewBeatName(event.target.value)} />
                </label>
                <button type="button" onClick={() => onCreateBeat?.(newBeatName)}>Set as beat</button>
              </div>
            ) : activeBeat ? (
              <>
                <div className={styles.beatProperties}>
                  <label>
                    <span>Name</span>
                    <input value={beatName} onChange={(event) => setBeatName(event.target.value)}
                      onBlur={() => beatName.trim() && beatName.trim() !== activeBeat.label &&
                        onRenameBeat?.(activeBeat.id, beatName.trim())} />
                  </label>
                  <label>
                    <span>Transition in</span>
                    <select value={activeBeat.transitionIn}
                      onChange={(event) => onTransitionChange?.(
                        activeBeat.id, event.target.value as CinematicCameraTransition,
                      )}>
                      <option value="cut">Cut</option>
                      <option value="linear">Linear</option>
                      <option value="ease-in">Ease in</option>
                      <option value="ease-out">Ease out</option>
                      <option value="ease-in-out">Ease in / out</option>
                      <option value="hold">Hold, then move</option>
                    </select>
                  </label>
                </div>
                <div className={styles.cameraActions}>
                  <button type="button" onClick={onResetCamera}>Reset camera</button>
                  <button type="button" onClick={onCopyCameraToOther}>
                    Copy to {breakpoint === 'mobile' ? 'desktop' : 'mobile'}
                  </button>
                  <button type="button" onClick={() => onDuplicateBeat?.(activeBeat.id)}>Duplicate beat</button>
                  {isShippedBeat && <button type="button" onClick={() => onResetBeat?.(activeBeat.id)}>Reset beat</button>}
                  {deleteConfirmBeat === activeBeat.id ? (
                    <div className={styles.deleteMomentConfirm} role="alert">
                      <p>
                        Removes this camera beat{ownedTracks.length
                          ? ` and ${ownedTracks.length} owned timeline ${ownedTracks.length === 1 ? 'item' : 'items'}`
                          : ''}. Shared scenery stays in the story.
                      </p>
                      <div>
                        <button type="button" onClick={() => setDeleteConfirmBeat(undefined)}>Cancel</button>
                        <button type="button" className={styles.deleteBeat}
                          onClick={() => {
                            setDeleteConfirmBeat(undefined);
                            onDeleteBeat?.(activeBeat.id);
                          }}>Confirm delete moment</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" className={styles.deleteBeat}
                      disabled={beats.length <= 1}
                      onClick={() => setDeleteConfirmBeat(activeBeat.id)}>Delete moment</button>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}

        {mode === 'scene' && (
          <>
            <div className={styles.label}>Scene layers · front to back</div>
            <div className={styles.layers}>
              {groupedLayers.map(({ group, layers: groupLayers, visibility }) => {
                const visibleNow = !visibility || cinematicSetOpacity(progress, visibility) > 0.08;
                return (
                  <section key={group} className={styles.layerGroup}>
                    <div className={styles.layerGroupHeader}>
                      <span className={`${styles.setDot} ${visibleNow ? styles.setDotActive : ''}`} />
                      <span>{GROUP_LABELS[group]}</span>
                      <small>{groupLayers.length}</small>
                    </div>
                    {groupLayers.map((layer) => (
                      <div
                        key={layer.id}
                        className={`${styles.layerRow} ${layer.id === selectedLayer ? styles.layerRowActive : ''}`}
                      >
                        <button type="button" className={styles.layerName} onClick={() => selectLayer(layer)}>
                          {layer.label}
                        </button>
                        <button type="button" className={styles.iconButton}
                          aria-label={`${layer.hidden ? 'Show' : 'Hide'} ${layer.label}`}
                          onClick={() => patchLayer(layer.id, { hidden: !layer.hidden })}>
                          {layer.hidden ? '○' : '●'}
                        </button>
                        <button type="button" className={styles.iconButton}
                          aria-label={`${layer.locked ? 'Unlock' : 'Lock'} ${layer.label}`}
                          onClick={() => patchLayer(layer.id, { locked: !layer.locked })}>
                          {layer.locked ? '⌕' : '⌁'}
                        </button>
                      </div>
                    ))}
                  </section>
                );
              })}
            </div>

            <button
              type="button"
              className={`${styles.addButton} ${popover === 'add' ? styles.addButtonActive : ''}`}
              onClick={() => {
                onSelectLayer(undefined);
                setPopover((value) => value === 'add' ? null : 'add');
              }}
              aria-label="Add to scene"
              aria-pressed={popover === 'add'}
            >
              <Icon name="plus" size={16} />
            </button>
          </>
        )}

        <div className={styles.label}>Cinematic beats</div>
        <div className={styles.beatStepper}>
          <button type="button" onClick={() => stepBeat(-1)} disabled={activeBeatIndex === 0}>← Previous</button>
          <span>{activeBeatIndex + 1} of {beats.length}</span>
          <button type="button" onClick={() => stepBeat(1)} disabled={activeBeatIndex === beats.length - 1}>Next →</button>
        </div>
        <div className={styles.beats}>
          {beats.map((beat, index) => (
            <button
              type="button"
              key={beat.id}
              className={`${styles.beatButton} ${beat.id === activeBeat?.id ? styles.beatActive : ''}`}
              onClick={() => onSelectBeat(beat.id)}
            >
              <span className={styles.beatNumber}>{String(index + 1).padStart(2, '0')}</span>
              <span>{beat.label}</span>
              <span className={styles.beatProgress}>{Math.round(beat.progress * 100)}%</span>
            </button>
          ))}
        </div>

        <div className={styles.label}>Reference overlay</div>
        {activeBeat?.referenceSrc ? (
          <div className={styles.referenceCard}>
            <img className={styles.referencePreview} src={activeBeat.referenceSrc} alt="" />
            <div className={styles.referenceControls}>
              <div className={styles.referenceTop}>
                <span className={styles.referenceName}>{activeBeat.referenceLabel ?? 'Composition reference'}</span>
                <button
                  type="button"
                  className={`${styles.referenceToggle} ${referenceVisible ? styles.referenceToggleActive : ''}`}
                  onClick={() => onReferenceVisibleChange(!referenceVisible)}
                >
                  {referenceVisible ? 'Visible' : 'Hidden'}
                </button>
              </div>
              <div className={styles.rangeRow}>
                <input
                  type="range"
                  min={0.05}
                  max={0.9}
                  step={0.05}
                  value={referenceOpacity}
                  disabled={!referenceVisible}
                  onChange={(event) => onReferenceOpacityChange(Number(event.target.value))}
                  aria-label="Reference overlay opacity"
                />
                <span className={styles.rangeValue}>{Math.round(referenceOpacity * 100)}%</span>
              </div>
            </div>
          </div>
        ) : (
          <p className={styles.note}>This beat has no reference image.</p>
        )}

        <div className={styles.phaseNotice}>
          Scene and camera edits are stored independently. The timeline interpolates smoothly
          between camera beats and reverses naturally when a guest scrolls upward.
          <button type="button" className={styles.resetButton} onClick={onResetWorld}>Reset scene layout</button>
          <button type="button" className={styles.resetButton} onClick={onResetVisibility}>Reset set timing</button>
        </div>
      </div>
    </div>
  );
}
