import { useRef, type ReactNode } from 'react';
import type { SectionCode } from '@/lib/templateUtils';
import type { Breakpoint, EditorHandle } from '@/components/templates/_shared/types';
import { PropLayer, usePanelZone } from './PropLayer';
import SectionOverlay from './SectionOverlay';
import styles from './Template11.module.css';

/**
 * One section: measures where its own content panel actually renders and keeps PropLayer's
 * decorative art clear of it (see PropLayer.tsx's doc comment for why this needs to be a real
 * runtime measurement rather than a static percentage). Centralised here so the six sections in
 * Template11.tsx don't each repeat the ref/measurement wiring.
 *
 * Also mounts `SectionOverlay` — couple-added "+Text/+Shape/+Image" extras from the Adjust dock
 * (see SectionOverlay.tsx), same as every other Classic template's per-section wiring.
 */
export function StageSection({
  code,
  children,
  extra,
  breakpoint,
  config,
  editor,
  panelless,
}: {
  code: SectionCode;
  children: ReactNode;
  /** Rendered inside the section but outside the panel/reserved-zone measurement — e.g. welcome's scroll cue. */
  extra?: ReactNode;
  breakpoint: Breakpoint;
  config?: Record<string, string>;
  editor?: EditorHandle;
  /**
   * For a stage whose `children` are real `kind:'slot'` layers from the shared `_shared/slots/*`
   * registry (RSVP/Wishes/Schedule/Photos — see Template11.tsx's `flowSlotsFor`) rather than
   * hand-written JSX: each slot already supplies its own look (a form's own `.panel` card, or bare
   * text for a title/prompt), so wrapping them ALL again in this template's own `.panel` would
   * double-box them. `panelless` swaps that card for a plain flow container — same position/width/
   * parallax/z-index (and still a real measured box for PropLayer's reserved-zone avoidance), just
   * no background/blur/border/shadow of its own.
   */
  panelless?: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const zone = usePanelZone(sectionRef, panelRef);

  return (
    // `data-seen="true"` unconditionally: hybrid-overlay Classic templates have no scroll-gated
    // reveal (same reasoning as PropLayer.tsx / SectionOverlay.tsx) — without it, reveal.css's
    // `[data-sl-anim]{opacity:0}` base rule leaves every `flowSlotsFor`-rendered slot layer
    // (RSVP/Wishes/Schedule/Photos, since those now render through the shared Layer.tsx like any
    // Stage-family layer) permanently invisible, since nothing ever flips it to "seen". Inert for
    // welcome/walimah's plain anchored JSX, which doesn't carry `data-sl-anim` at all.
    <section ref={sectionRef} id={code} data-stage={code} data-seen="true" className={styles.section}>
      <PropLayer section={code} reservedZone={zone} breakpoint={breakpoint} config={config} editor={editor} />
      <SectionOverlay stageId={code} breakpoint={breakpoint} config={config} editor={editor} />
      <div ref={panelRef} className={panelless ? styles.flowZone : styles.panel} data-depth={0.4}>
        {children}
      </div>
      {extra}
    </section>
  );
}
