'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Photo } from '@/lib/api';
import type { SlotProps } from '../types';
// The two alternating frame overlays are a deliberate, accepted T7 art borrow (see
// slots.module.css's .photoFrameArt comment) — not generalized to a neutral asset in this pass.
import { T7_ASSETS } from '../../Template7-romangarden/data/stages';
import styles from './slots.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

const stackVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 260 : -260, rotate: dir > 0 ? 10 : -10, opacity: 0, scale: 0.85 }),
  center: { x: 0, rotate: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -260 : 260, rotate: dir > 0 ? -10 : 10, opacity: 0, scale: 0.85 }),
};

/**
 * A stack/grid toggle, a draggable polaroid deck (ghost cards peeking behind + dot indicators),
 * and a lightbox — porting Template5.tsx's own photo gallery (the richer of the two hand-coded
 * versions) onto the shared slot so any authored template gets the same interaction, not just a
 * static grid.
 */
function PhotoBoothBody({ photos, onUploadPhoto, t, editing, upload }: SlotProps & { upload: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [layout, setLayout] = useState<'stack' | 'grid'>(photos.length > 1 ? 'stack' : 'grid');
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadPhoto || editing) return;
    await uploadPhotoFile(onUploadPhoto, file);
    e.target.value = '';
  };

  const goNext = () => { setDirection(1); setIndex((i) => (i + 1) % photos.length); };
  const goPrev = () => { setDirection(-1); setIndex((i) => (i - 1 + photos.length) % photos.length); };

  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>{t('photobooth.title', 'Photo Booth')}</h3>
      <p className={styles.sectionLead}>
        {t('photobooth.prompt', 'Snap a photo, leave it in our gallery, and cherish it with us forever.')}
      </p>

      {upload && onUploadPhoto && (
        <div className={styles.uploadRow}>
          <input ref={inputRef} type="file" accept="image/*" className={styles.hiddenInput} onChange={handleFile} />
          <button
            type="button"
            className={`${styles.plaque} ${styles.plaqueBtn}`}
            onClick={() => inputRef.current?.click()}
          >
            {t('photobooth.upload_label', 'Upload a Photo')}
          </button>
        </div>
      )}

      {photos.length > 0 && (
        <>
          {photos.length > 1 && (
            <div className={styles.galleryToggle}>
              <button
                className={`${styles.layoutBtn} ${layout === 'stack' ? styles.layoutBtnActive : ''}`}
                onClick={() => setLayout('stack')}
              >
                Stack
              </button>
              <button
                className={`${styles.layoutBtn} ${layout === 'grid' ? styles.layoutBtnActive : ''}`}
                onClick={() => setLayout('grid')}
              >
                Grid
              </button>
            </div>
          )}

          {layout === 'stack' ? (
            <div className={styles.stackContainer}>
              {photos.length > 2 && (
                <div className={styles.stackGhost2}>
                  <div className={styles.stackPolaroid}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${API_BASE}${photos[(index + 2) % photos.length].photoUrl}`} className={styles.stackPhoto} alt="" draggable={false} />
                  </div>
                </div>
              )}
              {photos.length > 1 && (
                <div className={styles.stackGhost1}>
                  <div className={styles.stackPolaroid}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${API_BASE}${photos[(index + 1) % photos.length].photoUrl}`} className={styles.stackPhoto} alt="" draggable={false} />
                  </div>
                </div>
              )}
              <AnimatePresence custom={direction} mode="popLayout">
                <motion.div
                  key={index}
                  className={styles.stackCard}
                  custom={direction}
                  variants={stackVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 340, damping: 32 }}
                  drag={photos.length > 1 ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.22}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -55 || info.velocity.x < -400) goNext();
                    else if (info.offset.x > 55 || info.velocity.x > 400) goPrev();
                  }}
                  onClick={() => setLightbox(photos[index])}
                >
                  <div className={styles.stackPolaroid}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${API_BASE}${photos[index].photoUrl}`}
                      alt={photos[index].caption ?? ''}
                      className={styles.stackPhoto}
                      draggable={false}
                    />
                    {photos[index].caption && <span className={styles.polaroidCaption}>{photos[index].caption}</span>}
                    {photos[index].guestName && <span className={styles.polaroidBy}>— {photos[index].guestName}</span>}
                  </div>
                </motion.div>
              </AnimatePresence>
              {photos.length > 1 && (
                <>
                  <button className={`${styles.stackNav} ${styles.stackNavPrev}`} onClick={goPrev}>‹</button>
                  <button className={`${styles.stackNav} ${styles.stackNavNext}`} onClick={goNext}>›</button>
                  <div className={styles.stackDots}>
                    {photos.map((_, i) => (
                      <span
                        key={i}
                        className={`${styles.stackDot} ${i === index ? styles.stackDotActive : ''}`}
                        onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className={styles.gallery}>
              {photos.map((p, i) => (
                <figure key={p.photoId} className={styles.photoFrame} onClick={() => setLightbox(p)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${API_BASE}${p.photoUrl}`}
                    alt={p.caption || 'Guest photo'}
                    className={styles.photo}
                    loading="lazy"
                    decoding="async"
                  />
                  {/* Alternate the two engraved frames so the grid doesn't read as a repeat */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${T7_ASSETS}/photobooth/${i % 2 === 0 ? 'square-frame' : 'oval-frame'}.webp`}
                    alt=""
                    className={styles.photoFrameArt}
                    loading="lazy"
                    decoding="async"
                  />
                </figure>
              ))}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={styles.lightboxOverlay}
            onClick={() => setLightbox(null)}
          >
            <div className={styles.lightboxCard} onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${API_BASE}${lightbox.photoUrl}`} alt={lightbox.caption ?? ''} className={styles.lightboxPhoto} />
              {lightbox.caption && <p className={styles.lightboxCaption}>{lightbox.caption}</p>}
              <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>×</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * The one place that knows what an upload payload looks like.
 *
 * Every host handler reads plain-object properties — `app/[eventType]/[slug]/page.tsx` does
 * `photoService.upload(eventId, data.guestName, data.caption, data.file)` — so the `FormData` this
 * used to post arrived as three `undefined`s and silently uploaded nothing. `Template5.tsx` had it
 * right all along; this matches it, and is shared so the wish sheet's photo step can't drift back.
 */
export async function uploadPhotoFile(
  onUploadPhoto: NonNullable<SlotProps['onUploadPhoto']>,
  file: File,
  meta?: { guestName?: string; caption?: string },
): Promise<void> {
  await onUploadPhoto({
    guestName: meta?.guestName?.trim() || 'Guest',
    caption: meta?.caption?.trim() || '',
    file,
  });
}

/** Gallery + upload button — unchanged behaviour for authored templates already using this slot. */
export default function PhotoBoothSlot(p: SlotProps) {
  return <PhotoBoothBody {...p} upload />;
}

/**
 * Gallery only. Template 7 uses this because its wish sheet's optional photo step is the single
 * upload path there — two entry points to the same album would be redundant, and the booth stage
 * reads as something to browse, not a form.
 */
export function PhotoGallerySlot(p: SlotProps) {
  return <PhotoBoothBody {...p} upload={false} />;
}
