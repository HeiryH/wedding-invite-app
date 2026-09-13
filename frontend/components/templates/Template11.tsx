'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Wedding, Wish, Photo, ItineraryItem, SeatingTable } from '@/lib/api';
import { resolveSectionOrder, toHijriString, type SectionCode } from '@/lib/templateUtils';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { useParallax } from '@/components/templates/_shared/hooks/useParallax';
import { useBreakpoint } from '@/components/templates/_shared/hooks/useBreakpoint';
import { FlowBackground } from '@/components/templates/_shared/FlowBackground';
import type { EditorHandle, SlotProps } from '@/components/templates/_shared/types';
import { EngineProvider } from '@/components/templates/_shared/engine';
import { useStageLayout } from '@/components/templates/_shared/layout';
import SharedLayer from '@/components/templates/_shared/Layer';
import SheetHost from '@/components/templates/_shared/SheetHost';
import { SLOT_REGISTRY, SLOT_AVAILABLE, sheetLayerGroups } from '@/components/templates/_shared/slots';
import { SlotFlowProviders } from '@/components/templates/_shared/slots/FlowProviders';
import { fontVar } from '@/lib/fonts/registry';
import { StageSection } from './Template11-rosehorizon/StageSection';
import { useAnchors } from './Template11-rosehorizon/useAnchors';
import { T11_STAGES } from './Template11-rosehorizon/data/roseHorizonStages';
import styles from './Template11-rosehorizon/Template11.module.css';

/** Returns null once the date has passed, so the hero never shows a dead 00:00:00 — same
 *  contract as the Stage family's own `useCountdown` (_shared/slots/HeroSlots.tsx), duplicated
 *  locally rather than imported since that file lives in the Stage-family slot catalog and this
 *  is a plain Classic-template hook with no `SlotProps`/engine dependency. */
function useCountdown(target: string) {
  const [left, setLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  useEffect(() => {
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) return setLeft(null);
      setLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return left;
}

interface Template11Props {
  wedding: Wedding;
  onRSVP: (data: any) => Promise<void>;
  onSubmitWish: (data: any) => Promise<void>;
  onUploadPhoto?: (data: any) => Promise<void>;
  wishes: Wish[];
  photos: Photo[];
  photoBoothEnabled: boolean;
  customConfig?: Record<string, string>;
  itinerary?: ItineraryItem[];
  seatingEnabled?: boolean;
  tables?: SeatingTable[];
  /** Set only by the customize preview iframe — guests never receive this. */
  editor?: EditorHandle;
}

const ENGINE = { assetRoot: '/templates/rose-horizon', assetSizes: {}, slotRegistry: SLOT_REGISTRY };

/**
 * Template 11 "Rose Horizon" — Classic family (flow + overlay), PRO tier.
 *
 * Built through the invite-authoring pipeline (docs/invite-pipeline.md), the first Classic-
 * family template it's produced. Things that don't exist for any other Classic template:
 *
 * - **FlowBackground**: one shared, mirror-stacked, height-reactive background behind every
 *   section (see spec/background.md) instead of a per-section image. Couple-adjustable (replace
 *   image / parallax rate) through the Adjust dock's stage-independent "Background · Flow"
 *   section — see `TemplateEngine.pageBackground` in `_shared/registry.ts` — rather than a
 *   per-stage Background row, since it isn't owned by any one section.
 * - **PropLayer** (via `StageSection`): default decorative art (roses, icons, the welcome arch)
 *   at positions `ingest` measured off the approved design, kept clear of each section's real
 *   rendered content panel at runtime *only until a couple explicitly repositions a piece* — see
 *   PropLayer.tsx's reserved-zone doc comment. Fully Adjust-editable (drag/resize/hide/rotate/
 *   flip), same as any other `img` layer.
 * - **RSVP/Wishes/Schedule/Photos run on the shared `_shared/slots/*` registry** — the same
 *   components T7/T10 use (forms in a bottom-sheet pop-up, opened by a `sheetTrigger` button that
 *   sits inline in the flow) — instead of bespoke JSX, so a couple gets the same per-piece
 *   Adjust-panel control (hide/reorder/rename/style/animate) those two templates already have.
 *   Rendered in normal document flow via `SharedLayer`'s `flow` prop (mirrors `_shared/Stage.tsx`'s
 *   own `StageDef.flow` branch) rather than absolute stage position, since these are real
 *   variable-height content, not an art composition.
 *
 * Welcome/Ceremony stay real bespoke JSX, couple-adjustable via `anchor` layers — `T11_STAGES`
 * (data/roseHorizonStages.ts) + `useAnchors` — the same recipe every other Classic template
 * (T1-T6) already uses, applied here via `a()`/`sx()`.
 */
export default function Template11({
  wedding,
  onRSVP,
  onSubmitWish,
  onUploadPhoto,
  wishes,
  photos,
  photoBoothEnabled,
  customConfig,
  itinerary = [],
  seatingEnabled = false,
  tables = [],
  editor,
}: Template11Props) {
  const t = useCallback(
    (key: string, fallback: string) => customConfig?.[key] || fallback,
    [customConfig],
  );
  const sectionOrder = resolveSectionOrder(
    customConfig?.['section.order'],
    !!customConfig?.['walimah.body'],
    itinerary.length > 0,
    photoBoothEnabled,
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useParallax(rootRef, 'on', reduced);

  const editing = Boolean(editor?.enabled);
  // Pinned by the Adjust panel while editing, same convention every other template uses.
  const breakpoint = useBreakpoint(editing ? editor!.breakpoint : undefined);
  const { a, sx } = useAnchors(customConfig, breakpoint, editor);
  const overlayProps = { breakpoint, config: customConfig, editor };

  // "Background · Flow" — the Adjust panel's stage-independent control (see component doc
  // comment). `''`/unset ⇒ the shipped default asset, exactly like every other replace-image
  // control in this engine.
  const pageBgSrc = customConfig?.['t11.layout.pageBg.src'] || '/templates/rose-horizon/bg/flow.webp';
  const pageBgParallax = Number(customConfig?.['t11.layout.pageBg.parallaxRate'] ?? 0.3);

  // The shared `_shared/slots/slots.module.css` used by every `kind:'slot'` layer below (RSVP/
  // Wishes/Schedule/Photos) is neutral by default — this block sets those `--slot-*` custom
  // properties to Rose Horizon's own palette (dusty ink, peach accent button, Georgia serif) so
  // every form/list reads as part of this template rather than the neutral authored default.
  // `--slot-font-display`/`--slot-font-serif` are what the Adjust panel's "Theme" section
  // overrides (t11.layout.slotTheme.headingFont/.bodyFont) — read via `fontVar()` (the reliably
  // self-hosted next/font copy), never a literal quoted family name, same reasoning as T7/T10.
  const slotThemeVars: CSSProperties = {
    '--slot-ink': '#4a362e',
    '--slot-ink-soft': 'rgba(74, 54, 46, 0.72)',
    '--slot-ink-faint': 'rgba(74, 54, 46, 0.5)',
    '--slot-rule': 'rgba(74, 54, 46, 0.18)',
    '--slot-accent': t('t11.layout.slotTheme.accentColor', '#fcb887'),
    '--slot-accent-ink': '#4a362e',
    '--slot-radius': '10px',
    '--slot-font-display': fontVar(customConfig?.['t11.layout.slotTheme.headingFont']) ?? 'Georgia, "Times New Roman", serif',
    '--slot-font-serif':
      fontVar(customConfig?.['t11.layout.slotTheme.bodyFont'])
      ?? fontVar(customConfig?.['t11.layout.slotTheme.headingFont'])
      ?? 'Georgia, "Times New Roman", serif',
    '--slot-font-body':
      fontVar(customConfig?.['t11.layout.slotTheme.bodyFont'])
      ?? fontVar(customConfig?.['t11.layout.slotTheme.headingFont'])
      ?? 'Georgia, "Times New Roman", serif',
  } as CSSProperties;

  // "Card" — the Adjust panel's stage-independent style pick (None/Radial/Glass), same control
  // T7/T10 expose via `slotTheme` (T11 now qualifies for `slotTheme` outright — see registry.ts —
  // since its RSVP/Wishes/Schedule/Photos are real shared-slot content). 'none' means exactly
  // what it means for T7/T10: no card at all, fully blank — a couple who wants legibility backing
  // over the illustrated art picks Radial or Glass instead; this template does not force one.
  //
  // 'none' leaves every `--slot-panel-*` var UNSET (not forced to 'transparent') so each CSS rule
  // falls back to its OWN default instead of one global answer — same mechanism T7 uses. That
  // distinction matters here specifically because a bottom sheet (the RSVP/wish forms) and an
  // inline card are different things: slots.module.css's `.panel` defaults to transparent (right
  // for inline content sitting on the illustrated art) while its `.sheetCard` defaults to a solid
  // cream (right for a modal popup, which must stay legible regardless of Card style — forcing
  // 'transparent' here would make the RSVP/wish sheet itself unreadable over the sky background).
  const cardStyle = t('t11.layout.slotTheme.cardStyle', 'none');
  // `t()` already resolves "unset" to the fallback string before this ever runs, so `Number(...)`
  // needs no `|| default` on top — that pattern would silently discard an explicitly-saved `0`
  // (falsy) and re-substitute the default, which is exactly the "drag Opacity to 0" case a couple
  // wants to actually reach.
  const cardBlurPx = Number(t('t11.layout.slotTheme.cardBlur', '6'));
  const cardTint = t('t11.layout.slotTheme.cardTint', '#fffdf8');
  const cardTintOpacity = Number(t('t11.layout.slotTheme.cardTintOpacity', '0.72'));
  const cardRadius = Number(t('t11.layout.slotTheme.cardRadius', '20'));
  const cardStyleVars: CSSProperties =
    cardStyle === 'glass' ? ({
      '--slot-panel-bg': `color-mix(in srgb, ${cardTint} ${Math.round(cardTintOpacity * 100)}%, transparent)`,
      '--slot-panel-blur': `blur(${cardBlurPx}px) saturate(140%)`,
      '--slot-panel-border': '1px solid rgba(255, 255, 255, 0.5)',
      '--slot-panel-radius': `${cardRadius}px`,
      '--slot-panel-shadow': '0 1px 2px rgba(74,54,46,0.05), 0 8px 24px rgba(74,54,46,0.1)',
    } as CSSProperties)
    : cardStyle === 'radial' ? ({
      '--slot-panel-bg': 'radial-gradient(ellipse at center, rgba(255, 253, 248, 0.82) 0%, rgba(255, 253, 248, 0.6) 55%, transparent 85%)',
      '--slot-panel-blur': 'none',
      '--slot-panel-shadow': 'none',
    } as CSSProperties)
    : ({} as CSSProperties); // 'none' ⇒ no override — each --slot-panel-* consumer's own fallback applies

  const weddingDate = new Date(wedding.weddingDate);
  const dateLabel = weddingDate.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const showIslamicDate = customConfig?.['general.showIslamicDate'] === 'true';
  const countdown = useCountdown(wedding.weddingDate);

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

  // Same shape T7/T10 use: resolve every visible stage's layers once, so the flow-slot renderer
  // below and the sheet-group collector share one resolution instead of two.
  const stages = useStageLayout('t11', T11_STAGES, sectionOrder, breakpoint, customConfig);
  // Forms live in a bottom sheet rather than inline — see roseHorizonStages.ts's doc comment on
  // why (variable-height content vs. an absolutely-positioned flow slot's own reserved box).
  const sheetGroups = useMemo(() => sheetLayerGroups(stages, slotProps), [stages, slotProps]);

  /** Renders one stage's inline (non-sheet) `kind:'slot'` layers, in document order, through the
   *  shared `<Layer flow>` component — the same primitive `_shared/Stage.tsx` uses for authored
   *  flow templates, so these get real Adjust-panel hide/reorder/rename/style/animate for free. */
  const flowSlotsFor = (stageId: string) => {
    const resolved = stages.find((s) => s.def.id === stageId);
    if (!resolved) return null;
    const layers = resolved.layers
      .filter((l) => l.kind === 'slot' && l.presentation !== 'sheet' && !l.hidden
        && (!l.slot || SLOT_AVAILABLE[l.slot]?.(slotProps)))
      .sort((a2, b2) => a2.order - b2.order);
    const stageActive = editing && editor?.selectedStage === stageId;
    return layers.map((l) => (
      <SharedLayer
        key={l.id}
        layer={l}
        slotProps={{ ...slotProps, stageLayers: resolved.layers }}
        eager={false}
        flow
        editing={editing}
        stageActive={stageActive}
        stageId={stageId}
        selected={stageActive && editor?.selectedLayer === l.id}
      />
    ));
  };

  const scrollTo = (code: SectionCode) => document.getElementById(code)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <SlotFlowProviders>
    <EngineProvider value={ENGINE}>
    <div ref={rootRef} style={{ position: 'relative', ...slotThemeVars, ...cardStyleVars }}>
      <FlowBackground src={pageBgSrc} tileHeight={2048} parallaxRate={pageBgParallax} />

      {sectionOrder.map((code) => {
        switch (code) {
          case 'welcome':
            return (
              <StageSection
                key={code}
                code={code}
                {...overlayProps}
                extra={
                  <button
                    className={styles.scrollCue}
                    onClick={() => scrollTo(sectionOrder[1] ?? 'rsvp')}
                    aria-label="Scroll to next section"
                  >
                    ↓
                  </button>
                }
              >
                <div className={styles.themeLabel} style={{ ...a('welcome', 'themeLabel'), ...sx('welcome', 'themeLabel') }}>
                  {t('nav.invite', 'The Wedding Of')}
                </div>
                <h1 className={styles.heading}>
                  <span style={{ ...a('welcome', 'nameFirst'), ...sx('welcome', 'nameFirst') }}>{wedding.brideName}</span>
                  <span className={styles.amp}>&amp;</span>
                  <span style={{ ...a('welcome', 'nameSecond'), ...sx('welcome', 'nameSecond') }}>{wedding.groomName}</span>
                </h1>
                <div className={styles.subheading} style={{ ...a('welcome', 'date'), ...sx('welcome', 'date') }}>
                  {dateLabel}
                </div>
                {showIslamicDate && (
                  <p className={styles.hijriDate} style={{ ...a('welcome', 'hijri'), ...sx('welcome', 'hijri') }}>
                    {toHijriString(weddingDate)}
                  </p>
                )}
                {countdown && (
                  <div className={styles.countdown} style={a('welcome', 'timer')} data-seen="true">
                    {([
                      ['Days', countdown.days],
                      ['Hrs', countdown.hours],
                      ['Min', countdown.minutes],
                      ['Sec', countdown.seconds],
                    ] as const).map(([label, val]) => (
                      <div key={label} className={styles.countUnit}>
                        <span className={styles.countNum} style={sx('welcome', 'timer')}>{String(val).padStart(2, '0')}</span>
                        <span className={styles.countLabel}>{label}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className={styles.body} style={{ ...a('welcome', 'venue'), ...sx('welcome', 'venue') }}>
                  {wedding.venue}<br />{wedding.venueAddress}
                </div>
              </StageSection>
            );

          case 'walimah':
            return (
              <StageSection key={code} code={code} {...overlayProps}>
                <h2
                  className={styles.heading}
                  style={{ fontSize: '1.8rem', ...a('walimah', 'title'), ...sx('walimah', 'title') }}
                >
                  {t('walimah.title', 'Walimatul Urus')}
                </h2>
                {customConfig?.['walimah.body'] ? (
                  <div className={styles.body} dangerouslySetInnerHTML={{ __html: customConfig['walimah.body'] }} />
                ) : (
                  <div className={styles.body}>{dateLabel} · {wedding.venue}</div>
                )}
              </StageSection>
            );

          case 'rsvp':
            return (
              <StageSection key={code} code={code} {...overlayProps} panelless>
                {flowSlotsFor('rsvp')}
              </StageSection>
            );

          case 'itinerary':
            return (
              <StageSection key={code} code={code} {...overlayProps} panelless>
                {flowSlotsFor('itinerary')}
              </StageSection>
            );

          case 'wishes':
            return (
              <StageSection key={code} code={code} {...overlayProps} panelless>
                {flowSlotsFor('wishes')}
              </StageSection>
            );

          case 'photobooth':
            return (
              <StageSection key={code} code={code} {...overlayProps} panelless>
                {flowSlotsFor('photobooth')}
              </StageSection>
            );

          default:
            return null;
        }
      })}

      <footer className={styles.footer}>
        <p className={styles.footerTagline}>{t('footer.tagline', 'Made with love for our special day')}</p>
      </footer>

      {/* Inside the themed root deliberately — T11's --slot-* theme tokens are set inline on that
          div, so a sheet mounted outside it would render unthemed. Safe for `position: fixed`. */}
      <SheetHost groups={sheetGroups} slotProps={slotProps} editor={editor} />
    </div>
    </EngineProvider>
    </SlotFlowProviders>
  );
}
