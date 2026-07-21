'use client';
import styles from '../Template7.module.css';

interface Props {
  items: { id: string; label: string }[];
  active: string;
  onNav: (id: string) => void;
}

export default function NavBar({ items, active, onNav }: Props) {
  return (
    <nav className={styles.nav} aria-label="Sections">
      {items.map((item) => (
        <button
          key={item.id}
          className={`${styles.navBtn} ${active === item.id ? styles.navActive : ''}`}
          onClick={() => onNav(item.id)}
          aria-current={active === item.id ? 'true' : undefined}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
