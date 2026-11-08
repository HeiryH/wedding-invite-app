'use client';
import { configValue } from '@/components/templates/configValue';
import type { TemplateRsvpSubmission, PhotoUploadSubmission } from '@/components/templates/guestContracts';


import { useDialogBehavior } from '../_shared/hooks/useDialogBehavior';
import TemplateNav, { type NavLayout } from '../_shared/nav/TemplateNav';
import { MusicSlot } from '../_shared/slots/ChromeSlots';
import { animateScrollIntoView } from '../_shared/animateScrollTo';
import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from 'react';
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
import CinematicPart from '../_shared/cinematic/CinematicPart';
import { resolveCinematicScene } from '../_shared/cinematic/scene';
import CinematicCameraSurface from '../_shared/cinematic/CinematicCameraSurface';
import { resolveCinematicCamera } from '../_shared/cinematic/cameraLayout';
import { resolveCinematicWorld } from '../_shared/cinematic/world';
import { sampleAssetAnimations } from '../_shared/cinematic/assetAnimations';
import { resolveCinematicSceneSets } from '../_shared/cinematic/sceneSets';
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
  const reduced = useReducedMotion();
  const breakpoint = useBreakpoint(editor?.enabled ? editor.breakpoint : undefined);
  const { rootRef, progress: rawProgress, seek: rawSeek } = useCinematicScroll<HTMLDivElement>(reduced);
  const editing = Boolean(editor?.enabled);
  const cinematicConfig = useMemo(() => resolveCinematicProjectConfig('t15', customConfig).config, [customConfig]);
  const direction = useMemo(() => resolveCinematicDirection('t15', PAINTED_PROMISE_DIRECTION, customConfig), [customConfig]);
  const sequence = useMemo(() => resolveCinematicSequence('t15', PAINTED_PROMISE_SEQUENCE, cinematicConfig).sequence, [cinematicConfig]);
  const beats = useMemo(() => beatsFromSequence(sequence), [sequence]);
  const pacing = useMemo(() => cinematicPacingNodes(sequence.beats, direction.pacing, breakpoint, PAINTED_PROMISE_SEQUENCE.beats.length), [sequence.beats, direction.pacing, breakpoint]);
  const progress = editing && editor?.cinematic ? editor.cinematic.progress : mapCinematicProgress(rawProgress, pacing.points);
  const seek = (target: number) => rawSeek(mapCinematicProgress(target, pacing.points, true));
  const cameraLayout = useMemo(() => resolveCinematicCamera('t15', PAINTED_PROMISE_CAMERA, beats, breakpoint, cinematicConfig), [beats, breakpoint, cinematicConfig]);
  const camera = editing && editor?.cinematic?.cameraOverride ? editor.cinematic.cameraOverride : sampleCamera(progress, cameraLayout.timeline);
  const layers = useMemo(() => resolveCinematicWorld('t15', PAINTED_PROMISE_WORLD, breakpoint, cinematicConfig,
    { frames: direction.theme.memory.frames, programmeItems: itinerary.length }), [breakpoint, cinematicConfig, direction.theme.memory.frames, itinerary.length]);
  const sceneSets = useMemo(() => resolveCinematicSceneSets('t15', PAINTED_PROMISE_SCENE_SETS, cinematicConfig).sceneSets, [cinematicConfig]);
  const tracks = useMemo(() => promoteLegacyCinematicVisibilityTracks(sequence.tracks, resolveCinematicVisibility(
    't15', visibilityFromSequence(sequence), breakpoint, cinematicConfig,
  )), [sequence, breakpoint, cinematicConfig]);
  const tracksById = useMemo(() => new Map(tracks.map((track) => [track.id, track])), [tracks]);
  const interaction = useDirectedInteractions({ definitions: direction.interactions, tracks, beats: sequence.beats, progress, seek, editing });
  const effectPose = editing ? editor?.cinematic?.effectPose : undefined;
  const effects = useMemo(() => sampleCinematicEffects(direction.effects, tracks, progress, breakpoint, effectPose), [direction.effects, tracks, progress, breakpoint, effectPose]);
  const scene = resolveCinematicScene({ layers, sceneSets, tracks, progress, behaviors: {
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
  scene.entries = scene.entries.map((entry) => {
    const independent = Boolean(entry.layer.timingTrackId || tracks.some((track) => track.target.type === 'layer' && track.target.id === entry.layer.id));
    const record = interaction.recordFor(entry.layer);
    const dismissed = record && interaction.phase(record.id) === 'dismissed' && record.returnMode !== 'stay';
    return { ...entry, presentation: { ...entry.presentation, opacity: entry.layer.parentId ? entry.presentation.opacity : dismissed ? 0 : independent
      ? entry.presentation.opacity : setPresentation.get(entry.sceneSet.id) ?? entry.presentation.opacity } };
  });
  const infoRef = useRef<HTMLElement>(null);
  useDialogBehavior(infoRef, Boolean(interaction.info), interaction.dismissInfo);
  const t = useCallback((key: string, fallback: string) => configValue(customConfig, key, fallback), [customConfig]);
  const submitRsvp = async (data: TemplateRsvpSubmission) => { await onRSVP(data); window.setTimeout(interaction.close, 1100); };
  const slotProps: SlotProps = { wedding, t, wishes, photos, tables, itinerary, seatingEnabled, photoBoothEnabled,
    onRSVP: submitRsvp, onSubmitWish, onUploadPhoto, editing: false, config: customConfig, breakpoint };
  const decorations: Record<string, CinematicLayerDecoration> = {};
  for (const entry of scene.entries) {
    const record = interaction.recordFor(entry.layer);
    const motion = effects.layers.get(entry.layer.id);
    const animation = entry.layer.animations?.length ? sampleAssetAnimations(entry.layer, tracks, progress, layers) : undefined;
    const decoration = renderCinematicFunction(entry, {
      slotProps, theme: direction.theme, styles, editing, interaction: record, phase: record ? interaction.phase(record.id) : 'ready',
      available: Boolean(record && interaction.available(record) && entry.presentation.opacity > .7),
      focused: Boolean(record && interaction.focusId === record.id), fire: () => record && interaction.trigger(record),
      contentMotion: effects.layers.get(`${entry.layer.id}:content`), apiBase: API_BASE,
      renderPart: (part, element) => <CinematicPart rootId={entry.layer.id} part={part} element={element}
        entries={scene.entries} decorations={decorations} editor={editor} slotProps={slotProps}
        boxClassName={styles.sceneLayer} imageClassName={styles.sceneLayerImage}
        selectedClassName={styles.sceneLayerSelected} resizeHandleClassName={styles.sceneResizeHandle} />,
    });
    decorations[entry.layer.id] = { ...decoration, ambient: animation ? { ...motion,
      xVw: (motion?.xVw ?? 0) + animation.x, yVh: (motion?.yVh ?? 0) + animation.y,
      scale: (motion?.scale ?? 1) * animation.scale, rotate: (motion?.rotate ?? 0) + animation.rotate,
    } : motion,
      cssVars: entry.layer.parentId ? undefined : { '--cinematic-close-duration': `${record?.closeMs ?? 620}ms`, '--cinematic-open-duration': `${record?.openMs ?? 550}ms` } as CSSProperties };
  }
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
    '--camera-x': `calc(var(--fvw, 100vw) * ${(camera.x + effects.world.xVw + effects.world.x) / 100})`,
    '--camera-y': `calc(var(--fsvh, 100svh) * ${(camera.y + effects.world.yVh + effects.world.y) / 100})`,
    opacity: effects.world.opacity,
    '--camera-scale': camera.scale * effects.world.scale, '--camera-rotate': `${camera.rotate + effects.world.rotate}deg`, '--world-blur': `${effects.world.blur}px`,
  } as CSSProperties;
  const anchors = direction.navigation.flatMap((anchor) => {
    const beat = sequence.beats.find((candidate) => candidate.id === anchor.targetId);
    const track = tracksById.get(anchor.targetId);
    const clip = track ? resolveCinematicTrackClip(track, tracksById) : undefined;
    const story = anchor.target === 'beat' ? beat?.at : anchor.target === 'track-start' ? clip?.start : anchor.target === 'track-enter' ? clip?.enterEnd : clip?.end;
    return story === undefined ? [] : [{ ...anchor, at: mapCinematicProgress(story, pacing.points, true) }];
  });
  const sceneProps = { entries: scene.entries, decorations, editor, slotProps, boxClassName: styles.sceneLayer,
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
    <main className={styles.viewport} data-cinematic-space="viewport" aria-label="Painted Promise wedding invitation">
      <CinematicSceneLayers {...sceneProps} space="viewport" />
      <div className={styles.world} data-cinematic-space="world" style={worldStyle}><CinematicSceneLayers {...sceneProps} space="world" /></div>
      {editing && editor?.cinematic?.mode !== 'scene' && <CinematicCameraSurface camera={camera}
        beatId={editor?.cinematic?.mode === 'camera-beat' ? editor.cinematic.beatId : undefined} className={styles.cameraEditorSurface} />}
      {editing && editor?.cinematic?.referenceSrc && <img className={styles.referenceOverlay} src={editor.cinematic.referenceSrc} alt="" aria-hidden="true"
        style={{ opacity: editor.cinematic.referenceOpacity ?? .45, objectFit: editor.cinematic.referenceFit ?? 'contain' }} />}
      <SheetHost groups={SHEETS} slotProps={slotProps} themeStyle={sheetStyle} flatPanels />
      <ProgrammePopup slotProps={slotProps} artwork={layers.find((layer) => layer.behavior === 'programme-board')?.src || `${ROOT}/itinerary-v1/programme-board.png`}
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
      onNav={(id) => { const target = document.getElementById(id); if (target) animateScrollIntoView(target); }}
    />
    <MusicSlot t={t} editing={editing} autoPlay={false} />
  </div>;
}
