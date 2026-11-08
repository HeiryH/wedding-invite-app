'use client';
import { useCallback, useRef, useState, type SetStateAction } from 'react';

/** Shared RSVP state; templates keep their form markup and choose numeric or named steps. */
export function useRsvpController<Form extends { numberOfAttendees: number }>(initial: Form) {
  const [form, updateForm] = useState(initial);
  const currentForm = useRef(initial);
  const [isAttending, setIsAttending] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const setForm = useCallback((action: SetStateAction<Form>) => {
    const next = typeof action === 'function' ? (action as (current: Form) => Form)(currentForm.current) : action;
    if (next.numberOfAttendees !== currentForm.current.numberOfAttendees) setSelectedTableId(null);
    currentForm.current = next; updateForm(next);
  }, []);
  const setScreen = useCallback((action: SetStateAction<'form' | 'seating'>) => {
    setStep((current) => {
      const screen = current === 1 ? 'form' : 'seating';
      const next = typeof action === 'function' ? action(screen) : action;
      return next === 'form' ? 1 : 2;
    });
  }, []);
  return { form, setForm, isAttending, setIsAttending, step, setStep, selectedTableId, setSelectedTableId,
    submitting, setSubmitting, done, setDone, screen: (step === 1 ? 'form' : 'seating') as 'form' | 'seating', setScreen };
}
