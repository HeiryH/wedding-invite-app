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
- Tiers: `User.Tier` and `Template.Tier` are `FREE | PREMIUM | PRO` — templates are tier-gated. **No billing/payment integration exists yet** (tier changes are manual)
- `Template.EventTypes` is a separate CSV field (`WEDDING`/`CEREMONY`/`PARTY`, e.g. `"WEDDING,CEREMONY"`) — which event the public `/personalise/picker` funnel shows a template under. Not tier-related; edited via a checkbox group on `/super-admin/themes`. `TemplateService.NormalizeEventTypes` upper-cases/validates on save and falls back to `WEDDING` if nothing recognised survives. `frontend/lib/eventTypes.ts` (`EVENT_TYPES`, `parseEventTypes`, `matchesEvent`) is the shared frontend vocabulary.
- **Package rows ARE the tier definitions** (`Package`/`PackageFeature`, exactly `FREE`/`PREMIUM`/`PRO` — `PackageService` rejects creating or deleting any other code). `IPackageRepository.TierIncludesFeatureAsync` is the single source of truth for "does this tier include this feature," replacing the old hardcoded `TierEntitlements.AllowsFeature` map. Edited at `/super-admin/packages`. `Wedding.PackageId` no longer exists — a wedding's feature set comes from its owner's `User.Tier` alone, resolved through this lookup (see `WeddingFeatureService`/`WeddingService.SetDomainAsync`). Custom Domain needs both the PRO tier ceiling *and* an explicit per-wedding `WeddingFeature` toggle (same two-step gate as `PHOTO_BOOTH`/`SEATING`).

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

## Stage + layer engine (`components/templates/_shared/`)

The stage/layer compositor is a **shared, template-neutral engine**: `types.ts`, `layout.ts`
(pure `resolveStage`/`serializeStage`/`baseStage`/`layoutKey(prefix,…)` + `useStageLayout`),
`Stage.tsx`/`Layer.tsx`/`Stage.module.css`, `hooks/{useBreakpoint,useStageReveal,useParallax}.ts`,
`adjust/AdjustPanel.tsx`, and `engine.tsx` (a context supplying per-template `assetRoot` /
`assetSizes` / `slotRegistry`). Templates opt in with their own `keyPrefix` and stage-definition
map. Layouts persist per-template as `t<N>.layout.<bp>.<stageId>`. When adding a
template, see `~/.claude/plans/t5-adjust-rollout.md`.

### Every template now runs through this engine (`_shared/registry.ts`)
`TEMPLATE_ENGINES` maps each `templateId` → `{keyPrefix, reveal, slotTheme?, resolveStages, stageIds}`.
There are **no `templateId === N` branches** in `customize/page.tsx` any more — don't reintroduce
them; add a registry entry. Two deliberately different geometry families live behind it:

- **Fixed-stage compositor** (`reveal: true`) — full-screen `100svh` stages, absolute layer
  positions. Template 7 today. `"Reveal off-screen"` only applies here.
- **Flow + overlay** (`reveal: false`) — Templates 1–6: real DOM flow with a `SectionOverlay` per
  section plus `anchor` pseudo-layers (`useAnchors`) that nudge existing elements by transform.

This split is intentional, not an incomplete migration: content-heavy templates need real reflow,
so forcing them onto fixed stages would be a regression.

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
    / `<2` beats fall back to the stack; "Reveal off-screen" is **not** applied to rail panels (its
    `overflow:visible`/`margin:auto` pinning fights the scroller — a known limitation). A single
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

PRO-tier stage editor. The selected-layer detail is split into two tabs: **Layout** (rename, slide
X/Y/W/H/scale/opacity/depth, chain) and **Animation** (see the animation note below). In the layer
list: **drag rows to reorder z** (anchors don't drag — they don't z-stack), hide, delete (originals
included; see the anchor-delete note above), and a **nested sub-layer tree** (a layer with children
shows a disclosure caret). Stage-wide: `+ Text` / `+ Shape` / `+ Image`, a synthetic **Background**
row (fit + position + scale + replace image), a **Reveal off-screen** toggle, copy a layout to the
other breakpoint, and reset.

- **It's a right-docked column on the customize page, NOT inside the preview.** The customize
  page (`app/couple-admin/customize/page.tsx`) picks a per-template `{stages, keyPrefix}` engine
  by `templateId` (T7 or T5) and renders `<AdjustPanel>` as a third flex column when
  `adjusting && canAdjust && tier === 'PRO'`, collapsing the left inspector to its icon rail while
  it's open. It's launched by a **dedicated "Adjust" button in the page header** (gated by
  `canAdjust`) — the old `LayoutField` schema-field launcher and the `t{5,7}.layout.__panel`
  fields are **gone**; don't reintroduce them.
- **Config flows one way, no cross-iframe echo.** Because the panel lives in the parent tree that
  owns `draftConfig`, `onLayoutChange(key, value)` just calls `setDraftConfig` directly (`''`
  deletes the key → restores defaults). The existing `PREVIEW_UPDATE` effect (rAF-coalesced)
  mirrors config into the preview iframe, which re-renders. Template7's old in-iframe optimistic
  shadow / `PREVIEW_CONFIG_PATCH` / echo-guard is **gone** — don't reintroduce it.
- The `editor` prop (an `EditorHandle`) is display-only: `{ enabled, breakpoint, selectedStage,
  selectedLayer, revealOverflow }`, used to outline the selected layer and drive "Reveal
  off-screen". It rides the `PREVIEW_UPDATE` payload, so **any new editor field must also be
  forwarded in the standalone preview page** (`app/(standalone)/couple-admin/preview/page.tsx`),
  which rebuilds the object field-by-field. Selecting a stage tab scrolls the preview via a
  `PREVIEW_SCROLL {sectionId}` message from the parent.
- **"Reveal off-screen"** shows art cropped by the device edge. It's **T7-only** (`canReveal`,
  gated on the full-screen Stage compositor — T5 is fluid DOM overlay, so widening would just
  reflow it larger; the toggle is hidden there). The iframe is a hard clip, so the fix spans two
  places: `PreviewPanel` **enlarges the preview canvas** (`REVEAL_FACTOR` wide, `REVEAL_VPAD`
  top+bottom) while `Stage` **pins each stage to the real device size** (`REVEAL_FRAME_W/H` in
  Template7's `index.tsx`, applied inline when `data-reveal`) centred with `overflow: visible` and
  `margin-block: REVEAL_VPAD`, so bleed spills on all four sides around a dashed device frame
  (`Stage.module.css` `::after`) at full size — *not* a zoom-out.
- **Type must be `cqi`, not `vw`/`vmin`** in Stage content (`.stage` is `container-type:
  inline-size`; see `Stage.module.css`, `Layer.tsx`, `Template7.module.css`). Reveal pins the stage
  narrower than the widened iframe, so viewport units would inflate the countdown/names; `cqi`
  resolves against the stage and equals `vw` whenever the stage fills the viewport (normal mode).
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
- **Device-shape drift on the fixed-stage compositor (open, T7).** Layer `x`/`y`/`w`/`h` are
  independent percentages of the stage box, and `useBreakpoint` buckets everything under 900px as
  one `mobile` layout — so a composition tuned on a ~390×844 phone visibly separates on a very
  different aspect ratio (Samsung Fold cover ~1:2.56, unfolded ~1:1.25). The background already
  `object-fit: cover`s; the foreground does not follow it. Agreed fix (**not yet implemented**):
  render the whole composition inside a fixed reference canvas and apply **one** shared
  cover-crop transform to it, so every layer scales with the background as a unit — the same math
  `bgFit: cover` already does, applied to the group. Lives in `Stage.tsx`/`Stage.module.css`; needs
  no change to the stored per-layer percentages. Requires tagging layers "core" (never crop:
  countdown, RSVP, names) vs "decorative" (croppable) per stage.
- The Adjust preview device presets (`PreviewPanel.tsx`) are all standard phones (SE / 15 / Pro
  Max) — there is no Fold-cover or Fold-unfolded preset, so the failure case above can't be
  previewed without real hardware.

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
  GUI admin on `127.0.0.1:81`, SSH-tunnel only), **not** the `Caddyfile`/`CUSTOM_DOMAINS.md` in
  this repo — that describes an on-demand-TLS migration that was drafted but never deployed.
  Adding/editing a domain means logging into the NPM UI and adding/editing a **Proxy Host**, not
  touching the Caddyfile. `CUSTOM_DOMAINS.md`'s Caddy plan (and the PRO custom-domain auto-TLS
  `ask` flow it describes) is not actually wired up live.
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
