# 95-Й Бакстаб — Session Handoff

> Design bible: `attached_assets/1_Game_DOC_1783454681616.md` (1993 lines, §00–§17, source of truth)

---

## Project overview

**95-Й Бакстаб** — Among Us-style social deduction game set in a Russian courtyard (ЖК «Цветочные Поляны»). Players are Хозяева (protecting car fuel) or Сливщики (siphoning it). React 19 + Canvas 2D, pnpm monorepo, bots with behavior trees, authoritative WebSocket server, PostgreSQL via Drizzle.

---

## §00–§17 Doc vs. Implementation: Full Comparison

### §00 — Philosophy of Play ✅
All 7 creative pillars upheld in implementation. Conceptual only — no code gaps.

---

### §01 — World Bible

| Item | Status | Notes |
|---|---|---|
| §1.1 Setting (ЖК, 2026, 85₽/litre) | ✅ | Briefing text and HUD ticker match |
| §1.2 Map — 1920×1920px (60m × 32px/m) | ⚠️ Scaled | Implemented at **1200×900px**. All zones present (parking, arch, playground, dumpsters, shawarma, benches, flowerbeds) — proportions differ from spec |
| §1.3 Cast — 10 characters + voice lines | ✅ | All 10 (Denis → Barsik), voice lines match |
| §1.4 Satire layer — fuel ticker + news + "Сегодня в ЖК" | ✅ | All three confirmed in `Lobby.tsx` and HUD |
| §1.5 News ticker — 50 headlines | ✅ | `src/data/ticker.ts` — corpus present |

---

### §02 — Core Gameplay Loop

**§2.1 Phase Architecture** ✅ Lobby → Role Assignment → Briefing (5s, skippable after 2s) → Play → Сходка → Resolution → loop. Auto-start at 8 players ✅.

**§2.2 Movement & Camera** ✅
- Walk 3.5 m/s, Sprint 5.5 m/s (Shift toggle, 5s stamina, 8s regen) ✅
- Crouch 1.8 m/s + stealth ✅
- Emote wheel: 4 emotes (👋 🤔 🚨 😂), `PLAY_EMOTES` constant confirmed ✅

**§2.3 Vision System** ✅
- Хозяин 140°, Сливщик 160° — exact match (`VISION_FOV_KHOZAIN`, `VISION_FOV_SLIVSHCHIK`)
- 72 rays (spec: 36 — implementation is better)
- 12m radius, wall/car/dumpster occlusion ✅ Teammate outlines pierce fog ✅

**§2.4 Interaction Model** ✅ Car prompt, body report, alarm, task terminals, canister, shawarma speed boost. Car immunity lock ✅.

**§2.5 Task System** ✅ All **20 tasks** implemented. Unity Meter, fake-task animation for Сливщики ✅.

**§2.6 Siphoning System** ✅ All 4 phases, 15s siphon cooldown, 25s ambush cooldown, canister carry slows, dumpster disposal ✅.

**§2.7 Сходка** ✅ All 3 triggers, 60s discussion + 30s voting, quick-chat 12 phrases, skip by majority, 20 ejection cinematics ✅.

**§2.8 Win Conditions** ✅ All 5 win conditions implemented.

**§2.9 Sabotage System** ✅ All 4 doc sabotages implemented:
| Sabotage | Key | Status |
|---|---|---|
| Бабушка-Цербер | `babushka_cerberus` | ✅ |
| Прорвало трубу | `pipe_burst` | ✅ |
| ЖК Чат Офлайн | `chat_offline` | ✅ |
| Сигнализация хаос | `alarm_chaos` | ✅ |
> Also has `lights_out` (not in doc — added during dev).

---

### §03 — Game Systems

| Item | Status |
|---|---|
| §3.1 Roles — Хозяева + Сливщики | ✅ |
| §3.1 Vent system | ✅ |
| §3.1.3 Neutral roles — Дворник, Участковый, Барсик | ✅ |
| §3.2 Economy — Бабки | ❌ DB schema only (`babki` column in `users`), no in-game earn/spend UI |
| §3.2 Telegram Stars | ❌ Not implemented |
| §3.2 Талоны | ❌ Not implemented |
| §3.3 Battle Pass | ❌ Not implemented |
| §3.4 Inventory & Cosmetics | ❌ DB schema only, no in-game UI |
| §3.5 Daily Challenges | ❌ Not implemented |
| §3.6 Achievements (50 items) | ❌ DB schema only, no unlock logic or UI |

---

### §04 — AI Architecture ✅

Behavior tree, Сливщик AI (siphon/ambush/sabotage/fake-task), Хозяин AI (suspicion vector, witness report), 4 difficulty tiers, Кошмар stalking, role-aware meeting chat — all implemented.

---

### §05 — Multiplayer Architecture

| Item | Status |
|---|---|
| §5.1 Authoritative server | ✅ |
| §5.2 WebSocket protocol, 20Hz tick | ✅ |
| §5.3 Client-side prediction + server correction | ✅ (interpolation unconfirmed) |
| §5.4 Reconnection → AI takeover, host reassign | ✅ |
| §5.5 Custom Room (room code) | ✅ |
| **§5.5 Quick Play matchmaking** | **✅ Implemented in current session** |
| §5.6 Server-side anti-cheat | ✅ |

---

### §06 — Technical Architecture

| Item | Status | Notes |
|---|---|---|
| React 19, Canvas 2D | ✅ | (spec said React 18 — 19 is better) |
| Zustand | ⚠️ Replaced | Singleton `gs` mutated at 60fps — intentional architectural decision |
| PostgreSQL + Drizzle | ✅ | Schema pushed |
| Redis 7 | ❌ | In-memory `Map` — rooms lost on server restart; no horizontal scale |
| `ws` library | ✅ | |
| pnpm monorepo | ✅ | |
| DB schema — missing fields | ⚠️ | `users` missing `photo_url`, `stars`, `battle_pass_tier`, `battle_pass_xp`, `battle_pass_premium` |

---

### §07 — Art Direction

| Item | Status |
|---|---|
| Color palette (#87CEEB sky, #4CAF50 grass, Telegram panels) | ✅ |
| Sprite sheets (320 character sprites, 48 car sprites) | ❌ Using **emoji circles** — single largest visual gap |
| Walk/siphon animation | ✅ (simplified) |
| Ejection cinematic (5s, 24fps sprite) | ⚠️ Text overlay only |

---

### §08 — Audio Direction

| Item | Status |
|---|---|
| §8.1 Music (menu/play/meeting, dynamic intensity) | ✅ Web Audio API synthesis |
| §8.2 SFX — ~20 of 30 confirmed | ⚠️ Missing: footsteps (asphalt/grass), `car_door`, `engine_start`, `tesla_zap`, `vote_skip`, `fuel_lock`, `ui_hover`, `bot_death`, `player_death` |

---

### §09 — Viral Mechanics

| Item | Status |
|---|---|
| §9.1 Share card PNG (1080×1080) | ✅ |
| §9.2 Replay buffer "Бакстаб Момент" | ✅ `replayBuffer.ts` — 10s circular buffer |
| §9.3 Leaderboards | ❌ DB schema exists, no API or UI |
| §9.4 Social hooks (first-win share, invite links) | ❌ |

---

### §10 — Monetization

| Item | Status |
|---|---|
| §10.2 Дядя Серёжа CTA (`@fuel_fuel_fuel_bot`) | ✅ Win/lose screen CTA present |
| §10.2 Immunity Ticket in-game power-up | ✅ Spawn near dumpsters, locks fuel 60s |
| §10.2 Account-linking flow | ❌ |
| §10.3 Telegram Stars purchase flow | ❌ |
| §10.4 Battle Pass economics | ❌ |

---

### §11–§17

| Section | Status |
|---|---|
| §11 LiveOps (daily challenge rotation, seasonal events) | ❌ |
| §12 Launch Strategy | N/A |
| §13 Accessibility (colorblind mode, text size, subtitles) | ❌ Partial (minimap ✅, rest ❌) |
| §14 Ethical Design | ✅ Upheld |
| §15 QA Standards | ⚠️ Manual only |
| §16–§17 Team / Final Word | N/A |

---

## Priority gap list (current)

| Priority | Gap | Section |
|---|---|---|
| 🔴 High | No sprite art — emoji circles only | §7.3 |
| 🔴 High | No Redis — rooms lost on server restart | §6.4 |
| 🟡 Medium | Economy (Бабки earn/spend) not wired up | §3.2 |
| 🟡 Medium | DB schema missing `stars`, `battle_pass_*`, `photo_url` | §6.3 |
| 🟡 Medium | Achievements, Daily Challenges, Leaderboards UI | §3.5/3.6/9.3 |
| 🟡 Medium | Inventory/cosmetics — schema only, no in-game UI | §3.4 |
| 🟡 Medium | Telegram Stars purchase flow | §10.3 |
| 🟡 Medium | ~10 SFX not yet synthesized | §8.2 |
| 🟢 Low | Client interpolation of remote players unconfirmed | §5.3 |
| 🟢 Low | Ejection cinematic — text overlay, not sprite animation | §7.4 |
| 🟢 Low | Accessibility features (colorblind, subtitles, text size) | §13 |

---

## Key commands

```bash
# TypeCheck
pnpm --filter @workspace/game run typecheck

# Workflows (never create duplicates)
# "artifacts/game: web"   → PORT=24631
# "artifacts/api-server: api" → PORT=3000
```

---

## Key files

| File | Purpose |
|------|---------|
| `artifacts/game/src/game/logic.ts` | Game loop, all interactions |
| `artifacts/game/src/game/botAI.ts` | Bot behavior trees |
| `artifacts/game/src/game/audio.ts` | Web Audio SFX |
| `artifacts/game/src/game/types.ts` | All types + constants |
| `artifacts/game/src/game/vision.ts` | §2.3 raycasting fog-of-war |
| `artifacts/game/src/game/renderer.ts` | Canvas 2D draw calls |
| `artifacts/game/src/game/network.ts` | WS client; `GameNetwork` class |
| `artifacts/game/src/components/HUD.tsx` | React HUD overlay |
| `artifacts/game/src/components/Lobby.tsx` | Main lobby + single-player start |
| `artifacts/game/src/components/MultiplayerLobby.tsx` | Multiplayer: Quick Play queue + Custom Room |
| `artifacts/game/src/components/MeetingScreen.tsx` | Vote UI |
| `artifacts/game/src/components/GameResults.tsx` | Results + share card |
| `artifacts/game/src/data/tasks.ts` | 20 task definitions |
| `artifacts/game/src/data/ticker.ts` | 50 news headlines |
| `artifacts/api-server/src/game/wsHandler.ts` | WS server: create/join/quick-join/input |
| `artifacts/api-server/src/game/room.ts` | `GameRoom` — tick/broadcast/auto-start |
| `lib/db/src/schema/index.ts` | Drizzle schema |
| `.agents/memory/MEMORY.md` | Architectural memory index |
