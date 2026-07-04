"use client";

import React from "react";

interface CardProps {
  children?: React.ReactNode;
  padding?: string | number;
  interactive?: boolean;
  as?: React.ElementType;
  style?: React.CSSProperties;
  onClick?: () => void;
  className?: string;
}

export function Card({
  children,
  padding = "20px",
  interactive = false,
  as: El = "div",
  style,
  ...rest
}: CardProps) {
  const [hover, setHover] = React.useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag = El as any;
  return (
    <Tag
      onMouseEnter={interactive ? () => setHover(true) : undefined}
      onMouseLeave={interactive ? () => setHover(false) : undefined}
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        boxShadow: interactive && hover ? "var(--card-shadow-hover)" : "var(--card-shadow)",
        padding,
        transition: "box-shadow var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out)",
        transform: interactive && hover ? "translateY(-2px)" : "none",
        cursor: interactive ? "pointer" : "default",
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

type StatTone = "neutral" | "brand" | "gold" | "success";

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  trend?: { dir: "up" | "down" | "flat"; label: string };
  tone?: StatTone;
  style?: React.CSSProperties;
}

export function StatCard({ label, value, sublabel, icon, trend, tone = "neutral", style }: StatCardProps) {
  const trendColor =
    trend?.dir === "up" ? "var(--success)"
    : trend?.dir === "down" ? "var(--danger)"
    : "var(--text-subtle)";

  const accent: Record<StatTone, string> = {
    neutral: "var(--text-subtle)",
    brand:   "var(--brand)",
    gold:    "var(--gold-500)",
    success: "var(--success)",
  };

  return (
    <Card padding="18px" style={style}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 8 }}>
        <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)", fontWeight: "var(--fw-semibold)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          {label}
        </span>
        {icon && <span style={{ color: accent[tone] ?? accent.neutral, display: "flex", flex: "none" }}>{icon}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, whiteSpace: "nowrap" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: "var(--fw-display)", fontSize: "var(--display-sm)", lineHeight: 1, color: "var(--text-strong)" }}>
          {value}
        </span>
        {sublabel && (
          <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)", color: "var(--text-subtle)" }}>
            {sublabel}
          </span>
        )}
      </div>
      {trend && (
        <div style={{ marginTop: 8, fontFamily: "var(--font-ui)", fontSize: "var(--text-xs)", fontWeight: "var(--fw-semibold)", color: trendColor }}>
          {trend.dir === "up" ? "▲" : trend.dir === "down" ? "▼" : "—"} {trend.label}
        </div>
      )}
    </Card>
  );
}
