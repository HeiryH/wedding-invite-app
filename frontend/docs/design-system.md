# Convive Design System

Reference document for the **Convive** design system applied to this project. All token values come from the zip at `~/Documents/e-Invite Saas/Convive Design System.zip`.

---

## Brand & voice

**Convive** — "one who feasts together." A SaaS platform for digital invitations and event management.

**Personality:** Warm, gracious, quietly elegant — a thoughtful host, never a loud salesperson.

### Voice & tone rules
- **Person:** Speak to the host as *you*; guests are *guests* / *everyone you love*.
- **Casing:** Sentence case everywhere in UI. Title Case only for product name, plan names, template names. Eyebrows/overlines in UPPERCASE with wide tracking.
- **Tone by surface:** Marketing = lyrical & confident. Product UI = plain, calm, helpful. Admin = precise and neutral.
- **Buttons:** Verb-first and specific: *Send invite*, *Create your invite*, *Joyfully accept*, *Publish*, *Choose Pro*. Avoid *Submit*, *OK*, *Click here*.
- **Numbers & dates:** Long dates in invitation voice ("Saturday, 14 June 2025"); compact in data UI ("14·06·25", "128 / 150"). RSVP/IDs in mono.
- **Emoji:** Subtly and occasionally in guest-generated/celebratory contexts only (a single ✨ in a best-wish). **Never** in navigation, buttons, admin, or as functional iconography. Default to none in chrome.

---

## Color tokens

### Project recolor — this app

The original Convive brand uses **claret** (`#a83541`) as primary. **This project uses dusk-blue** instead:

| Token | Value | Notes |
|---|---|---|
| `--brand` | `#436a8a` | Dusk-blue (replaces claret) |
| `--brand-hover` | `color-mix(in srgb, #436a8a 86%, #000)` | |
| `--brand-active` | `color-mix(in srgb, #436a8a 74%, #000)` | |
| `--brand-subtle` | `#e7eef4` | |
| `--brand-subtle-2` | `#d3e0ec` | |
| `--brand-border` | `#bcd0e0` | |
| `--brand-on` | `#ffffff` | Text on brand bg |
| `--brand-gradient` | `linear-gradient(165deg, #436a8a, color-mix(in srgb, #436a8a 70%, #000))` | Signature panel |
| `--ring` | `color-mix(in srgb, #436a8a 38%, transparent)` | Focus ring |
| `--text-link` | `color-mix(in srgb, #436a8a 88%, #000)` | |
| `--shadow-foil` | `0 1px 0 rgba(255,255,255,.5) inset, 0 2px 8px rgba(67,106,138,.20)` | Brand glow |
| `--info` | `#3a5f7d` | Nudged to avoid brand collision |
| `--info-subtle` | `#e2edf4` | |
| `--info-border` | `#b4cede` | |

Gold accent, sand surfaces, espresso ink, and warm shadows remain unchanged from Convive.

### Gold accent ramp

| Token | Value |
|---|---|
| `--gold-50` | `#fbf6e9` |
| `--gold-100` | `#f4e8c6` |
| `--gold-200` | `#e9d291` |
| `--gold-300` | `#dcb95c` |
| `--gold-400` | `#cca23a` (core) |
| `--gold-500` | `#b3882b` |
| `--gold-600` | `#8f6a22` |
| `--gold-700` | `#6d501e` |
| `--gold-800` | `#4e3a19` |

### Sand/neutral ramp (warm paper & ink)

| Token | Value | Role |
|---|---|---|
| `--sand-0` | `#ffffff` | |
| `--sand-25` | `#fdfbf7` | |
| `--sand-50` | `#faf6ef` | |
| `--sand-100` | `#f3ece1` | |
| `--sand-150` | `#ebe2d4` | |
| `--sand-200` | `#ded2c0` | |
| `--sand-300` | `#c7b8a3` | |
| `--sand-400` | `#a89a86` | |
| `--sand-500` | `#847766` | |
| `--sand-600` | `#645a4d` | |
| `--sand-700` | `#46403a` | warm gray ink |
| `--sand-800` | `#312c28` | |
| `--sand-900` | `#211d1a` | |
| `--espresso` | `#1c1815` | deepest ink |

### Celebration palette (event-type theming)

| Token | Value |
|---|---|
| `--hue-claret` | `#a83541` |
| `--hue-terracotta` | `#bf6a4a` |
| `--hue-ochre` | `#c79436` |
| `--hue-sage` | `#7c8a63` |
| `--hue-eucalypt` | `#5f7d6e` |
| `--hue-dusk` | `#4f6d8c` |
| `--hue-plum` | `#6f4a64` |
| `--hue-mauve` | `#9b6a78` |
| `--hue-ink` | `#2f3a44` |

### Semantic — surfaces, text, borders

```
--surface-app:      var(--sand-50)      page background
--surface-card:     var(--sand-0)       raised cards
--surface-sunken:   var(--sand-100)     wells, insets
--surface-canvas:   var(--sand-150)     editor canvas mat
--surface-inverse:  var(--espresso)
--surface-overlay:  rgba(28,24,21,.46)  modal scrim

--text-strong:      var(--espresso)     headings
--text-body:        var(--sand-800)     default copy
--text-muted:       var(--sand-600)     secondary
--text-subtle:      var(--sand-500)     meta, captions
--text-faint:       var(--sand-400)     placeholder
--text-on-inverse:  var(--sand-50)

--border-subtle:    var(--sand-150)
--border-default:   var(--sand-200)
--border-strong:    var(--sand-300)
--divider:          var(--sand-150)

--accent:           var(--gold-400)
--accent-hover:     var(--gold-500)
--accent-subtle:    var(--gold-50)
--accent-on:        var(--espresso)
```

### Semantic state colors

```
--success:          #3f7d57    --success-subtle:   #e8f2eb    --success-border:   #bcd9c7
--warning:          #b9821f    --warning-subtle:   #fbf1da    --warning-border:   #ecd49b
--danger:           #b23b3b    --danger-subtle:    #fbe9e7    --danger-border:    #eab7b2
```

### Status (invite lifecycle)

```
--status-draft:     var(--sand-500)
--status-scheduled: var(--info)
--status-live:      var(--success)
--status-closed:    var(--sand-600)
```

Badge tone mapping: Draft → neutral · Scheduled → info · Live → success · Closed → neutral.

---

## Typography

### Font families

| Role | Family | CSS variable |
|---|---|---|
| Display | Cormorant Garamond | `--font-display` |
| UI / body | Hanken Grotesk | `--font-ui` |
| Mono | JetBrains Mono | `--font-mono` |

Display is used for event titles, hero numbers (StatCard values), editorial moments, dialog titles.
UI is used for everything functional: labels, body, buttons, tables, forms.
Mono for IDs, RSVP codes, capacity counts.

### Weights

```
--fw-regular:  400
--fw-medium:   500
--fw-semibold: 600
--fw-bold:     700
--fw-display:  600
```

### UI type scale

| Token | Size | Usage |
|---|---|---|
| `--text-2xs` | 11px | micro labels, table meta |
| `--text-xs` | 12px | captions, badges |
| `--text-sm` | 13px | secondary UI |
| `--text-md` | 14px | default UI / body small |
| `--text-base` | 15px | body |
| `--text-lg` | 17px | lead body |
| `--text-xl` | 20px | section heads |
| `--text-2xl` | 24px | |
| `--text-3xl` | 30px | |

### Display scale (serif, invitation voice)

```
--display-sm:  32px    --display-md:  44px
--display-lg:  60px    --display-xl:  80px
--display-2xl: 104px   (hero invite titles)
```

### Line heights & tracking

```
--leading-tight: 1.1    --leading-snug:    1.25   --leading-normal:  1.5
--leading-relaxed: 1.65  --leading-display: 1.04

--tracking-tighter: -0.02em  --tracking-tight: -0.01em  --tracking-normal: 0
--tracking-wide: 0.02em      --tracking-wider: 0.06em   --tracking-caps: 0.14em
```

### Semantic roles

```
--eyebrow-size:     var(--text-xs)
--eyebrow-tracking: var(--tracking-caps)
--label-size:       var(--text-md)
--body-size:        var(--text-base)
```

---

## Spacing, radii, sizing, layout, z-index

### Spacing (4px base grid)

```
--space-0: 0         --space-px: 1px      --space-0-5: 2px
--space-1: 4px       --space-1-5: 6px     --space-2: 8px
--space-2-5: 10px    --space-3: 12px      --space-4: 16px
--space-5: 20px      --space-6: 24px      --space-7: 28px
--space-8: 32px      --space-10: 40px     --space-12: 48px
--space-16: 64px     --space-20: 80px     --space-24: 96px
```

### Radii

```
--radius-xs: 4px     --radius-sm: 6px     --radius-md: 9px    (controls)
--radius-lg: 14px    (cards)              --radius-xl: 20px   (modals)
--radius-2xl: 28px   (hero/invite cards)  --radius-full: 999px
```

### Control heights

```
--control-sm: 32px   --control-md: 38px   --control-lg: 44px  (touch floor)
```

### Layout

```
--container: 1200px   --container-wide: 1360px   --container-prose: 680px
--sidebar-w: 264px    --topbar-h: 60px
```

### Z-index

```
--z-base: 0   --z-raised: 10   --z-sticky: 100
--z-overlay: 1000   --z-modal: 1100   --z-toast: 1200   --z-tooltip: 1300
```

---

## Elevation & motion

### Shadows (warm espresso tint, not pure black)

```
--shadow-xs:   0 1px 2px rgba(33,29,26,.06)
--shadow-sm:   0 1px 2px rgba(33,29,26,.05), 0 2px 6px rgba(33,29,26,.06)
--shadow-md:   0 2px 4px rgba(33,29,26,.05), 0 6px 16px rgba(33,29,26,.09)
--shadow-lg:   0 4px 10px rgba(33,29,26,.07), 0 16px 36px rgba(33,29,26,.12)
--shadow-xl:   0 8px 18px rgba(33,29,26,.09), 0 28px 60px rgba(33,29,26,.16)
--shadow-inset: inset 0 1px 2px rgba(33,29,26,.10)
--card-shadow:       var(--shadow-sm)
--card-shadow-hover: var(--shadow-md)
--shadow-focus: 0 0 0 3px var(--ring)
```

### Motion

```
--dur-instant: 80ms   --dur-fast: 140ms   --dur-base: 200ms
--dur-slow: 320ms     --dur-slower: 500ms

--ease-out:      cubic-bezier(0.22, 1, 0.36, 1)
--ease-in-out:   cubic-bezier(0.65, 0, 0.35, 1)
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1)
--ease-emphasis: cubic-bezier(0.34, 1.56, 0.64, 1)   (delight only, no bounce in chrome)

--transition-control: background-color var(--dur-fast) var(--ease-standard),
                      border-color var(--dur-fast) var(--ease-standard),
                      color var(--dur-fast) var(--ease-standard),
                      box-shadow var(--dur-fast) var(--ease-standard)
```

Respects `prefers-reduced-motion` (all durations collapse to 0ms).

**Interaction states:**
- Hover: primary darkens (brand-hover) + slightly stronger shadow
- Press: `translateY(0.5px) scale(0.985)` — `--dur-instant`
- Focus: 3px brand focus ring (`--shadow-focus`)
- Disabled: ~55% opacity, `not-allowed`

---

## Iconography

- **One system:** Lucide-style geometry (24×24 grid, ~1.9px stroke, round caps/joins, `currentColor`)
- **Sizes:** 18px inline UI · 16px inside buttons · 20–24px for feature tiles/empty states
- **No emoji as functional icons.** Emoji in user-generated/celebratory content only
- **Brand assets** in `public/brand/`: `convive-mark.svg`, `convive-mark-dark.svg`, `convive-wordmark.svg`, `convive-wordmark-light.svg`, `seal-shape.svg`

---

## Components

All components live in `frontend/components/ui/`. Each reads CSS-variable tokens; color/dark-mode flips automatically.

### Icon

```tsx
<Icon name="calendar" />
<Icon name="heart" size={20} color="var(--brand)" />
<button><Icon name="send" size={16} /> Send invite</button>
```

Props: `name` (see icon set), `size` (default 18), `strokeWidth` (default 1.9), `color`. Inherits `currentColor`.

Available icon names (80+): nav (menu, x, search, plus, minus, check, chevrons, arrows, more-horizontal, external-link), objects (calendar, clock, map-pin, mail, send, users, user, heart, star, image, camera, gift, sparkles, message-circle, bell), editor (layout-grid, palette, type, pencil, eye, trash, copy, share, download, upload, link, settings, sliders, filter), status (check-circle, alert-triangle, info, lock), event-specific (qr-code, ticket, table, grid, home, log-out, smile, credit-card).

### IconButton

```tsx
<IconButton name="pencil" label="Edit" />
<IconButton name="trash" label="Delete" tone="danger" />
<IconButton name="x" label="Close" round />
```

Props: `name`, `label` (required — tooltip + a11y), `variant` (ghost|soft|outline), `size` (sm|md|lg), `tone` (neutral|brand|danger), `round`, `disabled`, `onClick`.

### Button

```tsx
<Button onClick={save}>Send invite</Button>
<Button variant="secondary" iconLeft={<Icon name="eye" size={16} />}>Preview</Button>
<Button variant="ghost" tone="neutral" size="sm">Cancel</Button>
<Button tone="danger" variant="soft">Delete event</Button>
<Button loading fullWidth>Saving…</Button>
```

Props: `variant` (primary|secondary|ghost|soft|link), `tone` (brand|neutral|danger), `size` (sm|md|lg), `iconLeft`, `iconRight`, `fullWidth`, `loading`, `disabled`, `type`, `onClick`.

One `primary` per view. Use `soft`+`danger` for destructive, never `primary`+`danger` unless sole confirm.

### Input

```tsx
<Input label="Event name" placeholder="Amara & Daniel's Wedding" required />
<Input label="Search guests" leading={<Icon name="search" size={16} />} />
<Input label="Email" error="That address looks off" />
```

Props: `label`, `hint`, `error`, `size` (sm|md|lg), `leading`, `trailing`, `required`, `disabled`. Standard input attrs forwarded.

### Textarea

```tsx
<Textarea label="A note to your guests" rows={4} placeholder="We can't wait to celebrate with you…" />
```

Props: `label`, `hint`, `error`, `rows`, `required`, `disabled`. Vertically resizable.

### Select

```tsx
<Select label="Event type" placeholder="Choose…" options={["Wedding","Birthday","Gala"]} />
<Select label="Meal" options={[{value:"veg",label:"Vegetarian"},{value:"fish",label:"Fish"}]} />
```

Props: `label`, `hint`, `error`, `options` (string[] | {value,label}[]), `placeholder`, `size`, `disabled`.

### Checkbox

```tsx
<Checkbox label="Allow +1 guests" defaultChecked />
<Checkbox label="Photobooth" description="Guests can upload photos" />
```

Props: `label`, `description`, `checked`, `defaultChecked`, `disabled`, `onChange`.

### Radio / RadioGroup

```tsx
<RadioGroup value={meal} onChange={setMeal} options={[
  { value: "veg", label: "Vegetarian", description: "Seasonal plates" },
  { value: "fish", label: "Fish" },
]} />
```

Props: `options` ({value, label, description}[]), `value`, `onChange`, `name`, `gap`.

### Switch

```tsx
<Switch label="Photobooth" description="Guests upload to a shared gallery" defaultChecked />
<Switch checked={live} onChange={e => setLive(e.target.checked)} />
```

Props: `label`, `description`, `checked`, `defaultChecked`, `size` (sm|md), `disabled`, `onChange`. Track glows brand with foil shadow when on.

### Badge

```tsx
<Badge tone="success" dot>Live</Badge>
<Badge tone="neutral" dot>Draft</Badge>
<Badge tone="gold" variant="solid">Premium</Badge>
<Badge tone="brand">128 RSVPs</Badge>
```

Props: `tone` (neutral|brand|gold|success|warning|danger|info), `variant` (soft|outline|solid), `dot`, `size` (sm|md).

Lifecycle: Draft→neutral · Scheduled→info · Live→success · Closed→neutral.

### Tag

```tsx
<Tag color="var(--hue-sage)">Table 4 — Garden</Tag>
<Tag onRemove={() => drop(id)}>Vegetarian</Tag>
```

Props: `color` (dot color), `onRemove`, `size` (sm|md).

### Avatar / AvatarGroup

```tsx
<Avatar name="Amara Bello" />
<Avatar src="/photo.jpg" name="Daniel" size={48} ring />
<AvatarGroup people={["Amara Bello","Daniel Cho","Priya R"]} max={4} />
```

Props: `name`, `src`, `size` (default 36), `ring`, `square`. Falls back to initials on a deterministic celebration-palette tint. AvatarGroup: `people` (string[] | {name,src}[]), `max`, `size`.

### Card / StatCard

```tsx
<Card interactive onClick={open}>…</Card>
<StatCard label="Total RSVPs" value="128" sublabel="/ 150" icon={<Icon name="users" />}
  trend={{dir:"up",label:"+12 this week"}} />
```

Card props: `padding`, `interactive`, `as` (tag override). 1px border + shadow-sm, 14px radius.
StatCard props: `label`, `value` (Cormorant display voice), `sublabel`, `icon`, `trend` ({dir:"up"|"down"|"flat", label}), `tone` (neutral|brand|gold|success).

### Tabs

```tsx
<Tabs tabs={[
  { value: "overview", label: "Overview" },
  { value: "guests", label: "Guests", count: 128 },
]} defaultValue="overview" onChange={setTab} />
<Tabs variant="pill" tabs={[…]} />
```

Props: `tabs` ({value, label, icon?, count?}[]), `value`, `defaultValue`, `onChange`, `variant` (underline|pill), `size` (sm|md).

### ProgressBar / ProgressRing

```tsx
<ProgressBar value={128} max={150} label="Seats filled" showValue tone="brand" />
<ProgressRing value={84} tone="gold">84%</ProgressRing>
```

ProgressBar: `value`, `max`, `tone` (brand|gold|success|neutral), `size` (sm|md|lg), `label`, `showValue`.
ProgressRing: `value`, `max`, `size`, `stroke`, `tone`.

### EmptyState

```tsx
<EmptyState icon="users" title="No replies yet"
  description="Share your invite link and watch the RSVPs roll in."
  action={<Button iconLeft={<Icon name="send" size={16}/>}>Share invite</Button>} />
```

Props: `icon`, `title` (display serif), `description`, `action`, `compact`.

### Toast

```tsx
<Toast tone="success" title="Invite sent" onClose={dismiss}>128 guests notified.</Toast>
<Toast tone="warning" floating title="Plan limit reached"
  action={<Button size="sm" tone="brand">Upgrade</Button>} />
```

Props: `tone` (info|success|warning|danger|brand), `title`, `onClose`, `action`, `icon`, `floating`.

### Tooltip

```tsx
<Tooltip content="Duplicate invite" side="top">
  <IconButton name="copy" label="Duplicate" />
</Tooltip>
```

Props: `content`, `side` (top|bottom|left|right), `delay` (ms).

### Dialog

```tsx
<Dialog open={open} onClose={close} title="Publish invite?"
  description="Guests will see it immediately."
  footer={<><Button variant="ghost" tone="neutral" onClick={close}>Cancel</Button>
           <Button onClick={publish}>Publish</Button></>}>
  Content here.
</Dialog>
```

Props: `open`, `onClose`, `title` (display serif), `description`, `footer`, `size` (sm|md|lg), `icon`, `tone` (neutral|brand|danger|success). Closes on scrim click or Escape.

Use `tone="danger"` + `icon="trash"` for destructive confirms.

### FeatureToggle

```tsx
<FeatureToggle icon="camera" title="Photobooth"
  description="Guests upload photos to a shared gallery" defaultEnabled />
<FeatureToggle icon="table" title="Table seating" tier="Premium"
  description="Let guests pick a labelled table" locked lockedHint="Premium plan" />
```

Props: `icon`, `title`, `description`, `enabled`, `defaultEnabled`, `onChange`, `tier` (Badge label), `locked`, `lockedHint`, `disabled`. The signature feature-gating row — use in FeaturesTab and super-admin feature matrix.

---

## UI-kit patterns

### Admin console shell (super-admin)

Dark espresso left rail (220px), warm ivory main area:

```
rail:
  background: var(--espresso)  color: var(--sand-100)
  brand logo mark (dark variant) + "Console" wordmark
  nav items: 9px 11px padding, radius-md, active = rgba(255,255,255,.10)
  bottom: avatar pill with role label

topbar:
  60px, border-bottom, surface-card, serif page title (text-2xl), search well, action Buttons

stat row:
  grid auto-fit minmax(200px), StatCard × 4 (brand/gold/success tones)

Tabs (underline): Feature gating | Clients | Plans
```

### Feature-gating table

Card (overflow hidden), `surface-sunken` thead, hairline row borders, each row: `FeatureToggle`-style icon + title left, dot-check columns per plan (success-subtle ✓ or surface-sunken −).

### Client table

Card, same thead pattern; columns: Avatar + name/org, Plan `Badge`, event count, template selector, status `Badge` (dot), `IconButton` more-horizontal.

### Host dashboard shell (couple-admin)

Light sidebar 264px (`surface-card`, border-right), `NavItem` buttons (brand-subtle active bg), plan pill at bottom (brand-gradient with gold text), avatar + name footer.

Topbar: serif title, search well, bell IconButton, "New invite" Button.

### Event spotlight card

```
cover:  brand-gradient panel, radial glow overlay (gold + white @ 16% opacity)
        eyebrow: event type · date (gold-200, uppercase)
        title: font-display, display-sm
body:   StatusBadge, mono invite URL link, Preview + Manage buttons
        ProgressBar (seats confirmed), AvatarGroup + text
```

### Event list cards

Interactive Cards, icon tile (hue-tinted), StatusBadge, display-title, date meta, ProgressBar.

---

## File locations in this project

```
frontend/
  docs/
    convive-design-system.md     ← this file
  components/ui/
    Icon.tsx         IconButton.tsx
    Button.tsx       Input.tsx        Textarea.tsx     Select.tsx
    Checkbox.tsx     Radio.tsx        Switch.tsx
    Badge.tsx        Tag.tsx          Avatar.tsx        Card.tsx
    Tabs.tsx         ProgressBar.tsx  EmptyState.tsx
    Toast.tsx        Tooltip.tsx      Dialog.tsx
    FeatureToggle.tsx
    index.ts
  public/brand/
    convive-mark.svg   convive-mark-dark.svg
    convive-wordmark.svg   convive-wordmark-light.svg   seal-shape.svg
  app/
    globals.css        ← Convive tokens (recolored)
    layout.tsx         ← Cormorant + Hanken + JetBrains fonts
```
