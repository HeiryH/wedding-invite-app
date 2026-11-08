'use client';

import { useEffect, type RefObject } from 'react';

export function useDismissSelection(
  selected: boolean,
  container: RefObject<HTMLElement | null>,
  dismiss: () => void,
) {
  useEffect(() => {
    if (!selected) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) dismiss();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [selected, container, dismiss]);
}
