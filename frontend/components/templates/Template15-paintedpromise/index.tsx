'use client';
import { useTimeouts } from '@/components/templates/_shared/hooks/useTimeouts';
import { configValue } from '@/components/templates/configValue';
import type { TemplateRsvpSubmission, PhotoUploadSubmission } from '@/components/templates/guestContracts';

import { useDialogBehavior } from '../_shared/hooks/useDialogBehavior';
import TemplateNav, { type NavLayout } from '../_shared/nav/TemplateNav';
import { MusicSlot } from '../_shared/slots/ChromeSlots';
import { CINEMATIC_INTERACTION_OPACITY, resolveCinematicScrollStops } from '../_shared/cinematic/scrollStops';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Wedding, Wish, Photo, ItineraryItem, SeatingTable, CreateWish } from '@/lib/api';
import type { EditorHandle, Layer, SlotProps } from '../_shared/types';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { fontVar } from '@/lib/fonts/registry';
import { useBreakpoint } from '../_shared/hooks/useBreakpoint';
import { SlotFlowProviders } from '../_shared/slots/FlowProviders';
import { SLOT_REGISTRY } from '../_shared/slots';
import { EngineProvider } from '../_shared/engine';
import SheetHost from '../_shared/SheetHost';
import { sampleCamera, useCinematicScroll } from '../_shared/cinematic/useCinematicScroll';
import CinematicSceneLayers, { type CinematicLayerDecoration } from '../_shared/cinematic/CinematicSceneLayers';
import ReceptionProp from './ReceptionProp';
import { PAINTED_PROMISE_RECEPTION, RECEPTION_SPRITES, receptionPose, receptionPositionCorrection } from './data/reception';
import CinematicPart from '../_shared/cinematic/CinematicPart';
import { resolveCinematicScene, type CinematicSceneEntry } from '../_shared/cinematic/scene';
import CinematicCameraSurface from '../_shared/cinematic/CinematicCameraSurface';
import { resolveCinematicCamera } from '../_shared/cinematic/cameraLayout';
import { resolveCinematicWorld } from '../_shared/cinematic/world';
import { assetAnchorTarget, assetClipPosition, assetPoseBlur, assetPoseClip, keyframeTime, sampleAssetKeyframes, sampleTextGlitch, resolveAssetPose, type AssetAnchorFrame, type AssetAnchorOption, type AssetAnchorOffset, type ResolveAssetAnchor } from '../_shared/cinematic/assetKeyframes';
import { sampleAssetAnimations } from '../_shared/cinematic/assetAnimations';
import { cinematicEffectGroup, cinematicGroupAnimationTarget, fitCinematicComposition, resolveCinematicSceneSets, type CinematicCompositionFrame } from '../_shared/cinematic/sceneSets';
import { resolveCinematicProjectConfig } from '../_shared/cinematic/project';
import { promoteLegacyCinematicVisibilityTracks, resolveCinematicVisibility } from '../_shared/cinematic/visibility';
import { beatsFromSequence, resolveCinematicSequence, resolveCinematicTrackClip, visibilityFromSequence } from '../_shared/cinematic/sequence';
import { cinematicPacingNodes, mapCinematicProgress, resolveCinematicDirection, sampleCinematicEffects } from '../_shared/cinematic/direction';
import { useDirectedInteractions } from '../_shared/cinematic/useDirectedInteractions';
import { cinematicRichHtml, renderCinematicFunction } from '../_shared/cinematic/functionalLayers';
import { PAINTED_PROMISE_CAMERA, PAINTED_PROMISE_SCENE_SETS, PAINTED_PROMISE_SEQUENCE, PAINTED_PROMISE_WORLD } from './data/cinematic';
import { PAINTED_PROMISE_DIRECTION } from './data/direction';
import styles from './Template15.module.css';
import ProgrammePopup from './ProgrammePopup';

const ROOT = '/templates/painted-promise/assets';
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';
const sheetLayer = (id: string, slot: string, sheetId: string, z: number): Layer => ({
  id, kind: 'slot', slot, presentation: 'sheet', sheetId, x: 50, y: 50, w: 80, h: 40, s: 1, z, order: 0, chain: false, hidden: false, opacity: 1,
});
const SHEETS = {
  rsvp: [sheetLayer('rsvp-form', 'rsvpForm', 'rsvp', 2), sheetLayer('rsvp-seating', 'rsvpSeating', 'rsvp', 1)],
  wish: [sheetLayer('wish-form', 'wishForm', 'wish', 2), sheetLayer('wish-photo', 'wishPhoto', 'wish', 1)],
};
interface Props {
  wedding: Wedding; onRSVP: (data: TemplateRsvpSubmission) => Promise<void>; onSubmitWish: (data: CreateWish) => Promise<void>;
  onUploadPhoto?: (data: PhotoUploadSubmission) => Promise<void>; wishes: Wish[]; photos: Photo[]; photoBoothEnabled: boolean;
  seatingEnabled?: boolean; tables?: SeatingTable[]; customConfig?: Record<string, string>;
  itinerary?: ItineraryItem[]; editor?: EditorHandle;
}
export default function Template15(props: Props) {
  return <SlotFlowProviders><EngineProvider value={{ assetRoot: ROOT, assetSizes: {}, slotRegistry: SLOT_REGISTRY }}><PaintedPromise {...props} /></EngineProvider></SlotFlowProviders>;
}

function PaintedPromise({ wedding, onRSVP, onSubmitWish, onUploadPhoto, wishes, photos, photoBoothEnabled,
  seatingEnabled = false, tables = [], customConfig, itinerary = [], editor }: Props) {
  const schedule = useTimeouts();
  const reduced = useReducedMotion();
  const breakpoint = useBreakpoint(editor?.enabled ? editor.breakpoint : undefined);
  const viewportRef = useRef<HTMLElement>(null);
  const [measuredViewport, setMeasuredViewport] = useState<CinematicCompositionFrame>();
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const measure = () => {
      const { clientWidth: width, clientHeight: height } = viewport;
      if (width > 0 && height > 0) {
        setMeasuredViewport((current) => current?.width === width && current.height === height ? current : { width, height });
      }
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);
  const editing = Boolean(editor?.enabled);
  const cinematicConfig = useMemo(() => resolveCinematicProjectConfig('t15', customConfig).config, [customConfig]);
  const direction = useMemo(() => resolveCinematicDirection('t15', PAINTED_PROMISE_DIRECTION, customConfig), [customConfig]);
  const sequence = useMemo(() => resolveCinematicSequence('t15', PAINTED_PROMISE_SEQUENCE, cinematicConfig).sequence, [cinematicConfig]);
  const beats = useMemo(() => beatsFromSequence(sequence), [sequence]);
  const pacing = useMemo(() => cinematicPacingNodes(sequence.beats, direction.pacing, breakpoint, PAINTED_PROMISE_SEQUENCE.beats.length), [sequence.beats, direction.pacing, breakpoint]);
  const authoredLayers = useMemo(() => resolveCinematicWorld('t15', PAINTED_PROMISE_WORLD, breakpoint, cinematicConfig,
    { frames: direction.theme.memory.frames, programmeItems: itinerary.length }), [breakpoint, cinematicConfig, direction.theme.memory.frames, itinerary.length]);
  const fontPreview = editing ? editor?.cinematic?.fontPreview : undefined;
  const layers = useMemo(() => fontPreview ? authoredLayers.map((layer) => layer.id === fontPreview.layerId
    ? { ...layer, fontFamily: fontPreview.fontFamily } : layer) : authoredLayers, [authoredLayers, fontPreview]);
  const sceneSets = useMemo(() => resolveCinematicSceneSets('t15', PAINTED_PROMISE_SCENE_SETS, cinematicConfig).sceneSets, [cinematicConfig]);
  const tracks = useMemo(() => promoteLegacyCinematicVisibilityTracks(sequence.tracks, resolveCinematicVisibility(
    't15', visibilityFromSequence(sequence), breakpoint, cinematicConfig,
  )), [sequence, breakpoint, cinematicConfig]);
  const tracksById = useMemo(() => new Map(tracks.map((track) => [track.id, track])), [tracks]);
  const scrollStops = useMemo(() => editing ? [] : resolveCinematicScrollStops(
    direction.pacing.stops, direction.interactions, tracks, authoredLayers, sceneSets, breakpoint,
  ).flatMap(({ stop, at, active }) => active ? [{ ...stop, story: at, at: mapCinematicProgress(at, pacing.points, true) }] : []),
  [editing, direction, tracks, authoredLayers, sceneSets, breakpoint, pacing]);
  const { rootRef, progress: rawProgress, seek: rawSeek } = useCinematicScroll<HTMLDivElement>(reduced, scrollStops);
  const progress = editing && editor?.cinematic ? editor.cinematic.progress
    : scrollStops.find(({ at }) => at === rawProgress)?.story ?? mapCinematicProgress(rawProgress, pacing.points);
  const seek = (target: number) => rawSeek(mapCinematicProgress(target, pacing.points, true));
  const cameraLayout = useMemo(() => resolveCinematicCamera('t15', PAINTED_PROMISE_CAMERA, beats, breakpoint, cinematicConfig), [beats, breakpoint, cinematicConfig]);
  const camera = editing && editor?.cinematic?.cameraOverride ? editor.cinematic.cameraOverride : sampleCamera(progress, cameraLayout.timeline);
  const interaction = useDirectedInteractions({ definitions: direction.interactions, tracks, beats: sequence.beats, progress, seek, editing });
  const effectPose = editing ? editor?.cinematic?.effectPose : undefined;
  const effects = useMemo(() => sampleCinematicEffects(direction.effects, tracks, progress, breakpoint, effectPose), [direction.effects, tracks, progress, breakpoint, effectPose]);
  const poseEdit = editing ? editor?.cinematic?.assetPoseEdit : undefined;
  const scene = resolveCinematicScene({ layers, sceneSets, tracks, progress, breakpoint, assetPoseEdit: poseEdit,
    reducedMotion: reduced, groupEffects: !reduced || effectPose ? effects.groups : undefined, behaviors: {
    background: (set) => tracksById.get(set.definition.timingTrackId ?? '')?.kind === 'effect' ? { opacity: 1, xVw: 0, yVh: 0, scale: 1 } : {},
  } });
  const setPresentation = new Map(scene.sets.map((set) => [set.definition.id, set.presentation.opacity]));
  for (const record of direction.interactions) {
    const phase = interaction.phase(record.id);
    if (!record.enabled || (phase !== 'closing' && phase !== 'dismissed') || record.returnMode !== 'scene') continue;
    const availability = tracksById.get(record.availabilityTrackId);
    const returnActive = !record.availabilityTrackId || Boolean(availability && progress < resolveCinematicTrackClip(availability, tracksById).end);
    if (returnActive) record.returnSetIds.forEach((id) => setPresentation.set(id, 1));
    const surface = Math.max(0, ...record.returnSetIds.map((id) => setPresentation.get(id) ?? 0));
    record.revealSetIds.forEach((id) => setPresentation.set(id, Math.max(setPresentation.get(id) ?? 0, surface)));
  }
  const receptionTable = PAINTED_PROMISE_RECEPTION
    ? scene.entries.find(({ layer }) => layer.id === 'reception-table' && !layer.hidden)
    : undefined;
  const receptionProps = new Map(scene.entries.flatMap((entry) => {
    const { id, behavior, space } = entry.layer;
    if (!PAINTED_PROMISE_RECEPTION || space !== 'viewport' || entry.layer.parentId) return [];
    const kind = id === 'rsvp-letter' && behavior === 'rsvp-envelope' ? 'rsvp-guest-book'
      : receptionTable && id === 'wishes-book' && behavior === 'guest-book' ? 'wishes-envelope' : undefined;
    const track = kind && tracksById.get(entry.sceneSet.timingTrackId ?? entry.sceneSet.id);
    return kind && track ? [[id, { kind, clip: resolveCinematicTrackClip(track, tracksById) }] as const] : [];
  }));
  const tableLayer = receptionTable?.layer;
  const tablePresentation = scene.sets.find((set) => set.definition.id === receptionTable?.sceneSet.id)?.presentation;
  const tableTrack = tracksById.get(receptionTable?.sceneSet.timingTrackId ?? receptionTable?.sceneSet.id ?? '');
  const tableExit = receptionTable?.sceneSet.exit ?? tableTrack?.exit;
  const tableTiming = tableTrack && resolveCinematicTrackClip(tableTrack, tracksById);
  const cameraFrame = (view: typeof camera, world: typeof effects.world) => ({
    x: view.x + world.xVw + world.x, y: view.y + world.yVh + world.y,
    scale: view.scale * world.scale, rotate: view.rotate + world.rotate,
  });
  const liveFrame = cameraFrame(camera, effects.world);
  const storyCameraFrame = (at: number) => cameraFrame(sampleCamera(at, cameraLayout.timeline),
    sampleCinematicEffects(direction.effects, tracks, at, breakpoint, effectPose).world);
  // Keep the table and its props in the same departure frame while the camera moves on.
  const tableDeparture = (tableExit?.kind === 'slide' || tableExit?.kind === 'fade-slide') ? tableTiming : undefined;
  const departureFrameAt = (at: number) => tableDeparture && at > tableDeparture.exitStart && at <= tableDeparture.end
    ? storyCameraFrame(tableDeparture.exitStart) : undefined;
  const departureFrame = departureFrameAt(progress);
  const receptionFrame = departureFrame ?? liveFrame;
  const departureTransform = departureFrame && [
    `rotate(${-liveFrame.rotate}deg)`, `scale(${1 / liveFrame.scale})`,
    `translate(calc(var(--fvw, 100vw) * ${(departureFrame.x - liveFrame.x) / 100}), calc(var(--fsvh, 100svh) * ${(departureFrame.y - liveFrame.y) / 100}))`,
    `scale(${departureFrame.scale})`, `rotate(${departureFrame.rotate}deg)`,
  ].join(' ');
  const tableSlideX = tablePresentation?.xVw ?? 0;
  const tableSlideY = tablePresentation?.yVh ?? 0;
  const tableOpacity = receptionTable
    ? (setPresentation.get(receptionTable.sceneSet.id) ?? receptionTable.presentation.opacity) * receptionTable.layer.opacity : 0;
  scene.entries = scene.entries.map((entry) => {
    const independent = Boolean(entry.layer.timingTrackId || tracks.some((track) => track.target.type === 'layer' && track.target.id === entry.layer.id));
    const record = interaction.recordFor(entry.layer);
    const dismissed = record && interaction.phase(record.id) === 'dismissed' && record.returnMode !== 'stay';
    if (receptionTable && receptionProps.has(entry.layer.id)) {
      // Reception props use Layout Width throughout the table sequence.
      return { ...entry, presentation: { ...entry.presentation, opacity: tableOpacity, scale: 1 } };
    }
    return { ...entry, presentation: { ...entry.presentation, opacity: entry.layer.parentId ? entry.presentation.opacity : dismissed ? 0 : independent
      ? entry.presentation.opacity : setPresentation.get(entry.sceneSet.id) ?? entry.presentation.opacity } };
  });
  const infoRef = useRef<HTMLElement>(null);
  useDialogBehavior(infoRef, Boolean(interaction.info), interaction.dismissInfo, true, false);
  const t = useCallback((key: string, fallback: string) => configValue(customConfig, key, fallback), [customConfig]);
  const submitRsvp = async (data: TemplateRsvpSubmission) => { await onRSVP(data); schedule(interaction.close, 1100); };
  const slotProps: SlotProps = { wedding, t, wishes, photos, tables, itinerary, seatingEnabled, photoBoothEnabled,
    onRSVP: submitRsvp, onSubmitWish, onUploadPhoto, editing: false, config: customConfig, breakpoint };
  const decorations: Record<string, CinematicLayerDecoration> = Object.create(null);
  const entriesById = new Map(scene.entries.map((entry) => [entry.layer.id, entry]));
  const viewport = measuredViewport ?? (editor?.frame && { width: editor.frame.w, height: editor.frame.svh });
  const ratio = viewport ? viewport.width / viewport.height : breakpoint === 'mobile' ? .5 : 1.6;
  const compositions = new Map(sceneSets.flatMap((set) => {
    const reference = set.referenceFrames?.[breakpoint];
    return reference && viewport ? [[set.id, fitCinematicComposition(reference, viewport)] as const] : [];
  }));
  const layerRatio = (entry: CinematicSceneEntry) => {
    const composition = compositions.get(entry.sceneSet.id);
    return composition ? composition.width / composition.height : ratio;
  };
  const isReceptionScenery = (entry: CinematicSceneEntry) => receptionTable && entry.layer.space === 'world' &&
    (entry.sceneSet.id === receptionTable.sceneSet.id || entry.sceneSet.id === 'table-wishes');
  const rotateScale = ({ x, y }: AssetAnchorOffset, scale: number, rotate: number, aspect = ratio) => {
    const r = rotate * Math.PI / 180;
    return { x: scale * (x * Math.cos(r) - y * Math.sin(r) / aspect),
      y: scale * (x * aspect * Math.sin(r) + y * Math.cos(r)) };
  };
  const mapPoint = ({ x, y }: AssetAnchorOffset, origin: AssetAnchorOffset, translation: AssetAnchorOffset,
    scale: number, rotate: number, inverse: boolean, aspect = ratio) => {
    const offset = rotateScale({
      x: x - origin.x - (inverse ? translation.x : 0),
      y: y - origin.y - (inverse ? translation.y : 0),
    }, inverse ? 1 / scale : scale, inverse ? -rotate : rotate, aspect);
    return { x: origin.x + offset.x + (inverse ? 0 : translation.x),
      y: origin.y + offset.y + (inverse ? 0 : translation.y) };
  };
  const mapLayerPoint = (point: AssetAnchorOffset, entry: CinematicSceneEntry, inverse = false) => {
    const group = entry.groupTransform;
    const frame = isReceptionScenery(entry) ? receptionFrame : liveFrame;
    const world = (p: AssetAnchorOffset) => entry.layer.space === 'world'
      ? mapPoint(p, { x: 50, y: 56 }, frame, frame.scale, frame.rotate, inverse) : p;
    const composition = compositions.get(entry.sceneSet.id);
    const composed = ({ x, y }: AssetAnchorOffset) => {
      if (!composition || !viewport) return { x, y };
      const sx = composition.width / viewport.width, sy = composition.height / viewport.height;
      return { x: 50 + (x - 50) * (inverse ? 1 / sx : sx), y: 50 + (y - 50) * (inverse ? 1 / sy : sy) };
    };
    const grouped = (p: AssetAnchorOffset) => group
      ? mapPoint(p, { x: group.centerX, y: group.centerY },
        { x: group.x + group.slideX + (group.frameX ?? 0), y: group.y + group.slideY + (group.frameY ?? 0) },
        group.scale, group.rotate, inverse, layerRatio(entry)) : p;
    return inverse ? grouped(composed(world(point))) : world(composed(grouped(point)));
  };
  const anchorDependencies = (id: string) => {
    const keyframes = entriesById.get(id)?.layer.keyframes ?? [];
    const anchors = keyframes.map(({ pose }) => pose.anchor);
    if (poseEdit?.layerId === id) anchors.push(poseEdit.pending?.anchor);
    const ids = anchors.map(assetAnchorTarget).filter((id): id is string => Boolean(id));
    if (receptionTable && receptionProps.has(id)) ids.push(receptionTable.layer.id);
    return ids;
  };
  const dependsOn = (id: string, sourceId: string, seen = new Set<string>()): boolean => {
    if (id === sourceId) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return anchorDependencies(id).some((target) => dependsOn(target, sourceId, seen));
  };
  const decorate = (entry: CinematicSceneEntry) => {
    if (decorations[entry.layer.id]) return;
    const record = interaction.recordFor(entry.layer);
    const motion = effects.layers.get(entry.layer.id);
    const { layer, presentation } = entry;
    const editingPose = poseEdit?.layerId === layer.id ? poseEdit : undefined;
    const hasKeyframes = Boolean(layer.keyframes?.length);
    const clip = (hasKeyframes || editingPose) ? assetPoseClip(layer, tracks, layers) : undefined;
    const poseProgress = reduced && !editing && clip && progress >= clip.enterEnd && progress <= clip.exitStart
      ? clip.enterEnd : progress;
    const clipAt = clip ? assetClipPosition(poseProgress, clip) : 0;
    // Match the animator ruler's precision so selecting a keyframe shows its saved anchor.
    const at = editingPose ? keyframeTime(clipAt) : clipAt;
    const animation = !hasKeyframes && entry.layer.animations?.length ? sampleAssetAnimations(entry.layer, tracks, progress, layers) : undefined;
    const renderPart = (part: string, element: Parameters<typeof CinematicPart>[0]['element']) => (
      <CinematicPart rootId={entry.layer.id} part={part} element={element}
        entries={scene.entries} decorations={decorations} editor={editor} slotProps={slotProps}
        boxClassName={styles.sceneLayer} imageClassName={styles.sceneLayerImage}
        selectedClassName={styles.sceneLayerSelected} resizeHandleClassName={styles.sceneResizeHandle} />
    );
    const phase = record ? interaction.phase(record.id) : 'ready';
    const available = Boolean(record && interaction.available(record) && phase === 'ready' && entry.presentation.opacity > CINEMATIC_INTERACTION_OPACITY);
    const fire = () => { if (record) interaction.trigger(record); };
    const reception = receptionProps.get(entry.layer.id);
    const tableEntry = receptionTable && entriesById.get(receptionTable.layer.id);
    const composedDock = reception && tableEntry &&
      (compositions.has(entry.sceneSet.id) || compositions.has(tableEntry.sceneSet.id));
    const receptionSlide = (() => {
      if (!reception) return { x: 0, y: 0 };
      if (!composedDock || !tableEntry) {
        return rotateScale({ x: tableSlideX, y: tableSlideY }, receptionFrame.scale, receptionFrame.rotate);
      }
      const origin = mapLayerPoint(mapLayerPoint({ x: 50, y: 56 }, tableEntry), entry, true);
      const shifted = mapLayerPoint(mapLayerPoint({ x: 50 + tableSlideX, y: 56 + tableSlideY }, tableEntry), entry, true);
      return { x: shifted.x - origin.x, y: shifted.y - origin.y };
    })();
    const resolveLayerAnchor: ResolveAssetAnchor = (anchor) => {
      const id = assetAnchorTarget(anchor);
      const target = id ? entriesById.get(id) : undefined;
      if (!target || target.layer.parentId || layer.parentId || dependsOn(target.layer.id, layer.id)) return;
      const pointId = anchor.startsWith('point:') ? anchor.split(':')[2] : undefined;
      const marker = target.layer.anchorPoints?.find((point) => point.id === pointId);
      if (pointId && !marker) return;
      decorate(target);
      const visual = decorations[target.layer.id];
      const ambient = visual.ambient;
      const geometry = target.layer;
      const group = target.groupTransform;
      const transition = visual.suppressTransition ? undefined : target.presentation;
      const aspect = layerRatio(target);
      const imageHeight = geometry.w * aspect / (marker?.aspectRatio ?? geometry.aspectRatio ?? 1);
      const boxHeight = geometry.h ?? imageHeight;
      let markerOffset = { x: 0, y: 0 };
      if (marker) {
        const fit = geometry.fit ?? 'contain';
        const heightScale = boxHeight / imageHeight;
        const fitScale = fit === 'cover' ? Math.max(1, heightScale) : fit === 'contain' ? Math.min(1, heightScale) : 1;
        const artworkHeight = fit === 'fill' ? boxHeight : imageHeight * fitScale;
        markerOffset = rotateScale({
          x: (marker.x - .5) * geometry.w * fitScale * (geometry.flipX ? -1 : 1),
          y: (marker.y - .5) * artworkHeight,
        }, (ambient?.scale ?? 1) * (transition?.scale ?? 1), geometry.rotation + (ambient?.rotate ?? 0), aspect);
      }
      const localCenter = {
        x: geometry.x + markerOffset.x + (ambient?.xVw ?? 0) + (ambient?.x ?? 0) * geometry.w / 100 +
          (transition ? transition.xVw - (group?.slideX ?? 0) : 0),
        y: geometry.y + markerOffset.y + (ambient?.yVh ?? 0) +
          (ambient?.y ?? 0) * boxHeight / 100 +
          (transition ? transition.yVh - (group?.slideY ?? 0) : 0),
      };
      const inFollowerSpace = (point: AssetAnchorOffset) => mapLayerPoint(mapLayerPoint(point, target), entry, true);
      const point = inFollowerSpace(localCenter);
      const axis = rotateScale({ x: 1, y: 0 }, (ambient?.scale ?? 1) * (transition?.scale ?? 1),
        geometry.rotation + (ambient?.rotate ?? 0), aspect);
      const tip = inFollowerSpace({ x: localCenter.x + axis.x, y: localCenter.y + axis.y });
      const followerAspect = layerRatio(entry);
      const horizontal = (tip.x - point.x) * followerAspect;
      const vertical = tip.y - point.y;
      const sharesGroup = entry.sceneSet.id === target.sceneSet.id && entry.groupTransform === group;
      const groupBlur = sharesGroup ? 0 : group?.blur;
      const inheritedWorldBlur = target.layer.space === 'world' && layer.space !== 'world' ? effects.world.blur : 0;
      return { x: point.x - layer.x - receptionSlide.x, y: point.y - layer.y - receptionSlide.y,
        transform: { scale: Math.hypot(horizontal, vertical) / followerAspect,
          rotate: Math.atan2(vertical, horizontal) * 180 / Math.PI },
        aspect: followerAspect, blur: Math.hypot(ambient?.blur ?? 0, groupBlur ?? 0, inheritedWorldBlur),
      };
    };
    const anchorOptions = (resolve: ResolveAssetAnchor, legacy?: AssetAnchorFrame): AssetAnchorOption[] =>
      scene.entries.flatMap((target): AssetAnchorOption[] => {
        if (target.layer.hidden || target.layer.parentId) return [];
        const choices: Pick<AssetAnchorOption, 'id' | 'label'>[] = [
          { id: `layer:${target.layer.id}`, label: target.layer.label },
          ...(target.layer.anchorPoints ?? []).map(({ id, label }) => ({
            id: `point:${target.layer.id}:${id}` as const, label: `${target.layer.label} · ${label}`,
          })),
        ];
        return choices.flatMap((choice) => {
          const offset = resolve(choice.id);
          return offset ? [{ ...choice, ...offset }] : [];
        });
      }).concat(legacy ? [{ id: 'table', label: 'Reception table dock', ...legacy }] : []);
    if (reception) {
      const pose = receptionPose(progress, reception.clip, reduced);
      const sprite = RECEPTION_SPRITES[reception.kind];
      const docked = 1 - pose.lift;
      const contactOffset = layer.w * layerRatio(entry) * sprite.height / sprite.width * .4;
      let tableAnchor: AssetAnchorFrame = { x: 0, y: 0 };
      let correction = { x: 0, y: 0, xVw: 0, yVh: 0 };
      if (receptionTable) {
        const { layer: table, presentation: tableMotion } = receptionTable;
        const worldScale = receptionFrame.scale;
        const radians = receptionFrame.rotate * Math.PI / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        decorate(entriesById.get(table.id)!);
        const tableDecoration = decorations[table.id];
        const tableMotionOffset = tableDecoration.ambient;
        const tableScale = tableDecoration.suppressTransition ? tableMotionOffset?.scale ?? 1 : 1;
        const tableRadians = tableDecoration.suppressTransition ? (table.rotation + (tableMotionOffset?.rotate ?? 0)) * Math.PI / 180 : 0;
        const seatX = table.w * (reception.kind === 'rsvp-guest-book' ? -.22 : .22);
        const tableAspect = composedDock && tableEntry ? layerRatio(tableEntry) : ratio;
        const seatY = -table.w * tableAspect * .18;
        const localX = table.x - 50 + ((tableDecoration.suppressTransition ? tableMotionOffset?.xVw ?? 0 : tableMotion.xVw) - tableSlideX) +
          tableScale * (seatX * Math.cos(tableRadians) - seatY * Math.sin(tableRadians) / tableAspect);
        const localY = table.y - 56 + ((tableDecoration.suppressTransition ? tableMotionOffset?.yVh ?? 0 : tableMotion.yVh) - tableSlideY) +
          tableScale * (seatX * tableAspect * Math.sin(tableRadians) + seatY * Math.cos(tableRadians));
        const dockX = 50 + receptionFrame.x +
          worldScale * (localX * cos - localY * sin / ratio);
        const dockY = 56 + receptionFrame.y +
          worldScale * (localX * ratio * sin + localY * cos);
        const spriteRatio = sprite.height / sprite.width;
        const dock = composedDock && tableEntry
          ? mapLayerPoint(mapLayerPoint({ x: 50 + localX, y: 56 + localY }, tableEntry), entry, true)
          : { x: dockX, y: dockY };
        const contactOffset = entry.layer.w * layerRatio(entry) * spriteRatio * .4;
        correction = receptionPositionCorrection({
          layerId: entry.layer.id, effects: direction.effects, tracks: tracksById, clip: reception.clip,
          breakpoint, progress, lift: pose.lift, editingEffectId: effectPose?.effectId,
        });
        const tableFrame = resolveLayerAnchor(`layer:${table.id}`);
        tableAnchor = { ...tableFrame, x: dock.x - layer.x, y: dock.y - contactOffset - layer.y, pivotY: contactOffset };
      }
      const resolveAnchor: ResolveAssetAnchor = (anchor) => anchor === 'table'
        ? receptionTable && tableAnchor : resolveLayerAnchor(anchor);
      const sampled = editingPose?.pending ?? sampleAssetKeyframes(layer.keyframes, at, resolveAnchor, motion);
      const lastKeyframe = layer.keyframes?.at(-1);
      const isTableAnchor = sampled?.anchor === 'table' || (
        receptionTable && assetAnchorTarget(sampled?.anchor) === receptionTable.layer.id
      );
      const lastKeyframeProgress = clip && lastKeyframe ? clip.start + lastKeyframe.at * (clip.end - clip.start) : undefined;
      let renderPose = sampled;
      if (sampled && sampled.anchorTransform === undefined && receptionTable?.layer.space === 'world' && isTableAnchor && (sampled.frame ?? pose.open) === 0 &&
          lastKeyframe && at >= lastKeyframe.at && lastKeyframeProgress !== undefined &&
          progress > lastKeyframeProgress && !editingPose) {
        // The last closed pose was authored in screen units. Project its offset and size
        // through the change in camera framing so the book stays on the same table spot.
        const reference = departureFrameAt(lastKeyframeProgress) ?? storyCameraFrame(lastKeyframeProgress);
        const scale = receptionFrame.scale / reference.scale;
        const angle = receptionFrame.rotate - reference.rotate;
        const contact = sampled.anchor === 'table' ? contactOffset : 0;
        const offset = rotateScale({ x: sampled.x, y: sampled.y - contact }, scale, angle, layerRatio(entry));
        renderPose = { ...sampled, x: offset.x, y: offset.y + contact,
          scale: sampled.scale * scale, rotate: sampled.rotate + angle };
      }
      const authored = renderPose && resolveAssetPose(renderPose, resolveAnchor);
      const anchors = editingPose ? anchorOptions(resolveLayerAnchor, receptionTable ? tableAnchor : undefined) : undefined;
      const ambient: CinematicLayerDecoration['ambient'] = authored ? {
        opacity: authored.opacity ?? motion?.opacity, blur: authored.blur ?? motion?.blur,
        xVw: authored.x, yVh: authored.y, rotate: authored.rotate, scale: authored.scale,
      } : {
        ...motion,
        x: (motion?.x ?? 0) + correction.x,
        y: (motion?.y ?? 0) + correction.y,
        xVw: (motion?.xVw ?? 0) + correction.xVw + (animation?.x ?? 0) + tableAnchor.x * docked,
        yVh: (motion?.yVh ?? 0) + correction.yVh + (animation?.y ?? 0) + tableAnchor.y * docked,
        rotate: (motion?.rotate ?? 0) + (animation?.rotate ?? 0),
        scale: (motion?.scale ?? 1) * (animation?.scale ?? 1),
      };
      // Docked props are drawn in the viewport, outside the world's blur filter.
      const dockedBlur = authored?.inheritedBlur === undefined && receptionTable?.layer.space === 'world'
        ? effects.world.blur * (authored?.frame === undefined ? docked : 1 - authored.frame)
        : 0;
      decorations[layer.id] = {
        suppressTransition: Boolean(authored),
        interactive: available && pose.arrived && !editing,
        children: <ReceptionProp kind={reception.kind} open={pose.open} arrived={pose.arrived}
          artworkFrame={authored?.frame} surface={authored} editing={editing} available={available} fire={fire} />,
        ambient: {
          ...ambient,
          blur: dockedBlur ? Math.hypot(ambient.blur ?? 0, dockedBlur) : assetPoseBlur(authored, ambient.blur),
          xVw: (ambient.xVw ?? 0) + receptionSlide.x,
          yVh: (ambient.yVh ?? 0) + receptionSlide.y,
        },
        poseSample: editingPose ? {
          pose: { x: (ambient.xVw ?? 0) + (authored ? 0 : presentation.xVw),
            y: (ambient.yVh ?? 0) + (authored ? 0 : presentation.yVh),
            scale: sampled?.scale ?? ambient.scale ?? 1, rotate: sampled?.rotate ?? ambient.rotate ?? 0,
            opacity: sampled?.opacity, blur: sampled?.blur,
            frame: authored?.frame ?? pose.open,
            perspective: sampled?.perspective, contactShadow: sampled?.contactShadow, shadowSoftness: sampled?.shadowSoftness,
            ...(sampled?.anchor ? { anchor: sampled.anchor, anchorTransform: sampled.anchorTransform,
              anchorBlur: sampled.anchorBlur, x: sampled.x, y: sampled.y } : {}),
          },
          appearance: { opacity: ambient.opacity, blur: ambient.blur },
          anchors, frameCount: sprite.frames,
        } : undefined,
      };
      return;
    }
    if (entry.layer.id === 'table-guest-book' && receptionProps.has('wishes-book')) {
      decorations[entry.layer.id] = { visible: false };
      return;
    }
    const decoration = renderCinematicFunction(entry, {
      slotProps, theme: direction.theme, styles, editing, interaction: record, phase: record ? interaction.phase(record.id) : 'ready',
      available: Boolean(record && interaction.available(record) && entry.presentation.opacity > CINEMATIC_INTERACTION_OPACITY),
      focused: Boolean(record && interaction.focusId === record.id), fire: () => record && interaction.trigger(record),
      contentMotion: effects.layers.get(`${entry.layer.id}:content`), apiBase: API_BASE,
      renderPart,
    });
    const shadowOpacity = layer.textEffects?.shadow?.opacity;
    const sampled = editingPose?.pending ?? sampleAssetKeyframes(layer.keyframes, at, resolveLayerAnchor, { ...motion, shadowOpacity });
    const textMotion = layer.kind === 'text' ? {
      textReveal: reduced && !editing ? undefined : sampled?.textReveal,
      revealAmount: sampled?.revealAmount,
      shadowOpacity: sampled?.shadowOpacity,
      burst: reduced && !editing ? undefined : sampleTextGlitch(layer.keyframes, at, editingPose?.pending),
    } : undefined;
    const authored = sampled && resolveAssetPose(sampled, resolveLayerAnchor);
    const anchors = editingPose && !layer.parentId ? anchorOptions(resolveLayerAnchor) : undefined;
    const ambient = authored ? {
      opacity: authored.opacity ?? motion?.opacity, blur: assetPoseBlur(authored, motion?.blur),
      xVw: authored.x, yVh: authored.y, scale: authored.scale, rotate: authored.rotate,
    } : animation ? { ...motion,
      xVw: (motion?.xVw ?? 0) + animation.x, yVh: (motion?.yVh ?? 0) + animation.y,
      scale: (motion?.scale ?? 1) * animation.scale, rotate: (motion?.rotate ?? 0) + animation.rotate,
    } : motion;
    // A saved table pose still rides the table's scene-set slide.
    const keepsAppearanceMotion = layer.behavior === 'programme-board';
    const displayMotion = authored && layer.id === tableLayer?.id ? {
      ...ambient, xVw: authored.x + tableSlideX, yVh: authored.y + tableSlideY,
    } : ambient;
    decorations[layer.id] = { ...decoration, textMotion, surface: authored, ambient: displayMotion, suppressTransition: Boolean(authored) && !keepsAppearanceMotion,
      frameTransform: isReceptionScenery(entry)
        ? departureTransform ?? 'none' : undefined,
      poseSample: editingPose ? { anchors, appearance: { opacity: ambient?.opacity, blur: authored?.blur ?? motion?.blur, shadowOpacity }, pose: (authored && sampled) ?? {
        x: (ambient?.xVw ?? 0) + (keepsAppearanceMotion ? 0 : presentation.xVw - (layer.parentId ? 0 : entry.groupTransform?.slideX ?? 0)),
        y: (ambient?.yVh ?? 0) + (keepsAppearanceMotion ? 0 : presentation.yVh - (layer.parentId ? 0 : entry.groupTransform?.slideY ?? 0)),
        scale: (ambient?.scale ?? 1) * (keepsAppearanceMotion ? 1 : presentation.scale),
        rotate: ambient?.rotate ?? 0,
      } } : undefined,
      cssVars: layer.parentId ? undefined : { '--cinematic-close-duration': `${record?.closeMs ?? 620}ms`, '--cinematic-open-duration': `${record?.openMs ?? 550}ms` } as CSSProperties };

  }
  scene.entries.forEach(decorate);
  const theme = direction.theme;
  const themeStyle = {
    '--cinematic-ink': theme.ink, '--cinematic-secondary': theme.secondaryInk, '--cinematic-accent': theme.accent,
    '--cinematic-panel': theme.panel, '--cinematic-border': theme.border, '--cinematic-page': theme.page,
    '--cinematic-display-font': fontVar(theme.displayFont) || 'var(--font-ae-cormorant), Georgia, serif',
    '--cinematic-body-font': fontVar(theme.bodyFont) || 'var(--font-ae-eb-garamond), Georgia, serif',
    '--cinematic-radius': `${theme.radius}px`, '--cinematic-shadow': theme.shadow,
    '--cinematic-track-desktop': `${pacing.heightVh}svh`, '--cinematic-track-mobile': `${pacing.heightVh}svh`,
  } as CSSProperties;
  const worldStyle = {
    '--camera-x': `calc(var(--fvw, 100vw) * ${liveFrame.x / 100})`,
    '--camera-y': `calc(var(--fsvh, 100svh) * ${liveFrame.y / 100})`,
    opacity: effects.world.opacity,
    '--camera-scale': liveFrame.scale, '--camera-rotate': `${liveFrame.rotate}deg`, '--world-blur': `${effects.world.blur}px`,
  } as CSSProperties;
  const anchors = direction.navigation.flatMap((anchor) => {
    const beat = sequence.beats.find((candidate) => candidate.id === anchor.targetId);
    const track = tracksById.get(anchor.targetId);
    const clip = track ? resolveCinematicTrackClip(track, tracksById) : undefined;
    const story = anchor.target === 'beat' ? beat?.at : anchor.target === 'track-start' ? clip?.start : anchor.target === 'track-enter' ? clip?.enterEnd : clip?.end;
    return story === undefined ? [] : [{ ...anchor, at: mapCinematicProgress(story, pacing.points, true) }];
  });
  const groupEdit = poseEdit && cinematicEffectGroup(sceneSets, layers, breakpoint, poseEdit.layerId);
  if (groupEdit && !groupEdit.group.hidden && !groupEdit.set.hidden && !groupEdit.set.locked &&
    !groupEdit.members.some((member) => member.locked)) {
    const groupEntry = scene.entries.find(({ groupTransform }) => groupTransform?.editingPose);
    const transform = groupEntry?.groupTransform;
    if (transform?.editingPose && groupEntry) {
      const { set, group, members } = groupEdit;
      const target = cinematicGroupAnimationTarget(set, group, members[0]);
      // A single selection box takes input while each member retains its own draw order.
      const { centerX, centerY } = transform;
      const layer = {
        ...target, x: centerX + transform.slideX, y: centerY + transform.slideY,
        w: Math.max(...members.map((member) => member.w + 2 * Math.abs(member.x - centerX))),
        h: Math.max(...members.map((member) => (member.h ?? member.w * layerRatio(groupEntry) / (member.aspectRatio ?? 1)) +
          2 * Math.abs(member.y - centerY))),
        aspectRatio: undefined, rotation: 0, flipX: false, z: 1000, opacity: 1, locked: false,
      };
      scene.entries.push({ layer, sceneSet: set, presentation: { opacity: 1, scale: 1, xVw: 0, yVh: 0 } });
      decorations[layer.id] = {
        children: <span aria-hidden="true" />,
        ambient: { xVw: transform.x + (transform.frameX ?? 0), yVh: transform.y + (transform.frameY ?? 0),
          rotate: transform.rotate, scale: transform.scale },
        poseSample: { pose: transform.editingPose, appearance: { opacity: transform.opacity, blur: transform.blur } },
        frameTransform: isReceptionScenery(groupEntry) ? departureTransform ?? 'none' : undefined,
      };
    }
  }
  const sceneProps = { entries: scene.entries, decorations, compositions, editor, slotProps, boxClassName: styles.sceneLayer,
    imageClassName: styles.sceneLayerImage, selectedClassName: styles.sceneLayerSelected, resizeHandleClassName: styles.sceneResizeHandle };
  const sheetStyle = {
    '--slot-ink': theme.ink, '--slot-ink-soft': theme.ink, '--slot-ink-faint': theme.secondaryInk,
    '--slot-rule': theme.border, '--slot-accent': theme.accent, '--slot-accent-ink': theme.panel,
    '--slot-radius': `${theme.radius}px`, '--slot-font-display': fontVar(theme.displayFont) || 'var(--font-ae-cormorant), Georgia, serif',
    '--slot-font-serif': fontVar(theme.bodyFont) || 'var(--font-ae-eb-garamond), Georgia, serif',
    '--slot-font-body': fontVar(theme.bodyFont) || 'var(--font-ae-eb-garamond), Georgia, serif',
    '--slot-panel-bg': theme.panel, '--slot-panel-shadow': `0 26px 70px rgba(83,56,39,${theme.shadow})`,
  } as CSSProperties;
  useEffect(() => {
    document.documentElement.classList.add('painted-promise-no-scrollbar');
    return () => document.documentElement.classList.remove('painted-promise-no-scrollbar');
  }, []);

  return <div ref={rootRef} className={styles.track} style={themeStyle} data-cinematic-template="painted-promise"
    data-cinematic-beats={beats.length} data-cinematic-paused={interaction.isOpen ? 'true' : 'false'} data-cinematic-progress={progress.toFixed(4)}>
    {anchors.map((anchor) => <span key={anchor.id} id={anchor.id} className={styles.anchor} style={{ top: `calc(${anchor.at * 100}% - var(--fsvh, 100svh) * ${anchor.at})` }} />)}
    <main ref={viewportRef} className={styles.viewport} data-cinematic-space="viewport" aria-label="Painted Promise wedding invitation">
      <CinematicSceneLayers {...sceneProps} space="viewport" />
      <div className={styles.world} data-cinematic-space="world" style={worldStyle}><CinematicSceneLayers {...sceneProps} space="world" /></div>
      {editing && editor?.cinematic?.mode !== 'scene' && <CinematicCameraSurface camera={camera}
        beatId={editor?.cinematic?.mode === 'camera-beat' ? editor.cinematic.beatId : undefined} className={styles.cameraEditorSurface} />}
      {editing && editor?.cinematic?.referenceSrc && /* eslint-disable-next-line @next/next/no-img-element -- The reference overlay must share the camera canvas geometry and direct upload source. */
                                                     <img className={styles.referenceOverlay} src={editor.cinematic.referenceSrc} alt="" aria-hidden="true"
        style={{ opacity: editor.cinematic.referenceOpacity ?? .45, objectFit: editor.cinematic.referenceFit ?? 'contain' }} />}
      <SheetHost groups={SHEETS} slotProps={slotProps} themeStyle={sheetStyle} flatPanels lockScroll={false} />
      <ProgrammePopup slotProps={slotProps} artwork={layers.find((layer) => layer.behavior === 'programme-board')?.src || `${ROOT}/itinerary-v1/programme-board.webp`}
        title={layers.find((layer) => layer.behavior === 'programme-board')?.title} />
      {interaction.info && <div className={styles.infoBackdrop} style={{ '--cinematic-open-duration': `${interaction.info.openMs}ms` } as CSSProperties} onClick={(event) => { if (event.target === event.currentTarget) interaction.dismissInfo(); }}>
        <section ref={infoRef} tabIndex={-1} data-cinematic-info role="dialog" aria-modal="true" aria-label={interaction.info.infoTitle} className={styles.infoDialog}>
          <button type="button" onClick={interaction.dismissInfo}>Close</button><h2>{interaction.info.infoTitle}</h2>
          <div dangerouslySetInnerHTML={{ __html: cinematicRichHtml(interaction.info.infoBody) }} />
        </section>
      </div>}
    </main>
    <TemplateNav
      items={anchors.filter((anchor) => photoBoothEnabled || anchor.id !== 'photobooth')}
      active={anchors.reduce<{ id: string; at: number } | undefined>((nearest, anchor) =>
        anchor.at <= progress && (!nearest || anchor.at >= nearest.at) ? anchor : nearest, undefined)?.id ?? ''}
      layout={t('nav.layout', 'hidden') as NavLayout}
      config={customConfig}
      onNav={(id) => { const target = anchors.find((anchor) => anchor.id === id); if (target) rawSeek(target.at, 380); }}
    />
    <MusicSlot t={t} editing={editing} autoPlay={false} />
  </div>;
}
