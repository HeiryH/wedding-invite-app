'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreateGuest, Wedding } from '@/lib/api';
import styles from '../Template6.module.css';

interface Props {
  onRSVP: (data: any) => Promise<void>;
  customConfig?: Record<string, string>;
  wedding?: Wedding;
}

export default function RSVPSection({ onRSVP, customConfig, wedding }: Props) {
  const paxLimit = (wedding?.maxPax ?? 0) > 0 ? Math.min(10, wedding!.maxPax!) : 10;
  const t = (key: string, fallback: string) => customConfig?.[key] || fallback;
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    guestName: '',
    email: '',
    phoneNumber: '',
    brideOrGroomSide: 'Bride' as 'Bride' | 'Groom',
    numberOfAttendees: 1,
    isAttending: true,
    songRequest: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onRSVP(form);
      setDone(true);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="rsvp" className={styles.sectionRSVP}>
      <motion.div
        className={styles.sectionInner}
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8 }}
      >
        <h2 className={styles.sectionTitle}>
          <span className={styles.titleDecor}>✦</span>
          RSVP
          <span className={styles.titleDecor}>✦</span>
        </h2>

        <p className={styles.rsvpSubtitle}>
          {t('rsvp.subtitle', 'Kindly reply by one week before the wedding date')}
        </p>

        {done ? (
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
        {open && (
          <>
            <motion.div
              className={styles.modalOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className={styles.modalSheet}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            >
              <button className={styles.modalClose} onClick={() => setOpen(false)}>✕</button>
              <h3 className={styles.modalTitle}>Your RSVP</h3>

              <form onSubmit={handleSubmit} className={styles.rsvpForm}>
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
                    <option value="Bride">Bride's Side</option>
                    <option value="Groom">Groom's Side</option>
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
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
