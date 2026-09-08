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
 * that element. See Template5's `useAnchors`. `scrollVideo` is a self-contained scroll-scrubbed
 * chromakey video effect (Template 5's envelope) — it ignores the geometry fields entirely and
 * uses the `videoSrc`/`trigger*`/`pivot`/`holdWidth`/`videoStartSec`/`openThreshold`/`resetSec`/
 * `chroma*` fields instead. See `_shared/effects/ScrollVideoLayer.tsx`.
 *
 * `video` is a **play-once** chromakey video — it holds its first frame until the scene has
 * settled, plays through exactly once, then holds the last frame. No scroll coupling and no
 * reverse: the opposite of `scrollVideo`. Unlike `scrollVideo` it *does* use the geometry fields
 * and positions/scales exactly like an `img` (it's scenery, so it also joins the stage's art
 * canvas). Uses `videoSrc`, `chroma*` and `playDelaySec`. See `_shared/effects/PlayOnceVideoLayer.tsx`.
 */
export type LayerKind = 'img' | 'text' | 'shape' | 'slot' | 'anchor' | 'scrollVideo' | 'video';

export type ObjectFit = 'cover' | 'contain' | 'fill';

/** Entrance animation vocabulary. `rise` is the shipped default (fade + slide-up); `scroll-fade`
 *  is a continuous scroll-linked opacity (fades in entering the viewport, out leaving it). */
export type AnimType =
  | 'rise' | 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right'
  | 'zoom-in' | 'zoom-out' | 'none' | 'scroll-fade' | 'tracking-in';

/** Selectable entrance animations, in the order the Adjust panel lists them. */
export const ANIM_OPTIONS: AnimType[] = [
  'rise', 'fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right',
  'zoom-in', 'zoom-out', 'tracking-in', 'scroll-fade', 'none',
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

/** Continuous loop played while a layer's stage has been seen, independent of scroll position —
 *  layered on top of the one-shot entrance and the scroll-scrubbed exit. Scoped to real
 *  `Layer.tsx`-rendered kinds (img/text/shape/slot); not applied to `anchor`/`scrollVideo`. */
export type AnimIdleType = 'none' | 'wave' | 'sway' | 'pulse' | 'jitter' | 'glitch';

/** Selectable idle animations, in the order the Adjust panel lists them. */
export const ANIM_IDLE_OPTIONS: AnimIdleType[] = ['none', 'wave', 'sway', 'pulse', 'jitter', 'glitch'];

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
  /**
   * kind 'slot' only. 'inline' (default, undefined) renders in place like any other layer.
   * 'sheet' renders nothing in place — instead `_shared/SheetHost.tsx` mounts it in a
   * drag-to-dismiss bottom sheet, opened by a trigger naming the same `sheetId`. Forms live here:
   * a stage is an art composition (art drawn *around* a specific element), while a form is
   * variable-height content, so an inline form has to reserve a fixed box its neighbours can never
   * reflow into. See `_shared/slots/index.ts`'s `visibleSlotLayers` (excludes it from inline
   * render, same treatment as an `anchor`) and `sheetLayerGroups`.
   */
  presentation?: 'inline' | 'sheet';
  /**
   * Names a bottom sheet (see `_shared/slots/sheets.tsx`). Dual-purpose, by role:
   * - on a `presentation: 'sheet'` layer — which sheet this layer is *content of*. Several layers
   *   can share one id; they become that sheet's steps, ordered by `z` descending (the Adjust
   *   panel's front-to-back list order — row dragging rewrites `z`, not `order`).
   * - on a trigger (`slot: 'sheetTrigger'`, or a `kind: 'scrollVideo'` layer) — which sheet it
   *   *opens*. This is what makes an mp4 envelope a data change rather than a code change: swap
   *   the trigger layer's `kind` to `'scrollVideo'`, keep the same `sheetId`.
   *
   * `undefined` ⇒ `'default'`, the back-compat path for the single unnamed sheet authored
   * templates shipped before sheets were named.
   */
  sheetId?: string;
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

  /**
   * Pulls this layer into the stage's art canvas (see `StageDef.canvas`) even though it wouldn't
   * qualify by kind. For a `slot` that is *composed against* the scenery rather than merely placed
   * on the screen — T7's `welcome` countdown shares the arch's exact coordinates, so it has to
   * crop with the arch or it slides out of it. Ignored when the stage has no `canvas`.
   */
  canvasAnchor?: boolean;

  chain: boolean;
  hidden: boolean;
  opacity: number;
  /**
   * kind 'slot' only. Multiplies the box-relative `cqi` text sizes in slots.module.css's form
   * elements (`.field`/`.choice`/`.wishTextarea` — see `--slot-text-scale`, applied in Layer.tsx).
   * Complements Width/Height: those grow the box (and, via the slot's own container-query context,
   * already grow its text somewhat); this is a direct manual override for "still too small to
   * read" without having to keep widening the box past what the layout can fit. 1 = default.
   */
  textScale?: number;
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
  /** Idle/looping animation, played continuously once seen. `undefined` ⇒ `'none'`. Not applied to
   *  `anchor`/`scrollVideo` kinds (see Layer.tsx). */
  animIdle?: AnimIdleType;
  /** Idle duration multiplier — 1 = each type's base duration. */
  animIdleSpeed?: number;
  /** Idle amplitude multiplier — 1 = each type's base intensity. */
  animIdleIntensity?: number;

  // text / shape styling
  color?: string;
  fill?: string;
  fontSize?: number;
  fontWeight?: number;
  /** kind 'text' — unitless multiplier (CSS `line-height`, e.g. 1.25). `undefined` inherits
   *  Stage.module.css's own default (1.25). */
  lineHeight?: number;
  /** Corner rounding. Shape kind: the box radius. Text kind: only applied when `borderWidth` is
   *  set (a bare text layer has no visible box to round), reusing this field rather than adding a
   *  redundant one. */
  radius?: number;
  /** kind 'text' — a `CuratedFontKey` (see `lib/fonts/curated.ts`). `undefined` inherits the
   *  template's own font. */
  fontFamily?: string;
  /** kind 'text' — em. */
  letterSpacing?: number;
  /** kind 'text' — em. */
  wordSpacing?: number;
  /** kind 'text' — px. 0/undefined = no border. */
  borderWidth?: number;
  borderColor?: string;
  shadowColor?: string;
  /** px */
  shadowBlur?: number;
  /** px */
  shadowX?: number;
  /** px */
  shadowY?: number;
  /** kind 'text' — 'flat' (default, a plain box) | 'arc' | 'circle' (rendered via SVG textPath,
   *  see CurvedText.tsx). `undefined` ⇒ 'flat'. */
  textShape?: 'flat' | 'arc' | 'circle';
  /** kind 'text', when `textShape !== 'flat'` — -100..100. Sign = bend direction (arc: + arches
   *  up/- arches down; circle: + clockwise/- counter-clockwise reading). Magnitude: arc → subtended
   *  angle 0-180°; circle → ring radius as % of the layer's own half-width. */
  curvature?: number;

  // kind 'scrollVideo' — a scroll-scrubbed chromakey video effect (see ScrollVideoLayer.tsx).
  /** Path under the template's asset root, or an absolute /uploads/... */
  videoSrc?: string;
  /** GSAP ScrollTrigger start/end, as "% from top of viewport" when the trigger element's centre
   *  crosses that line (mirrors 'center {n}%'). start > end — the effect scrubs as you scroll down
   *  through that band. */
  triggerStart?: number;
  triggerEnd?: number;
  /** ScrollTrigger scrub smoothing (seconds of lag), same units as GSAP's own `scrub`. */
  scrub?: number;
  /** Progress fraction (0-1) at which the effect is fully "open" — a plateau, not an instant. */
  pivot?: number;
  /** Half-width of the plateau around `pivot`, in the same 0-1 progress units. */
  holdWidth?: number;
  /** Video seconds `tri=0` maps to; `tri=1` maps to the video's own duration. */
  videoStartSec?: number;
  /** `tri` value above which the effect reports "open" (drives dependent UI via `onOpenChange`). */
  openThreshold?: number;
  /** Video seconds to snap to when scrolled fully past the trigger in either direction. */
  resetSec?: number;
  /** Luminance chromakey: below this is fully transparent. */
  chromaThreshold?: number;
  /** Luminance band above `chromaThreshold` over which alpha ramps 0→255. */
  chromaFade?: number;

  /** kind 'video' — seconds to wait after the layer is first seen (and the document has loaded)
   *  before playing. Defaults to this layer's own entrance timing, `0.35 + order * 0.22 + animDur`,
   *  so the piece finishes arriving before it comes alive. Set explicitly to override. */
  playDelaySec?: number;
  /** kind 'video' — a static image (same asset-root convention as `videoSrc`) drawn onto the
   *  canvas immediately on mount, before the video has decoded any frame. Without it the canvas is
   *  fully transparent until the video downloads — on a slow connection that can take ~1s, during
   *  which the layer's own CSS entrance animation has already fired empty, so it visibly "pops in"
   *  late relative to layers around it instead of appearing on schedule. Should be the video's own
   *  first frame (or near-identical) so the swap from poster → live video is invisible. */
  posterSrc?: string;

  /** Set by a persisted override to suppress a layer that ships in the defaults. */
  deleted?: boolean;

  /**
   * Structural (never persisted): the id of a parent layer this one nests under in the Adjust
   * panel's layer tree. Shipped in the stage definition, not part of a couple's saved delta.
   */
  parent?: string;

  /**
   * Structural (never persisted), kind 'anchor' only: this anchor's wrapped DOM content is a plain
   * string — gates whether the Adjust panel shows a text-content input for it (most anchors wrap a
   * live component/name and have no text of their own to override). Read via `useAnchors`' `tx()`.
   */
  hasText?: boolean;
  /**
   * Structural (never persisted), kind 'anchor' only: this anchor's wrapped content accepts the
   * text-styling fields above (color/fontFamily/fontSize/fontWeight/letterSpacing/wordSpacing/
   * border/shadow) as an override on the real element, taking precedence over any pre-existing
   * per-element config styling. Read via `useAnchors`' `sx()`.
   */
  styleable?: boolean;
  /**
   * Structural (never persisted), kind 'anchor' only: this anchor's call site wraps its content
   * with the idle-animation-aware nested element (`data-seen` + `data-sl-idle`), so the Adjust
   * panel's "While on screen" idle section actually does something for it. Anchors are otherwise
   * excluded from animation entirely (they don't render through Layer.tsx's enter/idle/exit
   * wrapper chain) — this opts a specific anchor into idle only, not enter/exit, since most anchor
   * targets already have their own bespoke framer-motion entrance that a generic enter system
   * would double up on or fight. Read via `useAnchors`' `ax()`.
   */
  animatable?: boolean;
}

export interface StageDef {
  id: StageId;
  /** Nav/Adjust-panel label. */
  label: string;
  /** Background image path (relative to the asset root). Empty ⇒ no background layer. */
  bg: string;
  bgFit: ObjectFit;
  /**
   * Opt-in **aspect-locked art canvas**. When set, the stage's scenery (`img`/`shape`/`text`
   * layers, plus any layer flagged `canvasAnchor`) is composed inside one box of exactly this
   * aspect ratio, which is then cover-fitted to the device — the same crop `bgFit: 'cover'`
   * already applies to the background. Every piece therefore scales and crops **as a unit**
   * instead of drifting apart when the screen's aspect ratio changes.
   *
   * The numbers are a *reference shape*, not pixels: `{ w: 390, h: 844 }` means "this scene was
   * composed for a 390x844 screen". Stored layer percentages are unchanged — they simply resolve
   * against the canvas instead of the raw stage box.
   *
   * Real content (`slot` layers) deliberately stays **outside** the canvas and keeps adapting to
   * the actual screen, because cropping an RSVP form is never acceptable while cropping a
   * decorative pot is the whole point. Leave unset for today's behaviour, byte for byte.
   *
   * **Per breakpoint**, since a stage's mobile and desktop compositions can be genuinely different
   * pictures with different reference shapes (T7's desktop-only landscape pillars art is why this
   * exists) — set `desktop` explicitly whenever that's true for a template. Leaving `mobile` unset
   * means no canvas at all on mobile, exactly as before. Leaving `desktop` unset while `mobile` is
   * set does **not** mean "no canvas on desktop" — `Stage.tsx` falls back to reusing the `mobile`
   * aspect, since a template that never designed a distinct desktop composition (nothing on this
   * engine gets one by default — see Template10) still needs *some* protection against the same
   * drift bug this field exists to fix. Only add a `desktop` entry when the desktop composition is
   * deliberately different.
   *
   * Only valid on a fixed (non-`flow`) stage — a flow stage has no definite height to fit against.
   */
  canvas?: Partial<Record<Breakpoint, { w: number; h: number }>>;
  /** Optional shipped defaults for the background's placement (overridable via StageLayout). */
  bgPosition?: string;
  bgScale?: number;
  layers: Layer[];
  /** Sparse per-layer overrides applied on top of `layers` at the desktop breakpoint. */
  desktop?: Record<string, Partial<Layer>>;
  /**
   * Structural (author-set, not a per-wedding delta field): when true, this stage grows to fit
   * its `kind:'slot'` content instead of clipping to a fixed `100svh` — for sections whose real
   * content (a wish list, a photo grid) is taller than one screen. Decorative (non-slot) layers
   * still position as a % of the section's own (now content-driven) box; slot layers render in
   * normal document flow instead of absolutely positioned. See Stage.tsx/Layer.tsx's `flow` prop.
   */
  flow?: boolean;
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
  /**
   * The layer this slot is being rendered as. Injected by `Layer.tsx` (and `SheetHost.tsx`) at
   * render time rather than built into any `slotProps` construction site, so the three places that
   * assemble `SlotProps` need to know nothing about it. Lets a generic slot read its own
   * configuration — `sheetTrigger` reads `layer.sheetId` to know which sheet to open, instead of
   * needing one hardcoded component per sheet.
   */
  layer?: Layer;
}

/**
 * The device box the Adjust Editor is previewing against, in *layout* CSS px — i.e. already
 * divided by the previewed device's own `DevicePreset.scale` (see `lib/devicePresets.ts` — this is
 * per-device, not one global constant; a real iPad measures scale 1, an iPhone measures 0.765), so
 * these numbers live in the same coordinate space as the preview iframe's own CSS pixels and as
 * `100vw`/`100svh` inside it. See `docs/FIX_QUEUE.md` Issue 2.
 */
export interface FrameViewport {
  /** 100vw */
  w: number;
  /** 100lvh / bare 100vh — browser chrome minimised. */
  h: number;
  /** 100svh — browser chrome fully shown. What a `.stage` actually is; what Reveal pins to. */
  svh: number;
  safe: { top: number; right: number; bottom: number; left: number };
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
  /** @deprecated superseded by `frame.w`/`frame.svh`. Kept for one release so a stale cached
   *  payload degrades gracefully instead of silently falling back to the template's own 390×844
   *  constants — see `app/(standalone)/organizer-admin/preview/page.tsx`'s derivation. */
  frameW?: number;
  /** @deprecated superseded by `frame.svh`. Note this used to mean the *screen* height; `frame.svh`
   *  means the Safari-*visible* height, which is ~20% shorter — see docs/FIX_QUEUE.md Issue 2. */
  frameH?: number;
  /** Editor-only: the previewed device box each stage pins itself to while revealing, so bleed
   *  spills around it. Falls back to the template's own constants when absent. */
  frame?: FrameViewport;
}
