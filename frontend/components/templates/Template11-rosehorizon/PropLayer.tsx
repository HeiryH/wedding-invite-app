import { useEffect, useRef, useState } from 'react';
import { ROSE_HORIZON_PROPS, PROP_DEPTH } from './data/roseHorizonProps';
import type { SectionCode } from '@/lib/templateUtils';
import styles from './Template11.module.css';

interface Zone {
  top: number;    // % of section height
  bottom: number; // % of section height
}

/**
 * Renders this section's decorative art (roses, icons, the welcome arch) at the positions
 * `ingest` measured off the human-approved Recraft design — see docs/rose-horizon-props/.
 *
 * Not couple-editable via the Adjust dock: SectionOverlay's decorative-layer system is built
 * for layers the couple adds themselves (ships with none by default, per every other Classic
 * template). There's no existing mechanism for a template to ship its OWN default decorative
 * art through that system, so this renders directly instead. Known gap, not an oversight --
 * worth folding back as a real engine capability if a future template wants the same thing.
 *
 * `data-depth` + `useParallax` (called by the parent template) is the SAME shared mechanism
 * every other template's decorative/anchor layers already use -- not a bespoke one-off.
 *
 * ## Reserved-zone collision avoidance (fixes real, confirmed overlap)
 *
 * A prop's x/y/w/h is a percentage of the APPROVED DESIGN's fixed 1024x1696 canvas (measured
 * by ingest). The live section is `min-height: 100svh` with a variable-height content panel
 * centred in it — a different, and not fixed, aspect ratio and box. The same percentage can
 * therefore land in a different place on screen than it did in the design. Confirmed live on
 * itinerary: the hourglass icon rendered directly across "Guest Arrival" / "Akad Nikah" text,
 * on both mobile and desktop breakpoints (docs/rose-horizon-qa/*-itinerary.png before this
 * fix).
 *
 * The Stage family solves the equivalent problem with `StageDef.canvas` — scenery composes
 * inside a fixed-aspect reference box that cover-fits the device, same technique
 * `bgFit:'cover'` already uses. That doesn't transfer cleanly here: Stage sections are a fixed
 * `100svh`, but a Classic panel's height is real, variable content (a 3-row schedule vs. a
 * 6-row one) — there is no single reference aspect to cover-fit against ahead of time.
 *
 * So instead of a static reference box, the reserved zone is measured from the ACTUAL rendered
 * panel at runtime (a `ResizeObserver` on the panel element, reported by the parent template),
 * and any prop whose vertical span would intersect it is pushed to clear it — toward whichever
 * edge (above/below) requires the smaller nudge, with a small margin so it doesn't hug the
 * panel edge. This is strictly more robust for variable-height content than a static
 * design-canvas percentage could be, since it reacts to what actually rendered, not what the
 * design assumed would render.
 */
const MARGIN = 3; // % of section height, gap kept between a nudged prop and the panel edge

function clearZone(p: { y: number; h: number; frame?: boolean }, zone: Zone | null): number {
  // A frame spans most of both axes at once (the welcome arch) -- it's meant to surround the
  // panel, not avoid it. Nudging it as one rigid rectangle can't keep its top half above and
  // bottom half below simultaneously; confirmed live, it just pushed the whole asset down,
  // hiding the crown and dragging roses across the panel's own text.
  if (!zone || p.frame) return p.y;
  const top = p.y - p.h / 2;
  const bottom = p.y + p.h / 2;
  const overlaps = bottom > zone.top && top < zone.bottom;
  if (!overlaps) return p.y;

  const distAbove = zone.top - p.h / 2 - MARGIN; // new centre if pushed above the zone
  const distBelow = zone.bottom + p.h / 2 + MARGIN; // new centre if pushed below the zone
  const costAbove = Math.abs(distAbove - p.y);
  const costBelow = Math.abs(distBelow - p.y);
  const pushed = costAbove <= costBelow ? distAbove : distBelow;
  // Clamp on-screen; a prop that can't clear the zone within the section at all keeps its
  // original position rather than flying off-canvas -- better a rare residual overlap than a
  // prop vanishing past the section edge.
  return Math.min(100, Math.max(0, pushed));
}

export function PropLayer({ section, reservedZone }: { section: SectionCode; reservedZone: Zone | null }) {
  const props = ROSE_HORIZON_PROPS[section] ?? [];
  return (
    <>
      {props.map((p) => (
        <img
          key={p.id}
          src={p.src}
          alt=""
          draggable={false}
          data-depth={PROP_DEPTH}
          className={styles.prop}
          style={{
            left: `${p.x}%`,
            top: `${clearZone(p, reservedZone)}%`,
            width: `${p.w}%`,
            height: `${p.h}%`,
          }}
        />
      ))}
    </>
  );
}

/** Measures `panelRef`'s box as a percentage of `sectionRef`'s height, live, for PropLayer. */
export function usePanelZone(sectionRef: React.RefObject<HTMLElement | null>, panelRef: React.RefObject<HTMLElement | null>) {
  const [zone, setZone] = useState<Zone | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const panel = panelRef.current;
    if (!section || !panel) return;

    const measure = () => {
      const sRect = section.getBoundingClientRect();
      const pRect = panel.getBoundingClientRect();
      if (sRect.height === 0) return;
      setZone({
        top: ((pRect.top - sRect.top) / sRect.height) * 100,
        bottom: ((pRect.bottom - sRect.top) / sRect.height) * 100,
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(section);
    ro.observe(panel);
    return () => ro.disconnect();
  }, [sectionRef, panelRef]);

  return zone;
}
