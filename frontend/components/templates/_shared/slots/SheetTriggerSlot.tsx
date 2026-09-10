'use client';

import { useState, type CSSProperties } from 'react';
import type { SlotProps } from '../types';
import { useEngine } from '../engine';
import { DEFAULT_SHEET, useSheets } from './sheets';
import { fontVar } from '@/lib/fonts/registry';
import styles from './slots.module.css';

/**
 * The on-stage control that opens a bottom sheet — one generic slot for every sheet, rather than
 * one component per form.
 *
 * It reads `layer.sheetId` (injected via `SlotProps.layer`) to know what to open, so a template
 * author wires a new sheet purely in stage data. Deliberately `kind: 'slot'` and not `kind: 'img'`:
 * `Stage.module.css` sets `pointer-events: none` on img/shape/text layer boxes *and* on the `.img`
 * element itself, so art is inert by design — a slot is clickable for free while still
 * positioning, scaling and animating exactly like art. The floating motion is not this component's
 * business either: it comes from the layer's own `animIdle` (see `reveal.css`), so it's tunable
 * from the Adjust panel's Animation tab.
 *
 * Artwork is optional and config-driven (`sheet.<id>.image`), with `layer.src` as an author-baked
 * fallback. Until either is set it renders a plain labelled button, so the mechanism ships before
 * the art does and swapping in the art never touches code.
 */
export default function SheetTriggerSlot({ t, layer, editing }: SlotProps) {
  const { open } = useSheets();
  const { assetRoot } = useEngine();
  const [artBroken, setArtBroken] = useState(false);

  const id = layer?.sheetId || DEFAULT_SHEET;
  const label = t(`sheet.${id}.label`, DEFAULT_LABELS[id] ?? 'Open');
  const rawArt = t(`sheet.${id}.image`, '') || layer?.src || '';
  // An uploaded image is an absolute /uploads/… path; a shipped one is relative to the template's
  // asset root — same convention as `kind:'img'` layers (Layer.tsx).
  const art = rawArt && !artBroken
    ? (rawArt.startsWith('/') || rawArt.startsWith('http') ? rawArt : `${assetRoot}/${rawArt}`)
    : '';

  // In the Adjust panel a click means "select this layer" (Layer.tsx's beginDrag already handles
  // that on pointerdown) — popping the sheet would fight the editor's own selection-driven open.
  const activate = () => { if (!editing) open(id); };

  // Same Style-tab fields as Layer.tsx's `case 'text'`, with one deliberate difference: a
  // sheetTrigger button already ships with a visible border and rounded corners from .plaque's
  // own CSS (theme accent color, --slot-radius) — unlike bare text, which has no box at all until
  // borderWidth is actually turned up. So Color/Radius apply here independently, the moment
  // either is set, instead of both waiting on borderWidth like text's do (see the matching
  // AdjustPanel.tsx comment by the Style tab's Border section). `undefined` fields fall through
  // to .plaque's own CSS defaults, so a button with no overrides looks exactly as it did before
  // this existed. Shadow renders as `boxShadow` here rather than text's `textShadow` — a drop
  // shadow reads as "the button" for a filled shape, not "the label text" sitting on it.
  const hasShadow = Boolean(layer?.shadowBlur || layer?.shadowX || layer?.shadowY);
  const hasBorderOverride = layer?.borderWidth !== undefined || layer?.borderColor !== undefined;
  const btnStyle: CSSProperties = {
    color: layer?.color,
    fontSize: layer?.fontSize !== undefined ? `${layer.fontSize}cqi` : undefined,
    fontWeight: layer?.fontWeight,
    fontFamily: layer?.fontFamily ? fontVar(layer.fontFamily) : undefined,
    letterSpacing: layer?.letterSpacing !== undefined ? `${layer.letterSpacing}em` : undefined,
    wordSpacing: layer?.wordSpacing !== undefined ? `${layer.wordSpacing}em` : undefined,
    border: hasBorderOverride ? `${layer?.borderWidth ?? 1}px solid ${layer?.borderColor ?? '#000'}` : undefined,
    borderRadius: layer?.radius !== undefined ? `${layer.radius}px` : undefined,
    boxShadow: hasShadow
      ? `${layer?.shadowX ?? 0}px ${layer?.shadowY ?? 0}px ${layer?.shadowBlur ?? 0}px ${layer?.shadowColor ?? 'rgba(0,0,0,0.4)'}`
      : undefined,
  };

  if (art) {
    return (
      <button type="button" className={styles.triggerArtBtn} onClick={activate} aria-label={label}>
        {/* Config-driven/uploaded src, so next/image's build-time optimisation doesn't apply —
            same call as every other template image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={art}
          alt=""
          className={styles.triggerArt}
          onError={() => setArtBroken(true)}
          draggable={false}
        />
      </button>
    );
  }

  return (
    <div className={styles.triggerBtnWrap}>
      <button type="button" className={`${styles.plaque} ${styles.plaqueBtn}`} style={btnStyle} onClick={activate}>
        {label}
      </button>
    </div>
  );
}

/** Fallbacks for the sheets shipped in Template 7. An unknown id gets a neutral label rather than
 *  an empty button. */
const DEFAULT_LABELS: Record<string, string> = {
  rsvp: 'RSVP Now',
  wish: 'Write a Wish',
};
