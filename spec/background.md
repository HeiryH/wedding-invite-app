# Background spec — rose-horizon flow background

Part of **Gate 2**. `spec/sections/*.md` carry only a one-line `Background:` phrase, which is
all `assets.json`/`scene.json` can express. That is not sufficient to specify this asset, so
this document is the background's actual specification and must be approved alongside the
section specs.

## One asset, shared by the whole template — not one per section

**This is the single most important fact about this file.** There is exactly one background
image for this entire template: `frontend/public/templates/rose-horizon/bg/flow.webp`. Every
section reads the same file.

The per-section copies living at `docs/rose-horizon-art/<section>/background.png` are **not**
six separate assets — they're the same file, copied six times, purely because `ingest-art.py`
expects a `background.png` inside each section's own input directory to run its diff-locator.
That's plumbing for a tool with a per-section input contract, not a statement about how many
backgrounds this template has. If those directories are ever confusing on that point, the fix
is a symlink or a documented convention, not six independently-varying images.

## Why this document exists (pipeline gap — fold-back candidate)

`assets.schema.json` gives each section a `background` string described as "the confirmed
background SCENE description… what's in frame and roughly how it's composed". That assumes the
Stage-family production model: one generated plate per section, composed against one known
screen box, consumed once by `assemble`.

This template's background is a different *kind* of artifact:

- it is **one asset shared by all six sections**, not six plates;
- it **tiles**, so it has a seam contract no section-scoped description can state;
- it **moves** relative to content, so it has a motion contract;
- text renders over it at unpredictable scroll offsets, so it has a **legibility contract**.

None of those four properties fit in a scene sentence. Recorded as a proposed schema change,
not worked around silently.

## Layer ownership — non-negotiable

| Layer | Owns | Parallax rate |
|---|---|---|
| **Background** (this document) | the abstract wash, and nothing else | slowest — see Motion |
| **Section content panel** | real DOM: names, dates, forms, wish list, etc. | mid |
| **Prop layer** (`spec/assets.json`) | every rose, sprig, bird, arch and icon | fastest |

No element may appear in more than one layer. An earlier draft of this run put roses in the
background *and* listed roses as props, which would have drawn them twice and layered them on
each other — the exact failure `spec/scene.json` was introduced on 2026-09-04 to prevent
(`welcome-bg.png` redrawing the reference's own monkeys while the same monkeys were generated
again as isolated props). The scene contract's geometry vocabulary is Stage-only; its
*principle* — decide once which layer owns each element — is family-independent.

## Production method: the real Recraft render, not the procedural fallback

**Current status: the committed asset is `00-background.md`'s Recraft output**, approved and
in place at `frontend/public/templates/rose-horizon/bg/flow.webp` (1024×2048, RGB, ~390KB).

This wasn't the first attempt. Six earlier Recraft calls against ad-hoc prompts (not a written,
approved spec) failed — see `docs/rose-horizon-art/flowbg-*` for the discarded outputs — so a
**procedural** generator (`tools-flowbg/flowbg.py`, FFT-periodic noise) was built as a
same-session substitute: exactly tileable by construction, low-contrast by construction, zero
credits. It worked technically (seam delta 0.046 vs interior 0.057, luminance spread 50/255)
but was rejected: a bespoke one-off generation mechanism invented mid-run isn't a pipeline
artifact, and it skipped the actual approval step (`section-spec`/Gate 2) that exists precisely
so nothing gets produced before a human signs off on a written spec. The corrected path was to
write `00-background.md` as a real, renderable spec — same folder and format as every other
section spec — and render it in Recraft like everything else. That render is what's committed.

`tools-flowbg/flowbg.py` and its acceptance-test discipline (below) are kept as a **documented
fallback**, not deleted: if a future template's background is abstract/constraint-defined
rather than depictive, procedural generation is a legitimate choice — but it has to be proposed
and approved as a pipeline option, not substituted unilaterally for a spec-and-render step that
already exists.

## Visual specification (as rendered)

- **Band orientation: vertical**, running along the reader's own swipe/scroll axis.
- **Band form: undulating**, not straight parallel lines — matches `00-background.md`'s prompt.
- **Palette** — bound to `spec/style.json`: blues (`#7ca3c0`/`#9cc8d3`) with cream (`#faebcc`)
  highlight bands, no other hues.
- **Tone**: even across the tile, no dominant focal point — verified by eye against the
  legibility contract below (no code-side luminance measurement on a Recraft render; that
  measurement only applies to the procedural fallback).

## Geometry — mirror-stacked, not `background-repeat`

- Tile: **1024 × 2048**, at `frontend/public/templates/rose-horizon/bg/flow.webp`.
- **Tiling mechanism: mirror stacking, implemented in `_shared/FlowBackground.tsx`.** Not CSS
  `background-repeat: repeat-y`. That property requires the tile's own top row to match its
  bottom row *in the same orientation* — a real constraint this render doesn't cleanly satisfy
  (see "Seam — resolved" below). Instead, real `<img>` copies are stacked with **every other
  one vertically flipped**. Copy N's bottom edge meets copy N+1's top edge, which after the
  flip *is the same row* — pixel-identical by construction, regardless of whether the tile's
  two ends ever matched each other. Every join is a mirror reflection, not a repeat, so there
  is nothing to seam-check. (CSS has no mirror-repeat keyword, which is why this needs real
  stacked elements rather than a `background-image`.)
- **Height-reactive, not a fixed guess.** `FlowBackground` measures
  `document.documentElement.scrollHeight` via `ResizeObserver` and computes how many tiles are
  needed to cover the viewport across the full parallax range, recomputing whenever content
  height changes (data loading, font swaps, viewport resize). No template-specific height
  assumption is baked in anywhere.
- A `position: fixed` viewport-clipping wrapper crops the stack to the visible screen; the
  stack itself is translated by the parallax scroll listener (see Motion).

## Seam — resolved, not by fixing the image

Measured on the raw tile: wrap delta 11.28 vs interior row delta 3.72 (3.03× — a real tone
step, confirmed by eye on close inspection). Original plan was a post-process feather. **Moot
under mirror-stacking**: that fix targets `repeat-y`'s failure mode (row 0 must equal row H-1),
which mirror-stacking never depends on in the first place. The art file is used exactly as
rendered, unedited.

## Motion — three-tier parallax, "floating over the background"

Three layers move at three different fractions of scroll, so nearer content visibly drifts
faster than what's behind it — the standard depth cue, and the direct answer to "it should seem
like it's floating over the background":

| Layer | Rate (× page scroll) | Notes |
|---|---|---|
| Background wash | **0.30×** | slowest — reads as far away |
| Section content panel | **0.70×** | the translucent card holding real DOM text/forms |
| Decorative props (roses, icons, etc.) | **1.05×** | fastest — nearest, and *faster* than 1.0 so it reads as foreground, not just unparallaxed |

All three numbers are **proposed, unverified on a real device**. Background motion is
implemented (`_shared/FlowBackground.tsx`, its own passive scroll listener writing
`--flowbg-y`, the same single-listener/rAF-coalesced pattern `useParallax.ts` already uses
elsewhere); the panel and prop tiers are not wired up yet (that's `assemble`'s job — panel and
prop layers need to exist first). `FlowBackground` honours `prefers-reduced-motion` itself
(CSS media query holds `--flowbg-y` at its initial value); the panel/prop tiers must do the
same when built.

## Legibility contract

Text does **not** render directly on the wash. Each section's content sits on a translucent
panel above it (see Motion, mid tier), so legibility never depends on which part of the tile
happens to be behind it at a given scroll offset. This is why `empty_band_pct` is not used for
this background — that field assumes a plate composed against one known screen box with a fixed
reserved zone, which cannot transfer to a tile repeating behind content at an arbitrary offset.

## Acceptance tests — procedural fallback only

The table below applies **only if** `tools-flowbg/flowbg.py` is used again for some future
background. It does not apply to the current committed asset (a Recraft render, approved
visually at Gate 2, not code-generated).

| # | Test | Threshold |
|---|---|---|
| 1 | Seam: mean per-channel abs diff between last row and first row, vs mean adjacent-row diff | **N/A under mirror-stacking** — see below |
| 2 | Luminance spread across the tile | ≤ 60 / 255 |
| 3 | Subject present | none |
| 4 | Colours outside the declared palette ramp | none |

Test 1 was written for `background-repeat`, which needs row `H-1` to equal row `0`. Under
mirror-stacking (the tiling mechanism actually in use — see Geometry) that requirement doesn't
exist: every join is a same-row reflection, correct regardless of what the tile's own two ends
look like. Kept in this table only for a future template that uses plain `repeat-y`.

## Open questions for the human

1. ~~Seam on the Recraft render is unverified.~~ **Resolved twice over**: pattern continuity
   across the join is good (wavy bands land at matching horizontal positions), and the
   remaining tone-step is moot anyway — mirror-stacking (`_shared/FlowBackground.tsx`) doesn't
   depend on the tile's two ends matching at all. No image fix needed.
2. **The three parallax rates (0.30 / 0.70 / 1.05) are proposed, not verified** on a real
   device. Background's rate is wired (`FlowBackground`'s `parallaxRate` prop); panel/prop
   tiers are `assemble`'s job.
3. ~~Is one shared background right for all six sections?~~ **Resolved: yes** — confirmed by
   the human this session. One asset, no per-section variation.
4. ~~Should this use CSS `background-repeat` or JS-stacked tiles?~~ **Resolved: JS-stacked,
   mirror-flipped, height-reactive** — confirmed by the human this session, implemented in
   `_shared/FlowBackground.tsx`.
