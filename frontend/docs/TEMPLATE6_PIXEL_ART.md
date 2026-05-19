# Template6 — Pixel Art Theme Reskin Guide

This guide walks you through converting the Fairy Garden 3D template into a retro pixel-art wedding invitation. Every change is minimal and reversible — no new npm packages required.

---

## Theme Identity

| Aspect | Fairy Garden (original) | Pixel Art (target) |
|---|---|---|
| **Aesthetic** | Enchanted forest, firefly glow | Retro 8-bit / 16-bit RPG |
| **Colors** | Deep greens, gold, pink | Black void, neon green, hot pink, cyan, yellow |
| **Fonts** | Dancing Script, EB Garamond | Press Start 2P, VT323 |
| **3D particles** | Soft sparkles, organic petal planes | Hard pixel cubes, square point sprites |
| **Lighting** | Warm + cool point lights, IBL environment | Flat/unlit (MeshBasicMaterial) |
| **Post-FX** | Bloom glow | None (bloom ruins the pixel edge look) |
| **Borders** | Rounded (border-radius) | Sharp (0px border-radius) |
| **Blur** | backdrop-filter: blur everywhere | None |
| **Images** | Smooth scaling | image-rendering: pixelated |

---

## Target Colour Palette

```
Background void:  #0f0f0f
Neon green:       #3ddc84    (primary accent — replaces gold)
Hot pink:         #ff2d78    (secondary accent — replaces petal pink)
Pixel yellow:     #ffe45e    (highlights — replaces gold-glow)
Cyan:             #00bfff    (cool accent — replaces blue rim light)
Off-white:        #e8e8e8    (body text — replaces cream)
Dim white:        rgba(232, 232, 232, 0.55)   (secondary text — replaces mist)
```

---

## Step-by-Step Instructions

Work through the layers bottom-up (Layer 4 → Layer 3 → Layer 2 → Layer 1). Each step is self-contained.

---

### Layer 4 — CSS Token Swap

**File:** `frontend/components/templates/Template6-fairygarden/Template6.module.css`

#### Step 4a — Update Google Fonts import

Replace the first line:

```css
/* BEFORE */
@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');

/* AFTER */
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323:wght@400&display=swap');
```

#### Step 4b — Swap the 9 CSS tokens

Find the `:root {}` block and replace all 9 variables:

```css
/* BEFORE (fairy garden) */
:root {
  --t6-forest:   #0a1409;
  --t6-canopy:   #0f1e10;
  --t6-moss:     #2a4a2a;
  --t6-gold:     #e8c96e;
  --t6-gold-glow:#ffe47a;
  --t6-petal:    #f7c6d7;
  --t6-cream:    #f5f0e8;
  --t6-mist:     rgba(245, 240, 232, 0.65);
  --t6-script:   'Dancing Script', cursive;
  --t6-serif:    'Playfair Display', serif;
  --t6-body:     'EB Garamond', serif;
}

/* AFTER (pixel art) */
:root {
  --t6-forest:   #0f0f0f;
  --t6-canopy:   #0f0f0f;
  --t6-moss:     #3ddc84;
  --t6-gold:     #3ddc84;
  --t6-gold-glow:#ffe45e;
  --t6-petal:    #ff2d78;
  --t6-cream:    #e8e8e8;
  --t6-mist:     rgba(232, 232, 232, 0.55);
  --t6-script:   'Press Start 2P', monospace;
  --t6-serif:    'VT323', monospace;
  --t6-body:     'VT323', monospace;
}
```

After this change, the entire DOM layer recolours. Verify in the browser before continuing.

#### Step 4c — Remove all blur effects

Find every `backdrop-filter: blur(...)` and `filter: blur(...)` in the CSS file and remove them. The main locations:

```css
/* .nav — remove this line */
backdrop-filter: blur(12px);

/* .modalSheet — remove this line */
/* (modalSheet has no explicit backdrop-filter but inherits from .nav pattern) */

/* .dateVenue — remove this line */
backdrop-filter: blur(6px);
```

#### Step 4d — Flatten all border-radius values

Use your editor's find-and-replace to change every `border-radius` to `0`:

- `.enchantmentBadge`: `border-radius: 999px` → `border-radius: 0`
- `.dateVenue`: `border-radius: 12px` → `border-radius: 0`
- `.wishCard`: `border-radius: 12px` → `border-radius: 0`
- `.wishInput`, `.wishTextarea`: `border-radius: 8px` → `border-radius: 0`
- `.wishBtn`: `border-radius: 999px` → `border-radius: 0`
- `.rsvpOpenBtn`, `.rsvpSubmitBtn`: `border-radius: 999px` → `border-radius: 0`
- `.rsvpInput`, `.rsvpSelect`, `.rsvpInputSmall`: `border-radius: 8px` → `border-radius: 0`
- `.attendingBtn`: `border-radius: 8px` → `border-radius: 0`
- `.modalSheet`: `border-radius: 20px 20px 0 0` → `border-radius: 0`
- `.nav`: `border-radius: 999px` → `border-radius: 0`
- `.navBtn`: `border-radius: 999px` → `border-radius: 0`
- `.musicBubble`: `border-radius: 999px` → `border-radius: 0`
- `.uploadBtn`: `border-radius: 999px` → `border-radius: 0`
- `.photoCard`: `border-radius: 10px` → `border-radius: 0`

#### Step 4e — Add pixel image rendering

Find `.photoImg` and add one line:

```css
.photoImg {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  display: block;
  image-rendering: pixelated;   /* ← add this */
}
```

#### Step 4f — Replace keyframes with pixel-style animations

Find `@keyframes t6-sway` and `@keyframes t6-flicker` at the bottom of the file. Replace them:

```css
/* BEFORE */
@keyframes t6-sway {
  0%, 100% { transform: rotate(-8deg) translateY(0); }
  50%       { transform: rotate(8deg) translateY(-4px); }
}

@keyframes t6-flicker {
  0%, 100% { opacity: 0.1; transform: scale(0.8); }
  50%       { opacity: 0.9; transform: scale(1.3); }
}

/* AFTER */
@keyframes t6-sway {
  /* Snap-jump instead of smooth rotation */
  0%, 49% { transform: translateY(0); }
  50%, 100% { transform: translateY(-4px); }
}

@keyframes t6-flicker {
  /* Hard blink — no smooth fade */
  0%, 49% { opacity: 0; }
  50%, 100% { opacity: 1; }
}

/* Add a new pixel-cursor blink for interactive elements */
@keyframes t6-blink {
  0%, 49% { border-color: transparent; }
  50%, 100% { border-color: var(--t6-gold); }
}
```

#### Step 4g — Add pixel border to nav and modal

Find `.nav` and `.modalSheet`, add a hard pixel border:

```css
.nav {
  /* ... existing ... */
  border: 2px solid #3ddc84;   /* ← change from rgba border to solid */
  box-shadow: none;             /* ← remove shadow */
}

.modalSheet {
  /* ... existing ... */
  border-top: 2px solid #3ddc84;
  border-left: 2px solid #3ddc84;
  border-right: 2px solid #3ddc84;
}
```

#### Step 4h — Reduce couple name font size

`Press Start 2P` is much wider than Dancing Script. Reduce the clamp:

```css
/* BEFORE */
.coupleNames {
  font-size: clamp(2.8rem, 8vw, 5rem);
}

/* AFTER */
.coupleNames {
  font-size: clamp(1.2rem, 3.5vw, 2rem);
  letter-spacing: 0.05em;
  line-height: 1.6;
}
```

---

### Layer 3 — 3D Particle Swap

#### Step 3a — PetalRain: planes → cubes

**File:** `scenes/PetalRain.tsx`

Change the geometry from flat planes to pixel cubes, and remove the organic wobble:

```tsx
/* BEFORE — geometry */
<planeGeometry args={[0.18, 0.24]} />

/* AFTER — geometry */
<boxGeometry args={[0.2, 0.2, 0.2]} />
```

Remove organic drift from the `useFrame` callback:

```tsx
/* BEFORE — in useFrame, inside petals.forEach */
p.rotX += 0.012;
p.rotZ += 0.009;
p.wobble += 0.018;
p.x += Math.sin(p.wobble) * p.driftAmp;

/* AFTER — snap movement, no sway */
p.rotX += 0.05;   // fast flip for tumbling cube look
p.rotZ = 0;       // keep cubes axis-aligned
// Remove p.wobble and p.x drift entirely
```

Change material to flat (unlit):

```tsx
/* BEFORE */
new THREE.MeshStandardMaterial({
  color: new THREE.Color(color),
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.8,
  roughness: 0.8,
  metalness: 0.0,
})

/* AFTER */
new THREE.MeshBasicMaterial({
  color: new THREE.Color(color),
  transparent: true,
  opacity: 1.0,    // full opacity, no transparency for crisp pixel look
})
```

#### Step 3b — FirefliesLayer: Sparkles → square pixel points

**File:** `scenes/FirefliesLayer.tsx`

Replace the `<Sparkles>` component with a custom `<points>` implementation:

```tsx
'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  count: number;
  reduced: boolean;
}

// Build a 4×4 white pixel texture (no blur)
function makePixelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 4;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 4, 4);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;  // no interpolation = sharp pixels
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

export default function FirefliesLayer({ count, reduced }: Props) {
  const actualCount = reduced ? Math.floor(count * 0.1) : count;
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(actualCount * 3);
    const speeds = new Float32Array(actualCount);
    for (let i = 0; i < actualCount; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 14;  // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;  // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14;  // z
      speeds[i] = 0.3 + Math.random() * 0.7;
    }
    return { positions, speeds };
  }, [actualCount]);

  const texture = useMemo(() => makePixelTexture(), []);

  // Blink pixels on/off in step intervals (not smooth fade)
  useFrame(({ clock }) => {
    if (!pointsRef.current || reduced) return;
    const t = Math.floor(clock.getElapsedTime() * 4); // 4 blink-steps per second
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = t % 2 === 0 ? 1 : 0.2;  // hard blink, no smooth lerp
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffe45e"       // pixel yellow
        size={0.18}
        map={texture}
        transparent
        opacity={1}
        alphaTest={0.5}
        sizeAttenuation
      />
    </points>
  );
}
```

#### Step 3c — FloatingFlowers: torus → voxel cubes

**File:** `scenes/FloatingFlowers.tsx`

Change geometry and material for all flower meshes:

```tsx
// BEFORE
function FlowerMesh({ color }: { color: string }) {
  return (
    <mesh>
      <torusGeometry args={[0.18, 0.06, 8, 24]} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} transparent opacity={0.9} />
    </mesh>
  );
}

// AFTER — flat cube, no lighting
function FlowerMesh({ color }: { color: string }) {
  return (
    <mesh>
      <boxGeometry args={[0.28, 0.28, 0.28]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}
```

Also change the emissive centre sphere → a smaller flat cube:

```tsx
// BEFORE
<mesh position={[0, 0, 0]}>
  <sphereGeometry args={[0.06, 8, 8]} />
  <meshStandardMaterial color="#ffe47a" emissive="#ffe47a" emissiveIntensity={0.6} />
</mesh>

// AFTER
<mesh position={[0, 0, 0]}>
  <boxGeometry args={[0.1, 0.1, 0.1]} />
  <meshBasicMaterial color="#ffe45e" />
</mesh>
```

Update the hue values in the `FLOWERS` array to the pixel palette:

```ts
const FLOWERS = [
  { pos: [-3.5, -1, -4] as [number, number, number], scale: 0.7, hue: '#ff2d78' },
  { pos: [3.8, -1.5, -5] as [number, number, number], scale: 0.9, hue: '#00bfff' },
  { pos: [-1, -2, -6]   as [number, number, number], scale: 1.1, hue: '#3ddc84' },
  { pos: [1.5, -1.8, -3] as [number, number, number], scale: 0.6, hue: '#ffe45e' },
];
```

---

### Layer 2 — Scene Root: Remove Lighting & Bloom

**File:** `scenes/FairyGardenScene.tsx`

#### Step 2a — Remove IBL environment

```tsx
/* REMOVE this entire line */
<Environment preset={config.environment} />
```

IBL (Image Based Lighting) adds realistic reflections that make flat geometry look organic — opposite of pixel art.

#### Step 2b — Remove bloom post-processing

```tsx
/* REMOVE this entire block */
{config.bloom && !reduced && (
  <EffectComposer>
    <Bloom
      intensity={1.8}
      luminanceThreshold={0.65}
      luminanceSmoothing={0.9}
      mipmapBlur
    />
  </EffectComposer>
)}
```

Also remove the unused imports at the top:
```tsx
// REMOVE:
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Environment } from '@react-three/drei';
```

#### Step 2c — Replace coloured lights with flat white ambient

```tsx
/* BEFORE */
<ambientLight intensity={0.4} color="#4a7a4a" />
<pointLight position={[0, 5, 0]}   intensity={0.8} color="#ffe47a" distance={20} decay={2} />
<pointLight position={[-4, 2, -2]} intensity={0.4} color="#a0c8ff" distance={15} decay={2} />

/* AFTER — since we're using MeshBasicMaterial on everything, lights have no effect
   but keep one ambient as a safety net for any non-basic materials */
<ambientLight intensity={1} color="#ffffff" />
```

#### Step 2d — Update fog to black void

```tsx
/* BEFORE */
<fog attach="fog" args={[config.fogColor, 8, 30]} />

/* AFTER — hardcode black, ignore fogColor config for pixel theme */
<fog attach="fog" args={['#000000', 6, 18]} />
```

Shorter far distance (18 vs 30) gives a tighter, more claustrophobic 8-bit dungeon feel.

#### Step 2e — Full updated FairyGardenScene.tsx

After all changes, the scene root should look like this:

```tsx
'use client';
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import FirefliesLayer from './FirefliesLayer';
import PetalRain from './PetalRain';
import FloatingFlowers from './FloatingFlowers';
import { FairyConfig } from '../hooks/useFairyConfig';

interface Props {
  config: FairyConfig;
  reduced: boolean;
}

export default function FairyGardenScene({ config, reduced }: Props) {
  return (
    <Canvas
      frameloop="always"
      camera={{ position: [0, 1, 6], fov: 65 }}
      gl={{ antialias: false, powerPreference: 'low-power', alpha: true }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      dpr={[1, 1.5]}
    >
      <Suspense fallback={null}>
        <fog attach="fog" args={['#000000', 6, 18]} />
        <ambientLight intensity={1} color="#ffffff" />
        <FirefliesLayer count={config.fireflyCount} reduced={reduced} />
        <PetalRain count={config.petalCount} color={config.petalColor} reduced={reduced} />
        <FloatingFlowers reduced={reduced} />
      </Suspense>
    </Canvas>
  );
}
```

---

### Layer 1 — Fallback Background: Pixel Dot Grid

**File:** `components/FallbackBackground.tsx`

Replace the soft firefly divs with a pixel dot grid:

```tsx
'use client';
import styles from '../Template6.module.css';

// Generate stable positions at build time (no Math.random in JSX)
const PIXELS = Array.from({ length: 48 }, (_, i) => ({
  left: `${(i % 8) * 12.5 + 2}%`,
  top:  `${Math.floor(i / 8) * 16 + 3}%`,
  delay: `${(i % 6) * 0.4}s`,
}));

export default function FallbackBackground() {
  return (
    <div className={styles.fallbackBg} aria-hidden="true">
      {PIXELS.map((p, i) => (
        <div
          key={i}
          className={styles.fallbackPixelDot}
          style={{ left: p.left, top: p.top, animationDelay: p.delay }}
        />
      ))}
    </div>
  );
}
```

Add the corresponding CSS to `Template6.module.css`:

```css
/* Replace .fallbackFirefly with: */
.fallbackPixelDot {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #3ddc84;
  /* No border-radius = hard square pixels */
  animation: t6-flicker step-start infinite;  /* step-start = instant blink, no easing */
  animation-duration: 1.2s;
}

/* Update .fallbackBg background */
.fallbackBg {
  position: absolute;
  inset: 0;
  background: #0f0f0f;  /* solid black instead of gradient */
  overflow: hidden;
}
```

---

### Layer 5 — Pixel Art Config Defaults

**File:** `data/defaultConfig.ts`

Add pixel art defaults alongside the existing fairy garden ones:

```ts
// Add at bottom of file
export const T6_PIXEL_DEFAULTS = {
  sceneQuality: 'auto' as const,
  fireflyCount: 'medium' as const,
  petalColor: '#ff2d78',        // hot pink cubes instead of soft petals
  petalCount: 'medium' as const,
  bloom: false,                  // no bloom in pixel art
  fogColor: '#000000',
  environment: 'night' as const,
  enchantmentLabel: '[ PRESS START ]',
  fireflyGreeting: '8-BIT LOVE STORY',
};
```

To use these defaults for a specific wedding, set them via the admin panel's `WeddingTemplateConfig` entries, or seed them in the DB for pixel-art-themed weddings.

---

## Verification Checklist

Run through each point before considering the reskin complete:

- [ ] **Fonts load** — Open DevTools Network tab, filter by `fonts.googleapis.com`, confirm `Press+Start+2P` and `VT323` are fetched
- [ ] **Token swap took effect** — Background is `#0f0f0f`, section titles are neon green, no gold visible
- [ ] **No rounded corners** — Inspect `.wishCard`, `.nav`, `.modalSheet` — all `border-radius: 0`
- [ ] **No backdrop blur** — Inspect `.nav` computed styles — no `backdrop-filter` property
- [ ] **3D scene renders** — `/wedding/[coupleName]` with `templateId=6` shows falling pink cubes and blinking yellow pixels
- [ ] **No bloom** — No soft glow halos around cubes or pixel points
- [ ] **Lights flat** — Cubes appear flat-coloured (same on all faces) — confirms `MeshBasicMaterial`
- [ ] **Pixel images** — Upload a photo; the photo grid renders with hard pixel edges (no smooth scaling)
- [ ] **WebGL fallback** — Open DevTools console, run `document.createElement('canvas').getContext = () => null`, refresh — see pixel dot grid CSS fallback instead of 3D canvas
- [ ] **Reduced motion** — Enable OS "Reduce Motion" setting — 3D scene renders but no animation
- [ ] **`npm run build` exits 0** — No new packages, no TypeScript errors

---

## Quick Reference: What to Change Per Visual Goal

| Goal | File | What to edit |
|---|---|---|
| Change background colour | `Template6.module.css` | `--t6-forest` and `--t6-canopy` variables |
| Change accent colour (titles, nav) | `Template6.module.css` | `--t6-gold` variable |
| Change font | `Template6.module.css` | `@import` URL + `--t6-script`, `--t6-serif`, `--t6-body` |
| Change falling object shape | `scenes/PetalRain.tsx` | `<___Geometry>` element |
| Change falling object colour | Admin panel | `scene.petal.color` config key |
| Change falling object count | Admin panel | `scene.petal.count` config key |
| Change particle (firefly) look | `scenes/FirefliesLayer.tsx` | Sparkles props OR replace with Points |
| Add/remove bloom | Admin panel | `scene.bloom` toggle |
| Change fog density | `scenes/FairyGardenScene.tsx` | `<fog>` near/far args |
| Change floating objects | `scenes/FloatingFlowers.tsx` | `FLOWERS` array + `FlowerMesh` geometry |
| Disable all 3D | Admin panel | `scene.quality = 'off'` |
| Change fallback dots | `components/FallbackBackground.tsx` | PIXELS array + `.fallbackPixelDot` CSS |
| Change badge text | Admin panel | `invite.enchantment_label` config key |
| Change greeting line | Admin panel | `invite.firefly_greeting` config key |
