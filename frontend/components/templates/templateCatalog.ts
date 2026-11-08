/** Route metadata only: importing the catalogue never imports a template implementation. */
export const TEMPLATE_IDS_BY_CODE = {
  'classic-rose': 1,
  'golden-elegance': 2,
  'garden-romance': 3,
  'minimal-noir': 4,
  'dreaming-floral-sky': 5,
  'fairy-garden': 6,
  'roman-garden': 7,
  'gilded-arch': 8,
  'engraved-certificate': 9,
  'sunny-safari': 10,
  'rose-horizon': 11,
  'dreamy-woodland': 12,
  'dino-doodle-party': 13,
  'sandy-beach': 14,
  'painted-promise': 15,
  'inkbound-revelry': 16,
} as const;

export function templateIdForCode(code: string) {
  return Object.hasOwn(TEMPLATE_IDS_BY_CODE, code)
    ? TEMPLATE_IDS_BY_CODE[code as keyof typeof TEMPLATE_IDS_BY_CODE] : undefined;
}
