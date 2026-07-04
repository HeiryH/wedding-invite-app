"use client";

import React from "react";

const PATHS: Record<string, string> = {
  // nav / chrome
  menu: "M4 6h16M4 12h16M4 18h16",
  x: "M18 6 6 18M6 6l12 12",
  search: "M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0 M21 21l-4.3-4.3",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  check: "M20 6 9 17l-5-5",
  "chevron-down": "M6 9l6 6 6-6",
  "chevron-right": "M9 6l6 6-6 6",
  "chevron-left": "M15 6l-6 6 6 6",
  "chevron-up": "M6 15l6-6 6 6",
  "arrow-right": "M5 12h14M13 6l6 6-6 6",
  "arrow-left": "M19 12H5M11 6l-6 6 6 6",
  "more-horizontal": "M5 12h.01M12 12h.01M19 12h.01",
  "external-link": "M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  // objects
  calendar: "M8 2v4M16 2v4M3 10h18 M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  clock: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0 M12 7v5l3 2",
  "map-pin": "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
  mail: "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z M2.5 6.5 12 13l9.5-6.5",
  send: "M22 2 11 13 M22 2l-7 20-4-9-9-4 20-7z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13A4 4 0 0 1 16 11",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0",
  heart: "M19.5 5.5a5 5 0 0 0-7.5.5 5 5 0 0 0-7.5-.5C2 7.5 2.5 11 6 14l6 6 6-6c3.5-3 4-6.5 1.5-8.5z",
  star: "M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.2l5.9-.9L12 3z",
  image: "M3 4h18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M8.5 10.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0 M21 16l-5-5L5 21",
  camera: "M9 4h6l1.5 2.5H21a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5a1 1 0 0 1 1-1h4.5L9 4z M12 16m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0",
  gift: "M20 12v9H4v-9 M2 7h20v5H2z M12 22V7 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z",
  sparkles: "M12 3l1.8 4.6L18.5 9.4 13.8 11.2 12 16l-1.8-4.8L5.5 9.4l4.7-1.8L12 3z M19 14l.7 1.8 1.8.7-1.8.7L19 19l-.7-1.8-1.8-.7 1.8-.7L19 14z",
  "message-circle": "M21 11.5a8.4 8.4 0 0 1-9 8.4 9.2 9.2 0 0 1-3.6-.7L3 21l1.4-4.5A8.4 8.4 0 1 1 21 11.5z",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0",
  // editor / tools
  "layout-grid": "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z",
  palette: "M12 3a9 9 0 0 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-1 .8-1.5 1.7-1.5H16a5 5 0 0 0 5-5c0-3.9-4-7-9-7z M7.5 11.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0 M11 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0 M16 9.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0",
  type: "M4 7V5h16v2 M9 19h6 M12 5v14",
  "pen-tool": "M12 19l7-7-9-9-7 7 9 9z M12 19l2 2 6-6-2-2 M2 2l6.5 6.5",
  pencil: "M17 3l4 4L8 20l-5 1 1-5L17 3z",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
  trash: "M3 6h18 M8 6V4h8v2 M6 6l1 14h10l1-14 M10 11v5M14 11v5",
  copy: "M9 9h11a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1z M5 15H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1",
  share: "M4 12v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8 M16 6l-4-4-4 4 M12 2v13",
  download: "M12 3v12 M7 11l5 5 5-5 M5 21h14",
  upload: "M12 21V9 M7 13l5-5 5 5 M5 3h14",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5 M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 13.5a1.5 1.5 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.5 1.5 0 0 0-2.5.6 1.5 1.5 0 0 0-1 1.4V20a2 2 0 1 1-4 0v-.1a1.5 1.5 0 0 0-2.5-1 1.5 1.5 0 0 0-1.7.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.5 1.5 0 0 0-.6-2.5 1.5 1.5 0 0 0-1.4-1H4a2 2 0 1 1 0-4h.1a1.5 1.5 0 0 0 1-2.5 1.5 1.5 0 0 0-.3-1.7l-.1-.1A2 2 0 1 1 7.5 4.2l.1.1a1.5 1.5 0 0 0 2.5-.6V3.5a2 2 0 1 1 4 0v.1a1.5 1.5 0 0 0 2.5 1 1.5 1.5 0 0 0 1.7-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.5 1.5 0 0 0 .6 2.5h.1a2 2 0 1 1 0 4h-.1a1.5 1.5 0 0 0-1.4 1z",
  sliders: "M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6",
  filter: "M22 3H2l8 9.5V19l4 2v-8.5L22 3z",
  "check-circle": "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0 M8.5 12l2.5 2.5 4.5-5",
  "alert-triangle": "M12 3 2 20h20L12 3z M12 9v5 M12 17.5v.5",
  info: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0 M12 11v5 M12 7.5v.5",
  lock: "M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z M7 11V7a5 5 0 0 1 10 0v4",
  "credit-card": "M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z M2 10h20 M6 15h4",
  "qr-code": "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h2v2h-2z M18 14h2v2h-2z M14 18h2v2h-2z M18 18h2v2h-2z",
  smile: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0 M8.5 14a4 4 0 0 0 7 0 M9 9.5h.01M15 9.5h.01",
  home: "M3 11l9-8 9 8 M5 9.5V21h14V9.5",
  "log-out": "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  table: "M3 5h18v14H3z M3 10h18 M3 15h18 M9 5v14 M15 5v14",
  grid: "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z",
  "circle-dashed": "M12 3a9 9 0 0 1 4 .9 M19 7a9 9 0 0 1 1.8 4 M20.9 15a9 9 0 0 1-3 3.7 M14 20.6a9 9 0 0 1-4.4.1 M6 19a9 9 0 0 1-2.8-3.4 M3.1 11a9 9 0 0 1 1.6-4.3 M8 3.6A9 9 0 0 1 12 3",
  ticket: "M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 6 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-6z M13 7v10",
  music: "M9 18V5l12-2v13 M9 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0 M21 16m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
  // editor layout
  "panel-left-close": "M3 4h18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M9 4v16 M15 10l-3 2 3 2",
  "panel-left-open": "M3 4h18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M9 4v16 M12 10l3 2-3 2",
  smartphone: "M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z M12 18h.01",
  tablet: "M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z M12 18h.01",
  monitor: "M2 3h20a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M8 21h8 M12 17v4",
  "rotate-ccw": "M3 7v6h6 M3.51 15a9 9 0 1 0 .49-3.42",
  undo: "M3 7v6h6 M3 13A9 9 0 1 1 5.5 5.5L3 7",
  redo: "M21 7v6h-6 M21 13A9 9 0 1 0 18.5 5.5L21 7",
  save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8",
};

export type IconName = keyof typeof PATHS;

interface IconProps extends React.SVGAttributes<SVGElement> {
  name: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function Icon({ name, size = 18, strokeWidth = 1.9, color, style, ...rest }: IconProps) {
  const d = PATHS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={rest["aria-label"] ? undefined : "true"}
      role={rest["aria-label"] ? "img" : undefined}
      style={{ display: "block", flex: "none", ...style }}
      {...rest}
    >
      {d
        ? d.split(" M").map((seg, i) => <path key={i} d={(i ? "M" : "") + seg} />)
        : null}
    </svg>
  );
}

export const iconNames = Object.keys(PATHS);
