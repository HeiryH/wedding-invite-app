import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveThumbnailCapture } from './LiveThumbnailCapture';

const mocks = vi.hoisted(() => ({ capture: vi.fn(), upload: vi.fn() }));
vi.mock('./captureLivePreview', () => ({ captureLivePreview: mocks.capture }));
vi.mock('@/lib/api', () => ({ templateService: { uploadThumbnail: mocks.upload } }));

describe('live thumbnail review', () => {
  let target: HTMLDivElement;
  let blob: Blob;
  beforeEach(() => {
    vi.clearAllMocks();
    target = document.createElement('div');
    blob = new Blob(['live pixels'], { type: 'image/png' });
    mocks.capture.mockResolvedValue({ blob, width: 400, height: 700 });
    mocks.upload.mockResolvedValue({ templateId: 7 });
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
    class BlobURL extends URL {
      static createObjectURL = vi.fn(() => 'blob:live-preview');
      static revokeObjectURL = vi.fn();
    }
    vi.stubGlobal('URL', BlobURL);
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it('starts capture in the click handler, then shows review without uploading', async () => {
    mocks.capture.mockImplementation(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      return Promise.resolve({ blob, width: 400, height: 700 });
    });
    render(<LiveThumbnailCapture templateId={7} getPreviewElement={() => target} onApplied={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Capture thumbnail' }));
    expect(mocks.capture).toHaveBeenCalledWith(target, expect.any(AbortSignal));
    await screen.findByAltText('Live template preview capture');
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(screen.getByText(/400 × 700 pixels/)).toBeInTheDocument();
  });

  it('uploads only cropped pixels after approval, using the normal thumbnail API', async () => {
    const applied = vi.fn();
    render(<LiveThumbnailCapture templateId={7} getPreviewElement={() => target} onApplied={applied} />);
    fireEvent.click(screen.getByRole('button', { name: 'Capture thumbnail' }));
    await screen.findByAltText('Live template preview capture');
    fireEvent.click(screen.getByRole('button', { name: 'Use as thumbnail' }));
    await waitFor(() => expect(applied).toHaveBeenCalledTimes(1));
    expect(mocks.upload).toHaveBeenCalledWith(7, blob, 'studio-preview.png');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:live-preview');
  });

  it('cancel discards the local image without calling the API', async () => {
    render(<LiveThumbnailCapture templateId={7} getPreviewElement={() => target} onApplied={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Capture thumbnail' }));
    await screen.findByAltText('Live template preview capture');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('retake closes review before requesting another live frame', async () => {
    render(<LiveThumbnailCapture templateId={7} getPreviewElement={() => target} onApplied={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Capture thumbnail' }));
    await screen.findByAltText('Live template preview capture');
    mocks.capture.mockImplementationOnce(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      return Promise.resolve({ blob, width: 400, height: 700 });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Retake' }));
    await waitFor(() => expect(mocks.capture).toHaveBeenCalledTimes(2));
    await screen.findByAltText('Live template preview capture');
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it('shows unsupported browser and denied sharing errors without using a renderer', async () => {
    mocks.capture.mockRejectedValueOnce(new DOMException('Denied', 'NotAllowedError'));
    render(<LiveThumbnailCapture templateId={7} getPreviewElement={() => target} onApplied={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Capture thumbnail' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Tab sharing was cancelled or blocked');
    expect(mocks.upload).not.toHaveBeenCalled();
  });
});
