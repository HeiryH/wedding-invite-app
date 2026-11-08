# Frontend lint cleanup execution plan

Execution complete. See [validated results and commits](LINT_CLEANUP_PROGRESS.md).

Status: planning only; no application changes authorized or implemented by this plan.
Starting branch: `fix/template-consistency`.
Starting implementation checkpoint: `3d8c80a`.
Scope: resolve the remaining frontend lint errors and warnings without changing invitation designs, saved settings, permissions or public routes.

## Verified baseline

The full ESLint JSON report contains 159 errors and 92 warnings. Comparison with recovery checkpoint `0d3a4fd` found no new remaining diagnostics: the checkpoint had 193 errors and 102 warnings. Counts are diagnostics, not necessarily unique source locations; some rules report the same link/dependency more than once.

| Rule | Errors | Warnings |
| --- | ---: | ---: |
| `@typescript-eslint/no-explicit-any` | 58 | 0 |
| `react/no-unescaped-entities` | 57 | 0 |
| `@next/next/no-html-link-for-pages` | 21 | 0 |
| `react-hooks/purity` | 12 | 0 |
| `react-hooks/set-state-in-effect` | 8 | 0 |
| `react-hooks/use-memo` | 1 | 0 |
| `react-hooks/refs` | 1 | 0 |
| `prefer-const` | 1 | 0 |
| `@next/next/no-img-element` | 0 | 48 |
| `@typescript-eslint/no-unused-vars` | 0 | 29 |
| `react-hooks/exhaustive-deps` | 0 | 14 |
| Unused ESLint suppression | 0 | 1 |

Current verification baseline: 404 frontend tests, 206 backend tests, TypeScript and production build pass. Lint does not pass.

## Preservation rules

- Keep existing config keys, effective starting defaults, override/pruning semantics, stage/layer IDs, tombstones and both breakpoint layouts.
- Preserve Minimal Noir's approved grouped composition, Roman Garden's rail, Dreaming Floral Sky's envelope and Painted Promise's camera/timeline.
- Keep normal public, display-only preview and Studio simulation behavior separate. Do not reintroduce preview writes or false submission success.
- Preserve HttpOnly-cookie authentication, role/tenant checks, redirect destinations and loading behavior. Do not expose protected content during initialization.
- Do not delete or rename legacy routes merely because their filenames still say Wedding/Couple. Verify their consumers and adapt types at existing boundaries.
- T8/T9 receive lint/correctness fixes only; no productionization or Adjust parity.
- Do not lower ESLint severities, add broad ignores, blanket-disable rules or replace `any` with unsafe casts. Narrow exceptions require an actual semantic reason and a source comment.
- No deployment, production migrations, dependency upgrades or broad formatting pass.

## Phase 0 — Reproduce and inventory

1. Capture fresh ESLint JSON and text reports, TypeScript results and frontend test results before editing. Confirm the checkpoint and clean working tree.
2. Group diagnostics by rule, unique call site and affected flow. Keep duplicate diagnostics visible in reported totals but fix each source once.
3. Record which findings touch authentication, network effects, Stage/Classic/Cinematic rendering, marketing pages or unused code.
4. Retain baseline mobile/desktop screenshots for T4/T5/T6/T7/T15 and representative public/admin pages affected by later phases.

Exit: reproducible baseline and per-phase inventory; no unrelated source changes.

## Phase 1 — React correctness and effect lifecycles

Target: 22 React-rule errors and 14 dependency warnings. Do not apply dependency autofixes blindly.

### A. Stable Fairy Garden particles — 12 purity errors

Files:
- `Template6-fairygarden/components/FallbackBackground.tsx` — 4 diagnostics.
- `Template6-fairygarden/scenes/PetalRain.tsx` — 8 diagnostics.

Generate particle initial conditions deterministically from a stable seed and particle settings. Keep per-frame mutation in the animation loop/ref-owned simulation, outside rendering. Preserve particle count, spawn ranges, palette and motion intensity. A memo containing Math.random is not sufficient evidence of render purity.

Checks: repeat render and hydration do not relocate particles; unrelated config/RSVP changes preserve the field; intentional count/seed changes regenerate correctly; WebGL fallback, reduced motion and unmount/material cleanup work.

### B. Shared reveal ref — 1 ref error

File: `_shared/hooks/useStageReveal.ts`.

Move ref synchronization into committed effects or observer/event updates, choosing a model that preserves monotonic reveal state and handles multiple observer entries in one batch. Keep newly mounted stage discovery after reorder/toggle and retain cleanup.

Checks: first reveal, scroll back without replay, section insertion/removal/reorder, mobile/desktop, reduced motion and T7 rail behavior. Do not trade the lint error for stale observer state.

### C. Initialization and subscriptions — 8 effect errors

Affected:
- Host-admin and organizer-admin layouts.
- CookieConsent, EventUrlField, GettingStartedChecklist and TemplateDeck.
- T6 useWebGLSupport and shared useReducedMotion.

Classify each effect: derived value, client-only initialization, external-store subscription or request lifecycle. Derive values during rendering where safe; use an SSR-safe subscription/snapshot for external state; keep real synchronization in effects. Preserve loading states and server/client snapshot agreement.

Checks: authenticated/unauthenticated routes, redirects, no private-content flash, first-visit/returning cookie consent, URL-edit reset behavior, checklist persistence, card selection, WebGL failures and live media-query changes.

### D. Dependency and memo contracts

Affected: host/organizer/super-admin dashboards and event pages, super-admin photos/edit pages, T4, T7, CinematicAdjustPanel and CinematicTimeline.

Hoist Roman Garden's gallery-order lookup into a named dependency. For request effects, stabilize callbacks and handle cancellation/stale responses before completing dependency arrays. Derive available tabs/selection where possible. Preserve intentional selection, undo and timeline behavior; do not add new loops, repeat requests or reset unsaved forms.

Checks: request counts, event/route changes, rapid tab switching, stale-response handling, gallery reorder, T4 photo stack, Cinematic selection and undo/redo. Confirm every targeted hook rule passes.

Delivery: separate focused commits for particles, reveal, initialization and request/editor effects.

## Phase 2 — Replace loose types at real boundaries

Target: 58 explicit-any errors.

Groups:
1. Public invitation/photo/RSVP/template/Wishes pages and API error handling.
2. Host, organizer and super-admin dashboards/event CRUD, guest/access tabs, packages/hosts.
3. Login/reset-password/auth service.
4. Template4 drag events and indexed form fields, Template5 props, T8/T9 style/config maps.

Use existing API DTOs and template guest contracts. Handle caught values as unknown, narrowing Axios responses through a small shared error helper where useful. Give dynamic field names explicit unions/maps and use library event types already installed. Keep API data adapters explicit for legacy pages.

Checks: TypeScript after each group; typed RSVP/upload contracts still reject invalid payloads; error message fallbacks, table selection, typed field updates, drag gestures and create/edit payloads remain correct. No as-any, double casts or ts-ignore substitutions.

Delivery: one commit per group, with targeted validation.

## Phase 3 — Mechanical JSX, navigation and dead-code cleanup

Targets: 57 JSX-entity errors, 21 internal-link diagnostics, 29 unused-variable warnings, 1 prefer-const error and 1 obsolete suppression.

- Escape literal JSX quote/apostrophe text with equivalent entities or string expressions. Do not alter rich-text HTML, translations, stored values or displayed punctuation.
- Use Next Link for ordinary internal navigation. Keep external links, downloads, mail/tel actions and deliberately full-reload flows native; document any legitimate exception individually.
- Remove unused imports/variables only after checking initializer side effects. Retain callback parameters where their API/signature needs them, with appropriate names/types.
- Change the non-reassigned Hijri-conversion variable to const and remove the unused disable directive.

Checks: focused route/back-navigation tests; visible text and calendar/download behavior unchanged; no migrations/route deletion; targeted lint and TypeScript pass. Do not write tests that merely mirror an entity replacement.

## Phase 4 — Review image warnings individually

Target: 48 plain-img warnings.

Classify each image before changing its implementation:
- Ordinary content photos and marketing thumbnails: use Next Image where sizing, source policy and optimization are suitable.
- User-uploaded/external/CDN/blob media: preserve URL handling and supported sources; do not introduce blanket remote-host access or an unnecessary proxy requirement.
- Layered artwork, alpha frames, generated effects and editor references: preserve exact DOM geometry, clipping, eager/lazy behavior, canvas measurements and loading/readiness. Use the appropriate image component configuration or a narrow documented native-img exception where native behavior is intentional.

Every warning must receive a reviewed disposition. An intentional native image is not automatically a performance defect. No global rule disable or unsupported claim that converting all images improves speed.

Checks: mobile/desktop and Reveal frames, portraits and guest/couple galleries, external/relative/blob sources, image fit/stack/lightbox, capture readiness and thumbnail generation. Compare network requests and layout shift for changed loading paths. Do not claim improvements without measurements.

Delivery: separate content-image and engine/editor-image commits. Human input is needed only if a source-host policy, infrastructure cost or visible design change is unavoidable; prepare the exact proposal first.

## Phase 5 — Integration and regression gate

- Run full ESLint with --max-warnings=0. The target is zero errors and zero warnings with unchanged rule severities; all intentional exceptions must be local, justified and free of unused-disable warnings.
- Run all frontend tests, TypeScript and production build. Run backend tests if shared API contracts or backend behavior change.
- Render all 16 templates and an authored fixture at mobile/desktop sizes. Exercise touched Details/Adjust surfaces, selected layers, saved layouts/tombstones, inline/popup forms, preview write suppression, audio and media.
- Recheck T7 stack/rail, T5 envelope and T15 camera/timeline; verify T4 grouped ordering and prototype restrictions.
- Smoke-test admin authentication, event editing, guests/photos, internal navigation and error recovery with mocked/test data.
- Record before/after diagnostic totals, exceptions, checks and any measured performance changes.

Exit: no regression, no hidden lint debt, clean working tree and reviewable commits. If a genuine product decision blocks a narrow part, document it explicitly rather than claiming the phase is complete.

## Execution and rollback

Continue on `fix/template-consistency` after the user initiates execution; do not implement during this planning pass. Record the planning commit as the lint-cleanup starting point. Keep each phase independently revertible and update progress after validation. Push only verified changes; do not merge or deploy as part of lint cleanup.
