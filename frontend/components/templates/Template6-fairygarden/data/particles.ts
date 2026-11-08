/** Stable, independent samples keep render/hydration pure without changing spawn ranges. */
export function particleSample(index: number, channel: number, seed = 6419) {
  let value = Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(channel + 1, 0x85ebca6b) ^ seed;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

export function initialPetals(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    x: (particleSample(index, 0) - 0.5) * 24,
    y: particleSample(index, 1) * 14 - 2,
    z: (particleSample(index, 2) - 0.5) * 12,
    speed: 0.006 + particleSample(index, 3) * 0.012,
    rotX: particleSample(index, 4) * Math.PI * 2,
    rotZ: particleSample(index, 5) * Math.PI * 2,
    wobble: particleSample(index, 6) * Math.PI * 2,
    driftAmp: 0.002 + particleSample(index, 7) * 0.003,
  }));
}
