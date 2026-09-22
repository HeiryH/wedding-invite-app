'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';
import {
  Wedding, Wish, Photo, ItineraryItem, SeatingTable, CreateWish,
} from '@/lib/api';
import { resolveSectionOrder } from '@/lib/templateUtils';
import { animateScrollIntoView } from '@/components/templates/_shared/animateScrollTo';
import { useReducedMotion } from '@/lib/useReducedMotion';
import type { Breakpoint, EditorHandle, SlotProps, StageId } from './types';
import { T13_ASSETS, T13_STAGES, STAGE_GROUPS } from './data/stages';
import { T13_ASSET_SIZES } from './data/assetSizes';
import { useStageLayout } from '@/components/templates/_shared/layout';
import { useStageReveal } from '@/components/templates/_shared/hooks/useStageReveal';
import { useParallax } from '@/components/templates/_shared/hooks/useParallax';
import { useBreakpoint } from '@/components/templates/_shared/hooks/useBreakpoint';
import { EngineProvider } from '@/components/templates/_shared/engine';
import Stage from '@/components/templates/_shared/Stage';
import { SLOT_REGISTRY, sheetLayerGroups, stageHasContent, visibleSlotLayers } from '@/components/templates/_shared/slots';
import { SlotFlowProviders } from '@/components/templates/_shared/slots/FlowProviders';
import SheetHost from '@/components/templates/_shared/SheetHost';
import { fontVar } from '@/lib/fonts/registry';
import TemplateNav, { type NavLayout } from '@/components/templates/_shared/nav/TemplateNav';
import {
  DinoDetailsSlot,
  DinoHeroSlot,
  DinoItinerarySlot,
  DinoPhotoBoothSlot,
  DinoRsvpSlot,
  DinoWishesSlot,
} from './DinoSlots';
import styles from './Template13.module.css';

// Preserves T10's pre-consolidation nav pill pixel-for-pixel (its .nav/.navBtn/.navActive rules,
// now removed from Template10.module.css, are reproduced here as --nav-* tokens for the shared
// _shared/nav/TemplateNav).
const T13_NAV_VARS: CSSProperties = {
  '--nav-bg': 'rgba(12, 47, 38, 0.92)',
  '--nav-border': 'rgba(255, 255, 255, 0.2)',
  '--nav-radius': '999px',
  '--nav-font': 'var(--slot-font-display)',
  '--nav-btn-pad-x': '0.85rem',
  '--nav-btn-size': '0.65rem',
  '--nav-btn-weight': '600',
  '--nav-btn-tracking': '0.02em',
  '--nav-color': 'rgba(255, 255, 255, 0.65)',
  '--nav-active-bg': '#A84227',
  '--nav-active-color': '#FFF1C5',
} as CSSProperties;

interface Template13Props {
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

/** Fallback device dims per breakpoint, used only when the customize preview hasn't sent its own
 *  (see EditorHandle.frame) — see T7's identical constants and docs/FIX_QUEUE.md Issue 2. */
/** nav.size / nav.textSize (templateConfigSchema.ts) — a `select`, not a slider, so friendly
 *  words map to the actual multiplier here. */
const NAV_SIZE_SCALE: Record<string, number> = {
  compact: 0.8, default: 1, large: 1.2, xlarge: 1.4,
};

/** Nav label per logical section, overridable via nav.* config. */
const NAV_FALLBACK: Record<string, string> = {
  welcome: 'Home',
  walimah: 'Details',
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

export default function Template13({
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
}: Template13Props) {
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
  const parallaxMode = t('scene.parallax', 'on');
  // The nav pill is position:fixed chrome — not a stage-bound layer, so it's tuned via plain
  // config rather than the Adjust dock. See nav.size/nav.textSize/nav.layout in
  // templateConfigSchema.ts.
  const navScale = NAV_SIZE_SCALE[t('nav.size', 'default')] ?? 1;
  const navTextScale = NAV_SIZE_SCALE[t('nav.textSize', 'default')] ?? 1;
  const navLayout = t('nav.layout', 'bottom-pill') as NavLayout;

  // Adjust panel's "Card" section: an explicit style pick, not an implicit default. 'none' (the
  // default here) leaves --slot-panel-bg unset entirely — slots.module.css's own `.panel`
  // fallback is plain `transparent` (no scrim of any kind) and `.sheetCard`'s is a solid
  // `#fdfaf5`, so a popup (RSVP/seating/wishes) always stays legible while inline content
  // (photo booth) shows nothing until the couple picks a look here. 'radial'/'glass' each build
  // a complete `--slot-panel-bg` value themselves rather than leaning on any implicit shape in
  // the shared CSS, so what a couple sees is entirely this file's choice, not a hidden default.
  const cardStyle = t('t13.layout.slotTheme.cardStyle', 'none');
  const cardBlurPx = Number(t('t13.layout.slotTheme.cardBlur', '16')) || 16;
  const cardTint = t('t13.layout.slotTheme.cardTint', '#f6e5b6');
  const cardTintOpacity = Number(t('t13.layout.slotTheme.cardTintOpacity', '0.58')) || 0.58;
  const cardRadius = Number(t('t13.layout.slotTheme.cardRadius', '18')) || 18;
  const cardStyleVars: CSSProperties =
    cardStyle === 'glass' ? ({
      '--slot-panel-bg': `color-mix(in srgb, ${cardTint} ${Math.round(cardTintOpacity * 100)}%, transparent)`,
      '--slot-panel-blur': `blur(${cardBlurPx}px) saturate(140%)`,
      '--slot-panel-border': '1px solid rgba(255, 255, 255, 0.5)',
      '--slot-panel-radius': `${cardRadius}px`,
      '--slot-panel-shadow': '0 1px 2px rgba(90,60,20,0.05), 0 8px 24px rgba(230,150,60,0.14), 0 24px 60px rgba(210,120,50,0.1)',
    } as CSSProperties)
    : cardStyle === 'radial' ? ({
      '--slot-panel-bg': 'radial-gradient(ellipse at center, rgba(255, 246, 227, 0.88) 0%, rgba(255, 246, 227, 0.7) 45%, rgba(255, 246, 227, 0.3) 72%, transparent 88%)',
    } as CSSProperties)
    : ({} as CSSProperties);

  const slotProps: SlotProps = useMemo(
    () => ({
      wedding, t, wishes, photos, tables, itinerary,
      seatingEnabled, photoBoothEnabled,
      onRSVP, onSubmitWish, onUploadPhoto,
      editing,
      config: customConfig, breakpoint, editor,
    }),
    [wedding, t, wishes, photos, tables, itinerary, seatingEnabled, photoBoothEnabled,
     onRSVP, onSubmitWish, onUploadPhoto, editing, customConfig, breakpoint, editor],
  );

  // `section.order` keeps the six logical codes shared with every other template; T10 expands
  // each into the one stage it owns (see STAGE_GROUPS). Feature gating therefore stays exactly
  // where it already was.
  const sections = useMemo(
    () =>
      resolveSectionOrder(
        t('section.order', 'welcome,walimah,itinerary,rsvp,wishes,photobooth'),
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

  // The Adjust panel lives in the parent customize page and writes straight into `customConfig`,
  // so the layout renders directly from it — no cross-iframe patch protocol, no optimistic shadow.
  // `editor` only carries which layer to outline while editing.
  const stages = useStageLayout('t13', T13_STAGES, stageIds, breakpoint, customConfig);
  // Forms live in a bottom sheet rather than on the stage: a stage is an art composition (scenery
  // drawn around a specific element) while a form is variable-height content, so inline it has to
  // reserve a fixed box its absolutely-positioned neighbours can never reflow into. Collected
  // across every stage so one host can mount them all — see _shared/SheetHost.tsx.
  const sheetGroups = useMemo(() => sheetLayerGroups(stages, slotProps), [stages, slotProps]);
  const { rootRef, seen } = useStageReveal(reduced, stageIds.join(','));
  useParallax(rootRef, parallaxMode, reduced);

  const firstStageId = stages[0]?.def.id;

  // Which nav pill lights up.
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
    const el = first ? document.getElementById(first) : null;
    // Fixed-duration custom scroll, not native `scrollIntoView({behavior:'smooth'})` — see
    // animateScrollTo.ts: browsers disagree on smooth-scroll duration/easing (Safari's runs
    // noticeably slower/more pronounced than Chromium's), which on a stage whose top ~20-25% is
    // plain sky before any art begins reads as a much longer "blank" moment in one browser only.
    if (el) animateScrollIntoView(el);
  };

  const navItems = sections.map((code) => ({
    id: code,
    label: t(NAV_KEY[code], NAV_FALLBACK[code]),
  }));

  return (
    <SlotFlowProviders>
    <EngineProvider value={{
      assetRoot: T13_ASSETS,
      assetSizes: T13_ASSET_SIZES,
      slotRegistry: {
        ...SLOT_REGISTRY,
        eventHero: DinoHeroSlot,
        ceremonyDetails: DinoDetailsSlot,
        itineraryList: DinoItinerarySlot,
        rsvpTitle: DinoRsvpSlot,
        wishTitle: DinoWishesSlot,
        photoBooth: DinoPhotoBoothSlot,
      },
    }}>
    {/* The shared _shared/slots/slots.module.css used by every kind:'slot' layer below is neutral
        by default — this block sets those --slot-* custom properties to Sunny Safari's own
        savanna palette (dark warm ink on cream cards, rounded corners, Baloo 2 headings) so every
        RSVP/wishes/itinerary/photobooth panel reads as part of this template rather than the
        neutral authored-template default.

        `--slot-font-display`/`--slot-font-serif` are what the Adjust panel's "Theme" section
        overrides (t10.layout.slotTheme.headingFont/.bodyFont) — read via `t()` so an untouched
        invitation renders these defaults unchanged.

        `--slot-ink` (headings/body text) and `--slot-accent` (button/highlight fills — a distinct
        variable, see slots.module.css's own comment on it) are deliberately DIFFERENT colours
        here, sampled straight from the reference art: near-black text, terracotta buttons. The
        Adjust panel's "Accent" picker drives `--slot-accent` for this template — for a two-tone
        design like this one, "accent" reads as "my button colour," not "my body text colour."

        Font fallbacks go through `fontVar()` (→ `var(--font-ae-<key>)`, the reliably self-hosted
        next/font copy each curated font already loads globally), never a literal quoted family
        name — a literal name depends on this file's own `@import` from fonts.googleapis.com
        finishing before paint, which is exactly what made RSVP/Wishes headings and buttons render
        in the wrong font while the (fontVar-driven) welcome-stage title didn't. */}
    <div
      ref={rootRef}
      className={styles.wrapper}
      style={{
        '--slot-ink': '#173F33',
        '--slot-ink-soft': '#355F4F',
        '--slot-ink-faint': '#71856D',
        '--slot-rule': 'rgba(23, 63, 51, 0.2)',
        '--slot-accent': t('t13.layout.slotTheme.accentColor', '#A84227'),
        '--slot-accent-ink': '#FFF1C5',
        // Wish-card look, sampled from the reference art: a solid warm-cream fill (not the
        // generic off-white scrim), centred text, no left accent stripe.
        '--slot-panel-scrim-1': '#F6E5B6',
        '--slot-wishitem-align': 'center',
        '--slot-wishitem-border': 'none',
        // Itinerary look, matching the reference mockup: centred stacked time/label pairs with
        // generous breathing room, no timeline rail or dot markers (T7's elegant-wedding recipe),
        // bold rounded-caps labels instead of a thin serif line.
        '--slot-itin-align': 'center',
        '--slot-itin-items-align': 'center',
        '--slot-itin-indent': '0',
        '--slot-itin-rail-display': 'none',
        '--slot-itin-dot-display': 'none',
        '--slot-itin-gap': '0.15rem',
        '--slot-itin-item-padding': '0',
        '--slot-itin-time-color': '#8D3B25',
        '--slot-itin-title-font': 'var(--slot-font-display)',
        '--slot-itin-title-weight': '800',
        '--slot-itin-title-size': 'clamp(0.7rem, 1.9cqi, 0.88rem)',
        '--slot-itin-title-transform': 'uppercase',
        // The "❦" hedera + rule pair under several shared title slots is a Roman Garden (T7)
        // flourish, not a template-neutral one — hidden here, unaffected everywhere else.
        '--slot-fleuron': 'none',
        '--slot-font-display': fontVar(customConfig?.['t13.layout.slotTheme.headingFont']) ?? fontVar('baloo-2'),
        // Body falls back to Heading (not straight to the template default) when only one font is
        // picked, so setting just "Heading" in the Adjust panel re-fonts the whole template —
        // "Body" is there only to differentiate headings from field/body copy if wanted.
        '--slot-font-serif':
          fontVar(customConfig?.['t13.layout.slotTheme.bodyFont'])
          ?? fontVar(customConfig?.['t13.layout.slotTheme.headingFont'])
          ?? fontVar('nunito'),
        '--slot-font-body':
          fontVar(customConfig?.['t13.layout.slotTheme.bodyFont'])
          ?? fontVar(customConfig?.['t13.layout.slotTheme.headingFont'])
          ?? fontVar('nunito'),
        '--slot-radius': '20px',
        // Every `--slot-font-serif` role in slots.module.css (dates, captions, notices, empty
        // states, form placeholders) is unconditionally italic by default — a T7-elegant-wedding
        // choice that reads as an obvious mismatch on a crayon-texture kids'-party design (the
        // reference art has no italics anywhere). `--slot-body-style` is the shared escape hatch.
        '--slot-body-style': 'normal',
        // Card style — an explicit pick (Adjust panel "Card" section). See the cardStyle
        // definition above for what each option does and does not touch.
        ...cardStyleVars,
      } as CSSProperties}
    >
      {stages.map((r) => {
        // A stage whose only slot has no content to show is dropped, rather than costing the
        // guest a full screen of empty scrolling. Shared with _shared/DataTemplate.tsx.
        if (!stageHasContent(r.layers, slotProps)) return null;
        return (
          <Stage
            key={r.def.id}
            def={r.def}
            layers={visibleSlotLayers(r.layers, slotProps)}
            bgFit={r.bgFit}
            bgPosition={r.bgPosition}
            bgScale={r.bgScale}
            bgSrc={r.bgSrc}
            seen={seen.has(r.def.id) || reduced}
            // Per-stage: lets a slot resolve its own sub-layers (the hero, the itinerary list's
            // Time/Label) via SlotProps.stageLayers — see types.ts's doc comment.
            slotProps={{ ...slotProps, stageLayers: r.layers }}
            eager={r.def.id === firstStageId}
            // `editing` (dock open at all) opens dock-wide click-to-select for cross-section
            // selection; `stageActive` (this stage is the one currently open) gates full
            // drag/resize and which layer's outline actually shows as selected.
            editing={editing}
            stageActive={editing && editor?.selectedStage === r.def.id}
            selectedLayer={editor?.selectedLayer}
          />
        );
      })}

      <TemplateNav
        items={navItems}
        active={activeSection}
        onNav={navTo}
        layout={navLayout}
        vars={{ ...T13_NAV_VARS, '--nav-scale': navScale, '--nav-text-scale': navTextScale } as CSSProperties}
      />

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
        <p className={styles.footerTagline}>{t('footer.tagline', 'Adventure awaits — see you at basecamp')}</p>
      </footer>

      {/* Inside `.wrapper` deliberately: T10's --slot-* theme tokens are set inline on that div,
          so a sheet mounted outside it would render unthemed. Safe for `position: fixed` —
          .wrapper is only position:relative/overflow-x:clip with no transform/filter/contain. */}
      <SheetHost groups={sheetGroups} slotProps={slotProps} editor={editor} />
    </div>
    </EngineProvider>
    </SlotFlowProviders>
  );
}
