'use client';
import { SeatingTable } from '@/lib/api';
import { T7_ASSETS } from '../data/stages';
import styles from '../Template7.module.css';

interface Props {
  tables: SeatingTable[];
  numberOfAttendees: number;
  selectedTableId: number | null;
  onSelect: (id: number) => void;
  prompt: string;
}

/**
 * Engraved counterpart to components/templates/SeatingStep.tsx — same capacity
 * rules, drawn with the template's own table-icon art instead of Tailwind cards.
 */
export default function SeatingChart({
  tables,
  numberOfAttendees,
  selectedTableId,
  onSelect,
  prompt,
}: Props) {
  const availableSeats = (t: SeatingTable) => t.capacity - t.guestCount;
  const canFit = (t: SeatingTable) => availableSeats(t) >= numberOfAttendees;

  if (tables.length === 0) {
    return (
      <div className={styles.seating}>
        <p className={styles.empty}>
          No tables have been set up yet — your seat will be assigned by the couple.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.seating}>
      <h3 className={styles.sectionTitle}>{prompt}</h3>
      <p className={styles.sectionLead}>
        Showing tables that can seat your party of {numberOfAttendees}.
      </p>

      <div className={styles.tableGrid}>
        {tables.map((table) => {
          const fits = canFit(table);
          const selected = selectedTableId === table.tableId;
          return (
            <button
              key={table.tableId}
              type="button"
              disabled={!fits}
              onClick={() => onSelect(table.tableId)}
              className={`${styles.tableCard} ${selected ? styles.tableSelected : ''}`}
              aria-pressed={selected}
            >
              <span className={styles.tableIconWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${T7_ASSETS}/rsvp/table-icon.webp`}
                  alt=""
                  className={styles.tableIcon}
                  loading="lazy"
                  decoding="async"
                />
                <span className={styles.tableNum}>{table.sortOrder || table.tableId}</span>
              </span>
              <span className={styles.tableName}>{table.tableName}</span>
              <span className={styles.tableSeats}>
                {fits ? `${availableSeats(table)} seats left` : 'Full'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
