'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Which bottom sheet, if any, is currently open (see `_shared/SheetHost.tsx`).
 *
 * Forms live in sheets rather than on the stage because a stage is an *art composition* — the
 * scenery is drawn around a specific element — while a form is variable-height content. Inline,
 * a form has to reserve a fixed box whether it's collapsed or expanded, and its absolutely-
 * positioned neighbours can never reflow into the slack. Moving the form out removes the conflict
 * instead of trying to make absolute positioning reflow.
 *
 * A single `openId` rather than a set: bottom sheets are modal, so opening one while another is
 * up simply replaces it. `undefined` sheet ids resolve to `'default'`, which is the back-compat
 * path for the single unnamed sheet authored templates shipped before sheets were named.
 *
 * Mounted once per template render via `FlowProviders.tsx`, same level as `EngineProvider`.
 */

export const DEFAULT_SHEET = 'default';

interface SheetsState {
  openId: string | null;
  open: (id: string) => void;
  close: () => void;
}

const SheetsContext = createContext<SheetsState | null>(null);

export function SheetsProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = useCallback((id: string) => setOpenId(id || DEFAULT_SHEET), []);
  const close = useCallback(() => setOpenId(null), []);
  // Memoized (unlike rsvpFlow's inline literal) because every `kind:'slot'` layer on the page
  // consumes this — an unmemoized value would re-render all of them on any parent render.
  const value = useMemo(() => ({ openId, open, close }), [openId, open, close]);
  return <SheetsContext.Provider value={value}>{children}</SheetsContext.Provider>;
}

/** Falls back to inert state rather than throwing — same rationale as `useRsvpFlow`: a slot
 *  rendered outside a template shouldn't hard-crash for lack of a provider it doesn't know it
 *  needs. A trigger simply does nothing there. */
const FALLBACK: SheetsState = { openId: null, open: () => {}, close: () => {} };

export function useSheets(): SheetsState {
  return useContext(SheetsContext) ?? FALLBACK;
}
