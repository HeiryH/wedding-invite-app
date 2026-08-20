# Fix Queue

A running list of known problems and the work each one needs. Newest issues get appended at the
bottom. Each issue is self-contained: the plain-English problem, the decision, then the checklist.

Status legend: `[ ]` todo · `[x]` done · `[~]` in progress · `[-]` deliberately skipped

---

## Issue 1 — Template art falls apart on odd-shaped screens

**Branch:** `ae-unified` · **Status:** DONE for **mobile** (A–F); desktop deferred (see below) · **Raised:** 2026-08-19

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

### Deferred — desktop has the same drift, unfixed

Measured at 1440×900 → 1280×1024 with no canvas active (i.e. today's shipped behaviour): art
scales 0.875–0.889 while slot content scales 1.138. That is the *same* width-vs-height split this
issue is about, present on desktop and **not addressed** by this pass. Fixing it means adding a
`desktop` reference aspect per stage and retuning each desktop composition against it — a separate
piece of work, and lower value since desktop aspect ratios vary far less than phone ones.

### Known limitation — landscape

At 844×390 the canvas is width-driven, so art sizes come out **identical to the old behaviour**
(`arch` 1069px either way) — the canvas neither fixes nor worsens the scale. What changes is that
the composition is now *cropped* (you see the middle of a correctly-composed scene, `stairs` fall
below the fold) rather than *squashed*. A portrait-composed full-screen invitation is degenerate in
landscape regardless. If it ever matters, the fix is a clamped cover scale or a landscape-specific
reference aspect — deliberately **not** attempted here.

---

## Issue 2 — *(to be added)*
