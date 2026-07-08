---
name: 95-Y A* pathfinding
description: Grid-based A* for bot navigation (§4.5) — design decisions, pitfalls fixed, and LOD rules.
---

# §4.5 A* Pathfinding

## Implementation
- **pathfinder.ts** lives in both `artifacts/game/src/game/` and `artifacts/api-server/src/game/` (identical files; keep in sync).
- 30px cell → 40×30 grid; walkability pre-computed once at module load.
- Binary min-heap + lazy-deletion closed set (stale entries discarded on pop).
- Heap sized at `N*8` (N = 1200 nodes) to cover worst-case duplicate pushes without a decrease-key structure.
- Both start and destination grid cells are snapped to nearest walkable before search.
- Greedy string-pull (Bresenham LOS) collapses straight runs; diagonal steps require both cardinal neighbours to be walkable (same rule as A* expansion — prevents corner-cutting).

## Player type additions
`botPath: Vec2[]`, `botReplanTimer: number`, `botPathTarget: Vec2 | null` added to `Player` in both `types.ts` files; defaults in both `state.ts` files.

## LOD (§4.5 optimization)
- `NEAR_HUMAN_DIST = 240wu` — bots within this range of any live human use full A*.
- Bots beyond threshold fall back to direct-steer + wall-slide (original `_moveDirect`), path cleared so it rebuilds on approach.
- `REPLAN_INTERVAL = 1.0s`; also replans if target moved `>60wu`.

**Why:** The 40×30 grid is small enough that A* is negligible CPU per bot, but distant bots have no visual observer so correctness there matters less than throughput.

## Pitfalls fixed during development
1. Fixed heap overflow: original impl used `COLS*ROWS` capacity with no closed set; duplicate pushes overran typed arrays silently → corrupted paths.
2. Added start-cell snap: bots spawned against a wall would start from an unwalkable cell.
3. LOS corner-clearance: original Bresenham accepted diagonal shortcuts through blocked corners; fixed by checking both side cells on diagonal Bresenham steps.
