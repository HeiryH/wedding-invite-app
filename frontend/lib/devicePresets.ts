/**
 * Device presets for the Adjust Editor preview — see `docs/FIX_QUEUE.md` Issue 2.
 *
 * The key modelling fact: screen height ≠ `100lvh` ≠ `100svh`, and the relationship between them
 * is not a formula — it varies per device/OS (iPadOS Safari chrome doesn't collapse, so
 * `lvh === svh`; landscape chrome is much thinner than portrait). So each is stored per row rather
 * than derived, with `source` recording whether the row came from a real device (via
 * `components/dev/ViewportProbe.tsx`) or is a placeholder estimate.
 *
 * `svh` is the number that actually matters: `.stage { height: 100svh }` (Stage.module.css) is the
 * unit the whole fixed-stage compositor is built on, so `svh` is what the preview iframe should be
 * tall — not the whole screen, which is what every preset was before this file existed and is the
 * root cause of the editor rendering ~25% too tall/roomy compared to real Safari.
 */

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface DevicePreset {
  id: string;
  label: string;
  group: 'phone' | 'tablet' | 'desktop';
  /** Device-width in CSS px at scale 1 (portrait). */
  w: number;
  /** Whole screen height in CSS px. Informational today (no chrome is drawn) — kept so a future
   *  "draw the browser bars" pass has real numbers instead of re-deriving them. */
  screenH: number;
  /** `100lvh` — browser chrome minimised (what bare `vh` resolves to on iOS Safari). */
  lvh: number;
  /** `100svh` — browser chrome fully shown. This is what a `.stage` actually is, and therefore the
   *  height the preview iframe should use in normal (non-Reveal) mode. */
  svh: number;
  safe: SafeAreaInsets;
  /** The ratio between the invitation's *requested* `initial-scale` (0.9, see
   *  `INVITE_REQUESTED_SCALE`) and what this device's browser actually renders at — i.e. this
   *  row's own `INVITE_EFFECTIVE_SCALE` equivalent. Measured 0.765 on a real iPhone 17 Pro; a real
   *  iPad (A16, iOS 26.4) measured **1** — `visualViewport.scale` reads exactly 1, meaning iPad
   *  Safari does not apply the same shrink an iPhone does. So this is **not a universal constant**
   *  and must not be hardcoded once per app — it's per-device, same reasoning as `svh`/`lvh` above.
   *  Desktop browsers ignore the mobile-oriented viewport meta entirely, so `1` there is a platform
   *  fact, not a guess. Every other phone row reuses the iPhone 17 Pro measurement pending its own
   *  `ViewportProbe` run — see docs/FIX_QUEUE.md Issue 2. */
  scale: number;
  /** Never trust an `estimated` row as fact — it's a placeholder until measured on real hardware
   *  with `ViewportProbe` (see docs/FIX_QUEUE.md Issue 2's verification section). */
  source: 'measured' | 'estimated';
}

const zeroSafe: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * All rows below are `estimated` placeholders — overwrite with `measured` rows once
 * `ViewportProbe` has been run against real hardware (see docs/FIX_QUEUE.md Issue 2). Treat these
 * numbers as rough, not authoritative.
 *
 * The chrome-height assumption folded into every `svh`/`lvh` here: iOS 15+'s Safari "minimal UI"
 * redesign moved the toolbar to the bottom and made it materially thinner than the old top address
 * bar it replaced — roughly ~85px full (address field + tab/action row) collapsing to ~35px (just
 * the home-indicator strip) once scrolled, with **nothing subtracted at the top** beyond what
 * `screenH` already accounts for (the status bar/Dynamic Island is an OS-level safe area a page
 * can render behind, not a Safari chrome bar that shrinks the viewport). An earlier pass here
 * assumed a much larger ~180px bottom overhead, which — combined with every T7 stage's art-canvas
 * `canvas: { mobile: { w: 390, h: 844 } }` reference (see `Template7-romangarden/data/stages.ts`)
 * — over-cropped the cover-fit canvas by roughly 2x what a real device showed, badly enough that a
 * slot's text overflowed its box into its neighbour. If a fresh probe still shows a mismatch,
 * suspect this constant before anything else.
 */
export const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: 'iphone-se', label: 'iPhone SE', group: 'phone',
    w: 375, screenH: 667, lvh: 632, svh: 582, safe: zeroSafe, scale: 0.765, source: 'estimated',
  },
  {
    id: 'iphone-15', label: 'iPhone 15', group: 'phone',
    w: 390, screenH: 844, lvh: 809, svh: 759,
    safe: { top: 47, right: 0, bottom: 34, left: 0 }, scale: 0.765, source: 'estimated',
  },
  {
    // `w` and `svh` are derived from a real `ViewportProbe` reading (iOS 18.7, Safari 26.4): the
    // probe's own vh/svh/lvh readout was broken by a since-fixed bug in ViewportProbe.tsx, but
    // `stage.h` (a plain `getBoundingClientRect()` on the real `.stage` element, unaffected by that
    // bug) read 933.33 layout px, and `visual.scale` read 0.765 — `933.33 * 0.765 ≈ 714` device px.
    // `lvh`/`safe` are still guesses; get a corrected probe reading (now that the bug is fixed) to
    // replace them.
    id: 'iphone-17-pro', label: 'iPhone 17 Pro', group: 'phone',
    w: 402, screenH: 874, lvh: 754, svh: 714,
    safe: { top: 59, right: 0, bottom: 34, left: 0 }, scale: 0.765, source: 'estimated',
  },
  {
    id: 'iphone-17-pro-max', label: 'iPhone 17 Pro Max', group: 'phone',
    w: 440, screenH: 956, lvh: 918, svh: 866,
    safe: { top: 59, right: 0, bottom: 34, left: 0 }, scale: 0.765, source: 'estimated',
  },
  {
    id: 'iphone-15-pm', label: 'iPhone 15 Pro Max', group: 'phone',
    w: 430, screenH: 932, lvh: 896, svh: 844,
    safe: { top: 59, right: 0, bottom: 34, left: 0 }, scale: 0.765, source: 'estimated',
  },
  {
    id: 'galaxy-s24', label: 'Galaxy S24', group: 'phone',
    // Chrome's Android toolbar overhead is typically smaller than Safari's. Android Chrome doesn't
    // have the same iOS-Safari initial-scale anomaly at all as far as anyone's checked — 0.765 here
    // is an unverified carry-over from the iPhone measurement, not an Android-specific one.
    w: 360, screenH: 780, lvh: 756, svh: 724, safe: zeroSafe, scale: 0.765, source: 'estimated',
  },
  {
    // Real ViewportProbe reading, iPad (A16) Simulator, iPadOS 26.4 Safari — the second device this
    // whole row was flagged as needing (docs/FIX_QUEUE.md Issue 2's open question). `visualVV`
    // scale read exactly **1**, not 0.765 — the iPhone effective-scale anomaly does not apply here,
    // which is why `scale` exists as a per-row field now instead of one global constant. `w` was
    // also simply wrong before (768 is a pre-2016 iPad width; a real base iPad reports 820).
    id: 'ipad', label: 'iPad', group: 'tablet',
    // iPadOS Safari chrome does not collapse on scroll — lvh === svh, unlike phone Safari.
    w: 820, screenH: 1180, lvh: 1123, svh: 1094,
    safe: { top: 0, right: 0, bottom: 20, left: 0 }, scale: 1, source: 'measured',
  },
  {
    id: 'fold-cover', label: 'Fold cover', group: 'phone',
    // Aspect-ratio outlier — where the fixed-stage compositor's art-canvas fix is exercised most.
    w: 344, screenH: 882, lvh: 847, svh: 797, safe: zeroSafe, scale: 0.765, source: 'estimated',
  },
  {
    id: 'landscape-15', label: 'Landscape', group: 'phone',
    // Landscape chrome is much thinner than portrait — do not derive this from the portrait row.
    w: 844, screenH: 390, lvh: 375, svh: 355,
    safe: { top: 0, right: 21, bottom: 0, left: 21 }, scale: 0.765, source: 'estimated',
  },
  {
    id: 'desktop-1280', label: 'Desktop', group: 'desktop',
    // Desktop browsers ignore the mobile-oriented viewport meta tag entirely — scale 1 here is a
    // platform fact, not something that needs a ViewportProbe run to confirm.
    w: 1280, screenH: 720, lvh: 720, svh: 720, safe: zeroSafe, scale: 1, source: 'estimated',
  },
];

export function presetById(id: string): DevicePreset | undefined {
  return DEVICE_PRESETS.find((p) => p.id === id);
}

export type Device = 'mobile' | 'tablet' | 'desktop';

/** Default preset id per device chip — replaces the old `DEVICE_DEFAULT_DIMS`. */
export const DEVICE_DEFAULT_PRESET: Record<Device, string> = {
  mobile: 'iphone-17-pro',
  tablet: 'ipad',
  desktop: 'desktop-1280',
};

export function defaultPresetFor(device: Device): DevicePreset {
  const preset = presetById(DEVICE_DEFAULT_PRESET[device]);
  if (!preset) throw new Error(`No device preset for "${device}"`);
  return preset;
}
