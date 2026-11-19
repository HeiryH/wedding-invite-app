export interface SurfacePoint { x: number; y: number }
/** Normalized destination corners, clockwise from the upper left. */
export type AssetPerspective = [SurfacePoint, SurfacePoint, SurfacePoint, SurfacePoint];

export const flatSurface: AssetPerspective = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
export const tableSurface: AssetPerspective = [{ x: .17, y: .28 }, { x: .83, y: .28 }, { x: .96, y: .79 }, { x: .04, y: .79 }];
export const surfaceCornerNames = ['Top left', 'Top right', 'Bottom right', 'Bottom left'] as const;
const limit = (value: number) => Math.min(1, Math.max(0, value));

export function normalizeAssetPerspective(value: unknown): AssetPerspective | undefined {
  if (!Array.isArray(value) || value.length !== 4) return;
  const points: SurfacePoint[] = [];
  for (const point of value) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    points.push({ x: limit(point.x), y: limit(point.y) });
  }
  // A clockwise, convex quad avoids flipped corners and projective singularities.
  if (!points.every((a, i) => {
    const b = points[(i + 1) % 4], c = points[(i + 2) % 4];
    return (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x) > .003;
  })) return;
  return points as AssetPerspective;
}

export function interpolateAssetPerspective(from: AssetPerspective | undefined, to: AssetPerspective | undefined, amount: number) {
  if (!from && !to) return;
  const a = from ?? flatSurface, b = to ?? flatSurface;
  return normalizeAssetPerspective(a.map((point, i) => ({
    x: point.x + (b[i].x - point.x) * amount,
    y: point.y + (b[i].y - point.y) * amount,
  })));
}

/** Project the source rectangle to the four pins with one projective matrix. */
export function assetPerspectiveTransform(points: AssetPerspective, width: number, height: number) {
  const [a, b, c, d] = points;
  const dx1 = b.x - c.x, dx2 = d.x - c.x, dx3 = a.x - b.x + c.x - d.x;
  const dy1 = b.y - c.y, dy2 = d.y - c.y, dy3 = a.y - b.y + c.y - d.y;
  const det = dx1 * dy2 - dx2 * dy1;
  if (width <= 0 || height <= 0 || Math.abs(det) < 1e-8) return;
  const g = (dx3 * dy2 - dx2 * dy3) / det;
  const h = (dx1 * dy3 - dx3 * dy1) / det;
  const matrix = [
    b.x - a.x + g * b.x, (b.y - a.y + g * b.y) * height / width, 0, g / width,
    (d.x - a.x + h * d.x) * width / height, d.y - a.y + h * d.y, 0, h / height,
    0, 0, 1, 0,
    a.x * width, a.y * height, 0, 1,
  ];
  return `matrix3d(${matrix.map((item) => item.toFixed(10)).join(',')})`;
}
