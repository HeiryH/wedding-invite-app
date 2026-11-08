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
