'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Photo } from '@/lib/api';
import type { SlotProps } from '../types';
// The two alternating frame overlays are a deliberate, accepted T7 art borrow (see
// slots.module.css's .framedArt comment) — not generalized to a neutral asset in this pass.
import { T7_ASSETS } from '../../Template7-romangarden/data/stages';
import styles from './slots.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';
const subscribeNoop = () => () => {};

/**
 * The engraved T7 frames as *frames*: each entry records the art's own aspect and where its
 * transparent opening sits (measured from the alpha channel, as % of the art box), so the photo
 * is masked into the opening and the art surrounds it — rather than the old approach of filling
 * a square cell with the photo and painting the frame on top, which let photo corners peek out
 * around the oval and hid a ring of every photo under the border.
 */
const FRAMES = {
  square: { src: 'square-frame.webp', ar: 500 / 501, open: { l: 13.2, t: 13.6, w: 73.6, h: 72.5 }, shape: 'rect' as const },
  oval:   { src: 'oval-frame.webp',   ar: 600 / 772, open: { l: 12.2, t: 13.6, w: 75.3, h: 75.8 }, shape: 'ellipse' as const },
};
type FrameKey = keyof typeof FRAMES;
const frameFor = (i: number): FrameKey => (i % 2 === 0 ? 'square' : 'oval');

/** A photo sitting inside a frame's opening, frame art on top. Sized by width; height follows the
 *  frame's aspect. Falls back to a plain cover-fit box when `frame` is undefined (frameArt 'none'). */
function FramedPhoto({ photo, frame, className, style, sizes }: {
  photo: Photo; frame?: FrameKey; className?: string; style?: React.CSSProperties; sizes?: string;
}) {
  const f = frame ? FRAMES[frame] : undefined;
  return (
    <div className={`${styles.framed} ${className ?? ''}`} style={{ aspectRatio: f ? f.ar : 1, ...style }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${API_BASE}${photo.photoUrl}`}
        alt={photo.caption || 'Guest photo'}
        className={styles.framedPhoto}
        sizes={sizes}
        loading="lazy"
        decoding="async"
        draggable={false}
        style={f ? {
          left: `${f.open.l}%`, top: `${f.open.t}%`, width: `${f.open.w}%`, height: `${f.open.h}%`,
          borderRadius: f.shape === 'ellipse' ? '50%' : 'var(--slot-radius, 8px)',
        } : { inset: 0, width: '100%', height: '100%', borderRadius: 'var(--slot-radius, 8px)' }}
      />
      {f && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={`${T7_ASSETS}/photobooth/${f.src}`} alt="" className={styles.framedArt} loading="lazy" decoding="async" draggable={false} />
      )}
    </div>
  );
}

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
  // The engraved-frame overlay is T7 art specifically — a template whose own photobooth scene
  // doesn't want it (e.g. Sunny Safari draws its own gallery board) sets `photobooth.frameArt` to
  // 'none' in its schema defaults. Any other value (including the unset default) keeps it.
  const frameArt = t('photobooth.frameArt', 'roman');
  const framed = frameArt !== 'none';
  const inputRef = useRef<HTMLInputElement>(null);
  const [layout, setLayout] = useState<'stack' | 'grid'>(photos.length > 1 ? 'stack' : 'grid');
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  // Portal target exists only on the client; SSR renders the lightbox nowhere (it's closed anyway).
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

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
                  {framed
                    ? <FramedPhoto photo={photos[(index + 2) % photos.length]} frame={frameFor((index + 2) % photos.length)} className={styles.stackFramed} />
                    : (
                      <div className={styles.stackPolaroid}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`${API_BASE}${photos[(index + 2) % photos.length].photoUrl}`} className={styles.stackPhoto} alt="" draggable={false} />
                      </div>
                    )}
                </div>
              )}
              {photos.length > 1 && (
                <div className={styles.stackGhost1}>
                  {framed
                    ? <FramedPhoto photo={photos[(index + 1) % photos.length]} frame={frameFor((index + 1) % photos.length)} className={styles.stackFramed} />
                    : (
                      <div className={styles.stackPolaroid}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`${API_BASE}${photos[(index + 1) % photos.length].photoUrl}`} className={styles.stackPhoto} alt="" draggable={false} />
                      </div>
                    )}
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
                  {framed ? (
                    <div className={styles.stackFramedCard}>
                      <FramedPhoto photo={photos[index]} frame={frameFor(index)} className={styles.stackFramed} />
                      {photos[index].caption && <span className={styles.polaroidCaption}>{photos[index].caption}</span>}
                      {photos[index].guestName && <span className={styles.polaroidBy}>— {photos[index].guestName}</span>}
                    </div>
                  ) : (
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
                  )}
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
              {/* Alternate the two engraved frames so the grid doesn't read as a repeat; each cell
                  takes its frame's own aspect (square ≈ 1:1, oval ≈ 3:4) and rows align by width. */}
              {photos.map((p, i) => (
                <figure key={p.photoId} className={styles.photoFrame} onClick={() => setLightbox(p)}>
                  <FramedPhoto photo={p} frame={framed ? frameFor(i) : undefined} />
                </figure>
              ))}
            </div>
          )}
        </>
      )}

      {/* Portaled to <body>: the slot sits inside `.stage`, whose `container-type` implies layout
          containment and therefore becomes the containing block for `position: fixed` — left in
          place, the overlay only ever covered the stage box and stage art painted over it. */}
      {mounted && createPortal(
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={styles.lightboxOverlay}
            onClick={() => setLightbox(null)}
          >
            <div className={styles.lightboxCard} onClick={(e) => e.stopPropagation()}>
              {framed ? (
                <FramedPhoto
                  photo={lightbox}
                  frame={frameFor(Math.max(0, photos.findIndex((p) => p.photoId === lightbox.photoId)))}
                  className={styles.lightboxFramed}
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={`${API_BASE}${lightbox.photoUrl}`} alt={lightbox.caption ?? ''} className={styles.lightboxPhoto} />
              )}
              {lightbox.caption && <p className={styles.lightboxCaption}>{lightbox.caption}</p>}
              <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>×</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body)}
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
