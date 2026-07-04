"use client";

import React from "react";

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: string;
  description?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Radio({
  label,
  description,
  checked,
  disabled = false,
  id,
  name,
  value,
  onChange,
  style,
  ...rest
}: RadioProps) {
  const reactId = React.useId();
  const inputId = id ?? reactId;

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
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        {...rest}
        style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
      />
      <span
        style={{
          flex: "none",
          width: 20,
          height: 20,
          borderRadius: "50%",
          marginTop: description ? 1 : 0,
          border: `1.5px solid ${checked ? "var(--brand)" : "var(--border-strong)"}`,
          background: "var(--surface-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "var(--transition-control)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        {checked && <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--brand)" }} />}
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

interface RadioGroupProps {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  options?: RadioOption[];
  gap?: number;
  style?: React.CSSProperties;
}

export function RadioGroup({ name, value, onChange, options = [], gap = 12, style }: RadioGroupProps) {
  const groupName = React.useId();
  return (
    <div role="radiogroup" style={{ display: "flex", flexDirection: "column", gap, ...style }}>
      {options.map((o) => (
        <Radio
          key={o.value}
          name={name ?? groupName}
          value={o.value}
          label={o.label}
          description={o.description}
          checked={value === o.value}
          onChange={() => onChange?.(o.value)}
        />
      ))}
    </div>
  );
}
