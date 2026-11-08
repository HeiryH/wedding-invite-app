# Welcome arms — ring transfer v4

Created with built-in ImageGen. Earlier assets are preserved. These files are not yet wired into the invitation layout.

Outputs:
- `frontend/public/templates/painted-promise/assets/welcome-ring-v4/groom-full-arm-no-ring.png`
- `frontend/public/templates/painted-promise/assets/welcome-ring-v4/bride-full-arm-reference-ring.png`

Reference jewelry: `/Users/helmyheiry/Desktop/reff ring image.png`.

## Groom removal prompt

+Use case: precise-object-edit.
Image 1 is the exact edit target: the full-length groom arm. Remove ONLY the small gold ring held at the upper-right hand (the user annotated near x=96.1%, y=5.8%; remove the existing ring beside the thumb/index pinch).
Reconstruct the tiny skin/nail edge hidden by the ring as needed, preserving the same natural thumb-and-index pinching pose and correct five-digit anatomy (one thumb and four fingers). Leave his hand empty: no ring, no gold marks, no other object.
Keep everything else unchanged: exact full arm length from shoulder cap to fingertips, framing, brown jacket fabric texture, sleeve folds, white cuff, colors, hand size and pose, original painted illustration style and warm shading. Do not crop or restyle anything. Preserve existing genuine transparent alpha background and all transparent regions. No text or added objects.

## Bride insertion prompt

+Use case: precise-object-edit / compositing.
Image 1 is the exact edit target: full bride arm with wide flowing ivory lace/veil fabric.
Image 2 is the exact ring to insert: the ornate warm-gold ring with a round pale gemstone and its distinctive raised decorative setting.
Fit ONE copy of the reference ring naturally onto the bride finger at the USER'S MARKED LOCATION, approximately x=19.2%, y=70.5% of Image 1 (about x=295,y=722 in the 1536x1024 target). This is a ring worn around that finger, not floating beside her hand. Scale and rotate the ring to fit the local finger width and axis. Use convincing wrapping/occlusion: rear band behind the finger, near band visible across its surface, raised round gemstone setting facing outward on the back of the finger. Preserve the reference ring's gold color, round pale stone, and decorative mounting, integrated into the existing softly painted illustration shading. It should be a plausible small finger-sized ring, not a giant bracelet.
Change ONLY this local ring insertion. Keep the hand pose and anatomy, fingers/nails, full shoulder-to-fingertips arm, generous WIDE flowing veil-like sleeve, every lace scallop, original canvas/framing, entire fabric silhouette, original palette, brushwork and shading unchanged. Do not narrow the sleeve or crop its edges. Do not add another ring anywhere, a groom hand, any background, or text. Preserve the target's genuine transparent alpha background.

## Bride fit refinement prompt

+Use case: precise-object-edit.
Image 1 is the EDIT TARGET: the bride arm with a newly added ring. Image 2 is the exact jewelry-design reference.
Correct ONLY the size and fit of that ring. The current ring is too large and shows a full floating hoop over adjacent fingers. SHRINK the jewelry to about 55–60% of its current overall size, and fit it tightly around the SAME marked finger at approximately x=19.2%, y=70.5%. Its outer band width must be only slightly greater than this single finger's local width, never spanning two fingers.
Make it a naturally WORN ring: conform the band to the finger axis, show the small gold near-side shank wrapping across the finger with its rear half hidden behind the skin; do NOT show the entire open circular hoop lying on top of the hand. Keep the reference's round pale gemstone and ornate raised gold setting, miniaturized proportionally and facing outward. Preserve the target finger anatomy and all other fingers unchanged; repaint the small area vacated by the oversized ring with matching existing skin shading.
Everything outside this tiny ring-fitting area must remain unchanged: full arm pose, hand, all lace and broad veil fabric, texture, warm shading, palette, framing and complete silhouette. No cropping, no fitted sleeve, no extra objects, no second ring, no text. Preserve genuine transparent alpha background and existing transparent regions.
