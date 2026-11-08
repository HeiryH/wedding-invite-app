import { createRef } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PreviewPanel, frameFromPreset } from './PreviewPanel';
import { defaultPresetFor } from '@/lib/devicePresets';
import type { Wedding } from '@/lib/api';
import { PAINTED_PROMISE_BEATS, PAINTED_PROMISE_SEQUENCE } from '@/components/templates/Template15-paintedpromise/data/cinematic';

describe('preview toolbar', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  });
  afterEach(() => vi.unstubAllGlobals());
  it('never dismisses inspectors from canvas or timeline clicks', () => {
    const dismiss = vi.fn();
    window.addEventListener('preview-dismiss-inspectors', dismiss);
    try {
      render(<PreviewPanel iframeRef={createRef<HTMLIFrameElement>()} device="mobile" setDevice={vi.fn()}
        manualZoom={100} setManualZoom={vi.fn()} activeBlock="details" onSelectBlock={vi.fn()}
        sectionOrder={[]} editorMode="collapsed" onShowEditor={vi.fn()} wedding={null}
        frame={frameFromPreset(defaultPresetFor('mobile'))} setFrame={vi.fn()}
        cinematicTimeline={{ progress: .7, beats: PAINTED_PROMISE_BEATS, tracks: PAINTED_PROMISE_SEQUENCE.tracks, onChange: vi.fn() }} />);
      fireEvent.pointerDown(screen.getByText('Story timeline'));
      expect(dismiss).not.toHaveBeenCalled();
      const workspace = screen.getByTestId('preview-workspace');
      workspace.setPointerCapture = vi.fn();
      fireEvent.pointerDown(workspace);
      expect(dismiss).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener('preview-dismiss-inspectors', dismiss);
    }
  });
  it('keeps dimensions in Device view and template/live information behind the info button', () => {
    const setFrame = vi.fn();
    render(<PreviewPanel iframeRef={createRef<HTMLIFrameElement>()} device="mobile" setDevice={vi.fn()}
      manualZoom={100} setManualZoom={vi.fn()} activeBlock="photobooth" onSelectBlock={vi.fn()}
      sectionOrder={[]} editorMode="collapsed" onShowEditor={vi.fn()}
      wedding={{ templateName: 'Painted Promise', eventType: 'WEDDING', coupleName: 'sample' } as Wedding}
      frame={frameFromPreset(defaultPresetFor('mobile'))} setFrame={setFrame} />);
    expect(screen.queryByRole('group', { name: 'Device view' })).toBeNull();
    expect(screen.queryByTitle('Open invitation')).toBeNull();
    expect(screen.queryByTitle('Copy invitation link')).toBeNull();
    setFrame.mockClear();
    const pan = screen.getByRole('button', { name: 'Pan preview' });
    fireEvent.click(pan);
    expect(screen.getByTestId('preview-pan-surface')).toBeVisible();
    fireEvent.keyDown(pan, { key: 'ArrowRight' });
    expect(screen.getByTestId('preview-device-frame')).toHaveStyle({ transform: 'translate(30px, 0px)' });
    fireEvent.keyDown(pan, { key: 'Home' });
    expect(screen.getByTestId('preview-device-frame')).toHaveStyle({ transform: 'translate(0px, 0px)' });
    expect(setFrame).not.toHaveBeenCalled();
    fireEvent.click(pan);
    const deviceTrigger = screen.getByRole('button', { name: 'Device view settings' });
    fireEvent.click(deviceTrigger);
    const dimensions = within(screen.getByRole('group', { name: 'Device view' })).getByRole('button', { name: 'Adjust frame dimensions' });
    expect(screen.queryByText('Photo Booth')).toBeNull();
    expect(screen.queryByText('Painted Promise')).toBeNull();
    fireEvent.click(dimensions);
    const size = screen.getByRole('region', { name: 'Frame size' });
    fireEvent.change(within(size).getAllByRole('spinbutton')[0], { target: { value: '420' } });
    expect(setFrame).toHaveBeenLastCalledWith(expect.objectContaining({ w: 420, presetId: null }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('region', { name: 'Frame size' })).toBeNull();
    expect(dimensions).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(deviceTrigger).toHaveFocus();
    expect(screen.queryByRole('group', { name: 'Device view' })).toBeNull();
    const zoom = screen.getByRole('button', { name: 'Preview zoom' });
    fireEvent.click(zoom);
    expect(screen.getByRole('group', { name: 'Zoom controls' })).toBeVisible();
    expect(screen.queryByRole('group', { name: 'Device view' })).toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(zoom).toHaveFocus();
    const info = within(screen.getByRole('group', { name: 'Preview actions' })).getByRole('button', { name: 'Preview information' });
    fireEvent.click(info);
    expect(screen.getByRole('region', { name: 'Preview information' })).toHaveTextContent('Painted Promise');
    expect(screen.getByText('Live preview')).toBeVisible();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(info).toHaveFocus();
    expect(screen.queryByRole('region', { name: 'Preview information' })).toBeNull();
  });
});
