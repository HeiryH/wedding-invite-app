'use client';

import { useDialogBehavior } from './hooks/useDialogBehavior';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useContext, useRef, type CSSProperties } from 'react';
import type { EditorHandle, SlotProps } from './types';
import type { SheetLayer } from './slots';
import { useEngine } from './engine';
import { SeatingPreviewContext } from './slots/preview';
import { useSheets } from './slots/sheets';
import { hasCustomFormBackground, slotLayerStyle } from './slotLayerStyle';
import styles from './slots/slots.module.css';

interface Props {
  /** Sheet id → its content layers, front-to-back. Build with `sheetLayerGroups`. */
  groups: Record<string, SheetLayer[]>;
  slotProps: SlotProps;
  /** Re-applies the template's `--slot-*` tokens when the host mounts *outside* the themed root.
   *  T7 mounts inside its own themed wrapper and needs none; `DataTemplate` does. */
  themeStyle?: CSSProperties;
  editor?: EditorHandle;
  /** Use the sheet surface itself rather than stacking tinted, shadowed slot cards. */
  flatPanels?: boolean;
}

/**
 * Mounts `presentation: 'sheet'` slot layers in a drag-to-dismiss bottom sheet.
 *
 * **Slots render directly here, not through `<Layer>`** — that is load-bearing, not a shortcut.
 * `reveal.css` starts every `[data-sl-anim]` element at `opacity: 0` and only animates it to rest
 * once an ancestor carries `data-seen='true'`, which `useStageReveal` writes per *stage*. Sheet
 * content has no stage ancestor, so routing it through `Layer` would leave it permanently
 * invisible. The card carries `data-seen="true"` as a belt-and-braces guard for any nested markup
 * that opts into the reveal chain on its own.
 *
 * Multiple layers can share one sheet id — they're that sheet's steps, and the step machines
 * inside them (`rsvpFlow` / `wishFlow`) decide which one actually renders, exactly as they did
 * when the steps were inline layers.
 */
export default function SheetHost({ groups, slotProps, themeStyle, editor, flatPanels = false }: Props) {
  const { slotRegistry } = useEngine();
  const { openId, close } = useSheets();
  const seatingPreview = useContext(SeatingPreviewContext);
  const seatingSheet = seatingPreview && Object.keys(groups).find((id) => groups[id].some((layer) => layer.slot === 'rsvpSeating'));

  // In the Adjust panel the editor navigates by *selection*, not by the guest's step machine —
  // the same split `isActiveStep` already makes inside the RSVP/wish slots. Selecting a layer
  // that lives in a sheet forces that sheet open so the couple can see and style it; selecting
  // anything else (the trigger, a piece of art) closes it again, freeing the canvas.
  const selected = editor?.enabled ? editor.selectedLayer : undefined;
  const forcedId = selected
    ? Object.keys(groups).find((id) => groups[id].some((l) => l.id === selected && l.sourceStageId === editor?.selectedStage))
    : undefined;
  const activeId = seatingSheet || (forcedId ?? openId);
  const layers = activeId ? groups[activeId] : undefined;

  // While the editor is holding the sheet open, dismissing it would just re-open on the next
  // render (selection hasn't changed), which reads as a broken control — so drop the affordances
  // entirely and say why instead.
  const dismissable = Boolean(seatingSheet) || !forcedId;
  const dismiss = useCallback(() => {
    if (seatingSheet) seatingPreview?.dismiss();
    close();
  }, [close, seatingPreview, seatingSheet]);

  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(dialogRef, Boolean(layers?.length), dismiss, dismissable);

  return (
    <AnimatePresence>
      {layers?.length ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className={styles.sheetOverlay}
          onClick={dismissable ? dismiss : undefined}
        >
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            drag={dismissable ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => { if (info.offset.y > 80 || info.velocity.y > 300) dismiss(); }}
            onClick={(e) => e.stopPropagation()}
            className={`${styles.sheetCard} ${flatPanels ? styles.sheetCardFlat : ''}`}
            style={themeStyle}
            data-seen="true"
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal={dismissable ? 'true' : undefined}
            aria-label="Invitation form"
          >
            {dismissable ? (
              <>
                <div className={styles.sheetDragHandle} />
                <button className={styles.sheetClose} onClick={dismiss} aria-label="Close">×</button>
              </>
            ) : (
              <p className={styles.sheetEditorNote}>
                Preview — select another layer to close
              </p>
            )}
            {layers.map((l) => {
              const Slot = l.slot ? slotRegistry[l.slot] : undefined;
              if (!Slot) return null;
              return (
                <div
                  key={l.id}
                  data-custom-form-background={hasCustomFormBackground(l) || undefined}
                  // Mirrors Layer.tsx's slot wrapper so the Adjust panel's Text Size control keeps
                  // working on a layer that moved into a sheet.
                  style={slotLayerStyle(l)}
                >
                  <Slot {...slotProps} layer={l} stageLayers={layers} />
                </div>
              );
            })}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
