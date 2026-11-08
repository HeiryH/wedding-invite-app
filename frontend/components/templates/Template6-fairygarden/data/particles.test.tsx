import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { initialPetals, particleSample } from './particles';
import FallbackBackground from '../components/FallbackBackground';

describe('stable Fairy Garden particle initialization', () => {
  it('keeps existing particles stable across repeat renders and count changes', () => {
    expect(initialPetals(24)).toEqual(initialPetals(24));
    expect(initialPetals(32).slice(0, 24)).toEqual(initialPetals(24));
    for (const petal of initialPetals(100)) {
      expect(petal.x).toBeGreaterThanOrEqual(-12); expect(petal.x).toBeLessThan(12);
      expect(petal.y).toBeGreaterThanOrEqual(-2); expect(petal.y).toBeLessThan(12);
      expect(petal.speed).toBeGreaterThanOrEqual(.006); expect(petal.speed).toBeLessThan(.018);
    }
    expect(particleSample(0, 0, 1)).not.toBe(particleSample(0, 0, 2));
  });
  it('does not relocate fallback fireflies on rerender', () => {
    const { container, rerender } = render(<FallbackBackground />); const html = container.innerHTML;
    rerender(<FallbackBackground />); expect(container.innerHTML).toBe(html); expect(container.querySelectorAll('[style]')).toHaveLength(24);
  });
});
