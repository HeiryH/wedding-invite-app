'use client';

import { calendarLinks } from '@/lib/templateUtils';
import type { SlotProps } from '../types';
import styles from '../Template7.module.css';

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

export function CeremonyDetailsSlot({ wedding, t }: SlotProps) {
  const date = new Date(wedding.weddingDate);
  const links = calendarLinks(wedding);
  const mapQuery = encodeURIComponent(wedding.venueAddress || wedding.venue || '');
  const showCalendar = t('general.showAddToCalendar', 'false') === 'true';
  const showMap = t('general.showVenueMap', 'false') === 'true';

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
            <a className={`${styles.plaque} ${styles.plaqueBtn}`} href={links.google} target="_blank" rel="noopener noreferrer">
              Add to Calendar
            </a>
          )}
          {showMap && mapQuery && (
            <a
              className={`${styles.plaque} ${styles.plaqueBtn}`}
              href={`https://maps.google.com/maps?q=${mapQuery}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Map
            </a>
          )}
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
