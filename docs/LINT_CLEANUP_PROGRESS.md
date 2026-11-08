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
