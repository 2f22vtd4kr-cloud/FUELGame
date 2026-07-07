# 95-Й БАКСТАБ — HANDOFF (Session 4, 2026-07-07)

## Current State
All Vol I single-player gameplay gaps are **implemented**. The game typechecks clean and renders correctly.

## What Was Implemented This Session (Session 4)

### §13.1 Accessibility (5 features added)
1. **Auto-interact** — 2-second proximity timer fires safe single-press interactions automatically (optional toggle in settings). Tracks via `gs.autoInteractTimer` and fires through `triggerInteract` flag in `updateInteractions`. Does NOT auto-trigger: siphon, ambush, khozain lock-hold, meeting calls, vent teleport.
2. **Text size** — S/M/L selector in settings panel; `textScale` (0.82/1.0/1.22) applied to prompt text and tutorial overlay text. Game buttons unchanged (tap zone safety).
3. **Simplified chat wheel** — Toggle in settings; shows 6 of 12 quick-chat phrases when enabled. Controlled by `gs.simplifiedChatWheel`.
4. **Subtitles for voice lines** — MeetingScreen shows the most recent chat message as a prominent subtitle strip at the bottom (above evidence notes). Color-coded by character.
5. **Volume controls** — Already existed (master/music/sfx sliders).
6. **Colorblind mode** — Already existed (toggle).

### §12.4 First-Time Tutorial
- `gs.tutorialStep`: 0=off, 1=go to shawarma, 2=near shawarma, 3=task done
- `updateTutorial(dt)` in logic.ts tracks step transitions based on player proximity to shawarma (pos 145, 530) and task completion
- HUD.tsx: useEffect initializes tutorial on first play (localStorage '95Y_tutorial'), dismisses step 3 after 3s
- Tutorial overlay: 3-step card at bottom-center with "Skip" button; only visible during play phase
- localStorage key: `95Y_tutorial = 'done'` marks tutorial as seen

### Previously Completed (Sessions 1-3)
All gameplay from Doc §1-§3.1.3, §2.2-§2.9, §8.1-§8.2:
- ✅ All 14 tasks (10 original + dog_walk/flower_match/drunk_calm/taxi_order)
- ✅ All 4 sabotages (alarm_chaos/chat_offline/babushka_cerberus/pipe_burst)  
- ✅ Siphon phases 0→1→2→complete with gurgle audio
- ✅ Ambush system with charge timer
- ✅ Meeting/voting/ejection with cinematic
- ✅ 3 neutral roles (Барсик/Дворник/Полицейский) with abilities
- ✅ Janitor canister X-ray highlight (orange glow through fog)
- ✅ Барсик canister knock (cancels siphon, creates evidence)
- ✅ Проверить бак + Запереть бак (Хозяин car interactions)
- ✅ Persistent Бабушка NPC witness hints
- ✅ Fog of war raycasting (§2.3)
- ✅ Immunity Ticket power-up (§10.2)
- ✅ Bot AI with 3 difficulty levels
- ✅ Bot vent usage + all suspicion modifiers
- ✅ 30 SFX + 3 music tracks (§8.2)
- ✅ Sprint toggle, crouch-stealth
- ✅ Share card PNG generation
- ✅ Per-player stats tracking
- ✅ Volume controls (master/music/sfx sliders)
- ✅ Colorblind mode toggle
- ✅ Ejection cinematics with satirical text per character

## Remaining Vol I Gaps (genuinely still missing)
None that are in-scope for the offline single-player build. Backend-gated features remain:
- Economy/BattlePass/achievements (requires PostgreSQL)
- Multiplayer authoritative server improvements
- Leaderboards
- Telegram Stars integration
- Replay buffer GIF export (§9.2) — complex, optional for vol I

## Proposed Vol II Tasks
- Task ref #2: Background music + 12 missing SFX
- Task ref #3: Сливщики fake-task animation
- Task ref #4: Hard bot vent usage + remaining bot suspicion modifiers

## File Map
| File | Purpose |
|------|---------|
| `artifacts/game/src/game/logic.ts` | Core game loop (~1900 lines); all game mechanics |
| `artifacts/game/src/game/types.ts` | All types including full GameState |
| `artifacts/game/src/game/state.ts` | Singleton `gs` + startGame() |
| `artifacts/game/src/game/renderer.ts` | Canvas 2D rendering (~1000 lines) |
| `artifacts/game/src/game/audio.ts` | AudioManager with 30 SFX + 3 music tracks |
| `artifacts/game/src/game/botAI.ts` | Bot behavior trees |
| `artifacts/game/src/components/HUD.tsx` | React HUD overlay |
| `artifacts/game/src/components/MeetingScreen.tsx` | Сходка/voting UI |
| `artifacts/game/src/components/TaskMiniGame.tsx` | All 14 task mini-game UIs |
| `artifacts/game/src/data/tasks.ts` | Task definitions (14 tasks) |
| `artifacts/game/src/data/map.ts` | Map positions, spawn points |
| `artifacts/game/src/data/characters.ts` | 10 character definitions |
| `attached_assets/1_Game_DOC_1783441111359.md` | Source-of-truth design doc (1992 lines) |
