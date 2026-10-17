'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { Breakpoint } from '../types';
import type { CinematicBeat, CinematicEditorMode } from './registry';
import type { CinematicLayerGroup, CinematicWorldGeometry, CinematicWorldLayer } from './world';
import { cinematicAncestors, cinematicDescendantIds, cinematicLayerTree } from './parts';
import type { CameraState } from './useCinematicScroll';
import {
  resolveCinematicLayerTiming, resolveCinematicTrackClip,
  type CinematicAssetTransition, type CinematicCameraTransition,
  type CinematicEasing, type CinematicSequenceClip, type CinematicSequenceTrack,
  type CinematicSlideDirection,
} from './sequence';
import { cinematicSetOpacity, type CinematicVisibilitySet } from './visibility';
import type { CinematicSceneSet } from './sceneSets';
import type { SceneSetAction } from './sceneSetEditing';
import SceneSetManager from './SceneSetManager';
import AssetAnimationEditor from './AssetAnimationEditor';
import DirectorSettings from './DirectorSettings';
import CinematicRichText from './CinematicRichText';
import { CINEMATIC_FUNCTIONS } from './functionalLayers';
import type { CinematicDirection } from './direction';
import { BINDING_TOKENS } from '../bindings';
import { CURATED_FONTS } from '@/lib/fonts/registry';
import { Icon } from '@/components/ui/Icon';
import styles from './CinematicAdjustPanel.module.css';

interface Props {
  beats: CinematicBeat[];
  deletedBeats?: CinematicBeat[];
  breakpoint: Breakpoint;
  selectedBeat: string;
  progress: number;
  mode: CinematicEditorMode;
  referenceVisible: boolean;
  referenceOpacity: number;
  direction?: CinematicDirection;
  onDirectionChange?: (direction: CinematicDirection) => void;
  onAddEffectTrack?: (id: string, label: string) => void;
  onReferenceChange?: (patch: { referenceSrc?: string; referenceLabel?: string; referenceFit?: 'contain' | 'cover' | 'fill'; referenceOpacity?: number }) => void;
  layers: CinematicWorldLayer[];
  sceneSets?: CinematicSceneSet[];
  onSceneSetAction?: (action: SceneSetAction) => void;
  selectedLayer?: string;
  camera?: CameraState & { id?: string };
  visibilitySets: CinematicVisibilitySet[];
  tracks?: CinematicSequenceTrack[];
  selectedTimingTrack?: string;
  timingSelectionRequest?: number;
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
  onResetTrack?: (id: string) => void;
  onMakeTimingIndependent?: (layerId: string) => void;
  onRelinkTiming?: (layerId: string, sourceTrackId?: string) => void;
  onCreateTimingSet?: (label: string, layerIds: string[]) => string | undefined;
  onRenameTimingSet?: (id: string, label: string) => void;
  onDuplicateTimingSet?: (id: string) => string | undefined;
  onDeleteTimingSet?: (id: string) => void;
  onSelectTimingTrack?: (id: string | undefined) => void;
  onCreateBeat?: (label: string) => void;
  onRenameBeat?: (id: string, label: string) => void;
  onDuplicateBeat?: (id: string) => void;
  onDeleteBeat?: (id: string) => void;
  onRestoreBeat?: (id: string) => void;
  onTransitionChange?: (id: string, transition: CinematicCameraTransition) => void;
  onResetBeat?: (id: string) => void;
  shippedBeatIds?: string[];
  onResetCamera: () => void;
  onCopyCameraToOther: () => void;
  onVisibilityChange: (sets: CinematicVisibilitySet[]) => void;
  onResetVisibility: () => void;
  onResetSequence?: () => void;
  onUploadImage?: (file: File) => Promise<string>;
  shippedLayerIds: string[];
  onClose: () => void;
}

function ownedTrackImpact(track: CinematicSequenceTrack): string {
  if (track.kind === 'interaction' || track.target.type === 'interaction') return 'interaction entry point';
  if (track.kind === 'text' || track.target.type === 'narrative') return 'text and details';
  if (track.kind === 'effect' || track.target.type === 'effect') return 'effect';
  return 'exclusive artwork or set';
}

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

type TransitionPhase = 'enter' | 'exit';

function TransitionEditor({ phase, track, onChange, onPreview }: {
  phase: TransitionPhase;
  track: CinematicSequenceTrack;
  onChange?: (id: string, patch: Partial<CinematicSequenceTrack>) => void;
  onPreview?: (track: CinematicSequenceTrack, phase: TransitionPhase) => void;
}) {
  const transition = track[phase];
  const slides = transition.kind === 'slide' || transition.kind === 'fade-slide';
  const scales = transition.kind === 'scale';
  const direction = transition.direction ?? (phase === 'enter' ? 'right' : 'left');
  const distance = transition.distance ?? 6;
  const endpointScale = transition.scale ?? .86;
  const phaseLabel = phase === 'enter' ? 'Entrance' : 'Exit';
  const patch = (next: Partial<typeof transition>) => onChange?.(track.id, {
    [phase]: { ...transition, ...next },
  });
  const transitionSpan = phase === 'enter'
    ? track.clip.enterEnd - track.clip.start
    : track.clip.end - track.clip.exitStart;

  return (
    <section className={styles.transitionCard} aria-label={`${phaseLabel} transition`}>
      <div className={styles.transitionHeader}>
        <div>
          <strong>{phaseLabel}</strong>
          <span>{phase === 'enter' ? 'How it arrives' : 'How it leaves'}</span>
        </div>
        <button type="button" disabled={transitionSpan <= 0}
          onClick={() => onPreview?.(track, phase)}>
          Preview
        </button>
      </div>
      <div className={styles.transitionFields}>
        <label>
          <span>Motion</span>
          <select value={transition.kind} aria-label={`${phase} transition for ${track.label}`}
            onChange={(event) => patch({ kind: event.target.value as CinematicAssetTransition })}>
            <option value="cut">Cut</option>
            <option value="fade">Fade</option>
            <option value="slide">Slide</option>
            <option value="scale">Scale</option>
            <option value="fade-slide">Fade + slide</option>
          </select>
        </label>
        {transition.kind !== 'cut' && (
          <label>
            <span>Pacing</span>
            <select value={transition.easing} aria-label={`${phase} easing for ${track.label}`}
              onChange={(event) => patch({ easing: event.target.value as CinematicEasing })}>
              <option value="linear">Linear</option>
              <option value="ease-in">Ease in</option>
              <option value="ease-out">Ease out</option>
              <option value="ease-in-out">Ease in / out</option>
            </select>
          </label>
        )}
        {slides && (
          <>
            <label>
              <span>{phase === 'enter' ? 'From' : 'Toward'}</span>
              <select value={direction} aria-label={`${phase} direction for ${track.label}`}
                onChange={(event) => patch({ direction: event.target.value as CinematicSlideDirection })}>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="up">Top</option>
                <option value="down">Bottom</option>
              </select>
            </label>
            <label className={styles.transitionStrength}>
              <span>Distance</span>
              <input type="range" min={0} max={50} step={1} value={distance}
                aria-label={`${phase} distance for ${track.label}`}
                onChange={(event) => patch({ distance: Number(event.target.value) })} />
              <output>{Math.round(distance)}%</output>
            </label>
          </>
        )}
        {scales && (
          <label className={styles.transitionStrength}>
            <span>{phase === 'enter' ? 'Starts at' : 'Ends at'}</span>
            <input type="range" min={10} max={200} step={1} value={Math.round(endpointScale * 100)}
              aria-label={`${phase} scale for ${track.label}`}
              onChange={(event) => patch({ scale: Number(event.target.value) / 100 })} />
            <output>{Math.round(endpointScale * 100)}%</output>
          </label>
        )}
        {transition.kind === 'cut' && (
          <p className={styles.transitionHint}>Appears instantly at the clip boundary.</p>
        )}
      </div>
    </section>
  );
}

function TimingTrackEditor({ track, onChange, onPreview, help }: {
  track: CinematicSequenceTrack;
  onChange?: (id: string, patch: Partial<CinematicSequenceTrack>) => void;
  onPreview?: (track: CinematicSequenceTrack, phase: TransitionPhase) => void;
  help?: string;
}) {
  const availability = track.kind === 'interaction';
  const patchClip = (field: keyof CinematicSequenceClip, raw: number) => {
    if (!onChange) return;
    const value = Math.min(1, Math.max(0, raw));
    const clip = { ...track.clip };
    if (field === 'start' && availability) {
      clip.start = Math.min(value, clip.end);
      clip.enterEnd = clip.start;
    } else if (field === 'end' && availability) {
      clip.end = Math.max(clip.start, value);
      clip.exitStart = clip.end;
    } else if (field === 'start') clip.start = Math.min(value, clip.enterEnd);
    else if (field === 'enterEnd') clip.enterEnd = Math.max(clip.start, Math.min(value, clip.exitStart));
    else if (field === 'exitStart') clip.exitStart = Math.max(clip.enterEnd, Math.min(value, clip.end));
    else clip.end = Math.max(clip.exitStart, value);
    onChange(track.id, { clip });
  };
  return (
    <>
      {help && <p className={styles.note}>{help}</p>}
      <details className={styles.advancedTiming}>
        <summary>{availability ? 'Availability values' : 'Advanced timing values'}</summary>
        <p>{availability
          ? 'This range controls when guests may click. Time spent inside the open form is not added to the timeline.'
          : 'Use these exact story percentages when timeline dragging is not precise enough.'}</p>
        <div className={styles.timingGrid}>
          {(availability
            ? ([['start', 'Available from'], ['end', 'Available until']] as const)
            : ([
                ['start', 'Starts'], ['enterEnd', 'Fully visible'],
                ['exitStart', 'Leaves'], ['end', 'Hidden'],
              ] as const)).map(([field, label]) => (
            <label key={field}>
              <span>{label}</span>
              <input type="number" min={0} max={100} step={.5}
                aria-label={`${label} for ${track.label}`}
                value={Number((track.clip[field] * 100).toFixed(1))}
                onChange={(event) => patchClip(field, Number(event.target.value) / 100)} />
              <em>%</em>
            </label>
          ))}
        </div>
      </details>
      {track.kind === 'effect' && <p className={styles.note}>This track sets the effect’s scroll range. Edit its movement, blur and easing in Story settings → Effects.</p>}
      {!availability && track.kind !== 'effect' && (
        <div className={styles.transitionGrid}>
          <TransitionEditor phase="enter" track={track} onChange={onChange} onPreview={onPreview} />
          <TransitionEditor phase="exit" track={track} onChange={onChange} onPreview={onPreview} />
        </div>
      )}
    </>
  );
}

export default function CinematicAdjustPanel({
  beats, deletedBeats = [], breakpoint, selectedBeat, progress, mode, referenceVisible, referenceOpacity,
  direction, onDirectionChange, onAddEffectTrack, onReferenceChange,
  layers, sceneSets, onSceneSetAction, selectedLayer, selectedTimingTrack, timingSelectionRequest,
  camera, visibilitySets, tracks = [],
  onSelectBeat, onProgressChange, onModeChange, onReferenceVisibleChange,
  onReferenceOpacityChange, onSelectLayer, onLayersChange, onResetWorld,
  onResetLayer,
  onCameraChange, onResetCamera, onCopyCameraToOther,
  onTimingTrackChange, onResetTrack, onMakeTimingIndependent, onRelinkTiming,
  onCreateTimingSet, onRenameTimingSet, onDuplicateTimingSet, onDeleteTimingSet,
  onSelectTimingTrack,
  onCreateBeat, onRenameBeat, onDuplicateBeat, onDeleteBeat, onRestoreBeat,
  onTransitionChange, onResetBeat, shippedBeatIds = [],
  onResetVisibility, onResetSequence, onUploadImage, shippedLayerIds, onClose,
}: Props) {
  const [popover, setPopover] = useState<'add' | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'editing' | 'advanced'>('editing');
  useEffect(() => { if (selectedTimingTrack || selectedLayer) setSidebarTab('editing'); }, [selectedTimingTrack, selectedLayer, timingSelectionRequest]);
  const [uploading, setUploading] = useState(false);
  const [newBeatName, setNewBeatName] = useState('New camera beat');
  const [beatName, setBeatName] = useState('');
  const [deleteConfirmBeat, setDeleteConfirmBeat] = useState<string>();
  const [timingSelectionMode, setTimingSelectionMode] = useState(false);
  const [selectedTimingLayers, setSelectedTimingLayers] = useState<string[]>([]);
  const [newTimingSetName, setNewTimingSetName] = useState('');
  const [selectedTimingSetId, setSelectedTimingSetId] = useState<string>();
  const [deleteConfirmSet, setDeleteConfirmSet] = useState<string>();
  const [resetSequenceConfirm, setResetSequenceConfirm] = useState(false);
  const [selectedSceneSet, setSelectedSceneSet] = useState<string>();
  const [animationLayerId, setAnimationLayerId] = useState<string>();
  const [collapsedLayers, setCollapsedLayers] = useState<Set<string>>(new Set());
  useEffect(() => {
    const selected = layers.find((layer) => layer.id === selectedLayer);
    if (selected) setCollapsedLayers((current) => new Set([...current].filter((id) =>
      !cinematicAncestors(selected, layers).some((parent) => parent.id === id))));
  }, [selectedLayer, layers]);
  const fileRef = useRef<HTMLInputElement>(null);
  const referenceFileRef = useRef<HTMLInputElement>(null);
  const replaceLayerRef = useRef<string | null>(null);
  const customLayerCounter = useRef(0);
  const transitionPreviewRef = useRef(0);
  const shipped = new Set(shippedLayerIds);
  const activeBeat = beats.find((beat) => beat.id === selectedBeat) ?? beats[0];
  const activeLayer = layers.find((layer) => layer.id === selectedLayer);
  const frontToBack = [...layers].sort((a, b) => b.z - a.z);
  const activeTiming = activeLayer
    ? resolveCinematicLayerTiming(activeLayer.id, activeLayer.group, tracks, activeLayer.timingTrackId, layers)
    : undefined;
  const activeTimingTrack = activeTiming?.status === 'independent' ? activeTiming.exact : undefined;
  const inheritedTimingTrack = activeTiming?.inherited;
  const effectiveTimingSource = activeTiming?.source;
  const customTimingSets = tracks.filter((track) =>
    track.kind === 'set' && track.target.type === 'set');
  const selectedTimingSet = tracks.find((track) => track.id === selectedTimingSetId &&
    track.target.type !== 'layer');
  const timingSetLayers = selectedTimingSet?.target.type === 'group'
    ? layers.filter((layer) => layer.group === selectedTimingSet.target.id) : [];
  const timingSetAnimationLayer = timingSetLayers.find((layer) => layer.id === animationLayerId) ?? timingSetLayers.find((layer) => !layer.parentId) ?? timingSetLayers[0];
  const availableSets = sceneSets ?? [...new Set(layers.map((layer) => layer.group))].map((id, z) => ({
    id, label: id, z, space: layers.find((layer) => layer.group === id)!.space,
    hidden: false, locked: false, system: false, opacity: 1,
  }));
  const setById = new Map(availableSets.map((set) => [set.id, set]));
  const spaceForGroup = (group: string) => setById.get(group)?.space ?? 'world';
  const currentSet = availableSets.find((set) => set.id === selectedSceneSet && !set.locked) ??
    availableSets.find((set) => !set.locked && tracks.some((track) =>
      track.target.type === 'group' && track.target.id === set.id &&
      track.ownership.kind === 'beat' && track.ownership.beatId === activeBeat?.id)) ??
    availableSets.find((set) => !set.locked && !set.system && visibilitySets.some((visibility) =>
      visibility.group === set.id && cinematicSetOpacity(progress, visibility) > .5)) ??
    availableSets.find((set) => !set.locked && !set.system);
  const groupedLayers = [...availableSets].sort((a, b) => a.z - b.z).map((set) => ({
    group: set.id,
    layers: frontToBack.filter((layer) => layer.group === set.id),
    visibility: visibilitySets.find((visibility) => visibility.group === set.id),
  })).filter((entry) => entry.layers.length > 0);
  const activeBeatIndex = Math.max(0, beats.findIndex((beat) => beat.id === activeBeat?.id));
  const isShippedBeat = Boolean(activeBeat && shippedBeatIds.includes(activeBeat.id));
  const ownedTracks = activeBeat ? tracks.filter((track) =>
    track.ownership.kind === 'beat' && track.ownership.beatId === activeBeat.id) : [];
  const removesInteraction = ownedTracks.some((track) =>
    track.kind === 'interaction' || track.target.type === 'interaction' ||
    (track.target.type === 'group' && ['rsvp', 'wishes', 'memory'].includes(track.target.id)));

  useEffect(() => setBeatName(activeBeat?.label ?? ''), [activeBeat?.id, activeBeat?.label]);
  useEffect(() => setDeleteConfirmBeat(undefined), [activeBeat?.id]);
  useEffect(() => setSelectedTimingSetId(selectedTimingTrack), [selectedTimingTrack]);
  useEffect(() => {
    if (selectedTimingSetId && !tracks.some((track) => track.id === selectedTimingSetId)) {
      setSelectedTimingSetId(undefined);
      setDeleteConfirmSet(undefined);
    }
  }, [selectedTimingSetId, tracks]);
  useEffect(() => () => {
    if (transitionPreviewRef.current) cancelAnimationFrame(transitionPreviewRef.current);
  }, []);

  const previewTrackTransition = (track: CinematicSequenceTrack, phase: TransitionPhase) => {
    if (transitionPreviewRef.current) cancelAnimationFrame(transitionPreviewRef.current);
    const from = phase === 'enter' ? track.clip.start : track.clip.exitStart;
    const to = phase === 'enter' ? track.clip.enterEnd : track.clip.end;
    onProgressChange(from);
    if (to <= from) {
      onProgressChange(to);
      return;
    }
    const duration = 850;
    let startedAt: number | undefined;
    const tick = (now: number) => {
      startedAt ??= now;
      const amount = Math.min(1, (now - startedAt) / duration);
      onProgressChange(from + (to - from) * amount);
      if (amount < 1) transitionPreviewRef.current = requestAnimationFrame(tick);
      else transitionPreviewRef.current = 0;
    };
    transitionPreviewRef.current = requestAnimationFrame(tick);
  };

  const patchLayer = (id: string, patch: Partial<CinematicWorldGeometry>) => {
    if (setById.get(layers.find((layer) => layer.id === id)?.group ?? '')?.locked) return;
    const target = layers.find((layer) => layer.id === id);
    if (target && cinematicAncestors(target, layers).some((parent) => parent.locked)) return;
    onLayersChange(layers.map((layer) => layer.id === id ? { ...layer, ...patch } : layer));
  };

  const nextCustomId = () => {
    let id = '';
    do {
      id = `custom-cinematic-${customLayerCounter.current++}`;
    } while (layers.some((layer) => layer.id === id));
    return id;
  };

  const addLayer = (kind: 'text' | 'shape' | 'img' | 'functional', src?: string) => {
    const id = nextCustomId();
    if (!currentSet) return;
    const group = currentSet.id;
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
      behavior: kind === 'functional' ? 'narrative' : undefined,
      contentKey: kind === 'functional' ? 'custom' : undefined,
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
    if (shipped.has(id) || setById.get(layers.find((layer) => layer.id === id)?.group ?? '')?.locked) return;
    const removed = cinematicDescendantIds(id, layers);
    onLayersChange(layers.filter((layer) => !removed.has(layer.id)));
    onSelectLayer(undefined);
  };

  const placeBehindCurrentSet = (layer: CinematicWorldLayer) => {
    const group = currentSet?.id ?? layer.group;
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
    if (onSceneSetAction && group !== layer.group) onSceneSetAction({ type: 'move-layer', layerId: layer.id, setId: group });
    patchLayer(layer.id, { group, space, z });
  };

  const moveLayer = (id: string, direction: 'forward' | 'backward') => {
    const active = layers.find((layer) => layer.id === id);
    if (!active) return;
    const depths = layers.filter((layer) => layer.space === active.space && layer.parentId === active.parentId && layer.id !== id)
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
    setSelectedTimingSetId(undefined);
    onSelectTimingTrack?.(undefined);
    onSelectLayer(layer.id);
    const timing = resolveCinematicLayerTiming(layer.id, layer.group, tracks, layer.timingTrackId, layers);
    const track = timing.exact ?? timing.inherited;
    if (track) {
      const clip = resolveCinematicTrackClip(track, tracks);
      if (progress < clip.start || progress > clip.end) {
        onProgressChange((clip.enterEnd + clip.exitStart) / 2);
      }
    }
  };

  const toggleTimingLayer = (id: string) => {
    setSelectedTimingLayers((current) => current.includes(id)
      ? current.filter((candidate) => candidate !== id)
      : [...current, id]);
  };

  const cancelTimingSelection = () => {
    setTimingSelectionMode(false);
    setSelectedTimingLayers([]);
    setNewTimingSetName('');
  };

  const createTimingSet = () => {
    if (selectedTimingLayers.length < 2 || !onCreateTimingSet) return;
    const id = onCreateTimingSet(
      newTimingSetName.trim() || `Timing set ${customTimingSets.length + 1}`,
      selectedTimingLayers,
    );
    cancelTimingSelection();
    if (id) {
      setSelectedTimingSetId(id);
      onSelectTimingTrack?.(id);
    }
  };

  const timingSourceLabel = (layer: CinematicWorldLayer) => {
    const timing = resolveCinematicLayerTiming(layer.id, layer.group, tracks, layer.timingTrackId, layers);
    if (timing.status === 'independent') return 'Independent';
    return timing.source?.label ?? 'Always';
  };

  const linkedAssetCount = (trackId: string) => tracks.filter((track) =>
    track.target.type === 'layer' && track.timing.mode === 'linked' &&
    track.timing.trackId === trackId).length;

  const stepBeat = (direction: -1 | 1) => {
    const next = beats[Math.min(beats.length - 1, Math.max(0, activeBeatIndex + direction))];
    if (next) onSelectBeat(next.id);
  };

  return (
    <div className={styles.panel}>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
      <input ref={referenceFileRef} type="file" accept="image/*" hidden onChange={async (event) => {
        const file = event.target.files?.[0]; event.target.value = '';
        if (!file || !onUploadImage || !onReferenceChange) return;
        setUploading(true);
        try { const referenceSrc = await onUploadImage(file); onReferenceChange({ referenceSrc, referenceLabel: file.name }); }
        catch { window.alert('Could not upload reference image. Please try again.'); }
        finally { setUploading(false); }
      }} />

      {sidebarTab === 'editing' && mode === 'scene' && (activeLayer || popover === 'add') && (
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
                <button type="button" className={styles.addTile} onClick={() => addLayer('functional')}>
                  <Icon name="type" size={16} /><span><strong>Narrative</strong><small>Rich text, people details or invitation copy</small></span>
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

                {(
                  <div className={styles.control} style={{ gridTemplateColumns: '52px 1fr' }}>
                    <span>Set</span>
                    <select aria-label="Scene set" className={styles.field} value={activeLayer.group} disabled={Boolean(activeLayer.parentId) || setById.get(activeLayer.group)?.locked}
                      onChange={(event) => {
                        const group = event.target.value as CinematicLayerGroup;
                        if (onSceneSetAction) onSceneSetAction({ type: 'move-layer', layerId: activeLayer.id, setId: group });
                        else patchLayer(activeLayer.id, { group, space: spaceForGroup(group) });
                      }}>
                      {availableSets.map((set) => (
                        <option key={set.id} value={set.id} disabled={set.locked && set.id !== activeLayer.group}>{set.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {activeLayer.parentId && <p className={styles.note}>Inside {layers.find((layer) => layer.id === activeLayer.parentId)?.label}. Position offsets and scale are local to its original responsive slot. Parent movement, visibility and timing are inherited. Blank text uses live event content.</p>}
                {!activeLayer.parentId && <label className={styles.compactField}>Function
                  <select aria-label="Layer function" value={activeLayer.behavior || 'artwork'} onChange={(event) =>
                    patchLayer(activeLayer.id, { behavior: event.target.value, kind: event.target.value === 'artwork' ? (activeLayer.src ? 'img' : 'text') : 'functional' })}>
                    {CINEMATIC_FUNCTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>}
                {activeLayer.behavior === 'narrative' && <>
                  <label className={styles.compactField}>Content binding<select aria-label="Narrative binding" value={activeLayer.contentKey || 'custom'}
                    onChange={(event) => patchLayer(activeLayer.id, { contentKey: event.target.value })}>
                    <option value="walimah">Walimah invitation</option><option value="primary">Primary person / groom</option>
                    <option value="secondary">Secondary person / bride</option><option value="honoree">Honoree</option><option value="custom">Custom text</option>
                  </select></label>
                  <label className={styles.compactField}>Title override<input aria-label="Narrative title" value={activeLayer.title || ''}
                    placeholder="Use bound title" onChange={(event) => patchLayer(activeLayer.id, { title: event.target.value })} /></label>
                  <CinematicRichText value={activeLayer.text || ''} onChange={(text) => patchLayer(activeLayer.id, { text })} />
                  <p className={styles.note}>Blank copy uses the event’s editable details. Custom copy supports the tokens below.</p>
                  <select className={styles.field} aria-label="Insert narrative token" value="" onChange={(event) => {
                    if (event.target.value) patchLayer(activeLayer.id, { text: `${activeLayer.text || ''}<p>{{${event.target.value}}}</p>` });
                  }}><option value="">Insert token…</option>{BINDING_TOKENS.map((binding) => <option key={binding.token} value={binding.token}>{binding.label}</option>)}</select>
                  <Slider label="Title size" value={activeLayer.titleSize ?? direction?.theme.titleSize ?? 9} min={1} max={20} step={.25}
                    onChange={(titleSize) => patchLayer(activeLayer.id, { titleSize })} />
                  <Slider label="Body size" value={activeLayer.fontSize ?? direction?.theme.bodySize ?? 2} min={1} max={10} step={.1}
                    onChange={(fontSize) => patchLayer(activeLayer.id, { fontSize })} />
                  <label className={styles.compactField}>Font<select value={activeLayer.fontFamily || ''} onChange={(event) => patchLayer(activeLayer.id, { fontFamily: event.target.value })}>
                    <option value="">Story theme</option>{CURATED_FONTS.map((font) => <option key={font.key} value={font.key}>{font.label}</option>)}
                  </select></label>
                  <label className={styles.compactField}>Alignment<select value={activeLayer.textAlign ?? 'center'} onChange={(event) => patchLayer(activeLayer.id, { textAlign: event.target.value as CinematicWorldLayer['textAlign'] })}>
                    <option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option>
                  </select></label>
                  <Slider label="Leading" value={activeLayer.lineHeight ?? 1.45} min={.8} max={3} step={.05} onChange={(lineHeight) => patchLayer(activeLayer.id, { lineHeight })} />
                  <label className={styles.compactField}>Colour<input type="color" value={activeLayer.color || direction?.theme.ink || '#4a3a32'} onChange={(event) => patchLayer(activeLayer.id, { color: event.target.value })} /></label>
                </>}
                {activeLayer.behavior && activeLayer.behavior !== 'artwork' && activeLayer.behavior !== 'narrative' && <label className={styles.compactField}>
                  Label override<input value={activeLayer.title || ''} onChange={(event) => patchLayer(activeLayer.id, { title: event.target.value })} />
                </label>}
                {activeLayer.kind === 'text' && (
                  <>
                    <textarea className={styles.textarea} aria-label="Layer text" value={activeLayer.text ?? ''}
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

                {(activeLayer.src || activeLayer.kind === 'img') && (
                  <div className={styles.imageActions}>
                    {!activeLayer.parentId && <button type="button" className={styles.replaceButton}
                      onClick={() => placeBehindCurrentSet(activeLayer)}>Place behind current set</button>}
                    <button type="button" className={styles.replaceButton} disabled={!onUploadImage || uploading}
                      onClick={() => chooseImage(activeLayer.id)}>{uploading ? 'Uploading…' : 'Replace image'}</button>
                  </div>
                )}
                {activeLayer.parentId && activeLayer.kind !== 'text' && <>
                  <Slider label="Border" value={activeLayer.borderWidth ?? 0} min={0} max={30} step={1}
                    onChange={(borderWidth) => patchLayer(activeLayer.id, { borderWidth })} />
                  <label className={styles.compactField}>Border colour<input type="color" value={activeLayer.borderColor || direction?.theme.memory.frameColor || '#d4a65f'}
                    onChange={(event) => patchLayer(activeLayer.id, { borderColor: event.target.value })} /></label>
                </>}

                <div className={styles.control} style={{ gridTemplateColumns: '52px 1fr' }}>
                  <span>Space</span>
                  <select className={styles.field} value={activeLayer.space}
                    disabled={Boolean(onSceneSetAction)}
                    onChange={(event) => patchLayer(activeLayer.id, { space: event.target.value as CinematicWorldLayer['space'] })}>
                    <option value="world">Scene · moves with camera</option>
                    <option value="viewport">Screen · stays with viewer</option>
                  </select>
                </div>

                {activeLayer.locked || cinematicAncestors(activeLayer, layers).some((parent) => parent.locked) || setById.get(activeLayer.group)?.locked ? (
                  <p className={styles.note}>Unlock this layer in the list to move or resize it.</p>
                ) : (
                  <>
                    <Slider label="X" value={activeLayer.x} min={activeLayer.parentId ? -500 : -25} max={activeLayer.parentId ? 500 : 125} step={0.5}
                      onChange={(value) => patchLayer(activeLayer.id, { x: value })} />
                    <Slider label="Y" value={activeLayer.y} min={activeLayer.parentId ? -500 : -25} max={activeLayer.parentId ? 500 : 125} step={0.5}
                      onChange={(value) => patchLayer(activeLayer.id, { y: value })} />
                    <Slider label={activeLayer.parentId ? 'Scale %' : 'Width'} value={activeLayer.w} min={3} max={200} step={0.5}
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
                      {shipped.has(activeLayer.id) || activeLayer.part
                        ? <button type="button" onClick={() => onResetLayer(activeLayer.id)}>Reset prop</button>
                        : <button type="button" className={styles.dangerButton} onClick={() => removeLayer(activeLayer.id)}>Delete layer</button>}
                    </div>
                  </>
                )}

                <div className={styles.timingEditor}>
                  <strong>Appearance timing</strong>
                  {activeTimingTrack ? (
                    <>
                      <TimingTrackEditor track={activeTimingTrack} onChange={onTimingTrackChange}
                        onPreview={previewTrackTransition}
                        help="Independent timing. Drag its gold timeline handles or enter exact positions here." />
                      <button type="button" className={styles.timingLinkButton}
                        onClick={() => onRelinkTiming?.(activeLayer.id)}>
                        {inheritedTimingTrack ? `Follow ${inheritedTimingTrack.label} again` : 'Return to always visible'}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className={styles.note}>
                        {effectiveTimingSource
                          ? `Following ${effectiveTimingSource.label}. Changes to that set affect this asset too.`
                          : 'Always visible. Give this asset its own timing to animate it independently.'}
                      </p>
                      {(inheritedTimingTrack || customTimingSets.length > 0) && (
                        <label className={styles.timingSourceField}>
                          <span>Timing source</span>
                          <select
                            value={activeTiming?.exact?.timing.mode === 'linked'
                              ? activeTiming.exact.timing.trackId
                              : inheritedTimingTrack?.id ?? ''}
                            onChange={(event) => onRelinkTiming?.(
                              activeLayer.id,
                              event.target.value === inheritedTimingTrack?.id ? undefined : event.target.value,
                            )}
                          >
                            {inheritedTimingTrack && (
                              <option value={inheritedTimingTrack.id}>{inheritedTimingTrack.label}</option>
                            )}
                            {customTimingSets.map((set) => (
                              <option key={set.id} value={set.id}>{set.label}</option>
                            ))}
                          </select>
                        </label>
                      )}
                      <button type="button" className={styles.timingLinkButton}
                        onClick={() => onMakeTimingIndependent?.(activeLayer.id)}>Unlink timing</button>
                    </>
                  )}
                </div>
                <AssetAnimationEditor layer={activeLayer} tracks={tracks} layers={layers}
                  disabled={activeLayer.locked || setById.get(activeLayer.group)?.locked}
                  onChange={(animations) => patchLayer(activeLayer.id, { animations })}
                  onSelectTrack={onSelectTimingTrack} onPreview={(track) => previewTrackTransition(track, 'enter')} />
              </>
            ) : null}
          </div>
        </div>
      )}

      <div className={styles.header}>
        <span className={styles.title}>Cinematic · {breakpoint}</span>
        <button className={styles.close} onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className={styles.body} hidden={sidebarTab !== 'editing'} role="tabpanel" id="cinematic-editing-panel" aria-labelledby="cinematic-editing-tab">
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
                      <strong>Delete “{activeBeat.label}”?</strong>
                      <p>This removes:</p>
                      <ul>
                        <li>Camera composition</li>
                        {ownedTracks.map((track) => (
                          <li key={track.id}>
                            {track.label} <small>{ownedTrackImpact(track)}</small>
                          </li>
                        ))}
                        <li>Allocated scroll segment</li>
                      </ul>
                      {removesInteraction && (
                        <p className={styles.functionalWarning}>
                          Guests will lose this form or interaction entry point.
                        </p>
                      )}
                      <p>Shared scenery and timing sets stay in the story.</p>
                      <div className={styles.deleteMomentActions}>
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

        {mode !== 'scene' && deletedBeats.length > 0 && (
          <section className={styles.deletedMoments} aria-label="Deleted moments">
            <strong>Deleted moments</strong>
            <p>Restore a shipped moment with its camera, exclusive content, effects and interactions.</p>
            <div>
              {deletedBeats.map((beat) => (
                <button type="button" key={beat.id} onClick={() => onRestoreBeat?.(beat.id)}>
                  Restore {beat.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {mode === 'scene' && (
          <>
            {onSceneSetAction && <SceneSetManager sets={availableSets} layers={layers} tracks={tracks}
              selectedId={selectedSceneSet} onSelect={setSelectedSceneSet} onAction={onSceneSetAction} />}
            <div className={styles.label}>Scene layers · front to back</div>
            <div className={styles.layers}>
              {groupedLayers.map(({ group, layers: groupLayers, visibility }) => {
                const visibleNow = !visibility || cinematicSetOpacity(progress, visibility) > 0.08;
                const groupTrack = tracks.find((track) =>
                  track.target.type === 'group' && track.target.id === group);
                return (
                  <section key={group} className={styles.layerGroup}>
                    <button type="button" className={styles.layerGroupHeader}
                      disabled={!groupTrack}
                      aria-label={`Edit ${setById.get(group)?.label ?? group} timing`}
                      onClick={() => {
                        if (!groupTrack) return;
                        setSelectedTimingSetId(groupTrack.id);
                        onSelectTimingTrack?.(groupTrack.id);
                      }}>
                      <span className={`${styles.setDot} ${visibleNow ? styles.setDotActive : ''}`} />
                      <span>{setById.get(group)?.label ?? group}</span>
                      <small>{groupLayers.length}</small>
                    </button>
                    {cinematicLayerTree(groupLayers).filter(({ layer }) => !cinematicAncestors(layer, layers).some((parent) => collapsedLayers.has(parent.id))).map(({ layer, depth }) => (
                      <div
                        key={layer.id}
                        style={{ paddingLeft: `${6 + depth * 14}px` }}
                        className={`${styles.layerRow} ${layer.id === selectedLayer ? styles.layerRowActive : ''} ${selectedTimingLayers.includes(layer.id) ? styles.layerRowChecked : ''}`}
                      >
                        {timingSelectionMode && (
                          <input type="checkbox" className={styles.layerCheck}
                            checked={selectedTimingLayers.includes(layer.id)}
                            onChange={() => toggleTimingLayer(layer.id)}
                            aria-label={`Include ${layer.label} in timing set`} />
                        )}
                        {layers.some((child) => child.parentId === layer.id) && <button type="button" className={styles.iconButton}
                          aria-label={`${collapsedLayers.has(layer.id) ? 'Expand' : 'Collapse'} ${layer.label}`}
                          aria-expanded={!collapsedLayers.has(layer.id)}
                          onClick={() => setCollapsedLayers((current) => { const next = new Set(current); if (next.has(layer.id)) next.delete(layer.id); else next.add(layer.id); return next; })}>
                          {collapsedLayers.has(layer.id) ? '▸' : '▾'}
                        </button>}
                        <button type="button" className={styles.layerName} onClick={() => selectLayer(layer)}>
                          {layer.label}
                          <small>{timingSourceLabel(layer)}</small>
                        </button>
                        <button type="button" className={styles.iconButton}
                          disabled={setById.get(group)?.locked}
                          aria-label={`${layer.hidden ? 'Show' : 'Hide'} ${layer.label}`}
                          onClick={() => patchLayer(layer.id, { hidden: !layer.hidden })}>
                          {layer.hidden ? '○' : '●'}
                        </button>
                        <button type="button" className={styles.iconButton}
                          disabled={setById.get(group)?.locked}
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

            {timingSelectionMode ? (
              <div className={styles.timingSelectionBar}>
                <div>
                  <strong>{selectedTimingLayers.length} selected</strong>
                  <span>Select at least two assets that should move together.</span>
                </div>
                <input value={newTimingSetName} placeholder="Set name"
                  aria-label="New timing set name"
                  onChange={(event) => setNewTimingSetName(event.target.value)} />
                <div>
                  <button type="button" onClick={cancelTimingSelection}>Cancel</button>
                  <button type="button" disabled={selectedTimingLayers.length < 2}
                    onClick={createTimingSet}>Create set</button>
                </div>
              </div>
            ) : (
              <button type="button" className={styles.organizeTimingButton}
                onClick={() => {
                  setTimingSelectionMode(true);
                  setSelectedTimingLayers(selectedLayer ? [selectedLayer] : []);
                  setSelectedTimingSetId(undefined);
                  onSelectTimingTrack?.(undefined);
                }}>
                Organize timing sets
              </button>
            )}

            {customTimingSets.length > 0 && (
              <div className={styles.customSets}>
                <span>Custom timing sets</span>
                {customTimingSets.map((set) => (
                  <button type="button" key={set.id}
                    className={set.id === selectedTimingSetId ? styles.customSetActive : ''}
                    onClick={() => {
                      setSelectedTimingSetId(set.id);
                      onSelectTimingTrack?.(set.id);
                    }}>
                    <strong>{set.label}</strong>
                    <small>{linkedAssetCount(set.id)} linked</small>
                  </button>
                ))}
              </div>
            )}

            {selectedTimingSet && (
              <section className={styles.setEditor} aria-label={`Timing track ${selectedTimingSet.label}`}>
                <div className={styles.setEditorHeader}>
                  {selectedTimingSet.target.type === 'set' ? (
                    <input value={selectedTimingSet.label} aria-label="Timing set name"
                      onChange={(event) => onRenameTimingSet?.(selectedTimingSet.id, event.target.value)} />
                  ) : (
                    <strong>{selectedTimingSet.label}</strong>
                  )}
                  <button type="button" aria-label="Close timing track editor"
                    onClick={() => {
                      setSelectedTimingSetId(undefined);
                      setDeleteConfirmSet(undefined);
                      onSelectTimingTrack?.(undefined);
                    }}>×</button>
                </div>
                <TimingTrackEditor track={selectedTimingSet} onChange={onTimingTrackChange}
                  onPreview={previewTrackTransition}
                  help={selectedTimingSet.kind === 'interaction'
                    ? 'This marker is an entry window. Opening RSVP or Best Wishes pauses the scene; the guest decides how long the form stays open.'
                    : `${linkedAssetCount(selectedTimingSet.id)} assets follow this clip. Moving it moves every linked asset.`} />
                {timingSetAnimationLayer && <>
                  {timingSetLayers.length > 1 && <label className={styles.compactField}>Animate asset<select aria-label="Asset to animate" value={timingSetAnimationLayer.id} onChange={(event) => setAnimationLayerId(event.target.value)}>
                    {timingSetLayers.map((layer) => <option key={layer.id} value={layer.id}>{layer.label}</option>)}
                  </select></label>}
                  <AssetAnimationEditor layer={timingSetAnimationLayer} tracks={tracks} layers={layers}
                    disabled={timingSetAnimationLayer.locked || setById.get(timingSetAnimationLayer.group)?.locked}
                    onChange={(animations) => patchLayer(timingSetAnimationLayer.id, { animations })}
                    onSelectTrack={onSelectTimingTrack} onPreview={(track) => previewTrackTransition(track, 'enter')} />
                </>}
                {onResetTrack && (
                  <div className={styles.setActions}>
                    <button type="button" onClick={() => onResetTrack(selectedTimingSet.id)}>Reset track</button>
                  </div>
                )}
                {selectedTimingSet.target.type === 'set' && (
                  <div className={styles.setActions}>
                    <button type="button" onClick={() => {
                      const id = onDuplicateTimingSet?.(selectedTimingSet.id);
                      if (id) {
                        setSelectedTimingSetId(id);
                        onSelectTimingTrack?.(id);
                      }
                    }}>Duplicate set</button>
                    {deleteConfirmSet === selectedTimingSet.id ? (
                      <div className={styles.deleteSetConfirm} role="alert">
                        <p>{linkedAssetCount(selectedTimingSet.id)} linked assets will keep their current timing as independent clips.</p>
                        <button type="button" onClick={() => setDeleteConfirmSet(undefined)}>Cancel</button>
                        <button type="button" onClick={() => {
                          onDeleteTimingSet?.(selectedTimingSet.id);
                          setSelectedTimingSetId(undefined);
                          setDeleteConfirmSet(undefined);
                          onSelectTimingTrack?.(undefined);
                        }}>Delete set</button>
                      </div>
                    ) : (
                      <button type="button" className={styles.dangerButton}
                        onClick={() => setDeleteConfirmSet(selectedTimingSet.id)}>Delete set</button>
                    )}
                  </div>
                )}
              </section>
            )}

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
        {onReferenceChange && <div className={styles.actionRow}>
          <button type="button" disabled={!onUploadImage || uploading} onClick={() => referenceFileRef.current?.click()}>{uploading ? 'Uploading…' : activeBeat?.referenceSrc ? 'Replace reference' : 'Add reference'}</button>
          {activeBeat?.referenceSrc && <button type="button" onClick={() => onReferenceChange({ referenceSrc: '', referenceLabel: '' })}>Remove reference</button>}
          <select aria-label="Reference fit" value={activeBeat?.referenceFit ?? 'contain'} onChange={(event) => onReferenceChange({ referenceFit: event.target.value as 'contain' | 'cover' | 'fill' })}>
            <option value="contain">Contain</option><option value="cover">Cover</option><option value="fill">Stretch</option>
          </select>
        </div>}
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
                  value={activeBeat.referenceOpacity ?? referenceOpacity}
                  disabled={!referenceVisible}
                  onChange={(event) => { onReferenceOpacityChange(Number(event.target.value)); onReferenceChange?.({ referenceOpacity: Number(event.target.value) }); }}
                  aria-label="Reference overlay opacity"
                />
                <span className={styles.rangeValue}>{Math.round((activeBeat.referenceOpacity ?? referenceOpacity) * 100)}%</span>
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
          {resetSequenceConfirm ? (
            <div className={styles.deleteMomentConfirm} role="alert">
              <strong>Reset the entire story?</strong>
              <p>All beat positions, camera frames, transitions, timing tracks and restored/deleted moments return to the template starting design. Scene prop placement stays unchanged.</p>
              <div className={styles.deleteMomentActions}>
                <button type="button" onClick={() => setResetSequenceConfirm(false)}>Cancel</button>
                <button type="button" className={styles.deleteBeat} onClick={() => {
                  setResetSequenceConfirm(false);
                  onResetSequence?.();
                }}>Reset entire story</button>
              </div>
            </div>
          ) : (
            <button type="button" className={styles.resetButton}
              onClick={() => setResetSequenceConfirm(true)}>Reset entire story</button>
          )}
        </div>
      </div>
      {direction && onDirectionChange && <>
        <div className={styles.body} hidden={sidebarTab !== 'advanced'} role="tabpanel" id="cinematic-advanced-panel" aria-labelledby="cinematic-advanced-tab">
          <DirectorSettings standalone value={direction} onChange={onDirectionChange}
            breakpoint={breakpoint} layers={layers} sets={availableSets} beats={beats.map((beat, order) => ({ id: beat.id, label: beat.label, at: beat.progress, order, transitionIn: beat.transitionIn }))}
            tracks={tracks} onAddEffectTrack={onAddEffectTrack ?? (() => {})} onPreview={(id) => {
              const track = tracks.find((candidate) => candidate.id === id);
              if (track) { onModeChange('scene'); previewTrackTransition(track, 'enter'); }
            }} />
        </div>
        <div className={styles.sidebarTabs} role="tablist" aria-label="Cinematic editor panels">
          {(['editing', 'advanced'] as const).map((tab) => <button key={tab} type="button" role="tab"
            id={`cinematic-${tab}-tab`} aria-controls={`cinematic-${tab}-panel`} aria-selected={sidebarTab === tab}
            tabIndex={sidebarTab === tab ? 0 : -1} onClick={() => setSidebarTab(tab)} onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === 'Home' ? 'editing' : event.key === 'End' ? 'advanced' : tab === 'editing' ? 'advanced' : 'editing';
              setSidebarTab(next); document.getElementById(`cinematic-${next}-tab`)?.focus();
            }}>{tab === 'editing' ? 'Editing' : 'Advanced'}</button>)}
        </div>
      </>}
    </div>
  );
}
