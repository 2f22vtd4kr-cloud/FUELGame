import { describe, it, expect } from 'vitest';
import { computeVisionPolygon, pointInPolygon, VISION_FOV_KHOZAIN } from './vision';

describe('vision (§2.3 raycasting fog-of-war)', () => {
  it('produces a polygon with no obstacles that reaches full radius in the facing direction', () => {
    const origin = { x: 0, y: 0 };
    const poly = computeVisionPolygon(origin, 0, VISION_FOV_KHOZAIN, 400, []);
    expect(poly[0]).toEqual(origin);
    // At least one ray should reach (close to) max radius since nothing blocks it.
    const maxDist = Math.max(...poly.slice(1).map(p => Math.hypot(p.x - origin.x, p.y - origin.y)));
    expect(maxDist).toBeGreaterThan(390);
  });

  it('an obstacle directly ahead shortens the visibility polygon in that direction', () => {
    const origin = { x: 0, y: 0 };
    const obstacle = { x: 50, y: -20, w: 40, h: 40 }; // sits right in front, blocking the ray at angle 0
    const openPoly = computeVisionPolygon(origin, 0, VISION_FOV_KHOZAIN, 400, []);
    const blockedPoly = computeVisionPolygon(origin, 0, VISION_FOV_KHOZAIN, 400, [obstacle]);

    const distAt = (poly: { x: number; y: number }[], angle: number) => {
      let best = { d: Infinity, diff: Infinity };
      // Skip index 0 — it's always the origin point itself (distance 0), not a ray hit.
      for (const p of poly.slice(1)) {
        const d = Math.hypot(p.x - origin.x, p.y - origin.y);
        if (d < 1) continue; // ignore degenerate points collocated with origin
        const a = Math.atan2(p.y - origin.y, p.x - origin.x);
        const diff = Math.abs(a - angle);
        if (diff < best.diff) best = { d, diff };
      }
      return best.d;
    };

    expect(distAt(blockedPoly, 0)).toBeLessThan(distAt(openPoly, 0));
  });

  it('pointInPolygon correctly classifies points inside vs. outside a square', () => {
    const square = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
    expect(pointInPolygon(5, 5, square)).toBe(true);
    expect(pointInPolygon(50, 50, square)).toBe(false);
  });
});
