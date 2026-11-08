# Template consistency execution plan

Status: Phases 1–2 completed; independent Phase 3 repairs completed. Waiting for the T4 layout-compatibility decision in TEMPLATE_CONSISTENCY_PROGRESS.md. Phases 4–7 have not started.
Date: 2026-11-08
Recovery checkpoint: `0d3a4fd` on `ae-unified`.
Implementation branch: `fix/template-consistency`.

## Objective

Correct the audited inconsistencies across T1–T16 and DataTemplate, then consolidate shared guest behavior without replacing template artwork or forcing Classic, Stage and Cinematic into one renderer. Source-audit findings are hypotheses about runtime impact until covered by tests or browser verification.

## Preservation contract

- Keep config keys, template IDs, stage/layer IDs, authored sheet IDs, tombstones, per-breakpoint deltas and custom geometry.
- Preserve starting-design inheritance and true-override storage. Do not seed defaults or rewrite existing configs to make renderers consistent.
- Protect whole-bag PUT pruning, template switching, reset, undo/redo, role restrictions and server-side tier gates.
- Separate bug fixes from capability expansion. Existing unsupported controls must not cause stored values to be deleted.
- Keep T5 envelope, T7 horizontal ceremony and T15 cinematic sequence behavior.
- T8/T9 are prototypes: audit and test them, but production feature expansion/Adjust parity remains a separate product decision.
- No production migrations, deployment or production-data changes in this work.
- Preserve legacy formatting, empty-value fallbacks and playback defaults unless an explicit supported option changes them.

## Coverage and baseline

Before implementation, run the existing frontend suite, lint/type/build checks and applicable backend tests. Record pre-existing failures rather than quietly fixing unrelated work. Capture current renderings and representative effective config bags without personal data.

Cover all numbered templates plus at least one authored composition with multiple stages and named sheets. Fixtures must include missing config, inherited defaults, explicit overrides, mobile/desktop layouts, hidden/deleted layers, long text, empty/populated media and optional sections.

Verify these paths:
1. Organizer Details editor and normal standalone preview.
2. Adjust editor at mobile/desktop breakpoints, frame presets and Reveal where supported.
3. Sample/template-preview route and Template Studio/capture consumers where affected.
4. Public event route for supported event types.
5. Both numbered-template and authored renderer entry points.

## Phase 1 — Local defects and immediate resource fixes

Affected: T6 upload, T3 RSVP, T3/T4 image previews, T4/T5 countdowns.

- Replace T6 FormData callback argument with the existing object upload contract.
- Make T3 form/seating/completion mutually exclusive, preserving forced Seating preview.
- Revoke T3/T4 object URLs on replacement, removal and unmount.
- Make T4/T5 countdown effects respond to date changes without changing expiration presentation.

Surfaces: existing Details date inputs, Seating preview and Adjust selections; no new settings.
Regression: exact upload payload, failure/retry, form-to-seating-to-Back retaining values, disabled/organizer seating, RSVP closed, changing date without remount, URL cleanup.
Exit: focused regression tests and preview/public smoke checks pass. Commit separately.

## Phase 2 — Typed contracts and declared capabilities

Affected: all templates, TemplateRenderProps/SlotProps, schema, registries, preview/public loaders.

- Define concrete RSVP and photo-upload payload types at shared boundaries; remove permissive any/unknown where they hide callback mismatches.
- Introduce a small capability declaration for section ordering, forms, seating, navigation, media and editor family.
- Reconcile declarations with real renderer consumers before deriving UI controls from them.
- Consolidate public template loading onto the existing literal lazy registry, preserving loading/error/fallback behavior and authored routing.
- Give authored slot context an explicit supported media/preview contract.
- Keep schema defaults and backend role/tier policy aligned; capability declarations do not replace authorization.

Surfaces: Details fields, rail visibility, Adjust availability and preview payload forwarding.
Regression: every template ID/code, unknown template fallback, lazy loading, authored route, renderer/schema agreement, lower-tier inherited layouts, full-config save without loss.
Exit: capability matrix is executable and no renderer is unintentionally eagerly imported.

## Phase 3 — Section order, visibility and navigation

Affected repairs: T1–4/T6; T8/T9 prototype work is tracked separately.
Regression coverage: T5/T7/T10–16 and authored compositions.

- T1–3: align DOM/keyboard order with already-working visual order.
- T6: render from resolved order rather than a fixed component sequence.
- T4: define logical section mapping around hero/details before moving content; preserve existing t4-details/t4-schedule anchors.
- T8/T9: document fixed sequence and unconditional sections; implement parity only when prototype scope is approved.
- Use a single resolved section list for render, navigation and applicable Adjust lists.
- Ensure shared tracking handles actual rendered order, hidden nodes, layout changes and T7 rail grouping.
- Consolidate ordinary scroll behavior with reduced-motion handling while preserving T15 timeline navigation.
- Retain authored stageIds order and T15 sequence semantics; do not reinterpret them as ordinary section.order.

Surfaces: section reorder/removal, Details rail, Adjust stage selection, menu controls.
Regression: noncanonical order, exclusions, newly available content, no data, Photo Booth toggle, focus order, deep links, initial highlight, resize, rail stack/row, custom labels/icons/menu positions.
Exit: order, targets and highlights agree in editor preview and public.

## Phase 4 — Shared guest interaction controllers

Affected: migrate T1–6/T16 incrementally; retain shared slots in T7/T10–15/authored. T8/T9 receive only approved prototype scope.

- Extract behavior independently of markup: RSVP state/submission/normalization, table capacity and selection, Wishes submission, upload progress/errors/retry.
- Reuse controllers in existing visual components instead of replacing template designs.
- Unify hidden-answer normalization and event-type rules. Keep current supported controls scoped correctly.
- Add missing T6 seating support only through the capability declaration and feature gate.
- Standardize duplicate-submission protection and useful error feedback.
- Share client upload validation with backend-compatible file constraints; avoid inventing a conflicting limit.
- Preserve optional Wishes-to-photo flow and T5 family-side metadata.
- Keep existing button/inline form projection on T7/T10–14; do not serialize projected geometry over stored layouts.

Surfaces: RSVP/Wishes field controls, Seating settings, inline/popup options, forced form/seating Adjust views.
Regression: attending/declining, closed RSVP, fields hidden, party limits, no/full/insufficient tables, changed party size invalidating selection, organizer mode, network rejection, retry, double action, Wishes/photo gating and payload equality.
Exit: migrate and commit one family at a time, with old visual layouts unchanged.

## Phase 5 — Explicit preview and dialog behavior

Affected: all template entry points, shared slots, T4/T5/T6 overlays, T15 interactions, T16 dialogs, authored sheets.

- Define display-only preview, interactive simulation and live guest modes explicitly.
- Centralize the write boundary so previews cannot persist and do not accidentally claim real submission success.
- Preserve deliberate master-preview simulations with clearly defined behavior.
- Forward mode consistently through wrapper, standalone, sample/capture and authored/public paths.
- Share dialog dismissal, Escape, focus entry/return, containment, scroll locking and accessible labeling while retaining template-specific visuals.
- Preserve forced-open editor sheets and selection-driven form steps.

Surfaces: both Details and Adjust previews, normal guest dialogs and lightboxes.
Regression: no request from preview, honest status copy, interactive steps still reachable, editor selection, Escape/backdrop/close, keyboard-only flow, focus return, background scroll restoration.
Exit: common preview and dialog contract tests pass across all families.

## Phase 6 — Music, media, utilities and long lists

Affected: all templates where supported; capability expansion is incremental.

- Consolidate audio lifecycle/state, including play rejection, URL/loop updates and cleanup. Fix T6 stale audio instance and optimistic playing indicators in Stage shells.
- Preserve existing autoplay/click-to-play defaults and suppress preview audio consistently.
- Centralize media URL handling for relative uploads and external URLs.
- Share countdown calculation with explicit cadence/expiration options, preserving T13 minute display and legacy zero/null behavior.
- Introduce explicit config lookup semantics; do not globally replace || with ?? and change existing saved empty-string rendering.
- Share date/calendar formatting helpers with per-template locale/format options.
- Reconcile calendar/map controls with renderer support.
- Reuse batched Wishes rendering while keeping existing copy/layout and clarifying that DOM pagination is not server pagination.
- Expand Couple Gallery only where declared; preserve existing portraits/extras and keep guest Photo Booth gating independent.
- Integrate authored media only with explicit composition support, never by injecting unsolicited layers.

Surfaces: Details music/date/venue/gallery controls, navigation gallery item, Adjust media layers.
Regression: blocked/failed playback, track replacement/removal, loop change, no duplicate player, grid/carousel and ordering, deleted media, empty gallery, both URL forms, expiration/date editing, large guestbook, locale/time and keyboard scrolling.
Exit: functional checks and representative media-heavy renders pass.

## Phase 7 — Reduce repeated rendering setup and measure

Affected: T7/T10/T13/T14 Stage shells, T1–6/T16 overlays, T11/T12 flow wrappers; authored renderer as shared consumer.

- Extract repeated Stage orchestration only after behavioral contracts stabilize.
- Parameterize assets, theme tokens and slot overrides; keep T7 rail and T13 visual slots explicit.
- Extract common overlay mechanics with explicit shipped-prop/slot exclusion hooks for T11/T12.
- Keep collision-avoidance differences, frame-scoped sizing and Cinematic engine boundaries.
- Review timers/listeners/context updates using measurements before optimizing.
- Compare lazy chunks, request count, long-list DOM size, renders and listener/timer behavior against baseline. Make no speed claim without evidence.

Surfaces: all existing Details/Adjust controls and all preview/public render paths.
Regression: saved geometry/tombstones unchanged, no duplicate slots/art, reveal/parallax and reduced motion, narrow/landscape/desktop frames, no overflow, capture readiness and thumbnails.
Exit: full regression suite, build, public/editor visual matrix and measured optimization results documented.

## Delivery and rollback

- One focused commit per local fix or family migration; no all-template rewrite commit.
- Each implementation commit records affected templates, checks and compatibility implications.
- Run targeted checks first; run the full suite/build at integration boundaries.
- Use disposable test databases if backend behavior changes; never apply migrations to production.
- Roll back individual implementation commits with git revert. ae-unified at 0d3a4fd remains the original checkpoint.
- Do not reset/delete the implementation branch as a recovery method.
- Merge only when the full template matrix passes and saved settings/layouts round-trip without loss.
- After merge, follow repository guidance: build and scan for orphan Wedding-named files and duplicated members.
