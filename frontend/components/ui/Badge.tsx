"use client";

import React from "react";

type BadgeTone = "neutral" | "brand" | "gold" | "success" | "warning" | "danger" | "info";
type BadgeVariant = "soft" | "outline" | "solid";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  dot?: boolean;
  size?: "sm" | "md";
}

export function Badge({
  children,
  tone = "neutral",
  variant = "soft",
  dot = false,
  size = "md",
  style,
  ...rest
}: BadgeProps) {
  const tones: Record<BadgeTone, { fg: string; bg: string; bd: string; solid: string }> = {
    neutral: { fg: "var(--text-muted)", bg: "var(--surface-sunken)", bd: "var(--border-default)", solid: "var(--sand-600)" },
    brand:   { fg: "var(--brand)", bg: "var(--brand-subtle)", bd: "var(--brand-border)", solid: "var(--brand)" },
    gold:    { fg: "var(--gold-700)", bg: "var(--accent-subtle)", bd: "var(--gold-200)", solid: "var(--gold-400)" },
    success: { fg: "var(--success)", bg: "var(--success-subtle)", bd: "var(--success-border)", solid: "var(--success)" },
    warning: { fg: "var(--warning)", bg: "var(--warning-subtle)", bd: "var(--warning-border)", solid: "var(--warning)" },
    danger:  { fg: "var(--danger)", bg: "var(--danger-subtle)", bd: "var(--danger-border)", solid: "var(--danger)" },
    info:    { fg: "var(--info)", bg: "var(--info-subtle)", bd: "var(--info-border)", solid: "var(--info)" },
  };
  const t = tones[tone] ?? tones.neutral;
  const sz = size === "sm"
    ? { pad: "2px 7px", font: "var(--text-2xs)", gap: 5 }
    : { pad: "3px 9px", font: "var(--text-xs)", gap: 6 };

  const variants: Record<BadgeVariant, React.CSSProperties> = {
    soft:    { background: t.bg, color: t.fg, border: "1px solid transparent" },
    outline: { background: "transparent", color: t.fg, border: `1px solid ${t.bd}` },
    solid:   { background: t.solid, color: "#fff", border: "1px solid transparent" },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: sz.gap,
        padding: sz.pad,
        fontFamily: "var(--font-ui)",
        fontSize: sz.font,
        fontWeight: "var(--fw-semibold)",
        lineHeight: 1.3,
        letterSpacing: "0.01em",
        borderRadius: "var(--radius-full)",
        whiteSpace: "nowrap",
        ...variants[variant],
        ...style,
      }}
      {...rest}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: variant === "solid" ? "#fff" : t.solid,
            flex: "none",
          }}
        />
      )}
      {children}
    </span>
  );
}
