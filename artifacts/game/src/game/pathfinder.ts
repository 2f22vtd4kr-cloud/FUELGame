/**
 * §4.5 Grid-based A* pathfinder for bot navigation.
 *
 * Strategy:
 *  - 30px cell size → 40 × 30 grid over the 1200 × 900 map.
 *  - Walkability pre-computed once at module load.
 *  - 8-directional A* with a binary min-heap, lazy-deletion closed set
 *    (stale heap entries are discarded on pop).
 *  - Heap is sized at 8 × node count to cover worst-case duplicate pushes.
 *  - Greedy string-pull (LOS Bresenham with diagonal corner-clearance) to
 *    collapse straight runs into single waypoints.
 *  - Both start and destination are snapped to nearest walkable cells when
 *    they fall inside a building (handles bots spawned against a wall).
 *  - Returns world-space Vec2[] from the caller's position to destination.
 *    Falls back to [destination] if no path exists (unreachable island).
 */

import { isInsideBuilding, MAP_W, MAP_H } from '../data/map';
import type { Vec2 } from './types';

// ─── Grid constants ───────────────────────────────────────────────────────────

export const CELL = 30;                        // world-units per grid cell
export const COLS = Math.ceil(MAP_W / CELL);   // 40
export const ROWS = Math.ceil(MAP_H / CELL);   // 30
const N = COLS * ROWS;                         // 1 200 nodes

/** Bot collision radius used for walkability checks (slightly larger than player). */
const BOT_RADIUS = 15;

// ─── Pre-computed walkability ─────────────────────────────────────────────────

const walkable: Uint8Array = new Uint8Array(N);

(function initGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const wx = (c + 0.5) * CELL;
      const wy = (r + 0.5) * CELL;
      walkable[r * COLS + c] = isInsideBuilding({ x: wx, y: wy }, BOT_RADIUS) ? 0 : 1;
    }
  }
})();

// ─── Coordinate helpers ───────────────────────────────────────────────────────

function toGrid(wx: number, wy: number): [number, number] {
  return [
    Math.max(0, Math.min(COLS - 1, Math.floor(wx / CELL))),
    Math.max(0, Math.min(ROWS - 1, Math.floor(wy / CELL))),
  ];
}

function cellCenter(c: number, r: number): Vec2 {
  return { x: (c + 0.5) * CELL, y: (r + 0.5) * CELL };
}

function nodeIdx(c: number, r: number): number { return r * COLS + c; }

/** Snap grid coords to nearest walkable cell within a 3-cell search radius. */
function snapToWalkable(c: number, r: number): [number, number] {
  if (walkable[nodeIdx(c, r)]) return [c, r];
  let best = Infinity, bc = c, br = r;
  for (let dr = -3; dr <= 3; dr++) {
    for (let dc = -3; dc <= 3; dc++) {
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      if (!walkable[nodeIdx(nc, nr)]) continue;
      const d = dc * dc + dr * dr;
      if (d < best) { best = d; bc = nc; br = nr; }
    }
  }
  return [bc, br];
}

// ─── Binary min-heap ──────────────────────────────────────────────────────────
// Sized at 8 × N to cover worst-case duplicate pushes from lazy-deletion A*.

const HEAP_CAP = N * 8;

class MinHeap {
  private f: Float32Array = new Float32Array(HEAP_CAP);
  private n: Int32Array   = new Int32Array(HEAP_CAP);
  private size = 0;

  reset() { this.size = 0; }
  get empty() { return this.size === 0; }

  push(fScore: number, node: number): void {
    let i = this.size++;
    this.f[i] = fScore; this.n[i] = node;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.f[p] <= this.f[i]) break;
      this._swap(i, p); i = p;
    }
  }

  pop(): number {
    const top = this.n[0];
    const last = --this.size;
    this.f[0] = this.f[last]; this.n[0] = this.n[last];
    let i = 0;
    while (true) {
      let m = i, l = 2*i+1, r = 2*i+2;
      if (l < this.size && this.f[l] < this.f[m]) m = l;
      if (r < this.size && this.f[r] < this.f[m]) m = r;
      if (m === i) break;
      this._swap(i, m); i = m;
    }
    return top;
  }

  private _swap(a: number, b: number): void {
    let t = this.f[a]; this.f[a] = this.f[b]; this.f[b] = t;
    const u = this.n[a]; this.n[a] = this.n[b]; this.n[b] = u;
  }
}

// Re-use allocations across calls to avoid GC pressure at 60 fps.
const _heap   = new MinHeap();
const _g      = new Float32Array(N);
const _par    = new Int32Array(N);
const _closed = new Uint8Array(N);   // closed-set for lazy-deletion

// 8-directional moves: [dc, dr, cost×100 integer]
const DIRS: [number, number, number][] = [
  [1,0,100],[-1,0,100],[0,1,100],[0,-1,100],
  [1,1,141],[-1,1,141],[1,-1,141],[-1,-1,141],
];

// ─── A* ───────────────────────────────────────────────────────────────────────

/**
 * Find a world-space path from `from` to `to`.
 * Returns an array of Vec2 waypoints (not including the start).
 * Falls back to `[to]` when no path exists.
 */
export function findPath(from: Vec2, to: Vec2): Vec2[] {
  // Grid-snap both endpoints (handles bots or targets inside walls).
  let [fc, fr] = toGrid(from.x, from.y);
  let [tc, tr] = toGrid(to.x, to.y);
  [fc, fr] = snapToWalkable(fc, fr);
  [tc, tr] = snapToWalkable(tc, tr);

  const startNode = nodeIdx(fc, fr);
  const goalNode  = nodeIdx(tc, tr);

  if (startNode === goalNode) return [to];

  // Reset scratch buffers.
  _g.fill(Infinity);
  _par.fill(-1);
  _closed.fill(0);
  _heap.reset();

  _g[startNode] = 0;
  _heap.push(0, startNode);

  while (!_heap.empty) {
    const cur = _heap.pop();

    // Lazy-deletion: discard stale heap entries.
    if (_closed[cur]) continue;
    _closed[cur] = 1;

    if (cur === goalNode) break;

    const cc  = cur % COLS;
    const cr  = (cur / COLS) | 0;
    const gC  = _g[cur];

    for (const [dc, dr, cost] of DIRS) {
      const nc = cc + dc, nr = cr + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      const nb = nodeIdx(nc, nr);
      if (!walkable[nb] || _closed[nb]) continue;

      // Diagonal: require both cardinal-axis neighbours to be open to prevent
      // clipping building corners.
      if (dc !== 0 && dr !== 0) {
        if (!walkable[nodeIdx(cc + dc, cr)] || !walkable[nodeIdx(cc, cr + dr)]) continue;
      }

      const ng = gC + cost * 0.01;
      if (ng < _g[nb]) {
        _g[nb]  = ng;
        _par[nb] = cur;
        const h = Math.sqrt((nc - tc) ** 2 + (nr - tr) ** 2);
        _heap.push(ng + h, nb);
      }
    }
  }

  // No path found — return direct destination as fallback.
  if (_g[goalNode] === Infinity) return [to];

  // Reconstruct cell path.
  const cells: number[] = [];
  let cur = goalNode;
  while (cur !== -1) { cells.push(cur); cur = _par[cur]; }
  cells.reverse();

  // Convert to world coords; last waypoint = exact destination.
  const waypoints: Vec2[] = cells.map(n => cellCenter(n % COLS, (n / COLS) | 0));
  waypoints[waypoints.length - 1] = to;

  // String-pull to reduce waypoint count.
  return stringPull(from, waypoints);
}

// ─── String-pull ──────────────────────────────────────────────────────────────

/**
 * Bresenham LOS on the walkability grid, with diagonal corner-clearance
 * matching the A* expansion rule: a diagonal step is only clear if both
 * axis-aligned neighbours are also walkable.
 */
function hasGridLOS(a: Vec2, b: Vec2): boolean {
  let [c, r] = toGrid(a.x, a.y);
  const [ec, er] = toGrid(b.x, b.y);

  const adc = Math.abs(ec - c);
  const adr = Math.abs(er - r);
  const sc  = c < ec ? 1 : -1;
  const sr  = r < er ? 1 : -1;
  let err = adc - adr;
  const maxSteps = adc + adr + 2;

  for (let step = 0; step <= maxSteps; step++) {
    if (!walkable[nodeIdx(c, r)]) return false;
    if (c === ec && r === er) return true;

    const e2    = 2 * err;
    const moveC = e2 > -adr;
    const moveR = e2 <  adc;

    // Diagonal step: enforce corner clearance (same rule as A* expansion).
    if (moveC && moveR) {
      if (!walkable[nodeIdx(c + sc, r)] || !walkable[nodeIdx(c, r + sr)]) return false;
    }

    if (moveC) { err -= adr; c += sc; }
    if (moveR) { err += adc; r += sr; }
  }
  return true;
}

/**
 * Greedy string-pull: walk the waypoint list from `start` and skip any
 * intermediate waypoints that are directly visible from the current anchor.
 */
function stringPull(start: Vec2, waypoints: Vec2[]): Vec2[] {
  if (waypoints.length <= 1) return waypoints;
  const result: Vec2[] = [];
  let anchor = start;
  let i = 0;
  while (i < waypoints.length) {
    let farthest = i;
    for (let j = waypoints.length - 1; j > i; j--) {
      if (hasGridLOS(anchor, waypoints[j])) { farthest = j; break; }
    }
    result.push(waypoints[farthest]);
    anchor = waypoints[farthest];
    i = farthest + 1;
  }
  return result;
}
