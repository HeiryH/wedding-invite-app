# Lint image review

Scope: the 48 image warnings recorded at the start of lint cleanup. Existing image exceptions outside that baseline were not broadened.

## Fixed-size content images (7)

Next Image uses `unoptimized` to retain existing arbitrary user/CDN/blob URLs without adding a proxy or remote-host policy. Fill is limited to boxes with explicit existing height/aspect ratio. Loading remains eager for previously eager photos/avatar and lazy for previously lazy editor uploads. No bandwidth or speed improvement is claimed.

| Surface | Count | Geometry |
| --- | ---: | --- |
| Public photo page | 2 | Existing 256px preview/gallery boxes; preview wrapper explicitly owns its existing height |
| Admin Photos tab | 1 | Existing relative square box |
| Admin photo management | 1 | Existing relative square box |
| Details upload/portrait controls | 2 | Existing relative 16:9 and 3:4 boxes |
| Avatar | 1 | Existing numeric size, with matching image width/height |

## Native images retained (41)

Each image has a next-line exception with a reason. Rules/severities and remote-host configuration are unchanged. These are compatibility dispositions, not claims that every retained image is already optimal. Source-specific optimization can be a separate measured project.

| File | Count | Reason |
| --- | ---: | --- |
| `app/organizer-admin/customize/_components/CinematicReferenceRail.tsx` | 1 | Reference uploads retain intrinsic proportions and direct source loading in the editor. |
| `components/templates/Template1.tsx` | 2 | Guest uploads retain the existing preview/gallery sizing and direct source loading. |
| `components/templates/Template15-paintedpromise/ProgrammePopup.tsx` | 1 | The programme board uses intrinsic artwork dimensions beneath its positioned copy. |
| `components/templates/Template15-paintedpromise/index.tsx` | 1 | The reference overlay must share the camera canvas geometry and direct upload source. |
| `components/templates/Template16-inkboundrevelry/index.tsx` | 2 | Guest media retains the template grid/lightbox sizing and direct arbitrary upload URLs. |
| `components/templates/Template2.tsx` | 2 | Guest uploads retain the existing preview/gallery sizing and direct source loading. |
| `components/templates/Template3.tsx` | 4 | Uploaded portraits and guest media retain intrinsic sizing within the template framing. |
| `components/templates/Template4.tsx` | 5 | Swipe cards and uploaded portraits retain native sizing, clipping and direct source loading. |
| `components/templates/Template5.tsx` | 6 | The envelope template retains native uploaded-media ratios, clipping and loading behavior. |
| `components/templates/Template6-fairygarden/components/PhotoBoothSection.tsx` | 1 | Guest media retains the animated card sizing and existing lazy-loading behavior. |
| `components/templates/Template8.tsx` | 2 | Prototype guest media retains existing sizing and unrestricted upload sources. |
| `components/templates/Template9.tsx` | 2 | Prototype guest media retains existing sizing and unrestricted upload sources. |
| `components/templates/TemplatePreview.tsx` | 1 | Uploaded thumbnails have unknown intrinsic ratios; preserve both natural-height and cropped modes plus drag behavior. |
| `components/templates/_shared/adjust/AdjustPanel.tsx` | 1 | Uploaded poster previews retain intrinsic proportions and direct source loading. |
| `components/templates/_shared/backdrop.tsx` | 1 | Backdrop artwork uses intrinsic ratios with container-relative geometry and transforms. |
| `components/templates/_shared/cinematic/CinematicSceneLayer.tsx` | 1 | Editable scene artwork must retain the generated element geometry and direct layer source. |
| `components/templates/_shared/cinematic/functionalLayers.tsx` | 6 | Scene artwork and guest memories retain native intrinsic geometry within animated layer parts. |
| `components/templates/_shared/cinematic/parts.test.tsx` | 1 | Native image fixture verifies editor registration against a plain DOM image. |
| `components/templates/_shared/slots/CurvedPiece.tsx` | 1 | Curved-text backdrop retains intrinsic artwork ratios and container-relative transforms. |
