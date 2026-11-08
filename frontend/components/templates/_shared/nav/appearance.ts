export type NavLayout = 'bottom-pill' | 'top-pill' | 'bottom-bar' | 'hidden';

export function navAppearance(config?: Record<string, string>, fallback: NavLayout = 'bottom-pill') {
  const legacy = config?.['nav.layout'] || fallback;
  const style = config?.['nav.style'] || (legacy === 'hidden' ? 'hidden' : legacy === 'bottom-bar' ? 'bar' : 'pill');
  return {
    style,
    content: style === 'bubbles' || config?.['nav.content'] === 'icons' ? 'icons' : 'labels',
    position: config?.['nav.position'] || (legacy === 'top-pill' ? 'top' : 'bottom'),
  };
}

export function navIconUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ?? '';
  return path.startsWith('/uploads/') ? base + path : path;
}

export const NAV_ADJUST_FIELDS = [
  { key: 'nav.edgeOffset', label: 'Edge offset', unit: 'px', min: 0, max: 64 },
  { key: 'nav.itemGap', label: 'Item spacing', unit: 'px', min: 0, max: 20 },
  { key: 'nav.scalePercent', label: 'Menu scale', unit: '%', min: 70, max: 140 },
  { key: 'nav.textPercent', label: 'Text and icon scale', unit: '%', min: 70, max: 150 },
  { key: 'nav.activeBubblePercent', label: 'Active bubble size', unit: '%', min: 100, max: 160 },
  { key: 'nav.borderRadius', label: 'Corner radius', unit: 'px', min: 0, max: 80 },
  { key: 'nav.borderWidth', label: 'Border width', unit: 'px', min: 0, max: 8 },
] as const;

export function navAdjustment(field: typeof NAV_ADJUST_FIELDS[number], raw?: string) {
  if (!raw?.trim()) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(field.min, Math.min(field.max, value)) : undefined;
}

export const NAV_BORDER_STYLES = ['solid', 'dashed', 'dotted', 'double'] as const;
export const NAV_ADJUST_KEYS = [...NAV_ADJUST_FIELDS.map(({ key }) => key), 'nav.borderStyle', 'nav.borderColor'];
