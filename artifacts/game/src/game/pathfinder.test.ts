import { describe, it, expect } from 'vitest';
import { findPath } from './pathfinder';
import { MAP_W, MAP_H, isInsideBuilding } from '../data/map';

// Find an open point near the given coordinates (nudges outward until walkable).
function nearestOpen(x: number, y: number): { x: number; y: number } {
  for (let r = 0; r < 200; r += 10) {
    for (const [dx, dy] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) {
      const px = x + dx, py = y + dy;
      if (px > 0 && px < MAP_W && py > 0 && py < MAP_H && !isInsideBuilding(px, py)) {
        return { x: px, y: py };
      }
    }
  }
  return { x, y };
}

describe('pathfinder (§4.5 grid A*)', () => {
  it('returns a direct path when start and destination are the same walkable cell', () => {
    const p = nearestOpen(100, 100);
    const path = findPath(p, p);
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual(p);
  });

  it('finds a route across the map that never cuts through a building', () => {
    const from = nearestOpen(60, 60);
    const to = nearestOpen(MAP_W - 60, MAP_H - 60);
    const path = findPath(from, to);

    expect(path.length).toBeGreaterThan(0);
    // Every waypoint must be outside building footprints — the whole point of pathfinding
    // around obstacles instead of moving straight through them.
    for (const wp of path) {
      expect(isInsideBuilding(wp.x, wp.y)).toBe(false);
    }
    // The path must actually progress toward the destination.
    const last = path[path.length - 1];
    expect(Math.hypot(last.x - to.x, last.y - to.y)).toBeLessThan(60);
  });

  it('falls back gracefully instead of throwing when destination is unreachable/off-map', () => {
    const from = nearestOpen(100, 100);
    expect(() => findPath(from, { x: -9999, y: -9999 })).not.toThrow();
  });
});
