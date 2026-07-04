"use client";

import React from "react";

interface TooltipProps {
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}

export function Tooltip({ content, side = "top", children, delay = 120, style }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => { timer.current = setTimeout(() => setOpen(true), delay); };
  const hide = () => { if (timer.current) clearTimeout(timer.current); setOpen(false); };

  const pos: Record<string, React.CSSProperties> = {
    top:    { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
    bottom: { top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
    left:   { right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
    right:  { left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
  };

  return (
    <span
      style={{ position: "relative", display: "inline-flex", ...style }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {open && content && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            zIndex: 1300,
            ...pos[side],
            pointerEvents: "none",
            whiteSpace: "nowrap",
            background: "var(--surface-inverse)",
            color: "var(--text-on-inverse)",
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--fw-medium)",
            padding: "6px 9px",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
