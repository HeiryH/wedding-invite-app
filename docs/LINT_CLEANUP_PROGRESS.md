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
- Validation: original full suite plus particle/reveal tests passed (408); URL/storage/auth targeted tests passed (5 additional). TypeScript passed after correcting the test fixture DTO.
- Production build validation is in progress: Turbopack hit the previously seen Google-font resolver failure; webpack cannot serve as a fallback because existing template CSS contains global-only selectors rejected by that bundler. No font/CSS behavior has been changed to bypass either issue.
