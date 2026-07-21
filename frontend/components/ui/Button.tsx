"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "soft" | "link";
  size?: "sm" | "md" | "lg";
  tone?: "brand" | "neutral" | "danger";
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  tone = "brand",
  iconLeft = null,
  iconRight = null,
  fullWidth = false,
  loading = false,
  disabled = false,
  type = "button",
  onClick,
  style,
  ...rest
}: ButtonProps) {
  const sizes = {
    sm: { height: "var(--control-sm)", padding: "0 12px", font: "var(--text-sm)", gap: "6px", radius: "var(--radius-sm)" },
    md: { height: "var(--control-md)", padding: "0 16px", font: "var(--text-md)", gap: "8px", radius: "var(--radius-md)" },
    lg: { height: "var(--control-lg)", padding: "0 22px", font: "var(--text-base)", gap: "9px", radius: "var(--radius-md)" },
  };
  const s = sizes[size] ?? sizes.md;

  const tones = {
    brand: { solid: "var(--brand)", solidHover: "var(--brand-hover)", on: "var(--brand-on)", subtle: "var(--brand-subtle)", text: "var(--brand)", border: "var(--brand-border)" },
    neutral: { solid: "var(--text-strong)", solidHover: "var(--sand-900)", on: "var(--sand-0)", subtle: "var(--surface-sunken)", text: "var(--text-strong)", border: "var(--border-default)" },
    danger: { solid: "var(--danger)", solidHover: "#9a3232", on: "#fff", subtle: "var(--danger-subtle)", text: "var(--danger)", border: "var(--danger-border)" },
  };
  const t = tones[tone] ?? tones.brand;

  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: s.gap,
    height: variant === "link" ? "auto" : s.height,
    padding: variant === "link" ? 0 : s.padding,
    width: fullWidth ? "100%" : undefined,
    fontFamily: "var(--font-ui)",
    fontSize: s.font,
    fontWeight: "var(--fw-semibold)",
    lineHeight: 1,
    letterSpacing: "0.005em",
    borderRadius: variant === "link" ? 0 : s.radius,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    whiteSpace: "nowrap",
    transition: "var(--transition-control), transform var(--dur-instant) var(--ease-standard)",
    userSelect: "none",
    textDecoration: "none",
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: t.solid, color: t.on, boxShadow: "var(--shadow-xs)" },
    secondary: { background: "var(--surface-card)", color: t.text, borderColor: t.border, boxShadow: "var(--shadow-xs)" },
    ghost: { background: "transparent", color: t.text },
    soft: { background: t.subtle, color: t.text },
    link: { background: "transparent", color: t.text },
  };

  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);

  const hoverStyles: Record<string, React.CSSProperties> = {
    primary: { background: t.solidHover, boxShadow: "var(--shadow-sm)" },
    secondary: { background: "var(--surface-sunken)" },
    ghost: { background: t.subtle },
    soft: {},
    link: { textDecoration: "underline", textUnderlineOffset: "2px" },
  };
  const hoverStyle = !disabled && !loading && hover ? hoverStyles[variant] ?? {} : {};

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        ...base,
        ...variants[variant],
        ...hoverStyle,
        transform: active && variant !== "link" ? "translateY(0.5px) scale(0.985)" : "none",
        ...style,
      }}
      {...rest}
    >
      {loading && <Spinner />}
      {!loading && iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
}

function Spinner() {
  return (
    <>
      <style>{`@keyframes ui-spin{to{transform:rotate(360deg)}}`}</style>
      <span
        aria-hidden="true"
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          borderWidth: "2px",
          borderStyle: "solid",
          borderColor: "transparent currentColor currentColor currentColor",
          display: "inline-block",
          animation: "ui-spin 0.6s linear infinite",
        }}
      />
    </>
  );
}
