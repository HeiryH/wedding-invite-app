"use client";

import React from "react";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: string;
  description?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Checkbox({
  label,
  description,
  checked,
  defaultChecked,
  disabled = false,
  id,
  onChange,
  style,
  ...rest
}: CheckboxProps) {
  const reactId = React.useId();
  const inputId = id ?? reactId;
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const on = isControlled ? !!checked : internal;

  return (
    <label
      htmlFor={inputId}
      style={{
        display: "flex",
        gap: 10,
        alignItems: description ? "flex-start" : "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        ...style,
      } as React.CSSProperties}
    >
      <input
        id={inputId}
        type="checkbox"
        checked={on}
        disabled={disabled}
        onChange={(e) => { if (!isControlled) setInternal(e.target.checked); onChange?.(e); }}
        {...rest}
        style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
      />
      <span
        style={{
          flex: "none",
          width: 20,
          height: 20,
          marginTop: description ? 1 : 0,
          borderRadius: "var(--radius-xs)",
          border: `1.5px solid ${on ? "var(--brand)" : "var(--border-strong)"}`,
          background: on ? "var(--brand)" : "var(--surface-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "var(--transition-control)",
          boxShadow: on ? "none" : "var(--shadow-xs)",
        }}
      >
        {on && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--brand-on)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </span>
      {(label || description) && (
        <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {label && <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-md)", fontWeight: "var(--fw-medium)", color: "var(--text-strong)", lineHeight: 1.4 }}>{label}</span>}
          {description && <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)", color: "var(--text-subtle)", lineHeight: 1.4 }}>{description}</span>}
        </span>
      )}
    </label>
  );
}
