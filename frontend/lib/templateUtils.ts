import type { CSSProperties } from 'react';

// ── Hijri (Islamic) date conversion ─────────────────────────────────────────
// Tabular calendar algorithm — within 1-2 days of observational calendar.
function _gregorianToHijri(date: Date): { d: number; m: number; y: number } {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  let jd =
    Math.floor((1461 * (gy + 4800 + Math.floor((gm - 14) / 12))) / 4) +
    Math.floor((367 * (gm - 2 - 12 * Math.floor((gm - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((gy + 4900 + Math.floor((gm - 14) / 12)) / 100)) / 4) +
    gd -
    32075;

  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l =
    l -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;

  return { d: day, m: month, y: year };
}

const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Akhir",
  "Jumada al-Awwal", "Jumada al-Akhir", 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qi'dah", "Dhu al-Hijjah",
];

export function toHijriString(date: Date): string {
  const { d, m, y } = _gregorianToHijri(date);
  return `${d} ${HIJRI_MONTHS[m - 1]} ${y} H`;
}

// ── Text alignment ────────────────────────────────────────────────────────────
export function alignClass(align: string | undefined): string {
  if (align === 'left') return 'text-left';
  if (align === 'right') return 'text-right';
  return 'text-center';
}

// ── Heading color + shadow inline style ───────────────────────────────────────
const SHADOW_MAP: Record<string, string> = {
  soft: '0 1px 6px rgba(0,0,0,0.18)',
  strong: '0 2px 12px rgba(0,0,0,0.42)',
  glow: '0 0 18px rgba(255,255,255,0.7)',
  none: 'none',
};

export function headingStyle(config: Record<string, string> | undefined): CSSProperties {
  if (!config) return {};
  const style: CSSProperties = {};
  if (config['invite.heading.color']) style.color = config['invite.heading.color'];
  const shadow = SHADOW_MAP[config['invite.heading.shadow'] ?? 'none'];
  if (shadow && shadow !== 'none') style.textShadow = shadow;
  return style;
}

// ── Framer-motion animation variants for invite.heading.animation ─────────────
type MotionVariant = {
  initial: Record<string, number>;
  animate: Record<string, number>;
  transition: Record<string, number | string>;
};

export function headingAnimationProps(config: Record<string, string> | undefined): MotionVariant {
  const anim = config?.['invite.heading.animation'] ?? 'none';
  if (anim === 'fade') return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.8 },
  };
  if (anim === 'slide') return {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };
  if (anim === 'typewriter') return {
    initial: { opacity: 0, x: -8 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5 },
  };
  return { initial: {}, animate: {}, transition: {} };
}

// ── Section ordering ─────────────────────────────────────────────────────────
export type SectionCode = 'welcome' | 'walimah' | 'rsvp' | 'itinerary' | 'wishes' | 'photobooth';

export function resolveSectionOrder(
  raw: string | undefined,
  hasWalimah: boolean,
  hasItinerary: boolean,
  hasPhotobooth: boolean,
): SectionCode[] {
  const base: SectionCode[] = raw
    ? (raw.split(',').map((s) => s.trim()) as SectionCode[])
    : [
        'welcome',
        ...(hasWalimah ? ['walimah' as SectionCode] : []),
        'rsvp',
        ...(hasItinerary ? ['itinerary' as SectionCode] : []),
        'wishes',
        ...(hasPhotobooth ? ['photobooth' as SectionCode] : []),
      ];
  return base.filter((code) => {
    if (code === 'walimah') return hasWalimah;
    if (code === 'itinerary') return hasItinerary;
    if (code === 'photobooth') return hasPhotobooth;
    return true;
  });
}

// ── Section background-image style ───────────────────────────────────────────
export function sectionBgStyle(
  url: string | undefined,
  apiBase: string,
): CSSProperties {
  if (!url) return {};
  return {
    backgroundImage: `url(${apiBase}${url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };
}
