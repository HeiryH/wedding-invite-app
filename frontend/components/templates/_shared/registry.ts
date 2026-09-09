import type { StageDef } from './types';
import { T1_STAGES, t1StageIds } from '../Template1-classicrose/data/t1Stages';
import { T2_STAGES, t2StageIds } from '../Template2-goldenelegance/data/t2Stages';
import { T3_STAGES, t3StageIds } from '../Template3-gardenromance/data/t3Stages';
import { T4_STAGES, t4StageIds } from '../Template4-minimalnoir/data/t4Stages';
import { T5_STAGES, t5StageIds } from '../Template5-dreamingfloral/data/t5Stages';
import { T6_STAGES, t6StageIds } from '../Template6-fairygarden/data/t6Stages';
import { T7_STAGES, T7_ASSETS, STAGE_GROUPS } from '../Template7-romangarden/data/stages';
import { T10_STAGES, T10_ASSETS, STAGE_GROUPS as T10_STAGE_GROUPS } from '../Template10-sunnysafari/data/stages';

/**
 * Everything a template's `layout` resolution needs, computed once per render in the customize
 * page and handed to whichever `TemplateEngine` matches `wedding.templateId`. `codes` is the
 * already-resolved visible-section list (`resolveSectionOrder`) — engines that render one stage
 * per section (T1/T2/T3/T6/T7) filter/flatten it; engines with a fixed stage set (T4/T5) ignore
 * it and key off `photoBoothEnabled` directly.
 */
export interface StageIdsCtx {
  codes: string[];
  photoBoothEnabled: boolean;
  draftConfig: Record<string, string>;
}

/**
 * The per-template surface the Adjust dock needs. `resolveStages` is a function (not a plain map)
 * so a template can vary its shipped composition by config — T7 dedupes shared ceremony art into
 * one "Ceremony Backdrop" stage when `scene.ceremony.layout === 'row'`.
 */
export interface TemplateEngine {
  keyPrefix: string;
  /** T7 is the full-screen Stage compositor, where "Reveal off-screen" applies. Every DOM/flow
   *  hybrid-overlay template (T1-T6) is `false` — widening the canvas would just reflow it larger. */
  reveal: boolean;
  /** True only for templates whose RSVP/wishes/etc. content is built from the shared
   *  `_shared/slots/*` components (T7 today) — gates the Adjust panel's stage-independent "Theme"
   *  section (accent color + heading font, via `--slot-*` CSS custom properties). T1-T6 have their
   *  own bespoke, non-slot RSVP/wishes markup this doesn't reach. */
  slotTheme?: boolean;
  /** Public path prefix this template's shipped art/video is served from (e.g. `/templates/t7`) —
   *  absent for templates with no such shared prefix. Lets the Adjust panel resolve a layer's
   *  `videoSrc` into a real URL for things like the "Capture from video" poster control, without
   *  needing the full `EngineProvider` context the actual template render tree has (the panel lives
   *  in the parent, outside the preview iframe — see AdjustPanel.tsx's own doc comment). */
  assetRoot?: string;
  resolveStages(ctx: StageIdsCtx): Record<string, StageDef>;
  stageIds(ctx: StageIdsCtx): string[];
}

const T7_CEREMONY_BEATS = ['ceremony-walimah', 'ceremony-couple', 'ceremony-details'];

export const TEMPLATE_ENGINES: Record<number, TemplateEngine> = {
  1: { keyPrefix: 't1', reveal: false, resolveStages: () => T1_STAGES, stageIds: (ctx) => t1StageIds(ctx.codes) },
  2: { keyPrefix: 't2', reveal: false, resolveStages: () => T2_STAGES, stageIds: (ctx) => t2StageIds(ctx.codes) },
  3: { keyPrefix: 't3', reveal: false, resolveStages: () => T3_STAGES, stageIds: (ctx) => t3StageIds(ctx.codes) },
  4: { keyPrefix: 't4', reveal: false, resolveStages: () => T4_STAGES, stageIds: (ctx) => t4StageIds(ctx.photoBoothEnabled) },
  5: { keyPrefix: 't5', reveal: false, resolveStages: () => T5_STAGES, stageIds: (ctx) => t5StageIds(ctx.photoBoothEnabled) },
  6: { keyPrefix: 't6', reveal: false, resolveStages: () => T6_STAGES, stageIds: (ctx) => t6StageIds(ctx.codes) },
  7: {
    keyPrefix: 't7',
    reveal: true,
    slotTheme: true,
    assetRoot: T7_ASSETS,
    resolveStages(ctx) {
      // In the compiled ceremony row the frame art is deduped into the shared "Ceremony Backdrop"
      // stage, and each beat renders only its own content — so strip the now-unused per-beat art
      // (and its now-inert Background control) from the beats' panel entries.
      if (ctx.draftConfig['scene.ceremony.layout'] !== 'row') return T7_STAGES;
      const stages: typeof T7_STAGES = { ...T7_STAGES };
      for (const id of T7_CEREMONY_BEATS) {
        const s = T7_STAGES[id];
        if (s) stages[id] = { ...s, bg: '', layers: s.layers.filter((l) => l.kind === 'slot' || l.kind === 'anchor') };
      }
      return stages;
    },
    stageIds(ctx) {
      const flat = ctx.codes.flatMap((c) => STAGE_GROUPS[c] ?? []);
      if (ctx.draftConfig['scene.ceremony.layout'] !== 'row') return flat;
      // Surface the shared backdrop entry immediately before the first ceremony beat.
      const wi = flat.indexOf('ceremony-walimah');
      return wi >= 0 ? [...flat.slice(0, wi), 'ceremony-rail', ...flat.slice(wi)] : flat;
    },
  },
  // Same full-screen Stage compositor as T7 (reveal: true), but one stage per section with no
  // ceremony-row feature — the simple branch shape.
  10: {
    keyPrefix: 't10',
    reveal: true,
    slotTheme: true,
    assetRoot: T10_ASSETS,
    resolveStages: () => T10_STAGES,
    stageIds: (ctx) => ctx.codes.flatMap((c) => T10_STAGE_GROUPS[c] ?? []),
  },
};
