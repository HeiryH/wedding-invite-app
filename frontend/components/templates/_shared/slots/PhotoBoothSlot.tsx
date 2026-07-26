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

const STEPS = [
  { title: 'Snap a Photo', desc: 'Take as many photos as you like.' },
  { title: 'Leave a Memory', desc: 'Stick it in our guestbook with a sweet note.' },
  { title: 'Cherish Forever', desc: 'Your memory, our keepsake.' },
];

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
export default function PhotoBoothSlot({ photos, onUploadPhoto, t, editing }: SlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [layout, setLayout] = useState<'stack' | 'grid'>(photos.length > 1 ? 'stack' : 'grid');
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadPhoto || editing) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('guestName', 'Guest');
    await onUploadPhoto(fd);
    e.target.value = '';
  };

  const goNext = () => { setDirection(1); setIndex((i) => (i + 1) % photos.length); };
  const goPrev = () => { setDirection(-1); setIndex((i) => (i - 1 + photos.length) % photos.length); };

  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>{t('photobooth.title', 'Photo Booth')}</h3>

      <div className={styles.steps}>
        {STEPS.map((s) => (
          <div key={s.title} className={styles.step}>
            <div className={styles.stepTitle}>{s.title}</div>
            <p className={styles.stepDesc}>{s.desc}</p>
          </div>
        ))}
      </div>

      {onUploadPhoto && (
        <div className={styles.uploadRow}>
          <input ref={inputRef} type="file" accept="image/*" className={styles.hiddenInput} onChange={handleFile} />
          <button
            type="button"
            className={`${styles.plaque} ${styles.plaqueBtn}`}
            onClick={() => inputRef.current?.click()}
          >
            Upload a Photo
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
