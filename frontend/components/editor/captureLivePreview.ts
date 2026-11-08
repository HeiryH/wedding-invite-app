export interface LivePreviewImage { blob: Blob; width: number; height: number }
type Rect = Pick<DOMRect, 'left' | 'top' | 'right' | 'bottom' | 'width' | 'height'>;
type CaptureTrack = MediaStreamTrack & {
  cropTo?: (target: unknown) => Promise<void>;
  getCaptureHandle?: () => { handle?: string } | null;
};
type CaptureDevices = MediaDevices & {
  setCaptureHandleConfig?: (config: { handle: string; exposeOrigin: boolean; permittedOrigins: string[] }) => void;
};
type CaptureWindow = Window & { CropTarget?: { fromElement(element: Element): Promise<unknown> } };

export function previewPixelCrop(rect: Rect, viewport: { width: number; height: number }, image: { width: number; height: number }) {
  if (rect.width <= 0 || rect.height <= 0 || rect.left < 0 || rect.top < 0 || rect.right > viewport.width + .5 || rect.bottom > viewport.height + .5)
    throw new Error('Fit the entire template preview on screen before capturing.');
  const sx = image.width / viewport.width;
  const sy = image.height / viewport.height;
  if (!Number.isFinite(sx) || !Number.isFinite(sy) || sx <= 0 || sy <= 0 || Math.abs(sx / sy - 1) > .03)
    throw new Error('The shared tab does not match this workspace. Choose the Studio tab and retry.');
  const x = Math.ceil(rect.left * sx), y = Math.ceil(rect.top * sy);
  return { x, y, width: Math.floor(rect.right * sx) - x, height: Math.floor(rect.bottom * sy) - y };
}

function waitFrame(video: HTMLVideoElement, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    let callback: number | undefined;
    const finish = (error?: Error) => {
      clearTimeout(timeout); signal?.removeEventListener('abort', abort);
      if (callback !== undefined) video.cancelVideoFrameCallback?.(callback);
      video.removeEventListener('loadeddata', loaded);
      if (error) reject(error); else resolve();
    };
    const abort = () => finish(new DOMException('Capture cancelled', 'AbortError'));
    const loaded = () => {
      if (video.requestVideoFrameCallback) callback = video.requestVideoFrameCallback(() => finish());
      else if (video.readyState >= 2) requestAnimationFrame(() => requestAnimationFrame(() => finish()));
    };
    const timeout = setTimeout(() => finish(new Error('The browser did not provide a capture frame. Please retry.')), 10000);
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener('abort', abort, { once: true });
    if (video.readyState >= 2) loaded(); else video.addEventListener('loadeddata', loaded, { once: true });
  });
}

/** Call directly from a click handler: getDisplayMedia requires a real user gesture. */
export async function captureLivePreview(target: HTMLElement, signal?: AbortSignal): Promise<LivePreviewImage> {
  const devices = navigator.mediaDevices as CaptureDevices | undefined;
  if (!devices?.getDisplayMedia)
    throw new Error('Live tab capture is unavailable in this browser. Open Studio in Chrome or Edge and try again.');
  // Validate before requesting sharing; a clipped preview would produce an incomplete image.
  previewPixelCrop(target.getBoundingClientRect(), { width: innerWidth, height: innerHeight }, { width: innerWidth, height: innerHeight });
  const handle = `studio-${crypto.randomUUID()}`;
  devices.setCaptureHandleConfig?.({ handle, exposeOrigin: true, permittedOrigins: [location.origin] });
  let stream: MediaStream | undefined;
  const video = document.createElement('video');
  video.muted = true; video.playsInline = true;
  video.setAttribute('aria-hidden', 'true');
  video.style.cssText = 'position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;pointer-events:none';
  let cleanStyle: HTMLStyleElement | undefined;
  const stop = () => stream?.getTracks().forEach(track => track.stop());
  try {
    // No awaited work before this call: preserve transient activation from the button click.
    stream = await devices.getDisplayMedia({ audio: false, video: { displaySurface: 'browser' },
      preferCurrentTab: true, selfBrowserSurface: 'include', surfaceSwitching: 'exclude', monitorTypeSurfaces: 'exclude',
    } as DisplayMediaStreamOptions);
    if (signal?.aborted) throw new DOMException('Capture cancelled', 'AbortError');
    signal?.addEventListener('abort', stop, { once: true });
    const track = stream.getVideoTracks()[0] as CaptureTrack | undefined;
    if (!track || (track.getSettings().displaySurface && track.getSettings().displaySurface !== 'browser'))
      throw new Error('Choose this Studio browser tab, rather than a window or an entire screen.');
    let region = false;
    const cropTarget = (window as CaptureWindow).CropTarget;
    if (cropTarget && track.cropTo) {
      try { await track.cropTo(await cropTarget.fromElement(target)); region = true; }
      catch { throw new Error('Choose the Studio tab in the sharing dialog so only its template preview can be captured.'); }
    } else if (track.getCaptureHandle?.()?.handle !== handle) {
      throw new Error('This browser cannot verify preview-only capture. Open Studio in Chrome or Edge and choose This Tab.');
    }
    // Remove only editor affordances. Do not restart videos or alter animation timing.
    const frame = target.querySelector('iframe');
    if (frame?.contentDocument?.head) {
      cleanStyle = frame.contentDocument.createElement('style');
      cleanStyle.textContent = '[data-selected="true"]{outline:none!important} [data-role^="resize-handle"]{visibility:hidden!important}';
      frame.contentDocument.head.appendChild(cleanStyle);
    }
    document.body.appendChild(video);
    video.srcObject = stream;
    await video.play();
    // Wait for a new compositor frame after cropping and hiding outlines.
    await waitFrame(video, signal);
    await waitFrame(video, signal);
    if (!target.isConnected || signal?.aborted) throw new DOMException('Capture cancelled', 'AbortError');
    const rect = target.getBoundingClientRect();
    previewPixelCrop(rect, { width: innerWidth, height: innerHeight }, { width: innerWidth, height: innerHeight });
    let crop;
    if (region) {
      if (Math.abs((video.videoWidth / video.videoHeight) / (rect.width / rect.height) - 1) > .03)
        throw new Error('The browser has not isolated the preview yet. Please retake the capture.');
      crop = { x: 0, y: 0, width: video.videoWidth, height: video.videoHeight };
    } else crop = previewPixelCrop(rect, { width: innerWidth, height: innerHeight }, { width: video.videoWidth, height: video.videoHeight });
    const canvas = document.createElement('canvas');
    canvas.width = crop.width; canvas.height = crop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx || !crop.width || !crop.height) throw new Error('The preview image could not be captured.');
    ctx.drawImage(video, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
    // Sharing ends as soon as the cropped pixels have been copied; review is a local image.
    stop();
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not create the thumbnail image.')), 'image/png'));
    return { blob, width: crop.width, height: crop.height };
  } finally {
    stop(); signal?.removeEventListener('abort', stop);
    cleanStyle?.remove(); video.srcObject = null; video.remove();
  }
}
