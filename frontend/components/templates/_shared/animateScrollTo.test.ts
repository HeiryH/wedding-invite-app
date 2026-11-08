import { afterEach, describe, expect, it, vi } from 'vitest';
import { animateScrollTo } from './animateScrollTo';

afterEach(() => vi.unstubAllGlobals());
describe('shared navigation scrolling', () => {
  it('jumps immediately under reduced motion without scheduling animation frames', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    vi.stubGlobal('scrollTo', vi.fn()); vi.stubGlobal('requestAnimationFrame', vi.fn());
    animateScrollTo(800);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 800);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });
});
