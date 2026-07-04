"use client";

import React from "react";

interface Tab {
  value: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  variant?: "underline" | "pill";
  size?: "sm" | "md";
  style?: React.CSSProperties;
}

export function Tabs({
  tabs,
  value,
  defaultValue,
  onChange,
  variant = "underline",
  size = "md",
  style,
}: TabsProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue ?? tabs[0]?.value);
  const active = isControlled ? value : internal;

  const select = (v: string) => {
    if (!isControlled) setInternal(v);
    onChange?.(v);
  };

  const pad = size === "sm" ? "6px 10px" : "9px 14px";
  const font = size === "sm" ? "var(--text-sm)" : "var(--text-md)";

  if (variant === "pill") {
    return (
      <div role="tablist" style={{ display: "inline-flex", gap: 3, padding: 3, background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", ...style }}>
        {tabs.map((t) => {
          const on = active === t.value;
          return (
            <button
              key={t.value}
              role="tab"
              aria-selected={on}
              onClick={() => select(t.value)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: pad,
                border: "none",
                cursor: "pointer",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-ui)",
                fontSize: font,
                fontWeight: "var(--fw-semibold)",
                background: on ? "var(--surface-card)" : "transparent",
                color: on ? "var(--text-strong)" : "var(--text-muted)",
                boxShadow: on ? "var(--shadow-xs)" : "none",
                transition: "var(--transition-control)",
              }}
            >
              {t.icon}
              {t.label}
              {t.count != null && <TabCount on={on}>{t.count}</TabCount>}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div role="tablist" style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border-subtle)", ...style }}>
      {tabs.map((t) => {
        const on = active === t.value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={on}
            onClick={() => select(t.value)}
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: pad,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontFamily: "var(--font-ui)",
              fontSize: font,
              fontWeight: "var(--fw-semibold)",
              color: on ? "var(--text-strong)" : "var(--text-muted)",
              transition: "color var(--dur-fast) var(--ease-standard)",
            }}
          >
            {t.icon}
            {t.label}
            {t.count != null && <TabCount on={on}>{t.count}</TabCount>}
            <span
              style={{
                position: "absolute",
                left: 6,
                right: 6,
                bottom: -1,
                height: 2,
                borderRadius: 2,
                background: on ? "var(--brand)" : "transparent",
                transition: "background-color var(--dur-fast) var(--ease-standard)",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

function TabCount({ children, on }: { children: React.ReactNode; on: boolean }) {
  return (
    <span
      style={{
        minWidth: 18,
        height: 18,
        padding: "0 5px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-full)",
        fontSize: "var(--text-2xs)",
        fontWeight: "var(--fw-bold)",
        background: on ? "var(--brand-subtle)" : "var(--surface-sunken)",
        color: on ? "var(--brand)" : "var(--text-subtle)",
      }}
    >
      {children}
    </span>
  );
}
