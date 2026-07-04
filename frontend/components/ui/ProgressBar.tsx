"use client";

import React from "react";

type ProgressTone = "brand" | "gold" | "success" | "neutral";

interface ProgressBarProps {
  value?: number;
  max?: number;
  tone?: ProgressTone;
  size?: "sm" | "md" | "lg";
  label?: string;
  showValue?: boolean;
  style?: React.CSSProperties;
}

export function ProgressBar({
  value = 0,
  max = 100,
  tone = "brand",
  size = "md",
  label,
  showValue = false,
  style,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const h = size === "sm" ? 5 : size === "lg" ? 12 : 8;
  const fill: Record<ProgressTone, string> = {
    brand:   "var(--brand)",
    gold:    "var(--gold-400)",
    success: "var(--success)",
    neutral: "var(--text-muted)",
  };

  return (
    <div style={{ width: "100%", ...style }}>
      {(label || showValue) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)" }}>
          {label && <span style={{ color: "var(--text-muted)", fontWeight: "var(--fw-medium)" }}>{label}</span>}
          {showValue && <span style={{ color: "var(--text-strong)", fontWeight: "var(--fw-semibold)" }}>{Math.round(pct)}%</span>}
        </div>
      )}
      <div style={{ height: h, borderRadius: "var(--radius-full)", background: "var(--surface-sunken)", overflow: "hidden", boxShadow: "var(--shadow-inset)" }}>
        <div
          style={{
            width: pct + "%",
            height: "100%",
            borderRadius: "var(--radius-full)",
            background: fill[tone] ?? fill.brand,
            transition: "width var(--dur-slow) var(--ease-out)",
          }}
        />
      </div>
    </div>
  );
}

interface ProgressRingProps {
  value?: number;
  max?: number;
  size?: number;
  stroke?: number;
  tone?: ProgressTone;
  children?: React.ReactNode;
}

export function ProgressRing({ value = 0, max = 100, size = 56, stroke = 6, tone = "brand", children }: ProgressRingProps) {
  const pct = Math.max(0, Math.min(1, value / max));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const fill: Record<ProgressTone, string> = {
    brand:   "var(--brand)",
    gold:    "var(--gold-400)",
    success: "var(--success)",
    neutral: "var(--text-muted)",
  };

  return (
    <div style={{ position: "relative", width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-sunken)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={fill[tone] ?? fill.brand} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset var(--dur-slow) var(--ease-out)" }}
        />
      </svg>
      <span style={{ position: "absolute", fontFamily: "var(--font-ui)", fontSize: size * 0.26, fontWeight: "var(--fw-bold)", color: "var(--text-strong)" }}>
        {children ?? `${Math.round(pct * 100)}%`}
      </span>
    </div>
  );
}
