'use client';

import { useMemo, type CSSProperties } from 'react';
import { EngineProvider } from './engine';
import { useStageReveal } from './hooks/useStageReveal';
import { useParallax } from './hooks/useParallax';
import { useStageLayout } from './layout';
import Stage from './Stage';
import { SLOT_REGISTRY, sheetLayerGroups, stageHasContent, visibleSlotLayers } from './slots';
import { SlotFlowProviders } from './slots/FlowProviders';
import SheetHost from './SheetHost';
import { fontVar } from '@/lib/fonts/curated';
import type { StageDef, SlotProps, Breakpoint, EditorHandle } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

/**
 * A template defined entirely as data (a `Record<StageId, StageDef>`), rendered through the exact
 * same shared engine every hand-coded template already uses — no per-template React component.
 * Mirrors Template7-romangarden/index.tsx's core render loop (EngineProvider + useStageLayout +
 * one <Stage> per resolved stage), stripped of T7-specific concerns it doesn't need
 * (section-code resolution, the ceremony horizontal rail, nav bar). Slot content (RSVP,
 * countdown, itinerary, wishes, photo booth — see `_shared/slots/`) is fully wired: a stage whose
 * only content is an unavailable slot is dropped, exactly as it is for T7, via the same shared
 * `stageHasContent`/`visibleSlotLayers` helpers.
 */
export interface DataTemplateProps {
  /** The whole composition — what an authoring UI would eventually persist to the DB. */
  stages: Record<string, StageDef>;
  /** Render order. */
  stageIds: string[];
  /** Config-key namespace for this template's layouts, same convention as every built-in template
   *  ('t1'..'t7') — an authored template gets its own, e.g. 'ta12'. */
  keyPrefix: string;
  assetRoot: string;
  assetSizes?: Record<string, [number, number]>;
  breakpoint: Breakpoint;
  customConfig?: Record<string, string>;
  slotProps: SlotProps;
  editor?: EditorHandle;
}

export default function DataTemplate({
  stages, stageIds, keyPrefix, assetRoot, assetSizes = {},
  breakpoint, customConfig, slotProps, editor,
}: DataTemplateProps) {
  const editing = Boolean(editor?.enabled);
  const resolved = useStageLayout(keyPrefix, stages, stageIds, breakpoint, customConfig);
  const { rootRef, seen } = useStageReveal(false);
  useParallax(rootRef, 'on', false);

  // A stage whose only content is an unavailable slot (e.g. an itinerary block with no itinerary
  // rows, or a photo booth block with the feature switched off) is dropped entirely, rather than
  // costing the guest a full screen of empty scrolling — same rule Template 7 applies.
  const visible = resolved.filter((r) => stageHasContent(r.layers, slotProps));

  // `presentation:'sheet'` slots have no inline visual (visibleSlotLayers excludes them) — they
  // mount in the shared bottom sheet instead, keyed by `Layer.sheetId`. A `scrollVideo` layer
  // opens the sheet naming the same id (Layer.tsx), which is Template5.tsx's own
  // envelope-tap-to-RSVP gesture generalized to any authored template — and now to any number of
  // named sheets, each with its own steps, rather than the single unnamed one this used to find.
  const sheetGroups = useMemo(() => sheetLayerGroups(visible, slotProps), [visible, slotProps]);

  // The Adjust panel's "Theme" section (Phase 5) — `${keyPrefix}.layout.slotTheme.*`. Only set the
  // custom property when an override exists, so an untouched authored template keeps
  // slots.module.css's own neutral fallback (no couple has ever touched theming ⇒ no inline value
  // here at all, not even the neutral default duplicated).
  const accentColor = customConfig?.[`${keyPrefix}.layout.slotTheme.accentColor`];
  const headingFont = fontVar(customConfig?.[`${keyPrefix}.layout.slotTheme.headingFont`]);
  // Glassmorphism ("Card" section of the Theme control) — off (cardBlur unset/0) keeps every
  // `.panel`-based slot (walimahBody/coupleNames/ceremonyDetails/RSVP) exactly as it renders
  // today. On, it reproduces Template 5's own `.ceremonyCard` recipe (flat translucent tint +
  // backdrop blur + hairline border + soft multi-layer shadow) generically for any slot that
  // uses `.panel`, via the same `--slot-panel-*` custom properties T7 already overrides for its
  // own (non-glass) scrim look.
  const cardBlur = Number(customConfig?.[`${keyPrefix}.layout.slotTheme.cardBlur`] ?? 0);
  const cardTint = customConfig?.[`${keyPrefix}.layout.slotTheme.cardTint`] || '#fffbf4';
  const cardTintOpacity = Number(customConfig?.[`${keyPrefix}.layout.slotTheme.cardTintOpacity`] ?? 0.45);
  const cardRadius = Number(customConfig?.[`${keyPrefix}.layout.slotTheme.cardRadius`] ?? 24);
  const glassStyle: CSSProperties | undefined = cardBlur > 0
    ? ({
        '--slot-panel-bg': `color-mix(in srgb, ${cardTint} ${Math.round(cardTintOpacity * 100)}%, transparent)`,
        '--slot-panel-blur': `blur(${cardBlur}px) saturate(140%)`,
        '--slot-panel-border': '1px solid rgba(255, 255, 255, 0.45)',
        '--slot-panel-radius': `${cardRadius}px`,
        '--slot-panel-shadow':
          '0 1px 2px rgba(120, 86, 70, 0.04), 0 8px 24px rgba(214, 168, 150, 0.12), 0 24px 60px rgba(180, 130, 110, 0.08)',
      } as CSSProperties)
    : undefined;
  const themeStyle: CSSProperties | undefined = accentColor || headingFont || glassStyle
    ? {
        ...(accentColor ? { '--slot-ink': accentColor } : {}),
        ...(headingFont ? { '--slot-font-display': headingFont } : {}),
        ...glassStyle,
      } as CSSProperties
    : undefined;

  // `template.bg`/`template.bgSize`/`template.bgPosition` are pre-existing, already-couple-facing
  // schema fields (`templateConfigSchema.ts`, "Page Background") — until now only Template5.tsx
  // ever read them, so the control silently did nothing on any authored template. Reusing the
  // same keys (rather than inventing a `.layout.pageBg.*` set) means an authored template's
  // couple gets a background picker with zero new schema/backend work, and it matches the exact
  // fixed + cover + fade-to-white-at-the-bottom treatment T5 itself uses.
  const pageBg = customConfig?.['template.bg'];
  const pageBgSize = customConfig?.['template.bgSize'] || 'cover';
  const pageBgPosition = customConfig?.['template.bgPosition'] || 'center';

  return (
    <SlotFlowProviders>
    <EngineProvider value={{ assetRoot, assetSizes, slotRegistry: SLOT_REGISTRY }}>
      {pageBg && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: -10,
            backgroundImage: `linear-gradient(to bottom, transparent 93%, white 100%), url(${API_BASE}${pageBg})`,
            backgroundSize: `auto, ${pageBgSize}`,
            backgroundPosition: `center, ${pageBgPosition}`,
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
      <div ref={rootRef} style={themeStyle}>
        {visible.map((r, i) => (
          <Stage
            key={r.def.id}
            def={r.def}
            layers={visibleSlotLayers(r.layers, slotProps)}
            bgFit={r.bgFit}
            bgPosition={r.bgPosition}
            bgScale={r.bgScale}
            bgSrc={r.bgSrc}
            seen={seen.has(r.def.id)}
            slotProps={slotProps}
            eager={i === 0}
            editing={editing && editor?.selectedStage === r.def.id}
            selectedLayer={editor?.selectedLayer}
            // `.stage` always paints an opaque fill (Stage.module.css) so a stage with no art of
            // its own still shows something — but that fill would completely hide a page-level
            // fixed background behind it. Same problem T7's horizontal rail already solved with
            // this exact prop; a stage with its own bg image still draws that image on top,
            // since only the *fill* is suppressed, not a real background.
            transparent={Boolean(pageBg)}
          />
        ))}
      </div>

      <SheetHost
        groups={sheetGroups}
        slotProps={slotProps}
        // The sheet mounts outside `<div ref={rootRef} style={themeStyle}>`, so it has to
        // re-apply the theme tokens itself (T7 mounts inside its themed wrapper and doesn't).
        themeStyle={themeStyle}
        editor={editor}
      />

    </EngineProvider>
    </SlotFlowProviders>
  );
}
