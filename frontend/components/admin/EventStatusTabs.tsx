import styles from './EventsDashboard.module.css';

const statuses = [
  ['all', 'All events'],
  ['upcoming', 'Upcoming'],
  ['active', 'Live'],
  ['inactive', 'Drafts'],
] as const;

export type EventStatusFilter = (typeof statuses)[number][0];

export function EventStatusTabs({ value, onChange, counts }: {
  value: EventStatusFilter;
  onChange: (value: EventStatusFilter) => void;
  counts: Record<EventStatusFilter, number>;
}) {
  return (
    <div className={styles.statusTabs} role="group" aria-label="Event status">
      {statuses.map(([status, label]) => (
        <button
          key={status}
          type="button"
          aria-pressed={value === status}
          aria-label={`${label} (${counts[status]})`}
          onClick={() => onChange(status)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
