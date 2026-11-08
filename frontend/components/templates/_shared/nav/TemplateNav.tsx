'use client';
import { useContext, useState, type CSSProperties } from 'react';
import styles from './TemplateNav.module.css';

import { navAppearance, navIconUrl, navAdjustment, NAV_ADJUST_FIELDS, NAV_BORDER_STYLES, type NavLayout } from './appearance';
import { NavigationAdjustPreview } from './preview';
export type { NavLayout } from './appearance';

const DEFAULT_ICONS: Record<string, string> = {
  welcome: '⌂', walimah: '♧', rsvp: '✉', itinerary: '◷',
  wishes: '♡', photobooth: '▣', 'couple-gallery': '▧',
};

function NavIcon({ src, fallback }: { src?: string; fallback: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return <span className={styles.icon} aria-hidden="true">{fallback}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={styles.icon} src={navIconUrl(src)} alt="" onError={() => setBroken(true)} />
  );
}

interface Props {
  items: { id: string; label: string }[];
  active: string;
  onNav: (id: string) => void;
  /** `nav.layout` (templateConfigSchema.ts). Defaults to 'bottom-pill' — every template's
   *  historical, only-ever-shipped shape — so an omitted prop renders unchanged. */
  layout?: NavLayout;
  config?: Record<string, string>;
  /** CSS custom properties this template supplies for its theme (colours, font, radius, the
   *  nav.size/nav.textSize scale multipliers) — same pattern as `--slot-*` in engine.tsx/index.tsx.
   *  T7 and T10 each set a full token set inline at their mount site so their look is unchanged by
   *  this component's extraction; a template that sets none gets this file's plain neutral
   *  defaults (see the `var(--nav-*, <fallback>)` values below). */
  vars?: CSSProperties;
}

/**
 * Template-neutral bottom/top nav pill, shared by every Stage-family template (T7, T10 today).
 * Was two byte-identical `NavBar.tsx` components differing only in which CSS module they imported
 * — consolidated here so `nav.layout` (bottom-pill / top-pill / bottom-bar / hidden) is written
 * once. Structural/positional CSS lives in `TemplateNav.module.css`; all theming (colour, font,
 * radius, backdrop, the nav.size/nav.textSize scale factors) comes in via the `vars` custom
 * properties, exactly like the slot catalog's `--slot-*` tokens.
 */
export default function TemplateNav({ items, active, onNav, layout = 'bottom-pill', vars, config }: Props) {
  const preview = useContext(NavigationAdjustPreview);
  const appearance = navAppearance(config, layout);
  if (appearance.style === 'hidden') return null;
  const configured = config?.['nav.items'];
  const byId = new Map(items.map((item) => [item.id, item]));
  const visible = configured === undefined
    ? items
    : [...new Set(configured.split(','))].flatMap((id) => {
        const item = byId.get(id);
        return item ? [item] : [];
      });
  if (!visible.length) return null;
  const [edge, gap, scale, textScale, activeBubble, borderRadius, borderWidth] = NAV_ADJUST_FIELDS.map((field) => navAdjustment(field, config?.[field.key]));
  const borderStyle = NAV_BORDER_STYLES.find((value) => value === config?.['nav.borderStyle']);
  const borderColor = config?.['nav.borderColor'];
  const style = {
    ...vars,
    '--nav-item-count': visible.length,
    ...(edge !== undefined && { '--nav-edge-offset': `${edge}px` }),
    ...(gap !== undefined && { '--nav-gap': `${gap}px` }),
    ...(scale !== undefined && { '--nav-scale': scale / 100 }),
    ...(textScale !== undefined && { '--nav-text-scale': textScale / 100 }),
    ...(activeBubble !== undefined && { '--nav-active-bubble-scale': activeBubble / 100 }),
    ...(borderRadius !== undefined && { '--nav-edit-radius': `${borderRadius}px` }),
    ...(borderWidth !== undefined && { '--nav-edit-border-width': `${borderWidth}px` }),
    ...(borderStyle && { '--nav-edit-border-style': borderStyle }),
    ...(borderColor && /^#[0-9a-f]{6}$/i.test(borderColor) && { '--nav-edit-border-color': borderColor }),
  } as CSSProperties;
  return (
    <nav
      className={`${styles.nav} ${styles[appearance.position] || styles.bottom} ${styles[appearance.style] || styles.pill}`}
      style={style}
      data-adjust-selected={preview === 'selected' || undefined}
      aria-label="Sections"
    >
      {visible.map((item) => {
        const label = config?.[`nav.label.${item.id}`] || item.label;
        const icon = config?.[`nav.icon.${item.id}`];
        const showIcon = appearance.content === 'icons';
        return (
          <button
            key={item.id}
            className={`${styles.navBtn} ${active === item.id ? styles.navActive : ''}`}
            type="button"
            onClick={() => {
              if (preview) window.parent.postMessage({ type: 'PREVIEW_NAVIGATION_SELECT' }, window.location.origin);
              else onNav(item.id);
            }}
            aria-current={active === item.id ? 'true' : undefined}
            aria-label={showIcon ? label : undefined}
            title={showIcon && appearance.style !== 'bubbles' ? label : undefined}
          >
            {showIcon && <NavIcon key={icon} src={icon} fallback={DEFAULT_ICONS[item.id] ?? '•'} />}
            {(!showIcon || appearance.style === 'bubbles') && (
              <span className={showIcon ? styles.bubbleLabel : undefined}>{label}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
