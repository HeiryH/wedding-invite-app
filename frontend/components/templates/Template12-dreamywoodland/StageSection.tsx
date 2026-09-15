'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { SectionCode } from '@/lib/templateUtils';
import type { Breakpoint, EditorHandle } from '@/components/templates/_shared/types';
import { PropLayer } from './PropLayer';
import SectionOverlay from './SectionOverlay';
import styles from './Template12.module.css';

export function StageSection({ code, children, extra, breakpoint, config, editor, panelless, contentStyle }: {
  code: SectionCode;
  children: ReactNode;
  extra?: ReactNode;
  breakpoint: Breakpoint;
  config?: Record<string, string>;
  editor?: EditorHandle;
  panelless?: boolean;
  /** Group-layer transform/visibility applied to the complete editable content block. */
  contentStyle?: CSSProperties;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const editing = Boolean(editor?.enabled);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (editing) return;
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setSeen(entry.isIntersecting),
      { rootMargin: '-10% 0px -10% 0px' },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [editing]);

  return (
    <section ref={sectionRef} id={code} data-stage={code} data-seen={editing || seen ? 'true' : 'false'} className={styles.section}>
      <PropLayer section={code} breakpoint={breakpoint} config={config} editor={editor} />
      <SectionOverlay stageId={code} breakpoint={breakpoint} config={config} editor={editor} />
      <div className={panelless ? styles.flowZone : styles.panel} data-depth={0.22} style={contentStyle}>{children}</div>
      {extra}
    </section>
  );
}
