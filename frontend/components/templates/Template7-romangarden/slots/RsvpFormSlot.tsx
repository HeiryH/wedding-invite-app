'use client';

import { useState } from 'react';
import type { SlotProps } from '../types';
import SeatingChart from './SeatingChart';
import styles from '../Template7.module.css';

/**
 * The RSVP form, sized to sit inside the engraved frame art (which is a separate layer, so the
 * couple can move and scale the frame and the form independently in the Adjust panel).
 */
export default function RsvpFormSlot({
  wedding, t, onRSVP, tables, seatingEnabled, editing,
}: SlotProps) {
  const paxLimit = (wedding.maxPax ?? 0) > 0 ? Math.min(10, wedding.maxPax!) : 10;

  const [step, setStep] = useState<'form' | 'seating'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [form, setForm] = useState({
    guestName: '',
    email: '',
    phoneNumber: '',
    brideOrGroomSide: 'Bride' as 'Bride' | 'Groom',
    numberOfAttendees: 1,
    isAttending: true,
    songRequest: '',
  });

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
    if (editing) return; // laying out the stage must never post a real RSVP
    // Attending + seating on → open the chart before committing the RSVP.
    if (form.isAttending && seatingEnabled && step === 'form') {
      setStep('seating');
      return;
    }
    await send();
  };

  const closed = wedding.isRsvpOpen === false;

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>RSVP</h2>
      <div className={styles.fleuron}>❦</div>

      {closed ? (
        <p className={styles.notice}>RSVPs are closed — thank you for your interest.</p>
      ) : done ? (
        <p className={styles.notice}>Thank you. We look forward to celebrating with you.</p>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          {step === 'form' ? (
            <>
              <p className={styles.sectionLead}>
                {t('rsvp.subtitle', 'Kindly reply by one week before the wedding date')}
              </p>

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
            </>
          ) : (
            <>
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
            </>
          )}
        </form>
      )}
    </div>
  );
}
