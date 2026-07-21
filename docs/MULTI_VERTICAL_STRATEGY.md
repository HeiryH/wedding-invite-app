# From e-invite to a multi-vertical "site + modules" platform — strategy & roadmap

> Status: strategy / decision document (no code changes). Authored to assess turning the
> wedding e-invite SaaS into a multi-vertical platform. Kept intentionally vertical-generic.

## Context

The app today is a wedding e-invite SaaS, but the goal is to assess whether its backend is
generic enough to become a **multi-vertical platform**: the same super-admin seeing several
service types (e-invites, SME websites, small booking systems), each with its own workflow
but sharing one system design. The intuition — "guest RSVP choosing a table" ↔ "customer
bookings"; "guest picture upload" ↔ "client product-image upload" — is correct, and the
codebase supports it more than it looks.

This document is a **decision aid, not an implementation plan**. It maps what is already
reusable, proposes one abstraction ("a Site is a SiteType + a set of modules"), and lays out
a phased path. No code is changed yet. Deliberately **vertical-generic** — the model composes
modules per site rather than hard-coding a single second vertical.

**Verdict up front:** the *plumbing* (auth, tenancy, tenant-isolation, feature-gating, tier
gating, per-tenant config store, image pipeline, template registry) is vertical-neutral and
reusable. "Wedding" is baked into ~5 columns, the URL-slug naming, a handful of leaf entities,
and two front-end data files. The refactor is real but **bounded and mostly mechanical** — a
renaming + one new discriminator, not a rewrite.

---

## What's already generic vs. wedding-baked (reuse audit)

The whole backend follows one pattern: `{Entity}` + `{Entity}Service` + `{Entity}Controller`
+ a `WeddingId` FK + `IWeddingAuthorizationService.CanAccessWeddingAsync` tenant check. That
uniformity is the platform's biggest asset — generalizing the tenant root generalizes
everything hanging off it.

| Subsystem | Reuse verdict | Why |
|---|---|---|
| Auth / roles / JWT-in-cookie | **As-is** | `User`, `UserRoles`, tier string all vertical-neutral |
| Tenant isolation (`CanAccessWeddingAsync`) | **Rename only** | 3-branch logic (super-admin bypass / owner-FK / membership) is generic; authorizes by `id:int`, doesn't care what the tenant *is* |
| Feature gating (`Feature`/`WeddingFeature`) | **Rename only** | `WeddingFeature` already has a free-form JSON `Configuration` column; can gate arbitrary modules today by inserting catalog rows |
| Tier gating (`TierEntitlements`, `Template.Tier`) | **As-is** | FREE/PREMIUM/PRO ranking is domain-agnostic; unknown codes default to rank 0 (safe to extend) |
| Per-tenant config store (`WeddingTemplateConfig` + `TemplateConfigPolicy`) | **As-is (backend)** | Pure key→value bag + pattern-based write policy (`adminOnly`, `t*.layout.*`→PRO). The most reusable piece here |
| Image pipeline (`PhotoService`, `FileSignatureValidator`, `/uploads` proxy) | **As-is / rename** | Upload + magic-byte validation + moderation workflow is generic; only the `TemplateSlot` int enum is wedding-shaped |
| Booking skeleton (`Guest` + `GuestService` + `Table`/`TableService`) | **Rename + extend** | Already a reservation: party size + resource + per-entry & total capacity + open/closed window + confirmation email. `Table` is a textbook "resource with a headcount." **Missing only a datetime-slot dimension** |
| Template engine (`_shared/` stage compositor, `TemplateWrapper`, config schema) | **Framework reusable; content per-vertical** | Selection is switch/dynamic-import by bare `templateId`; needs a real registry keyed by (siteType, code) |

**Where "wedding" is actually baked in (the whole surface to generalize):**

1. **Tenant root** — `backend/WeddingInvite.Models/Wedding.cs`: only `BrideName`, `GroomName`,
   `WeddingDate`, `Venue`, `VenueAddress` are hard domain columns; `CoupleName` doubles as the
   URL slug. **No `SiteType`/vertical discriminator exists — that's the single biggest missing
   abstraction.**
2. **Ownership asymmetry** — two paths: `COUPLE_ADMIN` owns 1 wedding via `User.WeddingId`
   (1:1); `HOST_ADMIN` owns many via reverse FK `Wedding.CreatedByUserId` (1:many). To let one
   user own several sites, these collapse into one membership model.
3. **Leaf entities** — `Guest` (`BrideOrGroomSide`, `SongRequest`), `Photo.TemplateSlots`,
   `Wish`, `ItineraryItem` carry wedding vocabulary.
4. **Two front-end data files** — `frontend/lib/templateConfigSchema.ts` (~600 lines of wedding
   field defs) and the customize-page constants (`SECTION_BLOCKS`, `BLOCK_INFO`, `RAIL_SECTIONS`,
   `BlockId` in `app/couple-admin/customize/page.tsx`) + `lib/templateUtils.ts` (Hijri date).
   These are *data*, not framework.
5. **Selection sites** — `TemplateWrapper.tsx` switch, `TemplateRenderer` dynamic import
   (`app/wedding/[coupleName]/page.tsx`), `middleware.ts` (domain→couple), `wedding/[coupleName]`
   public route.

---

## The proposed abstraction: **Site = SiteType + a set of Modules**

One concept unlocks the whole thing. Rename the tenant root `Wedding` → **`Site`**, and give it
a **`SiteType`** discriminator (`EINVITE | BUSINESS | BOOKING | …`). Everything else is already
per-tenant and hangs off that root unchanged.

A **Module** is a self-contained capability the platform already has, decoupled from wedding
naming and switched on per-site via the existing `WeddingFeature` mechanism (its JSON
`Configuration` column carries the per-site settings). The current subsystems *are* the first
modules:

| Module (generic) | Built from today's… | e-invite meaning | business/booking meaning |
|---|---|---|---|
| **Reservations** | `Guest`+`GuestService`+`Table` | Guest RSVP + table pick | Customer booking + resource/slot |
| **Media intake** | `PhotoService`+`FileSignatureValidator` | Guest photo upload / couple portraits | Client product images / gallery |
| **Guestbook / Forms** | `Wish`+`WishService` | Well-wishes | Enquiries / lead capture / reviews |
| **Schedule** | `ItineraryItem` | Wedding itinerary | Opening hours / event agenda |
| **Content pages** | `WeddingTemplateConfig` + templates | Invitation sections | Home / about / services pages |
| **Custom domain** | existing `Domain` + `middleware.ts` | couple's domain | business's domain |

A **vertical is then just a preset**: a `SiteType` + a default module set + a template pack + a
config schema. Adding a vertical becomes a *data/config* exercise (seed a preset, author a
schema file, ship a template set), not a plumbing exercise — because the plumbing is shared.
This is the payoff of keeping it generic: you don't build "the bookings app," you enable the
Reservations module (plus a datetime dimension) and any site type can turn it on.

**Super-admin experience** (the "2–3 services" view): a **service switcher** at the top of the
super-admin shell (natural home: `NAV_ITEMS` in `app/super-admin/layout.tsx` + the already-
parameterized `components/admin/AdminShell.tsx`). Picking a service scopes the dashboard's list
+ stat cards to that `SiteType`. Drilling into a site shows only the tabs for its enabled
modules (the per-site tab set in `app/super-admin/wedding/[weddingId]/page.tsx` becomes
module-driven). Same shell, same components, different data — exactly "different workflow,
shared system design."

---

## The one genuinely new capability

Everything above is rename-and-generalize. The **only net-new backend concept** the current
model lacks is a **time dimension** for the Reservations module. Today a "slot" is a physical
`Table` (a resource with a headcount), not a datetime. Booking verticals (appointments,
classes, rentals) need bookable **time-slots** — a resource *plus* a start/end and an
availability calendar. This is an additive extension to `Table`/`Guest` (a `Slot` entity +
availability rules), not a change to anything wedding sites use.

---

## Phased roadmap (strategy-level — sequence, effort, risk)

Ordered so each phase is independently shippable and de-risks the next. No dates; relative
effort only (S/M/L).

- **Phase 0 — Prove the spine (S).** Add a nullable `SiteType` column to the tenant root
  (default `EINVITE`, backfill existing rows) + a super-admin service switcher that filters by
  it. Zero behavior change for weddings; the platform can now *hold* multiple service types.
  Lowest-risk first move.
- **Phase 1 — De-wedding the vocabulary (M).** Rename `Wedding`→`Site`, `CoupleName`→`Slug`,
  `IWeddingAuthorizationService`→`ISiteAuthorizationService`, the FKs, and the front-end
  types/services. Pure mechanical rename behind the same behavior. Biggest diff, lowest
  conceptual risk — do it as one focused pass with tests green.
- **Phase 2 — Modularize (M).** Turn the subsystems into named modules gated by the existing
  feature system; make the per-site tab set and the customize rail **module-driven** instead of
  hard-coded. Move the 5 wedding-only columns off the root into the config bag or a per-vertical
  detail table.
- **Phase 3 — Template registry (M).** Replace the `templateId` switch / dynamic-import with a
  real registry keyed by `(siteType, code)` → `{component, configSchema, propContract}`. Split
  `templateConfigSchema.ts` into per-vertical schema files sharing the `TemplateConfigField`
  shape.
- **Phase 4 — First non-wedding vertical (L).** Seed one `SiteType` preset end-to-end: template
  pack + config schema + default module set. Add the **datetime-slot** extension to Reservations
  if that vertical needs bookings. First real proof of the generic model.
- **Phase 5 — Ownership unification (M, optional).** Collapse `User.WeddingId` (1:1) and
  `Site.CreatedByUserId` (1:many) into one membership model so a single owner can run several
  sites across verticals. Only needed once you want multi-site owners.

**Cross-cutting prerequisites already on the existing roadmap** that this leans on: tests
(`WeddingInvite.Tests` — auth/tenant-isolation coverage makes the Phase 1 rename safe),
logging/global exception handling, and the SQLite→Postgres move (multi-vertical scale).
Sequence the rename *after* the tenant-isolation tests exist.

---

## Risks & watch-outs

- **The rename is wide but shallow.** `Wedding`/`WeddingId`/`CoupleName` thread through
  migrations, ~15+ backend files, and most front-end services. Low conceptual risk, high
  mechanical surface — do it with tests green and as its own PR, not mixed with feature work.
- **Config-key namespaces are load-bearing.** `TemplateConfigPolicy` gates by key *pattern*
  (`t\d+\.layout\.`→PRO). Per-vertical schemas must keep the TS↔C# mirror intact or PRO/admin
  gating silently breaks.
- **Whole-bag PUT prunes.** The customize save deletes stored keys the caller could have written
  but didn't submit. Any module-driven schema split must not narrow a site's writable key set
  mid-flight or it destroys saved content.
- **Don't over-build verticals before the abstraction earns it.** A vertical is a preset. Resist
  per-vertical branches in shared code (the schema-driven customize page already proves this
  pattern — keep it).
- **Billing still doesn't exist** (no Brunei gateway; tier changes are manual). Multi-vertical
  multiplies the monetization surface but does **not** add a payment system — keep tier changes
  manual until a gateway decision is made.

---

## How to validate this direction (no code)

This is a strategy doc, so "verification" = pressure-testing the model before committing:

1. **Pick two candidate verticals** you'd actually sell and write their preset on paper: which
   modules on, which template pack, which config sections. If both express cleanly as "SiteType
   + module set" with no shared-code branching, the abstraction holds.
2. **Trace one workflow across verticals** end to end (e.g. Reservations: RSVP vs. an appointment
   booking). Confirm the only gap is the datetime-slot dimension — if other gaps appear, fold
   them into Phase 4 scope before starting.
3. **Sanity-check ownership needs.** If your go-to-market has one customer running multiple
   sites, Phase 5 moves up; if not, it stays optional.

Once the two presets and the one traced workflow look clean, the safe first build is Phase 0
(the `SiteType` discriminator + service switcher) — additive, reversible, and behavior-neutral
for the live wedding product.
