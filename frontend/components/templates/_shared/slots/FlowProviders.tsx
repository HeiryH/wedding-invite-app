'use client';

import type { ReactNode } from 'react';
import { RsvpFlowProvider } from './rsvpFlow';
import { WishFlowProvider } from './wishFlow';
import { SheetsProvider } from './sheets';

/**
 * Every cross-slot context a template needs, in one wrapper.
 *
 * Slots are mounted independently by `Layer.tsx`, so anything two of them must agree on — where
 * the guest is in a multi-step flow, which bottom sheet is open — lives in a context rather than
 * in `SlotProps`. Bundling them here means adding a future flow is one edit, not one edit per
 * template root (`DataTemplate.tsx` and `Template7-romangarden/index.tsx` both mount this).
 */
export function SlotFlowProviders({ children }: { children: ReactNode }) {
  return (
    <RsvpFlowProvider>
      <WishFlowProvider>
        <SheetsProvider>{children}</SheetsProvider>
      </WishFlowProvider>
    </RsvpFlowProvider>
  );
}
