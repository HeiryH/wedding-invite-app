"use client";

import React from "react";
import { Icon } from "./Icon";

type ToastTone = "info" | "success" | "warning" | "danger" | "brand";

interface ToastProps {
  tone?: ToastTone;
  title?: string;
  children?: React.ReactNode;
  icon?: string;
  onClose?: () => void;
  action?: React.ReactNode;
  floating?: boolean;
  style?: React.CSSProperties;
}

const TONE_MAP: Record<ToastTone, { icon: string; fg: string; bg: string; bd: string }> = {
  info:    { icon: "info",           fg: "var(--info)",    bg: "var(--info-subtle)",    bd: "var(--info-border)" },
  success: { icon: "check-circle",   fg: "var(--success)", bg: "var(--success-subtle)", bd: "var(--success-border)" },
  warning: { icon: "alert-triangle", fg: "var(--warning)", bg: "var(--warning-subtle)", bd: "var(--warning-border)" },
  danger:  { icon: "alert-triangle", fg: "var(--danger)",  bg: "var(--danger-subtle)",  bd: "var(--danger-border)" },
  brand:   { icon: "sparkles",       fg: "var(--brand)",   bg: "var(--brand-subtle)",   bd: "var(--brand-border)" },
};

export function Toast({ tone = "info", title, children, icon, onClose, action, floating = false, style }: ToastProps) {
  const t = TONE_MAP[tone] ?? TONE_MAP.info;

  return (
    <div
      role="status"
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "12px 14px",
        background: floating ? "var(--surface-card)" : t.bg,
        border: `1px solid ${floating ? "var(--border-subtle)" : t.bd}`,
        borderRadius: "var(--radius-md)",
        boxShadow: floating ? "var(--shadow-lg)" : "none",
        minWidth: floating ? 300 : undefined,
        maxWidth: floating ? 420 : undefined,
        ...style,
      }}
    >
      <span style={{ color: t.fg, display: "flex", flex: "none", marginTop: 1 }}>
        <Icon name={icon ?? t.icon} size={18} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-md)", fontWeight: "var(--fw-semibold)", color: "var(--text-strong)" }}>
            {title}
          </div>
        )}
        {children && (
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)", color: "var(--text-muted)", marginTop: title ? 2 : 0, lineHeight: 1.45 }}>
            {children}
          </div>
        )}
        {action && <div style={{ marginTop: 8 }}>{action}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onClose}
          style={{ flex: "none", border: "none", background: "transparent", color: "var(--text-subtle)", cursor: "pointer", padding: 2, marginTop: -1, marginRight: -2, display: "flex" }}
        >
          <Icon name="x" size={15} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
}
