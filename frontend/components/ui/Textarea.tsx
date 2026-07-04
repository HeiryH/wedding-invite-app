"use client";

import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Textarea({
  label,
  hint,
  error,
  id,
  rows = 4,
  required = false,
  disabled = false,
  style,
  onFocus,
  onBlur,
  ...rest
}: TextareaProps) {
  const reactId = React.useId();
  const inputId = id ?? reactId;
  const [focus, setFocus] = React.useState(false);
  const borderColor = error ? "var(--danger)" : focus ? "var(--brand)" : "var(--border-default)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", ...style }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-md)", fontWeight: "var(--fw-semibold)", color: "var(--text-strong)" }}
        >
          {label}
          {required && <span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        disabled={disabled}
        required={required}
        onFocus={(e) => { setFocus(true); onFocus?.(e); }}
        onBlur={(e) => { setFocus(false); onBlur?.(e); }}
        {...rest}
        style={{
          width: "100%",
          resize: "vertical",
          padding: "10px 12px",
          background: disabled ? "var(--surface-sunken)" : "var(--surface-card)",
          border: `1px solid ${borderColor}`,
          borderRadius: "var(--radius-md)",
          boxShadow: focus ? "var(--shadow-focus)" : "var(--shadow-xs)",
          fontFamily: "var(--font-ui)",
          fontSize: "var(--text-md)",
          lineHeight: "var(--leading-normal)",
          color: "var(--text-body)",
          outline: "none",
          transition: "var(--transition-control)",
        }}
      />
      {(hint || error) && (
        <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-xs)", color: error ? "var(--danger)" : "var(--text-subtle)" }}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
}
