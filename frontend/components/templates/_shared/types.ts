import type { Wedding, Wish, Photo, ItineraryItem, SeatingTable, CreateWish } from '@/lib/api';

/**
 * The stage-and-layer compositor engine, shared by every template that opts into the layer
 * Adjust feature (Template 7 today; see the T5 rollout plan for more).
 *
 * A **stage** is a section that holds N absolutely-positioned **layers**. A layer carries its own
 * geometry as percentages of the stage, so the whole composition is data — which is what lets the
 * Adjust panel move it and lets a couple store overrides as a small JSON delta (see layout.ts).
 *
 * `StageId`/`SlotId` are `string` here; each template narrows them with its own union.
 */

export type Breakpoint = 'mobile' | 'desktop';

/**
 * "Reveal off-screen" vertical padding, as a fraction of the device height, added above and below
 * each pinned stage so top/bottom bleed shows. Shared by `Stage` (the stage's margin-block) and
 * `PreviewPanel` (the widened iframe height) — they must agree, so keep it here.
 */
export const REVEAL_VPAD = 0.25;

/**
 * `slot` layers render live React content (a form, the countdown) but position like art.
 * `anchor` layers have no visual of their own — they represent an existing DOM element in a
 * hybrid-overlay template (Template 5), and their geometry is applied as a transform nudge to
 * that element. See Template5's `useAnchors`.
 */
export type LayerKind = 'img' | 'text' | 'shape' | 'slot' | 'anchor';

export type ObjectFit = 'cover' | 'contain' | 'fill';

/** Entrance animation vocabulary. `rise` is the shipped default (fade + slide-up); `scroll-fade`
 *  is a continuous scroll-linked opacity (fades in entering the viewport, out leaving it). */
export type AnimType =
  | 'rise' | 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right'
  | 'zoom-in' | 'zoom-out' | 'none' | 'scroll-fade';

/** Selectable entrance animations, in the order the Adjust panel lists them. */
export const ANIM_OPTIONS: AnimType[] = [
  'rise', 'fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right',
  'zoom-in', 'zoom-out', 'scroll-fade', 'none',
];

/** Exit animation vocabulary — played (scroll-scrubbed, reversible) as the layer leaves the top of
 *  the viewport. `none` (default) leaves the layer in place on the way out. */
export type AnimOutType =
  | 'none' | 'fade-out'
  | 'slide-out-up' | 'slide-out-down' | 'slide-out-left' | 'slide-out-right'
  | 'zoom-out' | 'zoom-in';

/** Selectable exit animations, in the order the Adjust panel lists them. */
export const ANIM_OUT_OPTIONS: AnimOutType[] = [
  'none', 'fade-out', 'slide-out-up', 'slide-out-down', 'slide-out-left', 'slide-out-right',
  'zoom-out', 'zoom-in',
];

export type StageId = string;
export type SlotId = string;

export interface Layer {
  /** Stable within a stage. Overrides merge by this, so never renumber existing ids. */
  id: string;
  kind: LayerKind;

  /** Friendly name for the Adjust panel's layer list (mainly for `anchor` layers). */
  label?: string;

  /** kind 'img' — a path under the template's asset root, or an absolute /uploads/... */
  src?: string;
  /** kind 'slot' — key into the template's slot registry */
  slot?: SlotId;
  /** kind 'text' */
  text?: string;
  /** kind 'shape' */
  shape?: 'rect' | 'ellipse';

  // geometry — all percentages of the stage, centre-anchored
  x: number;
  y: number;
  w: number;
  /** Ignored while `chain` is true (height follows the image's aspect ratio). */
  h: number;
  /** Scale multiplier applied about the layer's centre. */
  s: number;
  z: number;
  /** Reveal stagger index: delay = 0.35s + order * 0.22s. */
  order: number;

  chain: boolean;
  hidden: boolean;
  opacity: number;
  /** Parallax factor. 0 = welded to the background. Defaults to z/10 when absent. */
  depth?: number;

  /**
   * Entrance animation type, played when the layer's stage scrolls into view (staggered by
   * `order`). `undefined` ⇒ `'rise'` (the shipped fade + slide-up), so existing layouts are
   * unchanged. `'scroll-fade'` is continuous (opacity tracks scroll position). See reveal.css.
   */
  anim?: AnimType;
  /** Entrance duration in seconds (feeds `--sl-dur`). Defaults to ~1s when absent. */
  animDur?: number;
  /** Exit animation, scroll-scrubbed as the layer leaves the viewport. `undefined` ⇒ `'none'`. */
  animOut?: AnimOutType;

  // text / shape styling
  color?: string;
  fill?: string;
  fontSize?: number;
  fontWeight?: number;
  radius?: number;

  /** Set by a persisted override to suppress a layer that ships in the defaults. */
  deleted?: boolean;

  /**
   * Structural (never persisted): the id of a parent layer this one nests under in the Adjust
   * panel's layer tree. Shipped in the stage definition, not part of a couple's saved delta.
   */
  parent?: string;
}

export interface StageDef {
  id: StageId;
  /** Nav/Adjust-panel label. */
  label: string;
  /** Background image path (relative to the asset root). Empty ⇒ no background layer. */
  bg: string;
  bgFit: ObjectFit;
  /** Optional shipped defaults for the background's placement (overridable via StageLayout). */
  bgPosition?: string;
  bgScale?: number;
  layers: Layer[];
  /** Sparse per-layer overrides applied on top of `layers` at the desktop breakpoint. */
  desktop?: Record<string, Partial<Layer>>;
}

/** The persisted unit: one stage's delta at one breakpoint, under `<prefix>.layout.<bp>.<stageId>`. */
export interface StageLayout {
  bgFit?: ObjectFit;
  /** Background placement overrides. `bgSrc` replaces the shipped background image (an /uploads/… path). */
  bgPosition?: string;
  bgScale?: number;
  bgSrc?: string;
  layers?: (Partial<Layer> & { id: string })[];
}

export interface SlotProps {
  wedding: Wedding;
  /** Config lookup bound to the wedding's customConfig. */
  t: (key: string, fallback: string) => string;
  wishes: Wish[];
  photos: Photo[];
  tables: SeatingTable[];
  itinerary: ItineraryItem[];
  seatingEnabled: boolean;
  photoBoothEnabled: boolean;
  onRSVP: (data: unknown) => Promise<void>;
  onSubmitWish: (data: CreateWish) => Promise<void>;
  onUploadPhoto?: (data: unknown) => Promise<void>;
  /** True inside the Adjust panel — slots suppress submits so editing can't post real data. */
  editing: boolean;
  /** Optional: lets a slot resolve its own sub-layer anchors (e.g. the T7 hero breaks its
   *  theme/names/date/timer into individually adjustable sub-layers). */
  config?: Record<string, string>;
  breakpoint?: Breakpoint;
  editor?: EditorHandle;
}

/**
 * Set by the customize preview iframe so a template can highlight the layer being edited. Never
 * set on the public invitation. The Adjust panel lives in the parent customize page, so there is
 * no callback here — config flows in one-way through `customConfig`.
 */
export interface EditorHandle {
  enabled: boolean;
  breakpoint: Breakpoint;
  selectedStage?: string;
  selectedLayer?: string;
  /** Editor-only: relax the stage's overflow clip so layers nudged off-screen stay visible. */
  revealOverflow?: boolean;
}
