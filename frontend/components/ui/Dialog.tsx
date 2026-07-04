"use client";

import React from "react";
import { Icon } from "./Icon";

type DialogTone = "neutral" | "brand" | "danger" | "success";

interface DialogProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  icon?: string;
  tone?: DialogTone;
  style?: React.CSSProperties;
}

export function Dialog({ open, onClose, title, description, children, footer, size = "md", icon, tone = "neutral", style }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const width = { sm: 380, md: 480, lg: 640 }[size] ?? 480;
  const accent: Record<DialogTone, string | null> = {
    neutral: null,
    brand:   "var(--brand)",
    danger:  "var(--danger)",
    success: "var(--success)",
  };
  const ac = accent[tone];

  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "var(--surface-overlay)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: "100%",
          maxWidth: width,
          background: "var(--surface-card)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-xl)",
          border: "1px solid var(--border-subtle)",
          overflow: "hidden",
          ...style,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "22px 22px 0" }}>
          {icon && ac && (
            <span
              style={{
                flex: "none",
                width: 40,
                height: 40,
                borderRadius: "var(--radius-full)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `color-mix(in srgb, ${ac} 12%, var(--surface-card))`,
                color: ac,
                boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${ac} 30%, transparent)`,
              }}
            >
              <Icon name={icon} size={20} />
            </span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && (
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "var(--fw-display)", fontSize: "var(--text-2xl)", color: "var(--text-strong)", lineHeight: 1.2, margin: 0 }}>
                {title}
              </h2>
            )}
            {description && (
              <p style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-md)", color: "var(--text-subtle)", margin: "6px 0 0", lineHeight: 1.5 }}>
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{ flex: "none", border: "none", background: "transparent", color: "var(--text-subtle)", cursor: "pointer", padding: 4, margin: "-4px -4px 0 0", display: "flex" }}
          >
            <Icon name="x" size={18} strokeWidth={2.2} />
          </button>
        </div>
        {children && (
          <div style={{ padding: "16px 22px 0", fontFamily: "var(--font-ui)", fontSize: "var(--text-md)", color: "var(--text-body)" }}>
            {children}
          </div>
        )}
        {footer ? (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: 22, marginTop: 8 }}>
            {footer}
          </div>
        ) : (
          <div style={{ height: 22 }} />
        )}
      </div>
    </div>
  );
}
