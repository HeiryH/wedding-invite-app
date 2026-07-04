"use client";

import React from "react";
import { Icon } from "./Icon";
import { Switch } from "./Switch";
import { Badge } from "./Badge";

interface FeatureToggleProps {
  icon?: string;
  title: string;
  description?: string;
  enabled?: boolean;
  defaultEnabled?: boolean;
  onChange?: (enabled: boolean) => void;
  tier?: string;
  locked?: boolean;
  lockedHint?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function FeatureToggle({
  icon = "sparkles",
  title,
  description,
  enabled,
  defaultEnabled,
  onChange,
  tier,
  locked = false,
  lockedHint = "Upgrade to enable",
  disabled = false,
  style,
}: FeatureToggleProps) {
  const isControlled = enabled !== undefined;
  const [internal, setInternal] = React.useState(!!defaultEnabled);
  const on = isControlled ? !!enabled : internal;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternal(e.target.checked);
    onChange?.(e.target.checked);
  };

  const active = on && !locked;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        opacity: disabled ? 0.6 : 1,
        transition: "border-color var(--dur-base) var(--ease-standard)",
        ...style,
      }}
    >
      <span
        style={{
          flex: "none",
          width: 40,
          height: 40,
          borderRadius: "var(--radius-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: active ? "var(--brand-subtle)" : "var(--surface-sunken)",
          color: active ? "var(--brand)" : "var(--text-subtle)",
          transition: "var(--transition-control)",
        }}
      >
        <Icon name={locked ? "lock" : icon} size={20} />
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-md)", fontWeight: "var(--fw-semibold)", color: "var(--text-strong)" }}>
            {title}
          </span>
          {tier && <Badge tone="gold" size="sm" variant="soft">{tier}</Badge>}
        </div>
        {description && (
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)", color: "var(--text-subtle)", marginTop: 2, lineHeight: 1.4 }}>
            {description}
          </div>
        )}
      </div>

      {locked ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--fw-semibold)",
            color: "var(--gold-700)",
            background: "var(--accent-subtle)",
            padding: "6px 10px",
            borderRadius: "var(--radius-full)",
            whiteSpace: "nowrap",
          }}
        >
          <Icon name="lock" size={13} /> {lockedHint}
        </span>
      ) : (
        <Switch checked={on} onChange={handleChange} disabled={disabled} />
      )}
    </div>
  );
}
