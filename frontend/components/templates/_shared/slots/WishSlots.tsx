'use client';

import { useRef, useState } from 'react';
import type { SlotProps } from '../types';
import { isActiveWishStep, useWishFlow } from './wishFlow';
import { useSheets } from './sheets';
import { uploadPhotoFile } from './PhotoBoothSlot';
import styles from './slots.module.css';

/** Four independent layers — title, prompt, form, list — each its own absolutely-positioned
 *  slot in data/stages.ts's `wishes` stage. */

export function WishTitleSlot({ t }: SlotProps) {
  return (
    <div className={styles.plateTitle}>
      <h2>{t('wish.title', 'Wishes & Blessings')}</h2>
    </div>
  );
}

export function WishPromptSlot({ t }: SlotProps) {
  return (
    <p className={styles.sectionLead} style={{ margin: 0 }}>
      {t('wish.prompt', 'Leave a message for the happy couple')}
    </p>
  );
}

/**
 * Step 1 of the wish sheet.
 *
 * The old inline version started collapsed to one line and expanded on focus, purely to keep its
 * reserved box on the stage small — a workaround for living in an absolutely-positioned layer that
 * its neighbours could never reflow around. In a sheet there's room to show every field at once,
 * so the expand/collapse (and the `onBlur` containment check that made tabbing between fields
 * work) is gone rather than ported.
 */
export function WishFormSlot({ onSubmitWish, editing, editor, t, photoBoothEnabled, onUploadPhoto }: SlotProps) {
  const { step, setStep, form, setForm, submitting, setSubmitting, sent, setSent } = useWishFlow();
  const { close } = useSheets();

  if (!isActiveWishStep(editing, editor?.selectedLayer, step, 'form')) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) return; // laying out the stage must never post a real wish
    setSubmitting(true);
    try {
      await onSubmitWish(form);
      setForm({ guestName: '', message: '' });
      setSent(true);
      // Unlike the RSVP flow, the step advance sits *inside* the success branch rather than being
      // hoisted above the `editing` guard. RSVP hoists because selecting-the-seating-layer aside,
      // that's the only way an editor reaches step 2; here the editor reaches the photo step by
      // selecting the `wishPhoto` layer (see isActiveWishStep), so the transition can stay honest
      // and only fire on a real submit.
      if (photoBoothEnabled && onUploadPhoto) {
        setStep('photo');
      } else {
        setTimeout(() => { setSent(false); close(); }, 1500);
      }
    } catch {
      alert('Failed to submit your wish');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.wishCardBody} onSubmit={submit}>
      <h3 className={styles.panelTitle}>{t('wish.form_title', 'Leave a Wish')}</h3>
      {sent && <p className={styles.sectionLead}>{t('wish.sent_message', 'Thank you — your wish was sent.')}</p>}
      <textarea
        className={styles.wishTextarea}
        placeholder={t('wish.message_placeholder', 'Write your wish for the couple…')}
        required
        rows={3}
        value={form.message}
        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
      />
      <input
        className={styles.field}
        placeholder={t('wish.name_placeholder', 'Your name *')}
        required
        value={form.guestName}
        onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))}
      />
      <button type="submit" className={`${styles.plaque} ${styles.plaqueBtn}`} disabled={submitting}>
        {submitting ? 'Sending…' : t('wish.submit_label', 'Send Wish')}
      </button>
    </form>
  );
}

/**
 * Step 2 of the wish sheet — an optional photo, offered right after a wish lands because that's
 * when a guest is already in a sharing frame of mind. Gated on `photoBoothEnabled`
 * (`SLOT_AVAILABLE.wishPhoto`), so with the feature off the flow simply ends at step 1.
 */
export function WishPhotoSlot({ onUploadPhoto, editing, editor, t }: SlotProps) {
  const { step, setStep, sent, setSent } = useWishFlow();
  const { close } = useSheets();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isActiveWishStep(editing, editor?.selectedLayer, step, 'photo')) return null;

  const finish = () => { setStep('form'); setSent(false); setFile(null); setCaption(''); close(); };

  const send = async () => {
    if (!file || !onUploadPhoto || editing) return;
    setBusy(true);
    try {
      await uploadPhotoFile(onUploadPhoto, file, { caption });
      finish();
    } catch {
      alert('Failed to upload your photo');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.wishCardBody}>
      {sent && <p className={styles.sectionLead}>{t('wish.sent_message', 'Thank you — your wish was sent.')}</p>}
      <h3 className={styles.panelTitle}>{t('wish.photo_title', 'Add a photo?')}</h3>
      <p className={styles.sectionLead}>
        {t('wish.photo_prompt', 'Optional — share a snapshot to go with your wish.')}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <button type="button" className={styles.linkBtn} onClick={() => inputRef.current?.click()}>
        {file ? file.name : t('wish.photo_choose_label', 'Choose a Photo')}
      </button>

      {file && (
        <input
          className={styles.field}
          placeholder={t('wish.photo_caption_placeholder', 'Caption (optional)')}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
      )}

      <div className={styles.wishPhotoActions}>
        <button type="button" className={styles.linkBtn} onClick={finish}>
          {t('wish.photo_skip_label', 'Skip')}
        </button>
        <button
          type="button"
          className={`${styles.plaque} ${styles.plaqueBtn}`}
          onClick={send}
          disabled={!file || busy}
        >
          {busy ? 'Uploading…' : t('photobooth.upload_label', 'Upload a Photo')}
        </button>
      </div>
    </div>
  );
}

/** Paginates 10-at-a-time (Template5.tsx's own convention) rather than dumping every wish onto
 *  the page at once — a "Load more" button reveals the next batch. */
export function WishListSlot({ wishes }: SlotProps) {
  const [shown, setShown] = useState(10);
  return (
    <div className={styles.wishList}>
      {wishes.length === 0 ? (
        <p className={styles.empty}>No wishes yet — be the first to write one.</p>
      ) : (
        <>
          {wishes.slice(0, shown).map((w) => (
            <blockquote key={w.wishId} className={styles.wishItem}>
              <div className={styles.wishFrom}>{w.guestName}</div>
              <p className={styles.wishMsg}>“{w.message}”</p>
            </blockquote>
          ))}
          {wishes.length > shown && (
            <button type="button" className={styles.linkBtn} onClick={() => setShown((n) => n + 10)}>
              Load more ({wishes.length - shown} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
}
