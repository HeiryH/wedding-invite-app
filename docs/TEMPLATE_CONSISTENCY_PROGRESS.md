# Template consistency execution progress

Branch: `fix/template-consistency`. Recovery checkpoint: `0d3a4fd`.

## Baseline — 2026-11-08

- Frontend: 51 test files, 338 tests passed.
- Backend: 206 tests passed (existing compiler/analyzer warnings).
- TypeScript: `npx tsc --noEmit` passed.
- Lint: existing 295 problems (193 errors, 102 warnings); full output locally at `/tmp/template-consistency-baseline-lint.log`.
- Production build: existing Next/Turbopack Google-font resolver failure (20 errors), before fixes. Output: `/tmp/template-consistency-baseline-build.log`.
- Render smoke: all 16 numbered templates plus an authored two-stage/named-sheet fixture rendered on mobile and desktop without page errors, using the checkpoint in a detached local worktree. Screenshots/results: `.einvite-run/consistency/baseline/`. Only the worktree's tooling root was adjusted to resolve shared node_modules; app source was unchanged.
- Webpack fallback is also unsuitable without unrelated changes: existing impure `:root` CSS-module selectors. The normal Turbopack development server renders the fixtures successfully.
- Baseline is not production-build clean; these unrelated failures are not silently counted as fixed.

## Phase 1 — completed

- T6 delegates photo payload construction to the existing shared upload helper.
- T3 shows one RSVP state at a time; forced Seating preview still works for closed RSVP.
- T3/T4 revoke replaced, cleared or unmounted object-URL previews.
- T4/T5 use a small shared countdown hook that reads the latest target date and retains their zero-at-expiry display.
- No config values, layer IDs, layout geometry or schema defaults changed.

Verification:
- Full frontend suite: 53 files, 344 tests passed; TypeScript passed.
- Six new targeted tests cover payload shape, seating/Back/submission, forced preview, object-URL cleanup and countdown target/timer cleanup.
- Mobile/desktop browser render smoke for T3–T6: no page errors; screenshots at `.einvite-run/consistency/phase1/`.
- Public-route browser flows for T3 RSVP/seating and T6 multipart upload passed with a fully intercepted mock API (no real writes). This verifies template-to-public-callback wiring, not backend persistence.
- `git diff --check` passed. Existing lint/build failures remain baseline limitations.

## Phase 2 — completed

- Added typed RSVP/photo/Wishes contracts across template callback boundaries, preserving T5's optional Wishes metadata and the existing guest-side API adapter.
- Added a data-only capability registry for all 16 templates and authored compositions. Existing Seating, shared Navigation, Gallery, form-layout and RSVP-field schema scopes now derive from it without adding/removing controls. Inline form projection uses the same capability declaration.
- Public invitations now render through TemplateWrapper and the literal lazy registry, including its loading/error boundary and unknown-ID fallback. Numbered templates add no metadata request. Custom authored IDs resolve their composition through the existing public template service; previously the Event-to-Wedding adapter supplied no authored JSON.
- Authored slot context now explicitly carries couple media and preview-only state; no new gallery or layers are injected. Composition order and layout keys are retained.
- Backend policy, authorization, tier gates and config persistence are unchanged.

Verification:
- Full frontend suite: 55 files, 367 tests passed; TypeScript passed.
- New tests cover all template capability/control scopes, rejected callback shapes at compile time, public typed RSVP mapping, authored composition order, unavailable metadata and fallback. Wrapper tests cover media forwarding and existing lazy loading/readiness.
- All 16 templates and the authored fixture rendered on mobile/desktop without page errors: `.einvite-run/consistency/phase2/`.
- Mock-API public browser flows passed for T3, T6 and custom authored rendering. No data persisted.
- New contract/capability/public-test files pass targeted ESLint. Existing global lint/build baseline failures remain.

## Phase 3 — completed independent work; T4 decision pending

- T1–3 now render saved section order into DOM/focus order using a shared wrapper; existing IDs, CSS, anchors and saved geometry remain intact. Reordering keeps entered RSVP state.
- T6 renders its existing section components from the resolved order, preserving exclusions/content/feature availability.
- T1–3/T6 use the shared scroll tracker and scroll helper. Tracking sorts actual screen positions, excludes non-rendered targets and uses the pinned preview-frame height. Shared scrolling respects reduced motion.
- Capabilities reflect these repairs; unsupported T4/T8/T9 behavior is not falsely declared repaired.

Verification:
- Full frontend suite: 57 files, 376 tests passed; TypeScript passed.
- New regression tests cover order/exclusions/content availability for T1–3/T6, retained RSVP answers across reorder, tracking with mismatched source/screen order, and reduced-motion navigation.
- All 16 templates and an authored fixture rendered on mobile/desktop with no page errors: `.einvite-run/consistency/phase3/`.
- T1–3/T6 custom-order browser checks passed in both Adjust-style standalone preview and public routes at 390 and 1440 pixels. Saved added overlays remained visible and navigation reached its section. All public API requests were mocked; Next's development-only indicator was hidden in this interaction harness because it intercepted T6's menu clicks.
- T7 stacked and horizontal-rail browser navigation checks passed.
- New shared wrapper/scroll/test files pass targeted ESLint. Existing global lint/build baseline failures remain.

## Human gate — T4 layout compatibility

T4 is not six independent logical sections. Its current physical containers are:

1. `hero`: cover and portrait.
2. `t4-details`: countdown, invite body, configurable ceremony text, dynamic itinerary, ceremony facts and reception facts.
3. `t4-schedule`: a separate hardcoded five-row schedule plus the second portrait.
4. `t4-rsvp`, `t4-wishes`, `t4-photobooth`: independent reorderable sections.

Existing Adjust data is stored against those physical containers. Splitting or relocating their contents changes the reference boxes of saved decorations and nudges. In addition, the hardcoded schedule is distinct from the organizer's saved itinerary; treating both as one section without a decision would silently choose which guests see.

Choose the compatibility policy before changing T4:

### A — Preserve the grouped design (recommended for this consistency pass)

Keep the existing physical containers, layouts and schedule presentation. Expose ordering constraints truthfully: the grouped cover/details/schedule composition remains intact; only independent functional sections reorder. Align editor/navigation labels with actual blocks and keep stored logical order values untouched for future conversion. This resolves misleading controls but does not claim full independent ceremony/programme ordering for T4.

### B — Make ceremony/programme independent

Create explicit ceremony and programme sections, choose one organizer-driven programme presentation, and update navigation/Details/Adjust mappings together. Existing invites with saved grouped layouts must retain a legacy render path until explicitly converted; new independent layouts require visual approval and a tested conversion strategy. Existing layout bags must never be silently rewritten or reinterpreted in a different coordinate box.

No T4 structural changes have been made. Phases 4–7 have not started. T8/T9 productionization/Adjust parity remains a later, separate decision as required by repository guidance.

## T4 gate resolved — option A approved

The user selected preservation of Minimal Noir's grouped composition. The editor now projects its grouped cover/details/programme entries ahead of the independently reorderable RSVP/Wishes/Photo Booth entries. Movement swaps only independent entries in the original saved logical order; it never rewrites grouped layout data. Grouped entries do not offer misleading move/remove controls. Existing content and the decorative hardcoded schedule remain unchanged. Prototype/cinematic/fixed compositions do not gain unsupported reorder controls.

Validation: two ordering-policy tests plus the four existing workspace tests passed; TypeScript passed before subsequent phase work. T8/T9 productionization remains excluded.

## Phase 4 — completed

- Guest forms retain their template markup/state but now share an immediate submission lock, failure handling and retry semantics. Success/reset actions run only after a successful callback. T16 retains its inline error presentation; the cinematic RSVP wrapper continues to propagate real failures to the shared form controller.
- Shared RSVP normalization enforces party limits, clears invalid/stale table selections and omits wedding family-side answers for other event types. SeatingStep/SeatingChart share capacity rules; T16 uses the same rules.
- Photo callbacks validate the backend's current nonempty/image/10 MB/JPG-PNG-GIF-WebP constraints. Server signature validation remains authoritative. T4's upload sheet retains file/name on failed upload.
- T6 now consumes seating props, supports Back/table selection and forced Seating preview, and exposes the existing gated Seating mode control through capabilities. The public feature/tier gate and organizer-assignment mode remain the authority.
- No form-layout keys, custom geometry, optional wish-photo flow or T5 Wishes metadata were removed. Prototype renderers received shared request handling, not productionization or Adjust parity.
- Fixed an editor edge case so removing all independently reorderable sections does not remove the Restore control.

Validation: TypeScript passed; full frontend suite passed at 59 files / 383 tests. Shared guest-rule/controller files pass ESLint. Mock public callback checks passed (T3, T6, authored), and T3–T7/T16 mobile/desktop render smoke passed. Evidence is under `.einvite-run/consistency/phase4/` and `/tmp/consistency-phase4-*.log`.

## Phase 5 — completed

- GuestRuntime supplies explicit live/preview/Studio-simulation modes and accessible action feedback. Display-only preview blocks the shared submission boundary before callbacks; no reset/success follows a blocked action. Studio RSVP simulation keeps its intentional step preview and labels completion as unsaved simulation.
- Wrapper, direct sample previews and public template-query previews use the same policy. Authored slots and Cinematic forms inherit it even when their visual editing state differs.
- A shared modal hook handles Escape, first focus, Tab containment, reference-counted body scroll locking and focus return. Shared sheets/photo lightbox, T4 upload, T5 RSVP/calendar, T6 RSVP, shared calendar and T15 information popups use it. Native dialogs retain native lifecycle behavior. Forced editor sheets retain their non-dismissable selection behavior.
- No template composition, saved config or form geometry changed.

Validation: full frontend suite passed at 61 files / 387 tests; TypeScript and targeted new-file ESLint passed. New tests cover all execution modes plus keyboard/focus/scroll restoration. Existing shared-sheet tests pass. Mock public flow checks and mobile/desktop render checks for T3–T7/T15/T16 passed. Local evidence: `.einvite-run/consistency/phase5/` and `/tmp/consistency-phase5-*.log`.

## Phase 6 — completed

- All supported music controls share one audio lifecycle hook, preserving T5/authored autoplay fallback and click-to-play elsewhere. State follows playback events/rejections, replaced URLs/loop settings dispose old players, and every preview mode is silent. T1–4 now opt into the existing shared click-to-play Music control; empty/unconfigured invites remain unchanged. Prototype T8/T9 do not gain music controls.
- Countdown implementations now use one external clock per cadence, with deterministic server snapshots, live target changes, explicit hide/zero expiration and T13's minute cadence retained.
- Media URL handling preserves external/CDN/blob/data/static URLs instead of blindly prefixing the API origin. Date/time helpers retain each template's existing locale/options. Config lookup explicitly preserves the legacy fallback-vs-intentional-blank distinction (T16).
- Supported guestbooks share 10-at-a-time DOM pagination while retaining their own cards and order. This is not network pagination. Prototype list presentation remains out of scope.
- Existing Couple Gallery templates retain placement/ordering/fit controls. An explicit authored Couple Gallery slot consumes already-available couple media; it never injects a gallery into existing compositions or enables an unrelated guest Photo Booth feature. Existing upload/editor scopes remain explicit.
- Calendar/map controls were checked against actual consumers: T5/T7/T16 retain their controls; templates without those actions do not gain dead controls.

Validation: full suite passed at 63 files / 394 tests before the additional autoplay-cleanup regression; final focused audio/utility/cinematic checks passed. TypeScript and new utility-hook ESLint passed. All 16 templates plus authored fixture rendered at mobile/desktop without page errors: `.einvite-run/consistency/phase6/`. No saved settings or geometry migrated.
