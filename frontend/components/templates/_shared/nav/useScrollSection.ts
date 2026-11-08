'use client';

import { frameSvh } from '../frameViewport';
import { useEffect, useState, type RefObject } from 'react';

type SectionStart = { id: string; top: number };

export function sectionAtScrollLine(sections: SectionStart[], line: number, current: string) {
  const ordered = [...sections].sort((a, b) => a.top - b.top);
  let before = ordered[0]?.id ?? '';
  let after = before;
  for (const section of ordered) {
    if (section.top <= line - 8) before = section.id;
    if (section.top <= line + 8) after = section.id;
  }

  // Keep the existing highlight across an 8px margin on either side of a boundary.
  return current === before || current === after ? current : before;
}

export function useScrollSection({
  rootRef, stageGroups, sectionIds, enabled = true,
}: {
  rootRef?: RefObject<HTMLElement | null>;
  stageGroups?: Record<string, readonly string[]>;
  sectionIds?: readonly string[];
  enabled?: boolean;
}) {
  const [active, setActive] = useState('');
  const sectionList = sectionIds?.join(',');

  useEffect(() => {
    if (!enabled) return;
    const root = rootRef ? rootRef.current : document.body;
    if (!root) return;
    const stageToSection = new Map(
      Object.entries(stageGroups ?? {}).flatMap(([section, ids]) => ids.map((id) => [id, section] as const)),
    );
    const selector = stageGroups ? 'section[data-stage]'
      : sectionList?.split(',').filter(Boolean).map((id) => `#${CSS.escape(id)}`).join(',');
    if (!selector) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const targets = new Map<Element, string>();
      for (const node of root.querySelectorAll<HTMLElement>(selector)) {
        if (stageGroups) {
          const stage = node.dataset.stage!;
          // Roman Garden's horizontally scrolling ceremony beats share one navigation item.
          targets.set(node.closest('[data-rail]') ?? node, stageToSection.get(stage) ?? stage);
        } else {
          targets.set(node, node.id);
        }
      }
      const sections = [...targets].filter(([node]) => node.getClientRects().length > 0).map(([node, id]) => ({ id, top: node.getBoundingClientRect().top }));
      const line = frameSvh() * 0.4;
      setActive((current) => sectionAtScrollLine(sections, line, current));
    };

    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
    return () => {
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
    };
  }, [enabled, rootRef, sectionList, stageGroups]);

  return active;
}
