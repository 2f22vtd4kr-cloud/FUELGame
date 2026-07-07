# 95-Й Бакстаб — Session Handoff

## What was done in the last session

### §2.3 Vision System (raycasting fog-of-war) — IMPLEMENTED

**New file:** `artifacts/game/src/game/vision.ts`
- Raycasting visibility polygon: 72 uniform rays + extra corner rays (angle±ε) for sharp shadows
- `computeVisionPolygon(origin, facingAngle, fovDeg, maxRadius, obstacles)` → `Vec2[]`
- `pointInPolygon(px, py, poly)` — point-in-polygon test for visibility checks
- `buildVisionObstacles(visionBuildings, cars, dumpsters)` — assembles obstacle rect list
- Constants: `VISION_RADIUS=420px`, `VISION_FOV_KHOZAIN=140°`, `VISION_FOV_SLIVSHCHIK=160°`

**Updated:** `artifacts/game/src/data/map.ts`
- Added `VISION_BUILDINGS` — bottom wall split at entrance arch gap (x 450–750) so rays pass through the gate opening

**Updated:** `artifacts/game/src/game/renderer.ts`
- `renderGame` computes vision polygon once per frame for local player
- New `drawFogOfWar(ctx, poly)` — evenodd fill rule: outer rect filled dark, vision polygon punched as hole
- `drawPlayers` now takes `visionPoly: Vec2[] | null` param; gates the ⚠️ siphon-setup warning on visibility
- Dead local player → `visionPoly = null` → ghost vision (no fog)
- Siphon active-drain stream (green line) intentionally visible even if siphoner is in fog — you see "something happening" at the car
- Fellow-slivshchik red outline intentionally pierces fog (team awareness, same as Among Us)

---

## Implementation Status (updated)

### Done ✅
- Core phases (lobby → play → meeting → results)
- Movement (sprint/stamina, crouch, base speed)
- Siphoning (all 4 phases, gurgle audio, canister drop/pickup/disposal, 15s cooldown)
- Ambush (1.5s charge, body left, 25s cooldown)
- Сходка (3 triggers, teleport, 60+30s timer, 12-phrase chat, plurality vote, 20 ejection texts, role reveal)
- Win conditions (unity 100% / all Сливщики ejected / all cars 0% / count parity)
- Bot AI (behavior trees for both roles, suspicion, voice-line chat)
- 10 characters × 10 voice lines
- 50 news headlines, news ticker
- 8/30 SFX (Web Audio API)
- Minimap
- **§2.3 Vision system** (raycasting fog-of-war) ← JUST COMPLETED

### Next: §2.5 Task mini-games (highest remaining gameplay value)
Tasks currently use hold-timer only. 20 task definitions exist in `data/tasks.ts`. 
The doc specifies actual mini-game logic per task type. Recommend implementing 3-4 task mini-games:
1. **Шаурма** — tap rhythm (repeated button press)
2. **Домофон** — number sequence input
3. **Мусор** — direction sequence (mash buttons in order)
4. **Окно** — hold + release at correct time (timing)

### After tasks: §2.9 Sabotage system
None of the 4 sabotages exist yet:
- Reactor (gas leak): periodic event, players must fix
- Lights off: vision reduced further
- Comms: minimap/task list disabled
- Doors: sections locked off

---

## Key files
- `artifacts/game/src/game/vision.ts` — §2.3 vision system (NEW)
- `artifacts/game/src/game/types.ts` — all game types; `MAP_W=1200, MAP_H=900`
- `artifacts/game/src/game/state.ts` — singleton `gs`; `startGame()` initializes
- `artifacts/game/src/game/logic.ts` — `tickGame`, all interactions, win-condition
- `artifacts/game/src/game/renderer.ts` — Canvas 2D draw loop + fog-of-war
- `artifacts/game/src/game/botAI.ts` — bot behavior trees
- `artifacts/game/src/game/audio.ts` — Web Audio API SFX (8 sounds)
- `artifacts/game/src/data/map.ts` — zones, cars, tasks, decorations, `VISION_BUILDINGS`
- `artifacts/game/src/data/tasks.ts` — 20 task definitions (hold-timer only, no mini-games yet)
- `artifacts/game/src/data/characters.ts` — 10 characters with voice lines
- `artifacts/game/src/data/ticker.ts` — 50 satirical news headlines
- `artifacts/game/src/components/HUD.tsx` — React HUD overlay (10Hz snapshots)
- `artifacts/game/src/components/MeetingScreen.tsx` — vote UI
- `artifacts/game/src/components/Lobby.tsx` — character select + game settings
- `artifacts/game/src/components/GameCanvas.tsx` — mounts canvas, drives RAF loop

## Critical context for next session
- Coordinate system: 1200×900 canvas pixels (not doc's meter-based spec)
  - VISION_RADIUS=420px ≈ 12m; INTERACT_RADIUS=65px ≈ 1.5m
- `gs` singleton, NOT Zustand. React HUD reads shallow snapshot at 10Hz
- Vision polygon: `computeVisionPolygon` lives in `vision.ts`
- TypeCheck: `pnpm --filter @workspace/game run typecheck` — must pass before marking work done
- Workflow: `artifacts/game: web` (managed, do not create duplicate)
- Design bible: `attached_assets/1_Game_DOC_1783421374443.md` (1992 lines, source of truth)
