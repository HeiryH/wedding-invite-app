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

## Resolved intake fields (for scene-research to read)
- `event_types`: WEDDING
- `implementation_family`: **A** — single shared background for the whole template, not one
  per section. This falls out of the "flow background" decision below, not a separate choice:
  a background meant to be one continuous tileable panel scrolled behind every section is by
  definition one background for the whole template, which is exactly what family A means in
  `assets.schema.json`/`scene.schema.json` — it just happens to be a Classic-family template
  choosing family A's *background* semantics (T5, also Classic, does the same).
- `sections`: welcome, walimah, itinerary, rsvp, wishes, photobooth (all six — no reason to
  drop any for a standard wedding brief)
- `scale_anchor` candidate: a single fully-open rose bloom (recurs across sections, natural
  recognizable size, unlike "clasped hands" or other one-off motifs)

## Two decorative systems beyond section content — schema adaptation notes

Both agreed with the human before any generation. Neither maps cleanly onto the Stage-family
`scene.json` vocabulary this pipeline was built around, so here's how each adapts:

1. **Flow background** — one continuous vertically-tileable illustration, `background-repeat:
   repeat-y` behind the whole page, `background-position-y` driven by scroll at a slower rate
   than the page (parallax). **Does not use `empty_band_pct`.** That field assumes one
   background image composed against one known screen size with a specific reserved zone —
   doesn't transfer to a tile tiling indefinitely behind content whose scroll position isn't
   fixed. Instead: real content renders on a translucent content card/panel *above* the tile
   (standard "scrim behind text" pattern), so legibility doesn't depend on which part of the
   tile happens to be behind it. The tile's own job is just to stay low-contrast/pastel
   throughout (already true of this brief's palette) so it reads well behind a translucent
   panel at any scroll offset. **Learned live, before this was written down**: a prose
   instruction alone ("must be seamless") does not reliably make a model produce a matching
   seam — two live probes confirmed this. The fix that actually works: the *spec* must
   require the top and bottom ~15% of the tile to be plain, near-identical flat sky gradient
   with zero decorative content (roses/birds/etc. confined to the middle), so the only thing
   that has to match at the seam is a flat colour, not a composed illustration. This is the
   same shape of fix as `empty_band_pct` — reserve a zone and require it stay quiet — just
   applied to solve tiling instead of leaving room for real text.
2. **Rose-border frame** — the reference's soft out-of-focus rose vignette framing the couple,
   as separate per-section decorative assets (not baked into the flow background) positioned
   via `SectionOverlay` as a percentage of each section's own box, parallaxing at its own rate
   (faster than the flow background, slower than foreground text) for depth. These map onto
   the normal `props` schema fine (`kind: "prop"`, a `band`, `size_in_anchor_units`) — the
   only adaptation is that `assemble`'s output target is `SectionOverlay` layer config, not
   Stage's `data/stages.ts`, since this is a Classic not Stage template.
