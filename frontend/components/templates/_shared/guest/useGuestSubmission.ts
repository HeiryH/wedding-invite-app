'use client';
import { createContext, useContext, useRef, useState } from 'react';

export const GuestExecutionContext = createContext<'live' | 'preview' | 'simulation'>('live');
export const GuestFeedbackContext = createContext<(message: string) => void>((message) => window.alert(message));

/** An immediate lock prevents duplicate requests before React can disable a button. */
export function useGuestSubmission() {
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const mode = useContext(GuestExecutionContext);
  const report = useContext(GuestFeedbackContext);
  async function submit(action: () => Promise<unknown>, fallback: string, onError?: (message: string) => void): Promise<boolean> {
    if (mode !== 'live') {
      const message = mode === 'simulation' ? 'Simulation only — no submission was saved.' : 'Preview only — no submission was sent.';
      if (onError) onError(message); else report(message);
      return false;
    }
    if (locked.current) return false;
    locked.current = true; setBusy(true);
    try { await action(); return true; }
    catch (error) {
      const message = error instanceof Error ? error.message : fallback;
      if (onError) onError(fallback); else report(message || fallback);
      return false;
    } finally { locked.current = false; setBusy(false); }
  }
  return { submit, busy };
}
