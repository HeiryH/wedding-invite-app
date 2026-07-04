"use client";

import React from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  options?: (string | SelectOption)[];
  size?: "sm" | "md" | "lg";
  placeholder?: string;
}

export function Select({
  label,
  hint,
  error,
  options = [],
  size = "md",
  id,
  placeholder,
  disabled = false,
  style,
  onFocus,
  onBlur,
  ...rest
}: SelectProps) {
  const reactId = React.useId();
  const inputId = id ?? reactId;
  const [focus, setFocus] = React.useState(false);

  const heights = { sm: "var(--control-sm)", md: "var(--control-md)", lg: "var(--control-lg)" };
  const borderColor = error ? "var(--danger)" : focus ? "var(--brand)" : "var(--border-default)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", ...style }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-md)", fontWeight: "var(--fw-semibold)", color: "var(--text-strong)" }}
        >
          {label}
        </label>
      )}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <select
          id={inputId}
          disabled={disabled}
          onFocus={(e) => { setFocus(true); onFocus?.(e); }}
          onBlur={(e) => { setFocus(false); onBlur?.(e); }}
          {...rest}
          style={{
            appearance: "none",
            WebkitAppearance: "none",
            width: "100%",
            height: heights[size] ?? heights.md,
            padding: "0 36px 0 12px",
            background: disabled ? "var(--surface-sunken)" : "var(--surface-card)",
            border: `1px solid ${borderColor}`,
            borderRadius: "var(--radius-md)",
            boxShadow: focus ? "var(--shadow-focus)" : "var(--shadow-xs)",
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-md)",
            color: "var(--text-body)",
            outline: "none",
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "var(--transition-control)",
          }}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((o) => {
            const opt = typeof o === "string" ? { value: o, label: o } : o;
            return <option key={opt.value} value={opt.value}>{opt.label}</option>;
          })}
        </select>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="var(--text-subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: "absolute", right: 12, pointerEvents: "none" }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      {(hint || error) && (
        <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-xs)", color: error ? "var(--danger)" : "var(--text-subtle)" }}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
}
