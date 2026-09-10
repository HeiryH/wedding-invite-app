[STYLE LOCK]
MEDIUM: Soft gouache/airbrush digital illustration for a Muslim wedding portrait: mostly flat-to-gently-shaded color fields with a diffused, brush-blended cloud texture in the sky and background elements, rendered by a hand that favors soft edges over crisp vector boundaries.
LINE: Thin, confident, fully closed ink outlines used only on facial features and fine details (glasses, hijab edge); clothing, sky and floral shapes carry no outline at all and rely on flat color edges instead.
WASH: Soft, semi-transparent pigment bleeding at edges — visible in the sky's cloud transitions and border roses' hazy diffusion. Skin and clothing keep smoother, opaque coverage with gentle blended shading, never a hard cel edge.
TEXTURE: Fine, even brush-grain across sky and cloud passages, like soft airbrush spatter with visible directional strokes; smooth and grain-free on skin and gown fabric.
PALETTE: work only within #4a362e (deep espresso brown — groom's hair and suit shading), #6f7661 (muted sage-olive — bouquet stems and foliage), #7ca3c0 (mid cornflower-blue sky gradient), #9cc8d3 (pale powder-blue sky), #c7ddd7 (hazy dusty blue-grey — soft-focus border rose petals), #e0d2bb (warm beige — lace and gown highlight, skin undertone), #faebcc (warm ivory cream — bridal gown, hijab, cream rose petals), #fcb887 (warm peach — skin tone, coral bouquet accents).
NEVER INCLUDE: cast shadow, contact shadow, crisp flat vector fill with no blending, drop shadow, glossy 3d highlight, hard black outline on clothing, sky or objects (outline reserved for facial features only), photographic realism, saturated neon color.
Absolutely no text, letters, numerals, or captions anywhere in the image.

RENDER SPECIFICATION
Render a screenshot of one vertical section of a mobile web page, viewed in
a phone browser in portrait. Full bleed, edge to edge. No device frame, no
phone bezel, no hand holding a phone, no browser chrome, no address bar, no
status bar, no drop shadow around the canvas.

Background: Abstract vertical flowing wash of pale powder-blue and cornflower-blue, undulating soft bands running along the scroll axis, low contrast throughout, no objects, no horizon, no figures.
Layout: strict single column, content inset 7% from the left and right edges,
generous vertical breathing room between elements.
Type scale is real mobile scale: headings large but not poster-sized, body
text at comfortable phone reading size, never tiny.

Typography: a soft high-contrast display serif for names and headings, in #4a362e (deep espresso brown). Small labels in
letter-spaced small capitals. All text is crisp, correctly spelled,
horizontally centred unless stated otherwise, and never overlaps illustration.

Illustrations sit behind and around the text as decoration — in corners, along
edges, flanking headings — never on top of it and never obscuring it.
Every illustrated element uses the STYLE LOCK medium and palette above.

CONTENT — render exactly this and nothing more:

The envelope with a rose wax seal sits in the midground band, horizontally
centred, above the title at roughly 22% of the frame height.
The cream rose bloom sits in the foreground-frame band at the top-left corner.
The blush-pink rose bloom sits in the foreground-frame band at the
bottom-right corner, at the very bottom edge.
The reserved content zone from 32% to 76% of the frame height must stay
completely clear of illustration — the live RSVP form renders there.

Centred beneath, in order with generous spacing:
  RSVP — large heading [rsvpTitle]
  Kindly let us know if you can join us — one line of body copy [rsvpPrompt]
  the RSVP form: name field, attendance choice, guest count, submit button [rsvpForm]

---
Confirmed props for this section (spec/assets.json) — no others may appear:
  - Cream rose bloom — band: foreground-frame, 1.0x anchor (prop)
  - Blush-pink rose bloom — band: foreground-frame, 0.9x anchor (prop)
  - Envelope with a rose wax seal — band: midground, 0.6x anchor (icon)

Geometry (spec/scene.json): scale anchor = a fully-open rose bloom at
18% of frame height at band multiplier 1.0;
bands {"background": 2.2, "midground": 1.0, "foreground-frame": 1.4}; reserved content zone [32, 76]%.
