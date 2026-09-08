/**
 * Fixed-duration, fixed-easing scroll — deliberately not `el.scrollIntoView({behavior:'smooth'})`,
 * whose actual duration/easing is left to each browser's own implementation and visibly differs
 * between them (Safari's is markedly slower/more pronounced than Chromium's). On a stage whose top
 * ~20-25% is plain sky/background before any art begins (common across these templates), a slower
 * scroll lingers on "mostly blank" far more noticeably in one browser than another for the exact
 * same nav click — this makes jumping section to section look and feel identical everywhere.
 */
export function animateScrollTo(top: number, duration = 380) {
  const startY = window.scrollY;
  const delta = top - startY;
  if (Math.abs(delta) < 1) return;
  const start = performance.now();
  const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    window.scrollTo(0, startY + delta * easeOutCubic(t));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Convenience wrapper matching the common `el.scrollIntoView()` call shape. */
export function animateScrollIntoView(el: Element, duration?: number) {
  animateScrollTo(el.getBoundingClientRect().top + window.scrollY, duration);
}
