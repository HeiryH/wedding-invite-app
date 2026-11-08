# Frontend lint cleanup progress

Execution branch: `fix/template-consistency`. Starting point: `b45075c`.
No merge, deployment, migration, dependency upgrade or saved-config rewrite is included.

## Baseline

- ESLint: 159 errors, 92 warnings (`/tmp/lint-cleanup-baseline.json`).
- Frontend: 404 tests passing.

## Phase 1 — React lifecycle and dependencies

- Stable seeded initial Fairy Garden particles preserve spawn ranges and runtime respawn motion.
- Stage reveal refs change only during external callbacks; batched arrivals accumulate and pending work is cancelled on cleanup.
- Storage-backed cookie/checklist/auth UI uses SSR snapshots and subscriptions. Protected layouts wait for the browser snapshot before redirecting.
- Reduced-motion uses a media-query subscription; WebGL capability is cached and the probe context released.
- URL validation derives pending/invalid state and ignores stale in-flight answers, including valid-to-invalid transitions.
- Deck resets are conditional on source changes. Gallery, scroll-spy and cinematic dependencies are explicit. Admin loading callbacks are stable and ignore route-invalidated responses; tab fallback retains existing behavior.
- Intermediate ESLint: 137 errors, 78 warnings; no remaining React hook diagnostics.
- Validation: all 413 frontend tests and TypeScript pass, including protected auth hydration, stale URL responses, storage snapshots, particles and stage-reveal lifecycle.
- Normal Turbopack production build passed on retry. The first attempt hit the previously seen Google-font resolver failure; webpack rejects existing global-only template CSS. No font/CSS changes were made to bypass these issues. The existing middleware deprecation warning is outside ESLint cleanup.

## Phase 2 — Explicit API and template contracts

- Replaced all 58 explicit-any diagnostics with unknown error narrowing, existing guest/wish/upload DTOs, finite input keys, Framer Motion drag types and CSS custom-property types.
- Axios errors validate remote message types; existing fallback messages and 404 handling remain.
- Admin guest input explicitly models omitted attendance/party-size defaults from the C# DTO; public RSVP remains strict. Request serialization is unchanged, including omitted defaults.
- Validation: TypeScript passed; full suite initially had 414 passing and one new-test mock failure (mock PUT lacked a response). Corrected mock, then all 5 API contract/error tests passed. No application failure was involved. Phase 5 reruns the full suite.
- ESLint: 79 errors, 78 warnings; no explicit-any or React hook diagnostics remain.

## Phase 3 — JSX, internal navigation and unused code

- Escaped JSX punctuation without changing rendered copy, and converted 17 distinct flagged internal anchors to Next Link (21 diagnostics included duplicate reports). External links/download behavior is unchanged.
- Removed unused imports, bindings and side-effect-free values; retained the used T4 swipe handler and always-visible T2 navigation. Removed only the obsolete T5 disable comment, retaining its effect/dependency list.
- TypeScript and all 415 frontend tests pass. ESLint: 0 errors, 48 warnings, all image-disposition warnings.

## Phase 4 — Image dispositions

- Reviewed all 48 warnings: 7 fixed-size images use Next Image with direct-source (`unoptimized`) loading; 41 native images have narrow, reasoned next-line exceptions. See `LINT_IMAGE_REVIEW.md` for each surface and rationale. No lint rule or remote-host policy changed.
- ESLint passes with `--max-warnings=0` (0 errors, 0 warnings). TypeScript and 415 existing tests pass; 3 additional Avatar source-contract checks pass for relative, external and blob sources.
- Normal production build passes (font resolver needed a retry). Backend: 206 tests pass.
- Compared public/admin photo grids against isolated pre-image commit `e6a7c61` at 390px/1440px: identical image boxes (within 0.1px), identical direct source and one request per image. No speed/bandwidth improvement is claimed.
- Browser renders: all 16 templates plus authored fixture, mobile/desktop (34 cases), no page errors. Public T3 seating, T6 multipart photo submission and authored renderer pass against mocked API. Saved-order/layout/navigation checks pass for T1–T3/T6 in preview/public, mobile/desktop. T7 stack/rail navigation passes.
- Final editor/admin integration checks are in progress. No real guest data or saved config was written during browser checks.
