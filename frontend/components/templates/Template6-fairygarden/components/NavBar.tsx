'use client';
import { motion } from 'framer-motion';
import styles from '../Template6.module.css';

interface NavItem {
  id: string;
  label: string;
  emoji: string;
}

interface Props {
  items: NavItem[];
  active: string;
  onNav: (id: string) => void;
}

export default function NavBar({ items, active, onNav }: Props) {
  return (
    <motion.nav
      className={styles.nav}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.2, duration: 0.6, ease: 'easeOut' }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          className={`${styles.navBtn} ${active === item.id ? styles.navBtnActive : ''}`}
          onClick={() => onNav(item.id)}
          aria-label={item.label}
        >
          <span className={styles.navEmoji}>{item.emoji}</span>
          <span className={styles.navLabel}>{item.label}</span>
        </button>
      ))}
    </motion.nav>
  );
}
