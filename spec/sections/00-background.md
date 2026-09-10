[STYLE LOCK]
MEDIUM: Soft gouache/airbrush digital illustration for a Muslim wedding portrait: mostly flat-to-gently-shaded color fields with a diffused, brush-blended cloud texture in the sky and background elements, rendered by a hand that favors soft edges over crisp vector boundaries.
LINE: Thin, confident, fully closed ink outlines used only on facial features and fine details (glasses, hijab edge); clothing, sky and floral shapes carry no outline at all and rely on flat color edges instead.
WASH: Soft, semi-transparent pigment bleeding at edges — visible in the sky's cloud transitions and border roses' hazy diffusion. Skin and clothing keep smoother, opaque coverage with gentle blended shading, never a hard cel edge.
TEXTURE: Fine, even brush-grain across sky and cloud passages, like soft airbrush spatter with visible directional strokes; smooth and grain-free on skin and gown fabric.
PALETTE: work only within #4a362e (deep espresso brown — groom's hair and suit shading), #6f7661 (muted sage-olive — bouquet stems and foliage), #7ca3c0 (mid cornflower-blue sky gradient), #9cc8d3 (pale powder-blue sky), #c7ddd7 (hazy dusty blue-grey — soft-focus border rose petals), #e0d2bb (warm beige — lace and gown highlight, skin undertone), #faebcc (warm ivory cream — bridal gown, hijab, cream rose petals), #fcb887 (warm peach — skin tone, coral bouquet accents).
NEVER INCLUDE: cast shadow, contact shadow, crisp flat vector fill with no blending, drop shadow, glossy 3d highlight, hard black outline on clothing, sky or objects (outline reserved for facial features only), photographic realism, saturated neon color.
Absolutely no text, letters, numerals, or captions anywhere in the image.

RENDER SPECIFICATION
Render one tall vertical image in portrait orientation, full bleed, edge to
edge. No device frame, no phone bezel, no browser chrome, no border, no
margin, no drop shadow around the canvas. This is a decorative surface
texture, not a picture of anything.

CONTENT — render exactly this and nothing more:

A soft abstract wash texture that completely fills the canvas from edge to
edge, with no empty area anywhere.

Broad soft bands of colour run vertically, from the top edge down to the
bottom edge. Each band wanders gently from side to side as it descends —
curving and undulating like slow water currents or the folds of drifting
silk. They are never straight parallel stripes, never hard-edged, and never
regular enough to look mechanical. Band widths vary; some are wide and
diffuse, some narrow and brighter.

The colours are the blues only: mid cornflower-blue #7ca3c0 through pale
powder-blue #9cc8d3, with paler dusty blue-grey #c7ddd7 where a band catches
the light, and one or two barely-there veils of warm ivory cream #faebcc so
the surface does not read as a flat blue slab. Every edge between colours is
soft and blended — pigment bleeding into pigment, never a clean boundary.

Fine even brush-grain sits across the whole surface, like soft airbrush
spatter.

The tone stays even across the entire canvas: no bright focal point, no dark
mass, no vignette, no corner darker or lighter than the middle, nothing that
pulls the eye to one place. A viewer should be able to read dark text laid
over any part of this image.

The very top edge and the very bottom edge must carry the same bands, at the
same horizontal positions, in the same tone, so that the image can be
repeated end to end vertically and the join is invisible.

Nothing else appears in this image: no flowers, no roses, no petals, no
leaves, no branches, no vines, no birds, no clouds with recognisable shape,
no person, no face, no figure, no hands, no fabric garment, no horizon, no
ground, no sky-and-land division, no objects of any kind.

---
NOT PART OF THE PROMPT — operator notes, do not paste below this line.

- Paste everything **above** this line into Recraft. Request a **portrait**
  ratio (1:2 is the tallest Recraft offers).
- **Do not bind the custom style built from the couple reference for this
  asset.** Measured across six attempts on this run: that style carries a
  strong figure prior, and prompts that ask it for empty or abstract space
  get a human figure inserted regardless of how many negatives are listed.
  Generate this one with no `input_style_id`.
- The prompt above deliberately describes the texture as something that
  *fills* the frame rather than as emptiness, for the same reason. Do not
  "simplify" it toward "a plain blue background" — that phrasing is what
  triggered the failure.
- Verify the seam before accepting: stack two copies and look at the join,
  and run the generator's own numeric check (`tools-flowbg/flowbg.py` prints
  it) — seam delta must be within 1.5x the mean adjacent-row delta, and
  luminance spread must be ≤ 60/255. See `spec/background.md` for the full
  acceptance table and for why this asset is currently produced by code
  rather than by this prompt.
- This document specifies how the background should LOOK.
  `spec/background.md` specifies how it is PRODUCED and VERIFIED. They are
  two different documents on purpose; pasting the latter into Recraft will
  not render anything useful.
