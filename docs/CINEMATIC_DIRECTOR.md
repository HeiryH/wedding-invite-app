# Cinematic director — Painted Promise

## Completed scope (phases 16–21)

- **16 — Effects:** movement, drift, scale, rotation, opacity and blur are records in the project. Each targets a layer, envelope paper, or the world, and samples a selected timeline track with linear/ease-in/ease-out/ease-in-out pacing. Desktop movement can override shared movement.
- **17 — Functions:** layers declare a function rather than acquiring behavior from their asset ID. The shared registry includes artwork, background, programme board, RSVP envelope, guest book, memory wall, narrative and scroll cue. Shipped functional images can be replaced without changing their function.
- **18 — Narratives:** Walimah and person details are selectable layers with editable geometry, independent timing, binding, title, rich-text override and typography. People bindings use the existing editable event fields. Blank overrides retain bound content; custom text supports the existing token vocabulary.
- **19 — Interactions:** action, trigger layer, availability/reset tracks, camera destination, scroll lock, opening/closing duration and return/reveal sets are editable records. Actions can open RSVP, Wishes or an information dialog, focus/navigate to a beat, or return. Dismissal restores the authored scene and waits for scrolling. Information dialogs support keyboard dismissal, focus trapping and return focus.
- **20 — Direction:** global scroll distance, incoming distance and holds per beat, navigation anchor destinations, reference replacement/removal/fit/opacity, and approved-photo memory layout are editable. Mobile and desktop framing remain separate.
- **21 — Theme and compatibility:** ink, accent, paper, borders, backdrop base, fonts, narrative sizes, corner radius and shadows use saved theme tokens. Legacy scene/camera/sequence layouts are materialized through the versioned project adapter. No database migration is needed for these controls.

## Where to edit

Open an invitation using Painted Promise → **Customize → Adjust**.

The **Advanced** tab is fixed at the bottom of the sidebar. It opens Story settings with Effects, Interactions, Pacing, Navigation, Memories and Theme tabs, separate from normal Editing controls. Both panels preserve their local state when switching. Scene layers remain in the Editing list; selecting one opens its floating inspector. Narrative blocks have rich text and binding controls there. To add one, open the scene’s Add menu and choose Narrative. To turn an uploaded image into a board/envelope/book, choose its Function in the inspector, then assign an interaction to that layer under Advanced.

In All Tracks view, double-clicking a timeline bar selects it in place and opens its timing controls without promoting it to the top or resetting the track-list scroll position. Selected bars expose drag handles in their original row. Activating a track also returns the sidebar from Advanced to Editing.

Effect position units are explicit: X/Y are percentages of the layer, while screen X/Y are percentages of the preview’s device box. An effect’s timing lives in its assigned timeline track; deleting its definition does not delete a track another layer may share. An effect with a missing track does not run. Missing action availability/destination references are flagged in the editor and do not execute.

### Multiple moves between entrance and exit

Select an asset, or double-click its scene-set timing bar. Below entrance/exit controls, **In-between animations** lets you add/remove moves: left, right, up, down or return to the original position. For sets with several assets, choose the asset to animate first. Each move has a name, enabled state, start/end story percentages, easing, horizontal/vertical destination, scale and rotation. Preview move scrubs that interval; Select on timeline activates its two-handle bar. Move bars are grouped directly under their source timing track, with drag/resize handles available without first selecting them. Use the **In-between animations** timeline filter to isolate them, or the Scene set/Asset timing filter to keep them with their parent. Drag the bar to move its interval; drag either edge to resize it. Moves stay inside the fully-visible interval and do not change entrance/exit timing.

Moves are stored on the layer per breakpoint, as fractions of its fully-visible interval. Their projected timeline percentages therefore follow source/set timing edits, including linked timing. A zero-length fully-visible interval must be extended before moves can be added. No extra sequence records are saved; timeline rows are derived from layer data.

Destinations are offsets from the original asset position (X/Y in screen percentages), not extra increments. For example, left −10 then right +10 moves from the left pose to the right pose. Each move starts from the preceding sampled pose and holds its endpoint until the next move, including through the exit transition. Overlapping moves redirect from the current pose rather than snapping. Disabled moves are skipped; rewinding scroll deterministically reverses the chain. Existing global effects and entrance/exit transforms still compose with these moves.

Scroll distances use screen-height units: 100 means one screen. Beat incoming distance overrides only that approach; a hold adds scrolling at a fixed story position. Timeline coordinates remain normalized story coordinates, so camera, text, effects and interactions stay synchronized. Navigation maps back through the same pacing function. Navigation anchor IDs are link destinations, not automatic changes to labels in external navigation; preserve existing IDs when retargeting standard invitation links.

Reference images are editor-only and stored per beat. Content/layout overrides are per breakpoint; global story settings apply across both. The default direction and asset geometry remain in the template’s data modules, serving as the starting design, not hidden runtime animation branches.

## Persistence and safe changes

### Editable composite children

Scene layers now has an expandable parent/child tree. Programme exposes its artwork, copy group, heading, each entry's time/activity, and focus label. RSVP exposes envelope artwork and the letter with prompt/heading/action children. Wishes exposes book artwork and its copy children. Memory wall exposes the arch, photo-frame group, each individual frame, and caption children. Narrative blocks also expose label, heading, body, date and venue where applicable.

Select a child in the tree or directly in the scene. Its inspector supports local position, scale, rotation, opacity, depth and timing/animations; text supports typography, tokens and an override. Blank text continues to read current event content. Artwork can be replaced separately; replacing the root artwork remains compatible. Frames keep their live approved-photo binding unless an explicit image override is supplied. RSVP/Wishes still open the existing shared forms.

Children use persisted `parentId` and `part` fields, not Stage's structural `parent`. To preserve existing designs, their origin is the original responsive DOM slot: X/Y 50 and Scale 100 are unchanged. Position is an offset expressed in percentages of that slot; Scale changes the child without reflowing neighbours. Existing authored transforms (paper lift, frame tilt and centering) compose with these local transforms. Camera/parent transforms carry the children. Send to back/Bring to front operate among siblings. Hiding a child preserves its layout slot so other frames do not jump into its place. Reset prop restores the child's bound content and default local transform.

Parent movement, opacity, hiding and locks propagate through the real DOM hierarchy. Children follow the nearest parent's timing unless given an explicit layer track. Independent child timing is still masked by parent visibility; it cannot resurrect a hidden parent. Parent fades are applied once, not once per level. Scene-set moves, copies and deletion include descendants on both breakpoints; duplicate trees remap parent IDs and do not create a second set of generated children. Old configurations gain no-op child defaults at read time and keep existing parent geometry/animations. Unchanged children do not create config overrides.

The mocked-data browser check `.einvite-run/tools/qa-cinematic-children.mjs` covers child text, a live four-row programme, collapse/expand, independent frame nudging, hide-without-reflow and save/reload. Reports and screenshots are in `.einvite-run/qa/cinematic-children/`.

The logical project is version 1, split into config rows under `t15.layout.cinematic-project` solely to respect the existing 4,000-character config value limit. Geometry, sequence, cameras, effects, interactions, pacing, navigation and theme persist together. Whole-project saves preserve content keys outside that namespace. A corrupt or incomplete project falls back to legacy layout keys when available. Existing backend PRO policy and atomic project/default behavior continue to apply.

Scene-set duplication copies function assignments, effects, interactions and narrative timing on both breakpoints. Deleting a set disables actions whose trigger was removed, removes target effects, and prunes deleted return/reveal set references. Moving its layers instead preserves their functions. Undo/redo restores the complete project snapshot. Deleting a beat removes its owned timing/content moments; references to the removed timing/destination are unavailable rather than falling through to a hidden camera keyframe.

Shared RSVP/Wishes forms, validation, photo approval, feature gating and submission APIs remain platform functionality. The editor configures their cinematic triggers and presentation, not their business rules. Photo frames show only approved, non-hidden photos, bounded by the authored frame/photo limits. Theme tokens recolor generated UI, not pixels inside uploaded artwork.

## Verification

Unit coverage includes legacy migration, direction round trips, malformed values, effect sampling, breakpoint overrides, pacing holds/inverse mapping, functional duplication/deletion, narrative sanitization, approved-photo filtering and interaction lifecycle/retargeting.

Local browser checks are in `.einvite-run/tools/qa-cinematic-phase-{9,11,13,14,15,21}.mjs`; their screenshots/reports are under `.einvite-run/qa/`. Phase 21 exercises editor changes, save/reload, narrative overrides, information-dialog keyboard behavior and both viewport sizes. These browser fixtures mock API responses to avoid modifying a real invitation. Backend tests cover atomic config persistence and starting-design capture. Running QA does not deploy, apply migrations, or edit a production database.
