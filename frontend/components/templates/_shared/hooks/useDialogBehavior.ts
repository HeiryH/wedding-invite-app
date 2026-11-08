'use client';
import { useEffect, useRef, type RefObject } from 'react';

const dialogs: HTMLElement[] = [];
let originalOverflow = '';
const focusable = 'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])';

/** Shared modal keyboard/focus/scroll behavior; presentation remains owned by each template. */
export function useDialogBehavior(ref: RefObject<HTMLElement | null>, open: boolean, onDismiss: () => void, modal = true) {
  const dismiss = useRef(onDismiss);
  useEffect(() => { dismiss.current = onDismiss; }, [onDismiss]);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !modal || !dialog) return;
    const previous = document.activeElement;
    if (!dialogs.length) { originalOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    dialogs.push(dialog);
    const controls = () => [...dialog.querySelectorAll<HTMLElement>(focusable)].filter((el) => !el.closest('[hidden],[aria-hidden="true"]') && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden');
    const timer = requestAnimationFrame(() => (controls()[0] ?? dialog).focus({ preventScroll: true }));
    const keydown = (event: KeyboardEvent) => {
      if (dialogs.at(-1) !== dialog) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dismiss.current(); }
      if (event.key === 'Tab') {
        const items = controls(), first = items[0], last = items.at(-1);
        if (!first) { event.preventDefault(); dialog.focus(); }
        else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', keydown, true);
    return () => {
      cancelAnimationFrame(timer); window.removeEventListener('keydown', keydown, true);
      const wasTop = dialogs.at(-1) === dialog;
      const index = dialogs.lastIndexOf(dialog); if (index >= 0) dialogs.splice(index, 1);
      if (!dialogs.length) document.body.style.overflow = originalOverflow;
      if (wasTop && previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, [ref, open, modal]);
}
