# Background spec — rose-horizon flow background

Part of **Gate 2**. `spec/sections/*.md` carry only a one-line `Background:` phrase, which is
all `assets.json`/`scene.json` can express. That is not sufficient to specify this asset, so
this document is the background's actual specification and must be approved alongside the
section specs.

## Why this document exists (pipeline gap — fold-back candidate)

`assets.schema.json` gives each section a `background` string described as "the confirmed
background SCENE description… what's in frame and roughly how it's composed". That assumes the
Stage-family production model: one generated plate per section, composed against one known
screen box, consumed once by `assemble`.

This template's background is a different *kind* of artifact:

- it is **one asset shared by all six sections**, not six plates;
- it **tiles**, so it has a seam contract no section-scoped description can state;
- it **moves** relative to content, so it has a motion contract;
- text renders over it at unpredictable scroll offsets, so it has a **legibility contract**;
- it is **produced by code**, not by a generation call, which the schema cannot express at all.

None of those five properties fit in a scene sentence. Recorded as a proposed schema change,
not worked around silently.

## Layer ownership — non-negotiable

| Layer | Owns |
|---|---|
| **Background** (this document) | the abstract wash, and nothing else |
| **Prop layer** (`spec/assets.json`) | every rose, sprig, bird, arch and icon |

No element may appear in both. An earlier draft of this run put roses in the background *and*
listed roses as props, which would have drawn them twice and layered them on each other — the
exact failure `spec/scene.json` was introduced on 2026-09-04 to prevent (`welcome-bg.png`
redrawing the reference's own monkeys while the same monkeys were generated again as isolated
props). The scene contract's geometry vocabulary is Stage-only; its *principle* — decide once
which layer owns each element — is family-independent.

## Production method: procedural, not generated

Generator: `tools-flowbg/flowbg.py`. Run with `~/.hermes/scripts/rembg-venv/bin/python`
(numpy + Pillow; the system Python has neither).

The asset must hold three properties **simultaneously**:

1. exactly tileable on the vertical axis,
2. low-contrast enough that text stays legible over any part of it at any scroll offset,
3. no subject — no figure, no object, no horizon.

Six Recraft attempts could not hold all three at once (see `docs/rose-horizon-art/` for the
discarded outputs). The failures were not random: prompts that requested *empty* space were
filled with a human figure by the bound custom style, whose reference is a portrait of a
couple; prompts that gave the model concrete content to draw complied, but then had busy
content sitting on the seam. Code holds all three by construction, costs nothing per
iteration, and is re-tunable without a credit.

**Accepted tradeoff:** this is not the reference's hand. It carries none of the gouache
brush-grain or painterly character of the source illustration — it is a smooth mathematical
wash that is merely in the correct colours. The reference's actual style is carried entirely
by the prop layer. If the background itself must look hand-painted, this decision has to be
revisited, and mirror-tiling a generated plate is the fallback (pixel-perfect seam by
construction, at the cost of visible bilateral symmetry).

### How seamlessness is achieved

Noise is built in the frequency domain: an inverse FFT of a low-passed random spectrum is
periodic in both axes by definition, so the tile wraps exactly rather than approximately. The
domain warp that makes the bands undulate is sampled with **wraparound indexing**; a warp that
clamped or reflected at the edges would destroy the guarantee the FFT provides.

## Visual specification

- **Band orientation: vertical**, running along the reader's own swipe/scroll axis. (Horizontal
  was built first and rejected — vertical follows the gesture.)
- **Band form: undulating**, not straight parallel lines. Lateral displacement combines two slow
  sine periods (3 and 7 cycles over the tile height, ±46px and ±18px) with low-frequency noise
  (±150px) so the rhythm reads organic rather than mechanical.
- **Palette** — bound to `spec/style.json`, no free colours:
  - ramp base: `#7ca3c0` (mid cornflower-blue) → `#9cc8d3` (pale powder-blue)
  - mist highlight: `#c7ddd7` (hazy dusty blue-grey), max 45% mix in the upper tonal range
  - warm bloom: `#faebcc` (warm ivory cream), max 14% mix, so it does not read as a flat blue slab
- **Grain**: ±4.5/255, standing in for the medium's brush-grain.
- **Tone**: even across the whole tile. No focal point, no dark masses, no bright hotspots.

## Geometry

- Tile: **1024 × 2048**, exported to `frontend/public/templates/rose-horizon/bg/flow.webp`
  (quality 88, currently 17KB).
- Repeats on the **vertical axis** (`background-repeat: repeat-y`). The tile is periodic on
  *both* axes as a side effect of the FFT construction, so it is also safe at any viewport width.
- Rendered on a `position: fixed` full-viewport layer beneath all content, so no page-height
  measurement is needed and content length is irrelevant.

## Motion

- `background-position-y` is driven by scroll at a **fraction** of the page's own scroll rate,
  producing the parallax drift. Same mechanism `_shared/hooks/useParallax.ts` already uses
  (one passive scroll listener writing a CSS custom property).
- **Proposed rate: 0.35× page scroll. UNVERIFIED** — needs a real-device check, not a desktop
  browser check.
- Must honour `prefers-reduced-motion`: hold the background static when set.

## Legibility contract

Text does **not** render directly on the wash. Each section's content sits on a translucent
panel above it, so legibility never depends on which part of the tile happens to be behind it
at a given scroll offset. This is why `empty_band_pct` is not used for this background — that
field assumes a plate composed against one known screen box with a fixed reserved zone, which
cannot transfer to a tile repeating behind content at an arbitrary offset.

The wash must nonetheless stay quiet enough that the panel reads cleanly against it:
**luminance spread ≤ 60 of 255.**

## Acceptance tests — mechanical, must pass before the asset is committed

The generator prints all of these on every run.

| # | Test | Threshold | Measured |
|---|---|---|---|
| 1 | Seam: mean per-channel abs diff between last row and first row, vs mean adjacent-row diff | seam ≤ 1.5 × interior | 0.046 vs 0.057 — **pass** |
| 2 | Luminance spread across the tile | ≤ 60 / 255 | 50 — **pass** |
| 3 | Subject present | none | none, by construction — **pass** |
| 4 | Colours outside the declared palette ramp | none | none, by construction — **pass** |

Test 1 is the meaningful one and its form matters: it does **not** require the last row to
*equal* the first row. In a correctly periodic tile, row `H-1` is one step before row `0`, so
the right question is whether the wrap step is indistinguishable from any other row step. A
test demanding equality would reject a correct tile and accept a flat one.

## Open questions for the human

1. **Parallax rate 0.35 is a guess** and unverified on a real device.
2. **The wash has none of the reference's hand.** Acceptable if the prop layer carries the
   style, per the tradeoff above — but it is a deliberate loss, not an oversight, and it should
   be an explicit decision rather than a default.
3. **Is one shared background right for all six sections**, or should tonal variation drift
   across the page (e.g. cooler at the top, warmer by the photobooth)? Currently uniform.
