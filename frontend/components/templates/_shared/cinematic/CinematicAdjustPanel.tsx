'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import type { Breakpoint } from '../types';
import type { CinematicBeat, CinematicEditorMode } from './registry';
import type { CinematicLayerGroup, CinematicWorldGeometry, CinematicWorldLayer } from './world';
import { resizeCinematicLayer } from './world';
import { cinematicAncestors, cinematicDescendantIds, cinematicLayerTree, cinematicEditorLayers } from './parts';
import type { CameraState } from './useCinematicScroll';
import {
  resolveCinematicLayerTiming, resolveCinematicTrackClip,
  type CinematicAssetTransition, type CinematicCameraTransition,
  type CinematicEasing, type CinematicSequenceClip, type CinematicSequenceTrack,
  type CinematicSlideDirection,
} from './sequence';
import { cinematicSetOpacity, type CinematicVisibilitySet } from './visibility';
import { applyCinematicSceneSets, cinematicGroupAnimationTarget, cinematicGroupCenter, type CinematicLayerGroup as LayerGroup, type CinematicSceneSet } from './sceneSets';
import type { SceneSetAction } from './sceneSetEditing';
import SceneSetManager, { SceneSetProperties } from './SceneSetManager';
import AnchorPointEditor from './AnchorPointEditor';
import CinematicLayerGroups from './CinematicLayerGroups';
import TextStyleEditor from './TextStyleEditor';
import type { EffectTrackUsage } from './effectTrackEditing';
import DirectorSettings from './DirectorSettings';
import CinematicRichText from './CinematicRichText';
import { EditorActions, ConfirmEditorAction } from './EditorActions';
import { useWorkspacePreference, DEFAULT_SIDEBAR, decodeSidebar, decodeLayerFilter } from './workspacePreferences';
import { CINEMATIC_FUNCTIONS } from './functionalLayers';
import type { CinematicDirection } from './direction';
import { BINDING_TOKENS } from '../bindings';
import CinematicFontPicker from './CinematicFontPicker';
import { Icon } from '@/components/ui/Icon';
import styles from './CinematicAdjustPanel.module.css';

interface Props {
  beats: CinematicBeat[];
  deletedBeats?: CinematicBeat[];
  breakpoint: Breakpoint;
  selectedBeat: string;
  progress: number;
  mode: CinematicEditorMode;
  /** @deprecated Reference controls now live beside the preview. */
  referenceVisible?: boolean;
  referenceOpacity?: number;
  direction?: CinematicDirection;
  onDirectionChange?: (direction: CinematicDirection) => void;
  onReferenceChange?: (patch: { referenceSrc?: string; referenceLabel?: string; referenceFit?: 'contain' | 'cover' | 'fill'; referenceOpacity?: number }) => void;
  layers: CinematicWorldLayer[];
  sceneSets?: CinematicSceneSet[];
  onSceneSetAction?: (action: SceneSetAction) => void;
  selectedLayer?: string;
  onFontPreview?: (preview?: { layerId: string; fontFamily: string }) => void;
  previewFrame?: { width: number; height: number };
  camera?: CameraState & { id?: string };
  visibilitySets: CinematicVisibilitySet[];
  tracks?: CinematicSequenceTrack[];
  selectedTimingTrack?: string;
  selectedAnimationTrack?: boolean;
  timingSelectionRequest?: number;
  onSelectBeat: (id: string) => void;
  onProgressChange: (progress: number) => void;
  onModeChange: (mode: CinematicEditorMode) => void;
  onReferenceVisibleChange?: (visible: boolean) => void;
  onReferenceOpacityChange?: (opacity: number) => void;
  onSelectLayer: (id: string | undefined) => void;
  canAnimateLayer?: (layer: CinematicWorldLayer) => boolean;
  onAnimateLayer?: (layer: CinematicWorldLayer) => void;
  onLayersChange: (layers: CinematicWorldLayer[]) => void;
  onResetLayer: (id: string) => void;
  onResetWorld: () => void;
  onCameraChange: (patch: Partial<CameraState>) => void;
  onTimingTrackChange?: (id: string, patch: Partial<CinematicSequenceTrack>) => void;
  onResetTrack?: (id: string) => void;
  effectTracks?: ReadonlyMap<string, EffectTrackUsage>;
  onDeleteEffectTrack?: (id: string) => void;
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
      <input className={styles.number} type="number" aria-label={label} min={min} max={max} step={step} value={value}
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

function TimingTrackEditor({ track, onChange, onPreview, help, hideEffectHelp }: {
  track: CinematicSequenceTrack;
  onChange?: (id: string, patch: Partial<CinematicSequenceTrack>) => void;
  onPreview?: (track: CinematicSequenceTrack, phase: TransitionPhase) => void;
  help?: string;
  hideEffectHelp?: boolean;
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
      {track.kind === 'effect' && !hideEffectHelp && <p className={styles.note}>This track sets the effect’s scroll range. Edit its movement, blur and easing in Story settings → Effects.</p>}
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
  beats, deletedBeats = [], breakpoint, selectedBeat, progress, mode,
  direction, onDirectionChange,
  layers, sceneSets, onSceneSetAction, selectedLayer, onFontPreview, previewFrame, selectedTimingTrack, selectedAnimationTrack = false, timingSelectionRequest,
  camera, visibilitySets, tracks = [],
  onSelectBeat, onProgressChange, onModeChange,
  onSelectLayer, canAnimateLayer, onAnimateLayer, onLayersChange, onResetWorld,
  onResetLayer,
  onCameraChange, onResetCamera, onCopyCameraToOther,
  onTimingTrackChange, onResetTrack, effectTracks, onDeleteEffectTrack, onMakeTimingIndependent, onRelinkTiming,
  onCreateTimingSet, onRenameTimingSet, onDuplicateTimingSet, onDeleteTimingSet,
  onSelectTimingTrack,
  onCreateBeat, onRenameBeat, onDuplicateBeat, onDeleteBeat, onRestoreBeat,
  onTransitionChange, onResetBeat, shippedBeatIds = [],
  onResetVisibility, onResetSequence, onUploadImage, shippedLayerIds, onClose,
}: Props) {
  const previewFont = useCallback((fontFamily?: string) => onFontPreview?.(
    selectedLayer && fontFamily !== undefined ? { layerId: selectedLayer, fontFamily } : undefined,
  ), [onFontPreview, selectedLayer]);
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
  const [selectedLayerGroup, setSelectedLayerGroup] = useState<{ setId: string; groupId: string; breakpoint: Breakpoint }>();
  const [groupTab, setGroupTab] = useState<'layout' | 'animation'>('layout');
  useEffect(() => {
    if (selectedLayer || selectedTimingTrack || popover === 'add' || mode !== 'scene') setSelectedLayerGroup(undefined);
  }, [selectedLayer, selectedTimingTrack, popover, mode]);
  const [selectedSceneSet, setSelectedSceneSet] = useState<string>();
  const [sceneSetOpen, setSceneSetOpen] = useState(false);
  useEffect(() => {
    if (selectedLayer || selectedTimingTrack || selectedLayerGroup || popover === 'add' || mode !== 'scene') setSceneSetOpen(false);
  }, [selectedLayer, selectedTimingTrack, selectedLayerGroup, popover, mode]);
  const [collapsedSceneSets, setCollapsedSceneSets] = useState<string[]>([]);
  const [draggedSetLayer, setDraggedSetLayer] = useState<string>();
  const [animationLayerId, setAnimationLayerId] = useState<string>();
  const [sidebarPreferences, setSidebarPreferences, sidebarReady] = useWorkspacePreference('einvite.cinematic.sidebar.v1', DEFAULT_SIDEBAR, decodeSidebar);
  const [layerFilter, setLayerFilter] = useWorkspacePreference('einvite.cinematic.layer-filter.v1', 'all', decodeLayerFilter);
  const collapsedLayers = useMemo(() => new Set(sidebarPreferences.collapsedLayers), [sidebarPreferences.collapsedLayers]);
  const setCollapsedLayers = useCallback((update: (current: Set<string>) => Set<string>) => setSidebarPreferences((current) => {
    const next = [...update(new Set(current.collapsedLayers))];
    return next.length === current.collapsedLayers.length && next.every((id, index) => id === current.collapsedLayers[index])
      ? current : { ...current, collapsedLayers: next };
  }), [setSidebarPreferences]);
  const inspectorTab = sidebarPreferences.inspectorTab;
  const setInspectorTab = useCallback((inspectorTab: (typeof DEFAULT_SIDEBAR)['inspectorTab']) => setSidebarPreferences((current) => current.inspectorTab === inspectorTab ? current : { ...current, inspectorTab }), [setSidebarPreferences]);
  useEffect(() => {
    if (selectedTimingTrack && selectedAnimationTrack) setInspectorTab('animation');
  }, [selectedTimingTrack, selectedAnimationTrack, timingSelectionRequest, setInspectorTab]);
  const inspecting = mode === 'scene' && (layers.some((layer) => layer.id === selectedLayer) || popover === 'add');
  const workspace = mode === 'scene' ? 'scene' : 'camera';
  const scrollKey = workspace;
  const bodyRef = useRef<HTMLDivElement>(null);
  const layerBrowserHeaderRef = useRef<HTMLDivElement>(null);
  const selectedRowRef = useRef<HTMLDivElement>(null);
  const revealedLayerRef = useRef<string | undefined>(undefined);
  const floatingRef = useRef<HTMLDivElement>(null);
  const advancedBodyRef = useRef<HTMLDivElement>(null);
  const workspaceScroll = useRef<Record<string, number>>({});
  useLayoutEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = workspaceScroll.current[scrollKey] ?? sidebarPreferences.scroll[scrollKey] ?? 0;
    if (advancedBodyRef.current && sidebarTab === 'advanced') advancedBodyRef.current.scrollTop = workspaceScroll.current.advanced ?? sidebarPreferences.scroll.advanced ?? 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Restore on navigation/hydration only, never as the user scrolls.
  }, [scrollKey, sidebarTab, sidebarReady]);
  useEffect(() => { if (mode !== 'scene') setSidebarPreferences((current) => current.lastCameraMode === mode ? current : { ...current, lastCameraMode: mode }); }, [mode, setSidebarPreferences]);
  const rememberScroll = (key: string, top: number) => {
    const value = Math.round(top);
    workspaceScroll.current[key] = value;
    if (sidebarReady) setSidebarPreferences((current) => current.scroll[key] === value ? current : { ...current, scroll: { ...current.scroll, [key]: value } });
  };
  const floatingScrollKey = sceneSetOpen ? 'scene-set-inspector' : selectedLayerGroup && !inspecting ? `group-inspector-${groupTab}` : inspecting ? `inspector-${inspectorTab}` : 'timing-inspector';
  useLayoutEffect(() => {
    if (floatingRef.current) floatingRef.current.scrollTop = workspaceScroll.current[floatingScrollKey] ?? sidebarPreferences.scroll[floatingScrollKey] ?? 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Restore floating properties independently of sidebar navigation.
  }, [floatingScrollKey, inspecting, selectedTimingSetId, sidebarReady, sidebarTab]);
  useEffect(() => {
    const selected = layers.find((layer) => layer.id === selectedLayer);
    if (selected) setCollapsedLayers((current) => new Set([...current].filter((id) =>
      !cinematicAncestors(selected, layers).some((parent) => parent.id === id))));
  }, [selectedLayer, layers, setCollapsedLayers]);
  useLayoutEffect(() => {
    if (!selectedLayer) { revealedLayerRef.current = undefined; return; }
    if (mode !== 'scene' || sidebarTab !== 'editing' || revealedLayerRef.current === selectedLayer) return;
    const row = selectedRowRef.current, sidebar = bodyRef.current;
    // Wait for collapsed parents to expand before revealing the selected child.
    if (!row || !sidebar) return;
    const reveal = (container: HTMLElement, inset = 6) => {
      const bounds = container.getBoundingClientRect(), item = row.getBoundingClientRect();
      if (item.bottom > bounds.bottom - 6) container.scrollTop += item.bottom - bounds.bottom + 6;
      else if (item.top < bounds.top + inset) container.scrollTop += item.top - bounds.top - inset;
    };
    reveal(sidebar, 58 + (layerBrowserHeaderRef.current?.getBoundingClientRect().height ?? 0)); // Clear both sticky navigation headers.
    revealedLayerRef.current = selectedLayer;
  }, [selectedLayer, collapsedLayers, mode, sidebarTab, layerFilter]);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceLayerRef = useRef<string | null>(null);
  const customLayerCounter = useRef(0);
  const transitionPreviewRef = useRef(0);
  const shipped = new Set(shippedLayerIds);
  const activeBeat = beats.find((beat) => beat.id === selectedBeat) ?? beats[0];
  const activeLayer = layers.find((layer) => layer.id === selectedLayer);
  const editorLayers = cinematicEditorLayers(layers);
  const frontToBack = [...editorLayers].sort((a, b) => b.z - a.z);
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
  const selectedEffectTrack = selectedTimingSet && effectTracks?.get(selectedTimingSet.id);
  const effectTrackDependencies = selectedEffectTrack?.dependencies ?? [];
  const selectedEffects = selectedEffectTrack?.effects[breakpoint] ?? [];
  const activeEffectNames = selectedEffectTrack
    ? [...new Set([...selectedEffectTrack.effects.mobile, ...selectedEffectTrack.effects.desktop]
      .filter((effect) => effect.enabled).map(({ label }) => label))] : [];
  const showTimingInspector = selectedEffectTrack && !inspecting;
  const timingSetLayers = selectedTimingSet?.target.type === 'group'
    ? editorLayers.filter((layer) => layer.group === selectedTimingSet.target.id) : [];
  const timingSetAnimationLayer = timingSetLayers.find((layer) => layer.id === animationLayerId) ?? timingSetLayers.find((layer) => !layer.parentId) ?? timingSetLayers[0];
  const availableSets: CinematicSceneSet[] = sceneSets ?? [...new Set(layers.map((layer) => layer.group))].map((id, z) => ({
    id, label: id, z, space: layers.find((layer) => layer.group === id)!.space,
    hidden: false, locked: false, system: false, opacity: 1,
  }));
  const setById = new Map(availableSets.map((set) => [set.id, set]));
  const groupSet: CinematicSceneSet | undefined = selectedLayerGroup && setById.get(selectedLayerGroup.setId);
  const activeGroup = !inspecting && selectedLayerGroup?.breakpoint === breakpoint
    ? groupSet?.layerGroups?.[breakpoint]?.find((group) => group.id === selectedLayerGroup.groupId) : undefined;
  const layersWithVisibility = applyCinematicSceneSets(layers, availableSets, breakpoint);
  const hiddenLayerIds = new Set(layersWithVisibility.filter((layer) => layer.hidden ||
    cinematicAncestors(layer, layersWithVisibility).some((parent) => parent.hidden)).map((layer) => layer.id));
  const matchesLayerFilter = (layer: CinematicWorldLayer) => layerFilter === 'all' || hiddenLayerIds.has(layer.id) === (layerFilter === 'hidden');
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
  })).filter((entry) => draggedSetLayer || entry.layers.some(matchesLayerFilter));
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
    onLayersChange(layers.map((layer) => layer.id === id ? { ...layer, ...patch }
      : target?.behavior === 'programme-board' && patch.src !== undefined && layer.parentId === id && layer.part === 'artwork'
        ? { ...layer, src: patch.src } : layer));
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
  };

  const seekToAppearance = (track: CinematicSequenceTrack) => {
    const clip = resolveCinematicTrackClip(track, tracks);
    onProgressChange((clip.enterEnd + clip.exitStart) / 2);
  };

  const goToAppearance = (layer: CinematicWorldLayer) => {
    const timing = resolveCinematicLayerTiming(layer.id, layer.group, tracks, layer.timingTrackId, layers);
    const track = timing.exact ?? timing.inherited;
    if (track) seekToAppearance(track);
    else onProgressChange(0);
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

  const cameraActions = activeBeat && mode === 'camera-beat' ? (
                  <EditorActions key={`${activeBeat.id}-${breakpoint}`} label="Camera and beat actions" align="start">
                  <ConfirmEditorAction label="Reset camera" description={`Reset only “${activeBeat.label}” framing on ${breakpoint}. Other beats, timing and layer placement stay unchanged.`} onConfirm={onResetCamera} />
                  <button type="button" onClick={onCopyCameraToOther}>
                    Copy to {breakpoint === 'mobile' ? 'desktop' : 'mobile'}
                  </button>
                  <button type="button" onClick={() => onDuplicateBeat?.(activeBeat.id)}>Duplicate beat</button>
                  {isShippedBeat && <ConfirmEditorAction label="Reset beat" description={`Restore this beat’s name, scroll position, transition and reference, plus its ${breakpoint} camera. Other beats and layers stay unchanged.`} onConfirm={() => onResetBeat?.(activeBeat.id)} />}
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
                  </EditorActions>
  ) : null;

  const selectSceneSet = (id: string | undefined) => {
    setSelectedSceneSet(id);
    setSceneSetOpen(Boolean(id));
    if (!id) return;
    setPopover(null);
    setSelectedLayerGroup(undefined);
    setSelectedTimingSetId(undefined);
    onSelectTimingTrack?.(undefined);
    onSelectLayer(undefined);
  };
  const activeSceneSet = sceneSetOpen ? setById.get(selectedSceneSet ?? '') : undefined;
  const sceneSetInspector = activeSceneSet && onSceneSetAction && (
    <SceneSetProperties key={`${activeSceneSet.id}:${breakpoint}`} active={activeSceneSet}
      breakpoint={breakpoint} previewFrame={previewFrame} sets={availableSets} layers={layers} tracks={tracks}
      onSelect={selectSceneSet} onAction={onSceneSetAction} />
  );

  const timingInspector = selectedTimingSet ? (
              <section className={styles.setEditor} aria-label={`Timing track ${selectedTimingSet.label}`}>
                <div className={styles.setEditorHeader}>
                  {selectedTimingSet.target.type === 'set' ? (
                    <input value={selectedTimingSet.label} aria-label="Timing set name"
                      onChange={(event) => onRenameTimingSet?.(selectedTimingSet.id, event.target.value)} />
                  ) : (
                    <strong>{selectedTimingSet.label}</strong>
                  )}
                  <button type="button" aria-label="Go to appearance" title="Go to appearance"
                    onClick={() => { const clip = resolveCinematicTrackClip(selectedTimingSet, tracks); onProgressChange((clip.enterEnd + clip.exitStart) / 2); }}>
                    <Icon name="crosshair" size={17} />
                  </button>
                  <button type="button" aria-label="Close timing track editor" title="Close timing track editor"
                    onClick={() => {
                      setSelectedTimingSetId(undefined);
                      setDeleteConfirmSet(undefined);
                      onSelectTimingTrack?.(undefined);
                    }}>
                    <Icon name="x" size={16} />
                  </button>
                </div>
                <TimingTrackEditor track={selectedTimingSet} onChange={onTimingTrackChange}
                  onPreview={previewTrackTransition}
                  hideEffectHelp={Boolean(selectedEffectTrack)}
                  help={selectedEffectTrack
                    ? 'Effect timing places an effect on the story’s scroll range.'
                    : selectedTimingSet.kind === 'interaction'
                    ? 'This marker is an entry window. Opening RSVP or Best Wishes pauses the scene; the guest decides how long the form stays open.'
                    : `${linkedAssetCount(selectedTimingSet.id)} assets follow this clip. Moving it moves every linked asset.`} />
                {selectedEffectTrack && <>
                  {selectedEffects.length > 0 ? <ul className={styles.effectTrackUses}>
                    {selectedEffects.map((effect) => <li key={effect.id}>
                      <strong>{effect.label}</strong>{effect.enabled ? '' : ' · Off'}
                      <div>{effect.target === 'world' || (effect.target === 'layer' && effect.targetId.includes(':'))
                        ? 'Configure in Advanced → Effects.'
                        : effect.target === 'group' ? 'Configure in the group’s Animation → Legacy group effects.'
                          : 'Configure in the layer’s Animation → Legacy layer effects.'}</div>
                      {effect.target === 'layer' && !effect.targetId.includes(':') && layers.some(({ id }) => id === effect.targetId) &&
                        <button type="button" className={styles.timingLinkButton} onClick={() => {
                          setInspectorTab('animation');
                          setPopover(null);
                          onSelectLayer(effect.targetId);
                        }}>Open layer effects</button>}
                    </li>)}
                  </ul> : <p className={styles.note}>{effectTrackDependencies.length
                    ? 'This track is used by the controls below.'
                    : 'No effect on this breakpoint uses this track.'}</p>}
                  {(breakpoint === 'mobile' ? selectedEffectTrack.effects.desktop : selectedEffectTrack.effects.mobile)
                    .some((effect) => effect.enabled) && <p className={styles.note}>
                      Also check {breakpoint === 'mobile' ? 'Desktop' : 'Mobile'} for effects using this track.
                    </p>}
                  {effectTrackDependencies.length > 0 && <ul className={styles.effectTrackUses}>
                    {effectTrackDependencies.map((dependency) => <li key={dependency}>{dependency}</li>)}
                  </ul>}
                </>}
                {timingSetAnimationLayer && <>
                  {timingSetLayers.length > 1 && <label className={styles.compactField}>Animate asset<select aria-label="Asset to animate" value={timingSetAnimationLayer.id} onChange={(event) => setAnimationLayerId(event.target.value)}>
                    {timingSetLayers.map((layer) => <option key={layer.id} value={layer.id}>{layer.label}</option>)}
                  </select></label>}
                  {canAnimateLayer?.(timingSetAnimationLayer) && <button type="button" className={styles.timingLinkButton}
                    onClick={() => onAnimateLayer?.(timingSetAnimationLayer)}>Open keyframes</button>}
                </>}
                {(onResetTrack || selectedEffectTrack && onDeleteEffectTrack || selectedTimingSet.target.type === 'set') && <div key={selectedTimingSet.id} className={styles.timingTrackActions} role="group" aria-label="Timing track actions">
                {onResetTrack && (
                  <div className={styles.setActions}>
                    <ConfirmEditorAction label="Reset track" description="Restore this track’s template timing, or its full-story defaults if custom. Assets that follow this track are affected; unrelated tracks and layer placement stay unchanged." onConfirm={() => onResetTrack(selectedTimingSet.id)} />
                  </div>
                )}
                {selectedEffectTrack && onDeleteEffectTrack && (
                  <div className={styles.setActions}>
                    <ConfirmEditorAction label="Delete track" reveal disabled={effectTrackDependencies.length > 0}
                      description={activeEffectNames.length
                        ? `Remove “${selectedTimingSet.label}” on mobile and desktop. ${activeEffectNames.join(', ')} will stop running wherever they use this track. You can choose another timing track in the effect settings.`
                        : `Remove “${selectedTimingSet.label}” from the Story timeline on mobile and desktop.`}
                      onConfirm={() => {
                        onDeleteEffectTrack(selectedTimingSet.id);
                        setSelectedTimingSetId(undefined);
                      }} />
                    {effectTrackDependencies.length > 0 && <p className={styles.note}>Change the references above before deleting this track.</p>}
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
                </div>}
              </section>
  ) : null;

  const renderGroupInspector = (set: CinematicSceneSet, group: LayerGroup) => {
    if (!onSceneSetAction) return null;
    const members = layers.filter((layer) => !layer.parentId && layer.group === set.id &&
      layer.space === set.space && group.memberIds.includes(layer.id));
    if (members.length < 2) return null;
    const target = cinematicGroupAnimationTarget(set, group, members[0]);
    const position = cinematicGroupCenter(members);
    const locked = set.locked || members.some((layer) => layer.locked);
    const patch = (value: Partial<Omit<LayerGroup, 'id' | 'memberIds'>>) => onSceneSetAction({
      type: 'patch-layer-group', id: set.id, breakpoint, groupId: group.id, patch: value,
    });
    return <section className={styles.card} aria-label="Group inspector">
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>{group.label}</span>
        <button type="button" className={styles.close} aria-label="Close group inspector"
          onClick={() => setSelectedLayerGroup(undefined)}>×</button>
      </div>
      <div className={styles.inspectorTabs} role="tablist" aria-label="Group properties">
        {(['layout', 'animation'] as const).map((tab) => <button key={tab} type="button" role="tab"
          id={`group-${tab}-tab`} aria-controls={`group-${tab}-panel`} aria-selected={groupTab === tab}
          tabIndex={groupTab === tab ? 0 : -1} onClick={() => setGroupTab(tab)} onKeyDown={(event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === 'Home' ? 'layout' : event.key === 'End' ? 'animation'
              : tab === 'layout' ? 'animation' : 'layout';
            setGroupTab(next);
            document.getElementById(`group-${next}-tab`)?.focus();
          }}>{tab === 'layout' ? 'Layout' : 'Animation'}</button>)}
      </div>
      <div className={styles.cardBody}>
        <div role="tabpanel" id="group-layout-panel" aria-labelledby="group-layout-tab" hidden={groupTab !== 'layout'}>
          <fieldset disabled={locked}>
            <legend>Group transform · {breakpoint}</legend>
            {(['x', 'y'] as const).map((axis) => <Slider key={axis} label={axis.toUpperCase()}
              value={Number(position[axis].toFixed(2))} min={-25} max={125} step={.5} onChange={(value) => {
                const delta = value - position[axis];
                onSceneSetAction({ type: 'move-layer-group', id: set.id, breakpoint, groupId: group.id,
                  dx: axis === 'x' ? delta : 0, dy: axis === 'y' ? delta : 0 });
              }} />)}
            <Slider label="Scale %" value={(group.scale ?? 1) * 100} min={5} max={1000} step={1}
              onChange={(scale) => patch({ scale: scale / 100 })} />
            <Slider label="Rotate" value={group.rotation ?? 0} min={-360} max={360} step={1}
              onChange={(rotation) => patch({ rotation })} />
          </fieldset>
        </div>
        <div role="tabpanel" id="group-animation-panel" aria-labelledby="group-animation-tab" hidden={groupTab !== 'animation'}>
          {canAnimateLayer?.(target) && !locked && !group.hidden && <button type="button" className={styles.timingLinkButton}
            onClick={() => onAnimateLayer?.(target)}>Animate group</button>}
          {direction && onDirectionChange && direction.effects.some((effect) =>
            (breakpoint === 'desktop' ? effect.desktop?.target ?? effect.target : effect.target) === 'group' &&
            (breakpoint === 'desktop' ? effect.desktop?.targetId ?? effect.targetId : effect.targetId) === target.id) &&
            <details><summary>Legacy group effects</summary><fieldset disabled={locked}>
            <DirectorSettings key={target.id} standalone groupScope effectScope={target.id}
              value={direction} onChange={onDirectionChange} breakpoint={breakpoint}
              layers={[target]} sets={availableSets} beats={[]} tracks={tracks}
              onPreview={(id) => {
                const track = tracks.find((item) => item.id === id);
                if (track) previewTrackTransition({ ...track, clip: resolveCinematicTrackClip(track, tracks) }, 'enter');
              }} />
          </fieldset></details>}
        </div>
      </div>
    </section>;
  };

  const groupInspector = activeGroup && groupSet ? renderGroupInspector(groupSet, activeGroup) : null;

  const layerEffects = activeLayer && direction && onDirectionChange && direction.effects.some((effect) =>
    (breakpoint === 'desktop' ? effect.desktop?.target ?? effect.target : effect.target) === 'layer' &&
    (breakpoint === 'desktop' ? effect.desktop?.targetId ?? effect.targetId : effect.targetId) === activeLayer.id) && (
    <DirectorSettings key={`${activeLayer.id}:${selectedTimingTrack ?? ''}`} standalone
      effectScope={activeLayer.id} selectedEffectTrackId={selectedTimingTrack}
      value={direction} onChange={onDirectionChange} breakpoint={breakpoint} layers={layers} sets={availableSets}
      beats={beats.map((beat, order) => ({ id: beat.id, label: beat.label, at: beat.progress, order, transitionIn: beat.transitionIn }))}
      tracks={tracks}
      onPreview={(id) => { const track = tracks.find((item) => item.id === id); if (track) previewTrackTransition(track, 'enter'); }} />
  );

  const inspector = sidebarTab === 'editing' && inspecting && (activeLayer || popover === 'add') ? (
        <section className={styles.card} data-cinematic-card={popover ?? 'detail'} aria-label="Object inspector">
          <div className={styles.cardHeader}>
            {activeLayer && popover !== 'add' && <EditorActions key={`${activeLayer.id}-${breakpoint}`} label="Layer actions" align="start">
              {shipped.has(activeLayer.id) || activeLayer.part ? <ConfirmEditorAction label="Reset this layer"
                description={`Reset only “${activeLayer.label}” on ${breakpoint}. Its child layers and story timing stay unchanged.`}
                disabled={activeLayer.locked || cinematicAncestors(activeLayer, layers).some((parent) => parent.locked) || setById.get(activeLayer.group)?.locked}
                onConfirm={() => onResetLayer(activeLayer.id)} />
                : <ConfirmEditorAction label="Delete this layer" description={`Remove “${activeLayer.label}” and its child layers on ${breakpoint}. Uploaded files are not deleted.`}
                  disabled={activeLayer.locked || cinematicAncestors(activeLayer, layers).some((parent) => parent.locked) || setById.get(activeLayer.group)?.locked}
                  onConfirm={() => removeLayer(activeLayer.id)} />}
            </EditorActions>}
            <span className={styles.cardTitle}>{popover === 'add' ? 'Add to scene' : activeLayer?.label}</span>
            <button
              className={styles.close}
              onClick={() => popover ? setPopover(null) : onSelectLayer(undefined)}
              aria-label="Close card"
            >×</button>
          </div>
          {activeLayer && popover !== 'add' && <>
            <div className={styles.inspectorActions}>
              <button type="button" onClick={() => goToAppearance(activeLayer)}>Go to appearance</button>
            </div>
            <div className={styles.inspectorTabs} role="tablist" aria-label="Object properties">
              {(['layout', 'style', 'animation'] as const).map((tab) => <button type="button" role="tab" key={tab}
                id={`object-${tab}-tab`} aria-controls={`object-${tab}-panel`} aria-selected={inspectorTab === tab}
                tabIndex={inspectorTab === tab ? 0 : -1}
                onKeyDown={(event) => {
                  const tabs = ['layout', 'style', 'animation'] as const;
                  const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
                  if (!offset && event.key !== 'Home' && event.key !== 'End') return;
                  event.preventDefault();
                  const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[2] : tabs[(tabs.indexOf(tab) + offset + 3) % 3];
                  setInspectorTab(next); document.getElementById(`object-${next}-tab`)?.focus();
                }}
                onClick={() => setInspectorTab(tab)}>{tab === 'layout' ? 'Layout' : tab === 'style' ? 'Style' : 'Animation'}</button>)}
            </div>
          </>}
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
                <div role="tabpanel" id="object-layout-panel" aria-labelledby="object-layout-tab" hidden={inspectorTab !== 'layout'}>
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

                {activeLayer.parentId && <p className={styles.note}>Inside {editorLayers.find((layer) => layer.id === editorLayers.find((item) => item.id === activeLayer.id)?.parentId)?.label}. Position offsets and scale are local to its original responsive slot. Parent movement, visibility and timing are inherited.</p>}
                {!activeLayer.parentId && <label className={styles.compactField}>Function
                  <select aria-label="Layer function" value={activeLayer.behavior || 'artwork'} onChange={(event) =>
                    patchLayer(activeLayer.id, { behavior: event.target.value, kind: event.target.value === 'artwork' ? (activeLayer.src ? 'img' : 'text') : 'functional' })}>
                    {CINEMATIC_FUNCTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>}
                {!activeLayer.parentId && activeLayer.src && (!activeLayer.kind || activeLayer.kind === 'img') &&
                  <AnchorPointEditor key={`${breakpoint}:${activeLayer.id}:${activeLayer.src}`} layer={activeLayer}
                    disabled={activeLayer.locked || setById.get(activeLayer.group)?.locked}
                    onChange={(anchorPoints) => patchLayer(activeLayer.id, { anchorPoints })} />}
                <div role="group" aria-label="Position and size">
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
                      onChange={(value) => patchLayer(activeLayer.id, resizeCinematicLayer(activeLayer, 'w', value))} />
                    {activeLayer.parentId && (activeLayer.kind === 'text' || ['items', 'copy', 'caption'].includes(activeLayer.part ?? '')) && <>
                      <Slider label="Text width %" value={activeLayer.textWidth ?? 100} min={5} max={200} step={1}
                        onChange={(textWidth) => patchLayer(activeLayer.id, { textWidth })} />
                      <p className={styles.note}>Width within its parent. Text wraps without changing font size; alignment applies inside this box.</p>
                      <div className={styles.actionRow}><button type="button" disabled={activeLayer.textWidth === undefined}
                        onClick={() => patchLayer(activeLayer.id, { textWidth: undefined })}>Natural width</button></div>
                    </>}
                    {activeLayer.h !== undefined && <>
                      <Slider label="Height" value={activeLayer.h} min={3} max={200} step={0.5}
                        onChange={(value) => patchLayer(activeLayer.id, resizeCinematicLayer(activeLayer, 'h', value))} />
                      <button type="button" className={styles.proportionLock} aria-label="Link width and height" aria-pressed={Boolean(activeLayer.lockAspect)}
                        title="Keep the current width-to-height proportions when resizing"
                        onClick={() => patchLayer(activeLayer.id, { lockAspect: !activeLayer.lockAspect })}>
                        <Icon name={activeLayer.lockAspect ? 'lock' : 'unlock'} size={14} />
                        {activeLayer.lockAspect ? 'Linked: height follows width' : 'Free: resize width and height separately'}
                      </button>
                    </>}
                    <Slider label="Rotate" value={activeLayer.rotation} min={-180} max={180} step={1}
                      onChange={(value) => patchLayer(activeLayer.id, { rotation: value })} />
                    <Slider label="Depth" value={activeLayer.z} min={-10}
                      max={Math.max(40, ...layers.filter((layer) => layer.space === activeLayer.space).map((layer) => layer.z + 5))}
                      step={1} onChange={(value) => patchLayer(activeLayer.id, { z: value })} />
                    <div className={styles.actionRow}>
                      {!activeLayer.parentId && (activeLayer.src || activeLayer.kind === 'img') && <button type="button"
                        onClick={() => placeBehindCurrentSet(activeLayer)}>Place behind current set</button>}
                      {(activeLayer.kind ?? 'img') === 'img' && <button type="button"
                        onClick={() => patchLayer(activeLayer.id, { flipX: !activeLayer.flipX })}>
                        {activeLayer.flipX ? '✓ Mirrored' : 'Mirror'}
                      </button>}
                      <button type="button" onClick={() => moveLayer(activeLayer.id, 'backward')}>Send to back</button>
                      <button type="button" onClick={() => moveLayer(activeLayer.id, 'forward')}>Bring to front</button>
                    </div>
                  </>
                )}
                </div>
                </div>
                <div role="tabpanel" id="object-style-panel" aria-labelledby="object-style-tab" hidden={inspectorTab !== 'style'}>
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
                  <CinematicFontPicker key={`${activeLayer.id}:${breakpoint}:narrative`} value={activeLayer.fontFamily ?? ''} defaultLabel="Story theme"
                    onPreview={previewFont} onChange={(fontFamily) => patchLayer(activeLayer.id, { fontFamily })} />
                  <label className={styles.compactField}>Alignment<select value={activeLayer.textAlign ?? 'center'} onChange={(event) => patchLayer(activeLayer.id, { textAlign: event.target.value as CinematicWorldLayer['textAlign'] })}>
                    <option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option>
                  </select></label>
                  <Slider label="Leading" value={activeLayer.lineHeight ?? 1.45} min={.8} max={3} step={.05} onChange={(lineHeight) => patchLayer(activeLayer.id, { lineHeight })} />
                  <label className={styles.compactField}>Colour<input type="color" value={activeLayer.color || direction?.theme.ink || '#4a3a32'} onChange={(event) => patchLayer(activeLayer.id, { color: event.target.value })} /></label>
                </>}
                {activeLayer.behavior && !['artwork', 'narrative', 'programme-board'].includes(activeLayer.behavior) && <label className={styles.compactField}>
                  Label override<input value={activeLayer.title || ''} onChange={(event) => patchLayer(activeLayer.id, { title: event.target.value })} />
                </label>}
                {(activeLayer.kind === 'text' || activeLayer.part === 'items') && (
                  <>
                    {activeLayer.kind === 'text' ? <><textarea className={styles.textarea} aria-label="Layer text" value={activeLayer.text ?? ''}
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
                    </select></> : <p className={styles.note}>Applies to every programme time and activity. Edit the content in the event itinerary.</p>}
                    <div className={activeLayer.kind === 'text' ? undefined : styles.twoColumn}>
                      {activeLayer.kind !== 'text' && <label className={styles.compactField}>
                        <span>Colour</span>
                        <input type="color" value={activeLayer.color ?? '#4a3a32'}
                          onChange={(event) => patchLayer(activeLayer.id, { color: event.target.value })} />
                      </label>}
                      <label className={styles.compactField}>
                        <span>Align</span>
                        <select value={activeLayer.textAlign ?? 'center'}
                          onChange={(event) => patchLayer(activeLayer.id, { textAlign: event.target.value as CinematicWorldLayer['textAlign'] })}>
                          <option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option>
                        </select>
                      </label>
                    </div>
                    <CinematicFontPicker key={`${activeLayer.id}:${breakpoint}:text`} value={activeLayer.fontFamily ?? ''} defaultLabel="Template default"
                      onPreview={previewFont} onChange={(fontFamily) => patchLayer(activeLayer.id, { fontFamily })} />
                    <Slider label="Type size" value={activeLayer.fontSize ?? (activeLayer.part === 'items' ? .62 : 4)} min={.1} max={14} step={0.1}
                      onChange={(value) => patchLayer(activeLayer.id, { fontSize: value })} />
                    <Slider label="Weight" value={activeLayer.fontWeight ?? 600} min={100} max={900} step={100}
                      onChange={(value) => patchLayer(activeLayer.id, { fontWeight: value })} />
                    <Slider label="Spacing" value={activeLayer.letterSpacing ?? 0} min={-0.1} max={0.5} step={0.01}
                      onChange={(value) => patchLayer(activeLayer.id, { letterSpacing: value })} />
                    <Slider label="Line spacing" value={activeLayer.lineHeight ?? 1.05} min={.8} max={3} step={.05}
                      onChange={(lineHeight) => patchLayer(activeLayer.id, { lineHeight })} />
                    {activeLayer.kind === 'text' && <TextStyleEditor layer={activeLayer} onChange={(patch) => patchLayer(activeLayer.id, patch)} />}
                    {activeLayer.part === 'items' && <>
                      <Slider label="Row spacing" value={activeLayer.rowGap ?? .28} min={0} max={3} step={.05}
                        onChange={(rowGap) => patchLayer(activeLayer.id, { rowGap })} />
                      <Slider label="Column gap" value={activeLayer.columnGap ?? .4} min={0} max={3} step={.05}
                        onChange={(columnGap) => patchLayer(activeLayer.id, { columnGap })} />
                    </>}
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

                {(activeLayer.src || activeLayer.kind === 'img') && activeLayer.part !== 'frames' && (
                  <div className={styles.imageActions}>
                    <button type="button" className={styles.replaceButton} disabled={!onUploadImage || uploading}
                      onClick={() => chooseImage(activeLayer.id)}>{uploading ? 'Uploading…' : 'Replace image'}</button>
                  </div>
                )}
                {activeLayer.part === 'frames' && direction && onDirectionChange && <>
                  <p className={styles.note}>All frames share these settings and fill automatically with approved photos.</p>
                  {(['frames', 'columns', 'gap', 'tilt'] as const).map((key) => <Slider key={key}
                    label={({ frames: 'Frame count', columns: 'Columns', gap: 'Frame gap', tilt: 'Frame tilt' })[key]}
                    value={direction.theme.memory[key]} min={key === 'gap' ? 0 : key === 'tilt' ? -30 : 1}
                    max={key === 'frames' ? 24 : key === 'columns' ? 6 : 30} step={key === 'tilt' ? .1 : 1}
                    onChange={(value) => onDirectionChange({ ...direction, theme: { ...direction.theme, memory: { ...direction.theme.memory, [key]: value } } })} />)}
                </>}
                {activeLayer.parentId && activeLayer.kind !== 'text' && activeLayer.part !== 'items' && <>
                  <Slider label="Border" value={activeLayer.borderWidth ?? (activeLayer.part === 'frames' ? direction?.theme.memory.borderWidth ?? 5 : 0)} min={0} max={30} step={1}
                    onChange={(borderWidth) => patchLayer(activeLayer.id, { borderWidth })} />
                  <label className={styles.compactField}>Border colour<input type="color" value={activeLayer.borderColor || direction?.theme.memory.frameColor || '#d4a65f'}
                    onChange={(event) => patchLayer(activeLayer.id, { borderColor: event.target.value })} /></label>
                </>}

                <Slider label="Opacity" value={activeLayer.opacity} min={0} max={1} step={0.05}
                  onChange={(value) => patchLayer(activeLayer.id, { opacity: value })} />
                </div>
                <div role="tabpanel" id="object-animation-panel" aria-labelledby="object-animation-tab" hidden={inspectorTab !== 'animation'}>
                {canAnimateLayer?.(activeLayer) && <button type="button" className={styles.timingLinkButton}
                  onClick={() => onAnimateLayer?.(activeLayer)}>Animate asset</button>}
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
                {layerEffects && <details className={styles.timingEditor} key={`effects-${activeLayer.id}-${selectedTimingTrack ?? ''}`}
                    open={selectedTimingTrack && direction?.effects.some((effect) => effect.trackId === selectedTimingTrack && effect.targetId === activeLayer.id) ? true : undefined}>
                    <summary>Legacy layer effects</summary>
                    {layerEffects}
                  </details>}
                </div>
              </>
            ) : null}
          </div>
        </section>
      ) : null;

  return (
    <div className={styles.panel}>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
      <div className={styles.header}>
        <EditorActions key={breakpoint} label="Story actions" align="start">
          <ConfirmEditorAction label="Reset scene layout" description={`Reset all layer edits and remove added layers on ${breakpoint}. Camera framing and timing stay unchanged.`} onConfirm={onResetWorld} />
          <ConfirmEditorAction label="Reset all timing" description="Reset all appearance tracks, transitions and timing sets to the template defaults. Camera framing and layer placement stay unchanged." onConfirm={onResetVisibility} />
          <ConfirmEditorAction label="Reset entire story" description="Reset all cinematic layer and scene-set edits, added layers, beats, cameras and timing on both devices to the template defaults. Event details, guests and uploaded files are not deleted." disabled={!onResetSequence} onConfirm={() => onResetSequence?.()} />
        </EditorActions>
        <span className={styles.title}>Cinematic · {breakpoint}</span>
        <button className={styles.close} onClick={onClose} aria-label="Close">×</button>
      </div>

      <div ref={bodyRef} className={`${styles.body} ${mode === 'scene' ? styles.sceneBody : ''}`} hidden={sidebarTab !== 'editing'} role="tabpanel" id="cinematic-editing-panel" aria-labelledby="cinematic-editing-tab"
        onScroll={(event) => rememberScroll(scrollKey, event.currentTarget.scrollTop)}>
        <div className={styles.label}>Editing mode</div>
        <div className={styles.modeSwitch}>
          <button
            type="button"
            aria-pressed={mode === 'scene'}
            className={`${styles.modeButton} ${mode === 'scene' ? styles.modeActive : ''}`}
            onClick={() => onModeChange('scene')}
          >
            Scene
          </button>
          <button
            type="button"
            aria-pressed={mode !== 'scene'}
            className={`${styles.modeButton} ${mode !== 'scene' ? styles.modeActive : ''}`}
            onClick={() => {
              const target = mode === 'scene' ? sidebarPreferences.lastCameraMode : mode;
              // Returning at an in-between playhead must not silently jump to a saved keyframe.
              onModeChange(target === 'camera-beat' && Math.abs(progress - (activeBeat?.progress ?? progress)) > .0001
                ? 'camera-compose' : target);
            }}
          >
            Camera
          </button>
        </div>
        <p className={styles.modeNote}>
          {mode === 'scene'
            ? 'Scene mode will move the physical artwork without changing the camera.'
            : 'Camera mode changes the viewer’s framing without moving the physical artwork.'}
        </p>
        {mode !== 'scene' && <section aria-label="Camera beats">
          <div className={styles.label}>Cinematic beats</div>
          <select className={styles.field} aria-label="Camera beat" value={activeBeat?.id ?? ''} onChange={(event) => onSelectBeat(event.target.value)}>
            {beats.map((beat, index) => <option key={beat.id} value={beat.id}>{index + 1}. {beat.label} · {Math.round(beat.progress * 100)}%</option>)}
          </select>
          <div className={styles.beatStepper}>
            <button type="button" onClick={() => stepBeat(-1)} disabled={activeBeatIndex === 0}>← Previous</button>
            <span>{activeBeatIndex + 1} of {beats.length}</span>
            <button type="button" onClick={() => stepBeat(1)} disabled={activeBeatIndex === beats.length - 1}>Next →</button>
          </div>
        </section>}

        {mode !== 'scene' && camera && (
          <div className={`${styles.cameraEditor} ${mode === 'camera-compose' ? styles.cameraCompose : ''}`}>
            <div className={styles.cameraModeSwitch}>
              <button type="button" className={mode === 'camera-compose' ? styles.cameraModeActive : ''}
                onClick={() => onModeChange('camera-compose')}>Compose</button>
              <button type="button" className={mode === 'camera-beat' ? styles.cameraModeActive : ''}
                onClick={() => onModeChange('camera-beat')}>Edit beat</button>
            </div>
            <div className={styles.cameraHeader}>
              {cameraActions}
              <strong>{mode === 'camera-compose' ? 'Compose camera' : activeBeat?.label}</strong>
            </div>
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
            {onSceneSetAction && <SceneSetManager sets={availableSets} layers={layers}
              selectedId={sceneSetOpen ? selectedSceneSet : undefined} onSelect={selectSceneSet} onAction={onSceneSetAction} />}
            <section className={styles.layerBrowser} aria-label="Scene layer browser" data-active={timingSelectionMode || popover === 'add'}>
            <div ref={layerBrowserHeaderRef} className={styles.layerBrowserHeader}>
              <div className={styles.label}>Scene layers · front to back</div>
              <div className={styles.layerTools} role="toolbar" aria-label="Scene layer actions">
                <EditorActions label="Scene layer display">
                  <button type="button" disabled={availableSets.every((set) => collapsedSceneSets.includes(set.id))}
                    onClick={() => setCollapsedSceneSets(availableSets.map((set) => set.id))}>Collapse all scenes</button>
                  <button type="button" disabled={!collapsedSceneSets.length}
                    onClick={() => setCollapsedSceneSets([])}>Expand all scenes</button>
                </EditorActions>
                <button type="button" className={styles.layerToolButton} aria-label="Organize timing sets" title="Link layers to one appearance clip"
                  aria-pressed={timingSelectionMode} onClick={() => {
                    if (timingSelectionMode) { cancelTimingSelection(); return; }
                    setTimingSelectionMode(true);
                    setSelectedTimingLayers(selectedLayer ? [selectedLayer] : []);
                    setSelectedTimingSetId(undefined);
                    onSelectTimingTrack?.(undefined);
                  }}><Icon name="clock" size={16} /></button>
                <button type="button" className={styles.layerToolButton}
                  onClick={() => {
                    onSelectLayer(undefined);
                    setPopover((value) => value === 'add' ? null : 'add');
                  }}
                  aria-label="Add to scene" title="Add to scene"
                  aria-pressed={popover === 'add'}>
                  <Icon name="plus" size={16} />
                </button>
              </div>
            </div>
            <div className={styles.layerFilters} role="group" aria-label="Filter scene layers">
              {(['all', 'visible', 'hidden'] as const).map((filter) => <button key={filter} type="button"
                aria-pressed={layerFilter === filter} onClick={() => { revealedLayerRef.current = undefined; setLayerFilter(filter); }}>
                {filter === 'all' ? 'All' : filter === 'visible' ? 'Visible' : 'Hidden'}
                <span>{filter === 'all' ? editorLayers.length : filter === 'hidden' ? hiddenLayerIds.size : editorLayers.length - hiddenLayerIds.size}</span>
              </button>)}
            </div>
            <p className={styles.filterHint}>{timingSelectionMode
              ? 'Select at least two layers to share one entrance, hold, and exit on the timeline.'
              : 'Uses layer and set eye controls, not scroll timing.'}</p>
            {activeLayer && !matchesLayerFilter(activeLayer) && <button type="button" className={styles.returnInspector}
              onClick={() => { revealedLayerRef.current = undefined; setLayerFilter('all'); }}>Show selected layer · {activeLayer.label}</button>}
            <div className={styles.layers} aria-label="Scene layers">
              {!groupedLayers.length && <p className={styles.note} role="status">No {layerFilter === 'all' ? '' : `${layerFilter} `}layers.</p>}
              {groupedLayers.map(({ group, layers: groupLayers, visibility }) => {
                const visibleNow = !visibility || cinematicSetOpacity(progress, visibility) > 0.08;
                const groupTrack = tracks.find((track) =>
                  track.target.type === 'group' && track.target.id === group);
                const source = editorLayers.find((layer) => layer.id === draggedSetLayer);
                const destination = setById.get(group);
                const canDrop = Boolean(onSceneSetAction && source && destination && !destination.locked &&
                  source.group !== destination.id && source.space === destination.space);
                const memberRootId = (layer: CinematicWorldLayer) => cinematicAncestors(layer, editorLayers).at(-1)?.id ?? layer.id;
                const tree = cinematicLayerTree(groupLayers);
                const rows = tree.filter(({ layer }) => matchesLayerFilter(layer) &&
                  (layerFilter !== 'all' || !cinematicAncestors(layer, editorLayers).some((parent) => collapsedLayers.has(parent.id))));
                const renderRow = (layer: CinematicWorldLayer, depth: number, checkbox?: (id: string, label: string) => ReactNode) => (
                  <div
                    key={layer.id}
                    ref={layer.id === selectedLayer ? selectedRowRef : undefined}
                    data-scene-layer={layer.id}
                    draggable={Boolean(onSceneSetAction && !layer.parentId && !layer.locked && !setById.get(group)?.locked)}
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', layer.id);
                      setDraggedSetLayer(layer.id);
                    }}
                    onDragEnd={() => setDraggedSetLayer(undefined)}
                    style={{ paddingLeft: `${6 + depth * 14}px` }}
                    className={`${styles.layerRow} ${layer.id === selectedLayer ? styles.layerRowActive : ''} ${selectedTimingLayers.includes(layer.id) ? styles.layerRowChecked : ''}`}
                  >
                    {checkbox?.(layer.id, layer.label)}
                    {!checkbox && timingSelectionMode && (
                      <input type="checkbox" className={styles.layerCheck}
                        checked={selectedTimingLayers.includes(layer.id)}
                        onChange={() => toggleTimingLayer(layer.id)}
                        aria-label={`Include ${layer.label} in timing set`} />
                    )}
                    {layerFilter === 'all' && editorLayers.some((child) => child.parentId === layer.id) && <button type="button" className={`${styles.iconButton} ${styles.layerDisclosure}`}
                      aria-label={`${collapsedLayers.has(layer.id) ? 'Expand' : 'Collapse'} ${layer.label}`}
                      aria-expanded={!collapsedLayers.has(layer.id)}
                      onClick={() => setCollapsedLayers((current) => { const next = new Set(current); if (next.has(layer.id)) next.delete(layer.id); else next.add(layer.id); return next; })}>
                      <Icon name={collapsedLayers.has(layer.id) ? 'chevron-right' : 'chevron-down'} size={18} />
                    </button>}
                    <button type="button" className={styles.layerName} aria-pressed={layer.id === selectedLayer}
                      aria-current={layer.id === selectedLayer ? 'true' : undefined} onClick={() => selectLayer(layer)}>
                      {layer.label}
                      <small>{timingSourceLabel(layer)}</small>
                    </button>
                    <button type="button" className={styles.iconButton}
                      aria-label={`Seek to ${layer.label}`} title="Go to appearance" onClick={() => goToAppearance(layer)}>
                      <Icon name="crosshair" size={15} />
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
                );
                const setLabel = destination?.label ?? group;
                const expanded = !collapsedSceneSets.includes(group);
                const expand = () => setCollapsedSceneSets((current) => current.filter((id) => id !== group));
                const renderHeader = (actions?: ReactNode) => (
                  <div className={styles.sceneLayerHeader}>
                    <button type="button" className={`${styles.iconButton} ${styles.layerDisclosure}`}
                      aria-label={`${expanded ? 'Collapse' : 'Expand'} ${setLabel}`} aria-expanded={expanded}
                      onClick={() => expanded ? setCollapsedSceneSets((current) => [...current, group]) : expand()}>
                      <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={16} />
                    </button>
                    <button type="button" className={styles.layerGroupHeader}
                      disabled={!groupTrack}
                      aria-label={`Edit ${setLabel} timing`}
                      aria-description={visibleNow ? 'Appearance timing active at playhead' : 'Appearance timing inactive at playhead'}
                      onClick={() => {
                        if (!groupTrack) return;
                        setSelectedLayerGroup(undefined);
                        setSelectedTimingSetId(groupTrack.id);
                        onSelectTimingTrack?.(groupTrack.id);
                      }}>
                      <span className={`${styles.setDot} ${visibleNow ? styles.setDotActive : ''}`}
                        title={visibleNow ? 'Appearance timing active at playhead' : 'Appearance timing inactive at playhead'} />
                      <span>{setLabel}</span>
                      <small>{groupLayers.filter(matchesLayerFilter).length}</small>
                    </button>
                    {actions}
                  </div>
                );
                return (
                  <section key={group} className={styles.layerGroup} data-drop-target={canDrop || undefined}
                    onDragOver={canDrop ? (event) => event.preventDefault() : undefined}
                    onDrop={canDrop && source ? (event) => {
                      event.preventDefault();
                      onSceneSetAction?.({ type: 'move-layer', layerId: source.id, setId: group });
                      setDraggedSetLayer(undefined);
                    } : undefined}>
                    {destination && onSceneSetAction && (
                      <CinematicLayerGroups key={breakpoint} set={destination} breakpoint={breakpoint}
                        layers={layers.filter((layer) => layer.group === group && editorLayers.some((editorLayer) => editorLayer.id === layer.id))} onAction={onSceneSetAction}
                        renderHeader={renderHeader} expanded={expanded} onExpand={expand}
                        renderRows={(ids, nested, checkbox) => {
                          const members = new Set(ids);
                          const candidates = checkbox && layerFilter !== 'all' ? tree : rows;
                          return candidates.filter(({ layer }) => members.has(memberRootId(layer)) === nested)
                            .map(({ layer, depth }) => renderRow(layer, depth + Number(nested), checkbox));
                        }}
                        seekForMembers={(ids) => {
                          const setTrack = tracks.find((item) => item.id === destination.timingTrackId) ?? groupTrack;
                          const track = setTrack ?? groupLayers.filter((layer) => ids.includes(layer.id))
                            .map((layer) => {
                              const timing = resolveCinematicLayerTiming(layer.id, layer.group, tracks, layer.timingTrackId, layers);
                              return timing.exact ?? timing.inherited;
                            }).find(Boolean);
                          return track ? () => seekToAppearance(track) : undefined;
                        }}
                        selectedId={activeGroup && groupSet?.id === group ? activeGroup.id : undefined}
                        onSelect={(groupId) => {
                          setPopover(null);
                          onSelectLayer(undefined);
                          onSelectTimingTrack?.(undefined);
                          setSelectedTimingSetId(undefined);
                          setGroupTab('layout');
                          setSelectedLayerGroup({ setId: group, groupId, breakpoint });
                        }} />
                    )}
                    {(!destination || !onSceneSetAction) && <>
                      {renderHeader()}
                      {expanded && rows.map(({ layer, depth }) => renderRow(layer, depth))}
                    </>}
                  </section>
                );
              })}
            </div>

            {timingSelectionMode && (
              <div className={styles.timingSelectionBar}>
                <div>
                  <strong>{selectedTimingLayers.length} selected</strong>

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



            </section>
          </>
        )}

      </div>
      {sidebarTab === 'editing' && mode === 'scene' && (sceneSetInspector || groupInspector || inspector || selectedTimingSet) && (
        <div ref={floatingRef} className={styles.floatingInspector} aria-label="Floating adjustment window"
          onScroll={(event) => rememberScroll(floatingScrollKey, event.currentTarget.scrollTop)}>
          {sceneSetInspector || (showTimingInspector ? timingInspector : groupInspector ?? inspector ?? timingInspector)}
        </div>
      )}
      {direction && onDirectionChange && <>
        <div ref={advancedBodyRef} className={styles.body} hidden={sidebarTab !== 'advanced'} role="tabpanel" id="cinematic-advanced-panel" aria-labelledby="cinematic-advanced-tab"
          onScroll={(event) => rememberScroll('advanced', event.currentTarget.scrollTop)}>
          <DirectorSettings standalone effectScope="__world" value={direction} onChange={onDirectionChange}
            breakpoint={breakpoint} layers={layers} sets={availableSets} beats={beats.map((beat, order) => ({ id: beat.id, label: beat.label, at: beat.progress, order, transitionIn: beat.transitionIn }))}
            tracks={tracks} onPreview={(id) => {
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
