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
`WeddingTemplateConfig` stores key-value config per wedding. Schema defined in `frontend/lib/templateConfigSchema.ts` via `getConfigFields(templateId, role)`. Templates use a `t(key, fallback)` helper to resolve config values. `invite.body` is rich text (TipTap v3) rendered via `dangerouslySetInnerHTML`.

### EF Migrations (23 total, in order)
`InitialCreate` → `AddFeaturesAndPhotos` → `AddTemplates` → `RenameTemplateToTemplates` → `AddUsers` → `AddPhotoModeration` → `AddPackages` → `AddWeddingMedia` → `MergeWeddingMediaIntoPhoto` → `AddTemplateConfig` → `AddUserIsActive` → `AddSeatingTables` → `AddTemplate4MinimalNoir` → `AddTemplate5DreamingFloralSky` → `AddItinerary` → `AddTemplate6FairyGarden` → `AddWeddingMaxPax` → `AddWeddingCapacity` → `AddWeddingIsRsvpOpen` → `AddWeddingCreatedBy` → `AddTemplateTier` → `AddUserTier` → `AddWeddingIsPublic`

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
