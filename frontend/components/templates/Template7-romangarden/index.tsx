'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';
import {
  Wedding, Wish, Photo, ItineraryItem, SeatingTable, CreateWish,
} from '@/lib/api';
import { resolveSectionOrder } from '@/lib/templateUtils';
import { useReducedMotion } from '@/lib/useReducedMotion';
import type { Breakpoint, EditorHandle, SlotProps, StageId } from './types';
import { T7_ASSETS, T7_STAGES, STAGE_GROUPS } from './data/stages';
import { T7_ASSET_SIZES } from './data/assetSizes';
import { useStageLayout } from '@/components/templates/_shared/layout';
import { useStageReveal } from '@/components/templates/_shared/hooks/useStageReveal';
import { useParallax } from '@/components/templates/_shared/hooks/useParallax';
import { useBreakpoint } from '@/components/templates/_shared/hooks/useBreakpoint';
import { EngineProvider } from '@/components/templates/_shared/engine';
import Stage from '@/components/templates/_shared/Stage';
import HorizontalRail, { type RailPanel } from '@/components/templates/_shared/HorizontalRail';
import { SLOT_REGISTRY, stageHasContent, visibleSlotLayers } from '@/components/templates/_shared/slots';
import { fontVar } from '@/lib/fonts/curated';
import NavBar from './components/NavBar';
import styles from './Template7.module.css';

interface Template7Props {
  wedding: Wedding;
  onRSVP: (data: unknown) => Promise<void>;
  onSubmitWish: (data: CreateWish) => Promise<void>;
  onUploadPhoto?: (data: unknown) => Promise<void>;
  wishes: Wish[];
  photos: Photo[];
  photoBoothEnabled: boolean;
  seatingEnabled?: boolean;
  tables?: SeatingTable[];
  coupleMedia?: Photo[];
  customConfig?: Record<string, string>;
  itinerary?: ItineraryItem[];
  /** Set only by the customize preview iframe — guests never receive this. */
  editor?: EditorHandle;
}

/** Real device dims per breakpoint (mirrors the preview's DEVICE_DIMS). In "Reveal off-screen"
 *  mode the stage is pinned to these so bleed spills around it in the widened preview iframe. */
const REVEAL_FRAME_W: Record<Breakpoint, number> = { mobile: 390, desktop: 1440 };
const REVEAL_FRAME_H: Record<Breakpoint, number> = { mobile: 844, desktop: 900 };

/** The shared-art stage for the compiled ceremony row (see `data/stages.ts`). Stable identity so
 *  the `useStageLayout` memo below isn't invalidated every render. */
const CEREMONY_RAIL_IDS: StageId[] = ['ceremony-rail'];

/** Nav label per logical section, overridable via nav.* config. */
const NAV_FALLBACK: Record<string, string> = {
  welcome: 'Home',
  walimah: 'Ceremony',
  rsvp: 'RSVP',
  itinerary: 'Programme',
  wishes: 'Wishes',
  photobooth: 'Photos',
};

const NAV_KEY: Record<string, string> = {
  welcome: 'nav.welcome',
  walimah: 'nav.walimah',
  rsvp: 'nav.rsvp',
  itinerary: 'nav.itinerary',
  wishes: 'nav.wishes',
  photobooth: 'nav.photos',
};

export default function Template7({
  wedding,
  onRSVP,
  onSubmitWish,
  onUploadPhoto,
  wishes,
  photos,
  photoBoothEnabled,
  seatingEnabled = false,
  tables = [],
  customConfig,
  itinerary = [],
  editor,
}: Template7Props) {
  const t = useCallback(
    (key: string, fallback: string) => customConfig?.[key] || fallback,
    [customConfig],
  );

  const reduced = useReducedMotion();
  const editing = Boolean(editor?.enabled);

  // While the Adjust panel is open it pins the breakpoint it's editing, so a desktop admin can
  // lay out the mobile composition without resizing their window.
  const breakpoint: Breakpoint = useBreakpoint(editing ? editor!.breakpoint : undefined);

  const [activeSection, setActiveSection] = useState('welcome');
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const musicUrl = t('music.url', '');
  const musicLoop = t('music.loop', 'true') === 'true';
  const inkTint = t('scene.ink.tint', '#3D3833');
  const grain = t('scene.paper.grain', 'true') !== 'false';
  const parallaxMode = t('scene.parallax', 'on');
  const ceremonyLayout = t('scene.ceremony.layout', 'stack');

  const slotProps: SlotProps = useMemo(
    () => ({
      wedding, t, wishes, photos, tables, itinerary,
      seatingEnabled, photoBoothEnabled,
      onRSVP, onSubmitWish, onUploadPhoto,
      editing,
      // The hero slot uses these to resolve its own sub-layers (theme/names/date/timer).
      config: customConfig, breakpoint, editor,
    }),
    [wedding, t, wishes, photos, tables, itinerary, seatingEnabled, photoBoothEnabled,
     onRSVP, onSubmitWish, onUploadPhoto, editing, customConfig, breakpoint, editor],
  );

  // `section.order` keeps the six logical codes shared with every other template; T7 expands
  // each into the stages it owns. Feature gating therefore stays exactly where it already was.
  const sections = useMemo(
    () =>
      resolveSectionOrder(
        t('section.order', 'welcome,walimah,rsvp,itinerary,wishes,photobooth'),
        Boolean(t('walimah.body', '')),
        itinerary.length > 0,
        photoBoothEnabled,
      ),
    [t, itinerary.length, photoBoothEnabled],
  );

  const stageIds = useMemo(
    () => sections.flatMap((code) => (STAGE_GROUPS[code] ?? []) as StageId[]),
    [sections],
  );

  // The Adjust panel now lives in the parent customize page and writes straight into
  // `customConfig`, so the layout renders directly from it — no cross-iframe patch protocol, no
  // optimistic shadow. `editor` only carries which layer to outline while editing.
  const stages = useStageLayout('t7', T7_STAGES, stageIds, breakpoint, customConfig);
  // The compiled-row shared art lives in its own stage (row-relative coordinates), resolved
  // independently so it isn't a scroll section. Only consumed when the ceremony renders as a row.
  const ceremonyRail = useStageLayout('t7', T7_STAGES, CEREMONY_RAIL_IDS, breakpoint, customConfig);
  const { rootRef, seen } = useStageReveal(reduced);
  useParallax(rootRef, parallaxMode, reduced);

  // Re-group the flat resolved `stages` back into their sections, so a background-sharing group
  // (the ceremony `walimah` beats) can render as one horizontal rail instead of a vertical stack.
  const firstStageId = stages[0]?.def.id;
  const stageGroups = useMemo(() => {
    const out: { code: string; items: typeof stages }[] = [];
    let idx = 0;
    for (const code of sections) {
      const size = (STAGE_GROUPS[code] ?? []).length;
      out.push({ code, items: stages.slice(idx, idx + size) });
      idx += size;
    }
    return out;
  }, [sections, stages]);

  // Which nav pill lights up. All three ceremony stages belong to one pill.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const stageToSection = new Map<string, string>();
    for (const [code, ids] of Object.entries(STAGE_GROUPS)) {
      for (const id of ids) stageToSection.set(id, code);
    }

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const id = (visible.target as HTMLElement).dataset.stage!;
        setActiveSection(stageToSection.get(id) ?? id);
      },
      { threshold: [0.35, 0.6] },
    );
    root.querySelectorAll('[data-stage]').forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [rootRef, stageIds]);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicPlaying) audio.pause();
    else audio.play().catch(() => {});
    setMusicPlaying(!musicPlaying);
  };

  const navTo = (code: string) => {
    const first = STAGE_GROUPS[code]?.[0];
    if (first) document.getElementById(first)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navItems = sections.map((code) => ({
    id: code,
    label: t(NAV_KEY[code], NAV_FALLBACK[code]),
  }));

  return (
    <EngineProvider value={{ assetRoot: T7_ASSETS, assetSizes: T7_ASSET_SIZES, slotRegistry: SLOT_REGISTRY }}>
    {/* The shared _shared/slots/slots.module.css used by every kind:'slot' layer below is
        neutral by default (for authored templates) — this block overrides those --slot-* custom
        properties to T7's own original values (mirroring the --t7-* tokens still defined in
        Template7.module.css) so extracting the slot components out of this file changed nothing
        visually. Every value here must stay in sync with slots.module.css's neutral fallbacks —
        it's the *values* that differ, never which tokens exist.

        `--slot-ink`/`--slot-font-display` are the two the Adjust panel's "Theme" section can
        override (t7.layout.slotTheme.accentColor/.headingFont) — read via `t()` so an untouched
        wedding renders T7's original values unchanged. */}
    <div
      ref={rootRef}
      className={styles.wrapper}
      style={{
        '--slot-ink': t('t7.layout.slotTheme.accentColor', '#3d3833'),
        '--slot-ink-soft': '#6f675c',
        '--slot-ink-faint': '#9b9284',
        '--slot-rule': 'rgba(61, 56, 51, 0.28)',
        '--slot-font-display': fontVar(customConfig?.['t7.layout.slotTheme.headingFont']) ?? "'Cinzel', serif",
        '--slot-font-serif': "'Cormorant Garamond', serif",
        '--slot-font-body': "'EB Garamond', serif",
        '--slot-hero-scrim-1': 'rgba(244, 241, 234, 0.88)',
        '--slot-hero-scrim-2': 'rgba(244, 241, 234, 0.62)',
        '--slot-panel-scrim-1': 'rgba(244, 241, 234, 0.82)',
        '--slot-panel-scrim-2': 'rgba(244, 241, 234, 0.66)',
        '--slot-panel-scrim-3': 'rgba(244, 241, 234, 0.28)',
        '--slot-accent-ink': '#efebe1',
        '--slot-radius': '0',
        '--slot-submit-bg': "url('/templates/t7/wishes/submit-btn.webp')",
      } as CSSProperties}
    >
      {stageGroups.map(({ code, items }) => {
        // A stage whose only slot has no content to show is dropped, rather than costing the guest
        // a full screen of empty scrolling. Shared with _shared/DataTemplate.tsx — see
        // _shared/slots/index.ts.
        const hasContent = (r: (typeof items)[number]) => stageHasContent(r.layers, slotProps);
        const visibleLayers = (r: (typeof items)[number]) => visibleSlotLayers(r.layers, slotProps);

        const content = items.filter(hasContent);
        if (!content.length) return null;

        // The ceremony beats share one background and one set of frame art: compile them into a
        // pinned horizontal rail when the couple opts in (and motion is allowed). The shared frame
        // art (pillars/pots/bench) is deduped — taken once from the first beat and rendered across
        // the whole row — while each beat contributes only its own slot content. Reveal-off-screen
        // is not passed to rail panels.
        if (code === 'walimah' && ceremonyLayout === 'row' && !reduced && content.length > 1) {
          const panels: RailPanel[] = content.map((r) => ({
            def: r.def,
            layers: visibleLayers(r).filter((l) => l.kind === 'slot'),
            bgFit: r.bgFit,
          }));
          const rail = ceremonyRail[0];
          return (
            <HorizontalRail
              key={code}
              panels={panels}
              sharedLayers={rail?.layers ?? []}
              sharedStageId="ceremony-rail"
              bg={rail?.def.bg ?? content[0].def.bg}
              bgFit={rail?.bgFit}
              bgPosition={rail?.bgPosition}
              bgScale={rail?.bgScale}
              bgSrc={rail?.bgSrc}
              slotProps={slotProps}
              editing={editing}
              editor={editor}
              parallaxOn={parallaxMode !== 'off'}
              firstEager={content[0].def.id === firstStageId}
            />
          );
        }

        return content.map((r) => (
          <Stage
            key={r.def.id}
            def={r.def}
            layers={visibleLayers(r)}
            bgFit={r.bgFit}
            bgPosition={r.bgPosition}
            bgScale={r.bgScale}
            bgSrc={r.bgSrc}
            seen={seen.has(r.def.id) || reduced}
            slotProps={slotProps}
            eager={r.def.id === firstStageId}
            // Outline the layer the parent's Adjust dock currently has selected.
            editing={editing && editor?.selectedStage === r.def.id}
            revealOverflow={editing && Boolean(editor?.revealOverflow)}
            revealFrameW={REVEAL_FRAME_W[breakpoint]}
            revealFrameH={REVEAL_FRAME_H[breakpoint]}
            selectedLayer={editor?.selectedLayer}
          />
        ));
      })}

      {/* The art is baked monochrome sepia, so one multiply pass re-tones every stage at once. */}
      <div className={styles.tint} style={{ background: inkTint }} aria-hidden />
      {grain && <div className={styles.grain} aria-hidden />}

      <NavBar items={navItems} active={activeSection} onNav={navTo} />

      {musicUrl && (
        <>
          <audio ref={audioRef} src={musicUrl} loop={musicLoop} preload="none" />
          <button
            className={styles.musicBtn}
            onClick={toggleMusic}
            aria-label={musicPlaying ? 'Pause music' : 'Play music'}
          >
            {musicPlaying ? '❚❚' : '♪'}
          </button>
        </>
      )}

      <footer className={styles.footer}>
        <div className={styles.fleuron}>❦</div>
        <p className={styles.footerTagline}>{t('footer.tagline', 'Made with love for our special day')}</p>
      </footer>
    </div>
    </EngineProvider>
  );
}
