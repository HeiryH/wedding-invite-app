'use client';
import { useCallback, useEffect, useRef } from 'react';

/** Deferred UI actions must not fire against a different invite after navigation/unmount. */
export function useTimeouts() {
  const pending = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => () => { pending.current.forEach(clearTimeout); pending.current.clear(); }, []);
  return useCallback((action: () => void, delay: number) => {
    const timer = setTimeout(() => { pending.current.delete(timer); action(); }, delay);
    pending.current.add(timer); return timer;
  }, []);
}
