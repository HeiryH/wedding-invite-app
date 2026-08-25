'use client';

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';

/**
 * RSVP is split across independently-positionable layers (rsvpTitle / rsvpPrompt / rsvpForm /
 * rsvpSeating — mirrors the Wishes split: wishTitle / wishPrompt / wishForm / wishList), but the
 * step machine (name+details → optional table pick → submit) is one guest flow, not four
 * unrelated widgets. This context is the shared state that lets sibling slot components (each its
 * own React instance, mounted separately by Layer.tsx) agree on where the guest is in that flow,
 * without smuggling RSVP-specific fields into the generic `SlotProps` every slot receives.
 *
 * Mounted once per template render (Template7-romangarden/index.tsx, DataTemplate.tsx), same
 * level as `EngineProvider`.
 */

export interface RsvpFormData {
  guestName: string;
  email: string;
  phoneNumber: string;
  brideOrGroomSide: 'Bride' | 'Groom';
  numberOfAttendees: number;
  isAttending: boolean;
  songRequest: string;
}

const DEFAULT_FORM: RsvpFormData = {
  guestName: '',
  email: '',
  phoneNumber: '',
  brideOrGroomSide: 'Bride',
  numberOfAttendees: 1,
  isAttending: true,
  songRequest: '',
};

interface RsvpFlowState {
  step: 'form' | 'seating';
  setStep: Dispatch<SetStateAction<'form' | 'seating'>>;
  form: RsvpFormData;
  setForm: Dispatch<SetStateAction<RsvpFormData>>;
  selectedTableId: number | null;
  setSelectedTableId: Dispatch<SetStateAction<number | null>>;
  submitting: boolean;
  setSubmitting: Dispatch<SetStateAction<boolean>>;
  done: boolean;
  setDone: Dispatch<SetStateAction<boolean>>;
}

const RsvpFlowContext = createContext<RsvpFlowState | null>(null);

export function RsvpFlowProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<'form' | 'seating'>('form');
  const [form, setForm] = useState<RsvpFormData>(DEFAULT_FORM);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <RsvpFlowContext.Provider value={{
      step, setStep, form, setForm, selectedTableId, setSelectedTableId,
      submitting, setSubmitting, done, setDone,
    }}>
      {children}
    </RsvpFlowContext.Provider>
  );
}

/** Falls back to a standalone, ungrounded state rather than throwing — a slot preview rendered
 *  outside a template (e.g. an isolated storybook-style tool, should one ever exist) shouldn't
 *  hard-crash for lack of a provider it doesn't know it needs. */
const FALLBACK: RsvpFlowState = {
  step: 'form', setStep: () => {},
  form: DEFAULT_FORM, setForm: () => {},
  selectedTableId: null, setSelectedTableId: () => {},
  submitting: false, setSubmitting: () => {},
  done: false, setDone: () => {},
};

export function useRsvpFlow(): RsvpFlowState {
  return useContext(RsvpFlowContext) ?? FALLBACK;
}
