import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CaptureThumbnailDialog } from './CaptureThumbnailDialog';
import type { CapturePreviewSnapshot } from '@/lib/api/templateStudio.service';

const api = vi.hoisted(() => ({ startCapture: vi.fn(), getCapture: vi.fn(), captureImage: vi.fn(), cancelCapture: vi.fn(), applyCapture: vi.fn() }));
vi.mock('@/lib/api/templateStudio.service', () => ({ templateStudioService: api }));
const ready = { id: 'first-job', templateId: 7, status: 'ready', error: null, expiresAt: '2026-11-03T12:00:00Z', publishedRevision: 2 };

function Harness({ applied = () => {}, getSnapshot }: { applied?: () => void; getSnapshot?: () => CapturePreviewSnapshot }) {
  const [open, setOpen] = useState(false);
  return <><button onClick={() => setOpen(true)}>Open capture</button>
    <CaptureThumbnailDialog open={open} templateId={7} getSnapshot={getSnapshot} onClose={() => setOpen(false)} onApplied={() => { applied(); setOpen(false); }} /></>;
}

describe('thumbnail capture review', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
    class BlobURL extends URL {
      static createObjectURL = vi.fn(() => 'blob:temporary-capture');
      static revokeObjectURL = vi.fn();
    }
    vi.stubGlobal('URL', BlobURL);
    api.startCapture.mockResolvedValue(ready);
    api.captureImage.mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
    api.cancelCapture.mockResolvedValue(undefined);
    api.applyCapture.mockResolvedValue(undefined);
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it('previews a private capture and applies it only after explicit approval', async () => {
    const applied = vi.fn();
    render(<Harness applied={applied} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open capture' }));
    expect(await screen.findByAltText('Captured published invitation preview')).toHaveAttribute('src', 'blob:temporary-capture');
    expect(screen.getByText(/Published revision 2/)).toBeInTheDocument();
    expect(api.applyCapture).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Use as thumbnail' }));
    await waitFor(() => expect(applied).toHaveBeenCalledTimes(1));
    expect(api.applyCapture).toHaveBeenCalledWith(7, ready.id);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:temporary-capture');
  });

  it('cancel discards the capture and never changes the thumbnail', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Open capture' }));
    await screen.findByAltText('Captured published invitation preview');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(api.cancelCapture).toHaveBeenCalledWith(7, ready.id));
    expect(api.applyCapture).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('retake waits for cancellation before requesting a new capture', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Open capture' }));
    await screen.findByAltText('Captured published invitation preview');
    let release!: () => void;
    api.cancelCapture.mockReturnValueOnce(new Promise<void>(resolve => { release = resolve; }));
    fireEvent.click(screen.getByRole('button', { name: 'Retake' }));
    expect(api.startCapture).toHaveBeenCalledTimes(1);
    release();
    await waitFor(() => expect(api.startCapture).toHaveBeenCalledTimes(2));
    await screen.findByAltText('Captured published invitation preview');
    expect(api.applyCapture).not.toHaveBeenCalled();
  });

  it('shows an unavailable renderer error and allows retry', async () => {
    api.startCapture.mockRejectedValueOnce({ response: { data: { message: 'Thumbnail capture is currently unavailable.' } } });
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Open capture' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Thumbnail capture is currently unavailable.');
    fireEvent.click(screen.getByRole('button', { name: 'Retake' }));
    await screen.findByAltText('Captured published invitation preview');
    expect(api.applyCapture).not.toHaveBeenCalled();
  });

  it('keeps the review open when a newer publication makes the image stale', async () => {
    api.applyCapture.mockRejectedValueOnce({ response: { data: { message: 'A newer design has been published. Retake the thumbnail before saving.' } } });
    const applied = vi.fn();
    render(<Harness applied={applied} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open capture' }));
    await screen.findByAltText('Captured published invitation preview');
    fireEvent.click(screen.getByRole('button', { name: 'Use as thumbnail' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('A newer design has been published.');
    expect(screen.getByRole('button', { name: 'Retake' })).toBeEnabled();
    expect(applied).not.toHaveBeenCalled();
  });

  it('cancels an in-progress request when the dialog closes', async () => {
    api.startCapture.mockResolvedValueOnce({ ...ready, status: 'pending' });
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Open capture' }));
    await waitFor(() => expect(api.startCapture).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(api.cancelCapture).toHaveBeenCalledWith(7, ready.id));
    expect(api.startCapture.mock.calls[0][1].aborted).toBe(true);
    expect(api.applyCapture).not.toHaveBeenCalled();
  });

  it('submits the actual Studio preview rather than requesting another sample invitation', async () => {
    const snapshot = { payload: { wedding: { templateId: 7, brideName: 'Mary', groomName: 'John' }, customConfig: { heading: 'Draft heading' } }, width: 510, height: 915, scrollX: 0, scrollY: 200 };
    render(<Harness getSnapshot={() => snapshot} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open capture' }));
    await screen.findByAltText('Captured Studio preview');
    expect(api.startCapture.mock.calls[0][2]).toEqual(snapshot);
    expect(screen.getByText(/Current Studio preview/)).toBeInTheDocument();
    expect(api.applyCapture).not.toHaveBeenCalled();
  });
});
