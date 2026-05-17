const PATHS: Record<string, string> = {
  'menu': 'M3 6h18 M3 12h18 M3 18h18',
  'nav-arrow-left': 'M15 6l-6 6 6 6',
  'nav-arrow-right': 'M9 6l6 6-6 6',
  'arrow-up': 'M12 19V5 M5 12l7-7 7 7',
  'plus': 'M12 5v14 M5 12h14',
  'xmark': 'M6 6l12 12 M18 6l-12 12',
  'bell': 'M18 16v-5a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2z M10 21h4',
  'home-simple': 'M3 12l9-8 9 8v8a1 1 0 01-1 1h-4v-6h-8v6H4a1 1 0 01-1-1v-8z',
  'calendar': 'M3 8h18 M3 8a2 2 0 012-2h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8z M8 3v4 M16 3v4',
  'clock': 'M12 22a10 10 0 110-20 10 10 0 010 20z M12 7v5l3 2',
  'design-nib': 'M3 21l3-7 9-9 4 4-9 9-7 3z M14 6l4 4',
  'gift': 'M3 11h18v9a1 1 0 01-1 1H4a1 1 0 01-1-1v-9z M12 11v11 M3 7h18v4H3z M12 7s-2-4-5-4-3 4 0 4h5z M12 7s2-4 5-4 3 4 0 4h-5z',
  'user-circle': 'M12 22a10 10 0 110-20 10 10 0 010 20z M12 13a3 3 0 100-6 3 3 0 000 6z M6 19c1-3 3.5-4 6-4s5 1 6 4',
  'lock-square': 'M5 11h14v10a1 1 0 01-1 1H6a1 1 0 01-1-1V11z M8 11V8a4 4 0 018 0v3 M12 15v3',
  'settings': 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1A1.7 1.7 0 009 19.4a1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9c.2.6.8 1 1.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  'sparks': 'M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z',
  'heart': 'M12 21s-7-4.5-9.3-9.2C1.3 8.6 3 4 7 4c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 4 0 5.7 4.6 4.3 7.8C19 16.5 12 21 12 21z',
  'cast-out': 'M3 6h18v12H3z M3 11h6 M3 14h6 M14 8l4 4-4 4 M18 12h-8',
  'user-plus': 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M19 8v6 M22 11h-6',
  'check-circle': 'M12 22a10 10 0 110-20 10 10 0 010 20z M8 12l3 3 5-6',
  'xmark-circle': 'M12 22a10 10 0 110-20 10 10 0 010 20z M9 9l6 6 M15 9l-6 6',
  'search': 'M11 19a8 8 0 100-16 8 8 0 000 16z M21 21l-4-4',
  'filter': 'M3 5h18l-7 9v6l-4-2v-4L3 5z',
  'sort': 'M7 3v18 M3 7l4-4 4 4 M17 21V3 M21 17l-4 4-4-4',
  'eye': 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 15a3 3 0 100-6 3 3 0 000 6z',
  'more-horiz': 'M5 12h.01 M12 12h.01 M19 12h.01',
  'share-android': 'M18 8a3 3 0 100-6 3 3 0 000 6z M6 15a3 3 0 100-6 3 3 0 000 6z M18 22a3 3 0 100-6 3 3 0 000 6z M8.6 10.5l6.8-3.5 M8.6 13.5l6.8 3.5',
  'pause': 'M9 5v14 M15 5v14',
  'play': 'M6 4l14 8-14 8V4z',
  'copy': 'M9 9h11v11H9z M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1',
  'trash': 'M4 7h16 M10 11v6 M14 11v6 M5 7l1 13a1 1 0 001 1h10a1 1 0 001-1l1-13 M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3',
  'map-pin': 'M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z M12 12a2 2 0 100-4 2 2 0 000 4z',
  'group': 'M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M8.5 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.9 M16 3.1a4 4 0 010 7.8',
  'puzzle': 'M14 4a2 2 0 11-4 0H4v6a2 2 0 110 4v6h6a2 2 0 114 0h6v-6a2 2 0 110-4V4h-6z',
};

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Icon({ name, size = 18, className, style }: IconProps) {
  const d = PATHS[name];
  if (!d) return <span style={{ width: size, height: size, display: 'inline-block' }} />;
  const subs = d.split(/(?=M)/).map(p => p.trim()).filter(Boolean);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
    >
      {subs.map((path, i) => <path key={i} d={path} />)}
    </svg>
  );
}
