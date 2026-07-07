---
name: 95-Y vision system
description: §2.3 raycasting fog-of-war implementation details and design decisions
---

# §2.3 Vision System

## What was implemented
- `artifacts/game/src/game/vision.ts` — raycasting visibility polygon
- `artifacts/game/src/data/map.ts` — `VISION_BUILDINGS` (bottom wall split at arch gap)
- `artifacts/game/src/game/renderer.ts` — fog-of-war overlay + post-fog teammate outlines

## Algorithm
72 uniform rays (2.5° apart) across FOV arc + extra rays at obstacle corner angles (angle ± 1.8e-4 rad) for sharp shadow edges. Obstacle intersect uses slab AABB method. Output is a fan polygon rooted at player origin.

**Why 72 (not 36):** 36 rays (5°) showed visible gaps at far walls. 72 gives smooth edges with negligible cost.

## Obstacle list
`buildVisionObstacles(visionBuildings, cars, dumpsters)` — called once per frame in `renderGame`. Cars are static during Phase 1 but the list is rebuilt cheaply.

**VISION_BUILDINGS vs BUILDINGS:** `VISION_BUILDINGS` splits the bottom wall at x=450–750 so rays pass through the entrance arch. `BUILDINGS` (used for collision) has the full bottom rect. Never use `BUILDINGS` for raycasting.

## Fog-of-war rendering
evenodd fill rule: outer map rect filled dark (`rgba(0,0,10,0.88)`), vision polygon path appended → becomes a hole. No offscreen canvas needed.

Draw order: all world objects → fog overlay → post-fog teammate outlines → `ctx.restore()`.

**Why post-fog teammate outlines:** slivshchik outlines drawn before fog get hidden by it. They must be drawn after `drawFogOfWar` to pierce the darkness (§3.1.2 team awareness).

## Key design decisions

- **Dead player → ghost vision:** `visionPoly = null` → fog skipped → see everything. Lets the dead player watch the game play out.
- **Siphon active-drain stream visible through fog:** stream (from car → siphoner) is drawn in `drawCars` before fog. If siphoner is behind wall, stream disappears into darkness — intentional tension cue ("something's happening at this car").
- **⚠️ siphon-setup warning gated on visibility:** only shown if `pointInPolygon(player.pos, visionPoly)` returns true. Prevents revealing hidden siphoners.
- **Fellow-slivshchik outlines pierce fog:** drawn in `drawTeammateOutlines()` AFTER `drawFogOfWar`. Shows label "СЛ" so unambiguous even at distance.

## Constants
- `VISION_RADIUS = 420` px (≈12 m at ~35 px/m)
- `VISION_FOV_KHOZAIN = 140°`
- `VISION_FOV_SLIVSHCHIK = 160°`

## What NOT yet done (next steps)
- §2.5 Task mini-games (hold-timer only currently)
- §2.9 Sabotage system
- Peripheral vision ring (40% opacity for area outside cone but within radius) — marked as V2
