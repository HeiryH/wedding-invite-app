'use client';

import { useEffect, useRef, useState } from 'react';
import { calendarLinks } from '@/lib/templateUtils';
import { useSheets } from '../_shared/slots/sheets';
import type { SlotProps } from '../_shared/types';
import styles from './ProgrammePopup.module.css';

/** Guest-readable programme, independent of the scene camera and its timing clips. */
export default function ProgrammePopup({ slotProps: { wedding, itinerary = [], t }, artwork, title }: {
  slotProps: SlotProps; artwork: string; title?: string;
}) {
  const { openId, close } = useSheets();
  const dialog = useRef<HTMLDialogElement>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const dismiss = close;
  const opened = openId === 'programme';
  useEffect(() => {
    if (!opened) return;
    const node = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    node?.showModal();
    return () => { node?.close(); previous?.focus(); };
  }, [opened]);
  if (!opened) return null;
  const date = new Date(wedding.weddingDate);
  const validDate = Number.isFinite(date.getTime());
  const links = validDate ? calendarLinks(wedding) : undefined;
  const place = wedding.venueAddress || wedding.venue;
  const query = encodeURIComponent(place || '');
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="programme-popup-title"
    onCancel={(event) => { event.preventDefault(); dismiss(); }}
    onClick={(event) => { if (event.target === event.currentTarget) dismiss(); }}>
    <div className={styles.sheet} data-testid="programme-sheet">
    <div id="programme-popup-board" className={styles.board}>
      <img src={artwork} alt="" className={styles.artwork} />
      <div className={styles.copy}>
        <div className={styles.heading}>
          <h2 id="programme-popup-title">{title || t('itinerary.title', 'Programme')}</h2>
          <button type="button" className={styles.close} aria-label="Close programme" onClick={dismiss}>×</button>
        </div>
        {validDate && <p className={styles.date}>{date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
        <div className={styles.content} tabIndex={0} role="region" aria-label="Programme board content">
          <div className={styles.schedule} role="region" aria-label="Programme itinerary">
            {itinerary.length ? <ol>{itinerary.map((item) => <li key={item.itineraryItemId}>
              {item.detail && <span className={styles.time}>{item.detail}</span>}<span>{item.label}</span>
            </li>)}</ol> : <p>The programme will be shared here soon.</p>}
          </div>
          <section className={styles.details} aria-label="Calendar and venue">
            {wedding.venue && <h3>{wedding.venue}</h3>}
            {wedding.venueAddress && <p>{wedding.venueAddress}</p>}
            <div className={styles.actions}>
              {links && <details><summary>{t('ceremony.calendar_label', 'Save to calendar')}</summary>
                <nav aria-label="Calendar options">
                  <a href={links.google} target="_blank" rel="noopener noreferrer">Google Calendar</a>
                  <a href={links.ical} download="programme.ics">Apple Calendar / iCal</a>
                  <a href={links.outlook} target="_blank" rel="noopener noreferrer">Outlook</a>
                </nav>
              </details>}
              {place && <button type="button" aria-expanded={mapOpen} aria-controls="programme-venue-map"
                onClick={() => setMapOpen((value) => !value)}>{mapOpen ? 'Hide venue map' : 'View venue map'}</button>}
            </div>
            {place && mapOpen && <div id="programme-venue-map" className={styles.map}>
              <iframe title="Programme venue map" src={`https://maps.google.com/maps?q=${query}&output=embed`} loading="lazy" allowFullScreen />
              <a href={`https://www.google.com/maps/search/?api=1&query=${query}`} target="_blank" rel="noopener noreferrer">Open directions in Google Maps</a>
            </div>}
          </section>
        </div>
      </div>
    </div>
    </div>
  </dialog>;
}
