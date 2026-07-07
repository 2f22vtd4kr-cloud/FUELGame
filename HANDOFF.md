# 95-Й Бакстаб — Session Handoff

> The authoritative handoff lives at `.agents/HANDOFF.md` — read that file first.
> This file is a quick summary for humans browsing the repo root.

---

## What is this project

**95-Й Бакстаб** — Among Us-style social deduction game set in a Russian courtyard.
Players are either Хозяева (owners protecting their car fuel) or Сливщики (drainers
stealing it). React + Canvas 2D, pnpm monorepo, bots with behavior trees.

Design bible: `attached_assets/1_Game_DOC_1783433356403.md` (1992 lines, source of truth)

---

## Current state: Vol I gameplay is ~85% complete

The core loop is fully playable end-to-end:
- Lobby → Briefing → Play → Сходка (meeting) → Ejection → Results
- All 4 sabotages working (Бабушка-Цербер, Прорвало трубу, ЖК Чат, Сигнализация)
- All 5 task mini-game types (tap_timing, rapid_tap, sequence, dial, letter)
- All 3 neutral roles (Дворник, Участковый, Барсик)
- Raycasting fog-of-war vision system
- Bot AI with difficulty tiers + suspicion system
- 18/30 SFX synthesized via Web Audio API
- Share card PNG generation at match end

## What is NOT yet implemented

**Gameplay gaps (in priority order):**
1. Background music — no music at any phase (doc §8.1 specifies 3 tracks)
2. Сливщик fake-task animation (they should visually pretend to do tasks)
3. Sprint toggle vs hold (§13.1)
4. Bot vent usage (Hard/Nightmare difficulty)
5. 2 missing bot suspicion modifiers (task-skip +0.05, task-completion −0.1)
6. 12 missing SFX (footsteps, player/bot death, shawarma buy, etc.)

**Platform features (require backend infrastructure — none of these exist):**
- Economy / Бабки / Battle Pass / Achievements
- Leaderboards, daily challenges
- Telegram WebApp integration (Stars payments, share action, deep links)
- Authoritative server + anti-cheat (currently client-side logic)
- Colorblind mode, text size options, volume controls (§13.1 accessibility)
- Replay buffer / GIF export (§9.2)
- PostgreSQL + Redis (no database — all state is in-memory per session)

See `.agents/HANDOFF.md` for the full section-by-section breakdown (§00–§17).

---

## Key commands

```bash
# TypeCheck
pnpm --filter @workspace/game run typecheck

# Game workflow (never create a duplicate)
# Workflow name: "artifacts/game: web"
```

---

## Key files

| File | Purpose |
|------|---------|
| `artifacts/game/src/game/logic.ts` | Game loop, all interactions (~1560 lines) |
| `artifacts/game/src/game/botAI.ts` | Bot behavior trees |
| `artifacts/game/src/game/audio.ts` | Web Audio SFX (18/30 sounds) |
| `artifacts/game/src/game/types.ts` | All types + constants |
| `artifacts/game/src/game/vision.ts` | Raycasting fog-of-war |
| `artifacts/game/src/game/renderer.ts` | Canvas 2D draw calls |
| `artifacts/game/src/components/HUD.tsx` | React HUD overlay |
| `artifacts/game/src/components/TaskMiniGame.tsx` | All 5 mini-game UIs |
| `artifacts/game/src/components/GameResults.tsx` | Results + share card |
| `artifacts/game/src/data/tasks.ts` | 10 task definitions |
| `artifacts/game/src/data/ticker.ts` | 50 news headlines |
| `.agents/HANDOFF.md` | Full section-by-section gap analysis |
| `.agents/memory/MEMORY.md` | Architectural memory index |
