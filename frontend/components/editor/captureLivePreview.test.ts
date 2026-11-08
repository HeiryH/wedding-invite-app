import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { captureLivePreview, previewPixelCrop } from './captureLivePreview';

describe('live preview pixels', () => {
  const rect = { left: 100, top: 100, right: 300, bottom: 450, width: 200, height: 350 };
  let target: HTMLDivElement;
  let stop: ReturnType<typeof vi.fn>;
  let draw: ReturnType<typeof vi.fn>;
  let share: ReturnType<typeof vi.fn>;
  let track: { stop: ReturnType<typeof vi.fn>; getSettings: ReturnType<typeof vi.fn>; cropTo?: ReturnType<typeof vi.fn>; getCaptureHandle?: () => { handle: string } };
  let stream: MediaStream;
  let dimensions: { width: number; height: number };
  let handle: string;

  beforeEach(() => {
    target = document.createElement('div'); document.body.appendChild(target);
    target.getBoundingClientRect = () => rect as DOMRect;
    vi.stubGlobal('innerWidth', 1024); vi.stubGlobal('innerHeight', 768);
    dimensions = { width: 400, height: 700 };
    stop = vi.fn(); draw = vi.fn(); handle = '';
    track = { stop, getSettings: vi.fn(() => ({ displaySurface: 'browser' })), cropTo: vi.fn().mockResolvedValue(undefined) };
    stream = { getVideoTracks: () => [track], getTracks: () => [track] } as unknown as MediaStream;
    share = vi.fn().mockResolvedValue(stream);
    vi.stubGlobal('navigator', { mediaDevices: { getDisplayMedia: share, setCaptureHandleConfig: ({ handle: value }: { handle: string }) => { handle = value; } } });
    vi.stubGlobal('CropTarget', { fromElement: vi.fn().mockResolvedValue('preview-only') });
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockReturnValue(2);
    vi.spyOn(HTMLVideoElement.prototype, 'videoWidth', 'get').mockImplementation(() => dimensions.width);
    vi.spyOn(HTMLVideoElement.prototype, 'videoHeight', 'get').mockImplementation(() => dimensions.height);
    HTMLVideoElement.prototype.requestVideoFrameCallback = callback => setTimeout(() => callback(0, {} as VideoFrameCallbackMetadata), 0) as unknown as number;
    HTMLVideoElement.prototype.cancelVideoFrameCallback = id => clearTimeout(id);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: draw } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => {
      expect(stop).toHaveBeenCalled();
      callback(new Blob(['png'], { type: 'image/png' }));
    });
  });
  afterEach(() => { target.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('captures only the cropped live region and stops sharing before image review', async () => {
    const result = await captureLivePreview(target);
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ audio: false, preferCurrentTab: true }));
    expect(track.cropTo).toHaveBeenCalledWith('preview-only');
    expect(draw).toHaveBeenCalledWith(expect.any(HTMLVideoElement), 0, 0, 400, 700, 0, 0, 400, 700);
    expect(result.width).toBe(400); expect(result.height).toBe(700);
    expect(stop).toHaveBeenCalled();
    expect(document.querySelector('video')).toBeNull();
  });

  it('converts preview CSS coordinates to native pixels on a verified current-tab fallback', async () => {
    vi.stubGlobal('CropTarget', undefined);
    track.cropTo = undefined;
    track.getCaptureHandle = () => ({ handle });
    dimensions = { width: 2048, height: 1536 };
    const result = await captureLivePreview(target);
    expect(draw).toHaveBeenCalledWith(expect.any(HTMLVideoElement), 200, 200, 400, 700, 0, 0, 400, 700);
    expect(result.width).toBe(400);
  });

  it('rejects a window or whole screen and stops its stream', async () => {
    track.getSettings.mockReturnValue({ displaySurface: 'monitor' });
    await expect(captureLivePreview(target)).rejects.toThrow('Choose this Studio browser tab');
    expect(stop).toHaveBeenCalled(); expect(draw).not.toHaveBeenCalled();
  });

  it('rejects a different tab when region cropping fails', async () => {
    track.cropTo!.mockRejectedValue(new Error('Other tab'));
    await expect(captureLivePreview(target)).rejects.toThrow('Choose the Studio tab');
    expect(stop).toHaveBeenCalled(); expect(draw).not.toHaveBeenCalled();
  });

  it('refuses an unverified fallback rather than cropping unrelated tab content', async () => {
    vi.stubGlobal('CropTarget', undefined);
    track.cropTo = undefined;
    await expect(captureLivePreview(target)).rejects.toThrow('cannot verify preview-only capture');
    expect(stop).toHaveBeenCalled(); expect(draw).not.toHaveBeenCalled();
  });

  it('stops a stream granted after the capture was cancelled', async () => {
    let grant!: (stream: MediaStream) => void;
    share.mockReturnValueOnce(new Promise<MediaStream>(resolve => { grant = resolve; }));
    const controller = new AbortController();
    const capture = captureLivePreview(target, controller.signal);
    controller.abort(); grant(stream);
    await expect(capture).rejects.toMatchObject({ name: 'AbortError' });
    expect(stop).toHaveBeenCalled(); expect(draw).not.toHaveBeenCalled();
  });

  it('does not request sharing for a preview clipped by the viewport', async () => {
    target.getBoundingClientRect = () => ({ ...rect, bottom: 900 }) as DOMRect;
    await expect(captureLivePreview(target)).rejects.toThrow('Fit the entire');
    expect(share).not.toHaveBeenCalled();
  });

  it('checks aspect ratio before using whole-tab pixel coordinates', () => {
    expect(() => previewPixelCrop(rect, { width: 1024, height: 768 }, { width: 1920, height: 1080 })).toThrow('does not match');
  });
});
