# Agent Session Handoff — 95-Й Бакстаб

> **Last updated:** 2026-07-07
> **Project health:** 🟢 HEALTHY — TypeScript clean, game workflow running

---

## How to use this file

Read this file at the start of every session. It contains the authoritative implementation
status vs. the Vol I design doc. Do not re-audit from scratch — update this file as you
complete or discover gaps.

---

## Validation commands (run before marking any task done)

```bash
pnpm --filter @workspace/game run typecheck   # must be clean
```

Workflow name (never create a duplicate): `artifacts/game: web`
Design doc (source of truth): `attached_assets/1_Game_DOC_1783433356403.md` (1992 lines)

---

## Codebase orientation

| Area | Entry point | Notes |
|------|-------------|-------|
| Game state | `artifacts/game/src/game/state.ts` | singleton `gs`, mutated at 60fps |
| Game loop / interactions | `artifacts/game/src/game/logic.ts` | ~1560 lines |
| Bot AI | `artifacts/game/src/game/botAI.ts` | Khozain + Slivshchik bots |
| Types + constants | `artifacts/game/src/game/types.ts` | all gameplay constants |
| Renderer | `artifacts/game/src/game/renderer.ts` | Canvas 2D, fog-of-war, sabotage visuals |
| Vision system | `artifacts/game/src/game/vision.ts` | raycasting fog-of-war |
| Audio | `artifacts/game/src/game/audio.ts` | Web Audio API, 18/30 sounds |
| HUD | `artifacts/game/src/components/HUD.tsx` | React overlay at 10Hz |
| Meeting screen | `artifacts/game/src/components/MeetingScreen.tsx` | voting/reveal UI |
| Task mini-games | `artifacts/game/src/components/TaskMiniGame.tsx` | all 5 mini-game UIs |
| Results screen | `artifacts/game/src/components/GameResults.tsx` | stats + share card PNG |
| Characters | `artifacts/game/src/data/characters.ts` | 10 chars, 10 voice lines each |
| Tasks | `artifacts/game/src/data/tasks.ts` | 10 task defs |
| Map | `artifacts/game/src/data/map.ts` | collision, spawns, valves, dumpsters |
| News ticker | `artifacts/game/src/data/ticker.ts` | 50 satirical headlines |
| Agent memory index | `.agents/memory/MEMORY.md` | architectural notes |

**Architecture note:** `gs` singleton (NOT Zustand). React HUD reads shallow snapshot at 10Hz.
Sprint suspicion uses module-level `_sprintTimer` Map in `botAI.ts` (outside Player type).

---

## Vol I Implementation Status — Section by Section

### §00 — Philosophy of Play
**N/A — reference doc only.** No code to implement.

---

### §01 — World Bible (~85% complete)

✅ Map zones: parking lot, entrance arch, playground, dumpsters, shawarma stand, flower beds, benches
✅ Vision blockers: cars, dumpsters, buildings all block raycasting
✅ 10 characters with names, colors, CharacterKey identifiers
✅ 50 news ticker headlines in `ticker.ts`
✅ Fuel price ticker in HUD (static AI-95 value)
✅ Sprint suspicion: Дядя Серёжа character key = `uncle_seryozha` (confirmed in botAI.ts)

⚠️ Character voice lines exist in `characters.ts` but bot chat during meetings uses the shared
   12-phrase wheel, not per-character lines (Денис should say "Смена горит." etc.)
❌ "Сегодня в ЖК" rotating flavor text on main menu — not implemented

---

### §02 — Core Gameplay Loop (~90% complete)

✅ All 5 phases: lobby → briefing → play → сходка → results
✅ Briefing: 5s countdown, role reveal text, skip button after 2s
✅ Play phase: 5 min base + 30s per completed task, 600s cap
✅ Sprint (hold Shift), stamina 5s sprint / 8s regen, crouch
✅ Flower bed 0.6× slow zones
✅ Virtual joystick (mobile)
✅ §2.3 Vision: raycasting fog-of-war, Сливщик teammate outlines pierce fog
✅ §2.4 Interactions: body report, car check, vent, babushka NPC, shawarma speed boost,
       immunity ticket, canister pickup
✅ §2.5 Tasks: 10 tasks, 7 with mini-games (tap_timing, rapid_tap, sequence, dial, letter),
       3 hold-timer; unity meter; task respawn; Сливщики get 0 unity gain
✅ §2.6 Siphoning: 4 phases, gurgle audio, canister drop/pickup/disposal, 15s cooldown,
       alarm_chaos masks gurgle
✅ §2.6 Ambush: 1.5s charge, body left, 25s cooldown, interrupted by witness → red outline
✅ §2.7 Сходка: 3 triggers, 60+30s timer, 12-phrase chat wheel, plurality vote,
       tie = no ejection, skip vote, 20 ejection texts, role reveal, 30s meeting cooldown
✅ §2.8 Win conditions: unity 100%, all drained, all Сливщики ejected, count parity
✅ §2.9 Sabotage: all 4 (babushka_cerberus, pipe_burst, chat_offline, alarm_chaos)
       with distinct SFX, visuals, and resolution mechanics

⚠️ Sprint is hold-to-sprint (doc §13.1 says toggle)
⚠️ Ejection cinematic is a text screen — doc specifies 5s animated trash-chute animation
⚠️ Tasks 11–20 from doc are abbreviated specs flagged as "full specs in Volume II" — absent,
   and correctly so (not Vol I scope). Current 10 tasks cover all fully-specced Vol I tasks.
❌ Сливщик fake-task mini-game UI — doc says fake animation shows (but adds 0% unity).
   Currently Сливщики simply cannot interact with tasks at all.

---

### §03 — Game Systems

✅ §3.1.1 Хозяева role fully implemented
✅ §3.1.2 Сливщики: siphon, ambush, sabotage, teammate outlines, dumpster vents
✅ §3.1.3 Neutrals: all 3 roles
  - Дворник Ахмет: collect 3 canisters → win; canister highlight
  - Участковый: investigate body; win by correct vote
  - Барсик: meow ability, canister knock, survive-to-win

❌ §3.2 Economy (Бабки, Telegram Stars, Талоны) — no currency, no persistence
❌ §3.3 Battle Pass — no tier system, no XP tracking
❌ §3.4 Inventory & Cosmetics — no hats/pets/skins; characters are fixed colored circles
❌ §3.5 Daily Challenge System — no daily seed, no challenges, no daily leaderboard
❌ §3.6 Achievements (50) — no tracking or display

---

### §04 — AI Architecture (~80% complete)

✅ §4.1 Behavior tree: dead → meeting → role branch → fallback wander
✅ §4.2 Сливщик AI: siphon, ambush, sabotage, fake-task (wanders to terminal)
✅ Difficulty tiers: Easy / Medium / Hard / Nightmare (probability gates per action)
✅ Bot valve-fixing during pipe_burst (highest-priority khozain behavior)
✅ §4.3 Suspicion system:
  - +0.25 if caught siphoning (in act)
  - +0.1/dt if near drained car
  - +0.04 one-shot after 3s continuous sprint within 300px (via _sprintTimer Map)
  - −0.05/dt for uncle_seryozha character (ageism bias satire)
✅ §4.4 Meeting: vote for highest suspicion > 0.3 threshold; send chat phrases

⚠️ Bot pathfinding is direct movement + obstacle avoidance, NOT A* on navmesh
⚠️ Hard/Nightmare bots do not actually use dumpster vents (vent call missing from botAI.ts)
⚠️ Bot chat uses shared 12-phrase wheel, not character-specific voice lines
❌ suspicion += 0.05 if player skipped task terminal without completing — not implemented
❌ suspicion −= 0.1 if player completed task nearby — not implemented

---

### §05 — Multiplayer Architecture (~30% complete)

✅ WebSocket room system in `server/room.ts` + `server/gameActions.ts`
✅ Room code creation and joining
✅ Host reassignment on disconnect

⚠️ NOT truly authoritative — game logic runs client-side. Clients can diverge.
   Suitable for friends-play; not cheat-proof.
❌ Lag compensation (client-side prediction, interpolation, rewind) — not implemented
❌ Reconnection → AI bot takeover — disconnected player just disappears
❌ Quick Play matchmaking queue — room-code only, no global queue
❌ Server-side anti-cheat validation (movement speed, distance, cooldowns)
❌ MessagePack encoding — uses JSON (3× larger, negligible at these player counts)

---

### §06 — Technical Architecture

✅ React 18 + TypeScript, Canvas 2D, Vite, Node.js WebSocket server
✅ Canvas at 60fps, React HUD at 10Hz, singleton gs (not Zustand — intentional for perf)
✅ pnpm monorepo (adapted from doc's npm spec, correct for Replit)

⚠️ Tailwind not used (inline styles throughout)
❌ PostgreSQL — no database at all; all state in-memory per session
❌ Redis — not implemented
❌ Zustand — replaced by gs singleton (acceptable architectural deviation)

---

### §07 — Art Direction (~60% complete)

✅ Bright, saturated, cartoon style; color palette matches doc spec
✅ No dark vignettes, film grain, or desaturation
✅ Characters top-down readable as colored circles with emoji overlays
✅ Basic walk bob animation (±2px), sprint visual feedback

⚠️ No actual sprite PNG files — characters/cars drawn as Canvas 2D primitives
⚠️ Siphoning "crouch" is phase-state-indicated, not a sprite swap
⚠️ No 4-frame walk cycle animation per character

---

### §08 — Audio Direction (~40% complete)

❌ Background music — NONE. Doc specifies 3 tracks (menu lo-fi, play tense, сходка tango)
   and a dynamic "rumble layer" that fades in when siphon is nearby. All absent.

**SFX: 18 of 30 implemented** (all synthesized via Web Audio API):

✅ Implemented: siphon_gurgle, siphon_complete, alarm_button, ambush (kill),
   body_found, meeting_horn, vote_cast, ejection, task_complete, ui_click,
   canister_drop, canister_pickup, win_owners, win_slivshchiki,
   pipe_burst_sfx, chat_offline_sfx, alarm_chaos_sfx, babushka_cerberus_sfx

❌ Missing (12): ui_hover, footstep_asphalt, footstep_grass, car_door, engine_start,
   tesla_zap, trap_trigger, bot_death, player_death, shawarma_buy,
   grandma_escort, vote_skip, fuel_lock

---

### §09 — Viral Mechanics (~20% complete)

✅ §9.1 Share card: client-side PNG generation via Canvas API; stats + download link
⚠️ §9.1 Missing: @fuel_fuel_fuel_bot CTA text in share card; Telegram WebApp share action

❌ §9.2 Replay buffer ("Бакстаб Момент") — no circular frame buffer, no GIF export
❌ §9.3 Leaderboards (daily, all-time, friends) — not implemented
❌ §9.4 Social hooks (challenge share, friend invite deep links) — not implemented

---

### §10 — Monetization (~15% complete)

✅ §10.2 Immunity Ticket power-up: found in courtyard, 60s fuel lock, golden shield visual
⚠️ §10.2 End-game CTA (@fuel_fuel_fuel_bot text on results screen) — not confirmed present

❌ Telegram Stars purchasing flow — not implemented
❌ Battle Pass commerce — not implemented
❌ Fuel ticket account linking — not implemented

---

### §11–12 — LiveOps & Launch Strategy
**N/A — operations/business docs. No implementation scope.**

---

### §13 — Accessibility (~25% complete)

✅ Minimap (always visible top-right)
✅ Siphon audio visual indicator (⚠️ pulsing panel in HUD when gurgle audible within 8m)
✅ Tap zones appropriately sized

❌ Colorblind mode (fuel liquid green → blue toggle) — not implemented
❌ Text size options (3 levels) — not implemented
❌ High contrast mode — not implemented
❌ Sprint as toggle (currently hold-to-sprint, doc says toggle) — not implemented
❌ Auto-interact (2s proximity auto-trigger, optional) — not implemented
❌ Subtitles for voice lines during сходка — not implemented
❌ Volume controls (master / music / SFX sliders) — not implemented
❌ "Что делать?" (What to do?) current objective button — not implemented
❌ Simplified chat wheel for new players (6 phrases) — not implemented

**§13.2 Localization:** Russian throughout ✅. English UI not implemented ❌.

---

### §14–17 — Ethical Design / QA / Team / Final Word
**N/A — manifesto, QA checklist, production planning, mission statement.**

---

## Priority gap list for next sessions

Ordered by gameplay impact (highest first):

### High impact — gameplay gaps
1. **Background music** (§8.1) — 3 tracks + dynamic rumble layer. Largest single missing
   atmosphere feature. Affects every phase of play.
2. **Сливщик fake-task animation** (§2.5) — they should visually pretend to do tasks
   (animate identically, add 0%). Currently they just can't interact.
3. **Sprint toggle** (§13.1) — change hold-Shift to toggle for better one-handed mobile play.
4. **Bot vent usage** (§4.2 Hard/Nightmare) — bots don't teleport between dumpsters.
5. **Missing bot suspicion modifiers** (§4.3):
   - task-skip suspicion raise (+0.05)
   - task-completion suspicion reduce (−0.1)
6. **Character voice lines in bot chat** (§4.4 / §1.3) — bots use generic phrases;
   should use their character's voice line set.

### Medium impact — missing SFX (§8.2, 12 sounds)
7. `vote_skip`, `fuel_lock`, `shawarma_buy`, `grandma_escort` — contextual one-shots
8. `player_death`, `bot_death` — ambush/ejection moments
9. `footstep_asphalt`, `footstep_grass` — movement ambience (requires per-step trigger)
10. `ui_hover`, `car_door`, `engine_start`, `tesla_zap` — UI + interaction polish

### Low impact — platform features (require backend infrastructure)
11. Economy / Бабки / Battle Pass / Achievements (§3.2–3.6) — needs PostgreSQL
12. Leaderboards (§9.3) — needs Redis sorted sets
13. Telegram WebApp integration (Stars purchases, share action, deep links)
14. Authoritative server + anti-cheat (§5.1, §5.6) — full architecture change
15. Colorblind mode / text size / volume controls (§13.1) — accessibility settings UI
16. Replay buffer / GIF export (§9.2) — viral mechanic
17. Trash-chute ejection cinematic (§2.7.4) — animated 5s cinematic
18. "Что делать?" objective button (§13.1) — HUD addition
19. 10 remaining tasks (§2.5, tasks 11–20) — Vol II scope

---

## Recent session changes (2026-07-07)

- `audio.ts` — Added 5 new SoundName entries + synthesized methods:
  `canister_pickup` (metallic clink), `pipe_burst_sfx` (water rush+thud),
  `chat_offline_sfx` (modem chirp), `alarm_chaos_sfx` (overlapping car alarms),
  `babushka_cerberus_sfx` (sawtooth stabs)
- `logic.ts` — `spawnSabotage()` now plays distinct sound per sabotage key (not generic
  alarm_button for all); `canister_pickup` sound wired at human canister pickup
- `botAI.ts` — Added `_sprintTimer: Map<string, number>` for §4.3 sprint suspicion
  (accumulates per-bot-per-target; bump of 0.04 fires only after 3s continuous sprint,
  then resets); added Дядя Серёжа bias (−0.05/dt decay for uncle_seryozha character)
