'use client';

import { useState } from 'react';
import { calendarLinks } from '@/lib/templateUtils';
import type { SlotProps } from '../types';
import styles from './slots.module.css';

/** The Walimah beat — the couple's own rich text, under an engraved title. */
export function WalimahBodySlot({ t }: SlotProps) {
  const body = t('walimah.body', '');
  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>{t('walimah.title', 'Walimatul Urus')}</h3>
      <div className={styles.fleuron}>❦</div>
      {body && <div className={styles.panelBody} dangerouslySetInnerHTML={{ __html: body }} />}
    </div>
  );
}

export function CoupleNamesSlot({ wedding, t }: SlotProps) {
  const body = t('invite.body', '');
  const brideFirst = t('general.brideFirst', 'true') !== 'false';
  const first = brideFirst ? wedding.brideName : wedding.groomName;
  const second = brideFirst ? wedding.groomName : wedding.brideName;

  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>{t('ceremony.panel.couple_title', 'The Bride & Groom')}</h3>
      <div className={styles.coupleRow}>
        <span className={styles.coupleName}>{first}</span>
        <span className={styles.coupleAmp}>&</span>
        <span className={styles.coupleName}>{second}</span>
      </div>
      {body && <div className={styles.panelBody} dangerouslySetInnerHTML={{ __html: body }} />}
    </div>
  );
}

/**
 * Add-to-Calendar was a bare `target="_blank"` link straight to Google Calendar (fine, but T5's
 * own version is a modal offering Google/Apple/Outlook side by side); View Map was the same
 * straight-to-Google-Maps link (T5 expands an inline embedded map instead, so a guest checking the
 * venue doesn't leave the invitation at all). Both config-gated exactly as T5 already gates them
 * (`general.showAddToCalendar`/`general.showVenueMap`) — untouched invitations (both flags off,
 * the default) render identically to before.
 */
export function CeremonyDetailsSlot({ wedding, t }: SlotProps) {
  const date = new Date(wedding.weddingDate);
  const links = calendarLinks(wedding);
  const mapQuery = encodeURIComponent(wedding.venueAddress || wedding.venue || '');
  const showCalendar = t('general.showAddToCalendar', 'false') === 'true';
  const showMap = t('general.showVenueMap', 'false') === 'true';
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>{t('ceremony.panel.details_title', 'Ceremony Details')}</h3>

      <div className={styles.detailRow}>
        <div className={styles.detailLabel}>When</div>
        <div className={styles.detailValue}>
          {date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <div className={styles.detailValue}>
          {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {wedding.venue && (
        <div className={styles.detailRow}>
          <div className={styles.detailLabel}>Where</div>
          <div className={styles.detailValue}>{wedding.venue}</div>
          {wedding.venueAddress && <div className={styles.panelBody}>{wedding.venueAddress}</div>}
        </div>
      )}

      {(showCalendar || (showMap && mapQuery)) && (
        <div className={styles.detailActions}>
          {showCalendar && (
            <button type="button" className={`${styles.plaque} ${styles.plaqueBtn}`} onClick={() => setCalendarOpen(true)}>
              Add to Calendar
            </button>
          )}
          {showMap && mapQuery && (
            <button type="button" className={`${styles.plaque} ${styles.plaqueBtn}`} onClick={() => setMapOpen((v) => !v)}>
              {mapOpen ? 'Hide Map' : 'View Map'}
            </button>
          )}
        </div>
      )}

      {showMap && mapOpen && mapQuery && (
        <div className={styles.mapEmbed}>
          <iframe
            className={styles.mapIframe}
            src={`https://maps.google.com/maps?q=${mapQuery}&output=embed`}
            loading="lazy"
            allowFullScreen
          />
        </div>
      )}

      {calendarOpen && (
        <div className={styles.calendarOverlay} onClick={() => setCalendarOpen(false)}>
          <div className={styles.calendarCard} onClick={(e) => e.stopPropagation()}>
            <p className={styles.panelTitle} style={{ fontSize: '1.1rem' }}>Add to Calendar</p>
            <div className={styles.calendarOptions}>
              <a href={links.google} target="_blank" rel="noopener noreferrer" className={styles.calendarOption}>Google Calendar</a>
              <a href={links.ical} download="wedding.ics" className={styles.calendarOption}>Apple Calendar</a>
              <a href={links.outlook} target="_blank" rel="noopener noreferrer" className={styles.calendarOption}>Outlook</a>
            </div>
            <button type="button" className={styles.linkBtn} onClick={() => setCalendarOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ItinerarySlot({ itinerary, t }: SlotProps) {
  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>{t('itinerary.title', 'Aturcara Majlis')}</h3>
      <div className={styles.fleuron}>❦</div>

      <ol className={styles.itineraryList}>
        {itinerary.map((item) => (
          <li key={item.itineraryItemId} className={styles.itineraryItem}>
            {/* The old Programme scene silently dropped the time — a schedule without times
                isn't a schedule. `detail` is where the couple types it. */}
            {item.detail && <span className={styles.itineraryTime}>{item.detail}</span>}
            <h4 className={styles.itineraryTitle}>{item.label}</h4>
          </li>
        ))}
      </ol>
    </div>
  );
}
