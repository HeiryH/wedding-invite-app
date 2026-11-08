# Welcome arms v2

Generated with the built-in image generation tool. Two separate transparent PNGs; groom and held ring are one asset, bride arm is ring-free. No layout or saved invitation data has been changed.

Reference: `/Users/helmyheiry/.codex/generated_images/01a0f614-7b34-7773-b237-dd6a9d847152/exec-700e34d7-6c3f-4bf0-b8e2-0253e9caf3d1.png`

## Outputs

- `frontend/public/templates/painted-promise/assets/welcome-ring-v2/groom-arm-with-ring.png`
- `frontend/public/templates/painted-promise/assets/welcome-ring-v2/bride-arm.png`

## Initial groom prompt

Use case: background-extraction with elbow-length extension.
Input image 1 is the exact extraction target and immutable illustration/shading reference, not just inspiration.
Asset: ONE isolated groom forearm and hand HOLDING THE GOLD WEDDING RING, as one combined transparent PNG asset for an animated wedding invitation.
Extract the groom's hand from the lower left of image 1, preserving its existing three-quarter view, warm peach skin, precise thumb/index pinch, softly faceted painted shading, subtle textured brushwork, white shirt cuff, and dark brown formal jacket sleeve. Preserve the gold engraved wedding band between his thumb and index finger as part of this same asset. Reconstruct any ring rim/hand portions previously occluded by the bride; leave the ring aperture visibly open where not naturally covered by his fingertips so a separate bride ring finger can reach into it.
Extend the jacket-covered forearm naturally all the way back to the elbow, fully visible, matching the source fabric, proportions, pigment texture, and warm lighting. Pose points diagonally from lower left elbow toward upper right hand, matching the reference contact angle. Entire elbow-to-fingertips silhouette in frame with modest transparent padding; do not crop the elbow or ring.
Output contains ONLY this one groom arm and held ring. Remove the bride's entire hand and arm, flowers, sky, drapery, scenery, and every other object. Actual transparent alpha background, including gaps between fingers and the ring aperture. Preserve the source illustration style and shading exactly: no photorealism, no 3D, no new outlines, no watercolor restyling, no added diamonds, no cast shadow behind the cutout, no checkerboard painted into the image, no text. High-resolution clean cutout with soft natural painted edges and no blue/white halos.

## Initial bride prompt

Use case: background-extraction with elbow-length extension.
Input image 1 is the exact extraction target and immutable illustration/shading reference.
Asset: ONE isolated bride forearm and hand, elbow-length, transparent PNG for an animated wedding invitation. This is the separate counterpart to a groom hand holding a ring.
Extract the bride's hand entering from the upper right in image 1. Preserve her back-of-hand three-quarter view, warm peach skin, elegant natural five-finger anatomy, nails, original soft faceted painted shading, and ivory floral-lace sleeve. Her hand reaches diagonally from upper right toward lower left. Preserve the reference gesture with her ring finger gently reaching forward, poised to slide into a separate ring; restore the portion of the ring finger occluded by the groom/ring in the source. Keep the other fingers naturally relaxed and separated. NO ring anywhere on this asset.
Extend her lace-covered forearm naturally to the elbow, fully visible, with the same ivory lace flower motifs, delicate transparency, brush texture and warm cream shading as the source. Maintain original hand proportions and contact angle. Show the complete elbow-to-fingertips silhouette with modest transparent padding; no cropped elbow or fingertips.
Output contains ONLY the bride's single arm and hand. Remove all groom skin/sleeve, all gold ring, flowers, sky, drapery, scenery, and other objects. True transparent alpha background including spaces between fingers and lace-edge cutouts. Preserve the exact illustration style, palette, and shading from image 1: no photorealism, no 3D, no new outlines, no watercolor restyling, no added jewelry, no cast shadow behind the cutout, no checkerboard painted into the image, no text. High-resolution clean cutout, retain fine lace edges without blue/white halos.

## Final groom refinement prompt

Use case: background-extraction, precise framing correction.
Image 1 is the EDIT TARGET: the isolated groom's brown suit-covered arm with the gold ring held in his thumb/index pinch. Image 2 is the original style/shading reference.
Keep the existing hand, fingers, pose, skin tones, exact painted texture, clothing details and shading unchanged. Keep the ring and hand inseparable as one object, with the ring aperture clear.
Change ONLY the elbow-end framing: show exactly one complete elbow-length forearm, ending at the elbow, not a shoulder or upper arm. Reconstruct the small elbow cap/end currently running off the lower-left canvas edges, then fit the entire elbow-to-fingertips silhouette within the image. ALL nontransparent subject pixels must have at least 6% transparent margin to EVERY canvas edge, especially at the elbow end. No part of the sleeve may run off the canvas. This is a standalone cutout, not an arm entering from outside a scene. Preserve the same diagonal direction and hand proportions. If necessary slightly reduce the whole object's size to fit. Do NOT add an upper arm or lengthen beyond the elbow. Genuine transparent alpha background, including finger gaps. No scenery, no additional objects, no shadow behind the asset, no text, no painted checkerboard. Preserve illustration style and original shading exactly.

## Final bride refinement prompt

Use case: background-extraction, precise framing correction.
Image 1 is the EDIT TARGET: the isolated bride's ivory floral-lace-covered arm and reaching hand, with no ring. Image 2 is the original style/shading reference.
Keep the existing hand, fingers, pose, skin tones, exact painted texture, clothing details and shading unchanged. Keep the hand ring-free; the ring finger reaches down-left toward the other asset.
Change ONLY the elbow-end framing: show exactly one complete elbow-length forearm, ending at the elbow, not a shoulder or upper arm. Reconstruct the small elbow cap/end currently running off the upper-right canvas edges, then fit the entire elbow-to-fingertips silhouette within the image. ALL nontransparent subject pixels must have at least 6% transparent margin to EVERY canvas edge, especially at the elbow end. No part of the sleeve may run off the canvas. This is a standalone cutout, not an arm entering from outside a scene. Preserve the same diagonal direction and hand proportions. If necessary slightly reduce the whole object's size to fit. Do NOT add an upper arm or lengthen beyond the elbow. Genuine transparent alpha background, including finger gaps. No scenery, no additional objects, no shadow behind the asset, no text, no painted checkerboard. Preserve illustration style and original shading exactly.
