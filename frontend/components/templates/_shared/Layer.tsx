'use client';

import type { CSSProperties } from 'react';
import type { Layer as LayerModel, SlotProps } from './types';
import { useEngine } from './engine';
import styles from './Stage.module.css';
import './reveal.css';

interface Props {
  layer: LayerModel;
  /** Only `kind: 'slot'` layers need this; decorative overlays (img/text/shape) can omit it. */
  slotProps?: SlotProps;
  /** Above-the-fold stage — its art loads eagerly. */
  eager: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export default function Layer({ layer, slotProps, eager, selected, onSelect }: Props) {
  const { assetRoot, assetSizes, slotRegistry } = useEngine();

  const anim = layer.anim || 'rise';
  const animOut = layer.animOut && layer.animOut !== 'none' ? layer.animOut : undefined;
  const box: CSSProperties & Record<string, string | number> = {
    left: `${layer.x}%`,
    top: `${layer.y}%`,
    width: `${layer.w}%`,
    height: layer.chain ? 'auto' : `${layer.h}%`,
    zIndex: layer.z,
    '--sl-scale': layer.s,
    '--sl-opacity': layer.opacity,
    '--sl-delay': `${0.35 + layer.order * 0.22}s`,
    ...(layer.animDur ? { '--sl-dur': `${layer.animDur}s` } : {}),
  };

  const content = () => {
    switch (layer.kind) {
      case 'img': {
        if (!layer.src) return null;
        // Uploaded art lives under /uploads and has no manifest entry; shipped art does, and the
        // intrinsic size is what reserves the box before decode.
        const size = assetSizes[layer.src];
        const src = layer.src.startsWith('/') ? layer.src : `${assetRoot}/${layer.src}`;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className={styles.img}
            width={size?.[0]}
            height={size?.[1]}
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={eager ? 'high' : 'auto'}
            decoding="async"
            draggable={false}
          />
        );
      }

      case 'slot': {
        const Slot = layer.slot ? slotRegistry[layer.slot] : undefined;
        if (!Slot || !slotProps) return null;
        return (
          <div className={styles.slot}>
            <Slot {...slotProps} />
          </div>
        );
      }

      case 'text':
        return (
          <div
            className={styles.text}
            style={{
              color: layer.color ?? '#3F3524',
              fontSize: `${layer.fontSize ?? 4}cqi`,
              fontWeight: layer.fontWeight ?? 600,
            }}
          >
            {layer.text}
          </div>
        );

      case 'shape':
        return (
          <div
            className={styles.shape}
            style={{
              background: layer.fill ?? '#C98A54',
              borderRadius: layer.shape === 'ellipse' ? '50%' : `${layer.radius ?? 0}px`,
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={styles.layerBox}
      style={box}
      data-kind={layer.kind}
      data-depth={layer.depth ?? layer.z / 10}
      data-layer={layer.id}
      data-selected={selected || undefined}
      // useParallax sets --sl-fade / --sl-out on this box (they inherit down to the reveal elements).
      data-scroll-fade={anim === 'scroll-fade' || undefined}
      data-scroll-exit={animOut ? true : undefined}
      onClick={onSelect ? () => onSelect(layer.id) : undefined}
    >
      {/* box: position/parallax/scale · inner: entrance · exit: scroll-out — three elements so the
          three transforms never fight. */}
      <div className={styles.layerInner} data-sl-anim={anim}>
        <div className={styles.layerExit} data-sl-out={animOut}>{content()}</div>
      </div>
    </div>
  );
}
