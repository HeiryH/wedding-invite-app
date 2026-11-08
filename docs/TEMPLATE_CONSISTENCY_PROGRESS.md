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
