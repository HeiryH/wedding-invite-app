"use client";

import React from "react";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export function Input({
  label,
  hint,
  error,
  size = "md",
  leading = null,
  trailing = null,
  id,
  required = false,
  disabled = false,
  style,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const reactId = React.useId();
  const inputId = id ?? reactId;
  const [focus, setFocus] = React.useState(false);

  const heights = { sm: "var(--control-sm)", md: "var(--control-md)", lg: "var(--control-lg)" };
  const fonts = { sm: "var(--text-sm)", md: "var(--text-md)", lg: "var(--text-base)" };
  const borderColor = error ? "var(--danger)" : focus ? "var(--brand)" : "var(--border-default)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", ...style }}>
      {label && (
        <label htmlFor={inputId} style={labelStyle}>
          {label}
          {required && <span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>}
        </label>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: heights[size] ?? heights.md,
          padding: "0 12px",
          background: disabled ? "var(--surface-sunken)" : "var(--surface-card)",
          border: `1px solid ${borderColor}`,
          borderRadius: "var(--radius-md)",
          boxShadow: focus ? "var(--shadow-focus)" : "var(--shadow-xs)",
          transition: "var(--transition-control)",
          cursor: disabled ? "not-allowed" : "text",
        }}
      >
        {leading && <span style={{ color: "var(--text-subtle)", display: "flex", flex: "none" }}>{leading}</span>}
        <input
          id={inputId}
          disabled={disabled}
          required={required}
          onFocus={(e) => { setFocus(true); onFocus?.(e); }}
          onBlur={(e) => { setFocus(false); onBlur?.(e); }}
          {...rest}
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-ui)",
            fontSize: fonts[size] ?? fonts.md,
            color: "var(--text-body)",
            cursor: disabled ? "not-allowed" : "text",
          }}
        />
        {trailing && <span style={{ color: "var(--text-subtle)", display: "flex", flex: "none" }}>{trailing}</span>}
      </div>
      {(hint || error) && (
        <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-xs)", color: error ? "var(--danger)" : "var(--text-subtle)" }}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
}

export const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-md)",
  fontWeight: "var(--fw-semibold)",
  color: "var(--text-strong)",
};
