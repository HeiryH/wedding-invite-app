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
- Roles: `SUPER_ADMIN`, `COUPLE_ADMIN`
- Token is read from cookies in `Program.cs` via `OnMessageReceived` event
- `IWeddingAuthorizationService` / `CanAccessWeddingAsync` enforces couple admin can only access their own wedding

### Frontend API Layer
All API calls go through `frontend/lib/api/` and are exported from `index.ts`. Each service file wraps an `apiClient` (Axios instance). **Always add new service methods to the relevant service file and re-export from `index.ts`.**

### Routing (Next.js App Router)
- `/` — public landing
- `/login` — shared login; redirects by role
- `/super-admin/*` — SUPER_ADMIN dashboard (weddings, packages, per-wedding tabs)
- `/couple-admin/*` — COUPLE_ADMIN dashboard + customize page
- `/wedding/[coupleName]/*` — public invitation pages (feature-gated)

### Frontend → Backend Proxy
`next.config.ts` rewrites:
- `/api/*` → `http://localhost:5000/api/*`
- `/uploads/*` → `http://localhost:5000/uploads/*`

So all frontend fetches use relative paths (`/api/...`). `NEXT_PUBLIC_API_URL=/api` means `API_BASE = ''` for photo/static URLs.

### Feature Gating
Features (e.g. `PHOTO_BOOTH`, `RSVP`, `WISHES`) are toggled per-wedding via `WeddingFeature` junction table. Public pages check feature state before rendering tabs/sections.

### Template Customization
`WeddingTemplateConfig` stores key-value config per wedding. Schema defined in `frontend/lib/templateConfigSchema.ts` via `getConfigFields(templateId, role)`. Templates use a `t(key, fallback)` helper to resolve config values. `invite.body` is rich text (TipTap v3) rendered via `dangerouslySetInnerHTML`.

### EF Migrations (in order)
1. `AddFeaturesAndPhotos`
2. `AddTemplates`
3. `AddUsers`
4. `AddPhotoModeration`
5. `AddPackages`
6. `AddTemplateConfig`
7. `AddUserIsActive`
8. `AddItinerary` — (planned) ItineraryItem table

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
- `guestService.create` posts to `/guest/wedding/${weddingId}` but the backend create endpoint is `POST /api/guest` with `WeddingId` in body — admin-side guest creation is broken

## Planned Feature Roadmap (approved Apr 2026)

### Phase 1 — Backend: Itinerary data model
- New model: `ItineraryItem(Id, WeddingId, Label, Detail, SortOrder)`
- Migration: `AddItinerary`
- Repo → Service → Controller pattern (standard)
- Endpoints: `GET /api/itinerary/wedding/{weddingId}` (public), `POST`, `PUT /{id}`, `DELETE /{id}`, `PUT /wedding/{weddingId}/reorder`

### Phase 2 — Template config schema expansion
New config keys (stored in existing `WeddingTemplateConfig`, no migration):
- `walimah.body` — rich text (TipTap), Ceremony tab
- `general.showIslamicDate` — boolean toggle, Welcome tab (date auto-calculated via Hijri library from WeddingDate)
- `section.order` — comma-separated section codes (welcome,walimah,rsvp,itinerary,wishes,photobooth)
- `invite.heading.align`, `invite.body.align`, `walimah.body.align` — left/center/right
- `invite.heading.animation` — none/fade/slide/typewriter
- `invite.heading.color`, `invite.heading.shadow` — hex + preset
- `section.welcome.bg`, `section.ceremony.bg`, `section.celebration.bg` — image upload

### Phase 3 — Customize page: 3-tab Option B redesign
3 tabs map 1-to-1 to scroll sections of live invitation:
- **Welcome tab**: Bride/groom names, date, venue (edit Wedding model directly), Islamic date toggle, heading/body text + alignment/animation/color
- **Ceremony tab**: `walimah.body` (TipTap WYSIWYG), `rsvp.subtitle`, itinerary editor (Label+Detail rows, add/remove/reorder)
- **Celebration tab**: `wish.prompt`, photo booth label, background image
- Section reorder: up/down arrows on tabs → writes to `section.order`
- Preview: full-page on right, auto-scrolls to active section on tab switch

### Phase 4 — Templates 1–4 render new content
Each template refactored to:
- Render sections as dynamic array driven by `section.order` config
- Show Islamic date (Hijri) next to Gregorian if toggle enabled
- Render `walimah.body` rich text as a section
- Render itinerary as a styled schedule list
- Apply per-element alignment, animation, color, shadow from config
- Support background image per section

### Phase 5 — Template 5 (discuss after Phase 4)
T5 envelope/canvas/GSAP structure is fundamentally different — planned separately.
