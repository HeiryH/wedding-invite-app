"use client";

import React from "react";

const HUES = [
  "var(--hue-claret)", "var(--hue-terracotta)", "var(--hue-ochre)",
  "var(--hue-sage)", "var(--hue-eucalypt)", "var(--hue-dusk)",
  "var(--hue-plum)", "var(--hue-mauve)",
];

function initials(name = ""): string {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function hueFor(name = ""): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h * 31 + name.charCodeAt(i)) >>> 0);
  return HUES[h % HUES.length];
}

interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name?: string;
  src?: string;
  size?: number;
  ring?: boolean;
  square?: boolean;
}

export function Avatar({ name = "", src, size = 36, ring = false, square = false, style, ...rest }: AvatarProps) {
  const fontSize = Math.round(size * 0.4);
  const tint = hueFor(name);
  const radius = square ? "var(--radius-md)" : "50%";

  return (
    <span
      title={name || undefined}
      style={{
        width: size,
        height: size,
        flex: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius,
        background: src ? "var(--surface-sunken)" : `color-mix(in srgb, ${tint} 18%, var(--surface-card))`,
        color: tint,
        fontFamily: "var(--font-ui)",
        fontSize,
        fontWeight: "var(--fw-semibold)",
        overflow: "hidden",
        userSelect: "none",
        boxShadow: ring
          ? `0 0 0 2px var(--surface-card), 0 0 0 4px ${tint}`
          : "inset 0 0 0 1px var(--border-subtle)",
        ...style,
      }}
      {...rest}
    >
      {src
        ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials(name)}
    </span>
  );
}

interface AvatarGroupPerson {
  name: string;
  src?: string;
}

interface AvatarGroupProps {
  people?: (string | AvatarGroupPerson)[];
  max?: number;
  size?: number;
  style?: React.CSSProperties;
}

export function AvatarGroup({ people = [], max = 4, size = 32, style }: AvatarGroupProps) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", ...style }}>
      {shown.map((p, i) => {
        const person = typeof p === "string" ? { name: p } : p;
        return (
          <span key={i} style={{ marginLeft: i === 0 ? 0 : -size * 0.3, boxShadow: "0 0 0 2px var(--surface-card)", borderRadius: "50%" }}>
            <Avatar name={person.name} src={person.src} size={size} />
          </span>
        );
      })}
      {extra > 0 && (
        <span
          style={{
            marginLeft: -size * 0.3,
            width: size,
            height: size,
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--surface-sunken)",
            color: "var(--text-muted)",
            fontFamily: "var(--font-ui)",
            fontSize: Math.round(size * 0.34),
            fontWeight: "var(--fw-semibold)",
            boxShadow: "0 0 0 2px var(--surface-card)",
          }}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
