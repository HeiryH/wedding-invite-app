import type { CSSProperties } from 'react';
import { fontVar } from '@/lib/fonts/registry';
import type { Layer } from './types';

/**
 * Per-slot visual overrides used by both inline Layer slots and SheetHost slots. Keeping this in
 * one place matters: a form must not change appearance merely because it moved into a pop-up.
 */
export function slotLayerStyle(layer: Layer): CSSProperties & Record<string, string | number> {
  const font = fontVar(layer.fontFamily);
  return {
    '--slot-text-scale': layer.textScale ?? 1,
    ...(layer.color ? {
      '--slot-ink': layer.color,
      '--slot-ink-soft': layer.color,
      '--slot-ink-faint': layer.color,
    } : null),
    ...(layer.accentColor ? { '--slot-accent': layer.accentColor } : null),
    ...(font ? {
      '--slot-font-display': font,
      '--slot-font-serif': font,
      '--slot-font-body': font,
    } : null),
    ...(layer.fill ? { '--slot-container-bg': layer.fill } : null),
    ...(layer.borderWidth !== undefined
      ? { '--slot-container-border': layer.borderWidth > 0
          ? `${layer.borderWidth}px solid ${layer.borderColor ?? '#000000'}`
          : 'none' }
      : null),
    ...(layer.radius !== undefined ? { '--slot-container-radius': `${layer.radius}px` } : null),
    ...(layer.containerMinHeight !== undefined
      ? { '--slot-container-min-height': layer.containerMinHeight > 0 ? `${layer.containerMinHeight}px` : '0px' }
      : null),
    ...(layer.containerPadding !== undefined
      ? { '--slot-container-padding': `${layer.containerPadding}px` }
      : null),
    // Composite blocks (a hero, a titled section) read these on their own flex column — see
    // `.eventHero`/`.heroInner` in slots.module.css and `.composite` in a template's own slot CSS.
    ...(layer.contentGap !== undefined ? { '--slot-gap': `${layer.contentGap}em` } : null),
    ...(layer.contentAlignY
      ? { '--slot-justify': layer.contentAlignY === 'top' ? 'flex-start' : layer.contentAlignY === 'bottom' ? 'flex-end' : 'center' }
      : null),
    ...(layer.contentAlign
      ? {
          '--slot-align': layer.contentAlign === 'left' ? 'flex-start' : layer.contentAlign === 'right' ? 'flex-end' : 'center',
          '--slot-text-align': layer.contentAlign,
        }
      : null),
  };
}
