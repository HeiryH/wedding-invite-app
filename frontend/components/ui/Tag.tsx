"use client";

import React from "react";
import { Icon } from "./Icon";

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: string;
  onRemove?: () => void;
  size?: "sm" | "md";
}

export function Tag({ children, color, onRemove, size = "md", style, ...rest }: TagProps) {
  const sz = size === "sm"
    ? { pad: "3px 8px", font: "var(--text-2xs)", gap: 6 }
    : { pad: "5px 10px", font: "var(--text-xs)", gap: 7 };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: sz.gap,
        padding: sz.pad,
        fontFamily: "var(--font-ui)",
        fontSize: sz.font,
        fontWeight: "var(--fw-medium)",
        color: "var(--text-body)",
        background: "var(--surface-card)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-sm)",
        boxShadow: "var(--shadow-xs)",
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {color && <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flex: "none" }} />}
      {children}
      {onRemove && (
        <button
          type="button"
          aria-label="Remove"
          onClick={onRemove}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 16,
            height: 16,
            marginRight: -2,
            padding: 0,
            border: "none",
            borderRadius: "var(--radius-full)",
            background: "transparent",
            color: "var(--text-subtle)",
            cursor: "pointer",
          }}
        >
          <Icon name="x" size={12} strokeWidth={2.4} />
        </button>
      )}
    </span>
  );
}
