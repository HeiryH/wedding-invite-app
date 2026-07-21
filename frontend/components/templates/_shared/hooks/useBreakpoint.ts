import { useEffect, useState } from 'react';
import type { Breakpoint } from '../types';

const QUERY = '(min-width: 900px)';

/**
 * Which stored layout applies. Starts at 'mobile' so SSR and the first client paint agree —
 * a desktop visitor swaps to the wide layout on mount, which is a re-layout, not a flash of
 * wrong content (the same art is on screen either way).
 */
export function useBreakpoint(override?: Breakpoint): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>('mobile');

  useEffect(() => {
    if (override) return; // the Adjust panel pins the breakpoint it's editing
    const mq = window.matchMedia(QUERY);
    const sync = () => setBp(mq.matches ? 'desktop' : 'mobile');
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [override]);

  return override ?? bp;
}
