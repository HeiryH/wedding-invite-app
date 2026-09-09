# Fix Queue

A running list of known problems and the work each one needs. Newest issues get appended at the
bottom. Each issue is self-contained: the plain-English problem, the decision, then the checklist.

Status legend: `[ ]` todo · `[x]` done · `[~]` in progress · `[-]` deliberately skipped

---

## Issue 1 — Template art falls apart on odd-shaped screens

**Branch:** `ae-unified` · **Status:** DONE for mobile (A–F) and desktop (see below) · **Raised:** 2026-08-19 · **Desktop fixed:** 2026-09-08

### The problem in plain English

Template 7's scenery (arch, stairs, fountain, pots) is placed with percentages — "40% down the
screen, 92% wide". Width and height percentages don't move together, so on a tall narrow screen
(folding phone cover display, ~344×882) the art pieces get **smaller** while the gaps between them
get **bigger**. The scene pulls apart.

Meanwhile the background photo does the opposite — it zooms in and crops (`object-fit: cover`).
Foreground and background move in opposite directions, which is what makes it look broken rather
than merely off.

**Why the background copes and the art doesn't:** the background is *one* image, so the browser has
a built-in rule for it. The art is six *separate* images with no shared frame — nothing tells the
browser they belong to the same picture, so there's nothing to cover-fit.

### The decision

Declare the scenery to be one picture — an **aspect-locked art canvas** per stage — and cover-fit
that canvas. Everything inside it then moves as a unit, exactly like the background.

**Scenery goes in the canvas. Real content (RSVP form, countdown, wish list) stays out of it** and
keeps adapting to the actual screen. Cropping the edge off a decorative pot is fine; cropping the
edge off the RSVP button is not.

Implemented as a **CSS cover box, not `transform: scale()`** — so text stays crisply rendered,
parallax's pixel offsets aren't multiplied, and the canvas stays a real layout box that
`getBoundingClientRect()` reports honestly (which is what keeps editor dragging correct).

Rejected alternative: the older "one shared cover-crop transform over the whole composition" plan in
`CLAUDE.md`'s Known Issues. It scales the RSVP form and countdown too (they'd crop with no way to
scroll to them), it blows up ~2.16× in landscape, and it silently breaks the editor's drag math.

### Non-goals

- Not touching the 900px breakpoint bucket (`useBreakpoint.ts`) — separate concern.
- Not adding an aspect-keyed third breakpoint — multiplies tuning burden, still fails unknown devices.
- Not coupling the canvas to the resolved `bgPosition` — it's a free-form CSS string, not worth it.
- Templates 1–6, flow stages, authored templates and `ceremony-rail` stay untouched **by
  construction** (no `canvas` field ⇒ today's rendering, byte for byte).

### Checklist

**A. Make the failure visible first** — DONE 2026-08-20
- [x] Reveal mode ignored the custom width/height sliders and snapped back to a stock device size.
      Fixing it needed more than the one line expected: the reveal frame is pinned *inside* the
      iframe from `Template7/index.tsx`'s own hardcoded `REVEAL_FRAME_W/H` (390×844), which never
      saw the previewed size. So `customW`/`customH` were **lifted out of `PreviewPanel` into
      `customize/page.tsx`** (alongside `device`/`manualZoom`), added to `EditorHandle` as
      `frameW`/`frameH`, forwarded through the `PREVIEW_UPDATE` payload **and** the standalone
      preview page's field-by-field rebuild, and consumed as
      `editor?.frameW ?? REVEAL_FRAME_W[breakpoint]`. The template constants remain as the fallback
      for the authoring preview, which never reveals.
- [x] Removed `DEVICE_DIMS` from `PreviewPanel` — once reveal reads the previewed size, nothing
      consumed it, and leaving a second near-identical dims map is exactly the duplication hazard
      this repo keeps producing.
- [x] Added presets: **Fold cover 344×882** and **Landscape 844×390**.
- [x] Reproduced on `welcome` (event 20 `helyana-and-heiry`, template 7) at 390×844 vs 344×882.

**Measured evidence** (on-screen boxes, welcome stage):

| layer | 390×844 | 344×882 | change |
|---|---|---|---|
| `arch` height | 494px | 436px | **−11.7%** |
| `stairs` height | 197px | 173px | −12.2% |
| `fountain` height | 196px | 173px | −11.7% |
| arch→stairs centre gap | 308px | 322px | **+4.5%** |

The art shrinks ~12% while the gaps between pieces grow ~4.5% — so **separation relative to art
size rises ~19%**. Confirms the mechanism is not a simple shift: `chain: true` art derives its
height from stage *width*, while `y` is a percentage of stage *height*, so the two axes move in
opposite directions. Visually: a large empty band opens above the arch and the stairs detach from
the columns, while the cover-fitted background grows — foreground and background at visibly
different scales in the same frame.

**B. Engine**
- [ ] `types.ts` — add `StageDef.canvas?: { w: number; h: number }` (the reference aspect).
- [ ] `types.ts` — add per-layer `canvasAnchor?: boolean`, to pull a specific slot *into* the canvas.
      Needed for `welcome`, where `countdown` sits at the same coordinates as `arch` (`x:50,y:40`)
      and must stay composed against it.
- [ ] `Stage.module.css` — add `.artCanvas`: absolutely positioned, centred, `width: max(100%,
      100svh * var(--ar))` / `height: max(100svh, 100cqw / var(--ar))`, `container-type: inline-size`.
      No `transform: scale()`.
- [ ] `Stage.tsx` — when `def.canvas` is set, split layers into canvas members (`img`/`shape`/`text`,
      plus any `canvasAnchor` slot) and stage-level members (everything else). Mirrors the existing
      flow-mode split at `Stage.tsx:58-61`.
- [ ] Confirm no change to `OVERRIDABLE` (`layout.ts`), `flatten.ts`, the Adjust panel, or
      `TemplateConfigPolicy` — canvas membership is derived from `kind`, not stored per layer.

**C. Editor correctness** — DONE 2026-08-20
- [x] `Layer.tsx` `beginDrag` now resolves `closest('[data-canvas], [data-stage]')`, so a layer
      converts pointer pixels against the frame its percentages are actually measured in. Because
      the canvas is *sized* rather than *scaled*, its rect needs no compensation factor.
      Both drag and resize share this one lookup, so the resize path was fixed by the same change.
- [x] The stage flag was renamed to `data-has-canvas` so `closest('[data-canvas]')` can never match
      the stage by accident — the wrapper alone owns `data-canvas`.
- [x] Verified in-browser at 344×882: scenery + the `canvasAnchor` countdown resolve to the canvas
      (408×882); the scroll cue, correctly outside, resolves to the stage (344×882).
- [ ] Still to check by hand in the editor: `useParallax` px offsets, `cqi` typography inside the
      canvas, and that "Reveal off-screen" reads correctly (dashed frame on `.stage`, canvas
      overflowing it is the point). Structurally expected to be fine; not yet eyeballed.

**D. Rollout**
- [x] `welcome` converted (`canvas: { w: 390, h: 844 }`, `countdown` flagged `canvasAnchor` since it
      shares the arch's coordinates and must crop with it). **No retuning needed** — at the
      reference aspect the canvas resolves to exactly the stage box, so the numbers carry over
      unchanged.
- [x] All seven remaining fixed stages converted (`ceremony-{walimah,couple,details,programme}`,
      `rsvp`, `wishes`, `photobooth`). `wishes.titleText` is flagged `canvasAnchor` — it is text set
      **on** the decorative title plate and both sit ~35% above centre, far enough out that a
      vertical crop would visibly separate them. Every other slot sits near the vertical centre,
      where drift is negligible, so it stays outside and keeps adapting.
- [x] `ceremony-rail` confirmed excluded — its geometry is a % of the whole `N*100vw` row.
- [x] Hardened: a stage may *declare* a canvas and have no art to put in it (the compiled ceremony
      row strips each beat's art in `registry.ts`). `Stage.tsx` falls back to the plain path rather
      than wrapping nothing and imposing size containment for no benefit.

**Canvas is per-breakpoint — found the hard way.** The first cut applied one reference shape to
both breakpoints, which **regressed desktop**: forcing the mobile 390×844 aspect onto a 1440×900
viewport builds a canvas 3116px tall, spreading the art over 3.5× the viewport and cropping it.
Measured art scaling 0.875–0.889 against content at 1.138 — the same bug, inverted. `canvas` is now
`Partial<Record<Breakpoint, {w,h}>>`; a breakpoint left out has no canvas and renders exactly as
before. T7 ships **`mobile` only**, verified absent from the desktop DOM.

### Verified — every mobile stage, 390×844 → 344×882

All seven rendered stages scale **uniformly within 1px** of the background's own cover factor
(1.045). An earlier "spread" reading was measurement noise: a 1px rounding step on a 15px
`partition` is 6.7%, so the check now compares predicted vs actual **pixels**, not ratios.

To surface the ceremony beats at all, a temporary `walimah.body` row was inserted for event 20
(they are gated on it) and **deleted afterwards** — dev DB backed up first, row count back to 82.
Note their art is `hidden` on mobile by design, so on phones those beats carry only their slot.

**E. Verify** — DONE 2026-08-21

Seven-shape sweep of `welcome`, every layer's height ratio against the 390×844 reference:

| layer | fold 344×882 | s24 360×780 | max 430×932 | ipad 768×1024 | land 844×390 | desktop 1440×900 |
|---|---|---|---|---|---|---|
| arch / stairs / barrier / fountain / column | 1.045 | 0.924 | 1.104 | 1.969 | 2.164 | *varies 1.48–1.98* |
| countdown (canvasAnchor) | 1.045 | 0.924 | 1.104 | 1.969 | 2.164 | 0.863 |
| cue (outside canvas) | 1.045 | 0.924 | 1.104 | 1.213 | 0.462 | 0.914 |
| canvas box | 408×882 | 360×780 | 431×932 | 768×1662 | 844×1827 | none |
| crop X / Y | 15.6 / 0% | 0.1 / 0% | 0.2 / 0% | 0 / 38.4% | 0 / 78.6% | — |

- [x] **Phones are exact** — every canvas member scales identically, crop is horizontal and small.
- [x] **iPad uniform but heavily cropped** (38.4% vertical; `cue`, correctly outside, diverges at
      1.213). Screenshotted: proportions are faithful and it reads as a deliberate cover zoom, with
      the stairs falling below the fold. Accepted, not a bug. If the stairs ever need to be visible
      a `tablet` breakpoint is the answer — `useBreakpoint` buckets everything under 900px as mobile.
- [x] **Landscape** 78.6% vertical crop, as documented below.
- [x] **Desktop** has no canvas, so its varying ratios are the pre-existing drift (see Deferred).
- [x] `tsc --noEmit` 0 errors · `next build` 30/30 pages.
- [x] **Parallax unaffected** — `--sl-par` is −3.1498px at both 390×844 and 344×882, confirming the
      "sized, not scaled" choice: a transform would have multiplied these.
- [x] **Reveal off-screen verified end-to-end** by driving the standalone preview with a
      `PREVIEW_UPDATE` payload: reveal off → stage 1000×1200; reveal on → stage pinned to exactly
      the `frameW/frameH` sent (344×882), `overflow: visible`, canvas 408×882 bleeding 32px each
      side. That bleed is precisely the art a fold phone crops, which is what reveal is for.
- [~] **`cqi` typography — inconclusive, and harmless.** T7's hero type is clamped to a px floor at
      phone sizes (24px at both 390 and 344), so the canvas cannot move it either way; at iPad the
      canvas width equals the stage width, so the two are indistinguishable. No behaviour change,
      but the canvas's `container-type: inline-size` is currently unexercised by real type.
- [ ] Stored layout deltas: the 9 `*.layout.*` rows and 8 default rows were **not** re-verified
      against a rendered invitation — they are per-layer patches so they keep applying, but a
      composition tuned pre-canvas may want retuning.

**F. Docs** — DONE 2026-08-21
- [x] `CLAUDE.md` Known Issues rewritten: the old "one shared cover-crop transform" plan is replaced
      by what was actually built, including the per-breakpoint constraint, the `container-type:
      size` requirement, the stacking-context invariant, and the still-open desktop case.
- [x] Corrected the stale "can't be previewed without real hardware" claim, and documented that
      reveal now honours the previewed size via `EditorHandle.frameW/frameH`.

---

### Result on `welcome` (measured, 390×844 → 344×882)

| layer height | before fix | after fix | reference |
|---|---|---|---|
| `arch` | 436px (−11.7%) | 516px (+4.5%) | 494px |
| `stairs` | 173px (−12.2%) | 205px (+4.1%) | 197px |
| `fountain` | 173px | 205px | 196px |

Every piece now scales by the **same** +4.5% — which is exactly the background's own cover factor
(882/844) — instead of shrinking while the gaps grew. Separation relative to art size was drifting
**+18.4%**; it is now **+0.05%**. At the reference aspect the numbers are byte-identical to before,
as the math guarantees (canvas ≡ stage there).

### Desktop — fixed 2026-09-08, and the surprise it turned up

The original plan here was a redesign pass (a fresh desktop reference aspect + retuned per-layer
positions), based on the measured drift above. Live testing with the dev server + Playwright
screenshots before writing any code overturned that plan:

- **T7 needed no redesign.** Every canvas-bearing stage already had a hand-authored `desktop: {...}`
  per-layer override block (someone had already tuned arch/barrier/fountain/column/stairs/countdown
  etc. for wide screens — see `Template7-romangarden/data/stages.ts`). Screenshotted `welcome` at
  seven real shapes (1024×900, 1024×1366, 1280×720, 1440×900, 1680×1050, 1920×1080, 2560×1080) and
  `ceremony-couple` in both its `row` (this test event's actual default, via the captured starting
  design) and `stack` layouts at 1280×720/1920×1080: all render as coherent, correctly-proportioned
  scenes even *before* any canvas fix. The measured 0.875–0.889-vs-1.138 drift is real as a number
  but wasn't visibly breaking anything — likely because this composition is symmetric with generous
  margins and real desktop windows vary far less in aspect than mobile devices do. **Fix applied**:
  added `canvas.desktop: { w: 1440, h: 900 }` to all 8 stages, mechanically identical to the mobile
  fix and touching zero existing layer values — canvas ≡ stage at exactly 1440×900 (confirmed
  byte-identical to the pre-fix render there), and every other desktop shape now cover-scales as one
  unit instead of drifting. Verified: no regression at any of the 7 shapes above, both ceremony
  layout modes.
- **Template10 "Sunny Safari" (a different, newer template on the same shared engine, not yet
  deployed) had the actually-severe version of this bug.** Its `welcome` stage's `desktop:` block
  only resized text font-size — zero position overrides — and it had **no `canvas.desktop` at all**,
  meaning on any real desktop window its hero text and foreground art (zebra, monkeys) were
  positioned independently and visibly collided: the title "Malik Turns 3 &" overlapped the zebra
  and a monkey's arm, "Empire" overlapped the date line, worse at 1920×1080 than 1280×720. Fixed the
  overlap completely, confirmed by screenshot at both tested sizes, at the cost of cropping the very
  top of the scene (the "You're invited to" eyebrow line scrolls off-screen above the visible area
  on wide windows) — the same accepted crop-not-squash trade-off already precedented by T7's iPad
  case above. Re-checked T10's `rsvp`/`wishes`/`photobooth` stages too (its `details`/`itinerary`
  are content-gated and didn't render in the test event) — all clean, no regressions.
- **The real fix, once T10 exposed the actual failure mode**: it wasn't that T10 needed its own
  `canvas.desktop: { w: 1024, h: 1696 }` entry (that was tried first and worked, but is a per-
  template patch of exactly the kind that would need repeating for every future template on this
  engine). `Stage.tsx`'s single canvas-resolution line now **falls back to the `mobile` aspect
  whenever `desktop` is left unset**, instead of silently having no canvas at all — T10's fix was
  then simplified to remove the now-redundant explicit `desktop` key and re-verified pixel-identical
  against the fallback alone. This closes the hole at the engine level: any current or future
  fixed-stage-compositor template that never designs a distinct desktop composition is protected by
  default, with zero extra authoring step. A template only needs an explicit `canvas.desktop` when
  it deliberately wants a different desktop picture — T7 keeps its explicit `1440×900` for exactly
  that reason (its desktop-only landscape `pillars.webp` art).
- **Lesson for next time**: don't plan a redesign from a measured percentage alone — render it and
  look first. The actual severity distribution was the opposite of what the raw numbers suggested.
- **Still open, low-value**: T7's desktop scaling is now uniform but not re-optimized per shape the
  way mobile's iPad/landscape cases were explicitly evaluated and accepted — nobody has looked hard
  at whether 1440×900 is the *best* possible desktop reference, only that it's harmless (matches the
  existing tuning) and fixes the drift.

### Known limitation — landscape

At 844×390 the canvas is width-driven, so art sizes come out **identical to the old behaviour**
(`arch` 1069px either way) — the canvas neither fixes nor worsens the scale. What changes is that
the composition is now *cropped* (you see the middle of a correctly-composed scene, `stairs` fall
below the fold) rather than *squashed*. A portrait-composed full-screen invitation is degenerate in
landscape regardless. If it ever matters, the fix is a clamped cover scale or a landscape-specific
reference aspect — deliberately **not** attempted here.

---

## Issue 2 — Adjust Editor preview renders text bigger than a real phone

**Branch:** `ae-unified` · **Status:** DONE · **Raised:** 2026-08-25 · **Real-hardware check:** 2026-09-08

### The problem in plain English

Designing a template meant tuning it in the Adjust Editor, then re-checking it in the iOS
simulator, because the two disagreed — badly enough that text had to be pushed to ~2x in the
editor to look right on a phone, at which point the editor itself showed it clipped and wrong. The
preview had stopped being trustworthy, so the real design loop ran in the simulator and the editor
preview was decoration.

There were two independent causes.

**Cause 1 — layout-viewport zoom.** The invitation ships `initial-scale: 0.9`
(`app/[eventType]/layout.tsx`), so a 390px phone actually lays out at ~433 CSS px and paints back
at 90%. An iframe ignores viewport meta, so the editor's preview iframe laid out at a raw 390 —
about 11% narrower a layout box than a guest gets, which inflates every `rem`-floor in a
`clamp(0.6rem, 1.5cqi, 0.78rem)`-style rule (most of Template 7's type at phone sizes).

**Cause 2 — every preset was a full-screen device size.** `.stage { height: 100svh }` is the unit
the whole fixed-stage compositor is built on, and `100svh` is Safari's chrome-*visible* height —
materially shorter than the screen because of the URL/tool bar. The editor's presets (390×844 etc.)
were the *screen* size, so the iframe was composing against a stage ~25% taller/roomier than any
guest's browser ever gives it. This is the cause actually reported — the width axis (Cause 1) was
already correct by inspection; the height axis never was.

A third, smaller issue rode along: `env(safe-area-inset-*)` is always `0` inside an iframe (no real
notch to query), and under "Reveal off-screen" the iframe's *ambient* viewport is deliberately 2.2x
wider / 1.5x taller than the pinned device box, so any raw `vw`/`vh`/`svh` inside the invitation
(sheet `max-height`, the lightbox, `HorizontalRail`) read the wrong box under Reveal specifically.

### The decision

1. **Emulate the layout viewport** (Cause 1) — one constant, `lib/inviteViewport.ts`
   (`INVITE_INITIAL_SCALE = 0.9`), consumed both by the real invitation's `viewport` export and by
   `PreviewPanel`, which lays the iframe out at `size / 0.9` and paints it back down with a
   `scale(zoom/100 * 0.9)` transform — so the on-screen size is unchanged but every relative unit
   inside resolves against the same layout box a guest gets.
2. **Size the iframe to `svh`, not the screen** (Cause 2) — `lib/devicePresets.ts` stores
   `screenH`/`lvh`/`svh` per device *separately* (they are not a formula: iPadOS Safari chrome
   doesn't collapse, so `lvh === svh`; landscape chrome is much thinner than portrait), and
   `PreviewPanel`'s `PreviewFrame` sizes the iframe to `frame.svh`. No mock browser bars are drawn —
   this is a height-fidelity fix only, by explicit choice; `screenH`/`safe` are still stored so a
   later "draw the chrome" pass has real numbers instead of re-deriving them.
3. **Frame-scoped CSS custom properties** for the handful of raw viewport units that don't already
   read a container query (`--fvw`/`--fvh`/`--fsvh`/`--fsat../--fsal`, defined only inside the
   editor's standalone preview via `_shared/FrameViewportVars.tsx`, every use site falling back to
   the literal unit via `var(--fsvh, 100svh)` — a no-op on a guest's browser, where the property is
   never set). Fixes Reveal-mode divergence for `.flowStack`'s gaps, the RSVP/wish bottom sheet, the
   photo lightbox, safe-area padding, and `useParallax`'s scroll math; `HorizontalRail` migrated as
   one CSS+JS unit since `--rail-x` is written from JS in the same unit its CSS consumes.
4. **A measurement harness** (`components/dev/ViewportProbe.tsx`, mounted behind `?probe=1` on both
   the public invitation and the editor's standalone preview) so every number above is *measured*,
   never guessed — `svh` in particular has no JS accessor, so it's read via a zero-content probe
   element's `getBoundingClientRect()`.

### Non-goals

- **Drawing mock Safari chrome bars.** Explicit call: height fidelity only, no visual bars.
- **Pinning `position: fixed` elements (the sheet, the lightbox) to the frame's position under
  Reveal.** The `--f*` vars fix their *size*; they still centre on the ambient (widened) iframe
  rather than the pinned device box. Six `fixed` rules, cosmetic only, and Reveal is a PRO art-bleed
  tool nobody uses to inspect sheet placement.
- **Templates 1–6's `vw`-based font clamps.** Never broken by Cause 1 (`vw` and `rem` scale by the
  same paint factor and cancel) and never revealed (Reveal is T7-only). A mechanical consistency
  pass is possible later but adds no correctness.
- **Removing `initial-scale: 0.9`.** Legitimate simplification (nearly all type is `cqi`, so this
  mostly just shrinks `rem` floors 10%), but changes every existing invitation's rendering — a
  separate decision, not a bug fix.
- **Desktop art-canvas drift** (Issue 1, Deferred). Unrelated axis.

### Checklist

- [x] `lib/inviteViewport.ts` + `app/[eventType]/layout.tsx` — layout-viewport emulation (Cause 1).
- [x] `lib/devicePresets.ts` — per-device `w`/`screenH`/`lvh`/`svh`/`safe`, `source: 'estimated'`
      pending real-hardware measurement; added iPhone 17 Pro / Pro Max (previously not selectable).
- [x] `PreviewPanel.tsx` — `PreviewFrame` replaces `customW`/`customH`; iframe sized to `frame.svh`;
      H slider edits the visible box directly (clears chrome fields to a bare frame, rather than
      inventing numbers); status strip shows the screen-size hint when a preset is active.
- [x] `_shared/types.ts` — `EditorHandle.frame: FrameViewport` (layout-px `w`/`h`/`svh`/`safe`);
      `frameW`/`frameH` kept `@deprecated` for one release.
- [x] `customize/page.tsx` payload, `app/(standalone)/organizer-admin/preview/page.tsx` (the
      field-by-field payload rebuild — `frame` added to both the interface and the JSX, with a
      derivation from `frameW`/`frameH` for a stale cached payload) — `frame` plumbed end to end.
      `preview_draft` localStorage key bumped to `preview_draft_v2` (also updated in
      `app/personalise/page.tsx` and `app/try/page.tsx`, the other two writers of that key) so a
      draft written before `editor.frame` existed can't resurrect the old shape on mount.
- [x] `Template7-romangarden/index.tsx` — `REVEAL_FRAME_H.mobile` dropped from `844` (screen) to
      `664` (svh estimate); reads `editor?.frame?.svh` ahead of the deprecated `frameH`.
- [x] `_shared/frameViewport.ts` (module-scope pinned-frame singleton, read by `useParallax` and
      `HorizontalRail` inside their rAF loops — not a context, not a style read) +
      `_shared/FrameViewportVars.tsx` (writes `--fvw/--fvh/--fsvh/--fsat/--fsar/--fsab/--fsal` on
      `:root`, mounted once, only in the standalone preview page).
- [x] CSS migration: `Stage.module.css` (`.stage`, `.flowStack`), `slots/slots.module.css`
      (`.sheetCard` max-height + safe-area padding, `.lightboxCard`/`.lightboxPhoto`),
      `HorizontalRail.module.css` + `.tsx` (`--rail-x`/`--rail-bg-x` switched from `vw` strings to
      px, so they no longer need to agree with a hardcoded unit). `Layer.tsx`'s `cqi` and the ~44
      `cqi` rules across `slots.module.css`/`Template7.module.css` were **not** touched —
      `container-type: inline-size` on `.stage`/`.slot`/`.artCanvas`/`.sheetCard` already makes
      every one of them frame-relative; T7 has zero raw viewport units.
- [x] `components/dev/ViewportProbe.tsx`, mounted behind `?probe=1` on
      `app/[eventType]/[slug]/page.tsx` and the standalone preview page.
- [x] `tsc --noEmit` 0 errors · `next build` 30/30 pages.
- [x] **Real-hardware measurement.** Every `devicePresets.ts` row is `source: 'estimated'` (derived
      from published viewport-unit figures, not this project's own hardware). Run `ViewportProbe`
      in the iPhone 17 Pro simulator (or, better, a real device) and in the editor at the matching
      preset, diff the two `Copy JSON` outputs, and overwrite the row with the measured numbers
      (flip `source` to `'measured'`). This is the acceptance test the rest of this issue was built
      to make possible. Run for iPhone 17 Pro (see Correction 1 below) and, 2026-09-08, for a real
      second device (iPad) — see Correction 2, which found and fixed a real bug this check was
      specifically designed to catch.
- [x] **Correction, same day:** the first estimate assumed ~180px of Safari bottom-chrome overhead
      (`svh` = screen − 180), which combined with every T7 stage's art-canvas
      `canvas: { mobile: { w: 390, h: 844 } }` reference to over-crop the cover-fit canvas by
      roughly 2x what the iPhone 17 Pro simulator actually showed — visibly (a slot's text
      overflowed its box into its neighbour, screenshotted by the user as "not even close").
      Revised to the iOS 15+ "minimal UI" model (~85px full chrome / ~35px collapsed, nothing
      subtracted at the top beyond what `screenH` already accounts for — the status bar/Dynamic
      Island is an OS safe area a page renders behind, not a Safari chrome bar). Still `estimated`;
      still needs the real-hardware check above before either number can be trusted.
- [ ] **Re-tuning existing stored layouts.** Any stage tuned against the old (screen-height, ~25%
      too tall) preview has `y%` coordinates compensating for that error. The preview becoming
      honest will make those layouts visibly jump on next open — expected, not a regression (a
      guest's rendering never changes: `--f*` are only ever set inside the editor). Not re-tuned as
      part of this change; whoever owns each template's layout should re-check it once measured.

### Result

Nothing a guest sees changes — `--f*` are set only inside the editor's iframe, and every migrated
CSS declaration falls back to the literal unit when unset. The fix is entirely in what the *editor*
renders: the preview iframe is now sized to the same `svh` a real Safari gives an invitation, so a
layer tuned to look right in the editor looks right on the device it was designed for, without a
compensating 2x push — confirmed by the real-hardware checks in Corrections 1 and 2 below.

### Correction 1 — the first real-device check found a second bug and a wrong constant

The very first `ViewportProbe` run (iPhone 17 Pro simulator, iOS 18.7 / Safari 26.4, on the
*public* invitation, not the editor) surfaced two more problems, both now fixed:

1. **`ViewportProbe` itself had a bug.** `measureUnit`'s "whichever axis is nonzero" heuristic
   always picked the 1px cross-axis placeholder every height/`env()` probe also sets, so
   `units.{vh,svh,lvh,dvh}` and `safe.*` all silently read back as literally `1`. Fixed by passing
   the intended axis explicitly instead of guessing it.
2. **`INVITE_INITIAL_SCALE` (0.9) was never actually verified — and it's wrong.** The probe's
   *other* numbers (`visualViewport.scale`, `window.innerWidth`, and `.stage`'s own
   `getBoundingClientRect()` height — all plain browser APIs, unaffected by bug #1 above) agreed
   with each other and showed the browser rendering at an *effective* scale of **0.765**, not the
   `0.9` written in the meta tag. This single wrong constant fed every width/height conversion in
   `PreviewPanel`, so it — not the `svh` chrome-height guess Correction 0 already revised — was the
   dominant cause of the "not even close" mismatch the user screenshotted (tighter art-canvas crop
   than the real device, and a ceremony-stage text slot box shrunk enough to overflow into the
   heading above it).

**The fix is two separate constants, not one corrected number** — `lib/inviteViewport.ts` now
exports `INVITE_REQUESTED_SCALE` (0.9, the literal meta-tag value `app/[eventType]/layout.tsx`
still sends to every guest, unchanged) and `INVITE_EFFECTIVE_SCALE` (0.765, what the editor's math
uses to reproduce the *result*). Collapsing these back into one constant and "correcting" the real
meta tag to `0.765` would have been a mistake: we don't know Safari responds to a *requested*
`0.765` the same way it responded to a requested `0.9` — the mechanism producing the 0.9→0.765 gap
is unconfirmed (a device-density-dependent adjustment is one candidate), so changing what we ask
for is a different, unverified experiment on every guest's real rendering, not a fix.

`lib/devicePresets.ts`'s `iphone-17-pro` row was corrected in the same pass: `svh` derived from the
same probe's reliable `.stage` height (933.33 layout px × 0.765 ≈ 714 device px) rather than the
earlier guessed chrome-overhead model. `lvh`/`safe` on that row, and every other row in the file,
are still unmeasured guesses.

**Open question, not yet answered:** is `INVITE_EFFECTIVE_SCALE` a universal constant, or does the
0.9→0.765 gap vary by device/iOS version? Only one data point exists. Re-measuring on a second,
different device (ideally something other than an iPhone — an iPad in particular, since
`previewBreakpoint`'s `>= 900` check now pushes the `ipad` preset's emulated width to ~1004, over
the line into `'desktop'`, which may not match what a real iPad guest actually renders) would answer
this and is the next concrete step, ahead of re-tuning any stored layout.

### Correction 2 — the open question had a "no," and it was hiding a real, currently-live bug

Answered 2026-09-08 with a real second-device measurement: **iPad (A16), iPadOS 26.4, Safari, via
the Xcode Simulator** (this machine has a full simulator runtime, just not pointed at by
`xcode-select` by default — `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` finds it
without touching the system-wide toolchain). `ViewportProbe` on the real public invitation read
`visualVV` scale as exactly **1**, not 0.765 — **the 0.9→0.765 anomaly is iPhone-specific, not a
universal Safari behaviour.** Also caught in the same reading: the `ipad` preset's `w: 768` was
simply wrong (768 is a pre-2016 iPad width; a real base iPad reports 820), and its safe-area shape
was backwards (modern iPads inset the *bottom* for the home-indicator swipe bar, not the top —
there's no notch-style top inset the way an iPhone has). `devicePresets.ts`'s `ipad` row is now
`w: 820, screenH: 1180, lvh: 1123, svh: 1094, safe: {top:0,right:0,bottom:20,left:0}, source:
'measured'`.

**This wasn't just a stale-numbers fix.** The open question named the exact live consequence
already, in its own text above: `frame.w / INVITE_EFFECTIVE_SCALE >= 900` pushing the `ipad` preset
over the `'desktop'` line. With the corrected width that's `820 / 0.765 ≈ 1072` — still over 900,
still wrong — because the root problem was never the width, it was applying an iPhone-only constant
to every device unconditionally. A real iPad guest's browser resolves `useBreakpoint`'s own
`(min-width: 900px)` query against its *actual* 820px width (820 < 900 → `mobile`), so anyone
designing a template with the "iPad" chip selected in the Adjust Editor was silently editing and
previewing the **desktop** layout the whole time, while every real iPad visitor gets **mobile** —
two different stored `t*.layout.*` namespaces, two different compositions, and no indication in the
UI that they'd diverged.

**The fix**: `DevicePreset` gained a `scale` field (`lib/devicePresets.ts`) — the same "measured
per-row, never derived from a formula" treatment `svh`/`lvh` already got, since this is exactly the
same kind of fact that turned out not to generalize across devices. Phone rows keep `0.765`
(borrowed from the one confirmed iPhone measurement, `source` stays `'estimated'` until each has its
own `ViewportProbe` run); `ipad` and `desktop-1280` are `1` (desktop browsers ignore the
mobile-oriented viewport meta entirely, so `1` there is a platform fact, not a guess needing
hardware to confirm). `PreviewPanel.tsx`'s `PreviewFrame` now carries `scale` alongside `w`/`svh`/
`safe` (via `frameFromPreset`, and preserved through the custom-size sliders), and every site that
divided by the global `INVITE_EFFECTIVE_SCALE` constant — `PreviewPanel`'s `layoutW`/`layoutH` and
zoom transform, `customize/page.tsx`'s `previewBreakpoint` and the `editor.frame` payload sent to
the preview iframe — now divides by `frame.scale` instead. `lib/inviteViewport.ts`'s
`INVITE_EFFECTIVE_SCALE` constant itself is untouched (still the correct, documented iPhone
measurement) — it's just no longer imported anywhere as if it applied globally. Verified: `tsc
--noEmit` clean, `next build` 30/30 pages, and `820 / 1 = 820 < 900` now agrees with what
`useBreakpoint` gives a real iPad guest.

**Checked for live impact, found none — yet.** If any couple had ever tuned a layout with the
"iPad" chip selected, their delta would be sitting under `t7.layout.desktop.*` /
`t10.layout.desktop.*` and would silently stop being read once tablet correctly resolves to
`mobile`. Queried both `TemplateConfigs` (per-event overrides) and `TemplateConfigDefaults`
(starting-design rows) for any `*.layout.desktop.*` key: **none exist**, in this dev database or
(per `CLAUDE.md`'s branch topology) in production, which hasn't received any of this branch's work
yet. Nothing to migrate today, but flagging this for whoever eventually deploys past this point: if
that ever changes, a stored desktop delta that was actually meant for tablet would need re-saving
under `mobile` by hand, or it just silently reverts to the template default on next load — not
destructive, but a couple's tuning work would appear to have vanished.

---

## Issue 3 — `ScrollVideoLayer` lifecycle bugs (found while debugging the T7 RS, not fixed)

**Branch:** `ae-unified` · **Status:** DONE · **Raised:** 2026-08-27 · **Fixed:** 2026-09-08

Found while tracking down the T7 RSVP "RS" (roman scroll) open/close looping. **None of these were
the cause** of that bug — it turned out to be the video asset containing the animation 3× (see the
note at the bottom) — but all three are real, and all sit in code Template 5's envelope also runs,
which is why they weren't fixed in the same pass as a behaviour change.

1. **The `loadedmetadata` listener is never removed on cleanup.** `ScrollVideoLayer.tsx` does
   `if (video.readyState >= 1) cleanup = setupScrollTrigger(); else
   video.addEventListener('loadedmetadata', () => { cleanup = setupScrollTrigger(); }, {once:true})`,
   and the effect's cleanup removes `touchstart`/`scroll`/`seeked` but not `loadedmetadata`. If the
   effect tears down *before* metadata arrives, the listener survives, fires later, and creates a
   ScrollTrigger assigned to a dead closure's `cleanup` variable — permanently orphaned, never
   killed. Bites hardest in React StrictMode dev (mount → cleanup → mount registers a *second*
   listener; both fire; two live ScrollTriggers).
2. **`unlockiOS` is destructive.** It calls `video.load()` (resets `readyState`, re-fires
   `loadedmetadata`) and a real `video.play()`, only pausing in the `.then()` — so there's a genuine
   playback burst before the pause lands, visible with `videoStartSec: 0`.
3. **`unlockiOS` runs twice on touch devices.** `touchstart` and `scroll` are separate `{once:true}`
   registrations, so both fire — doubling (2).

Fixing these means: remove the `loadedmetadata` listener in cleanup (or guard trigger creation
behind a `cancelled` flag), share one `{once:true}` unlock across both events, and drop `video.load()`
in favour of a non-destructive warm-up.

**Also worth knowing — `scrub` is a no-op in this component.** GSAP only calls
`self.scrubDuration()` inside `if (animation) {…}`, and these `ScrollTrigger.create()` calls pass no
animation, so `scrubTween` stays `0` and `self.progress` is raw and unsmoothed. The `scrub` field
still exists on `Layer` and is still surfaced in the Adjust panel, where it currently does nothing.
Either wire it up or mark it inert — but note it's a persisted field, so removing it is a schema
change.

**And the actual RS bug, for the record:** `rsvp-scroll-greenscreen-h264.mp4` was 291 frames /
12.125s = exactly 3 × the 97-frame / 4.042s animation, with only 97 distinct frames (thirds
byte-identical; per-frame luminance hard-cuts 112 → 42 at frames 97 and 194). Scrubbing it played
open→closed three times. Fixed by re-encoding from `trim=start_frame=0:end_frame=97`. **Check a
scroll-scrubbed asset's frame count against its intended single cycle before wiring it up** — two
speculative code "fixes" were shipped against this before the asset was measured.

### Fix — 2026-09-08

All three lifecycle bugs fixed in `ScrollVideoLayer.tsx` itself (confirmed via exploration to have
**two** live consumers, not the one its own doc comment claimed: Template 5's envelope directly,
and Template 7's RSVP roman-scroll via `_shared/Layer.tsx`'s `case 'scrollVideo':` branch — both
fixed by the one shared edit):

1. The `loadedmetadata` handler is now a named function so cleanup can
   `removeEventListener` it, instead of an inline arrow function nothing could ever reference again.
2. `unlockiOS` no longer calls `video.load()` — `video.play().then(pause)` alone is a
   non-destructive warm-up; `load()` was the only thing resetting `readyState` and re-firing
   `loadedmetadata`.
3. `unlockiOS` now guards on a local `unlocked` flag and explicitly removes *both*
   `touchstart`/`scroll` listeners the first time either fires, since each one's own `{once:true}`
   only deregisters itself, not its sibling.

Verified by `tsc --noEmit` + `next build` (clean) and a manual scroll-test on both consumers — no
automated test exists for this code (or any template/effect code) to extend, so this is manual/build
verification, not test coverage.

**Left deliberately unfixed, flagged for a future pass, not silently dropped:**
- `ScrollVideoLayer.tsx` still duplicates `chromaKey.ts`'s frame-keying math inline instead of
  importing the shared helper the way `PlayOnceVideoLayer.tsx` already does — a real duplication,
  but a refactor, not a bug.
- `Layer.scrub` (persisted, `OVERRIDABLE`, has an Adjust-panel slider) is still a no-op — passed to
  `ScrollTrigger.create()` with no `animation` for GSAP to smooth. Wiring it up for real or removing
  the field/control outright is a 4-file design decision (`types.ts`, `layout.ts`,
  `AdjustPanel.tsx`, both stage-data files), not something to fold into a lifecycle bugfix.

## Issue 4 — Font-preload header outgrew nginx's proxy buffer, took prod down with 502s

**Branch:** `ae-unified` · **Status:** DONE · **Raised:** 2026-09-08 · **Fixed:** 2026-09-08

The `4dafef1` deploy (Template10 + stage-engine desktop fix + BASIC tier rename) caused every
invitation page on production to 502, plus `/template-previews/sunny-safari.png`. Confirmed via
nginx's own error log (Nginx Proxy Manager, `openresty`):

```
upstream sent too big header while reading response header from upstream,
request: "GET /wedding/dk-abdul", upstream: "http://172.19.0.3:3000/wedding/dk-abdul"
```

**Root cause.** `app/layout.tsx` (root layout, wraps every page) applied `CURATED_FONT_VARIABLES`
from `lib/fonts/curated.ts` — the joined class names of **all 19** curated Google fonts — to the
`<body>` className. Every invitation page therefore preloaded the entire curated catalog regardless
of which of the 10 templates it actually used, or how many of those fonts the couple had ever
selected. Measured directly against the container: the invite route's response headers totalled
**4,388 bytes**, driven almost entirely by one `Link: rel=preload` header listing **34 `.woff2`
files** (24 from the curated registry, 5 chrome/marketing fonts declared directly in the root
layout, and 5 more leaking in from Template 8/9's own `next/font` calls via CSS-chunk merging — see
below). Root's own headers, for comparison, were 443 bytes. `4dafef1` added Baloo 2 and Nunito (5
weights each) to the curated registry for Template 10; the header was apparently already close to
nginx's buffer ceiling, and those two families tipped it over.

**Why the missing PNG hit the same error.** `4dafef1` added `'sunny-safari'` to
`scripts/generate-template-previews.mjs`'s hardcoded `CODES` list, but the script — a manual,
Playwright-driven step, not part of `build` or the deploy pipeline — was never re-run, so
`public/template-previews/sunny-safari.png` never existed. A missing two-segment static path falls
through Next's router to the two-segment catch-all `app/[eventType]/[slug]`, whose layout calls
`notFound()` on the bogus `eventType` segment (`"template-previews"`) — and that 404 renders through
the same root layout, carrying the identical oversized header. There is no `app/not-found.tsx`
override in this app, so this is Next's own default not-found component, not a custom one.

**Two things ruled out while investigating, worth remembering for next time:**
- **Removing the className from the root layout alone would not have fixed it.** `next/font`'s
  preload-header generation is driven by *module-graph membership*, not by whether the class is
  applied — the invite page reaches `curated.ts` transitively via
  `page.tsx → DataTemplate.tsx → fontVar`, so the fonts stay in its manifest regardless of where the
  className sits. The lever that actually shrinks the header is each font's own `preload` option.
- **Template 8/9 were contributing fonts to the invite page's header despite no static import path
  from `page.tsx` to either component** — `TemplateWrapper.tsx` (which does import them) is only
  reachable from `(standalone)/organizer-admin/preview`. This was CSS-chunk merging, not a real
  runtime dependency; fixed anyway since T8/T9 are prototypes, not production templates (see
  `CLAUDE.md`'s registry section) and their fonts had no business preloading on every guest view.

**The fix:**
1. **Split `lib/fonts/curated.ts`** into a new `lib/fonts/registry.ts` (pure `{key, label}` metadata
   + the `fontVar()` helper — confirmed to never read `.variable`, so it has zero dependency on
   `next/font/google`) and a slimmed `curated.ts` (only the 19 loader calls + `CURATED_FONT_VARIABLES`,
   imported solely by `app/layout.tsx`). The 7 component call sites that only needed `fontVar`/
   `CURATED_FONTS` (`_shared/Layer.tsx`, `_shared/CurvedText.tsx`, `_shared/DataTemplate.tsx`,
   `_shared/hooks/useAnchors.ts`, `_shared/adjust/AdjustPanel.tsx`, `Template7-romangarden/index.tsx`,
   `Template10-sunnysafari/index.tsx`) now import `registry.ts` instead — this alone stops them
   dragging the font loaders into their importers' module graphs.
2. **Selective `preload`** in `curated.ts`: `preload: true` only on the fonts a shipped template
   defaults to (`cinzel`/`cormorant`/`eb-garamond` for T7, `baloo-2`/`nunito` for T10); `preload:
   false` on the other 14. All already have `display: 'swap'`, so a couple-picked non-default font
   still applies, just via a brief swap instead of an eager download. A `Record<CuratedFontKey,
   {variable}>` map in `curated.ts` makes the registry/loader pairing exhaustive at compile time —
   TypeScript fails the build if either file adds a key the other doesn't have.
3. **`preload: false`** on Template 8's (Fraunces/Work Sans/Caveat) and Template 9's (Source Serif 4)
   own `next/font` calls.
4. **Generated the missing `sunny-safari.png`** and completed `CODES` (`gilded-arch` and
   `engraved-certificate` had PNGs on disk already but were never in the list either).

**Result, measured against a real local production build** (`next build && next start`, `curl -sD -`
against the invite route): **4,388 bytes → 1,792 bytes, 34 files → 12.** `tsc --noEmit` and
`next build` both clean, 30/30 pages.

**Deliberately not done — full server-side per-template font scoping.** Considered and rejected:
`[eventType]/[slug]` is one route serving all 10 templates, and preload is module-graph-driven, so
scoping further would need per-template dynamic imports for marginal gain over the `preload` flag
approach above. Also surfaced while investigating: the authored-template path (`ta*` templates,
`Template.StagesJson`) is currently dead on the public invite route —
`EventDto.TemplateStagesJson` is never assigned by `EventService.MapToDto` — so it needs no handling
here, but is worth knowing if that path is ever wired up.

**Also still open — the nginx buffer itself.** Even with the header now well under any reasonable
limit, Nginx Proxy Manager's proxy host for `theinvit-e.oddstudio.app` has no explicit
`proxy_buffer_size`/`proxy_buffers` override, meaning the platform default is still the only margin
against a future regression. Recommended, not yet applied (requires the NPM admin UI, which isn't
reachable from this environment): Proxy Host → Edit → Advanced → Custom Nginx Configuration —
```
proxy_buffer_size 16k;
proxy_buffers 4 16k;
proxy_busy_buffers_size 32k;
```

## Issue 5 — T7 welcome arch "pops in" late, and template video re-downloads every view

**Branch:** `ae-unified` · **Status:** DONE · **Raised:** 2026-09-09 · **Fixed:** 2026-09-09

User-reported: on the public site, T7's welcome "arch" (a play-once chromakey video, vines growing
up the columns — `kind: 'video'`, see `_shared/effects/PlayOnceVideoLayer.tsx`) takes about a
second to appear, and its late arrival makes the reveal order look broken — the barrier (`order: 1`,
a plain `<img>`) visibly shows up *before* the arch (`order: 0`, meant to reveal first).

**Root cause.** `PlayOnceVideoLayer` draws to a `<canvas>` via chromakey, and nothing is drawn until
`hasDecodedFrame(video)` is true — which requires the browser to have fetched and decoded video data
first. Confirmed against production: `arch_keyed.mp4` is 1.18MB, H.264, already faststart-optimized
(moov atom before mdat, so that wasn't it) — real measured TTFB 0.21s / full download 0.97s, right in
line with the reported lag. Meanwhile the layer's own CSS entrance animation (the shared
`--sl-delay = 0.35 + order*0.22s` stagger every layer uses) fires **on schedule regardless of the
canvas's contents** — so the arch's box animates into its revealed position on time, empty, and the
real content only shows up whenever the video happens to finish decoding. The component's own doc
comment already described the intended behavior ("holds on frame one" immediately) and even had a
`showFirstFrame()` function reaching for it — but that function is itself gated on
`video.readyState >= 1`, which still requires a network round-trip; there was no independent
fallback. The original static `arch.webp` this layer used before being converted to video was still
sitting on disk, entirely unused.

**The fix — `Layer.posterSrc`** (`types.ts`, added to `layout.ts`'s `OVERRIDABLE`, resolved in
`Layer.tsx` the same way `videoSrc` already is): a static image `PlayOnceVideoLayer` draws onto the
canvas immediately on mount, independent of the video's own load state. A `hasRealFrameRef` guard
means a real decoded video frame — if it somehow arrives before the poster image does — is never
clobbered by an even-slower poster landing after it. T7's `arch` layer now sets
`posterSrc: 'welcome/arch.webp'`. The two assets aren't pixel-identical (the video's crop is
slightly larger to fit the vines growing outward — already documented in the stage-data comment,
`w: 99` vs `92`), so there's a sub-second, barely-visible stretch during the swap; not worth solving
for a transient placeholder.

**Verified with a real browser** (Playwright), not just by reasoning about the code: intercepted and
delayed only the video request by 3s, sampled canvas pixel alpha at intervals. **Before the video
had loaded at all** (`video.readyState === 0`, `HAVE_NOTHING`): canvas already **32% painted** via
the poster. After the video's artificial delay elapsed (`readyState === 4`): the real keyed frame
had taken over. `tsc --noEmit` + `next build` both clean, 30/30 pages.

**Second, smaller fix — Cache-Control on `/templates/*`.** Every asset under `public/templates/`
(all template art + video) was served with Next's default `public, max-age=0` — every single page
view, including repeat visits, forces a revalidation round-trip. Added a `headers()` rule in
`next.config.ts` for `/templates/:path*`: `public, max-age=86400, stale-while-revalidate=604800`.
Deliberately **not** `immutable` + a long max-age — these filenames aren't content-hashed the way
`_next/static/*` chunks are, and one of them has already been overwritten in place by a fix before
(the RSVP scroll video re-encode, Issue 3's "actual RS bug" note) — `immutable` would let a browser
skip revalidating entirely and keep serving a since-fixed asset indefinitely. This helps repeat
views (a couple re-checking their own invite, a guest re-opening the link) — it does **not** help a
true first-time visitor, who has nothing cached either way; the poster-frame fix above is what
actually fixes the first-view experience.

**Not addressed here, potentially the same underlying gap:** `ScrollVideoLayer.tsx` (the RSVP
roman-scroll, `kind: 'scrollVideo'`) has no equivalent poster mechanism either — it's scroll-gated
rather than load-gated so the failure mode is different (a blank canvas only if a guest scrolls to
it before the video's decoded, not an out-of-order reveal), but worth the same fix if it's ever
reported as a problem.

## Issue 6 — T7 `arch`/`fountain` reveal out of sync (stray `order` overrides), + poster now editable

**Branch:** `ae-unified` · **Status:** PARTIAL — code done, live data fix pending · **Raised/Fixed
(code):** 2026-09-09

Two follow-ups from Issue 5, reported after that fix shipped.

**1. "Fountain doesn't animate, loads instantly."** Verified false as literally stated — measured
directly against production (`ihsan-and-aimi`, a real couple's live invite) with repeated samples
over ~3.6s: `fountain`'s opacity genuinely ramps `0.00 → 0.54 → 0.95 → 1.00` with a matching
`translateY` easing to `none`, a real, working rise animation, not an instant pop-in. Same
confirmed for `arch`/`barrier`.

**What's actually wrong: reveal *timing*, not the reveal mechanism.** Direct DB inspection found
`arch` and `fountain` — on **both** the local test event (`helyana-and-heiry`) and this **real
production event** — carry a persisted `order` override one higher than their shipped default
(`arch`: 0→1, `fountain`: 2→3). `order` drives the entrance stagger
(`--sl-delay = 0.35 + order*0.22s`), so `arch` now reveals at the exact same moment as `barrier`
(both resolve to 0.57s) instead of alone, first — and `fountain` ties with `column` (both 1.01s)
instead of preceding it. Individually invisible (each layer still animates correctly), the *relative
sequence* — the actual design intent — is what's broken.

**Root cause of the corruption: not found.** Checked every code path that legitimately writes
`order`: `Layer.tsx`'s drag-move/resize (`onDragMove`) patches only `x`/`y`/`w`/`h` — never `order`
or `z`. `AdjustPanel.tsx`'s z-stack drag-reorder (`reorder`/`restack`) patches only `z` — confirmed
by reading the function, never `order`. The only legitimate way to change it is the explicit "Phase"
slider (`AdjustPanel.tsx`, bound directly to `current.order`) — a real, intentional control. That
the *same two specific layers* are affected on two independent databases suggests something
systematic rather than two separate manual slider mistakes, but no live-reproducible bug was found
in the time spent — flagged as unresolved, not as "confirmed harmless."

**Fix, code-only so far:** none needed for the reveal system itself (verified correct). **The data
fix is blocked pending the operator** — direct SQL against the production DB requires a permission
grant this session doesn't have, and there's no API path either (`PUT /api/template-config/event/{id}`
needs a `SUPER_ADMIN` session this environment doesn't hold). A backup was taken
(`wedding.db.bak-preOrderFix-20260909013229` on the VPS) before the attempt was blocked; nothing was
changed. Three ways to actually apply it: (a) through the Adjust Editor UI itself — select `arch`,
set Phase back to 0, select `fountain`, set Phase back to 2 (the real, verifiable save path); (b) a
direct `sqlite3 UPDATE` on `TemplateConfigs` for `EventId=8`, `t7.layout.mobile.welcome`, dropping
just the two `order` keys and keeping every other saved edit; (c) grant the running session a
permission rule to do (b) directly.

**2. "The fallback should show up in the AE, so I can adjust the animation and timing."** A real
gap, not a misunderstanding — `posterSrc` (Issue 5) had no UI control at all; a video layer's poster
could only be set by hand-editing `data/stages.ts`. Added a **Poster Image** row to the
`isPlayOnceVideo` section of `AdjustPanel.tsx` ("Set poster image" / "Replace poster" / "Remove
poster"), reusing the existing `onUploadImage`/`photoService.upload` path unchanged — no backend
widening needed, since (unlike a video-replace, which is still blocked on the image-only upload
validator) a poster genuinely *is* an image. "Remove poster" patches `posterSrc: undefined`, which —
same mechanism as every other per-layer override in this engine — drops the key entirely on
serialize (`JSON.stringify` omits `undefined`), so it reverts to whatever the shipped stage data
declares rather than forcing "no poster." The layer's existing **Play Delay** and chroma sliders
already covered "timing"; poster image was the only missing control. `tsc --noEmit` clean, `next
build` clean, 30/30 pages.

### Update — the real cause, found: reveal races a warm cache

**Status now: FIXED.** After the above shipped, the user reported the precise, reproducible
pattern that cracked it: **hard reload (empty cache) → arch and fountain rise perfectly. Normal
reload → both snap in instantly, no animation.** Reproduced directly against production with
repeated sampling: a cold first load ramps `fountain`'s opacity smoothly
(`0.00 → 0.29 → 0.80 → 0.98 → 1.00` over ~2s); a second `goto()` in the *same browser context*
(everything served from cache) shows `1.00` already on the very first sample taken 300ms after
navigation — the transition never visibly ran at all.

**Root cause:** `useStageReveal.ts`'s `IntersectionObserver` callback calls `setSeen(...)`
synchronously the moment a stage is confirmedly on-screen, which flips `data-seen="true"` and
triggers the CSS transition to the revealed state (`reveal.css`). CSS transitions only animate
when the browser has actually **painted** the "from" state at least once before the "to" state is
applied — if both happen within the same paint cycle, there's nothing to interpolate from and the
element simply appears in its final state. On a cold load, real network/decode delay for images,
fonts, and JS naturally spaces the initial mount (painted with the pre-reveal `opacity:0` state)
and the observer's first callback far enough apart that a paint always lands in between — so this
bug was invisible under every condition tested while building Issue 5's fix. On a warm/cached
reload there's no such delay: the observer's very first callback (IntersectionObserver fires
"already intersecting" targets almost immediately on `.observe()`) can land in the *same* frame as
the initial mount, so the pre-reveal state is never painted and the transition is skipped entirely.

**First attempt, shipped then found insufficient:** deferred the `setSeen` flip by two animation
frames (`requestAnimationFrame(() => requestAnimationFrame(() => setSeen(...)))`) — the standard
idiom for guaranteeing a real paint of the "from" state before a transition-triggering change.
Verified locally (three loads in one browser context, all showed the correct gradual ramp) and
**deployed** — but a follow-up local test that added realistic network latency (no bandwidth
throttle, just RTT, closer to the real gap between the VPS and a real visitor) reproduced the
*exact same instant-snap bug* even with this fix live. Re-checked directly against production after
that deploy and confirmed it: still broken. `requestAnimationFrame` only guarantees callback
*ordering* relative to paint scheduling — it doesn't guarantee a paint actually happens if nothing
forces the browser to consider one necessary in between, and evidently two frames' worth of that
guarantee isn't the actual bottleneck here.

**What the real bottleneck turned out to be**, found by testing progressively larger explicit
delays until the bug reliably disappeared: the public invite page is a client component that
fetches its event/config data in a `useEffect` — on a cold load, that fetch (plus decoding
images/fonts) naturally takes real time, during which a loading placeholder is shown; the actual
Stage/Layer tree doesn't exist yet, so by the time it *does* mount, real wall-clock time has already
passed. On a fully warm/cached reload that whole sequence can resolve fast enough to stop providing
that natural gap — but not because of a missing single paint; something on a busier/quieter main
thread (most likely React settling the freshly-mounted tree together with other pending work) needs
noticeably more than a couple of frames to actually separate. `setTimeout(..., 50)` — comfortably
more than enough time for a paint under normal assumptions — still reproduced the bug in the
latency-added test. `setTimeout(..., 500)` did not, across 4 repeated warm reloads.

**The actual fix**: replaced the double-rAF with a flat `setTimeout(fn, 500)` deferring the
`setSeen` flip. Cost is the same on every load — this only delays when `data-seen` is *allowed* to
flip, not the reveal's own `--sl-delay`/`--sl-dur` timing once it does; a cold load's natural
network/decode gap is usually already bigger than 500ms, so warm reloads end up matching the cold
experience rather than lagging it. **Verified**: 4 repeated warm reloads locally, all showing a real
gradual opacity ramp (not an instant jump to 1) — see `docs/FIX_QUEUE.md` git history for the exact
before/after sample data if needed. Deployed 2026-09-09 (superseding the double-rAF commit from
earlier the same day, which is why two separate commits reference this issue).

Also fixed as a byproduct of this investigation: the local test event's own `order`/`playDelaySec`
corruption (see the section above) was stripped locally to get a clean signal for testing — the
**production** event's corruption is still unfixed, same blocked/pending status as above.

This is template-neutral (`useStageReveal` is shared by the whole engine, not T7-specific) and
almost certainly explains a class of "the reveal looks broken sometimes" reports that would have
been very hard to pin down without the user's own before/after A-B observation — cache state was
never a variable anyone had reason to suspect for a CSS entrance animation. Deployed 2026-09-09.

### Follow-up — poster-image discoverability (feature, not a bug)

The poster control from earlier in this issue had two real gaps once the user actually went looking
for it: no way to see what image was currently set without loading the live page, and no protection
against setting a poster that doesn't match the video's actual first frame (which would show as a
visible flash/pop the moment the real video frame replaces it).

- **Thumbnail preview** — the current `posterSrc`, if any, now renders as an actual image in the
  panel (on a checkerboard background, so real transparency is visible rather than looking like a
  flat color) instead of only being knowable by loading the live page.
- **"Capture from video"** — loads the video off-DOM, seeks to frame 0, runs it through the exact
  same `drawKeyedFrame` chroma-key math the live render uses (with the layer's own
  threshold/fade), exports the result as a transparent PNG, and uploads it as the poster —
  structurally can't drift out of sync with the video since it *is* a frame of the video. Preferred
  over manual upload (moved to a secondary/ghost button) since it removes the "go find/export a
  matching still frame by hand" step entirely.
- **Plumbing**: `TemplateEngine.assetRoot` (`_shared/registry.ts`) exposes each template's public
  asset path prefix (e.g. `/templates/t7`) through to `AdjustPanel`, which lives in the parent tree
  outside the preview iframe and had no way to resolve a real video URL before this.

Verified: `tsc --noEmit` + `next build` clean, 30/30 pages. The capture mechanism itself was tested
standalone against the real `arch_keyed.mp4` (not just read for correctness) — produced a correctly
transparent PNG, pixel-accurate to the video's actual first frame.
