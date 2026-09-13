import { useEffect, useMemo, useState } from 'react';
import type { SectionCode } from '@/lib/templateUtils';
import type { Breakpoint, EditorHandle } from '@/components/templates/_shared/types';
import { EngineProvider, type Engine } from '@/components/templates/_shared/engine';
import SharedLayer from '@/components/templates/_shared/Layer';
import { resolveStage, baseStage } from '@/components/templates/_shared/layout';
import { T11_STAGES, SHIPPED_PROP_IDS } from './data/roseHorizonStages';
import styles from './PropLayer.module.css';

interface Zone {
  top: number;    // % of section height
  bottom: number; // % of section height
}

// Same engine shape SectionOverlay.tsx uses — no shipped slot registry, no bundled art beyond
// what the layer's own `src` already names as an absolute path.
const ENGINE: Engine = { assetRoot: '/templates/rose-horizon', assetSizes: {}, slotRegistry: {} };

/** The one prop whose box spans most of both axes at once (the welcome arch) — a frame, not an
 *  icon, meant to surround the panel rather than avoid it. See `clearZone`'s own comment. A
 *  couple-added image (an "+Image" addition, `custom-<id>`) is never in this set, so it always
 *  gets normal collision avoidance — reasonable default for an arbitrary added decoration. */
const FRAME_PROP_IDS = new Set(['floral-arch-and-roses']);

/**
 * Renders this section's decorative image layers — both the shipped `PropLayer` art (roses,
 * icons, the welcome arch, positioned by `T11_STAGES`' own defaults, generated from the ingest
 * pipeline's measured manifest — see roseHorizonStages.ts) and any couple-added "+Image" extra —
 * through the exact same shared `<Layer>` component every other template's art uses, so a couple
 * gets full drag/resize/hide on these, not just the anchors. Text/shape couple additions are a
 * separate concern, rendered by `SectionOverlay` — see that file's own doc comment for why the
 * split exists.
 *
 * ## Reserved-zone collision avoidance (fixes real, confirmed overlap)
 *
 * A prop's default x/y/w/h is a percentage of the APPROVED DESIGN's fixed 1024x1696 canvas
 * (measured by ingest). The live section is `min-height: 100svh` with a variable-height content
 * panel centred in it — a different, and not fixed, aspect ratio and box. The same percentage can
 * therefore land in a different place on screen than it did in the design. Confirmed live on
 * itinerary: the hourglass icon rendered directly across "Guest Arrival" / "Akad Nikah" text, on
 * both mobile and desktop breakpoints (docs/rose-horizon-qa/*-itinerary.png before this fix).
 *
 * The Stage family solves the equivalent problem with `StageDef.canvas` — scenery composes
 * inside a fixed-aspect reference box that cover-fits the device, same technique `bgFit:'cover'`
 * already uses. That doesn't transfer cleanly here: Stage sections are a fixed `100svh`, but a
 * Classic panel's height is real, variable content (a 3-row schedule vs. a 6-row one) — there is
 * no single reference aspect to cover-fit against ahead of time.
 *
 * So instead of a static reference box, the reserved zone is measured from the ACTUAL rendered
 * panel at runtime (a `ResizeObserver` on the panel element, reported by the parent template),
 * and any prop whose vertical span would intersect it is pushed to clear it — toward whichever
 * edge (above/below) requires the smaller nudge, with a small margin so it doesn't hug the panel
 * edge.
 *
 * **Only applied to a prop still at its shipped default position.** The first version of this
 * applied the nudge unconditionally, on top of whatever the couple had already dragged it to —
 * which meant a couple could never actually place a prop over the panel on purpose (every drag
 * that entered the zone was silently pushed back out, in the editor and live alike). Now/wanting
 * props to intentionally overlap a section (confirmed: the panel no longer blocks them, see
 * PropLayer.module.css's `.wrap` z-index) means an explicit couple placement has to win outright.
 * So the guard only fires when the resolved position still equals the layer's own shipped
 * default — the moment a couple moves it (drag, or a saved Adjust-panel delta), it's `y !==
 * default y` and this function is skipped entirely for that layer, forever.
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

export function PropLayer({
  section, reservedZone, breakpoint, config, editor,
}: {
  section: SectionCode;
  reservedZone: Zone | null;
  breakpoint: Breakpoint;
  config?: Record<string, string>;
  editor?: EditorHandle;
}) {
  const def = T11_STAGES[section];
  const { layers } = useMemo(
    () => resolveStage('t11', def, breakpoint, config),
    [def, breakpoint, config],
  );
  // What each prop's `y` is before any couple override — the yardstick clearZone() compares
  // against to tell "still at its shipped spot" from "the couple moved this on purpose".
  const defaultY = useMemo(
    () => new Map(baseStage(def, breakpoint).layers.map((l) => [l.id, l.y])),
    [def, breakpoint],
  );

  const dockOpen = Boolean(editor?.enabled);
  const stageActive = dockOpen && editor?.selectedStage === section;
  // Only the shipped props — a couple's own "+Image" addition (a `custom-<id>`, never in this
  // set) goes through SectionOverlay instead, same as any other couple-added extra. See
  // `SHIPPED_PROP_IDS`'s own doc comment for why the split exists.
  const shippedIds = SHIPPED_PROP_IDS[section] ?? new Set<string>();
  const imgLayers = layers.filter((l) => l.kind === 'img' && !l.hidden && shippedIds.has(l.id));
  if (!imgLayers.length) return null;

  return (
    <EngineProvider value={ENGINE}>
      {/* `data-seen="true"` unconditionally: hybrid-overlay Classic templates have no scroll-
          gated reveal for decorative art (same as SectionOverlay's own extras) — without an
          ancestor carrying it, reveal.css's `[data-sl-anim]{opacity:0}` base rule leaves every
          prop permanently invisible, since nothing ever flips it to "seen". `data-editing='true'`
          on an ANCESTOR is separately what Stage.module.css's `.layerBox` pointer-events rule is
          gated on (mirroring Stage.tsx's own `<section data-editing>`) — without it, art stays
          un-clickable even with `editing` wired in JS. See PropLayer.module.css's `.wrap` for the
          positioning/stacking-context half of this. */}
      <div className={styles.wrap} data-seen="true" data-editing={dockOpen || undefined}>
        {imgLayers.map((l) => {
          const atDefault = l.y === defaultY.get(l.id);
          const y = atDefault
            ? clearZone({ y: l.y, h: l.h, frame: FRAME_PROP_IDS.has(l.id) }, reservedZone)
            : l.y; // couple has explicitly repositioned this prop — their placement always wins
          return (
            <SharedLayer
              key={l.id}
              layer={{ ...l, y }}
              eager={false}
              selected={stageActive && editor?.selectedLayer === l.id}
              editing={dockOpen}
              stageActive={stageActive}
              stageId={section}
            />
          );
        })}
      </div>
    </EngineProvider>
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
