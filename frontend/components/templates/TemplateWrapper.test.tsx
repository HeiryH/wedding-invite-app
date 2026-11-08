import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TemplateRenderProps } from './templateTypes';

const state = vi.hoisted(() => ({ select: vi.fn(), rendered: vi.fn(), authored: vi.fn(), gate: undefined as Promise<void> | undefined }));
vi.mock('./templateComponents', () => {
  const probe = (id: number) => function ProbeTemplate(received: TemplateRenderProps) {
    if (state.gate) throw state.gate;
    state.select(id); state.rendered(received); return <p>Template {id}</p>;
  };
  return { TEMPLATE_COMPONENTS: { 1: probe(1), 7: probe(7), 15: probe(15) } };
});
vi.mock('./_shared/hooks/useBreakpoint', () => ({ useBreakpoint: () => 'mobile' }));
vi.mock('./_shared/DataTemplate', () => ({ default: (props: unknown) => { state.authored(props); return <p>Authored invite</p>; } }));
import TemplateWrapper from './TemplateWrapper';

const props = {
  wedding: { templateId: 15, groomName: 'Danish', brideName: 'Alya' },
  wishes: [], photos: [], guests: [], coupleMedia: [], itinerary: [], tables: [],
  onRSVP: vi.fn(), onSubmitWish: vi.fn(), onUploadPhoto: vi.fn(),
  photoBoothEnabled: true, seatingEnabled: true, customConfig: { 'walimah.body': 'Saved copy' },
  editor: { enabled: true, breakpoint: 'mobile', selectedLayer: 'programme-board--title',
    cinematic: { mode: 'scene', progress: .62, beatId: 'programme-wide' } },
} as unknown as TemplateRenderProps;

describe('lazy editor template wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.gate = undefined;
  });
  it('selects only the requested template and forwards the full editor/form contract unchanged', () => {
    render(<TemplateWrapper {...props} />);
    expect(state.select).toHaveBeenCalledWith(15);
    expect(screen.getByText('Template 15')).toBeInTheDocument();
    const received = state.rendered.mock.calls[0][0];
    for (const key of Object.keys(props)) expect(received[key]).toBe(props[key as keyof TemplateRenderProps]);
  });
  it('selects a new template when switching without replacing saved configuration', () => {
    const { rerender } = render(<TemplateWrapper {...props} />);
    rerender(<TemplateWrapper {...props} wedding={{ ...props.wedding, templateId: 7 }} />);
    expect(screen.getByText('Template 7')).toBeInTheDocument();
    expect(state.rendered.mock.calls.at(-1)?.[0].customConfig).toBe(props.customConfig);
  });
  it('keeps authored stages on their separate renderer without selecting a built-in', () => {
    render(<TemplateWrapper {...props} wedding={{ ...props.wedding, templateId: 99, templateStagesJson: '{"welcome":{"layers":[]}}' }} />);
    expect(screen.getByText('Authored invite')).toBeInTheDocument();
    expect(state.select).not.toHaveBeenCalled();
    expect(state.authored.mock.calls[0][0]).toMatchObject({ keyPrefix: 'ta99', customConfig: props.customConfig,
      slotProps: { editor: props.editor, onRSVP: props.onRSVP, onSubmitWish: props.onSubmitWish, coupleMedia: props.coupleMedia } });
  });
  it('retains the built-in path for malformed authored JSON', () => {
    render(<TemplateWrapper {...props} wedding={{ ...props.wedding, templateStagesJson: 'invalid' }} />);
    expect(state.select).toHaveBeenCalledWith(15);
  });
  it('retains Template 1 as the unknown-id fallback', () => {
    render(<TemplateWrapper {...props} wedding={{ ...props.wedding, templateId: 999 }} />);
    expect(screen.getByText('Template 1')).toBeInTheDocument();
  });
  it('reports readiness only after the selected template resolves, not while showing its placeholder', async () => {
    let resolve!: () => void;
    const pending = new Promise<void>((done) => { resolve = done; });
    state.gate = pending;
    const ready = vi.fn();
    const { rerender } = render(<TemplateWrapper {...props} onTemplateReady={ready} />);
    expect(screen.getByRole('status', { name: 'Loading invitation' })).toBeInTheDocument();
    expect(ready).not.toHaveBeenCalled();
    await act(async () => { state.gate = undefined; resolve(); await pending; });
    expect(screen.getByText('Template 15')).toBeInTheDocument();
    expect(ready).toHaveBeenCalledOnce();
    rerender(<TemplateWrapper {...props} customConfig={{ 'walimah.body': 'Updated copy' }} onTemplateReady={ready} />);
    expect(ready).toHaveBeenCalledOnce();
  });
});
