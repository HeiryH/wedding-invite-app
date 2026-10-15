# Painted Promise — style lock

## Reference and intent

Style reference:
`https://i.pinimg.com/736x/d9/b9/c6/d9b9c62b8b5f8617d2fa28ea3b7b40c6.jpg`

Use the reference only for its illustration language: soft painted editorial character art,
friendly simplified anatomy, loose floral framing, airy blue negative space, and an intimate modern
Muslim-wedding mood. Do not reproduce its couple, pose, ring-hand perspective, floral arrangement,
or framing.

The finished invitation is a contemporary, culturally broad Muslim wedding world. It should feel
joyful, refined, intimate, and hand-made rather than royal, regional, or heavily ornamental.

## Medium

Soft gouache-and-digital-brush editorial illustration. Shapes are painted in matte, gently blended
colour fields with visible soft brush transitions. The image may have small areas of loose dry-brush
texture, but never heavy paper grain, photographic texture, or glossy rendering.

## Line

Use a thin, warm espresso-brown line for fingers, facial features, lace edges, chair seams, flower
centres, and other small descriptive details. Lines may taper and occasionally break. Large fabric,
sky, wall, floor, floral-mass, and furniture shapes should be defined mainly by painted colour edges,
not uniform outlines.

## Colour and light

Primary palette:

- `#A9D4E6` — airy powder blue; sky, painted walls, distant atmosphere
- `#DCECF1` — pale mist blue; highlights and depth haze
- `#FFF7E8` — warm ivory; bridal fabric, paper, flowers and negative space
- `#EBC3B5` — soft blush; floral accents and warm reflected light
- `#F1A889` — muted peach; secondary petals and skin warmth
- `#A9B79D` — quiet sage; foliage
- `#68755F` — muted olive; deep foliage accents
- `#C8A66A` — restrained antique gold; ring, lanterns and fine furniture detail
- `#493B38` — espresso brown; groom's suit, linework and darkest accents

Lighting is soft late-afternoon daylight transitioning gradually into warm reception lantern light.
The whole sequence remains luminous. Shadows are broad painted value changes, never hard cast-shadow
graphics.

## Characters

- Contemporary Muslim bride in an ivory hijab and long-sleeved bridal gown.
- White bridal lace appears at her wrist and may recur subtly in her veil or cuff.
- Contemporary groom in a dark espresso or charcoal formal suit with an ivory shirt.
- Character proportions are natural but gently simplified, with expressive hands and calm posture.
- Clothing is modest and elegant. No exposed hair for the bride, plunging neckline, transparent
  bodice, or culturally specific ceremonial costume.
- The bride and groom must remain visually consistent across the wide dais view and close detail
  plates.

## Florals and décor

Use airy arrangements of ivory roses, pale blush garden flowers, small peach accents, and sage/olive
foliage. Arrangements are asymmetrical and loosely painted, with visible negative space. Contemporary
Islamic-inspired arches may use restrained scalloped or pointed geometry, but do not overload the
scene with arabesque pattern.

Use ivory drapery, a powder-blue architectural backdrop, pale upholstery, antique-gold accents,
glass lanterns, warm candles, elegant stationery, and fine ribbon. These form one coherent venue,
not a collection of unrelated themed sets.

## Typography and live content

Full-design images may include representative, correctly spelled invitation text only to establish
composition. All production names, dates, paragraphs, programme entries, RSVP controls, wishes, and
photos will be live React/HTML. Clean backgrounds and prop atlases must contain no text, letters,
numbers, logos, signatures, watermarks, or fake UI.

## Edge and extraction rules

- Every atlas object must be complete, including parts hidden in the full design.
- Leave generous separation between atlas objects.
- Hands and ring require clean silhouettes and anatomically credible finger placement.
- Fine lace may use opaque painted cutwork shapes; do not rely on semi-transparent white haze.
- No object may touch the atlas edge.
- No checkerboard baked into the image.
- Prefer genuine transparency. If the generator cannot produce reliable alpha, use one flat,
  removable key colour absent from the palette and keep antialiased edges clean.

## Never include

- photographic realism or photobashing
- glossy 3D rendering, plastic skin, or cinematic lens flare
- anime, chibi, caricature, oversized eyes, or fashion-sketch anatomy
- thick uniform black outlines
- harsh cel shading
- neon colour or saturated royal jewel palette
- crowns, thrones, palace excess, or region-specific costume
- minarets, mosque silhouettes, Qur'anic text, Arabic calligraphy, or sacred text as generic décor
- alcohol, champagne glasses, or bar imagery
- duplicated fingers, fused hands, malformed jewellery, or impossible ring placement
- baked names, dates, programme copy, form controls, watermarks, or artist signatures
