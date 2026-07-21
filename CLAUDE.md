# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

### Frontend
```bash
# From frontend/
npm run dev     # Dev server on :3000
npm run build   # Production build
npm run lint    # ESLint
```

## Architecture

### Monorepo Layout
- `backend/` — ASP.NET Core 10 solution (`WeddingInvite.slnx`)
  - `WeddingInvite.Models` — EF entity classes only
  - `WeddingInvite.Data` — `AppDbContext`, repositories, migrations
  - `WeddingInvite.Core` — DTOs, service interfaces + implementations
  - `WeddingInvite.API` — controllers, DI wiring (`Program.cs`), static file serving
- `frontend/` — Next.js 16 (App Router, TypeScript)

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

### Frontend API Layer
All API calls go through `frontend/lib/api/` and are exported from `index.ts`. Each service file wraps an `apiClient` (Axios instance). **Always add new service methods to the relevant service file and re-export from `index.ts`.**

### Routing (Next.js App Router)
- `/` — public landing
- `/login` — shared login; redirects by role
- `/super-admin/*` — SUPER_ADMIN dashboard (weddings, packages, features, themes, hosts, per-wedding tabs)
- `/host-admin/*` — HOST_ADMIN (reseller) dashboard; create/manage owned weddings
- `/couple-admin/*` — COUPLE_ADMIN dashboard + customize page
- `/wedding/[coupleName]/*` — public invitation pages (feature-gated)
- `/home`, `/templates`, `/try` — public self-serve funnel

### Frontend → Backend Proxy
`next.config.ts` rewrites:
- `/api/*` → `http://localhost:5000/api/*`
- `/uploads/*` → `http://localhost:5000/uploads/*`

So all frontend fetches use relative paths (`/api/...`). `NEXT_PUBLIC_API_URL=/api` means `API_BASE = ''` for photo/static URLs.

### Feature Gating
Features are toggled per-wedding via `WeddingFeature` junction table. Codes in `FeatureCodes.cs`: `RSVP`, `WISHES`, `PHOTO_BOOTH`, `SEATING`, `GALLERY`, `COUNTDOWN`, `CUSTOM_DOMAIN`. Public pages check feature state before rendering tabs/sections.

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

### EF Migrations (24 total, in order)
`InitialCreate` → `AddFeaturesAndPhotos` → `AddTemplates` → `RenameTemplateToTemplates` → `AddUsers` → `AddPhotoModeration` → `AddPackages` → `AddWeddingMedia` → `MergeWeddingMediaIntoPhoto` → `AddTemplateConfig` → `AddUserIsActive` → `AddSeatingTables` → `AddTemplate4MinimalNoir` → `AddTemplate5DreamingFloralSky` → `AddItinerary` → `AddTemplate6FairyGarden` → `AddWeddingMaxPax` → `AddWeddingCapacity` → `AddWeddingIsRsvpOpen` → `AddWeddingCreatedBy` → `AddTemplateTier` → `AddUserTier` → `AddWeddingIsPublic` → `AddTemplate7RomanGarden`

## Stage + layer engine (`components/templates/_shared/`)

The stage/layer compositor is a **shared, template-neutral engine**: `types.ts`, `layout.ts`
(pure `resolveStage`/`serializeStage`/`baseStage`/`layoutKey(prefix,…)` + `useStageLayout`),
`Stage.tsx`/`Layer.tsx`/`Stage.module.css`, `hooks/{useBreakpoint,useStageReveal,useParallax}.ts`,
`adjust/AdjustPanel.tsx`, and `engine.tsx` (a context supplying per-template `assetRoot` /
`assetSizes` / `slotRegistry`). Templates opt in with their own `keyPrefix` and stage-definition
map — `Template7-romangarden` (full compositor) and `Template5` (hybrid overlay) are the two
consumers today. Layouts persist per-template as `t<N>.layout.<bp>.<stageId>`. When adding a
template, see `~/.claude/plans/t5-adjust-rollout.md`.

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

## Known Issues
- Admin-side guest creation: `guestService` posts to `/guest/rsvp`; re-verify the admin create path works end-to-end (historically broken; endpoint changed).

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

- Branch: `frontend-design-fix`
- VPS: `root@139.180.154.175`, app at `/opt/wedding-app`
- Password: in `.env.deploy` at repo root (never committed — load with `source .env.deploy`)
