"use client";

import React from "react";
import { Icon } from "./Icon";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  name: string;
  label: string;
  variant?: "ghost" | "soft" | "outline";
  size?: "sm" | "md" | "lg";
  tone?: "neutral" | "brand" | "danger";
  round?: boolean;
}

export function IconButton({
  name,
  label,
  variant = "ghost",
  size = "md",
  tone = "neutral",
  round = false,
  disabled = false,
  onClick,
  style,
  ...rest
}: IconButtonProps) {
  const dims = { sm: 30, md: 36, lg: 42 }[size] ?? 36;
  const iconSize = { sm: 15, md: 18, lg: 20 }[size] ?? 18;
  const [hover, setHover] = React.useState(false);

  const tones = {
    neutral: { text: "var(--text-muted)", hoverText: "var(--text-strong)", subtle: "var(--surface-sunken)", border: "var(--border-default)" },
    brand: { text: "var(--brand)", hoverText: "var(--brand-hover)", subtle: "var(--brand-subtle)", border: "var(--brand-border)" },
    danger: { text: "var(--danger)", hoverText: "#9a3232", subtle: "var(--danger-subtle)", border: "var(--danger-border)" },
  };
  const t = tones[tone] ?? tones.neutral;

  const variants = {
    ghost: { background: hover ? t.subtle : "transparent", color: hover ? t.hoverText : t.text, border: "1px solid transparent" },
    soft: { background: t.subtle, color: t.text, border: "1px solid transparent" },
    outline: { background: hover ? t.subtle : "var(--surface-card)", color: t.text, border: `1px solid ${t.border}`, boxShadow: "var(--shadow-xs)" },
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: dims,
        height: dims,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: round ? "var(--radius-full)" : "var(--radius-md)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "var(--transition-control)",
        ...variants[variant],
        ...style,
      }}
      {...rest}
    >
      <Icon name={name} size={iconSize} />
    </button>
  );
}
