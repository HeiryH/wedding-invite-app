'use client';

import type { CSSProperties } from 'react';
import TemplateNav from './TemplateNav';
import { useScrollSection } from './useScrollSection';
import { navAppearance } from './appearance';
import { animateScrollIntoView } from '../animateScrollTo';

const LABELS: Record<string, string> = {
  welcome: 'Cover', walimah: 'Ceremony', rsvp: 'RSVP', itinerary: 'Programme',
  wishes: 'Wishes', photobooth: 'Photos', 'couple-gallery': 'Our photos',
};

export default function SectionNavigation({ sections, config, vars }: {
  sections: string[];
  config?: Record<string, string>;
  vars?: CSSProperties;
}) {
  const { style } = navAppearance(config, 'hidden');
  const active = useScrollSection({ sectionIds: sections, enabled: style !== 'hidden' });

  return (
    <TemplateNav
      items={sections.map((id) => ({ id, label: LABELS[id] ?? id }))}
      config={config} vars={vars} active={active} layout="hidden"
      onNav={(id) => { const section = document.getElementById(id); if (section) animateScrollIntoView(section); }}
    />
  );
}
