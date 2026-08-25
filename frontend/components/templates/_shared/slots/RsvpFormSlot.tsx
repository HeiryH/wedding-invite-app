'use client';

import type { EditorHandle, SlotProps } from '../types';
import SeatingChart from './SeatingChart';
import { useRsvpFlow } from './rsvpFlow';
import styles from './slots.module.css';

/**
 * RSVP is split into independently-positionable layers, mirroring the Wishes split
 * (title / prompt / form / list): `RsvpTitleSlot`, `RsvpPromptSlot`, `RsvpFormSlot` (step 1 —
 * details + attending choice) and `RsvpSeatingSlot` (step 2 — table pick, only reachable when the
 * wedding's tier/feature includes seating; see `SLOT_AVAILABLE.rsvpSeating` in `_shared/slots/
 * index.ts`, the same gate `seatingEnabled` already drives elsewhere). All four read/write the
 * same `useRsvpFlow()` state (`_shared/slots/rsvpFlow.tsx`) so the step machine stays one guest
 * flow across four separately-mounted React components instead of four disconnected widgets.
 */

export function RsvpTitleSlot({ t }: SlotProps) {
  return (
    <div className={styles.plateTitle}>
      <h2>{t('rsvp.title', 'RSVP')}</h2>
      <div className={styles.fleuron}>❦</div>
    </div>
  );
}

export function RsvpPromptSlot({ t }: SlotProps) {
  return (
    <p className={styles.sectionLead} style={{ margin: 0 }}>
      {t('rsvp.subtitle', 'Kindly reply by one week before the wedding date')}
    </p>
  );
}

/**
 * Whether this slot's content should currently be on screen. Guests follow the real step machine;
 * the Adjust panel instead follows layer *selection*, so an editor can click either layer's row
 * in the list to bring it forward and position it, independent of where a real guest happens to
 * be in the flow (the actual network submit is blocked separately — see `editing` checks below).
 */
function isActiveStep(
  editing: boolean,
  editor: EditorHandle | undefined,
  step: 'form' | 'seating',
  thisStep: 'form' | 'seating',
): boolean {
  if (!editing) return step === thisStep;
  // Form is the default view — selecting any *other* layer (Title, Prompt, the decorative art)
  // must not blank it out. Only explicitly selecting the Seating layer brings that forward.
  const seatingSelected = editor?.selectedLayer === 'seating';
  return thisStep === 'form' ? !seatingSelected : seatingSelected;
}

export function RsvpFormSlot({ wedding, onRSVP, seatingEnabled, editing, editor }: SlotProps) {
  const paxLimit = (wedding.maxPax ?? 0) > 0 ? Math.min(10, wedding.maxPax!) : 10;
  const {
    step, setStep, form, setForm, selectedTableId, submitting, setSubmitting, done, setDone,
  } = useRsvpFlow();

  if (!isActiveStep(editing, editor, step, 'form')) return null;

  const send = async () => {
    setSubmitting(true);
    try {
      await onRSVP({ ...form, tableId: selectedTableId });
      setDone(true);
    } catch {
      alert('Failed to submit RSVP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Advancing to the seating step is a pure UI transition — safe in the editor, and it's how an
    // editor reaches the seating layer at all (see isActiveStep above). Only the real network post
    // (send, below) needs to stay guarded.
    if (form.isAttending && seatingEnabled && step === 'form') { setStep('seating'); return; }
    if (editing) return;
    await send();
  };

  const closed = wedding.isRsvpOpen === false;

  return (
    <div className={styles.panel}>
      {closed ? (
        <p className={styles.notice}>RSVPs are closed — thank you for your interest.</p>
      ) : done ? (
        <p className={styles.notice}>Thank you. We look forward to celebrating with you.</p>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className={styles.field}
            placeholder="Full name *"
            required
            value={form.guestName}
            onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))}
          />

          <div className={styles.fieldRow}>
            <input
              className={styles.field}
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <input
              className={styles.field}
              placeholder="Phone"
              value={form.phoneNumber}
              onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
            />
          </div>

          <div className={styles.fieldRow}>
            <select
              className={styles.field}
              value={form.brideOrGroomSide}
              onChange={(e) => setForm((f) => ({ ...f, brideOrGroomSide: e.target.value as 'Bride' | 'Groom' }))}
            >
              <option value="Bride">Bride&apos;s side</option>
              <option value="Groom">Groom&apos;s side</option>
            </select>
            <input
              className={styles.field}
              type="number"
              min={1}
              max={paxLimit}
              value={form.numberOfAttendees}
              onChange={(e) => {
                const raw = Number(e.target.value) || 1;
                setForm((f) => ({ ...f, numberOfAttendees: Math.max(1, Math.min(raw, paxLimit)) }));
              }}
            />
          </div>

          <div className={styles.choiceRow}>
            <button
              type="button"
              className={`${styles.choice} ${form.isAttending ? styles.choiceActive : ''}`}
              onClick={() => setForm((f) => ({ ...f, isAttending: true }))}
            >
              Joyfully accept
            </button>
            <button
              type="button"
              className={`${styles.choice} ${!form.isAttending ? styles.choiceActive : ''}`}
              onClick={() => setForm((f) => ({ ...f, isAttending: false }))}
            >
              Regretfully decline
            </button>
          </div>

          <input
            className={styles.field}
            placeholder="Song request (optional)"
            value={form.songRequest}
            onChange={(e) => setForm((f) => ({ ...f, songRequest: e.target.value }))}
          />

          <div className={styles.formActions}>
            <button type="submit" className={`${styles.plaque} ${styles.plaqueBtn}`} disabled={submitting}>
              {submitting ? 'Sending…' : form.isAttending && seatingEnabled ? 'Continue' : 'Send RSVP'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function RsvpSeatingSlot({ onRSVP, tables, editing, editor, t }: SlotProps) {
  const {
    step, setStep, form, selectedTableId, setSelectedTableId, submitting, setSubmitting, done, setDone,
  } = useRsvpFlow();

  if (!isActiveStep(editing, editor, step, 'seating')) return null;

  const send = async () => {
    if (editing) return; // laying out the stage must never post a real RSVP
    setSubmitting(true);
    try {
      await onRSVP({ ...form, tableId: selectedTableId });
      setDone(true);
    } catch {
      alert('Failed to submit RSVP');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.panel}>
      {done ? (
        <p className={styles.notice}>Thank you. We look forward to celebrating with you.</p>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); void send(); }} className={styles.form}>
          <SeatingChart
            tables={tables}
            numberOfAttendees={form.numberOfAttendees}
            selectedTableId={selectedTableId}
            onSelect={setSelectedTableId}
            prompt={t('rsvp.seating_prompt', 'Choose your table')}
          />
          <div className={styles.formActions}>
            <button type="button" className={styles.linkBtn} onClick={() => setStep('form')}>
              Back
            </button>
            <button type="submit" className={`${styles.plaque} ${styles.plaqueBtn}`} disabled={submitting}>
              {submitting ? 'Sending…' : 'Send RSVP'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
