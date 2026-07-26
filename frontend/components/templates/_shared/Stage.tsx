'use client';

import type { Layer as LayerModel, ObjectFit, SlotProps, StageDef } from './types';
import { REVEAL_VPAD } from './types';
import { useEngine } from './engine';
import Layer from './Layer';
import styles from './Stage.module.css';

interface Props {
  def: StageDef;
  layers: LayerModel[];
  bgFit: ObjectFit;
  bgPosition?: string;
  bgScale?: number;
  /** Overrides the shipped background image (an absolute /uploads/… path). */
  bgSrc?: string;
  seen: boolean;
  slotProps: SlotProps;
  /** Only the first stage on screen loads its art eagerly. */
  eager: boolean;
  editing?: boolean;
  /** Editor-only: relax the overflow clip so off-screen layers stay grabbable. */
  revealOverflow?: boolean;
  /** Editor-only: the real device width/height (px) to pin the stage to while revealing, so bleed
   *  spills around it in the widened preview iframe rather than being clipped. */
  revealFrameW?: number;
  revealFrameH?: number;
  selectedLayer?: string;
  /** When true the `<section>` omits its `id` — a horizontal rail carries the scroll-target id on
   *  its own per-panel anchor instead, to avoid duplicate ids. `data-stage` is kept for observers. */
  suppressId?: boolean;
  /** When true the stage paints no background fill — a horizontal rail supplies one shared
   *  background beneath the panels, and the opaque `.stage` fill would hide it. */
  transparent?: boolean;
  /** Forwarded to every layer; only a `kind:'scrollVideo'` layer ever calls it (tapped while
   *  fully open) — see Layer.tsx / DataTemplate.tsx. */
  onScrollVideoOpen?: () => void;
}

export default function Stage({
  def, layers, bgFit, bgPosition, bgScale, bgSrc, seen, slotProps, eager, editing,
  revealOverflow, revealFrameW, revealFrameH, selectedLayer, suppressId, transparent,
  onScrollVideoOpen,
}: Props) {
  const { assetRoot, assetSizes } = useEngine();
  const bgSize = def.bg ? assetSizes[def.bg] : undefined;
  // An uploaded replacement lives under /uploads (absolute); shipped art is relative to the root.
  const bgUrl = bgSrc
    ? bgSrc
    : def.bg
      ? `${assetRoot}/${def.bg}`
      : '';

  const visible = layers.filter((l) => !l.hidden);
  // Flow mode splits layers into two populations rendered in separate containers (see
  // Stage.module.css's .flowOverlay/.flowStack) — decorative art still positions as a % of the
  // section; slot content flows normally and is what actually gives the section its height.
  const decorative = def.flow ? visible.filter((l) => l.kind !== 'slot') : visible;
  const slotLayers = def.flow
    ? visible.filter((l) => l.kind === 'slot').sort((a, b) => a.order - b.order)
    : [];

  return (
    <section
      id={suppressId ? undefined : def.id}
      className={styles.stage}
      data-stage={def.id}
      data-flow={def.flow || undefined}
      data-seen={seen}
      data-editing={editing || undefined}
      data-reveal={revealOverflow || undefined}
      style={{
        ...(transparent ? { background: 'transparent' } : null),
        ...(revealOverflow && revealFrameW && revealFrameH
          ? {
              width: revealFrameW,
              maxWidth: 'none',
              height: revealFrameH,
              minHeight: revealFrameH,
              marginLeft: 'auto',
              marginRight: 'auto',
              // Vertical room above/below so top/bottom bleed shows (matches the widened iframe).
              marginTop: revealFrameH * REVEAL_VPAD,
              marginBottom: revealFrameH * REVEAL_VPAD,
            }
          : null),
      }}
      aria-label={def.label}
    >
      {bgUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bgUrl}
          alt=""
          className={styles.bg}
          style={{
            objectFit: bgFit,
            objectPosition: bgPosition,
            transform: bgScale && bgScale !== 1 ? `scale(${bgScale})` : undefined,
          }}
          width={bgSrc ? undefined : bgSize?.[0]}
          height={bgSrc ? undefined : bgSize?.[1]}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          draggable={false}
        />
      )}

      {def.flow ? (
        <>
          <div className={styles.flowOverlay}>
            {decorative.map((l) => (
              <Layer
                key={l.id}
                layer={l}
                slotProps={slotProps}
                eager={eager}
                selected={editing && selectedLayer === l.id}
                editing={editing}
                onScrollVideoOpen={onScrollVideoOpen}
              />
            ))}
          </div>
          <div className={styles.flowStack}>
            {slotLayers.map((l) => (
              <Layer
                key={l.id}
                layer={l}
                slotProps={slotProps}
                eager={eager}
                selected={editing && selectedLayer === l.id}
                editing={editing}
                flow
              />
            ))}
          </div>
        </>
      ) : (
        visible.map((l) => (
          <Layer
            key={l.id}
            layer={l}
            slotProps={slotProps}
            eager={eager}
            selected={editing && selectedLayer === l.id}
            editing={editing}
            onScrollVideoOpen={onScrollVideoOpen}
          />
        ))
      )}
    </section>
  );
}
