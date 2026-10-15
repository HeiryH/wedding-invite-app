'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type CSSProperties } from 'react';
import type { Wedding, Wish, Photo, ItineraryItem, SeatingTable, CreateWish } from '@/lib/api';
import type { EditorHandle, Layer, SlotProps } from '@/components/templates/_shared/types';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { useBreakpoint } from '@/components/templates/_shared/hooks/useBreakpoint';
import { SlotFlowProviders } from '@/components/templates/_shared/slots/FlowProviders';
import { useSheets } from '@/components/templates/_shared/slots/sheets';
import { SLOT_REGISTRY } from '@/components/templates/_shared/slots';
import { EngineProvider } from '@/components/templates/_shared/engine';
import SheetHost from '@/components/templates/_shared/SheetHost';
import { sampleCamera, useCinematicScroll, range } from '@/components/templates/_shared/cinematic/useCinematicScroll';
import CinematicSceneLayer from '@/components/templates/_shared/cinematic/CinematicSceneLayer';
import CinematicCameraSurface from '@/components/templates/_shared/cinematic/CinematicCameraSurface';
import { resolveCinematicCamera } from '@/components/templates/_shared/cinematic/cameraLayout';
import { resolveCinematicWorld } from '@/components/templates/_shared/cinematic/world';
import { resolveCinematicVisibility } from '@/components/templates/_shared/cinematic/visibility';
import {
  beatsFromSequence, cinematicTrackPresentation, resolveCinematicSequence, visibilityFromSequence,
  type CinematicTrackPresentation,
} from '@/components/templates/_shared/cinematic/sequence';
import { INITIAL_CINEMATIC_INTERACTIONS, cinematicInteractionReducer, type CinematicSheetId } from '@/components/templates/_shared/cinematic/interactions';
import { PAINTED_PROMISE_CAMERA, PAINTED_PROMISE_SEQUENCE, PAINTED_PROMISE_WORLD } from './data/cinematic';
import styles from './Template15.module.css';

const ROOT = '/templates/painted-promise/assets';
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';
const BESPOKE_LAYER_IDS = new Set([
  'clouds', 'welcome-groom-hand', 'welcome-bride-hand', 'welcome-ring',
  'programme-board', 'rsvp-letter', 'wishes-book', 'memory-wall',
]);

const SHEET_LAYER = (id: string, slot: string, z: number): Layer => ({
  id, kind: 'slot', slot, presentation: 'sheet', sheetId: id.startsWith('rsvp') ? 'rsvp' : 'wish',
  x: 50, y: 50, w: 80, h: 40, s: 1, z, order: 0, chain: false, hidden: false, opacity: 1,
});

const SHEETS: Record<string, Layer[]> = {
  rsvp: [SHEET_LAYER('rsvp-form', 'rsvpForm', 2), SHEET_LAYER('rsvp-seating', 'rsvpSeating', 1)],
  wish: [SHEET_LAYER('wish-form', 'wishForm', 2), SHEET_LAYER('wish-photo', 'wishPhoto', 1)],
};

interface Props {
  wedding: Wedding;
  onRSVP: (data: unknown) => Promise<void>;
  onSubmitWish: (data: CreateWish) => Promise<void>;
  onUploadPhoto?: (data: unknown) => Promise<void>;
  wishes: Wish[];
  photos: Photo[];
  photoBoothEnabled: boolean;
  seatingEnabled?: boolean;
  tables?: SeatingTable[];
  customConfig?: Record<string, string>;
  itinerary?: ItineraryItem[];
  editor?: EditorHandle;
}

export default function Template15(props: Props) {
  return (
    <SlotFlowProviders>
      <EngineProvider value={{ assetRoot: ROOT, assetSizes: {}, slotRegistry: SLOT_REGISTRY }}>
        <PaintedPromise {...props} />
      </EngineProvider>
    </SlotFlowProviders>
  );
}

function PaintedPromise({
  wedding, onRSVP, onSubmitWish, onUploadPhoto, wishes, photos, photoBoothEnabled,
  seatingEnabled = false, tables = [], customConfig, itinerary = [], editor,
}: Props) {
  const reduced = useReducedMotion();
  const breakpoint = useBreakpoint(editor?.enabled ? editor.breakpoint : undefined);
  const { rootRef, progress: scrollProgress, seek } = useCinematicScroll<HTMLDivElement>(reduced);
  const progress = editor?.enabled && editor.cinematic
    ? editor.cinematic.progress
    : scrollProgress;
  const { openId, open, close } = useSheets();
  const previousOpen = useRef<string | null>(null);
  const programmeReachedFocus = useRef(false);
  const [interactions, dispatchInteraction] = useReducer(
    cinematicInteractionReducer,
    INITIAL_CINEMATIC_INTERACTIONS,
  );
  const [itineraryReturn, setItineraryReturn] = useState<number | null>(null);
  const t = useCallback((key: string, fallback: string) => customConfig?.[key] || fallback, [customConfig]);

  useEffect(() => {
    document.documentElement.classList.add('painted-promise-no-scrollbar');
    return () => document.documentElement.classList.remove('painted-promise-no-scrollbar');
  }, []);

  useEffect(() => {
    const previous = previousOpen.current;
    if (previous && previous !== openId && (previous === 'rsvp' || previous === 'wish')) {
      dispatchInteraction({ type: 'close', id: previous });
    }
    if (openId === 'rsvp' || openId === 'wish') {
      dispatchInteraction({ type: 'open', id: openId });
    }
    previousOpen.current = openId;
  }, [openId]);

  useEffect(() => {
    const timers: number[] = [];
    (['rsvp', 'wish'] as CinematicSheetId[]).forEach((id) => {
      if (interactions[id] === 'closing') {
        timers.push(window.setTimeout(() => dispatchInteraction({ type: 'finish-close', id }), 620));
      }
    });
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [interactions]);

  useEffect(() => {
    const resetRsvp = progress < .775 && interactions.rsvp !== 'ready';
    const resetWish = progress < .855 && interactions.wish !== 'ready';
    if (!resetRsvp && !resetWish) return;
    const timer = window.setTimeout(() => {
      if (resetRsvp) dispatchInteraction({ type: 'reset', id: 'rsvp' });
      if (resetWish) dispatchInteraction({ type: 'reset', id: 'wish' });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [progress, interactions.rsvp, interactions.wish]);

  // A form temporarily owns the gesture surface. Freeze the page underneath it and restore the
  // exact cinematic beat on dismiss, so closing never silently advances the camera.
  useEffect(() => {
    if (!openId || editor?.enabled) return;
    const body = document.body;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      window.scrollTo(0, scrollY);
    };
  }, [openId, editor?.enabled]);

  const sequence = useMemo(
    () => resolveCinematicSequence('t15', PAINTED_PROMISE_SEQUENCE, customConfig).sequence,
    [customConfig],
  );
  const beats = useMemo(() => beatsFromSequence(sequence), [sequence]);
  const visibilityDefaults = useMemo(() => visibilityFromSequence(sequence), [sequence]);
  const cameraLayout = useMemo(
    () => resolveCinematicCamera('t15', PAINTED_PROMISE_CAMERA, beats, breakpoint, customConfig),
    [beats, breakpoint, customConfig],
  );
  const camera = editor?.enabled && editor.cinematic?.cameraOverride
    ? editor.cinematic.cameraOverride
    : sampleCamera(progress, cameraLayout.timeline);
  const worldLayers = useMemo(
    () => resolveCinematicWorld('t15', PAINTED_PROMISE_WORLD, breakpoint, customConfig),
    [breakpoint, customConfig],
  );
  const visibilitySets = useMemo(
    () => resolveCinematicVisibility('t15', visibilityDefaults, breakpoint, customConfig),
    [breakpoint, customConfig, visibilityDefaults],
  );
  // Promote the previous breakpoint visibility format into the sequence at runtime. Once the
  // director changes timing, the editor writes these same values into sequence tracks and clears
  // the legacy key, so existing invitations keep their authored timing through the migration.
  const runtimeTracks = useMemo(() => sequence.tracks.map((track) => {
    if (track.target.type !== 'group') return track;
    const set = visibilitySets.find((candidate) =>
      candidate.id === track.id || candidate.group === track.target.id);
    return set ? { ...track, clip: {
      start: set.enterStart, enterEnd: set.enterEnd, exitStart: set.exitStart, end: set.exitEnd,
    } } : track;
  }), [sequence.tracks, visibilitySets]);
  const groupTracks = useMemo(() => new Map(runtimeTracks.flatMap((track) =>
    track.target.type === 'group' ? [[track.target.id, track] as const] : [])), [runtimeTracks]);
  const layerTracks = useMemo(() => new Map(runtimeTracks.flatMap((track) =>
    track.target.type === 'layer' ? [[track.target.id, track] as const] : [])), [runtimeTracks]);
  const narrativeTracks = useMemo(() => new Map(runtimeTracks.flatMap((track) =>
    track.target.type === 'narrative' ? [[track.target.id, track] as const] : [])), [runtimeTracks]);
  const definedTimedGroups = useMemo(() => new Set(PAINTED_PROMISE_SEQUENCE.tracks.flatMap((track) =>
    track.target.type === 'group' ? [track.target.id] : [])), []);
  const definedNarratives = useMemo(() => new Set(PAINTED_PROMISE_SEQUENCE.tracks.flatMap((track) =>
    track.target.type === 'narrative' ? [track.target.id] : [])), []);
  const visibilityFor = useCallback(
    (group: typeof worldLayers[number]['group']) => {
      const track = groupTracks.get(group);
      if (!track && definedTimedGroups.has(group)) return 0;
      return cinematicTrackPresentation(progress, track, runtimeTracks).opacity;
    },
    [progress, groupTracks, runtimeTracks, definedTimedGroups],
  );
  const narrativeVisibilityFor = useCallback((id: string) => {
    const track = narrativeTracks.get(id);
    if (!track && definedNarratives.has(id)) return 0;
    return cinematicTrackPresentation(progress, track, runtimeTracks).opacity;
  }, [progress, narrativeTracks, runtimeTracks, definedNarratives]);
  const presentationFor = useCallback((
    layer: typeof worldLayers[number], groupOpacity?: number,
  ): CinematicTrackPresentation => {
    const group = cinematicTrackPresentation(progress, groupTracks.get(layer.group), runtimeTracks);
    const exactTrack = layerTracks.get(layer.id);
    const exact = cinematicTrackPresentation(progress, exactTrack, runtimeTracks);
    if (exactTrack) return exact;
    return {
      opacity: groupOpacity ?? (!groupTracks.has(layer.group) && definedTimedGroups.has(layer.group)
        ? 0 : group.opacity),
      xVw: group.xVw,
      scale: group.scale,
    };
  }, [progress, groupTracks, layerTracks, runtimeTracks, definedTimedGroups]);
  const byId = useMemo(() => new Map(worldLayers.map((layer) => [layer.id, layer])), [worldLayers]);
  const cloudLayer = byId.get('clouds');
  const welcomeGroomLayer = byId.get('welcome-groom-hand');
  const welcomeBrideLayer = byId.get('welcome-bride-hand');
  const welcomeRingLayer = byId.get('welcome-ring');
  const programmeLayer = byId.get('programme-board');
  const rsvpLayer = byId.get('rsvp-letter');
  const wishesLayer = byId.get('wishes-book');
  const memoryLayer = byId.get('memory-wall');
  const sceneLayers = worldLayers.filter((layer) =>
    layer.space === 'world' && !BESPOKE_LAYER_IDS.has(layer.id));
  const viewportLayers = worldLayers.filter((layer) =>
    layer.space === 'viewport' && !BESPOKE_LAYER_IDS.has(layer.id));
  const cloudShift = { x: -3 + progress * 7, y: -2 + Math.sin(progress * Math.PI * 2) * 2.2 };
  const handMeet = range(progress, 0, 0.115);
  const worldBlur = range(progress, 0.94, 0.985) * 8;
  const rsvpFocus = interactions.rsvp === 'dismissed' ? 0 : visibilityFor('rsvp');
  const wishFocus = interactions.wish === 'dismissed' ? 0 : visibilityFor('wishes');
  const photobooth = visibilityFor('memory');
  const tableReturn = (
    (interactions.rsvp === 'closing' || interactions.rsvp === 'dismissed') && progress < .865
  ) || (
    (interactions.wish === 'closing' || interactions.wish === 'dismissed') && progress < .945
  );
  const tableVisibility = tableReturn ? 1 : visibilityFor('table');
  const tableBookVisibility = groupTracks.has('table-wishes') &&
    (interactions.rsvp === 'closing' || interactions.rsvp === 'dismissed')
    ? Math.max(visibilityFor('table-wishes'), tableVisibility)
    : visibilityFor('table-wishes');
  const letterLift = breakpoint === 'desktop' ? -18 : -50;
  const letterProgress = interactions.rsvp === 'closing' ? 0 : rsvpFocus;
  const editing = Boolean(editor?.enabled);
  const programmeFocused = itineraryReturn !== null && Math.abs(progress - .71) < .045;

  const date = new Date(wedding.weddingDate);
  const dateText = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeText = date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
  const primaryName = wedding.groomName || wedding.name2 || 'The Groom';
  const secondaryName = wedding.brideName || wedding.name1 || 'The Bride';
  const singleHonoree = (wedding.eventType ?? 'WEDDING') !== 'WEDDING';

  const submitRsvp = useCallback(async (data: unknown) => {
    await onRSVP(data);
    window.setTimeout(close, 1100);
  }, [onRSVP, close]);

  const slotProps: SlotProps = useMemo(() => ({
    wedding, t, wishes, photos, tables, itinerary, seatingEnabled, photoBoothEnabled,
    onRSVP: submitRsvp, onSubmitWish, onUploadPhoto, editing: false, config: customConfig, breakpoint: 'mobile',
  }), [wedding, t, wishes, photos, tables, itinerary, seatingEnabled, photoBoothEnabled,
    submitRsvp, onSubmitWish, onUploadPhoto, customConfig]);

  const approvedPhotos = useMemo(
    () => photos.filter((photo) => photo.isApproved && photo.isVisible !== false).slice(0, 6),
    [photos],
  );

  const handleBoardClick = useCallback(() => {
    if (itineraryReturn !== null && programmeFocused) {
      const target = itineraryReturn;
      setItineraryReturn(null);
      programmeReachedFocus.current = false;
      seek(target);
      return;
    }
    setItineraryReturn(progress);
    programmeReachedFocus.current = false;
    seek(0.71);
  }, [itineraryReturn, programmeFocused, progress, seek]);

  useEffect(() => {
    if (programmeFocused) {
      programmeReachedFocus.current = true;
      return;
    }
    if (itineraryReturn === null || !programmeReachedFocus.current) return;
    const timer = window.setTimeout(() => setItineraryReturn(null), 0);
    return () => window.clearTimeout(timer);
  }, [itineraryReturn, programmeFocused]);

  const openInteraction = useCallback((id: CinematicSheetId) => {
    dispatchInteraction({ type: 'open', id });
    open(id);
  }, [open]);

  const worldStyle = {
    '--camera-x': `${camera.x}vw`, '--camera-y': `${camera.y}vh`, '--camera-scale': camera.scale,
    '--camera-rotate': `${camera.rotate}deg`, '--world-blur': `${worldBlur}px`,
  } as CSSProperties;

  return (
    <div ref={rootRef} className={styles.track} data-cinematic-template="painted-promise">
      {[
        ['welcome', 0], ['walimah', 20], ['itinerary', 59], ['rsvp', 76], ['wishes', 86], ['photobooth', 94],
      ].map(([id, top]) => <span key={String(id)} id={String(id)} className={styles.anchor} style={{ top: `${top}%` }} />)}

      <main className={styles.viewport} data-cinematic-space="viewport" aria-label="Painted Promise wedding invitation">
        {/* One fixed cloud world: it drifts, but is never replaced between beats. */}
        {cloudLayer && (
          <CinematicSceneLayer
            layer={cloudLayer}
            editor={editor}
            ambient={{ x: cloudShift.x, y: cloudShift.y, scale: 1.17 }}
            className={styles.clouds}
            boxClassName={styles.sceneLayer}
            imageClassName={styles.sceneLayerImage}
            selectedClassName={styles.sceneLayerSelected}
            resizeHandleClassName={styles.sceneResizeHandle}
          />
        )}

        <div className={styles.world} data-cinematic-space="world" style={worldStyle}>
          {sceneLayers.map((layer) => {
            const timing = presentationFor(layer, layer.group === 'table'
              ? tableVisibility
              : layer.group === 'table-wishes' ? tableBookVisibility : undefined);
            return <CinematicSceneLayer
              key={layer.id}
              layer={layer}
              editor={editor}
              visibility={timing.opacity}
              transition={{ xVw: timing.xVw, scale: timing.scale }}
              boxClassName={styles.sceneLayer}
              imageClassName={styles.sceneLayerImage}
              selectedClassName={styles.sceneLayerSelected}
              resizeHandleClassName={styles.sceneResizeHandle}
              slotProps={slotProps}
            />;
          })}

          {programmeLayer && (
            <CinematicSceneLayer
              layer={programmeLayer}
              editor={editor}
              visibility={presentationFor(programmeLayer).opacity}
              transition={presentationFor(programmeLayer)}
              interactive={!editing && presentationFor(programmeLayer).opacity > .7}
              boxClassName={styles.sceneLayer}
              imageClassName={styles.sceneLayerImage}
              selectedClassName={styles.sceneLayerSelected}
              resizeHandleClassName={styles.sceneResizeHandle}
            >
              <button
                className={styles.boardObject}
                type="button"
                disabled={editing}
                onClick={handleBoardClick}
                aria-label={programmeFocused
                  ? 'Return from the wedding programme'
                  : 'Focus the wedding programme'}
              >
                <img src={programmeLayer.src} alt="" />
                <span className={styles.boardCopy}>
                  <strong>{t('itinerary.title', 'Programme')}</strong>
                  {(itinerary.length ? itinerary : [
                    { itineraryItemId: 1, label: 'Guest arrival', detail: '10:30' },
                    { itineraryItemId: 2, label: 'Walimatul Urus', detail: '11:00' },
                    { itineraryItemId: 3, label: 'Celebration feast', detail: '12:30' },
                  ]).slice(0, 5).map((item) => (
                    <span key={item.itineraryItemId}><b>{item.detail}</b>{item.label}</span>
                  ))}
                </span>
                <span className={styles.boardAction} aria-hidden="true">
                  {programmeFocused ? 'Return' : itineraryReturn !== null ? 'Focusing…' : 'Focus'}
                </span>
              </button>
            </CinematicSceneLayer>
          )}
        </div>

        {welcomeGroomLayer && (
          <CinematicSceneLayer
            layer={welcomeGroomLayer}
            editor={editor}
            visibility={presentationFor(welcomeGroomLayer).opacity}
            transition={presentationFor(welcomeGroomLayer)}
            ambient={{
              xVw: -48 * (1 - handMeet),
              yVh: 33 * (1 - handMeet),
              rotate: 5 * (1 - handMeet),
            }}
            className={styles.welcomeHand}
            boxClassName={styles.sceneLayer}
            imageClassName={styles.sceneLayerImage}
            selectedClassName={styles.sceneLayerSelected}
            resizeHandleClassName={styles.sceneResizeHandle}
          />
        )}
        {welcomeBrideLayer && (
          <CinematicSceneLayer
            layer={welcomeBrideLayer}
            editor={editor}
            visibility={presentationFor(welcomeBrideLayer).opacity}
            transition={presentationFor(welcomeBrideLayer)}
            ambient={{
              xVw: 44 * (1 - handMeet),
              yVh: -30 * (1 - handMeet),
              rotate: -5 * (1 - handMeet),
            }}
            className={styles.welcomeHand}
            boxClassName={styles.sceneLayer}
            imageClassName={styles.sceneLayerImage}
            selectedClassName={styles.sceneLayerSelected}
            resizeHandleClassName={styles.sceneResizeHandle}
          />
        )}
        {welcomeRingLayer && (
          <CinematicSceneLayer
            layer={welcomeRingLayer}
            editor={editor}
            visibility={presentationFor(welcomeRingLayer).opacity}
            transition={presentationFor(welcomeRingLayer)}
            ambient={{
              xVw: 8 * (1 - handMeet),
              yVh: 7 * (1 - handMeet),
              scale: .72 + handMeet * .28,
            }}
            className={styles.welcomeRing}
            boxClassName={styles.sceneLayer}
            imageClassName={styles.sceneLayerImage}
            selectedClassName={styles.sceneLayerSelected}
            resizeHandleClassName={styles.sceneResizeHandle}
          />
        )}

        <section className={styles.walimahCopy} style={{ opacity: narrativeVisibilityFor('walimah-copy') }}>
          <p>{t('invite.heading', 'With the blessings of our families')}</p>
          <h1>{t('walimah.title', 'Walimatul Urus')}</h1>
          <div dangerouslySetInnerHTML={{ __html: t('walimah.body', `We request the pleasure of your company as ${secondaryName} and ${primaryName} begin their life together.`) }} />
          <time>{dateText} · {timeText}</time>
          <address>{wedding.venue}<br />{wedding.venueAddress}</address>
        </section>

        {!singleHonoree && <PersonDetail
          side="left" opacity={narrativeVisibilityFor('groom-details')}
          name={primaryName} title={t('people.primary.title', 'The Groom')}
          detail={t('people.primary.details', 'Beloved son, devoted partner, and the other half of this painted promise.')}
        />}
        <PersonDetail
          side="right" opacity={singleHonoree
            ? narrativeVisibilityFor('groom-details')
            : narrativeVisibilityFor('bride-details')}
          name={singleHonoree ? (wedding.name1 || secondaryName) : secondaryName}
          title={singleHonoree ? t('people.honoree.title', 'Guest of Honour') : t('people.secondary.title', 'The Bride')}
          detail={singleHonoree ? t('people.honoree.details', 'The person at the heart of this celebration.') : t('people.secondary.details', 'Beloved daughter, cherished partner, and the heart of this painted promise.')}
        />

        {rsvpLayer && (
          <CinematicSceneLayer
            layer={rsvpLayer} editor={editor}
            visibility={presentationFor(rsvpLayer, rsvpFocus).opacity}
            transition={presentationFor(rsvpLayer, rsvpFocus)}
            interactive={!editing && presentationFor(rsvpLayer, rsvpFocus).opacity > .7}
            className={interactions.rsvp === 'closing' ? styles.interactionClosing : styles.interactionObject}
            boxClassName={styles.sceneLayer} imageClassName={styles.sceneLayerImage}
            selectedClassName={styles.sceneLayerSelected} resizeHandleClassName={styles.sceneResizeHandle}
          >
            <button type="button" disabled={editing} className={styles.letterButton} onClick={() => openInteraction('rsvp')} aria-label="Open RSVP form" data-interaction-phase={interactions.rsvp}>
              <img src={rsvpLayer.src} alt="" className={styles.envelope} />
              <span className={styles.letter} style={{ transform: `translate(-50%, ${28 + letterProgress * (letterLift - 28)}%) scale(${0.78 + letterProgress * 0.22})` }}>
                <small>{t('rsvp.subtitle', 'Kindly respond')}</small>
                <strong>{t('rsvp.title', 'RSVP')}</strong>
                <em>Open response form</em>
              </span>
            </button>
          </CinematicSceneLayer>
        )}

        {wishesLayer && (
          <CinematicSceneLayer
            layer={wishesLayer} editor={editor}
            visibility={presentationFor(wishesLayer, wishFocus).opacity}
            transition={presentationFor(wishesLayer, wishFocus)}
            interactive={!editing && presentationFor(wishesLayer, wishFocus).opacity > .7}
            className={interactions.wish === 'closing' ? styles.interactionClosing : styles.interactionObject}
            boxClassName={styles.sceneLayer} imageClassName={styles.sceneLayerImage}
            selectedClassName={styles.sceneLayerSelected} resizeHandleClassName={styles.sceneResizeHandle}
          >
            <button type="button" disabled={editing} className={`${styles.bookButton} ${interactions.wish === 'closing' ? styles.bookClosing : ''}`} onClick={() => openInteraction('wish')} aria-label="Open best wishes form" data-interaction-phase={interactions.wish}>
              <img src={wishesLayer.src} alt="" />
              <span><small>{t('wish.prompt', 'Write a blessing for the couple')}</small><strong>{t('wish.title', 'Best Wishes')}</strong><em>Open guest book</em></span>
            </button>
          </CinematicSceneLayer>
        )}

        {photoBoothEnabled && memoryLayer && (
          <CinematicSceneLayer
            layer={memoryLayer} editor={editor}
            visibility={presentationFor(memoryLayer, photobooth).opacity}
            transition={presentationFor(memoryLayer, photobooth)}
            ambient={{ scale: 1.22 - photobooth * .22 }}
            boxClassName={styles.sceneLayer} imageClassName={styles.sceneLayerImage}
            selectedClassName={styles.sceneLayerSelected} resizeHandleClassName={styles.sceneResizeHandle}
          >
            <section className={styles.photoFinale}>
              <img src={memoryLayer.src} alt="" className={styles.photoArch} />
              <div className={styles.memoryFrames}>
                {Array.from({ length: 6 }).map((_, index) => {
                  const photo = approvedPhotos[index];
                  return (
                    <figure key={photo?.photoId ?? index} className={styles.memoryFrame}>
                      {photo ? <img src={`${API_BASE}${photo.photoUrl}`} alt={photo.caption || 'Approved guest memory'} /> : <span>{index === 0 ? t('photobooth.title', 'Our Memories') : '♡'}</span>}
                    </figure>
                  );
                })}
              </div>
              <div className={styles.photoCaption}>
                <h2>{t('photobooth.title', 'Our Memories')}</h2>
                <p>{t('photobooth.prompt', 'Approved moments shared by the people who made this day ours.')}</p>
              </div>
            </section>
          </CinematicSceneLayer>
        )}

        {viewportLayers.map((layer) => {
          const timing = presentationFor(layer);
          return <CinematicSceneLayer
            key={layer.id}
            layer={layer}
            editor={editor}
            visibility={timing.opacity}
            transition={{ xVw: timing.xVw, scale: timing.scale }}
            boxClassName={styles.sceneLayer}
            imageClassName={styles.sceneLayerImage}
            selectedClassName={styles.sceneLayerSelected}
            resizeHandleClassName={styles.sceneResizeHandle}
            slotProps={slotProps}
          />;
        })}

        <p className={styles.scrollCue} style={{ opacity: 1 - range(progress, 0.03, 0.12) }}>Scroll to begin</p>
        {editor?.enabled && editor.cinematic?.mode !== 'scene' && (
          <CinematicCameraSurface
            camera={camera}
            beatId={editor.cinematic?.mode === 'camera-beat' ? editor.cinematic.beatId : undefined}
            className={styles.cameraEditorSurface}
          />
        )}
        {editor?.enabled && editor.cinematic?.referenceSrc && (
          <img
            className={styles.referenceOverlay}
            src={editor.cinematic.referenceSrc}
            alt=""
            aria-hidden="true"
            style={{ opacity: editor.cinematic.referenceOpacity ?? 0.45 }}
          />
        )}
        <SheetHost groups={SHEETS} slotProps={slotProps} themeStyle={SHEET_THEME} />
      </main>
    </div>
  );
}

function PersonDetail({ side, opacity, name, title, detail }: {
  side: 'left' | 'right'; opacity: number; name: string; title: string; detail: string;
}) {
  return (
    <section className={`${styles.personDetail} ${side === 'left' ? styles.detailLeft : styles.detailRight}`} style={{ opacity }}>
      <p>{title}</p><h2>{name}</h2><div dangerouslySetInnerHTML={{ __html: detail }} />
    </section>
  );
}

const SHEET_THEME = {
  '--slot-ink': '#4a3a32', '--slot-ink-soft': 'rgba(74,58,50,.72)', '--slot-ink-faint': 'rgba(74,58,50,.48)',
  '--slot-rule': 'rgba(167,119,74,.24)', '--slot-accent': '#b77b65', '--slot-accent-ink': '#fffaf2',
  '--slot-radius': '22px', '--slot-font-display': "var(--font-ae-cormorant), Georgia, serif",
  '--slot-font-serif': "var(--font-ae-eb-garamond), Georgia, serif", '--slot-font-body': "var(--font-ae-eb-garamond), Georgia, serif",
  '--slot-panel-bg': 'linear-gradient(180deg, rgba(255,252,244,.98), rgba(248,236,222,.98))',
  '--slot-panel-shadow': '0 26px 70px rgba(83,56,39,.22)',
} as CSSProperties;
