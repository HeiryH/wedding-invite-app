'use client';

import { useRef, type CSSProperties, type ReactNode } from 'react';
import type { SectionCode } from '@/lib/templateUtils';
import type { Breakpoint, EditorHandle } from '@/components/templates/_shared/types';
import { PropLayer } from './PropLayer';
import SectionOverlay from './SectionOverlay';
import styles from './Template12.module.css';

export function StageSection({ code, children, extra, breakpoint, config, editor, panelless, contentStyle, seen }: {
  code: SectionCode;
  children: ReactNode;
  extra?: ReactNode;
  breakpoint: Breakpoint;
  config?: Record<string, string>;
  editor?: EditorHandle;
  panelless?: boolean;
  /** Group-layer transform/visibility applied to the complete editable content block. */
  contentStyle?: CSSProperties;
  /** Shared reveal state; starts false on reload so entrance animation has a painted start. */
  seen: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} id={code} data-stage={code} data-seen={seen} className={styles.section}>
      <PropLayer section={code} breakpoint={breakpoint} config={config} editor={editor} />
      <SectionOverlay stageId={code} breakpoint={breakpoint} config={config} editor={editor} />
      <div className={panelless ? styles.flowZone : styles.panel} data-depth={0.22} style={contentStyle}>{children}</div>
      {extra}
    </section>
  );
}
