import { useId } from 'react';
import type { Layer } from './types';
import { fontVar } from '@/lib/fonts/curated';

interface Props {
  layer: Layer;
  /** Pre-resolved display text (bindings already substituted) — defaults to `layer.text` for
   *  callers that don't need binding resolution (there are none left in this codebase, but the
   *  fallback keeps this component correct standalone). */
  text?: string;
}

const VIEW_W = 200;
const VIEW_H = 100;

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

  const curvature = layer.curvature ?? 40;
  const hasShadow = Boolean(layer.shadowBlur || layer.shadowX || layer.shadowY);
  const cx = VIEW_W / 2;

  let d: string;
  let textLength: number | undefined;

  if (layer.textShape === 'circle') {
    // Radius as a % of the layer's own half-width (VIEW_W/2), clamped to a sane on-canvas range.
    const r = Math.min(85, Math.max(15, (Math.abs(curvature) / 100) * (VIEW_W / 2)));
    const cy = VIEW_H / 2;
    const sweep = curvature >= 0 ? 1 : 0; // clockwise vs counter-clockwise reading direction
    // Two-semicircle "full ring" trick so <textPath> can wrap the whole circle.
    d = `M ${cx - r},${cy} A ${r},${r} 0 1,${sweep} ${cx + r},${cy} A ${r},${r} 0 1,${sweep} ${cx - r},${cy}`;
    textLength = 2 * Math.PI * r;
  } else {
    // Arc: a standard two-point SVG arc, letting the `A` command's own geometry do the curve math
    // instead of deriving the circle's centre by hand. `largeArcFlag=0` always selects the minor
    // arc for the given radius, which is exactly the subtended angle we computed as long as it's
    // clamped to <=180°.
    const angleDeg = Math.max(2, Math.min(178, (Math.abs(curvature) / 100) * 180));
    const angleRad = (angleDeg * Math.PI) / 180;
    const marginX = 10;
    const chord = VIEW_W - marginX * 2;
    const r = chord / (2 * Math.sin(angleRad / 2));
    const y = VIEW_H * 0.6;
    const sweep = curvature >= 0 ? 1 : 0; // + arches up, - arches down
    d = `M ${marginX},${y} A ${r},${r} 0 0,${sweep} ${VIEW_W - marginX},${y}`;
  }

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
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
          fontSize: `${layer.fontSize ?? 4}cqi`,
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
