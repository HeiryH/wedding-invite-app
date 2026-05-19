# Template6 (Fairy Garden) — Developer Customization Guide

This document is the master reference for anyone adjusting, reskinning, or extending the Template6 3D wedding invitation template. It maps every visual and behavioural aspect of the template to the exact file and line you need to change.

---

## Table of Contents

1. [Architecture — The 7-Layer Model](#1-architecture--the-7-layer-model)
2. [CSS Token Reference](#2-css-token-reference)
3. [Config Key Reference](#3-config-key-reference)
4. [3D Scene Customization](#4-3d-scene-customization)
5. [Adding a New 3D Effect](#5-adding-a-new-3d-effect)
6. [Section Components](#6-section-components)
7. [Fallback Background (No-WebGL)](#7-fallback-background-no-webgl)
8. [Performance Checklist](#8-performance-checklist)
9. [File Map](#9-file-map)

---

## 1. Architecture — The 7-Layer Model

Think of the template as 7 stacked layers. Each layer has one job and maps to specific files. Theme changes usually touch layers 4, 3, and 2 — in that order.

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 7 — Navigation & Controls                            │
│  Files: index.tsx (music bubble), components/NavBar.tsx     │
├─────────────────────────────────────────────────────────────┤
│  Layer 6 — Section Components                               │
│  Files: components/WelcomeSection.tsx                       │
│          components/CeremonySection.tsx                     │
│          components/RSVPSection.tsx                         │
│          components/ItinerarySection.tsx                    │
│          components/WishesSection.tsx                       │
│          components/PhotoBoothSection.tsx                   │
├─────────────────────────────────────────────────────────────┤
│  Layer 5 — Content & Config Resolution                      │
│  Files: index.tsx (t() helper), hooks/useFairyConfig.ts     │
│          data/defaultConfig.ts                              │
├─────────────────────────────────────────────────────────────┤
│  Layer 4 — CSS Visual Theme  ← CHANGE THIS FIRST            │
│  Files: Template6.module.css                                │
├─────────────────────────────────────────────────────────────┤
│  Layer 3 — 3D Particle Systems  ← CHANGE THIS SECOND        │
│  Files: scenes/FirefliesLayer.tsx                           │
│          scenes/PetalRain.tsx                               │
│          scenes/FloatingFlowers.tsx                         │
├─────────────────────────────────────────────────────────────┤
│  Layer 2 — 3D Scene Root  ← CHANGE THIS THIRD               │
│  Files: scenes/FairyGardenScene.tsx                         │
├─────────────────────────────────────────────────────────────┤
│  Layer 1 — WebGL & Fallback Guard                           │
│  Files: hooks/useWebGLSupport.ts                            │
│          components/FallbackBackground.tsx                  │
└─────────────────────────────────────────────────────────────┘
```

### How layers interact

- **Layer 1** detects device capability. If WebGL is unavailable, it short-circuits layers 2 and 3 and renders Layer 1's fallback instead.
- **Layer 2** sets up the 3D canvas, lights, fog, and post-processing. Layer 3 components live inside the canvas.
- **Layer 4** (CSS) controls all DOM appearance — colours, fonts, spacing, animations for layers 5–7.
- **Layer 5** resolves config values. The `t(key, fallback)` helper in `index.tsx` reads `customConfig` props. `useFairyConfig` converts raw config strings into a typed `FairyConfig` object that layers 2 and 3 consume.
- **Layers 6 and 7** are React components with Framer Motion animations. They render on top of the canvas.

---

## 2. CSS Token Reference

All colour and font decisions live in the `:root` block at the top of `Template6.module.css`. Changing these 9 variables recolours the entire DOM layer of the template instantly.

```css
/* Template6.module.css — top of file */
:root {
  --t6-forest:   #0a1409;   /* Page background, deepest dark */
  --t6-canopy:   #0f1e10;   /* Section backgrounds (ceremony, RSVP, etc.) */
  --t6-moss:     #2a4a2a;   /* Border accents, dividers */
  --t6-gold:     #e8c96e;   /* Section titles, nav active, badges, dates */
  --t6-gold-glow:#ffe47a;   /* Firefly colour (also used in 3D layer) */
  --t6-petal:    #f7c6d7;   /* Reference only — actual petal colour set via scene.petal.color config */
  --t6-cream:    #f5f0e8;   /* Primary body text */
  --t6-mist:     rgba(245, 240, 232, 0.65); /* Secondary / dimmed text */

  --t6-script:   'Dancing Script', cursive;   /* Couple names, section titles */
  --t6-serif:    'Playfair Display', serif;   /* Dates, venue, labels */
  --t6-body:     'EB Garamond', serif;        /* Body paragraphs, forms */
}
```

### Variable → Visual mapping

| Variable | Where it appears |
|---|---|
| `--t6-forest` | `body` background, welcome section behind 3D canvas |
| `--t6-canopy` | Ceremony, RSVP, Itinerary, Wishes, PhotoBooth section backgrounds |
| `--t6-moss` | Unused direct references — available for custom border overrides |
| `--t6-gold` | `.sectionTitle`, `.enchantmentBadge`, `.dateMain`, `.navBtnActive`, `.wishAuthor`, `.rsvpOpenBtn` |
| `--t6-gold-glow` | `.scrollLeaf` indirectly; firefly glow is set in `FirefliesLayer.tsx` |
| `--t6-cream` | `.coupleNames`, `.venueName`, `.itineraryLabel`, form inputs |
| `--t6-mist` | `.fireflyGreeting`, `.headingMessage`, `.inviteBody`, `.venueAddress`, `.rsvpSubtitle`, input placeholders |
| `--t6-script` | `.coupleNames`, `.sectionTitle`, `.modalTitle` |
| `--t6-serif` | `.dateMain`, `.venueName`, `.navLabel`, `.rsvpOpenBtn`, `.itineraryLabel` |
| `--t6-body` | All paragraph text, form inputs, secondary labels |

### Changing fonts

The fonts are loaded via Google Fonts in the `@import` at the very top of `Template6.module.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');
```

To swap fonts, replace this URL and update the three `--t6-*` font variables.

---

## 3. Config Key Reference

Config values are stored in the database (`WeddingTemplateConfig`) and passed to the template as `customConfig: Record<string, string>`. The `t(key, fallback)` helper in `index.tsx` resolves them.

### COMMON_FIELDS (shared with all templates)

| Key | Type | Default | What it does |
|---|---|---|---|
| `invite.heading` | text | `'Together with their families'` | Heading text in WelcomeSection |
| `invite.heading.align` | select | `'center'` | Text alignment: left / center / right |
| `invite.heading.animation` | select | `'none'` | Framer Motion variant: none / fade / slide / typewriter |
| `invite.heading.color` | color | `''` | Hex colour override for heading |
| `invite.heading.shadow` | select | `'none'` | Text shadow preset: none / soft / strong / glow |
| `invite.body` | richtext | (default sentence) | HTML body below couple names |
| `invite.body.align` | select | `'center'` | Alignment for invite body |
| `walimah.body` | richtext | `''` | HTML content for CeremonySection — section hidden if empty |
| `walimah.body.align` | select | `'center'` | Ceremony text alignment |
| `rsvp.subtitle` | text | (default sentence) | Subtitle line in RSVPSection |
| `wish.prompt` | text | (default sentence) | Prompt text in WishesSection |
| `general.showIslamicDate` | boolean | `'false'` | Show Hijri date below Gregorian date |
| `section.order` | text | `'welcome,walimah,rsvp,itinerary,wishes,photobooth'` | Admin-only: section render order |
| `section.welcome.bg` | image | `''` | Background image URL for welcome section |
| `music.url` | text | `''` | Audio file URL for background music |
| `music.loop` | boolean | `'true'` | Loop music |
| `footer.tagline` | text | `'Made with love for our special day'` | Footer text |
| `nav.*` | text | various | Admin-only nav label overrides |

### TEMPLATE6_EXTRA_FIELDS (T6-only — scene controls)

| Key | Type | Default | What it does | Admin only |
|---|---|---|---|---|
| `scene.quality` | select | `'auto'` | `auto` detects device, `off` skips Canvas entirely | No |
| `scene.firefly.count` | select | `'medium'` | low=40, medium=100, high=200 sparkles | No |
| `scene.petal.color` | color | `'#f7c6d7'` | Colour of falling petal geometry | No |
| `scene.petal.count` | select | `'medium'` | none=0, low=20, medium=60, high=120 petals | No |
| `scene.bloom` | boolean | `'true'` | Toggles `<Bloom>` post-processing effect | No |
| `scene.fog.color` | color | `'#0d1a0e'` | THREE.Fog colour | Yes |
| `scene.environment` | select | `'forest'` | Drei `<Environment>` preset: forest / night / dawn | Yes |
| `invite.enchantment_label` | text | `'Enchanted Garden'` | Badge text in WelcomeSection | No |
| `invite.firefly_greeting` | text | `'Follow the light to our garden'` | Italic line above couple names | No |

### How config flows into the 3D scene

```
customConfig prop
  └─▶ useFairyConfig(customConfig)   [hooks/useFairyConfig.ts]
        └─▶ FairyConfig object
              └─▶ FairyGardenScene   [scenes/FairyGardenScene.tsx]
                    ├─▶ FirefliesLayer  (config.fireflyCount, reduced)
                    ├─▶ PetalRain       (config.petalCount, config.petalColor, reduced)
                    ├─▶ FloatingFlowers (reduced)
                    ├─▶ <fog>           (config.fogColor)
                    ├─▶ <Environment>   (config.environment)
                    └─▶ <Bloom>         (config.bloom && !reduced)
```

---

## 4. 3D Scene Customization

### Fireflies — `scenes/FirefliesLayer.tsx`

Uses `<Sparkles>` from `@react-three/drei`. All props are in one component:

```tsx
<Sparkles
  count={actualCount}      // ← from config.fireflyCount
  scale={[14, 10, 14]}     // ← spread area (x, y, z)
  size={3}                 // ← point size in world units
  speed={reduced ? 0 : 0.25} // ← animation speed
  opacity={0.85}
  color="#ffe47a"          // ← change this for non-gold particles
  noise={0.6}              // ← turbulence (0 = uniform grid, 1 = chaotic)
/>
```

**To change firefly colour:** edit `color="#ffe47a"` — or make it a prop fed from `FairyConfig`.

**To change firefly shape:** `<Sparkles>` renders round sprites. For square/pixel sprites, replace with a custom `<Points>` component using `THREE.PointsMaterial` with a custom canvas texture.

**To add movement paths:** wrap in `useFrame` and update the underlying `BufferGeometry` positions each frame.

---

### Petal Rain — `scenes/PetalRain.tsx`

Uses `THREE.InstancedMesh` for performance. Key constants at the top:

```ts
const AREA = 12;    // ← horizontal spread (world units). Increase to spread wider
const HEIGHT = 14;  // ← how high petals spawn above y=0. Increase for more fall distance
```

Key animation values per petal (in the `petals` useMemo):

```ts
speed: 0.006 + Math.random() * 0.012,   // ← fall speed. Increase for faster rain
driftAmp: 0.002 + Math.random() * 0.003, // ← horizontal sway. 0 = straight fall
```

**To change petal shape:** replace `<planeGeometry args={[0.18, 0.24]}>` with any geometry:
- `<boxGeometry args={[0.2, 0.2, 0.2]}>` — falling cubes (pixel art)
- `<circleGeometry args={[0.12, 6]}>` — hexagonal petals
- `<tetrahedronGeometry args={[0.15]}>` — faceted shards

**To change petal colour:** fed from `config.petalColor` as a prop — update via the admin panel's color picker for `scene.petal.color`.

**To remove sway and make petals fall in straight lines** (pixel art style):
```ts
// In the useFrame callback, remove:
p.wobble += 0.018;
p.x += Math.sin(p.wobble) * p.driftAmp;

// Replace with grid-snapped position:
p.x = Math.round(p.x * 2) / 2; // snap to 0.5-unit grid
```

---

### Floating Flowers — `scenes/FloatingFlowers.tsx`

Four hardcoded flower positions in the `FLOWERS` array:

```ts
const FLOWERS = [
  { pos: [-3.5, -1, -4], scale: 0.7, hue: '#e8a0b4' },
  { pos: [3.8, -1.5, -5], scale: 0.9, hue: '#c97dae' },
  { pos: [-1, -2, -6],   scale: 1.1, hue: '#f0c4d4' },
  { pos: [1.5, -1.8, -3], scale: 0.6, hue: '#d4a0c8' },
];
```

**To change positions/count:** edit the `FLOWERS` array. Each entry is independent.

**To change geometry:** in `FlowerMesh`, replace `<torusGeometry>` with any Three.js geometry:
```tsx
// Current (donut ring):
<torusGeometry args={[0.18, 0.06, 8, 24]} />

// Pixel cube:
<boxGeometry args={[0.25, 0.25, 0.25]} />

// Diamond:
<octahedronGeometry args={[0.2]} />
```

**To change the centre glow dot:** the emissive sphere uses `emissiveIntensity={0.6}` which contributes to the bloom effect. Setting `emissiveIntensity={0}` or using `MeshBasicMaterial` removes the glow entirely.

**Float animation speed:** the `<Float>` wrapper controls the bobbing. Set `speed={0}` to freeze when reduced motion is on (already wired up via the `reduced` prop).

---

### Lighting — `scenes/FairyGardenScene.tsx`

```tsx
<ambientLight intensity={0.4} color="#4a7a4a" />      // ← green-tinted fill light
<pointLight position={[0, 5, 0]}   color="#ffe47a" /> // ← top-down warm (firefly sun)
<pointLight position={[-4, 2, -2]} color="#a0c8ff" /> // ← left cool rim light
```

**To go flat/unlit (pixel art):** remove all lights and use `MeshBasicMaterial` on all meshes — `MeshBasicMaterial` ignores lighting entirely.

**To add a coloured rim:** duplicate the point light pattern with a new position and `color`.

---

### Fog — `scenes/FairyGardenScene.tsx`

```tsx
<fog attach="fog" args={[config.fogColor, 8, 30]} />
//                                          ↑   ↑
//                                    near    far (in world units)
```

- **Near (8):** objects closer than 8 units have zero fog.
- **Far (30):** objects beyond 30 units are fully fogged out (invisible).
- Decrease far distance to add more atmospheric depth.
- Set `fogColor` to `'#000000'` for a pitch-black void (pixel art).
- Remove the `<fog>` element entirely to disable it.

---

### Post-processing — `scenes/FairyGardenScene.tsx`

```tsx
<EffectComposer>
  <Bloom
    intensity={1.8}
    luminanceThreshold={0.65}  // ← only pixels brighter than this bloom
    luminanceSmoothing={0.9}
    mipmapBlur                 // ← higher quality blur, slightly more GPU cost
  />
</EffectComposer>
```

**To disable bloom:** set `scene.bloom = 'false'` via admin config, or remove the block.

**To add other effects:** import from `@react-three/postprocessing`:
```tsx
import { Vignette, ChromaticAberration } from '@react-three/postprocessing';
// Inside <EffectComposer>:
<Vignette eskil={false} offset={0.1} darkness={0.8} />
<ChromaticAberration offset={[0.001, 0.001]} />
```

---

## 5. Adding a New 3D Effect

Follow this 5-step pattern to add any new scene element:

**Step 1 — Create the scene component**

```tsx
// scenes/MyEffect.tsx
'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  count: number;
  color: string;
  reduced: boolean;
}

export default function MyEffect({ count, color, reduced }: Props) {
  const ref = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    if (!ref.current || reduced) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.1;
  });

  return (
    <points ref={ref}>
      <sphereGeometry args={[3, count, count]} />
      <pointsMaterial color={color} size={0.05} />
    </points>
  );
}
```

**Step 2 — Register in FairyGardenScene.tsx**

```tsx
import MyEffect from './MyEffect';

// Inside <Suspense>:
<MyEffect count={50} color="#ffffff" reduced={reduced} />
```

**Step 3 — Add a config key (optional)**

In `lib/templateConfigSchema.ts`, add to `TEMPLATE6_EXTRA_FIELDS`:
```ts
{
  key: 'scene.myeffect.count',
  label: 'My Effect Count',
  fieldType: 'select',
  options: ['low', 'medium', 'high'],
  defaultValue: 'medium',
  maxLength: 10,
  richText: false,
  adminOnly: false,
  section: 'scene',
}
```

**Step 4 — Read it in useFairyConfig.ts**

Add to the `FairyConfig` interface and the returned object:
```ts
myEffectCount: MY_COUNTS[c['scene.myeffect.count'] ?? 'medium'] ?? 30,
```

**Step 5 — Pass it through FairyGardenScene.tsx props**

```tsx
// FairyGardenScene.tsx
<MyEffect count={config.myEffectCount} color="#ffffff" reduced={reduced} />
```

---

## 6. Section Components

Each section is a self-contained component. They share a common pattern:

```tsx
<section id="sectionId" className={styles.sectionXxx}>
  <motion.div
    className={styles.sectionInner}
    initial={{ opacity: 0, y: 32 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.8 }}
  >
    {/* content */}
  </motion.div>
</section>
```

The `id` attribute must match the section code in `SECTION_NAV` in `index.tsx` so the IntersectionObserver and nav scrolling work correctly.

### Section visibility rules

| Section | Shown when |
|---|---|
| `welcome` | Always |
| `walimah` | `walimah.body` config key is non-empty |
| `rsvp` | Always (if in section order) |
| `itinerary` | `itinerary` prop array has items |
| `wishes` | Always (if in section order) |
| `photobooth` | `photoBoothEnabled` prop is `true` |

These are controlled by `resolveSectionOrder()` from `lib/templateUtils.ts`.

### Adding a new section

1. Create `components/MySection.tsx` with `id="mysection"` on the root element
2. Add `'mysection'` to the `SECTION_NAV` map in `index.tsx`
3. Render conditionally inside `index.tsx` wherever appropriate
4. Add `'mysection'` to the `section.order` default value in `TEMPLATE6_EXTRA_FIELDS`

---

## 7. Fallback Background (No-WebGL)

`components/FallbackBackground.tsx` renders when:
- `useWebGLSupport()` returns `'none'`
- OR `config.quality === 'off'`

It renders 24 absolutely-positioned divs with the `t6-flicker` CSS keyframe animation:

```tsx
{Array.from({ length: 24 }, (_, i) => (
  <div
    className={styles.fallbackFirefly}
    style={{
      left: `${Math.random() * 100}%`,
      top:  `${Math.random() * 100}%`,
      animationDelay:    `${Math.random() * 4}s`,
      animationDuration: `${3 + Math.random() * 3}s`,
    }}
  />
))}
```

**To restyle for a different theme:** only the CSS is involved — change `.fallbackBg` background, `.fallbackFirefly` size/colour/border-radius, and the `t6-flicker` keyframe in `Template6.module.css`.

**To add a static image fallback:** add a `<img src="/templates/t6/fairy-bg.jpg">` inside `.fallbackBg` with `object-fit: cover`.

---

## 8. Performance Checklist

Before deploying any theme change, verify these performance layers remain intact:

| Check | File | What to verify |
|---|---|---|
| Module never in SSR bundle | `app/wedding/[coupleName]/page.tsx` | Dynamic import path `Template${templateId}` — don't add static imports of Template6 in server components |
| WebGL fallback | `hooks/useWebGLSupport.ts` | Does not use `navigator.gpu` (WebGPU) — only `getContext('webgl2')` |
| Reduced motion | `hooks/useReducedMotion.ts` | `reduced` prop reaches all three scene components |
| Demand render | `FairyGardenScene.tsx` | `frameloop="always"` is fine for animated scenes — use `"demand"` only for static ones |
| Particle budget | `data/defaultConfig.ts` | `FIREFLY_COUNTS.high` ≤ 200, `PETAL_COUNTS.high` ≤ 120 — don't increase without testing on mid-range Android |
| DPR cap | `FairyGardenScene.tsx` | `dpr={[1, 1.5]}` limits pixel ratio — do not remove |
| Antialias off | `FairyGardenScene.tsx` | `gl={{ antialias: false }}` — essential for mobile performance |
| Geometry disposal | `PetalRain.tsx` | `useEffect(() => () => material.dispose(), [material])` — always dispose Three.js objects |

---

## 9. File Map

```
frontend/
├── components/templates/
│   ├── Template6.tsx                          ← One-line re-export shim (required for dynamic import)
│   └── Template6-fairygarden/
│       ├── index.tsx                          ← Main entry; section orchestration, music, nav
│       ├── Template6.module.css               ← ALL visual theme tokens + keyframes
│       │
│       ├── scenes/
│       │   ├── FairyGardenScene.tsx           ← Canvas root: lights, fog, post-processing
│       │   ├── FirefliesLayer.tsx             ← <Sparkles> gold point particles
│       │   ├── PetalRain.tsx                  ← InstancedMesh falling geometry
│       │   └── FloatingFlowers.tsx            ← <Float>-animated 3D shapes
│       │
│       ├── shaders/
│       │   ├── petalVertex.ts                 ← GLSL vertex (template literal)
│       │   └── petalFragment.ts               ← GLSL fragment (template literal)
│       │
│       ├── hooks/
│       │   ├── useWebGLSupport.ts             ← Returns 'webgl2' | 'webgl' | 'none'
│       │   ├── useReducedMotion.ts            ← Returns boolean (prefers-reduced-motion)
│       │   └── useFairyConfig.ts              ← customConfig → typed FairyConfig
│       │
│       ├── components/
│       │   ├── WelcomeSection.tsx             ← Hero with layered 3D scene
│       │   ├── CeremonySection.tsx            ← walimah.body rich text section
│       │   ├── RSVPSection.tsx                ← Bottom-sheet RSVP modal
│       │   ├── ItinerarySection.tsx           ← Programme list
│       │   ├── WishesSection.tsx              ← Wish form + grid
│       │   ├── PhotoBoothSection.tsx          ← Photo upload + grid
│       │   ├── NavBar.tsx                     ← Fixed bottom pill navigation
│       │   └── FallbackBackground.tsx         ← CSS-only fallback (no WebGL)
│       │
│       └── data/
│           └── defaultConfig.ts               ← T6_DEFAULTS, FIREFLY_COUNTS, PETAL_COUNTS
│
├── lib/
│   ├── templateConfigSchema.ts                ← TEMPLATE6_EXTRA_FIELDS defined here
│   ├── templateUtils.ts                       ← toHijriString, resolveSectionOrder, headingStyle, etc.
│   └── api/types.ts                           ← TemplateConfigSection includes 'scene'
│
└── docs/
    ├── TEMPLATE6_CUSTOMIZATION.md             ← This file
    └── TEMPLATE6_PIXEL_ART.md                 ← Pixel art reskin walkthrough
```
