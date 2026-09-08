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
import { SLOT_REGISTRY, sheetLayerGroups, stageHasContent, visibleSlotLayers } from '@/components/templates/_shared/slots';
import { SlotFlowProviders } from '@/components/templates/_shared/slots/FlowProviders';
import SheetHost from '@/components/templates/_shared/SheetHost';
import { fontVar } from '@/lib/fonts/registry';
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

/** Fallback device dims per breakpoint. In "Reveal off-screen" mode the stage is pinned to the
 *  real device size so bleed spills around it in the widened preview iframe; the customize page
 *  sends the size actually being previewed as `editor.frame.{w,svh}` and these are only used when
 *  it doesn't (e.g. the authoring preview, which never reveals). Height is the Safari-*visible*
 *  (svh) height, not the whole screen — see docs/FIX_QUEUE.md Issue 2. */
const REVEAL_FRAME_W: Record<Breakpoint, number> = { mobile: 390, desktop: 1440 };
const REVEAL_FRAME_H: Record<Breakpoint, number> = { mobile: 664, desktop: 900 };

/** The shared-art stage for the compiled ceremony row (see `data/stages.ts`). Stable identity so
 *  the `useStageLayout` memo below isn't invalidated every render. */
const CEREMONY_RAIL_IDS: StageId[] = ['ceremony-rail'];

/** nav.size / nav.textSize (templateConfigSchema.ts) — a `select`, not a slider (this schema has
 *  no numeric field type), so friendly words map to the actual multiplier here. */
const NAV_SIZE_SCALE: Record<string, number> = {
  compact: 0.8, default: 1, large: 1.2, xlarge: 1.4,
};

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
  // The bottom nav pill is position:fixed chrome — not a stage-bound layer, so it's tuned via
  // plain config (like scene.parallax) rather than the Adjust dock. See nav.size/nav.textSize in
  // templateConfigSchema.ts.
  const navScale = NAV_SIZE_SCALE[t('nav.size', 'default')] ?? 1;
  const navTextScale = NAV_SIZE_SCALE[t('nav.textSize', 'default')] ?? 1;

  // Adjust panel's "Card" section — glassmorphism for every `.panel`-based slot at once
  // (walimah/couple/details/RSVP/wishes/...), mirroring Template 5's own frosted-glass card.
  // `cardStyle` defaults to 'glass' whenever a pre-existing `cardBlur` value is on record (a
  // config saved before the style dropdown existed), so the Adjust panel's Card section stays in
  // sync with what's actually rendering instead of showing "None" over a real applied blur.
  const legacyCardBlur = Number(t('t7.layout.slotTheme.cardBlur', '0')) || 0;
  const cardStyle = t('t7.layout.slotTheme.cardStyle', legacyCardBlur > 0 ? 'glass' : 'none');
  const cardBlurPx = legacyCardBlur || 16;
  const cardTint = t('t7.layout.slotTheme.cardTint', '#fffbf4');
  const cardTintOpacity = Number(t('t7.layout.slotTheme.cardTintOpacity', '0.45')) || 0.45;
  const cardRadius = Number(t('t7.layout.slotTheme.cardRadius', '24')) || 24;

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
  // Forms live in a bottom sheet rather than on the stage: a stage is an art composition (scenery
  // drawn around a specific element) while a form is variable-height content, so inline it has to
  // reserve a fixed box its absolutely-positioned neighbours can never reflow into. Collected
  // across every stage so one host can mount them all — see _shared/SheetHost.tsx.
  const sheetGroups = useMemo(() => sheetLayerGroups(stages, slotProps), [stages, slotProps]);
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
    <SlotFlowProviders>
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
        // Font fallbacks go through `fontVar()` (the reliably self-hosted next/font copy), never
        // a literal quoted family name — a literal name depends on this file's own Google Fonts
        // `@import` finishing before paint, which is fragile and was the root cause of headings/
        // buttons occasionally rendering in the wrong font while `fontVar`-driven text didn't.
        '--slot-font-display': fontVar(customConfig?.['t7.layout.slotTheme.headingFont']) ?? fontVar('cinzel'),
        '--slot-font-serif':
          fontVar(customConfig?.['t7.layout.slotTheme.bodyFont'])
          ?? fontVar(customConfig?.['t7.layout.slotTheme.headingFont'])
          ?? fontVar('cormorant'),
        '--slot-font-body':
          fontVar(customConfig?.['t7.layout.slotTheme.bodyFont'])
          ?? fontVar(customConfig?.['t7.layout.slotTheme.headingFont'])
          ?? fontVar('eb-garamond'),
        // T7's own baseline scrim — its shipped identity, independent of the optional Card style
        // below. Selecting "None" in the Card dropdown turns off the *optional* glass overlay
        // only; it doesn't strip T7's own always-on look, which was never part of that system.
        '--slot-hero-scrim-1': 'rgba(244, 241, 234, 0.88)',
        '--slot-hero-scrim-2': 'rgba(244, 241, 234, 0.62)',
        '--slot-panel-scrim-1': 'rgba(244, 241, 234, 0.82)',
        '--slot-panel-scrim-2': 'rgba(244, 241, 234, 0.66)',
        '--slot-panel-scrim-3': 'rgba(244, 241, 234, 0.28)',
        '--slot-accent-ink': '#efebe1',
        '--slot-radius': '0',
        '--t7-nav-scale': navScale,
        '--t7-nav-text-scale': navTextScale,
        ...(cardStyle === 'glass' ? {
          '--slot-panel-bg': `color-mix(in srgb, ${cardTint} ${Math.round(cardTintOpacity * 100)}%, transparent)`,
          '--slot-panel-blur': `blur(${cardBlurPx}px) saturate(140%)`,
          '--slot-panel-border': '1px solid rgba(255, 255, 255, 0.45)',
          '--slot-panel-radius': `${cardRadius}px`,
          '--slot-panel-shadow': '0 1px 2px rgba(120,86,70,0.04), 0 8px 24px rgba(214,168,150,0.12), 0 24px 60px rgba(180,130,110,0.08)',
        } : null),
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
            revealFrameW={editor?.frame?.w ?? editor?.frameW ?? REVEAL_FRAME_W[breakpoint]}
            revealFrameH={editor?.frame?.svh ?? editor?.frameH ?? REVEAL_FRAME_H[breakpoint]}
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

      {/* Inside `.wrapper` deliberately: T7's --slot-* theme tokens are set inline on that div, so
          a sheet mounted outside it would render unthemed. Safe for `position: fixed` — .wrapper
          is only position:relative/overflow-x:clip with no transform/filter/contain, which is why
          .tint and .grain already sit here as fixed, full-viewport layers. */}
      <SheetHost groups={sheetGroups} slotProps={slotProps} editor={editor} />
    </div>
    </EngineProvider>
    </SlotFlowProviders>
  );
}
