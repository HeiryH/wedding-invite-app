import { describe, expect, it } from 'vitest';
import { assetPerspectiveTransform, flatSurface, normalizeAssetPerspective, tableSurface } from './assetPerspective';
import { neutralAssetPose, normalizeAssetKeyframes, sampleAssetKeyframes } from './assetKeyframes';

describe('asset perspective', () => {
  it('maps all four source corners to the four perspective pins at different sizes', () => {
    for (const [width, height] of [[400, 360], [448, 196]]) {
      const coefficients = assetPerspectiveTransform(tableSurface, width, height)!.slice(9, -1).split(',').map(Number);
      flatSurface.forEach(({ x, y }, index) => {
        const w = coefficients[3] * x * width + coefficients[7] * y * height + coefficients[15];
        expect((coefficients[0] * x * width + coefficients[4] * y * height + coefficients[12]) / (w * width))
          .toBeCloseTo(tableSurface[index].x, 6);
        expect((coefficients[1] * x * width + coefficients[5] * y * height + coefficients[13]) / (w * height))
          .toBeCloseTo(tableSurface[index].y, 6);
      });
    }
  });

  it('rejects a crossed quad and eases toward flat artwork and no shadow without changing its anchor', () => {
    expect(normalizeAssetPerspective([tableSurface[0], tableSurface[2], tableSurface[1], tableSurface[3]])).toBeUndefined();
    const frames = normalizeAssetKeyframes([
      { id: 'docked', at: 0, easing: 'linear', pose: {
        ...neutralAssetPose, perspective: tableSurface, contactShadow: .4, anchor: 'table', frame: 0,
      } },
      { id: 'raised', at: .6, easing: 'linear', pose: { ...neutralAssetPose, anchor: 'table', frame: 1 } },
    ]);
    const halfway = sampleAssetKeyframes(frames, .3);
    expect(halfway?.perspective?.[0].x).toBeCloseTo(.085);
    expect(halfway?.perspective?.[0].y).toBeCloseTo(.14);
    expect(halfway).toMatchObject({ contactShadow: .2, anchor: 'table', frame: .5 });
    expect(sampleAssetKeyframes(frames, .6)?.perspective).toBeUndefined();
  });
});
