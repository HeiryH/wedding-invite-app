"use client";

import React from "react";

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size" | "onChange"> {
  label?: string;
  description?: string;
  size?: "sm" | "md";
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Switch({
  checked,
  defaultChecked,
  disabled = false,
  size = "md",
  label,
  description,
  id,
  onChange,
  style,
  ...rest
}: SwitchProps) {
  const reactId = React.useId();
  const inputId = id ?? reactId;
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const on = isControlled ? !!checked : internal;

  const dims = size === "sm"
    ? { w: 32, h: 18, k: 13 }
    : { w: 40, h: 23, k: 18 };

  const knobOffset = (dims.h - dims.k) / 2;

  return (
    <label
      htmlFor={inputId}
      style={{
        display: "inline-flex",
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
        role="switch"
        checked={on}
        disabled={disabled}
        onChange={(e) => { if (!isControlled) setInternal(e.target.checked); onChange?.(e); }}
        {...rest}
        style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
      />
      <span
        style={{
          position: "relative",
          flex: "none",
          width: dims.w,
          height: dims.h,
          borderRadius: "var(--radius-full)",
          background: on ? "var(--brand)" : "var(--border-strong)",
          transition: "background-color var(--dur-base) var(--ease-standard)",
          boxShadow: on ? "var(--shadow-foil)" : "var(--shadow-inset)",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: knobOffset,
            left: on ? dims.w - dims.k - knobOffset : knobOffset,
            width: dims.k,
            height: dims.k,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "var(--shadow-sm)",
            transition: "left var(--dur-base) var(--ease-out)",
          }}
        />
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
