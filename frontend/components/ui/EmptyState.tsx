"use client";

import React from "react";
import { Icon } from "./Icon";

interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  style?: React.CSSProperties;
}

export function EmptyState({ icon = "mail", title, description, action, compact = false, style }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: compact ? "28px 20px" : "48px 28px",
        gap: 4,
        ...style,
      }}
    >
      <span
        style={{
          width: compact ? 44 : 56,
          height: compact ? 44 : 56,
          borderRadius: "var(--radius-full)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
          background: "var(--brand-subtle)",
          color: "var(--brand)",
          boxShadow: "inset 0 0 0 1px var(--brand-border)",
        }}
      >
        <Icon name={icon} size={compact ? 20 : 24} />
      </span>
      {title && (
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: "var(--fw-display)",
            fontSize: compact ? "var(--text-xl)" : "var(--text-2xl)",
            color: "var(--text-strong)",
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
      )}
      {description && (
        <div
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-md)",
            color: "var(--text-subtle)",
            maxWidth: 340,
            lineHeight: 1.5,
            marginTop: 2,
          }}
        >
          {description}
        </div>
      )}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
