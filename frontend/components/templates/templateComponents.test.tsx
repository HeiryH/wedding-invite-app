import { describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ loaders: [] as (() => Promise<unknown>)[], paintedLoads: 0 }));
vi.mock('next/dynamic', () => ({ default: (loader: () => Promise<unknown>) => {
  state.loaders.push(loader);
  return () => null;
} }));
vi.mock('./Template15', () => { state.paintedLoads += 1; return { default: () => null }; });
import { getTemplateComponent, TEMPLATE_COMPONENTS } from './templateComponents';
import { templateIdForCode, TEMPLATE_IDS_BY_CODE } from './templateCatalog';

describe('shared lazy template registry', () => {
  it('declares all sixteen boundaries without running any template loader', () => {
    expect(Object.keys(TEMPLATE_COMPONENTS).map(Number)).toEqual(Array.from({ length: 16 }, (_, index) => index + 1));
    expect(state.loaders).toHaveLength(16);
    expect(state.paintedLoads).toBe(0);
  });
  it('selects the requested component and keeps the existing unknown-id fallback', () => {
    expect(getTemplateComponent(15)).toBe(TEMPLATE_COMPONENTS[15]);
    expect(getTemplateComponent(7)).toBe(TEMPLATE_COMPONENTS[7]);
    expect(getTemplateComponent(999)).toBe(TEMPLATE_COMPONENTS[1]);
    expect(getTemplateComponent(-1)).toBe(TEMPLATE_COMPONENTS[1]);
  });
  it('maps every standalone code to an existing lazy entry without accepting prototype keys', () => {
    expect(Object.values(TEMPLATE_IDS_BY_CODE)).toEqual(Object.keys(TEMPLATE_COMPONENTS).map(Number));
    expect(templateIdForCode('painted-promise')).toBe(15);
    expect(templateIdForCode('toString')).toBeUndefined();
    expect(templateIdForCode('missing')).toBeUndefined();
  });
  it('imports the selected template only when its loader is invoked', async () => {
    await expect(state.loaders[14]()).resolves.toHaveProperty('default');
    expect(state.paintedLoads).toBe(1);
  });
});
