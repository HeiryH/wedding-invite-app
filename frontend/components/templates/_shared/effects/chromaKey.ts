/**
 * The luminance chromakey shared by every video-backed layer kind (`scrollVideo`, `video`).
 *
 * h264 carries no alpha channel, so transparent-background art is shipped as a **solid black**
 * backdrop and keyed at paint time: pixels darker than `threshold` become fully transparent, and
 * the next `fade` luminance units ramp back to opaque so antialiased edges don't get a hard cut.
 * This is why the encode pipeline lifts the artwork's black point (see docs/FIX_QUEUE.md) — line
 * art with true-black outlines would otherwise be keyed away along with the background.
 *
 * Extracted rather than duplicated: this repo's recurring failure mode is the same logic drifting
 * between two copies (see CLAUDE.md's merge notes), and both video kinds need identical maths for
 * their output to look the same.
 */

/** Draws one video frame to `canvas` and keys out its dark backdrop, in place. */
export function drawKeyedFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  threshold: number,
  fade: number,
): void {
  if (canvas.width !== video.videoWidth) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      if (lum < threshold) {
        d[i + 3] = 0;
      } else if (lum < threshold + fade) {
        d[i + 3] = Math.round(((lum - threshold) / fade) * 255);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  } catch {
    // canvas tainted (cross-origin video) — the frame is still visible, just unkeyed
  }
}

/** True once the element has a decoded frame to draw (`HAVE_CURRENT_DATA`). */
export function hasDecodedFrame(video: HTMLVideoElement): boolean {
  return Boolean(video.videoWidth) && video.readyState >= 2;
}
