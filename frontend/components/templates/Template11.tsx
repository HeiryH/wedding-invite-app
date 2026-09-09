'use client';

import { useRef, useState, useEffect } from 'react';
import { Wedding, Wish, Photo, ItineraryItem } from '@/lib/api';
import { resolveSectionOrder, type SectionCode } from '@/lib/templateUtils';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { useParallax } from '@/components/templates/_shared/hooks/useParallax';
import { FlowBackground } from '@/components/templates/_shared/FlowBackground';
import { PropLayer } from './Template11-rosehorizon/PropLayer';
import styles from './Template11-rosehorizon/Template11.module.css';

interface Template11Props {
  wedding: Wedding;
  onRSVP: (data: any) => Promise<void>;
  onSubmitWish: (data: any) => Promise<void>;
  onUploadPhoto?: (data: any) => Promise<void>;
  wishes: Wish[];
  photos: Photo[];
  photoBoothEnabled: boolean;
  customConfig?: Record<string, string>;
  itinerary?: ItineraryItem[];
}

/**
 * Template 11 "Rose Horizon" — Classic family (flow + overlay), PRO tier.
 *
 * Built through the invite-authoring pipeline (docs/invite-pipeline.md), the first Classic-
 * family template it's produced. Two things that don't exist for any other Classic template:
 *
 * - **FlowBackground**: one shared, mirror-stacked, height-reactive background behind every
 *   section (see spec/background.md) instead of a per-section image.
 * - **PropLayer**: default decorative art (roses, icons, the welcome arch) at positions
 *   `ingest` measured off the approved design — not couple-editable via the Adjust dock yet;
 *   see PropLayer.tsx for why.
 *
 * Scope note: this pass ("skeleton depth," by explicit human direction) wires real layout,
 * real decorative art, real parallax, and real content display — but RSVP/wish/photo submit
 * handlers are minimal (no multi-step wizard, no seating step, no client-side file preview),
 * deferred to a follow-up pass rather than matching Template4-class completeness now.
 */
export default function Template11({
  wedding,
  onRSVP,
  onSubmitWish,
  onUploadPhoto,
  wishes,
  photos,
  photoBoothEnabled,
  customConfig,
  itinerary = [],
}: Template11Props) {
  const t = (key: string, fallback: string) => customConfig?.[key] || fallback;
  const sectionOrder = resolveSectionOrder(
    customConfig?.['section.order'],
    !!customConfig?.['walimah.body'],
    itinerary.length > 0,
    photoBoothEnabled,
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useParallax(rootRef, 'on', reduced);

  const weddingDate = new Date(wedding.weddingDate);
  const dateLabel = weddingDate.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // RSVP — minimal, per this pass's scope (see component doc comment).
  const [rsvpName, setRsvpName] = useState('');
  const [attending, setAttending] = useState(true);
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [rsvpDone, setRsvpDone] = useState(false);
  const submitRsvp = async () => {
    if (!rsvpName.trim() || rsvpBusy) return;
    setRsvpBusy(true);
    try {
      await onRSVP({ guestName: rsvpName, brideOrGroomSide: 'Bride', numberOfAttendees: attending ? 1 : 0 });
      setRsvpDone(true);
    } finally {
      setRsvpBusy(false);
    }
  };

  // Wishes — minimal.
  const [wishName, setWishName] = useState('');
  const [wishMessage, setWishMessage] = useState('');
  const [wishBusy, setWishBusy] = useState(false);
  const submitWish = async () => {
    if (!wishName.trim() || !wishMessage.trim() || wishBusy) return;
    setWishBusy(true);
    try {
      await onSubmitWish({ guestName: wishName, message: wishMessage });
      setWishName('');
      setWishMessage('');
    } finally {
      setWishBusy(false);
    }
  };

  const scrollTo = (code: SectionCode) => document.getElementById(code)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <FlowBackground src="/templates/rose-horizon/bg/flow.webp" tileHeight={2048} parallaxRate={0.3} />

      {sectionOrder.map((code) => {
        switch (code) {
          case 'welcome':
            return (
              <section key={code} id={code} className={styles.section}>
                <PropLayer section="welcome" />
                <div className={styles.panel} data-depth={0.4}>
                  <div className={styles.themeLabel}>{t('nav.invite', 'The Wedding Of')}</div>
                  <h1 className={styles.heading}>{wedding.brideName} &amp; {wedding.groomName}</h1>
                  <div className={styles.subheading}>{dateLabel}</div>
                  <div className={styles.body}>{wedding.venue}<br />{wedding.venueAddress}</div>
                </div>
                <button
                  className={styles.scrollCue}
                  onClick={() => scrollTo(sectionOrder[1] ?? 'rsvp')}
                  aria-label="Scroll to next section"
                >
                  ↓
                </button>
              </section>
            );

          case 'walimah':
            return (
              <section key={code} id={code} className={styles.section}>
                <PropLayer section="walimah" />
                <div className={styles.panel} data-depth={0.4}>
                  <h2 className={styles.heading} style={{ fontSize: '1.8rem' }}>
                    {t('walimah.title', 'Walimatul Urus')}
                  </h2>
                  {customConfig?.['walimah.body'] ? (
                    <div className={styles.body} dangerouslySetInnerHTML={{ __html: customConfig['walimah.body'] }} />
                  ) : (
                    <div className={styles.body}>{dateLabel} · {wedding.venue}</div>
                  )}
                </div>
              </section>
            );

          case 'rsvp':
            return (
              <section key={code} id={code} className={styles.section}>
                <PropLayer section="rsvp" />
                <div className={styles.panel} data-depth={0.4}>
                  <h2 className={styles.heading} style={{ fontSize: '2rem' }}>RSVP</h2>
                  <p className={styles.body} style={{ marginBottom: '1.2rem' }}>
                    Kindly let us know if you can join us
                  </p>
                  {rsvpDone ? (
                    <p className={styles.body}>Thank you — your reply has been received.</p>
                  ) : (
                    <>
                      <input
                        className={styles.field}
                        placeholder="Your name"
                        value={rsvpName}
                        onChange={(e) => setRsvpName(e.target.value)}
                      />
                      <div className={styles.attendChoice}>
                        <button
                          type="button"
                          className={attending ? styles.attendChoiceActive : ''}
                          onClick={() => setAttending(true)}
                        >
                          Joyfully Accept
                        </button>
                        <button
                          type="button"
                          className={!attending ? styles.attendChoiceActive : ''}
                          onClick={() => setAttending(false)}
                        >
                          Regretfully Decline
                        </button>
                      </div>
                      <button className={styles.button} onClick={submitRsvp} disabled={rsvpBusy || !rsvpName.trim()}>
                        {rsvpBusy ? 'Sending…' : 'Submit RSVP'}
                      </button>
                    </>
                  )}
                </div>
              </section>
            );

          case 'itinerary':
            return (
              <section key={code} id={code} className={styles.section}>
                <PropLayer section="itinerary" />
                <div className={styles.panel} data-depth={0.4}>
                  <h2 className={styles.heading} style={{ fontSize: '1.8rem' }}>
                    {t('itinerary.title', 'Atur Cara')}
                  </h2>
                  {itinerary.map((item) => (
                    <div key={item.itineraryItemId} className={styles.itineraryRow}>
                      <span className={styles.itineraryTime}>{item.label}</span>
                      <span className={styles.itineraryLabel}>{item.detail}</span>
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'wishes':
            return (
              <section key={code} id={code} className={styles.section}>
                <PropLayer section="wishes" />
                <div className={styles.panel} data-depth={0.4}>
                  <h2 className={styles.heading} style={{ fontSize: '1.8rem' }}>
                    {t('wishes.title', 'Ucapan')}
                  </h2>
                  <p className={styles.body} style={{ marginBottom: '1rem' }}>Leave a message for the couple</p>
                  <input
                    className={styles.field}
                    placeholder="Your name"
                    value={wishName}
                    onChange={(e) => setWishName(e.target.value)}
                  />
                  <textarea
                    className={styles.field}
                    placeholder="Your message"
                    rows={3}
                    value={wishMessage}
                    onChange={(e) => setWishMessage(e.target.value)}
                  />
                  <button
                    className={styles.button}
                    onClick={submitWish}
                    disabled={wishBusy || !wishName.trim() || !wishMessage.trim()}
                  >
                    {wishBusy ? 'Sending…' : 'Send'}
                  </button>
                  {wishes.slice(0, 6).map((w) => (
                    <div key={w.wishId} className={styles.wishItem}>
                      <div className={styles.wishAuthor}>{w.guestName}</div>
                      <div className={styles.wishMessage}>{w.message}</div>
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'photobooth':
            return (
              <section key={code} id={code} className={styles.section}>
                <PropLayer section="photobooth" />
                <div className={styles.panel} data-depth={0.4}>
                  <h2 className={styles.heading} style={{ fontSize: '1.8rem' }}>Photos</h2>
                  <div className={styles.photoGrid}>
                    {photos.slice(0, 6).map((p) => (
                      <img key={p.photoId} src={p.photoUrl} alt={p.caption ?? ''} />
                    ))}
                  </div>
                </div>
              </section>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
