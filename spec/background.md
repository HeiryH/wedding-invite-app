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

## Geometry

- Tile: **1024 × 2048**, at `frontend/public/templates/rose-horizon/bg/flow.webp`.
- Repeats on the **vertical axis** (`background-repeat: repeat-y`).
- Rendered on a `position: fixed` full-viewport layer beneath all content, so no page-height
  measurement is needed and content length is irrelevant.
- **Seam not yet numerically verified on the Recraft render** — the procedural version's seam
  math doesn't apply to a human-rendered asset. Visual check pending before `assemble` treats
  this as final; if the seam is visible, mirror-tiling this exact render is the fix (pixel-
  perfect by construction) at the cost of visible bilateral symmetry.

## Motion — three-tier parallax, "floating over the background"

Three layers move at three different fractions of scroll, so nearer content visibly drifts
faster than what's behind it — the standard depth cue, and the direct answer to "it should seem
like it's floating over the background":

| Layer | Rate (× page scroll) | Notes |
|---|---|---|
| Background wash | **0.30×** | slowest — reads as far away |
| Section content panel | **0.70×** | the translucent card holding real DOM text/forms |
| Decorative props (roses, icons, etc.) | **1.05×** | fastest — nearest, and *faster* than 1.0 so it reads as foreground, not just unparallaxed |

All three numbers are **proposed, unverified on a real device** — same status the single
background rate had before. Implementation is one passive scroll listener writing three CSS
custom properties (`--bg-par`, `--panel-par`, `--prop-par`), the same pattern
`_shared/hooks/useParallax.ts` already uses elsewhere in this codebase; `background-position-y`
reads the first, each section panel's transform reads the second, each prop layer's transform
reads the third. Must honour `prefers-reduced-motion`: hold all three static when set.

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
| 1 | Seam: mean per-channel abs diff between last row and first row, vs mean adjacent-row diff | seam ≤ 1.5 × interior |
| 2 | Luminance spread across the tile | ≤ 60 / 255 |
| 3 | Subject present | none |
| 4 | Colours outside the declared palette ramp | none |

Test 1's form matters: it does **not** require the last row to *equal* the first row. In a
correctly periodic tile, row `H-1` is one step before row `0`, so the right question is whether
the wrap step is indistinguishable from any other row step. A test demanding equality would
reject a correct tile and accept a flat one.

## Open questions for the human

1. ~~Seam on the Recraft render is unverified.~~ **Checked**: pattern continuity across the
   join is good — the wavy bands land at matching horizontal positions, per
   `00-background.md`'s instruction. But there's a real, measurable brightness/tone step right
   at the seam (wrap delta 11.28 vs interior row delta 3.72, a 3.03× ratio — well above the
   "indistinguishable" bar of 1.5×), visible as a faint horizontal line on close inspection even
   though it's easy to miss at a glance. **Needs a decision**: accept as-is (may be unnoticeable
   once parallax-scrolled behind translucent content panels), fix with a cheap post-process
   feather across a thin band at the join (pattern already matches, only tone needs smoothing —
   a much smaller fix than the earlier failed crossfade attempts, which had to fix real content
   mismatches), or regenerate.
2. **The three parallax rates (0.30 / 0.70 / 1.05) are proposed, not verified** on a real
   device.
3. ~~Is one shared background right for all six sections?~~ **Resolved: yes** — confirmed by
   the human this session. One asset, no per-section variation.
