import { useId } from 'react';
import type { Layer } from './types';
import { fontVar } from '@/lib/fonts/registry';

interface Props {
  layer: Layer;
  /** Pre-resolved display text (bindings already substituted) — defaults to `layer.text` for
   *  callers that don't need binding resolution (there are none left in this codebase, but the
   *  fallback keeps this component correct standalone). */
  text?: string;
}

const VIEW_W = 200;

/**
 * The drawing box a curved layer actually needs, as a `width / height` ratio (the box is always
 * VIEW_W wide). Previously the viewBox was a fixed 200×100 — a box half as tall as the layer is
 * wide, whatever the text. In flow that shoved every sibling down the hero, and once the box was
 * absolutely positioned to stop that, the parts of it hanging outside the slot were clipped by
 * `.slot`'s own `overflow-y: auto` and the text vanished. So the box is now sized to the geometry:
 * one line of type plus however deep the arc actually bends. `CurvedPiece` reads the same number
 * so its absolute box matches exactly.
 */
export function curvedGeometry(layer: Layer) {
  const curvature = layer.curvature ?? 40;
  const size = layer.fontSize ?? 4;
  // Glyph height in user units — see the `fontSize * 2` note on the <text> below.
  const line = size * 2 * 1.25;
  const cx = VIEW_W / 2;
  const pad = 2;

  if (layer.textShape === 'circle') {
    const r = Math.min(85, Math.max(15, (Math.abs(curvature) / 100) * (VIEW_W / 2)));
    const viewH = 2 * r + line + pad * 2;
    const cy = viewH / 2;
    const sweep = curvature >= 0 ? 1 : 0; // clockwise vs counter-clockwise reading direction
    // Two-semicircle "full ring" trick so <textPath> can wrap the whole circle.
    return {
      viewH,
      d: `M ${cx - r},${cy} A ${r},${r} 0 1,${sweep} ${cx + r},${cy} A ${r},${r} 0 1,${sweep} ${cx - r},${cy}`,
      textLength: 2 * Math.PI * r,
    };
  }

  // Arc: a standard two-point SVG arc, letting the `A` command's own geometry do the curve math
  // instead of deriving the circle's centre by hand. `largeArcFlag=0` always selects the minor arc
  // for the given radius, which is exactly the subtended angle we computed as long as it's
  // clamped to <=180°.
  const angleDeg = Math.max(2, Math.min(178, (Math.abs(curvature) / 100) * 180));
  const angleRad = (angleDeg * Math.PI) / 180;
  const marginX = 10;
  const chord = VIEW_W - marginX * 2;
  const r = chord / (2 * Math.sin(angleRad / 2));
  // How deep the arc bends away from its chord — the only thing that makes the box taller than
  // one line of text.
  const sagitta = r * (1 - Math.cos(angleRad / 2));
  const viewH = line + sagitta + pad * 2;
  const up = curvature >= 0; // + arches up, - arches down
  // Baseline at the chord: the glyphs stack toward the arc's inside, so the chord sits at the
  // bottom of the box when the arc bulges up, and a line's height below the top when it bulges
  // down.
  const y = up ? viewH - pad : line + pad;
  return {
    viewH,
    d: `M ${marginX},${y} A ${r},${r} 0 0,${up ? 1 : 0} ${VIEW_W - marginX},${y}`,
    textLength: undefined as number | undefined,
  };
}

/** `width / height` of that box — what a caller sets as `aspect-ratio`. */
export function curvedAspect(layer: Layer): number {
  return VIEW_W / curvedGeometry(layer).viewH;
}

/**
 * Renders a `kind:'text'` layer along a curved baseline (`textShape: 'arc' | 'circle'`) via SVG
 * `<textPath>`, in place of `Layer.tsx`'s flat `<div>`. `useId()` (not `layer.id`) backs the
 * `<path id>`/filter id — layer ids are only unique within one stage, but multiple stages (and
 * thus potentially multiple curved-text layers) render simultaneously on the page.
 */
export default function CurvedText({ layer, text }: Props) {
  const idBase = useId();
  const pathId = `curved-text-path-${idBase}`;
  const shadowId = `curved-text-shadow-${idBase}`;

  const hasShadow = Boolean(layer.shadowBlur || layer.shadowX || layer.shadowY);
  const { viewH, d, textLength } = curvedGeometry(layer);

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${viewH}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
      <defs>
        <path id={pathId} d={d} fill="none" />
        {hasShadow && (
          <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx={layer.shadowX ?? 0}
              dy={layer.shadowY ?? 0}
              stdDeviation={layer.shadowBlur ?? 0}
              floodColor={layer.shadowColor ?? 'rgba(0,0,0,0.4)'}
            />
          </filter>
        )}
      </defs>
      <text
        style={{
          // USER UNITS, not a CSS length. A CSS `cqi` here computes against the container and is
          // *then* multiplied by the viewBox→box scale (box/200), so the glyphs grew quadratically
          // with the box — a curved title rendered roughly twice the size of the same text flat.
          // 200 user units span the box's full width, so `fontSize * 2` units == `fontSize`% of the
          // box == the `Ncqi` the flat `.text` path uses.
          fontSize: (layer.fontSize ?? 4) * 2,
          fontFamily: fontVar(layer.fontFamily),
          fontWeight: layer.fontWeight ?? 600,
          letterSpacing: layer.letterSpacing !== undefined ? `${layer.letterSpacing}em` : undefined,
          wordSpacing: layer.wordSpacing !== undefined ? `${layer.wordSpacing}em` : undefined,
          paintOrder: 'stroke',
        }}
        fill={layer.color ?? '#3F3524'}
        stroke={layer.borderWidth ? (layer.borderColor ?? '#000') : undefined}
        strokeWidth={layer.borderWidth ? Math.min(4, layer.borderWidth) : undefined}
        filter={hasShadow ? `url(#${shadowId})` : undefined}
      >
        <textPath
          href={`#${pathId}`}
          startOffset="50%"
          textAnchor="middle"
          textLength={textLength}
          lengthAdjust={textLength ? 'spacing' : undefined}
        >
          {text ?? layer.text}
        </textPath>
      </text>
    </svg>
  );
}
