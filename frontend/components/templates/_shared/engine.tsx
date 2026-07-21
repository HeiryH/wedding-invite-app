'use client';

import { createContext, useContext } from 'react';
import type { FC } from 'react';
import type { SlotProps } from './types';

/**
 * Per-template wiring the shared Stage/Layer renderers need but shouldn't hard-code: where art
 * lives, its intrinsic sizes (for CLS-free `<img>`), and which React component each slot renders.
 * Provided once at the template root so layers don't have to prop-drill it.
 */
export interface Engine {
  /** Base path for `img` layers whose `src` is relative, e.g. '/templates/t7'. */
  assetRoot: string;
  /** `src` → [width, height], so shipped art reserves its box before decode. */
  assetSizes: Record<string, [number, number]>;
  /** slotId → component. */
  slotRegistry: Record<string, FC<SlotProps>>;
}

const EngineContext = createContext<Engine | null>(null);

export const EngineProvider = EngineContext.Provider;

export function useEngine(): Engine {
  const engine = useContext(EngineContext);
  if (!engine) throw new Error('useEngine must be used within an <EngineProvider>');
  return engine;
}
