'use client';

import { useId, useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { Layer } from '../types';
import styles from './WaterLayer.module.css';

/**
 * `kind: 'water'` — ambient motion for a patch of still water painted into a static background
 * (Template 14's rock pool is the first user). Pure CSS/SVG, no assets, no JS per frame: the layer
 * box marks *where the water is* and four independent, individually tunable effects play inside
 * it, each faded out toward the box edge by a radial mask so nothing has a hard border:
 *
 * - **drift** — a second, semi-transparent water texture (SVG turbulence, blended soft-light) that
 *   translates and breathes over `waterDrift` seconds. Movement without the background sliding.
 * - **ripples** — `waterRipples` faint elliptical rings, each scaling 0.4 → 1.4 while fading
 *   0 → .25 → 0, staggered so they surface independently.
 * - **glints** — `waterGlints` tiny white highlights fading in and out at fixed pseudo-random spots.
 *   Deliberately capped: past ~10 it reads as glitter.
 * - **glow** — a soft peach translucent gradient (`waterGlowColor`, `waterGlow` opacity) drifting
 *   across the centre, so a painted sunset reflection seems to shift with the water.
 *
 * Positions are derived from the layer id + index with a tiny hash, so the same layer always
 * renders the same arrangement (no hydration mismatch, no re-randomising on every edit). Honours
 * `prefers-reduced-motion` in the CSS (everything holds a still frame). This is the
 * `scrollVideo` recipe from CLAUDE.md applied to a generated visual: the effect's constants are
 * promoted to `Layer` fields so storage, delta-diffing and the Adjust panel come for free.
 */

export const WATER_DEFAULTS = {
  drift: 15,     // seconds per drift loop; 0 disables
  ripples: 3,
  glints: 6,
  glow: 0.08,    // peak opacity of the reflected-light gradient; 0 disables
  glowColor: '#f8bfb1',
};

// Small deterministic hash → [0, 1). Same id + salt always lands on the same spot.
function unit(seed: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

export default function WaterLayer({ layer }: { layer: Layer }) {
  const drift = layer.waterDrift ?? WATER_DEFAULTS.drift;
  const ripples = Math.max(0, Math.round(layer.waterRipples ?? WATER_DEFAULTS.ripples));
  const glints = Math.max(0, Math.round(layer.waterGlints ?? WATER_DEFAULTS.glints));
  const glow = layer.waterGlow ?? WATER_DEFAULTS.glow;
  const glowColor = layer.waterGlowColor ?? WATER_DEFAULTS.glowColor;
  const filterId = useId();

  const rippleSpots = useMemo(
    () => Array.from({ length: ripples }, (_, i) => ({
      // Kept inside the middle 70% so a ring never scales out past the masked edge.
      x: 15 + unit(layer.id, 11 + i) * 70,
      y: 15 + unit(layer.id, 37 + i) * 70,
      delay: (i / Math.max(1, ripples)) * 7 + unit(layer.id, 53 + i) * 1.5,
      dur: 6 + unit(layer.id, 71 + i) * 3,
      rx: 9 + unit(layer.id, 89 + i) * 6,
    })),
    [layer.id, ripples],
  );
  const glintSpots = useMemo(
    () => Array.from({ length: glints }, (_, i) => ({
      x: 8 + unit(layer.id, 101 + i) * 84,
      y: 8 + unit(layer.id, 131 + i) * 84,
      delay: unit(layer.id, 151 + i) * 6,
      dur: 3 + unit(layer.id, 173 + i) * 3,
      len: 1.2 + unit(layer.id, 191 + i) * 1.8,
      rot: -30 + unit(layer.id, 211 + i) * 60,
    })),
    [layer.id, glints],
  );

  return (
    <div
      className={styles.water}
      style={{ '--water-drift': `${drift}s`, '--water-glow': glow, '--water-glow-color': glowColor } as CSSProperties}
      aria-hidden
    >
      {drift > 0 && (
        <svg className={styles.drift} viewBox="0 0 100 100" preserveAspectRatio="none">
          <filter id={filterId} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018 0.045" numOctaves="2" seed="7" />
            {/* Keep only the luminance as alpha: a white, translucent, veined texture. */}
            <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.9 0.9 0.9 0 -0.55" />
          </filter>
          <rect width="100" height="100" filter={`url(#${filterId})`} />
        </svg>
      )}

      {glow > 0 && <div className={styles.glow} />}

      {rippleSpots.map((r, i) => (
        <span
          key={`r${i}`}
          className={styles.ripple}
          style={{
            left: `${r.x}%`, top: `${r.y}%`,
            width: `${r.rx * 2}%`, height: `${r.rx * 0.9}%`,
            animationDelay: `${r.delay}s`, animationDuration: `${r.dur}s`,
          }}
        />
      ))}

      {glintSpots.map((g, i) => (
        <span
          key={`g${i}`}
          className={styles.glint}
          style={{
            left: `${g.x}%`, top: `${g.y}%`,
            width: `${g.len}%`,
            transform: `rotate(${g.rot}deg)`,
            animationDelay: `${g.delay}s`, animationDuration: `${g.dur}s`,
          }}
        />
      ))}
    </div>
  );
}
