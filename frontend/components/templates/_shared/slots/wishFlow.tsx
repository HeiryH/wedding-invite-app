'use client';

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import type { CreateWish } from '@/lib/api';

/**
 * The wish sheet's two-step guest flow: write a wish → optionally add a photo.
 *
 * Same shape and rationale as `rsvpFlow.tsx` — the steps are separate slot components mounted
 * independently, so the step machine can't live in either of them. Mounted once per template
 * render via `FlowProviders.tsx`.
 */

interface WishFlowState {
  step: 'form' | 'photo';
  setStep: Dispatch<SetStateAction<'form' | 'photo'>>;
  form: CreateWish;
  setForm: Dispatch<SetStateAction<CreateWish>>;
  submitting: boolean;
  setSubmitting: Dispatch<SetStateAction<boolean>>;
  /** "Thank you — your wish was sent", shown at the top of the photo step. */
  sent: boolean;
  setSent: Dispatch<SetStateAction<boolean>>;
}

const DEFAULT_FORM: CreateWish = { guestName: '', message: '' };

const WishFlowContext = createContext<WishFlowState | null>(null);

export function WishFlowProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<'form' | 'photo'>('form');
  const [form, setForm] = useState<CreateWish>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <WishFlowContext.Provider value={{
      step, setStep, form, setForm, submitting, setSubmitting, sent, setSent,
    }}>
      {children}
    </WishFlowContext.Provider>
  );
}

/** Non-throwing fallback, same rationale as `useRsvpFlow`. */
const FALLBACK: WishFlowState = {
  step: 'form', setStep: () => {},
  form: DEFAULT_FORM, setForm: () => {},
  submitting: false, setSubmitting: () => {},
  sent: false, setSent: () => {},
};

export function useWishFlow(): WishFlowState {
  return useContext(WishFlowContext) ?? FALLBACK;
}

/**
 * Which step renders. Guests follow the real step machine; **the editor follows layer selection**
 * instead, so a couple can reach and style step 2 without filling in step 1. Lifted verbatim from
 * `RsvpFormSlot.tsx`'s `isActiveStep` — `selectedLayer` is the *layer id* from `stages.ts`, which
 * is why that layer is deliberately called `wishPhoto` rather than a generic `photo` (the
 * comparison isn't scoped by stage, so a common id could collide with another stage's layer).
 */
export function isActiveWishStep(
  editing: boolean,
  selectedLayer: string | undefined,
  step: 'form' | 'photo',
  thisStep: 'form' | 'photo',
): boolean {
  if (!editing) return step === thisStep;
  const photoSelected = selectedLayer === 'wishPhoto';
  return thisStep === 'form' ? !photoSelected : photoSelected;
}
