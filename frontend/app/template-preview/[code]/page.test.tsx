import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TemplateRenderProps } from '@/components/templates/templateTypes';
import { templateIdForCode } from '@/components/templates/templateCatalog';

const state = vi.hoisted(() => ({ code: 'painted-promise', props: vi.fn(), lookup: vi.fn(), defaults: vi.fn(), assets: vi.fn(), gate: undefined as Promise<void> | undefined }));
vi.mock('next/navigation', () => ({ useParams: () => ({ code: state.code }) }));
vi.mock('@/lib/api', () => ({ templateService: { getByCode: state.lookup }, templateConfigService: { getTemplateDefault: state.defaults } }));
vi.mock('@/components/templates/previewReadiness', () => ({ waitForPreviewAssets: state.assets }));
vi.mock('@/components/templates/templateComponents', () => {
  const probe = (id: number) => function TemplateProbe(props: TemplateRenderProps) {
    if (state.gate) throw state.gate;
    state.props(id, props); return <p>Rendered template {id}</p>;
  };
  return { TEMPLATE_COMPONENTS: Object.fromEntries(Array.from({ length: 15 }, (_, i) => [i + 1, probe(i + 1)])) };
});
import TemplatePreviewPage from './page';

const flush = async () => { await act(async () => {}); };
const tick = async () => { await act(async () => { await vi.advanceTimersByTimeAsync(1000); }); };

describe('lazy standalone previews', () => {
  beforeEach(() => {
    vi.useFakeTimers(); vi.clearAllMocks(); state.code = 'painted-promise'; state.gate = undefined;
    state.lookup.mockImplementation(async (code: string) => ({ templateId: templateIdForCode(code) }));
    state.defaults.mockResolvedValue({ 'walimah.title': 'Saved starting design' });
    state.assets.mockResolvedValue(undefined);
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it('waits for saved defaults before mounting the selected template', async () => {
    let resolve!: (value: Record<string, string>) => void;
    state.defaults.mockReturnValue(new Promise<Record<string, string>>((done) => { resolve = done; }));
    const { container } = render(<TemplatePreviewPage />); await flush();
    expect(screen.getByRole('status', { name: 'Loading invitation' })).toBeInTheDocument();
    expect(state.props).not.toHaveBeenCalled();
    expect(container.querySelector('[data-preview-ready]')).toBeNull();
    await act(async () => { resolve({ 'walimah.title': 'Real design' }); });
    expect(screen.getByText('Rendered template 15')).toBeInTheDocument();
    expect(state.props.mock.calls.at(-1)?.[1].customConfig['walimah.title']).toBe('Real design');
    await tick(); expect(container.querySelector('[data-preview-ready="true"]')).not.toBeNull();
  });

  it('cannot mark a loading chunk ready even after the old one-second timer elapsed', async () => {
    let resolve!: () => void;
    const gate = new Promise<void>((done) => { resolve = done; }); state.gate = gate;
    const { container } = render(<TemplatePreviewPage />); await flush(); await tick();
    expect(screen.getByRole('status', { name: 'Loading invitation' })).toBeInTheDocument();
    expect(container.querySelector('[data-preview-ready]')).toBeNull();
    await act(async () => { state.gate = undefined; resolve(); await gate; });
    await tick(); expect(container.querySelector('[data-preview-ready="true"]')).not.toBeNull();
  });

  it('waits for asset readiness before starting the settling delay', async () => {
    let resolve!: () => void;
    state.assets.mockReturnValue(new Promise<void>((done) => { resolve = done; }));
    const { container } = render(<TemplatePreviewPage />); await flush(); await tick();
    expect(container.querySelector('[data-preview-ready]')).toBeNull();
    await act(async () => { resolve(); });
    await tick(); expect(container.querySelector('[data-preview-ready="true"]')).not.toBeNull();
  });

  it('resets readiness on code changes and ignores stale configuration responses', async () => {
    let oldResolve!: (value: Record<string, string>) => void;
    state.defaults.mockReturnValueOnce(new Promise<Record<string, string>>((resolve) => { oldResolve = resolve; }))
      .mockResolvedValue({ 'walimah.title': 'New route design' });
    const { rerender, container } = render(<TemplatePreviewPage />); await flush();
    state.code = 'roman-garden'; rerender(<TemplatePreviewPage />); await flush();
    expect(screen.getByText('Rendered template 7')).toBeInTheDocument();
    expect(container.querySelector('[data-preview-ready]')).toBeNull();
    await act(async () => { oldResolve({ 'walimah.title': 'Stale design' }); }); await tick();
    expect(state.props.mock.calls.at(-1)?.[1].customConfig['walimah.title']).toBe('New route design');
    expect(container.querySelector('[data-preview-ready="true"]')).not.toBeNull();
  });

  it('keeps shipped sample copy when fetching defaults fails', async () => {
    state.defaults.mockRejectedValue(new Error('Offline'));
    render(<TemplatePreviewPage />); await flush();
    expect(state.props.mock.calls.at(-1)?.[1].customConfig['walimah.body']).toContain('Aisha and Adam');
  });

  it('does not mark an unknown code ready or load an unrelated fallback invitation', async () => {
    state.code = 'does-not-exist';
    const { container } = render(<TemplatePreviewPage />); await flush(); await tick();
    expect(screen.getByRole('alert')).toHaveTextContent('not available');
    expect(state.lookup).not.toHaveBeenCalled(); expect(state.props).not.toHaveBeenCalled();
    expect(container.querySelector('[data-preview-ready]')).toBeNull();
  });

  it.each([
    ['gilded-arch', 8, 'PARTY', false], ['engraved-certificate', 9, 'CEREMONY', false],
    ['dreamy-woodland', 12, undefined, true], ['dino-doodle-party', 13, 'PARTY', true],
    ['painted-promise', 15, undefined, true],
  ])('preserves sample event data for %s', async (code, id, eventType, enabled) => {
    state.code = code as string;
    render(<TemplatePreviewPage />); await flush();
    const [selected, props] = state.props.mock.calls.at(-1)!;
    expect(selected).toBe(id); expect(props.wedding.eventType).toBe(eventType);
    expect(props.photoBoothEnabled).toBe(enabled);
    expect(props.customConfig['walimah.title']).toBe('Saved starting design');
    if (enabled) expect(props.itinerary).toHaveLength(3);
  });
});
