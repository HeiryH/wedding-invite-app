import { useRef, type ReactNode } from 'react';
import type { SectionCode } from '@/lib/templateUtils';
import { PropLayer, usePanelZone } from './PropLayer';
import styles from './Template11.module.css';

/**
 * One section: measures where its own content panel actually renders and keeps PropLayer's
 * decorative art clear of it (see PropLayer.tsx's doc comment for why this needs to be a real
 * runtime measurement rather than a static percentage). Centralised here so the six sections in
 * Template11.tsx don't each repeat the ref/measurement wiring.
 */
export function StageSection({
  code,
  children,
  extra,
}: {
  code: SectionCode;
  children: ReactNode;
  /** Rendered inside the section but outside the panel/reserved-zone measurement — e.g. welcome's scroll cue. */
  extra?: ReactNode;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const zone = usePanelZone(sectionRef, panelRef);

  return (
    <section ref={sectionRef} id={code} data-stage={code} className={styles.section}>
      <PropLayer section={code} reservedZone={zone} />
      <div ref={panelRef} className={styles.panel} data-depth={0.4}>
        {children}
      </div>
      {extra}
    </section>
  );
}
