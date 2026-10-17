import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitForPreviewAssets } from './previewReadiness';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
function image(complete = false) {
  const root = document.createElement('div');
  const img = document.createElement('img');
  Object.defineProperty(img, 'complete', { value: complete });
  root.append(img);
  return { root, img };
}

describe('preview asset readiness', () => {
  it('waits for both fonts and decoded art', async () => {
    const { root, img } = image(true);
    let fontsReady!: () => void, decoded!: () => void;
    const fonts = new Promise<void>((resolve) => { fontsReady = resolve; });
    const art = new Promise<void>((resolve) => { decoded = resolve; });
    vi.stubGlobal('document', Object.assign(Object.create(document), { fonts: { ready: fonts } }));
    img.decode = vi.fn(() => art);
    let settled = false;
    const ready = waitForPreviewAssets(root, new AbortController().signal).then(() => { settled = true; });
    fontsReady(); await Promise.resolve();
    expect(settled).toBe(false);
    decoded(); await ready;
    expect(settled).toBe(true);
  });
  it('settles failed art instead of leaving thumbnail generation hanging', async () => {
    const { root, img } = image();
    const ready = waitForPreviewAssets(root, new AbortController().signal);
    img.dispatchEvent(new Event('error'));
    await expect(ready).resolves.toBeUndefined();
  });
  it('bounds a stalled asset and cleans up its timeout', async () => {
    vi.useFakeTimers();
    const { root } = image();
    const ready = waitForPreviewAssets(root, new AbortController().signal, 100);
    await vi.advanceTimersByTimeAsync(100);
    await ready;
    expect(vi.getTimerCount()).toBe(0);
  });
  it('cancels listeners and timers on a route change', async () => {
    vi.useFakeTimers();
    const { root, img } = image();
    const remove = vi.spyOn(img, 'removeEventListener');
    const controller = new AbortController();
    const ready = waitForPreviewAssets(root, controller.signal);
    controller.abort(); await ready;
    expect(remove).toHaveBeenCalledWith('load', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('error', expect.any(Function));
    expect(vi.getTimerCount()).toBe(0);
  });
});
