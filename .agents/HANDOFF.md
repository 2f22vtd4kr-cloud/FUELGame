# Agent Session Handoff

> **Last updated:** 2026-07-07 10:22 UTC
> **Project health:** 🟢 HEALTHY — all TypeScript checks passed, all workflows running

---

## How to use this file

This file is written at the end of every agent session by `scripts/agents/wrap-up.sh`.
At the **start** of each new session, read this file first to know exactly where to pick up.
After finishing work, run `bash scripts/agents/wrap-up.sh` and update the sections below.

---

## Current project health

### TypeScript
  - ✅ game
  - ✅ api-server
  - ✅ mockup-sandbox

### Workflows
  - `artifacts/game: web` → `pnpm --filter @workspace/game run dev` — **RUNNING**
  - `artifacts/api-server: API Server` → `pnpm --filter @workspace/api-server run dev` — **RUNNING**
  - `artifacts/mockup-sandbox: Component Preview Server` — **RUNNING**

### Validation commands
```bash
# TypeScript — all must be clean
cd artifacts/game        && pnpm tsc --noEmit && cd ../..
cd artifacts/api-server  && pnpm tsc --noEmit && cd ../..

# Full wrap-up (runs all checks + rewrites this file skeleton)
bash scripts/agents/wrap-up.sh
```

---

## ✅ What is complete and working

### Game — 95-Й Бакстаб (Volume I, fully doc-aligned)
All 12 bugs and gaps vs the Volume I design doc have been fixed:

| Fix | Detail |
|-----|--------|
| `SIPHON_RATE` | Corrected 4%/s → 14.3%/s (full drain in 7s per §2.4) |
| Siphon cooldown | 15s cooldown on every end path (complete/cancel/interrupt), centralized in `stopSiphon()` |
| Bot siphon cooldown | `siphonCooldown` decremented for bots in `updateBots()` |
| Bot canister disposal | `dropCanister()` sets `isCarryingCanister = true` for bots; bot AI walks to dumpster |
| Win condition timing | `executeAmbush()` now calls `checkWinConditions()` immediately |
| Body rendering | Bodies stay visible in renderer after being reported (removed the skip-if-reported logic) |
| Meeting reveal | Only the ejected player's role is revealed, not all players |
| Vote count hiding | Vote chips hidden during voting phase, shown only at reveal (§2.7.4) |
| Ambush mid-charge check | Re-checks lone condition every tick during charge; aborts + marks suspected if witness enters |
| Voice lines | All 10 characters expanded to 10 voice lines each (§1.3) |
| Denis description | Fixed to "Водитель Яндекс Такси" (was "Курьер Яндекс Доставки") |
| Ejection texts | Character-specific texts from §2.7.6, keyed by character ID |
| Quick-chat phrases | Aligned to exact §2.7.5 12-phrase set (clock positions 12→11) |

### Wrap-up system (this session)
- `scripts/agents/wrap-up.sh` — validates TypeScript + writes this handoff file
- `.local/skills/session-wrap-up/SKILL.md` — teaches agents when/how to use the system
- `.agents/HANDOFF.md` — this file, updated each session

---

## 🚧 Work in progress — continue here next session

### Proposed tasks (user has not started these yet)

There are 3 proposed tasks visible in the task queue. **Read the task queue before starting any of them.**

| Task ref | Title | Status |
|----------|-------|--------|
| #2 | Connect backend so game progress can be saved between sessions | PROPOSED |
| #3 | Add multiplayer so real players can join the same game | PROPOSED |
| #4 | Fix the failing game workflow so it loads reliably | PROPOSED |

> Note: Task #4 ("Fix failing workflow") is now likely resolved — the workflow is currently RUNNING.
> Confirm with the user whether they still want this task, or mark it done.

### Next step — start here

**No active in-progress work.** The last session completed all Volume I doc-alignment fixes cleanly.

Ask the user which task to tackle next, or read `.local/tasks/` for any queued task files before starting.

### Known blockers / open questions
- Task #2 (save game progress): the API server is running but has no game session endpoints yet. Needs DB schema decision before implementation.
- Task #3 (multiplayer): requires architecture decision — WebSocket vs WebRTC. No design exists yet.

---

## 🗺 Codebase orientation

| Area | Entry point | Notes |
|------|-------------|-------|
| Game frontend | `artifacts/game/src/` | React + Canvas 2D |
| Game state | `artifacts/game/src/game/state.ts` | singleton `gs`, mutated at 60fps |
| Game logic | `artifacts/game/src/game/logic.ts` | `tickGame()` called at 60fps |
| Bot AI | `artifacts/game/src/game/botAI.ts` | Khozain + Slivshchik bots |
| Types + constants | `artifacts/game/src/game/types.ts` | all gameplay constants here |
| Renderer | `artifacts/game/src/game/renderer.ts` | Canvas 2D draw calls |
| HUD | `artifacts/game/src/components/HUD.tsx` | React overlay at 10Hz |
| Meeting screen | `artifacts/game/src/components/MeetingScreen.tsx` | voting/reveal UI |
| Characters | `artifacts/game/src/data/characters.ts` | 10 chars, 10 voice lines each |
| Map | `artifacts/game/src/data/map.ts` | collision, spawns, dumpsters |
| API server | `artifacts/api-server/src/` | Fastify, currently no game routes |
| Design doc | `attached_assets/1_Game_DOC_*.md` | Volume I spec — source of truth |
| Agent memory | `.agents/memory/MEMORY.md` | architectural notes index |

---

## Recent changes (this session)

- `artifacts/game/src/game/types.ts` — `SIPHON_RATE` 4→14.3; added `siphonCooldown` field to `Player`
- `artifacts/game/src/game/state.ts` — initialized `siphonCooldown: 0` on player spawn
- `artifacts/game/src/game/logic.ts` — siphon cooldown in all paths; ambush mid-charge recheck; `executeAmbush` calls `checkWinConditions`; character-specific ejection texts; `dropCanister` sets `isCarryingCanister` for bots
- `artifacts/game/src/game/botAI.ts` — `siphonCooldown` decremented; canister disposal AI; `DUMPSTER_POSITIONS` import
- `artifacts/game/src/game/renderer.ts` — bodies stay visible after reported
- `artifacts/game/src/components/MeetingScreen.tsx` — vote chips hidden during voting; only ejected role revealed; §2.7.5 quick-chat phrases
- `artifacts/game/src/data/characters.ts` — Denis fixed to Taxi driver; all 10 chars expanded to 10 voice lines
- `scripts/agents/wrap-up.sh` — NEW: validation + handoff script
- `.local/skills/session-wrap-up/SKILL.md` — NEW: skill teaching agents to use this system
