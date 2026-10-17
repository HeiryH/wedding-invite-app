/** Wait for the committed preview's fonts and initial image decode. Asset failures settle too:
 * a missing image must not hang thumbnail generation indefinitely. Cleanup handles route changes. */
export async function waitForPreviewAssets(root: HTMLElement, signal: AbortSignal, timeoutMs = 10000): Promise<void> {
  if (signal.aborted) return;
  const cleanups: (() => void)[] = [];
  const images = [...root.querySelectorAll('img')].map((image) => new Promise<void>((resolve) => {
    const failed = () => resolve();
    const decode = () => {
      if (typeof image.decode === 'function') image.decode().catch(() => {}).then(resolve);
      else resolve();
    };
    if (image.complete) { decode(); return; }
    image.addEventListener('load', decode, { once: true });
    image.addEventListener('error', failed, { once: true });
    cleanups.push(() => { image.removeEventListener('load', decode); image.removeEventListener('error', failed); });
  }));
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancel = () => {};
  const canceled = new Promise<void>((resolve) => {
    cancel = resolve;
    signal.addEventListener('abort', cancel, { once: true });
  });
  try {
    await Promise.race([
      Promise.all([document.fonts?.ready.catch(() => {}), ...images]),
      new Promise<void>((resolve) => { timer = setTimeout(resolve, timeoutMs); }),
      canceled,
    ]);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', cancel);
    cleanups.forEach((cleanup) => cleanup());
  }
}
