# Sandy Beach probe — local ComfyUI (FLUX.2 klein 4B) render for the e-invite pipeline — RETIRED

> **Outcome (2026-09-20):** the backend was ditched the same day — machine ran hot, macOS killed Comfy
> under swap pressure, and the art quality was not good enough. Comfy and its models are deleted. This
> folder is kept as the written-up experiment; the approved *specs* (style/assets/scene, welcome
> section-spec) and the welcome art the user liked remain valid inputs for any future renderer.

2026-09-20. Not a template slot; a probe proving the free local backend can render a section from the
pipeline's own specs. Inputs: `refs/reference-01.jpg` (Pinterest, human-supplied), `spec/style.json`
(palette sampled in code, key derived in code), `spec/{assets,scene}.json` (welcome only, validated),
`spec/sections/01-welcome.md` (the locked render spec — used verbatim as the prompt).

Renders: `welcome/design-seed{1..4}.png` 1024×1696, ~120–130 s each, `welcome/_evidence/render-log.json`.
Workflow: `~/.hermes/scripts/comfy-triad/workflows/design.json` (euler, 4 steps, CFG 1, reference via
`ReferenceLatent`). Driver: `render-one.mjs`.

## Findings (2026-09-20)

1. **Reference image copies composition.** `ReferenceLatent` is klein's *edit* input, so a full-frame
   reference reproduced the Pinterest scene (design-seed1..4). Same finding as
   `docs/invite-pipeline.md` 2026-09-03/04. Rule: scene renders take NO reference; `style.json` →
   `stylelock.mjs` text alone carried medium + palette (noref-seed4/5, gguf-seed4/5) and renders 40%
   faster (~75 s vs ~125 s).
2. **fp8 safetensors do not run on MPS** (`Trying to convert Float8_e4m3fn to the MPS backend`).
3. **RAM.** bf16 DiT + fp8-mixed TE: peak 21.5 GB used, swap grew 9→12.5 GB, 9 pressure warnings
   (`welcome/_evidence/ram-probe.log`). **GGUF Q8 DiT + Q8 TE: peak 19.9 GB, swap flat, 0 warnings**
   (`welcome/_evidence/ram-probe-gguf.log`), identical output for the same seed (`welcome/_evidence/contact-gguf.jpg`).
   Q8 is locked in (`~/.hermes/scripts/comfy-triad/models.lock.json`, `workflows/design.json`);
   bf16/fp8 files deleted. Remaining headroom levers: Q6_K TE (−1 GB), closing other apps.
4. Text in the design is garbled (4B distilled, 4 steps) — representative only.

Human pick: seed 4 family is the usable composition (arch as frame, corridor clear, props separable).

## Triad complete for `welcome` (2026-09-20, from gguf-seed4 = `design.png`)

| Contract file | Produced by | Result |
|---|---|---|
| `design.png` | `render-one.mjs` (klein Q8, no ref) | chosen seed 4 |
| `props/NN-<prop>.png` + `props/atlas.png` + `props/manifest.json` | `extract-props.py` — SAM3.1 text-prompted masks per confirmed prop name, cut from the design's own pixels | 5/5 matched, 1 component each, bbox + pct placement recorded. Flaw: sky slivers between garland flowers on the arch top → Affinity checkpoint |
| `background.png` (+ `-mask.png`, `-textmask.png`, `-textboxes.json`, `-check.jpg`) | `background-plate.py` — mask = prop masks ∪ **macOS Vision OCR** text boxes, grown 28 px; klein inpaints only inside (`SetLatentNoiseMask`), original pixels composited back outside | text + props gone, scenery continued, **0 px differ outside mask**. Flaw: small bird-like squiggle where the cloud was |

Findings: SAM3 "text" only detects the large names line (0.3% of canvas) — small copy is below its scale, and
an ink-luminance heuristic grabbed wave strokes instead. Vision OCR (`VNRecognizeTextRequest`, offline,
pyobjc in `rembg-venv`) found all 5 lines at confidence 1.0 with no false positives; it is now the text
detector. Each triad step ≈ 70 s; SAM3 (1.75 GB) never sits in memory with the DiT.
`props/manifest.json` `pct` = measured placement off the design, i.e. what `assemble` reads.

## Defect analysis + regeneration of props (2026-09-20)

`lint-props.py` (deterministic, writes `defects[]` into `manifest.json`, draws `atlas-lint.png`):
arch → `bleed:25%` (garland slivers, confirmed by eye); grass → `cropped:right`; cloud → `cropped:left`.
`bleed` is advisory for thin `kind:prop` objects (grass scored 70% purely from stroke geometry);
`undersized` compares against `size_in_anchor_units` and mostly says the spec guesses were generous.

Two regeneration mechanisms were tried on the cloud and the grass:

| Mechanism | Cloud | Grass | Verdict |
|---|---|---|---|
| `complete-prop.py` — inpaint only the missing side (shape-guided hole, mirror seed, 55% denoise, colour-match, feathered seam), original pixels byte-identical | silhouette continues, but the painted half has a different internal texture (v2–v4 identical: tone means already matched, texture is the difference) | paints the beach into the hole every time | **not usable** with klein 4B distilled — it will not continue a hand, and it hallucinates the scene a prop "belongs" in |
| `rerender-prop.py` — whole-object re-render via `ReferenceLatent` from the cutout, then **SAM3-keyed** on the prop name | ✅ complete cloud in the same hand, 1 component, clean edge (`05-…-rerender-v2.png`) | ✗ renders a full beach scene around the tuft | works for compact objects; fails for anything the model strongly associates with an environment |

Findings: (1) klein ignores the isolate clause and paints a sky/ground halo — a ΔE key against the plate
fails, SAM3 on the prop name keys it cleanly (rembg left a half-alpha halo). (2) The cheapest fix for
`cropped` is upstream: the section-spec should place every `kind:prop` "fully inside the frame with
margin"; only `kind:scenery` may bleed off an edge, and a scenery piece cropped by the frame is a legitimate
composition that `assemble` should mark edge-anchored rather than regenerate. (3) Retry cap: 3 attempts per
prop per mechanism, then the human rules A (accept as-is) / B (re-spec).
