# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Branch topology — start here

**`ae-unified` is the working branch and a strict superset of every other branch.** It integrates
the two long-lived branches that had diverged from `main` (`d344ab7`) and never come back together:

| Branch | State |
|---|---|
| **`ae-unified`** | **current work** — everything below, merged and verified |
| `ae-adjust-editor` | superseded (Adjust Editor universalization; was dormant since 2026-07-26) |
| `frontend-design-fix` | superseded (Wedding→Event rename, package/tier unification, T8/T9) |
| `main` | unchanged at `d344ab7`, the common ancestor of both |

The two originals are still on `origin` but should not be built on. Nothing from this merge has
been **deployed** — production is still running pre-rename code.

⚠️ **Naming in this document lags the code.** The Wedding→Event rename (`Wedding`→`Event`,
`CoupleName`→`Slug`, `couple-admin`→`organizer-admin`, `/wedding/[coupleName]`→`/[eventType]/[slug]`)
landed in `frontend-design-fix` and is now in `ae-unified`, but most prose below still says
"wedding". Read `WeddingService`/`/api/wedding`/`WeddingId` as `EventService`/`/api/event`/`EventId`.
The `WeddingInvite.*` C# assembly/namespace names were **not** renamed and are still correct.

### Merging across branches here — the recurring hazard
This repo accumulates uncommitted work in the shared working tree, and different sessions commit
the *same* WIP to different branches (see the entangled-WIP pattern). When those branches merge,
git sees no conflict — it happily keeps **both** copies:

- After a rename, one copy becomes `Event*`-named while the `Wedding*` original survives as an
  orphan that still compiles into the build. The `ae-unified` merge had to delete **9** such stale
  duplicates (`Wedding{,Export}Service`, `IWeddingService`, `WeddingController`,
  `WeddingFeatureService`, `wedding.service.ts`, 2 test files + interfaces).
- The same thing happens *inside* files: a duplicated `getTemplateDefault` in
  `templateConfig.service.ts` and a duplicated section in this very file.

**So after any cross-branch merge here: build it, then grep for orphaned `Wedding*` files and
duplicated members.** A clean `git merge` is not evidence of a correct merge.

## Commands

### Backend
```bash
# Run the API (from repo root)
dotnet run --project backend/WeddingInvite.API

# Add a migration
dotnet ef migrations add <MigrationName> --project backend/WeddingInvite.Data --startup-project backend/WeddingInvite.API

# Apply migrations
dotnet ef database update --project backend/WeddingInvite.Data --startup-project backend/WeddingInvite.API
```

**Before applying any migration to the production SQLite file** (the real path is
`/opt/wedding-app/data/db/wedding.db` — **not** `data/wedding.db`, which is a stray empty file;
see Quick Deploy below): take a manual file-level backup first
(`cp wedding.db wedding.db.bak-$(date +%Y%m%d%H%M%S)`), and review the generated SQL with
`dotnet ef migrations script` before running `database update` against it. EF's `RenameTable`/
`RenameColumn` operations are safe for renames (no data loss), but there is no automatic
pre-migration backup — this is a required manual step, not something the tooling does for you.

### Duplicate migrations across branches (fixed in `ae-unified`, but read this before adding one)
Two branches independently scaffolded migrations for the *same* schema change, so applying the
combined set to a **fresh** DB failed with `table TemplateConfigDefaults already exists`. The
reconciliation, and the rules it produced:

- **A migration's duplicate is only safe to delete once you've checked what's unique in it.**
  `20260723135311_UnifyTierGatingUnderPackages` was 95% redundant with
  `20260726123038_AddTemplateConfigDefaultAndPackageTierUnification`, but held one raw
  `migrationBuilder.Sql` backfill with no equivalent — granting `CUSTOM_DOMAIN` to events that
  already had a `Domain`. Dropping it silently would have failed the two-step domain gate for
  existing events. It survives as `20260817000000_BackfillCustomDomainFeature`.
- **Keeping a migration out of timestamp order is fine only if nothing later rebuilds its table.**
  `20260725000000_AddTemplateStagesJson` stays where it is (adds `Templates.IsAuthored`/`StagesJson`)
  — verified that no later migration rebuilds `Templates`. SQLite EF does full table rebuilds for
  column drops, and a rebuild scaffolded before those columns existed would silently drop them.
  **Check this whenever you reorder or re-date a migration.**
- **EF tolerates orphan `__EFMigrationsHistory` rows**, so deleting an already-applied migration
  doesn't break existing databases — they simply have history rows for migrations no longer in the
  assembly. Verify a change on **both** paths: a fresh DB *and* a copy of a real one.
  `dotnet ef database update --connection "Data Source=/tmp/scratch.db"` is the cheap way to prove
  the fresh path without touching your dev DB.

## Architecture

### Backend Pattern: Repository → Service → Controller
All repos/services are registered as **scoped** in `Program.cs`. When adding new functionality:
1. Add interface + implementation to `WeddingInvite.Data/Repositories/`
2. Add interface + implementation to `WeddingInvite.Core/Services/`
3. Register both in `Program.cs`
4. Add controller to `WeddingInvite.API/Controllers/`

### Auth
- JWT tokens stored in **HttpOnly cookies** (cookie name: `token`)
- Roles: `SUPER_ADMIN`, `HOST_ADMIN` (reseller/agency — owns weddings via `Wedding.CreatedByUserId`), `COUPLE_ADMIN` (see `UserRoles` in `User.cs`)
- Token is read from cookies in `Program.cs` via `OnMessageReceived` event
- `IWeddingAuthorizationService` / `CanAccessWeddingAsync` enforces couple/host admin can only access their own wedding(s)
- Tiers: `User.Tier` and `Template.Tier` are `BASIC | PREMIUM | PRO` — templates are tier-gated. **No billing/payment integration exists yet** (tier changes are manual)
- `Template.EventTypes` is a separate CSV field (`WEDDING`/`CEREMONY`/`PARTY`, e.g. `"WEDDING,CEREMONY"`) — which event the public `/personalise/picker` funnel shows a template under. Not tier-related; edited via a checkbox group on `/super-admin/themes`. `TemplateService.NormalizeEventTypes` upper-cases/validates on save and falls back to `WEDDING` if nothing recognised survives. `frontend/lib/eventTypes.ts` (`EVENT_TYPES`, `parseEventTypes`, `matchesEvent`) is the shared frontend vocabulary.
- **Package rows ARE the tier definitions** (`Package`/`PackageFeature`, exactly `BASIC`/`PREMIUM`/`PRO` — `PackageService` rejects creating or deleting any other code). `IPackageRepository.TierIncludesFeatureAsync` is the single source of truth for "does this tier include this feature," replacing the old hardcoded `TierEntitlements.AllowsFeature` map. Edited at `/super-admin/packages`. `Wedding.PackageId` no longer exists — a wedding's feature set comes from its owner's `User.Tier` alone, resolved through this lookup (see `WeddingFeatureService`/`WeddingService.SetDomainAsync`). Custom Domain needs both the PRO tier ceiling *and* an explicit per-wedding `WeddingFeature` toggle (same two-step gate as `PHOTO_BOOTH`/`SEATING`).

### Wedding lifecycle: delete vs. deactivate
`DELETE /api/wedding/{id}` (`WeddingService.DeleteAsync`) is a **real, permanent delete** — it removes
the row and cascades all child data (Guests, Wishes, Photos, WeddingFeatures, Tables, ItineraryItems,
WeddingTemplateConfig are `OnDelete(Cascade)`; the couple admin's `User.WeddingId` is `SetNull`), and
frees the couple name for reuse. It also **best-effort deletes the on-disk upload directories**
(`wwwroot/uploads/{id}/` — covers Couple/Guest photos and audio; `wwwroot/uploads/photos/{id}/` for a
legacy pre-existing layout) via `TryDeleteDirectory`, swallowing filesystem errors since the DB delete
has already committed by that point. To deactivate a wedding *without* deleting it, use
`PUT /api/wedding/{id}/toggle-active` (`ToggleActiveAsync`, `IsActive`) — that's the "Drafts" bucket
in the super-admin dashboard.

**Export a wedding**: `GET /api/wedding/{id}/export` (`WeddingExportService.BuildExportZipAsync`,
same `SUPER_ADMIN,HOST_ADMIN` + `CanAccessWeddingAsync` gate as Delete) streams back a zip of
everything belonging to the wedding — `wedding.json`, the full effective `config.json`, `guests.csv`,
`wishes.csv`, `itinerary.csv`, `seating.csv`, every photo under `photos/{couple,guest}/` (named by
their on-disk `{guid}.ext`, with a `photos-manifest.csv` recording metadata + a `FileIncluded` flag
for any DB row whose file is missing on disk), and `audio/` if `music.url` is configured and its file
exists. Built fully in-memory (`MemoryStream`/`ZipArchive`, BCL only) — pairs naturally as "back this
up before you delete it," but stands alone as a general data-portability export. Surfaced in the
super-admin/host-admin wedding-list card (`WeddingCard`'s download icon) and the wedding detail page
header ("Export data").

### Frontend API Layer
All API calls go through `frontend/lib/api/` and are exported from `index.ts`. Each service file wraps an `apiClient` (Axios instance). **Always add new service methods to the relevant service file and re-export from `index.ts`.**

### Feature Gating
Features are toggled per-wedding via `WeddingFeature` junction table. Public pages check feature state before rendering tabs/sections.

### Template Customization
`WeddingTemplateConfig` stores key-value config per wedding. Templates read it with a
`t(key, fallback)` helper. `invite.body` is rich text (TipTap v3) via `dangerouslySetInnerHTML`.

**`frontend/lib/templateConfigSchema.ts` is the single source of truth.** The customize
inspector renders itself from `getConfigFields(templateId, role)` — there are no
`templateId === N` branches in the page. Consequences worth knowing:

- **`templateIds` on a field is load-bearing**: it records which templates actually read the key.
  Omit it and you ship a control that silently does nothing on templates whose markup never looks
  the key up. Verify with `grep -rl "<key>" frontend/components/templates/` before widening it.
- A field's `block`/`group`/`chip` decide where it lands in the rail; `attachTo` folds it into
  another field's card (that's how T5's per-element colours sit inside the name/date/venue cards).
- **`adminOnly` and `minTier` are enforced server-side** by
  `backend/WeddingInvite.Core/Config/TemplateConfigPolicy.cs`. Mark a field `adminOnly`/`minTier`
  in TS and you must mirror it there — the frontend only hides the control. `adminOnly` keys need
  SUPER_ADMIN; `t*.layout.*` keys (the stage-layout Adjust feature) need PRO tier. Both are
  *dropped* from a save rather than 403'd, so an over-broad bag still saves its allowed keys.
  Note `section.order` is deliberately *not* gated: couples reorder their own sections via the
  rail, and every save writes it.
- **Save is a whole-bag PUT and the backend prunes**: a stored key the caller could have written
  but didn't submit is **deleted**. That's what makes deleting a T7 layer work. It also means a
  bug in `handleSwitchTemplate`'s merge would destroy a couple's content — the two must stay in
  step.
- **Per-template "starting design" defaults** (`TemplateConfigDefault` table, keyed by `TemplateId`,
  same shape as `WeddingTemplateConfig`). A super-admin captures a *finished* invite's design on the
  themes page (`/super-admin/themes` → "Starting design" → pick an invite → *Set as default*);
  `SetDefaultFromWeddingAsync` stores that wedding's **effective** config minus couple-content keys
  (`TemplateConfigPolicy.IsCoupleContent`: `invite.body`, `walimah.body`, `music.url`).
  **The default is applied live at read time, not seeded.** `GetConfigAsync(weddingId)` returns the
  template default **underlaid** by the wedding's own rows (a stored key always wins). So every invite
  of a template — existing or new, however it got there — renders that template's default for any key
  the couple hasn't overridden, and improving the default propagates live to those keys (no re-seed,
  no timing gaps). There are no seeded rows: `WeddingService.CreateAsync`/`UpdateTemplateAsync` write
  nothing config-wise; switching an invite's template just changes `TemplateId` and it inherits the
  new template's default. **`SaveConfigAsync` stores only true overrides**: a submitted value equal to
  the default is not persisted (and an existing row equal to the default is pruned), which is what
  keeps un-touched keys live and makes "reset a stage" revert to the *theme's* starting design.
  Because the customize page echoes the merged bag on load, a couple's untouched keys round-trip as
  no-ops. A sub-PRO couple renders the inherited `t7.layout.*` but can't Adjust it (PRO-gated).
  Admin endpoints: `GET/PUT/DELETE /api/template/{id}/default-config[...]`. Also surfaces on
  `/template-preview/[code]` (the no-real-wedding sample/thumbnail render), via
  `GET /api/template-config/template/{id}/default`, so a template's picker thumbnail reflects its
  captured design instead of raw code defaults.
- **Moving a tuned design local → prod: design bundles** (`TemplateDesignService`,
  `GET /api/template/design-export?ids=7,11` / `POST /api/template/design-import`, SUPER_ADMIN;
  surfaced on `/super-admin/themes` as "Export design" per theme, "Export all designs" +
  "Import bundle…" in the header). A bundle is a zip: `design.json` (per template: the
  `TemplateConfigDefault` bag, `IsAuthored`/`StagesJson`, `ThumbnailUrl`, and name/tier/event types)
  plus `assets/uploads/…` for every `/uploads/` path those reference. **Import matches by
  `templateCode`, never id** (ids differ per DB; unknown codes are reported as `skipped`, not
  created), whole-bag replaces the starting design, and **rehomes every shipped asset to
  `/uploads/templates/<code>-import-<sha256[..16]>.ext`**, rewriting the references — a design
  captured from a local test event points at `/uploads/{eventId}/…`, which `EventService.DeleteAsync`
  would wipe on prod if that id were ever deleted there. Content-hashed names make re-imports
  idempotent. Meta (name/description/tier/event types) is only applied with `applyMeta=true`;
  an authored composition is never stripped by importing a hand-coded source. Note: this moves
  the *design data*, not code — a template's React component/assets under `public/templates/` still
  ship via deploy.

## Stage + layer engine (`components/templates/_shared/`)

The stage/layer compositor is a **shared, template-neutral engine**: `types.ts`, `layout.ts`
(pure `resolveStage`/`serializeStage`/`baseStage`/`layoutKey(prefix,…)` + `useStageLayout`),
`Stage.tsx`/`Layer.tsx`/`Stage.module.css`, `hooks/{useBreakpoint,useStageReveal,useParallax}.ts`,
`adjust/AdjustPanel.tsx`, and `engine.tsx` (a context supplying per-template `assetRoot` /
`assetSizes` / `slotRegistry`). Templates opt in with their own `keyPrefix` and stage-definition
map. Layouts persist per-template as `t<N>.layout.<bp>.<stageId>`. When adding a
template, see `~/.claude/plans/t5-adjust-rollout.md`.

### Preview fidelity — frame-scoped units, not raw viewport units
See `docs/FIX_QUEUE.md` Issue 2. Two facts every new stage/template should build against:

- **The invitation *requests* `initial-scale: 0.9`, but doesn't get it** — `INVITE_REQUESTED_SCALE`
  (the literal meta-tag value the real page ships, `app/[eventType]/layout.tsx`) and
  `INVITE_EFFECTIVE_SCALE` (what the browser actually renders at) are **separate constants in
  `lib/inviteViewport.ts` and must stay separate.** A real-device measurement (`ViewportProbe` on an
  iPhone 17 Pro, iOS 18.7 Safari) read `visualViewport.scale` back as **0.765**, not 0.9. `rem`/`%`/
  `cqi` all cancel through whatever the effective scale actually is (both the value and the
  paint-scale carry the same factor), so this needs no per-template handling — but never assume the
  effective scale equals the requested one, and never "correct" `INVITE_REQUESTED_SCALE` from a
  measurement of the effective scale — that changes what a guest's browser is asked to do, which is
  a different, unverified experiment. See `docs/FIX_QUEUE.md` Issue 2 for how this was discovered.
- **Type is `cqi`; box geometry that isn't already inside a `container-type` box is
  `var(--f*, <unit>)`, never a raw `vw`/`vh`/`svh`.** `--fvw`/`--fvh`/`--fsvh`/`--fsat../--fsal` are
  defined only inside the Adjust Editor's standalone preview (`_shared/FrameViewportVars.tsx`) and
  every use site falls back to the literal unit (`var(--fsvh, 100svh)`), so this costs a guest's
  browser nothing. It matters because the editor's preview iframe can be a different size from
  the device box it's simulating (the H slider edits the *visible* `svh` box; the old "Reveal
  off-screen" mode, removed 2026-09-22, widened it outright) — a raw viewport unit inside that
  iframe reads the *ambient* iframe size, not the device box being previewed. `.stage`/`.slot`/
  `.artCanvas`/`.sheetCard` are already `container-type` boxes, so `cqi` inside them is safe as-is;
  it's specifically `position: fixed` content (sheets, lightboxes, `HorizontalRail`) and section
  gaps/padding that need the `--f*` form. `_shared/frameViewport.ts`'s `frameW()`/`frameSvh()` are
  the JS-side equivalent, for anything computing off `window.inner*` inside a rAF loop.

### Every template now runs through this engine (`_shared/registry.ts`)
`TEMPLATE_ENGINES` maps each `templateId` → `{keyPrefix, reveal, slotTheme?, resolveStages, stageIds}`.
There are **no `templateId === N` branches** in `customize/page.tsx` any more — don't reintroduce
them; add a registry entry. Two deliberately different geometry families live behind it:

- **Fixed-stage compositor** (`reveal: true`, `slotTheme: true`) — full-screen `100svh` stages,
  absolute layer positions as data (`{x,y,w,h,z}`, not CSS). Templates 7, 10, 13 and 14.
- **Flow + overlay** (`reveal: false`) — Templates 1–6: real DOM flow with a `SectionOverlay` per
  section plus `anchor` pseudo-layers (`useAnchors`) that nudge existing elements by transform.

This split is intentional, not an incomplete migration: content-heavy templates need real reflow,
so forcing them onto fixed stages would be a regression. (T8/T9 sit outside both families entirely
— no `registry.ts` entry, no Adjust dock at all; they're prototypes built to visualize the
PARTY/CEREMONY event-type categories, not templates meant to ship to real couples — don't invest in
engine parity for them without an explicit decision to productionize first.)

**Product-facing family names — locked 2026-09-08** (shown alongside tier, e.g. "Pro · Stage"):
- **Classic** = the flow + overlay family above (T1–T6).
- **Stage** = the fixed-stage compositor family above (T7, T10, T14) — named for the code's own
  `Stage.tsx`/`StageDef` vocabulary already in place, not a new coinage.
- **Cinematic** = a **third family that does not exist in the engine yet**. Do not apply
  "Cinematic" to T7/T10 — Stage is discrete full-screen scenes you scroll between (theater set
  changes); Cinematic is a moving virtual camera through one continuous scene, which is a different
  thing. Planned as the next big selling-feature differentiator versus competitors' passive
  autoplaying video backgrounds: a layered foreground peels away to reveal a scene, a camera pans
  onto a dais and zooms into each subject in turn, then the scene transitions into a conventional
  detail-heavy layout — **interactive** (scroll- *and* click-triggered), with camera motion on
  **X/Y/Z**, not just a 2D pan. No engine work has started. Closest existing primitives to build
  from: `useParallax.ts` (scroll-driven CSS custom properties), `HorizontalRail.tsx`
  (pinned-scroll pan across one continuous background), `_shared/effects/ScrollVideoLayer.tsx`
  (ScrollTrigger scrubbing mapped to a timeline) — none of these have a "virtual camera through a
  scene" concept yet; that's a genuinely new primitive, not an extension of Stage's
  discrete-stage-per-section model. Open question: whether CSS 3D transforms
  (`perspective`/`translateZ`/`rotateX/Y`) are enough for true Z-depth with correct occlusion, or
  whether this eventually needs a WebGL/three.js renderer — worth deciding before investing heavily
  in the CSS-transform approach. Treat as its own scoped project when work starts, not a quick
  fourth stage variant.

**Known gap — the anchor vocabulary can't reach generated visuals.** An `anchor` grabs an
already-rendered *plain DOM element* and transforms it. That covers T5's ceremony card, but not
its welcome section (names are SVG `<textPath>` whose curve is recomputed from character count) —
which is why `T5_STAGES.welcome` ships with zero layers. Anything whose visual is *generated*
rather than merely *positioned* (glass blur/tint as tunable parameters, arc text, particle fields,
gradient masks) needs a **new layer `kind`**, not another `anchor()` call site. The proven recipe
is `kind: 'scrollVideo'` (`_shared/effects/ScrollVideoLayer.tsx`): take the effect's hardcoded
constants, promote them to fields on `Layer`, and wrap the effect in a component that reads them —
storage, delta-diffing and per-breakpoint persistence then come for free. Unconverted candidates
still hardcoding their constants: `Template6-fairygarden/scenes/PetalRain.tsx` (particle spawn
ranges), `Template6-fairygarden/components/FallbackBackground.tsx`, and `Template5.tsx`'s
background fade-mask gradient stops.

### Authored templates — a template can be data, not code
`Template.IsAuthored` + `Template.StagesJson` (a `Record<StageId, StageDef>` blob) render through
`_shared/DataTemplate.tsx` on the same engine with **zero per-template React**. Authored in-app at
`/super-admin/authoring/[templateId]`, which reuses the couple Adjust flow verbatim (`keyPrefix:
'author'`) and the existing `/organizer-admin/preview` iframe rather than a parallel system.
Functional blocks come from the shared `_shared/slots/` catalog (RSVP, countdown, names, details,
itinerary, wishes, photo booth), styled through `--slot-*` CSS custom properties so authored
templates get neutral defaults while T7 pins them to its own values.

- **Two separate render paths must both handle the fallthrough**: `TemplateWrapper.tsx` (customize
  preview) *and* the public `/[eventType]/[slug]/page.tsx`'s own inline renderer. Missing the
  second one crashes the public page with `Cannot find module 'Template8'`.
- Authored layout keys use the `ta<id>` prefix, so `TemplateConfigPolicy.LayoutKeyPattern` is
  `^ta?\d+\.layout\.` — a `^t\d+` regex silently skips the PRO gate for them.

## Template 14 — Sandy Beach (Stage family, WEDDING, PRO)

`frontend/components/templates/Template14-sandybeach/` — the T10 shape exactly (one stage per
section, `EventHeroSlot` hero, sheet-hosted forms, `--slot-*` theme block in `index.tsx`), so read
T10's notes first. Art: `public/templates/sandy-beach/<section>/` (six 941×1672 backgrounds + 55
prop WebPs, 4.2 MB). Migration `AddSandyBeachTemplate` seeds `TemplateId 14` / code `sandy-beach`
(13 is reserved by the Dino Doodle Party pipeline run, which has produced no code).

- **Art provenance is a catalogue, not an overlay.** The pipeline's human-render step produced,
  per section, a design / background plate / transparent prop sheet — but the sheets lay each prop
  out once at arbitrary positions, so `data/stages.ts` positions were *read off the design*, not
  measured like T10's. The sheet was cut by connected-component analysis of alpha (per-pixel
  labels, so overlapping bounding boxes don't bleed); the arch and dune grass shared a sand skirt
  and were split at a hand-picked x.
- **Canvas aspect deliberately differs from the background's.** `canvas.mobile = 836×1672` (0.5)
  sits between the 9:16 art and 9:19.5 phones so the welcome arch's posts survive the side crop;
  `Stage` cover-fits the background independently, so props can drift a few % against it — fine
  here because nothing is registered to a background feature. `canvas.desktop = 1440×900` with
  per-layer `desktop` overrides on every stage (a portrait background is a sea/sand band on a
  landscape screen, so the props are re-composed as a wide frame).
- **`fontStyle` / `textTransform` were added to the engine for this template** (`Layer` fields, in
  `OVERRIDABLE`, `subLayerStyle`, `Layer.tsx` text, and Style/Case selects in the Adjust panel):
  the style lock is italic Cormorant for names/headings and letter-spaced small caps for labels,
  and bound copy (`{{date:long}}`) can't be typed in upper case. `curated.ts` now loads
  Cormorant's true italic faces (+4 preloaded files, still far under the Issue 4 header budget).
- Foreground props stop at `y ≤ 93`: a 9:16 device crops the canvas's bottom ~5% and the nav pill
  covers the next ~8%, so anything placed at the design's literal 96–99% vanished in QA.
- `TemplateEngine.slotThemeAccentDefault` (registry) replaced the `templateId === N` accent chain
  the customize page used to hold — add a new Stage template's default there, not in the page.
- **`StageDef.bgVideo`** (engine, added for T14's welcome): a looping, muted, inline `<video>` in
  place of the background `<img>`, with `bg` as its poster — so `bg` must be the clip's own first
  frame (`welcome/background-poster.webp`, 480×832) or the swap flashes. An uploaded `bgSrc`
  replacement wins over it, and reduced-motion / autoplay-refusal (iOS Low Power Mode) fall back
  to the poster. The clip (`welcome/background.mp4`, 4.7 s, 780 KB, H.264 yuv420p, audio stripped)
  was crossfade-looped in ffmpeg (last 0.5 s → first 0.5 s, then the head trimmed) so the seam is
  below the source's own first↔last-frame delta. It paints its own sun and clouds, so the welcome
  sky props ship `hidden: true`. The original 941×1672 still is kept as `welcome/background.webp`
  for anyone who switches back to a static background.
- **`kind: 'water'` (`_shared/effects/WaterLayer.tsx`)** — the first generated-visual layer kind
  built to the `scrollVideo` recipe: ambient motion over water *painted into the background*
  (drifting turbulence texture blended soft-light, staggered ripple rings, a capped handful of
  glints, a slow reflected-light glow), all CSS/SVG, positions derived deterministically from the
  layer id, `prefers-reduced-motion` holds a still frame. Tuned via `water*` fields (in
  `OVERRIDABLE`; Adjust panel sliders + `+ Water` button); 0 disables an effect. Ships on T14's
  RSVP rock pool. Things that *rest* on something (bottle, lantern, crab, rocks) stay static; only
  the floating blossoms carry `animIdle: 'float'`.

## Template 7 — Roman Garden (full stage compositor)

`frontend/components/templates/Template7-romangarden/` (consumes `_shared/`). Only `PRO`-tier
template. Art is a sepia line-engraving exported as **separate transparent layers**, in
`frontend/public/templates/t7/` (29 WebP, ~3.8 MB). Unlike Templates 1–6, its layout is **data,
not CSS**. It keeps its own `data/stages.ts` (`T7_STAGES`), `data/assetSizes.ts`, and `slots/`,
and wires them into the shared engine via `<EngineProvider>` in `index.tsx`.

- **Stage model**: eight stages, each exactly `100svh` — `welcome`, `ceremony-walimah`,
  `ceremony-couple`, `ceremony-details`, `ceremony-programme`, `rsvp`, `wishes`, `photobooth`.
  A stage = one `object-fit: cover` background + N absolutely-positioned layers.
- **A layer** is `{id, kind, x, y, w, h, s, z, order, chain, hidden, opacity, depth}` plus the
  editor/structural fields `label` (rename target), `parent` (sub-layer nesting, never persisted),
  and `deleted` (a persisted tombstone that suppresses a shipped layer). Geometry is a
  **percentage of the stage (i.e. the viewport)**, not of the artwork — so `x: 50` is screen
  centre on every device and a side prop can't wander off a narrow screen. Defaults live in
  `data/stages.ts`. **If you catch yourself writing a `top:`/`left:` for a piece of art, it
  belongs in the stage data instead**, where the Adjust panel can reach it.
- **Background** is a stage property (`bg`/`bgFit`), but its placement is overridable per stage
  per breakpoint: `bgPosition`, `bgScale`, and `bgSrc` (an uploaded replacement) live in the
  persisted `StageLayout` alongside `bgFit`, and the Adjust panel surfaces them as a synthetic
  "Background" layer row.
- **`kind: 'slot'`** layers render real React content (the RSVP form, the countdown, the wish
  list — see `slots/`) but position and scale exactly like art. `SLOT_AVAILABLE` hides a layer
  whose slot has no content, and a stage whose only slot is empty is dropped entirely.
- **Per-breakpoint layouts**: `mobile` (primary) and `desktop`, merged **by layer id**. This is
  a real design tool, not a fallback — e.g. `ceremony/pillars.webp` is a landscape architrave
  that frames a 1440px screen beautifully and saws a visible seam across a portrait phone, so
  it is `hidden` on mobile and shown on desktop.
- **Reveal** is pure CSS off an IntersectionObserver (`data-seen`), staggered by each layer's
  `order` (`delay = 0.35s + order * 0.22s`). Position/scale and the reveal live on **two
  separate elements** (`.layerBox` / `.layerInner` in `Stage.module.css`) so the entrance
  animation can't fight the layer's placement.
- **No GSAP.** `_shared/hooks/useParallax.ts` is one passive scroll listener writing `--sl-par`.
- **`svh`, not `dvh`** — `dvh` re-sizes every stage as the mobile URL bar animates, which
  re-fires the IntersectionObserver and makes the reveal flicker.
- **Horizontal ceremony rail** (`scene.ceremony.layout = 'stack'` (default) | `'row'`). In `'row'`
  the three background-sharing `walimah` beats (walimah/couple/details) compile into **one
  continuous room** you pan through — a pinned horizontal pan, not three rooms side by side:
  `_shared/HorizontalRail.tsx` — a tall `[data-rail]` wrapper (`N*100svh`) with a `position: sticky`
  inner holding **three stacked planes** that pan together: the shared `.bg` (drifts slower via
  `--rail-bg-x` = parallax), a `.plane` (z:1) of **shared frame art**, and the `.track` (z:2) of
  per-beat panels. A passive scroll listener writes `--rail-x` (plane + track pan), per-panel
  `data-seen`/`--sl-out`/`--sl-par-x`, and — for the plane's spanning art — per-element `--sl-out`/
  `--sl-par-x` from each piece's on-screen box.
  - **Dedup is the whole point.** Each beat's default composition carries an *identical* copy of the
    frame art (pillars/pots/bench); rendering all three side by side triple-frames the room. So the
    row splits the beats by `kind` in `index.tsx`: the **shared art comes from a dedicated
    `ceremony-rail` stage** (`data/stages.ts`, resolved by a second `useStageLayout` call) rendered
    **once** in `.plane`, and each beat panel renders **only its slot** (`kind === 'slot'`). The
    beats' own per-beat art is simply not read in row mode, so stacked mode is byte-for-byte
    unchanged.
  - **`ceremony-rail` geometry is a % of the whole row** (`N*100vw`), not of one stage: `x:50` is
    the middle of the room, `x:5`/`x:95` the two ends, and a width is a fraction of the row (pots
    stay ~`w:6`). It is a **separate coordinate system** from the per-beat stacked art precisely so
    the two never collide. It is **not** in `STAGE_GROUPS` (never a scroll section).
  - **Per-element reveal**: a rail-local IntersectionObserver over the plane's `[data-layer]` sets
    `data-seen` on each art piece the first time it pans into view (IO honours the plane transform),
    so a pot parked at the row's right end animates in only when you reach the last beat. Beats keep
    per-panel reveal (right unit for a slot). Reuses `reveal.css` unchanged.
  - **Editing** ("edit on first beat"): the customize page's `layout` memo, in row mode, inserts a
    **"Ceremony Backdrop"** panel entry (`ceremony-rail`) before the beats and **strips the unused
    per-beat art** from the beats' panel entries (a cloned `stages` map — `T7_STAGES` stays intact
    for the template). Deltas persist under `t7.layout.<bp>.ceremony-rail`; the rail carries an
    `id="ceremony-rail"` scroll anchor so selecting that tab pans the preview to the room's start.
  - **Shared background is owned by `ceremony-rail`**: the rail resolves that stage's
    `bg`/`bgFit`/`bgPosition`/`bgScale`/`bgSrc` and renders it as the single drifting `.bg` `<img>`
    (wrapper owns the `--rail-bg-x` parallax; the img owns fit/position/scale) — so the couple adjusts
    it **once**, via the Ceremony Backdrop entry's Background row, exactly like any stage background.
    The beats' own `bg` is blanked in the row-mode panel clone so their (inert) Background rows don't
    show. Requires `ceremony-rail.bg` to be a real asset (an empty `bg` would hide the panel's
    Background row — it's gated on `def.bg`).
  - **Transparency fix**: rail panels pass `transparent` to `Stage` so `.stage`'s opaque `#E8E0D2`
    fill doesn't hide the shared background beneath.
  - Notes: `useParallax` skips `[data-rail]` descendants (the rail owns their motion); reduced-motion
    / `<2` beats fall back to the stack. A single
    stored delta per `stageId`/breakpoint means shared-art positions are tuned for one layout —
    switching stack↔row may want re-tuning; and no per-beat layer can sit *in front of* its slot in
    row mode (plane z:1 < track z:2).

## Template 5 — Dreaming Floral Sky (hybrid overlay + envelope)

Template 5 is a DOM/flow template (canvas envelope + GSAP + framer-motion). It opts into the
shared engine as a **hybrid overlay**, NOT a rewrite. Two layer populations, both under
`t5.layout.*` and both untouched by T5's existing config (`template.bg`, per-element colours,
`invite.layout`, which live in other namespaces):

- **Decorative layers** (text/shape/uploaded img) — a `SectionOverlay` (`Template5-dreamingfloral/`)
  in each `position: relative` section renders them, positioned as a percentage of *that section's*
  box. Added by the couple; none ship by default.
- **Anchor nudges** — `anchor` pseudo-layers (shipped as defaults in `data/t5Stages.ts`) that have
  no visual of their own; `useAnchors` turns each into an inline **transform** (translate + scale)
  + opacity + hide, merged onto an existing DOM element (`a('countdown','grid')` etc. in
  `Template5.tsx`). Transform-only, applied directly to **plain** elements — so native reflow
  survives and there's no framer-motion conflict. The Adjust panel shows anchors with a reduced
  control set (Nudge X/Y, Scale, Opacity). Anchor ids: `countdown` {label, grid, + sub-layers
  blk-days/blk-hours/blk-min/blk-sec}, `ceremony` {title, card, + sub-layers body/names},
  `wishes`/`photos` {header}. Sub-layers are anchors carrying `parent` (e.g. the four timer blocks
  nest under `grid`); their transform composes with the parent's because it's applied to the
  child's own element. **Every dynamic element you want couples to nudge needs its own anchor id +
  `a(...)` call site**, and only **plain-DOM** targets are safe — the welcome bride/groom names are
  SVG arc-text and stay non-targetable.
- **Deleting an anchor** doesn't tombstone it (that would drop the anchor and let the real element
  spring back to its default spot) — the panel maps ✕ on an anchor to a sticky `hidden: true`, so
  the element leaves the page and **Reset stage** restores it.

The **welcome** section has no anchors (its default layout renders names as SVG arc-text, which a
transform nudge can't target), and the **rsvp/envelope** section is excluded entirely (its
GSAP-scrubbed canvas is not a safe target).

### The Adjust panel (`_shared/adjust/AdjustPanel.tsx`)

PRO-tier stage editor. **Layout (reworked 2026-09-22):** the dock column itself holds only the
*navigation* — a "Theme & style" gear button, the Stage tabs, the layer list, a `+` button under
it, and Copy/Reset. Everything else lives in **a pop-up card that floats off the dock's LEFT
edge over the preview** (`.card` in `AdjustPanel.module.css`, `position:absolute; right:100%`,
rendered outside the scrolling `.body`; the host `<aside>` must stay `position:relative;
overflow:visible`). It deliberately takes **no layout space** — the preview must not shift when
it opens — so on a narrow window it overlaps the preview device; that's the accepted trade-off
(an in-flow column was tried 2026-09-22 and rejected). The card shows one of:
- **Theme & style** (gear): slot-theme accent / heading & body font, Card style (None/Radial/
  Glass), and Background·Flow for `pageBackground` templates. Gear only renders when at least one
  of `slotTheme`/`cardControl`/`pageBackground` is set.
- **Add to stage** (`+`): Text / Shape / Image / Water tiles, plus the slot-catalog Block groups
  in the authoring editor.
- **Detail** (whenever a layer or the Background row is selected and no pop-over is open): the
  selected layer's **Layout** / **Style** / **Animation** tabs (or Text/Container for a sheet
  form), or the Background fit/position/scale/replace controls. Closing the card deselects.
In the layer list: **drag rows to reorder z** (anchors don't drag — they don't z-stack), an
**eye** toggle for hidden, a lock toggle (a **locked row renders dimmed**), and a **nested
sub-layer tree** (a layer with children shows a disclosure caret). The list **fills the dock's
remaining height**. **Selecting a layer from the preview scrolls its row into view**
(`data-layer-row` + `scrollIntoView`). **Exactly one card is open at a time** — opening a
pop-over clears the layer selection, selecting a layer closes the pop-over.

**Delete is only ever offered for a layer the couple added**, and it lives in the detail card,
not as a row ✕ (the ✕ was a second hide button for anchors and a one-click destroy next to the
eye for art). A **shipped layer can't be deleted at all** — the panel gates on `shippedIds`
(`baseStage(def, breakpoint)`), and Hide is the affordance instead. That's not just taste:
`serializeStage` does write a `{id, deleted: true}` tombstone for a removed shipped layer, but
`resolveStage`'s `applyPatch` copies **only `OVERRIDABLE` keys** and `'deleted'` **is not in that
list**, so the tombstone is discarded on read and the layer springs straight back. A Delete
button there would silently do nothing. ⚠️ If you ever add `'deleted'` to `OVERRIDABLE` to make
tombstones work, check existing saved layouts first — any that already accumulated a tombstone
from a failed attempt would suddenly lose that layer on the next render.

- **Config flows one way, no cross-iframe echo.** Because the panel lives in the parent tree that
  owns `draftConfig`, `onLayoutChange(key, value)` just calls `setDraftConfig` directly (`''`
  deletes the key → restores defaults). The existing `PREVIEW_UPDATE` effect (rAF-coalesced)
  mirrors config into the preview iframe, which re-renders. Template7's old in-iframe optimistic
  shadow / `PREVIEW_CONFIG_PATCH` / echo-guard is **gone** — don't reintroduce it.
- The `editor` prop (an `EditorHandle`) is display-only: `{ enabled, breakpoint, selectedStage,
  selectedLayer, frame }`, used to outline the selected layer and derive the frame-scoped `--f*`
  units. It rides the `PREVIEW_UPDATE` payload, so **any new editor field must also be
  forwarded in the standalone preview page** (`app/(standalone)/couple-admin/preview/page.tsx`),
  which rebuilds the object field-by-field. Selecting a stage tab scrolls the preview via a
  `PREVIEW_SCROLL {sectionId}` message from the parent.
- **"Reveal off-screen" was removed on 2026-09-22** (`revealOverflow`/`canReveal`,
  `REVEAL_FACTOR`/`REVEAL_VPAD`/`REVEAL_FRAME_W/H`, `Stage`'s `data-reveal` pinning and its dashed
  `::after` frame are all gone — `git log` if you need the mechanism back). `TemplateEngine.reveal`
  in `registry.ts` still exists purely as the Stage-family marker.
- **Type must be `cqi`, not `vw`/`vmin`** in Stage content (`.stage` is `container-type:
  inline-size`; see `Stage.module.css`, `Layer.tsx`, `Template7.module.css`). The preview iframe
  isn't always the size of the device box being simulated, so viewport units would inflate the
  countdown/names; `cqi` resolves against the stage and equals `vw` whenever the stage fills the
  viewport.
- **Curved text (`textShape` arc/circle) reaches sub-layers, not just `kind:'text'`.**
  `_shared/slots/CurvedPiece.tsx` is the shared opt-in: a piece whose child renders **one plain
  string** (`<p>{bound(...)}</p>` — the shape every text piece uses) swaps that child for
  `<CurvedText>`; a composite child (the countdown grid, a line with an inline icon) keeps its flat
  rendering, which is why the Shape control only shows for `kind:'text'` or a sub-layer with
  `hasText`. Wired into `HeroSlots`'s `HeroPiece` and T13's `Piece` — **a new template's own piece
  wrapper must call `curvedTextOf`/`CurvedPiece` too**, or its text pieces silently ignore Shape.
  Two geometry fixes came with it: `CurvedText` sizes its glyphs in **SVG user units**
  (`fontSize * 2`, since 200 units span the box) — a CSS `cqi` there was multiplied again by the
  viewBox→box scale, so curved text grew quadratically with the box; and the **viewBox height is
  computed from the geometry** (one line of type + the arc's sagitta) instead of a fixed 200×100.
  That second one is what makes the piece behave: `CurvedPiece` keeps a **flat line's height in
  flow** and positions the curve absolutely over it, so switching a piece to arc/circle **overlaps
  its neighbours instead of pushing them down** (measured: 4px of drift on T13's hero, vs the whole
  hero collapsing before). The tight box also matters because `.slot` is `overflow-y: auto` — an
  oversized absolute box is simply **clipped away**, which is exactly how the first attempt
  rendered nothing at all. A full `circle` ring is capped at 10 lines tall for the same reason and
  fits itself inside (`preserveAspectRatio`).
- **A composite slot's inner layout is tunable** — `contentGap` / `contentAlignY` / `contentAlign`
  on a `kind:'slot'` layer become `--slot-gap` / `--slot-justify` / `--slot-align` +
  `--slot-text-align` (`slotLayerStyle.ts`), read by the block's own flex column (`.eventHero` and
  `.heroInner` in `slots.module.css`, `.composite` in a template's own slot CSS). Gap is in `em`,
  so spacing tracks Text Size instead of drifting apart as the type grows. **A new template's
  composite container must read those vars** (each with the shipped value as its fallback) or the
  Gap/Position/Align controls do nothing there. ⚠️ **`--slot-align` maps the couple's "Centre" to
  `stretch`, not `center`, and a container that shipped as a plain block must default to
  `stretch`** — a flex column with `align-items: center` shrink-wraps every child, silently
  collapsing anything sized `width: 100%`. That rendered T13's curved eyebrow 0×0 the first time
  round. Horizontal alignment of text is `--slot-text-align`'s job; `CurvedPiece` additionally
  pins `align-self: stretch` so no alignment choice can collapse it.
- **Text can carry its own art: `backdropSrc`** (+ `backdropScale`/`backdropRotate`,
  `_shared/backdrop.tsx`, Style tab → Backdrop). A ribbon/plate/banner rides the text so the two
  move, scale, animate and curve as one thing. **Prefer this over a separate `img` layer for
  anything that frames text** — T13 shipped its hero ribbon and name plaque as free-floating
  `img` layers that had to be kept in register by hand; both are backdrops now.
  - **It's a real `<img>`, not a CSS `background-image`.** A background is clipped to its own
    element, so the first version had to inflate the text box with padding/min-height to make the
    art bigger — which pushed neighbours around and drifted off centre in a flex row. An
    absolutely-positioned image is free to be larger than the words and overlap its surroundings,
    while `left/top: 50%` + `translate(-50%, -50%)` keeps it centred at any size. `height: auto`
    keeps the art's aspect, so **Size is the only control** (`backdropScale`, a % of the text).
  - The wrapper is `width: max-content; margin-inline: auto` so Size measures against the *text*
    rather than the full row. `CurvedPiece` paints its own copy (a curve replaces the flat child
    outright) and **halves the percentage**, because a curve's box spans the whole row while the
    flat box hugs the words — without that, switching Shape doubled the art.
  - Offered only where there IS text to sit on (`kind === 'text' || hasText`), so a group whose
    child is a composite block — the countdown grid — doesn't get one picture behind everything.
  - **Every new `Layer` field needs its entry in `OVERRIDABLE`.** These were missed at first and
    the symptom is subtle: the control works, the preview even updates, then `serializeStage`
    drops the key on the next commit so nothing ever sticks.
  - T13's countdown units no longer hardcode their stone in `.countUnit`; each unit is a
    sub-layer, so its plate is set through this control like any other text's.
- **A slot's sub-layers can nest further.** The countdown is a group: `hero-timer` holds
  `hero-timer-{days,hours,min,sec}` (T13: `-minutes`), each its own adjustable/styleable piece,
  resolved with a second `subLayersOf(stageLayers, 'hero-timer')` call. The panel's layer tree
  already recurses, so they show indented under Countdown Timer. A template opts in by declaring
  those ids with `parent: 'hero-timer'` in its stage data — a template that doesn't is unchanged
  (the lookup returns undefined and the unit renders with its shipped defaults). Each unit's
  `text` is its caption, so "Days" can become "Sleeps".
- **`--slot-text-scale` only works if the CSS multiplies by it.** T13 shipped its own
  `DinoSlots.module.css` with plain `font:`/`font-size:` declarations, so the panel's Text Size
  slider was a no-op for every T13 block — the control was real, the template just never read it.
  Every font size in a template's slot CSS wants `calc(<size> * var(--slot-text-scale, 1))`, except
  a child already sized in `em` of a scaled parent (that would compound).
- **A sub-layer's Style tab only reaches text the *wrapper* owns.** `subLayerStyle` writes inline
  styles onto the piece's own element, so any child with its own `font`/`color`/`font-size` rule
  silently out-specifies the couple's choice — that's why the countdown's digits ignored the Style
  tab until `.countdown` took the type defaults and `.countNum`/`.countLabel` (and T13's
  `.countUnit strong`/`small`) became `font: inherit` / `color: inherit` with `em` sizes. **Put a
  composite piece's type defaults on the wrapper, never on its children.**
- **Rich-text tokens are flattened** — `{{walimah.body}}`/`{{invite.body}}` resolve TipTap HTML, and
  a text layer renders a plain string, so `bindings.ts`'s `htmlToText` strips the markup (blocks →
  newlines; `.text` is `white-space: pre-wrap`). Without it the stage literally showed `<p></p>`.
- **Animation** is per-layer, split into **enter** and **exit**, both persisted on `Layer`
  (`anim` + `animDur`, `animOut`; all in `OVERRIDABLE`). The reveal engine is a shared,
  data-attribute-driven **`_shared/reveal.css`** (imported once by `Layer.tsx`):
  - **Enter** — an element opts in with `data-sl-anim="<type>"` and animates to rest when an
    ancestor gains `data-seen="true"` (per-stage via `useStageReveal`; hardcoded true by
    `SectionOverlay` for T5 decorative). Types: `rise` (default — `undefined` ⇒ `rise`, so existing
    invitations are unchanged), `fade`, `slide-{up,down,left,right}`, `zoom-{in,out}`, `none`,
    `scroll-fade`. Duration = `--sl-dur`; **Phase** is the existing `order` stagger
    (`--sl-delay = 0.35 + order*0.22s`).
  - **Exit** (`animOut`) — **scroll-scrubbed and reversible**: `data-sl-out="<type>"` on a separate
    `.layerExit` element, driven by `--sl-out` (0 in view → 1 scrolled out the top) which
    `useParallax` writes each frame from `up = -progress` (only the *leaving* side ramps, so the
    one-shot entrance is untouched; scrolling back reverses). Types: `fade-out`,
    `slide-out-{up,down,left,right}`, `zoom-out` (shrink), `zoom-in` (grow), `none`.
  - **Idle** (`animIdle` + `animIdleSpeed`/`animIdleIntensity`/`animIdleOrigin`) — "While on
    screen": a pure-CSS loop on its own `.layerIdle` element once `data-seen`. 18 types in four
    groups (motion: wave/sway/pendulum/float/drift/bounce/wobble/spin/tilt; scale:
    pulse/breathe/heartbeat; twitchy: jitter/shake/glitch; opacity/colour: flicker/blink/hue).
    Types that rotate or scale are **anchored** — `IDLE_ANCHORED` in `_shared/idle.ts` — and
    read a `transform-origin` from `animIdleOrigin` (3×3 preset grid in the panel; default
    centre, pendulum hangs from `top`). Translation-only types ignore it and the panel hides the
    picker. Add a type in three places: `types.ts` (`AnimIdleType`/`ANIM_IDLE_OPTIONS`),
    `idle.ts` (`IDLE_BASE_DUR`, and `IDLE_ANCHORED` if it pivots), `reveal.css` (keyframes +
    `[data-sl-idle=…]` binding), plus a label/group in `AdjustPanel.tsx`.
  - Each of position/parallax, entrance, and exit owns a **separate element** so their transforms
    never fight: `.layerBox` → `.layerInner` (enter) → `.layerExit` (exit); the T7 hero mirrors this
    (nudge wrapper → exit wrapper → `cloneElement` inner). Animation controls show for anchors too.
    `useParallax` re-queries `[data-scroll-fade]` / `[data-scroll-exit]` each frame (live editing).
- **T7 hero sub-layers**: the `countdown` slot's theme/bride/groom/date/timer are exposed as
  `kind:'anchor'` sub-layers (`parent:'countdown'`, ids `hero-*` in `data/stages.ts`), nested under
  Countdown in the panel. `CountdownSlot` (`slots/HeroSlots.tsx`) resolves them from `config`
  (threaded via `SlotProps.{config,breakpoint,editor}`) and applies each via a `HeroPiece` wrapper
  (nudge/hide/outline outer + `cloneElement`-injected `data-sl-anim` inner). The `countdown` slot
  layer itself is `anim:'none'` so the sub-elements own the entrance; anchor layers are filtered out
  of `Stage`'s visual render in `index.tsx` (they're metadata a slot applies internally).
- **Adding an image** uploads through `photoService.upload` with the non-upserting `LayerImage`
  slot (`TemplateSlots.LayerImage = 20`, in both `Photo.cs` and `lib/api/types.ts`) — unlike every
  other couple slot it never upserts, so a stage can hold many. The layer stores the `/uploads/…`
  path as its `src`; the same upload feeds the Background row's replace.
- Persists as a **delta against the defaults**, one JSON blob per stage per breakpoint, under
  `t{5,7}.layout.<breakpoint>.<stageId>` (a moved layer is ~40 bytes). See `serializeStage` /
  `resolveStage` / the `OVERRIDABLE` whitelist in `_shared/layout.ts` (`label`/`src` are
  overridable; `parent` is structural and never serialized). The panel is now template-neutral —
  it takes `stages`/`keyPrefix` as props and drives both T7 and T5.
- **PRO gating** is enforced twice: the header launcher only renders when `canAdjust` (`isPro &&`
  a layout engine exists), and `TemplateConfigPolicy` (backend) drops any `t*.layout.*` key —
  including one carrying an uploaded image `src` — from a sub-PRO save by prefix regex, so a
  downgraded couple can't edit, but their saved layout still renders.

## Template 5 — Envelope Scroll Animation (GSAP ScrollTrigger)

The envelope animation in `frontend/components/templates/Template5.tsx` uses a canvas 2D chromakey approach (not CSS/video directly) and GSAP ScrollTrigger scrubbing. The correct scroll trigger pattern is:

```ts
// trigger: envelopeWrapperRef (the canvas wrapper div, NOT the outer section)
// start:   'center bottom'  — animation begins when envelope CENTER hits viewport BOTTOM
//          → envelope is already half-visible, stationary, before animation starts
// end:     'top top'        — animation ends when envelope TOP reaches viewport TOP
//          → envelope is fully closed by the time it exits the screen

const vh = window.innerHeight;
const wh = wrapper.offsetHeight || vh * 0.68;
// PIVOT = progress value where envelope CENTER is at viewport CENTER (= fully open)
// Derived: PIVOT = vh / (2*vh - wh)
const PIVOT = Math.min(0.92, vh / (2 * vh - wh));
const HOLD = 0.04; // hold fully open for ±4% around pivot

ScrollTrigger.create({
  trigger: wrapper,
  start: 'center bottom',
  end: 'top top',
  scrub: 0.5,
  onUpdate: (self) => {
    const p = self.progress;
    const lo = PIVOT - HOLD;
    const hi = PIVOT + HOLD;
    const tri =
      p < lo ? p / lo :       // opening phase
      p < hi ? 1 :            // hold fully open
      (1 - p) / (1 - hi);     // closing phase
    video.currentTime = 0.5 + tri * (video.duration - 0.5);
    // video.currentTime starts at 0.5 (not 0) so envelope never fully closes visually
  },
});
```

**Why NOT `pin: true`:** causes jitter when combined with `scrub: 0.5` — GSAP's pin conflicts with scrub smoothing. Use CSS `sticky` if needed instead.

**Canvas visibility on mount:** use a self-retrying rAF loop — `draw()` re-queues itself via `requestAnimationFrame` until `video.readyState >= 2` (HAVE_CURRENT_DATA). `readyState >= 1` only gives dimensions, not decoded pixel data.

## Templates 1–4 — layout notes
- **Templates 1 and 3 are single-page scroll, not tabs.** Every section mounts at once, ordered by
  flex `order` off `sectionOrder`; the nav scrolls to a section and a scroll-spy syncs the active
  highlight. (They previously mounted one section at a time via `AnimatePresence mode="wait"`.)
  Consequences: the Adjust panel's "select a stage" **scrolls** to the stage like every other
  continuous-scroll template, and each section needs `position: relative` so `SectionOverlay`'s
  absolutely-positioned decorative layers anchor to *it* and not the page — easy to drop when
  rewriting a `className`.
- **Template 4** renders a `TornEdge` at *any* section colour change (not only dark→cream); its
  section padding lives on an inner `div` so the torn edge sits flush against the section boundary.

## Known Issues
- Admin-side guest creation: `guestService` posts to `/guest/rsvp`; re-verify the admin create path works end-to-end (historically broken; endpoint changed).
- **Font-preload header took production down with 502s — FIXED (2026-09-08).** `app/layout.tsx`
  used to apply every curated font's CSS variable app-wide, so `next/font` preloaded the entire
  19-font catalog on every page regardless of which template/couple ever used them — until a
  deploy that added 2 more fonts pushed the header (34 files, ~4.4KB) past nginx's proxy buffer.
  Fixed by splitting `lib/fonts/curated.ts` into pure metadata (`lib/fonts/registry.ts`, no
  `next/font` import) and the loader calls, and preloading only the 5 fonts shipped templates
  default to (down to 12 files, ~1.8KB). See `docs/FIX_QUEUE.md` Issue 4 — also covers a second,
  unrelated-looking symptom (a missing template preview PNG 404ing through the same header) that
  turned out to be the same root cause. **The nginx buffer itself still has no explicit
  `proxy_buffer_size` override** — recommended in Issue 4, not yet applied (needs the NPM admin UI).
- **Device-shape drift on the fixed-stage compositor — FIXED on mobile (2026-08-20) and desktop
  (2026-09-08).** The cause was sharper than "independent percentages": a `chain: true` layer takes its
  height from stage **width** while its `y` is a percentage of stage **height**, so on a taller,
  narrower screen the art *shrinks* while the gaps between pieces *grow* and the scene pulls apart
  — measured on T7 `welcome` at 344×882: art −11.7%, gaps +4.5%, a **+18.4%** drift in separation
  relative to art size, while the background cover-scaled the other way.

  **The fix is `StageDef.canvas`** (`_shared/types.ts`), an opt-in per-stage *reference aspect*.
  The stage's scenery composes inside one box of that aspect which cover-fits the device, exactly
  as `bgFit: 'cover'` already does for the background, so every piece scales and crops as a unit.
  Result: all art now scales by the background's own cover factor, drift **+0.05%**. Key points:
  - **Scenery in, content out.** `img`/`shape`/`text` go in the canvas; `slot` layers stay outside
    and keep adapting to the real screen — cropping a decorative pot is the point, cropping an RSVP
    form never is. A slot composed *against* the art opts in with `Layer.canvasAnchor` (T7's
    `welcome.countdown` shares the arch's coordinates; `wishes.titleText` is set on the title
    plate). Slots near the vertical centre drift negligibly and are deliberately left outside.
  - **Sized, not scaled.** `.artCanvas` uses `width: max(100cqw, 100cqh * var(--sl-ar))` — no
    `transform: scale()`, which would soften text, multiply `useParallax`'s px offsets and stack a
    third transform under the entrance/exit chain. **`cqh` needs `container-type: size`**, which
    `inline-size` does not provide, so `.stage[data-has-canvas]` upgrades — valid only because a
    canvas stage is never `flow`, which `Stage.tsx` enforces rather than trusting the caller.
  - **Per breakpoint** (`Partial<Record<Breakpoint, {w,h}>>`). Applying one reference to both
    **regresses desktop**: the mobile 390×844 aspect on a 1440×900 viewport builds a canvas 3116px
    tall and crops it — which is exactly why a bare fallback to `mobile`'s numbers can't be the
    *only* mechanism (see below): a stage sometimes genuinely needs a different desktop reference.
    **`Stage.tsx` falls back to the `mobile` aspect when `desktop` is left unset** (added
    2026-09-08, after Template10 shipped with `canvas.mobile` only and no fallback existed yet: its
    hero text visibly collided with foreground art on any real desktop window, since nothing
    protected desktop at all). This is a template-neutral engine default, not a per-template
    convention — a new template gets desktop drift protection for free the moment it declares
    `canvas.mobile`, with **no extra step required**. **T7 ships an explicit
    `desktop: { w: 1440, h: 900 }`** instead of relying on the fallback, because it *does* have a
    genuinely different desktop composition (the desktop-only landscape `pillars.webp` architrave,
    with hand-tuned `desktop:` per-layer overrides) — the fallback would be wrong for T7 specifically,
    which is exactly the case an explicit override exists for. Only declare `canvas.desktop`
    yourself when your desktop picture is deliberately different from mobile's; otherwise leave it
    out and trust the fallback.
  - **The wrapper establishes a stacking context**, so canvas members can't interleave with layers
    outside it. All nine T7 stages already keep art strictly below content, so nothing repaints; a
    dev-only `console.warn` guards any future stage that breaks the invariant.
  - **`ceremony-rail` is excluded** — its geometry is a % of the whole `N*100vw` row.
  - **Editor dragging** converts pointer px against `closest('[data-canvas], [data-stage]')`, so a
    layer measures the frame its percentages actually live in. Because the canvas is a real layout
    box, its rect needs no compensation.
  - Verified across seven shapes: phones uniform; iPad uniform but heavily cropped (38% vertical —
    proportionally faithful, stairs fall below the fold); landscape unchanged (art identical in
    size, cropped rather than squashed — a portrait invitation is degenerate there regardless).
  - **Desktop — fixed 2026-09-08.** Before assuming a redesign was needed (the raw measured drift —
    art scaling 0.875–0.889 vs content 1.138 — looked as severe as the mobile case), live
    screenshot testing showed T7's existing hand-tuned desktop layer positions already render
    coherently across real desktop shapes; only Template10 (no desktop tuning at all) had a
    genuinely visible break. See `docs/FIX_QUEUE.md` Issue 1 for the full before/after evidence —
    the lesson (measure by rendering, not by trusting a percentage delta) is worth remembering
    before scoping the next one of these.
- The Adjust preview (`PreviewPanel.tsx`) has **custom width/height sliders** (280–1600 × 400–1200)
  plus device presets (`lib/devicePresets.ts`) including **Fold cover 344×882** and **Landscape
  844×390**, so odd shapes are testable without hardware. The H slider edits the *visible* (`svh`)
  box, not the whole screen — see `docs/FIX_QUEUE.md` Issue 2, which also covers why the iframe is
  now sized to `svh`. The frame rides `EditorHandle.frame` (`{w, h, svh, safe}`, `frameW/frameH`
  kept as a deprecated fallback) through `PREVIEW_UPDATE` (and the standalone preview page's
  field-by-field rebuild) to the template, where `FrameViewportVars` turns it into the `--f*` units.

## Content Roadmap — SHIPPED (approved Apr 2026, delivered)
Phases 1–4 are done and in production:
- **Phase 1** — Itinerary data model (`ItineraryItem`, `AddItinerary` migration, `/api/itinerary` CRUD + reorder)
- **Phase 2** — Config schema expansion: `walimah.body`, `general.showIslamicDate`, `section.order`, per-element `.align`/`.animation`/`.color`/`.shadow`, `section.*.bg` (all in `WeddingTemplateConfig`, no migration)
- **Phase 3** — Customize page 3-tab redesign (Welcome / Ceremony / Celebration) with live preview
- **Phase 4** — Templates 1–4 render dynamic sections, Islamic date, walimah rich text, itinerary list, per-element styling
- **Phase 5** — Template 5 envelope/canvas/GSAP (separate; structure documented above)

## Active Roadmap — Harden → Stabilize → Scale (approved Jul 2026)
Billing/monetization deferred. Plan file: `~/.claude/plans/c-pls-then-lets-cached-cocke.md`.
- **Phase 1 Harden** — rate-limit auth (`AddRateLimiter`), JWT secret hygiene + fail-fast startup (real key was committed in `appsettings.json`), global exception handler + `ILogger` (0 loggers today), upload magic-byte validation
- **Phase 2 Stabilize** — commit hygiene, add `WeddingInvite.Tests` (xUnit) for auth / tenant isolation / RSVP capacity (no tests exist yet), frontend smoke tests
- **Phase 3 Scale** — SQLite → Postgres, `AsNoTracking` + pagination on list endpoints, offload heavy work

## Quick Deploy ("again")
When the user says **"again"**, **"deploy"**, or **"push it"**:
1. Run `git diff HEAD` to check for uncommitted changes
2. If changes exist: `bash scripts/deploy-frontend.sh "<short description>"`
3. If nothing changed: tell the user everything is already up to date

The script handles: `git add frontend/` → commit → push to GitHub → SSH to VPS → `docker compose build frontend && docker compose up -d frontend`.

- Branch: **`ae-unified`** (was `frontend-design-fix`; see Branch topology at the top). ⚠️ Nothing
  from `ae-unified` has been deployed yet — production still runs pre-rename code, and prod's
  `__EFMigrationsHistory` has **not** been checked against the reconciled migration chain. Do that
  first, against `/opt/wedding-app/data/db/wedding.db`.
- VPS: `root@139.180.154.175`, app at `/opt/wedding-app`
- Password: in `.env.deploy` at repo root (never committed — load with `source .env.deploy`)
- Public domain is **`theinvit-e.oddstudio.app`** (moved off the bare `oddstudio.app` apex on
  2026-07-29, then renamed from `thee-invite` on 2026-08-20 — the old subdomain was **dropped, not
  redirected**, so any invitation link shared before that date is dead. See below). `.env`'s `SITE_URL`/`CORS_ORIGIN`/`PLATFORM_DOMAIN` and
  `next.config`-adjacent metadata all key off `NEXT_PUBLIC_SITE_URL`, which is baked in at
  **Docker build time** (a build arg, not just container runtime env — `robots.ts`/`sitemap.ts`/
  `layout.tsx` have no dynamic APIs so Next statically prerenders them during `next build`).
  Changing the domain again means updating both the `.env` value *and* rebuilding, not just
  restarting.
- ⚠️ **The actual reverse proxy in production is Nginx Proxy Manager** (`npm-npm-1` container,
  GUI admin on `127.0.0.1:81`, SSH-tunnel only). Adding/editing a domain means logging into the
  NPM UI and adding/editing a **Proxy Host**. (A Caddy on-demand-TLS plan — `Caddyfile` +
  `CUSTOM_DOMAINS.md`, with a PRO custom-domain auto-TLS `ask` flow — was drafted but never
  deployed, and was removed from the repo on 2026-09-22; see `git log` if you need it. There is
  no automated custom-domain TLS flow live.)
- **This VPS now also hosts an unrelated second app**: ODDSTUDIO's own marketing site (Next.js +
  headless WordPress), at `/opt/oddstudio/` — see that project's own `CLAUDE.md` /
  `DEPLOYMENT.md`. It owns the bare `oddstudio.app`/`www.oddstudio.app` apex (which is why this
  app moved to the `theinvit-e` subdomain). The two apps are separate Compose projects sharing
  one NPM instance (multi-homed across `wedding-app_default` and `oddstudio_default` networks)
  and the same 955MB/1-CPU box — **RAM is genuinely tight** (steady state ~130–275MB available
  depending on recent build/journal buildup). Before adding services or doing anything
  memory-heavy here, check `free -h` and consider `docker builder prune -af` +
  `journalctl --vacuum-time=3d` on the VPS first — both accumulate fast from routine deploys and
  are the biggest reclaimable chunks, well before container tuning matters.
