---
name: 95-Y vent and price fixes
description: Human slivshchik vent fix, vent flash visual, AI-95 price drift
---

## Human vent access fix
- **Rule:** Human slivshchik always has dumpster vent access; bot slivshchik vents are still gated by `BOT_DIFFICULTY_SETTINGS[gs.botDifficulty].useVents`
- **Why:** logic.ts used `useVents` flag for all players including human — §3.1.2 says vents are a core slivshchik ability
- **Where:** `updateInteractions()` in logic.ts, condition on line ~1208

## Vent flash visual
- `VENT_FLASH_DURATION = 0.45` constant in types.ts
- `ventFlashTimer: number` on Player type, initialized to 0 in state.ts
- Set to `VENT_FLASH_DURATION` on successful vent teleport in logic.ts
- Decremented by `updateVentFlash(dt)` each tick (called after `updateEmotes`)
- Rendered as expanding green ring + white inner flash in `drawPlayers()` renderer.ts

## AI-95 price drift
- `gs.ai95Price = 87 + Math.round(3*sin(time*0.08) + 2*sin(time*0.031))` — updated every tick
- Display-only: used in HUD, briefing overlay, and GameResults share card
- Oscillates ±5₽ around base 87₽
