# Template lazy loading rollout

Status: phases 1–5 implemented on `ae-unified`, following the phase 3 visual approval.
No database, uploaded artwork, package versions or public invitation renderer was changed.
No deployment was performed.

## Phases

1. Record editor loading, browser JavaScript and development-server memory/CPU baseline.
2. Declare a shared, typed registry with explicit dynamic imports for all 15 built-in templates.
3. Migrate Customize's iframe renderer; preserve authored templates, drafts and editor messaging.
   **Review checkpoint: Customize → Adjust before continuing.**
4. Migrate standalone template previews, including starting-design defaults and thumbnail readiness.
   Review the public loader separately; do not change its rendering behavior unnecessarily.
5. Repeat measurements, audit remaining eager imports, verify the production build and commit.

## Current implementation

- `templateComponents.tsx` declares stable, module-scope `next/dynamic` components. SSR remains enabled.
- `templateTypes.ts` shares existing form/editor contracts without importing template implementations.
- `TemplateWrapper.tsx` chooses a single registry entry, retaining Template 1's unknown-ID fallback.
- The existing authored `DataTemplate` path is unchanged and bypasses the built-in registry selection.
- A shared Suspense boundary reserves preview space and announces loading accessibly.
- `TemplateLoadBoundary` offers an explicit preview reload after a rejected chunk, rather than
  silently rendering a different template. The iframe restores its local draft after reload.
- A readiness sentinel commits with the actual template, not the loading placeholder. The iframe
  queues the most recent navigation while a chunk loads, and resets that gate on a template switch.
- Changes to selected layers/config do not recreate the template component or restart its state.
- Standalone `/template-preview/[code]` uses the same registry and preserves all sample data.
  Starting-design defaults resolve before the selected template mounts. Unknown codes show an
  unavailable state rather than marking an empty preview ready.
- Thumbnail readiness waits for the committed template, initial image loading/decoding and fonts,
  then the existing one-second settling delay. Asset waits are bounded at ten seconds and clean up
  on route changes; broken images do not hang capture. This is not an asset-health assertion.
- The thumbnail generator now includes Painted Promise; existing thumbnails were not overwritten.
- The public invitation route already dynamically imports its selected template and remains unchanged.
  Shared editor stage definitions/metadata still load eagerly; these are not template renderers.

## Phase 3 measurements

The same mocked-data scenario opens Painted Promise, edits its heading, scrubs camera beats, then
switches to Roman Garden, Classic Rose and back. Separate local dev-server processes use existing
disk caches; these are observations, not isolated cold-cache benchmarks or a production RAM estimate.

| Initial editor workload | Before | Phase 3 |
| --- | ---: | ---: |
| Template implementations found in downloaded JS | All 15 | Only 15 (Painted Promise) |
| JavaScript requests | 50 | 40 |
| Decoded development JavaScript bytes | 11,811,545 | 9,327,572 |
| Time until preview mounted | 1,615 ms | 1,355 ms |
| Server resident memory after editor interactions | 971 MiB | 1,291 MiB |
| Server resident memory after template switching | 995 MiB | 1,307 MiB |

Initial development JS decreased about 21%. **No server RAM reduction is demonstrated**; the
earlier 6.5 GB spike was not reproduced. Dynamic boundaries still require compilation/cache work,
and unrelated editor infrastructure remains eager. Do not present this as a memory-leak fix.

## Final measurements

Standalone Painted Promise, using the same mocked starting design before and after migration:

| Initial standalone workload | Before | Final |
| --- | ---: | ---: |
| Template implementations found in downloaded JS | All 15 | Only 15 (Painted Promise) |
| JavaScript requests | 35 | 24 |
| Decoded development JavaScript bytes | 7,907,361 | 5,184,539 |
| Readiness marker | 1,931 ms | 2,183 ms |

Initial standalone JS decreased about 34%. Readiness is intentionally stricter now; its duration
is not a like-for-like speed benchmark. All 15 sample previews reached readiness without page errors.
The final editor check remained at 40 JS requests / 9,329,185 decoded bytes, loading only template 15
initially, with no page errors. The user's existing warm dev server measured 2,023 MiB after editing
and 2,029 MiB after switching. These runs share compilation history and are not controlled RSS comparisons.

A temporary production server on port 3200 also passed all 15 preview smoke tests with no page
errors. Painted Promise requested 825,849 decoded JS bytes across 15 requests. Production minification
removes the function names used by the development implementation detector, so that detector cannot
prove production chunk isolation. Server RSS after the suite was approximately 191 MiB; this is a
short local smoke test, not a VPS capacity/load test. The temporary server was stopped afterward.

## Verification

210 frontend tests, TypeScript, targeted ESLint and the production build passed. The first final
build attempt hit a Turbopack Google-font resolver error; an unchanged retry succeeded.
Browser regressions cover cinematic
camera/timeline controls, scene-set edits, animation retiming, save/reload, shared form triggers,
responsive previews, Classic/Stage/Cinematic switching and authored rendering. An intentionally
failed chunk recovered through Reload preview without losing the draft. A deliberately delayed
Stage chunk retained navigation until the target section existed.

Private mocked-data browser runners and detailed reports live under ignored `.einvite-run/`:
`tools/qa-template-loading.mjs`, `tools/qa-template-loading-lifecycle.mjs`, and
`qa/template-loading/{baseline,phase-3-verified,lifecycle}/`. Existing cinematic phase 14/21
browser suites were run against isolated port 3100. No real invitation writes were made by QA.
Final standalone/editor measurements and cinematic phase 14/21 reruns used the existing port 3000
server without restarting it, again with mocked APIs. Additional reports are in
`qa/template-loading/{standalone-baseline,standalone-final,final}/`.
The production smoke report is under `qa/template-loading/standalone-production/`.
