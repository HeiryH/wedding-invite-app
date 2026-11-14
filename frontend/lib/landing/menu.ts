export const LANDING_MENU_KEY = 'menu.links';

export const LANDING_MENU_SECTIONS = [
  { value: 'top', label: 'Home' },
  { value: 'features', label: 'Features' },
  { value: 'explore-designs', label: 'Explore invitation designs' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'stories', label: 'Stories' },
  { value: 'about', label: 'About' },
  { value: 'footer', label: 'Footer' },
] as const;

export type LandingMenuLink = { section: string; label: string };

const defaultLinks = LANDING_MENU_SECTIONS
  .filter(({ value }) => value !== 'explore-designs' && value !== 'footer')
  .map(({ value, label }) => ({ section: value, label }));

export function readLandingMenu(value?: string): LandingMenuLink[] {
  if (!value) return defaultLinks;

  try {
    const links: unknown = JSON.parse(value);
    if (!Array.isArray(links)) return defaultLinks;
    const result: LandingMenuLink[] = [];
    for (const link of links) {
      const section = LANDING_MENU_SECTIONS.find(({ value }) => value === link?.section);
      if (!section || typeof link.label !== 'string' || result.some((item) => item.section === section.value)) continue;
      result.push({ section: section.value, label: link.label });
    }
    return result;
  } catch {
    return defaultLinks;
  }
}
