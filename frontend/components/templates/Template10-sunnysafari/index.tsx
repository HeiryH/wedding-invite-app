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
import { T10_ASSETS, T10_STAGES, STAGE_GROUPS } from './data/stages';
import { T10_ASSET_SIZES } from './data/assetSizes';
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
import NavBar from './components/NavBar';
import styles from './Template10.module.css';

interface Template10Props {
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
const REVEAL_FRAME_W: Record<Breakpoint, number> = { mobile: 390, desktop: 1440 };
const REVEAL_FRAME_H: Record<Breakpoint, number> = { mobile: 664, desktop: 900 };

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

export default function Template10({
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
}: Template10Props) {
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
  // The bottom nav pill is position:fixed chrome — not a stage-bound layer, so it's tuned via
  // plain config rather than the Adjust dock. See nav.size/nav.textSize in templateConfigSchema.ts.
  const navScale = NAV_SIZE_SCALE[t('nav.size', 'default')] ?? 1;
  const navTextScale = NAV_SIZE_SCALE[t('nav.textSize', 'default')] ?? 1;

  // Adjust panel's "Card" section: an explicit style pick, not an implicit default. 'none' (the
  // default here) forces every `.panel`-based slot (details/RSVP/wishes/photobooth) fully
  // transparent — no scrim, no blur, nothing — until the couple deliberately picks a look.
  const cardStyle = t('t10.layout.slotTheme.cardStyle', 'none');
  const cardBlurPx = Number(t('t10.layout.slotTheme.cardBlur', '16')) || 16;
  const cardTint = t('t10.layout.slotTheme.cardTint', '#fff6e3');
  const cardTintOpacity = Number(t('t10.layout.slotTheme.cardTintOpacity', '0.5')) || 0.5;
  const cardRadius = Number(t('t10.layout.slotTheme.cardRadius', '20')) || 20;
  const cardStyleVars: CSSProperties =
    cardStyle === 'glass' ? ({
      '--slot-panel-bg': `color-mix(in srgb, ${cardTint} ${Math.round(cardTintOpacity * 100)}%, transparent)`,
      '--slot-panel-blur': `blur(${cardBlurPx}px) saturate(140%)`,
      '--slot-panel-border': '1px solid rgba(255, 255, 255, 0.5)',
      '--slot-panel-radius': `${cardRadius}px`,
      '--slot-panel-shadow': '0 1px 2px rgba(90,60,20,0.05), 0 8px 24px rgba(230,150,60,0.14), 0 24px 60px rgba(210,120,50,0.1)',
    } as CSSProperties)
    : cardStyle === 'radial' ? ({
      '--slot-panel-scrim-1': 'rgba(255, 246, 227, 0.88)',
      '--slot-panel-scrim-2': 'rgba(255, 246, 227, 0.7)',
      '--slot-panel-scrim-3': 'rgba(255, 246, 227, 0.3)',
    } as CSSProperties)
    : ({ '--slot-panel-bg': 'transparent' } as CSSProperties);

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

  // The Adjust panel lives in the parent customize page and writes straight into `customConfig`,
  // so the layout renders directly from it — no cross-iframe patch protocol, no optimistic shadow.
  // `editor` only carries which layer to outline while editing.
  const stages = useStageLayout('t10', T10_STAGES, stageIds, breakpoint, customConfig);
  // Forms live in a bottom sheet rather than on the stage: a stage is an art composition (scenery
  // drawn around a specific element) while a form is variable-height content, so inline it has to
  // reserve a fixed box its absolutely-positioned neighbours can never reflow into. Collected
  // across every stage so one host can mount them all — see _shared/SheetHost.tsx.
  const sheetGroups = useMemo(() => sheetLayerGroups(stages, slotProps), [stages, slotProps]);
  const { rootRef, seen } = useStageReveal(reduced);
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
    <EngineProvider value={{ assetRoot: T10_ASSETS, assetSizes: T10_ASSET_SIZES, slotRegistry: SLOT_REGISTRY }}>
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
        '--slot-ink': '#20180F',
        '--slot-ink-soft': '#5B4A34',
        '--slot-ink-faint': '#8C7A5E',
        '--slot-rule': 'rgba(32, 24, 15, 0.18)',
        '--slot-accent': t('t10.layout.slotTheme.accentColor', '#D9481B'),
        '--slot-accent-ink': '#FBE1A9',
        // Wish-card look, sampled from the reference art: a solid warm-cream fill (not the
        // generic off-white scrim), centred text, no left accent stripe.
        '--slot-panel-scrim-1': '#FDE9A0',
        '--slot-wishitem-align': 'center',
        '--slot-wishitem-border': 'none',
        // The "❦" hedera + rule pair under several shared title slots is a Roman Garden (T7)
        // flourish, not a template-neutral one — hidden here, unaffected everywhere else.
        '--slot-fleuron': 'none',
        '--slot-font-display': fontVar(customConfig?.['t10.layout.slotTheme.headingFont']) ?? fontVar('baloo-2'),
        // Body falls back to Heading (not straight to the template default) when only one font is
        // picked, so setting just "Heading" in the Adjust panel re-fonts the whole template —
        // "Body" is there only to differentiate headings from field/body copy if wanted.
        '--slot-font-serif':
          fontVar(customConfig?.['t10.layout.slotTheme.bodyFont'])
          ?? fontVar(customConfig?.['t10.layout.slotTheme.headingFont'])
          ?? fontVar('nunito'),
        '--slot-font-body':
          fontVar(customConfig?.['t10.layout.slotTheme.bodyFont'])
          ?? fontVar(customConfig?.['t10.layout.slotTheme.headingFont'])
          ?? fontVar('nunito'),
        '--slot-radius': '20px',
        // Every `--slot-font-serif` role in slots.module.css (dates, captions, notices, empty
        // states, form placeholders) is unconditionally italic by default — a T7-elegant-wedding
        // choice that reads as an obvious mismatch on a crayon-texture kids'-party design (the
        // reference art has no italics anywhere). `--slot-body-style` is the shared escape hatch.
        '--slot-body-style': 'normal',
        '--t10-nav-scale': navScale,
        '--t10-nav-text-scale': navTextScale,
        // Card style — an explicit pick (Adjust panel "Card" section), not an implicit default.
        // 'none' forces every panel fully transparent (no scrim, no blur) regardless of what
        // slots.module.css's own fallback would otherwise paint.
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
            slotProps={slotProps}
            eager={r.def.id === firstStageId}
            // Outline the layer the parent's Adjust dock currently has selected.
            editing={editing && editor?.selectedStage === r.def.id}
            revealOverflow={editing && Boolean(editor?.revealOverflow)}
            revealFrameW={editor?.frame?.w ?? editor?.frameW ?? REVEAL_FRAME_W[breakpoint]}
            revealFrameH={editor?.frame?.svh ?? editor?.frameH ?? REVEAL_FRAME_H[breakpoint]}
            selectedLayer={editor?.selectedLayer}
          />
        );
      })}

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
        <p className={styles.footerTagline}>{t('footer.tagline', 'Made with love — see you at the party')}</p>
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
