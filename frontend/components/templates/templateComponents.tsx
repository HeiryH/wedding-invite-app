'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { TemplateRenderProps } from './templateTypes';

// Keep imports literal and dynamic() calls at module scope so Next can create one loading
// boundary per template. Do not replace these with static imports or a variable import path.
export const TEMPLATE_COMPONENTS = {
  // Callers provide Suspense/loading UI so their ready callback commits with the actual template,
  // not alongside an inner loading placeholder. SSR stays enabled (Next's default).
  1: dynamic<TemplateRenderProps>(() => import('./Template1')),
  2: dynamic<TemplateRenderProps>(() => import('./Template2')),
  3: dynamic<TemplateRenderProps>(() => import('./Template3')),
  4: dynamic<TemplateRenderProps>(() => import('./Template4')),
  5: dynamic<TemplateRenderProps>(() => import('./Template5')),
  6: dynamic<TemplateRenderProps>(() => import('./Template6')),
  7: dynamic<TemplateRenderProps>(() => import('./Template7')),
  8: dynamic<TemplateRenderProps>(() => import('./Template8')),
  9: dynamic<TemplateRenderProps>(() => import('./Template9')),
  10: dynamic<TemplateRenderProps>(() => import('./Template10')),
  11: dynamic<TemplateRenderProps>(() => import('./Template11')),
  12: dynamic<TemplateRenderProps>(() => import('./Template12')),
  13: dynamic<TemplateRenderProps>(() => import('./Template13')),
  14: dynamic<TemplateRenderProps>(() => import('./Template14')),
  15: dynamic<TemplateRenderProps>(() => import('./Template15')),
} satisfies Record<number, ComponentType<TemplateRenderProps>>;

export function getTemplateComponent(templateId: number) {
  return TEMPLATE_COMPONENTS[templateId as keyof typeof TEMPLATE_COMPONENTS] ?? TEMPLATE_COMPONENTS[1];
}
