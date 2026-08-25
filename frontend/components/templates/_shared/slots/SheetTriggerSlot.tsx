'use client';

import { useState } from 'react';
import type { SlotProps } from '../types';
import { useEngine } from '../engine';
import { DEFAULT_SHEET, useSheets } from './sheets';
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
      <button type="button" className={`${styles.plaque} ${styles.plaqueBtn}`} onClick={activate}>
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
