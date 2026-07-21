'use client';

import { useMemo } from 'react';
import { TemplateConfigField, TemplateConfigBlock } from '@/lib/api';
import { blockOf } from '@/lib/templateConfigSchema';

/** Preset colour swatches, keyed by TemplateConfigField.presets. */
export const PRESETS: Record<string, string[]> = {
  bride:   ['#9a244f', '#b0506b', '#6f5bb5', '#1a1718', '#b8945a', '#ffffff'],
  groom:   ['#1a1718', '#6f5bb5', '#0a3a5c', '#2d6a4f', '#4a90d9', '#b8945a'],
  amp:     ['#1a1718', '#b8945a', '#6f5bb5', '#ffffff', '#9a244f', '#cccccc'],
  heading: ['#ffffff', '#f4d9e2', '#e8e2f4', '#b8945a', '#1a1718', '#9a244f'],
  date:    ['#ffffff', '#d6c4a3', '#b8945a', '#9a244f', '#6f5bb5', '#1a1718'],
  venue:   ['#ffffff', '#d6c4a3', '#b8945a', '#6f5bb5', '#9a244f', '#1a1718'],
  body:    ['#ffffff', '#f0ebe0', '#d6c4a3', '#b8945a', '#1a1718', '#6b6469'],
  generic: ['#ffffff', '#1a1718', '#b8945a', '#6f5bb5', '#9a244f', '#6b6469'],
};

/** A shadow/effect select rendered as a segmented control rather than a dropdown. */
const SHADOW_OPTIONS = ['none', 'soft', 'strong', 'glow'];
export const isShadowField = (f: TemplateConfigField) =>
  f.fieldType === 'select' &&
  !!f.options &&
  f.options.length === SHADOW_OPTIONS.length &&
  f.options.every((o, i) => o === SHADOW_OPTIONS[i]);

/**
 * Indexes a template's schema so the inspector can ask "does this template use key X?"
 * instead of branching on templateId, and can find the fields that attach to a given anchor.
 */
export function useSchemaIndex(fields: TemplateConfigField[]) {
  return useMemo(() => {
    const byKey = new Map(fields.map((f) => [f.key, f]));

    const attachments = new Map<string, TemplateConfigField[]>();
    for (const f of fields) {
      if (!f.attachTo) continue;
      const list = attachments.get(f.attachTo) ?? [];
      list.push(f);
      attachments.set(f.attachTo, list);
    }

    /** Free-standing fields (not attached to an anchor) for one rail block, grouped by Group title. */
    const groupsFor = (block: TemplateConfigBlock) => {
      const groups = new Map<string, TemplateConfigField[]>();
      for (const f of fields) {
        if (f.attachTo || blockOf(f) !== block) continue;
        const title = f.group ?? 'Settings';
        const list = groups.get(title) ?? [];
        list.push(f);
        groups.set(title, list);
      }
      return groups;
    };

    return {
      has: (key: string) => byKey.has(key),
      get: (key: string) => byKey.get(key),
      attachmentsFor: (anchor: string) => attachments.get(anchor) ?? [],
      groupsFor,
    };
  }, [fields]);
}

/** The chip a group anchors to — the first chip any of its fields declares. */
export const chipOf = (fields: TemplateConfigField[]) =>
  fields.find((f) => f.chip)?.chip;
