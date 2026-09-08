# Design Brief — Template11 "Rose Horizon" (working slug: `rose-horizon`)

- **Event type**: WEDDING
- **Tier**: PRO
- **Template family**: Classic (flow + overlay — real DOM reflow, `SectionOverlay` decorative
  layers, in the T1–T6 lineage). **Not** the fixed-stage compositor family (T7/T10).
- **Reference**: `docs/rose-horizon-refs/reference-01.jpg` (user-supplied, via Pinterest URL)

## Reference description (palette in words, per pipeline convention — never trust a model's
own reported hex values; `sample-palette.py`-equivalent should re-derive these from the actual
file before locking a style spec)

**Medium**: Flat-shaded digital gouache/airbrush illustration — soft brush-blended cloud
texture, minimal linework (faces have thin ink outlines, clothing mostly relies on flat color
+ soft shading, no hard cel-shading edges).

**Subject**: A Muslim bride and groom, closely framed, waving/reaching toward the viewer and
holding hands. Groom: dark charcoal three-piece suit, white shirt, black tie, glasses, short
dark hair. Bride: white hijab and modest lace-trimmed wedding gown, floral hijab crown, holding
a bouquet of pink lilies/tulips and white baby's breath.

**Setting**: Soft sky-blue gradient background (deeper blue top-left fading to pale
powder-blue), with oversized soft-focus rose blooms (cream/white, blush pink, dusty blue)
bordering all four edges like a floral frame, plus two small bird silhouettes in flight. Roses
are rendered with a hazy, out-of-focus "bokeh" treatment — this is a foreground vignette, not
part of the same focal plane as the couple.

**Palette (visual estimate — must be re-sampled programmatically before writing
`spec/style.json`, not locked from this description alone)**:
- Sky: powder blue → deeper cornflower blue (background gradient)
- Skin: warm peach/tan
- Bride's gown: warm ivory/cream, not stark white
- Bouquet: blush pink, soft coral, sage green stems
- Groom's suit: charcoal/near-black, muted (not pure black)
- Border roses: cream white, dusty blue-grey, blush pink (desaturated, hazy)

**Mood**: Warm, soft, romantic, gentle — no hard shadows, no saturated primaries, no outlined
"clip-art" flatness. Reads as painterly rather than vector.

**Forbidden traits (candidate list — refine when `spec/style.json` is actually written)**:
no glossy 3D highlights, no hard black outlines beyond the minimal facial linework already in
the reference, no saturated/neon color, no photographic realism.

## Open design decision — flagged for the human gate, not resolved here

The documented pipeline (`docs/invite-pipeline.md`) was built and proven **only against the
Stage family** (T7 Roman Garden, T10 Sunny Safari): `scene-research`/`scene-manifest` produce
`spec/scene.json` band/anchor geometry, and `assemble` writes `data/stages.ts` — none of that
vocabulary applies to a Classic (flow + overlay) template, which instead needs per-section
background art plus `SectionOverlay`-positioned decorative layers (percentage-of-section-box,
not percentage-of-stage). This run is the pipeline's first attempt at a Classic-family
template, so the mid-pipeline stages (scene-research → assemble) will need to be adapted on
the fly rather than followed literally — worth tracking as a real finding for
`docs/invite-pipeline.md`, not a deviation to hide.

## Slug / naming
- Working slug: `rose-horizon`
- Next available template ID: **Template11** (T1–T10 taken; T8/T9 are prototypes, not
  production, per `CLAUDE.md`'s Templates section)
