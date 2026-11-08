# Template Studio

## First review milestone

Open **Super Admin → Themes → Edit master design**, or
`/super-admin/template-studio/7` for Roman Garden.

The organizer route and Studio both render `components/editor/CustomizationWorkspace.tsx`.
The organizer route uses event services. Studio uses a template id, synthetic preview content,
template asset uploads, and the Studio API. It never creates or updates a client event.
Stage and Cinematic editors keep their existing registries and rendering paths. Authored
templates still open their existing authoring editor; Studio rejects authored templates rather
than silently converting them or replacing their composition.

### Saved data

- `TemplateStudioDrafts`: one optimistic-versioned draft per template. Configuration and sample
  content are separate JSON documents. Body text, person descriptions and music URLs are sample
  content, never published design settings.
- `TemplateStudioRevisions`: immutable published config snapshots. The first publish records
  the previous defaults before adding the new revision.
- `TemplateConfigDefaults`: remains the live published design read by existing invitation and
  public preview endpoints. Client config overrides continue to win.

Publishing is transactional. A stale version or an external default edit produces a conflict.
**Load into draft** restores a revision without publishing it. Selecting **Current published
design** explicitly reloads live defaults and rebases a draft after external changes.

Publishing strips editor-only layer locks, validates layout JSON and complete cinematic chunks,
and checks local upload references. Client-owned uploads referenced by design data are copied
into template storage. Cinematic manifests are regenerated if asset replacement changes lengths.

### API (SUPER_ADMIN only)

- `GET /api/template/{id}/studio`
- `PUT /api/template/{id}/studio/draft` (`version`, `config`, `sample`)
- `POST /api/template/{id}/studio/publish` (`version`)
- `POST /api/template/{id}/studio/restore` (`version`, `revision`; 0 means live defaults)

`POST /api/template/{id}/studio/export` exports live defaults, not an unsaved draft. Exporting
does not publish. Its bundle includes the existing `design.json` plus `studio.json`, which records
the matching published revision (or explicitly marks externally changed/legacy defaults) and a
SHA-256 checksum of the exact design document. Reads share a single database snapshot.

`POST /api/template/{id}/studio/thumbnail` accepts a PNG/image capture, workspace version, and
`publishedDesignHash` from the Studio GET response. A stale capture is rejected rather than
replacing the picker thumbnail with an older design. The existing image-validation path applies.

### Verification completed

- Backend and frontend type/build checks.
- Isolated SQLite tests for draft persistence/isolation, publish history/restore, stale versions,
  external-default conflicts, content exclusions, missing assets, and cinematic asset rechunking.
- Existing default capture/inheritance tests, including cinematic lock stripping.
- Shared editor tests for template-only saving, publish confirmation, conflicts and preview controls.
- Reviewed migration SQL: two new tables and one index; no seed updates or credential changes.
- Migration applied to a fresh DB and a local database copy, then to the backed-up local DB.
  Client/event records and existing published defaults were compared with the backup unchanged.

### Review next

Restart the local API after building to register the new routes. Review Roman Garden's preview
against its published design, edit mobile/desktop layouts, save/reload a draft and inspect uploads.
Do not publish a test edit unless changing inherited live defaults is intended.

## Published design to repository

Use **Export published** in Studio, then validate its zip:

```sh
python3 scripts/bake-template-design.py /path/to/template-published.zip
```

Add `--apply` to write the validated snapshot to `backend/template-designs/<code>.json` and
its artwork to template-owned static paths. Rebuild both applications. The backend embeds shipped
designs and artwork; template metadata falls back to the baked thumbnail when no uploaded one is
set. Defaults resolve as shipped design → published database defaults → client overrides. This
does not clear published defaults, migrate clients, publish, or deploy. See
`backend/template-designs/README.md` for the contract. Cinematic projects are reassembled before
asset rewriting and rechunked afterward; exports of baked designs remain self-contained.

## Capture thumbnail inside Studio

Studio has **Capture thumbnail → choose this Studio tab → Review → Use as thumbnail**.
The default button captures the actual live preview, including the current draft content,
scroll position and video/animation frame. It crops to the preview's clipped container;
the surrounding workspace is excluded. Selection outlines and resize handles are temporarily
hidden. It does not reload the template, replay its videos or substitute sample names.

Run the frontend and API normally. **No capture script, renderer worker or worker key is needed
for this button.** The browser asks for tab-sharing permission on each capture. Choose the
Studio tab, rather than another tab, a window or a screen. Use Chrome or Edge if the embedded
browser does not support live tab capture. The entire preview must fit within the viewport;
reduce preview zoom if necessary. Captured resolution follows displayed size and screen density,
rather than forcing 390 × 700 or upscaling the image.

Sharing stops immediately after copying the preview pixels. Review uses a local Blob URL;
**Cancel** discards it without uploading. **Retake** closes the review before requesting another
capture. Only **Use as thumbnail** uploads through the existing SUPER_ADMIN-protected thumbnail
endpoint, `POST /api/template/{id}/thumbnail`. This updates the thumbnail independently of
publishing the master design. An animated preview continues naturally during the permission
prompt, so the image shows the frame captured after permission is granted, not a frozen frame
from the initial button click.

Targeted frontend tests cover region capture, verified current-tab coordinate cropping,
wrong-tab/window rejection, stream cleanup, permission cancellation, review, retake and explicit
upload approval. A real browser permission flow and visual verification on the template families
remain manual checks.

## Optional legacy queued renderer

The older published-design capture pipeline remains available to developer tooling. It rebuilds
a published preview separately and is not called by the Studio capture button described above.
Its setup and job lifecycle are documented below for that optional workflow.

### Optional worker local setup

Keep the frontend running at port 3000. Stop your existing local API, then run from the repository:

```sh
bash scripts/dev-template-capture.sh
```

The helper builds and starts the API on 5050 and a local renderer with a fresh shared worker key.
It does not print or persist that key and does not change any account credentials. It refuses to
stop an existing API process. Stopping the helper stops the API/renderer it launched. You may
need to sign in again if the API uses ephemeral development JWT keys.

The renderer requires the existing Playwright Chromium installation. It reads public previews
without an admin browser session. If Chromium is missing, install it using the project's normal
Playwright setup and rerun. A sandbox that prevents browser launch needs a permitted rendering
environment instead. No browser is added to the production API/container.

### Separate worker configuration

For a manually managed API, set `TemplateCapture__WorkerKey` (at least 32 random characters).
Run the renderer with the same value in `TEMPLATE_CAPTURE_WORKER_KEY`:

```sh
cd frontend
npm run studio:renderer -- --base http://localhost:3000 --api http://localhost:5050
```

Remote base/API hosts must use HTTPS. The browser only loads GET/HEAD/OPTIONS resources from
the configured frontend/API origins; it cannot navigate arbitrary user-supplied URLs. Worker
credentials are attached to worker API requests only, not to preview pages. The worker can claim
jobs and upload temporary PNGs; it has no permission to approve a thumbnail or access drafts.

### Job lifecycle and storage

- Admin endpoints: `POST /api/template/{id}/studio/captures`, `GET /{job}`, `GET /{job}/image`,
  `DELETE /{job}`, `POST /{job}/apply`. Every route requires SUPER_ADMIN and checks the owner email.
- Renderer endpoints: `/api/template-capture-worker/heartbeat`, `/claim`, `/{job}/complete`,
  `/{job}/fail`. They require `X-Capture-Worker-Key`; each claimed job also has a short-lived lease.
- `TemplateCaptureJobs` stores pending/processing/ready/failed/cancelled/applied status and the
  captured published-design hash. One active job per template/admin prevents duplicate requests.
- Pending/render leases last 2 minutes. Ready images expire after 10 minutes. Cleanup runs every
  minute and removes expired private images; terminal records are removed after a day.
- Images live under `.template-captures/` in the API content root, outside `wwwroot`. Image reads
  are authenticated and `no-store`. Only approval copies the image into public thumbnail storage.
- A renderer must heartbeat before capture requests are accepted. An unavailable renderer returns
  a useful failure immediately instead of leaving the editor waiting indefinitely.
- The current worker-presence tracker targets one API process; multiple load-balanced API instances
  would need a shared heartbeat/registration store.

### Verification

Service tests cover ownership, duplicate requests, leases, cancellation, expiry, image dimensions,
publication races and explicit approval. Dialog tests cover review, cancel, retake, unavailable
renderer, stale approval, request abort and Blob URL cleanup. The isolated HTTP check exercises
JWT/worker-key boundaries and the full job lifecycle with a generated PNG:

```sh
python3 scripts/verify-template-capture-api.py
```

It starts its own API, database and files in a temporary directory; it never uses client data.
Legacy renderer screenshot quality still needs browser verification on Roman Garden, Sunny Safari, Dino
Doodle Party and Painted Promise.

## Legacy direct thumbnail renderer

Capture is a separate optional developer worker using the already-installed Playwright tooling.
It is **not a browser installed into the production API** and does not run merely by publishing.
It needs a current Super Admin session in a Playwright storage-state file and a working Chromium
installation. Run from `frontend/`:

```sh
npm run studio:thumbnail -- --template 7 --state /path/to/storage-state.json
```

Add `--watch` to refresh the thumbnail when the published-design hash changes while the process
runs. Use `--base https://your-platform-host` for another environment. It captures the public
published preview, waits for readiness/fonts, hides development chrome, and uploads with a version
guard. A publish that races a capture causes a retry in watch mode. Draft edits are never captured.
The storage-state file is supplied by the developer's browser test session; the worker does not
create accounts or change login credentials. Do not commit that session file.

Legacy renderer checks still to verify/complete: a real thumbnail capture in an environment that permits Chromium;
family-specific visual verification (especially Cinematic); authored draft/publish integration;
and the operational choice of where to run the optional capture worker. No real template baseline
has been baked or published by this implementation work.
