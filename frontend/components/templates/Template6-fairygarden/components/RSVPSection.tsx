'use client';
import { useRsvpController } from '@/components/templates/_shared/guest/useRsvpController';
import { configValue } from '@/components/templates/configValue';
import { useDialogBehavior } from '../../_shared/hooks/useDialogBehavior';
import { useGuestSubmission } from '@/components/templates/_shared/guest/useGuestSubmission';
import { guestLimit, normalizeRsvp } from '@/components/templates/_shared/guest/rules';
import type { TemplateRsvpSubmission } from '@/components/templates/guestContracts';

import { useContext, useState, useRef, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wedding, SeatingTable } from '@/lib/api';
import type { Breakpoint, EditorHandle } from '@/components/templates/_shared/types';
import SeatingStep from '../../SeatingStep';
import { SeatingPreviewContext } from '../../_shared/slots/preview';
import SectionOverlay from '../SectionOverlay';
import styles from '../Template6.module.css';

interface Props {
  onRSVP: (data: TemplateRsvpSubmission) => Promise<void>;
  customConfig?: Record<string, string>;
  wedding?: Wedding;
  seatingEnabled?: boolean;
  tables?: SeatingTable[];
  overlayProps: { breakpoint: Breakpoint; config?: Record<string, string>; editor?: EditorHandle };
  a: (stageId: string, elementId: string, base?: CSSProperties) => CSSProperties;
}

export default function RSVPSection({ onRSVP, customConfig, wedding, seatingEnabled = false, tables = [], overlayProps, a }: Props) {
  const {
    screen: step,
    setScreen: setStep,
    selectedTableId,
    setSelectedTableId,
    submitting,
    setSubmitting,
    done,
    setDone,
    form,
    setForm
  } = useRsvpController({
    guestName: '',
    email: '',
    phoneNumber: '',
    brideOrGroomSide: 'Bride' as 'Bride' | 'Groom',
    numberOfAttendees: 1,
    isAttending: true,
    songRequest: '',
  });
  const submission = useGuestSubmission();
  const paxLimit = guestLimit(wedding);
  const t = (key: string, fallback: string) => configValue(customConfig, key, fallback);
  const seatingPreview = useContext(SeatingPreviewContext);

  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(dialogRef, Boolean(open || seatingPreview), () => { setOpen(false); seatingPreview?.dismiss(); });

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (seatingPreview) return;
    if (wedding?.isRsvpOpen === false) return;
    if (seatingEnabled && form.isAttending && step === 'form') { setStep('seating'); return; }
    setSubmitting(true);
    try {
      if (!await submission.submit(() => onRSVP(normalizeRsvp({ ...form, tableId: selectedTableId }, wedding, tables)), 'Could not send your RSVP. Please try again.')) return;
      setDone(true);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="rsvp" className={styles.sectionRSVP}>
      <SectionOverlay stageId="rsvp" {...overlayProps} />
      <motion.div
        className={styles.sectionInner}
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8 }}
      >
        <h2 className={styles.sectionTitle} style={a('rsvp', 'title')}>
          <span className={styles.titleDecor}>✦</span>
          RSVP
          <span className={styles.titleDecor}>✦</span>
        </h2>

        <p className={styles.rsvpSubtitle}>
          {t('rsvp.subtitle', 'Kindly reply by one week before the wedding date')}
        </p>

        {wedding?.isRsvpOpen === false ? (
          <motion.div
            className={styles.rsvpDone}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            🔒 RSVPs are closed — thank you for your interest.
          </motion.div>
        ) : done ? (
          <motion.div
            className={styles.rsvpDone}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            🌿 Thank you! We look forward to celebrating with you.
          </motion.div>
        ) : (
          <motion.button
            className={styles.rsvpOpenBtn}
            onClick={() => setOpen(true)}
            whileTap={{ scale: 0.97 }}
          >
            🌸 Confirm Attendance
          </motion.button>
        )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {(open || seatingPreview) && (
          <>
            <motion.div
              className={styles.modalOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setOpen(false); seatingPreview?.dismiss(); }}
            />
            <motion.div
              ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Your RSVP" className={styles.modalSheet}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            >
              <button aria-label="Close RSVP" className={styles.modalClose} onClick={() => { setOpen(false); seatingPreview?.dismiss(); }}>✕</button>
              <h3 className={styles.modalTitle}>Your RSVP</h3>

              {(seatingPreview || step === 'seating') ? <SeatingStep
                tables={tables} numberOfAttendees={form.numberOfAttendees} selectedTableId={selectedTableId}
                onSelect={setSelectedTableId} onBack={() => { setStep('form'); seatingPreview?.dismiss(); }}
                onSubmit={() => { void handleSubmit(); }} submitting={submitting}
              /> : <form onSubmit={handleSubmit} className={styles.rsvpForm}>
                <input
                  className={styles.rsvpInput}
                  placeholder="Full Name *"
                  value={form.guestName}
                  onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))}
                  required
                />
                <input
                  className={styles.rsvpInput}
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
                <input
                  className={styles.rsvpInput}
                  placeholder="Phone Number"
                  value={form.phoneNumber}
                  onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                />

                <div className={styles.rsvpRow}>
                  <label className={styles.rsvpLabel}>Side</label>
                  <select
                    className={styles.rsvpSelect}
                    value={form.brideOrGroomSide}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        brideOrGroomSide: e.target.value as 'Bride' | 'Groom',
                      }))
                    }
                  >
                    <option value="Bride">Bride&apos;s Side</option>
                    <option value="Groom">Groom&apos;s Side</option>
                  </select>
                </div>

                <div className={styles.rsvpRow}>
                  <label className={styles.rsvpLabel}>Guests</label>
                  <input
                    className={styles.rsvpInputSmall}
                    type="number"
                    min={1}
                    max={paxLimit}
                    value={form.numberOfAttendees}
                    onChange={(e) => {
                      const raw = Number(e.target.value) || 1;
                      setSelectedTableId(null);
                      setForm((f) => ({ ...f, numberOfAttendees: Math.max(1, Math.min(raw, paxLimit)) }));
                    }}
                  />
                </div>

                <div className={styles.rsvpAttendingRow}>
                  <button
                    type="button"
                    className={`${styles.attendingBtn} ${form.isAttending ? styles.attendingActive : ''}`}
                    onClick={() => setForm((f) => ({ ...f, isAttending: true }))}
                  >
                    🎉 Attending
                  </button>
                  <button
                    type="button"
                    className={`${styles.attendingBtn} ${!form.isAttending ? styles.attendingActive : ''}`}
                    onClick={() => setForm((f) => ({ ...f, isAttending: false }))}
                  >
                    😔 Unable to attend
                  </button>
                </div>

                <input
                  className={styles.rsvpInput}
                  placeholder="Song request (optional)"
                  value={form.songRequest}
                  onChange={(e) => setForm((f) => ({ ...f, songRequest: e.target.value }))}
                />

                <motion.button
                  type="submit"
                  className={styles.rsvpSubmitBtn}
                  disabled={submitting}
                  whileTap={{ scale: 0.97 }}
                >
                  {submitting ? '✨ Sending…' : '✨ Submit RSVP'}
                </motion.button>
              </form>}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
