---
name: 95-Y Vol1 gap mechanics
description: All Vol1 gap mechanics — briefing/flowerbeds/dumpster-vent/siphon-audio/crouch-stealth (session 1) + shawarma-boost/suspicion-voting/difficulty-tiers/emote-wheel/immunity-ticket (session 2)
---

## Briefing phase (§2.1)
- `gs.phase = 'briefing'` + `gs.briefingTimer = 5` set in `startGame()`
- `tickGame()` counts briefingTimer down; when ≤ 0, sets `gs.phase = 'play'`
- App.tsx drives AppPhase entirely from `snap.phase` — NO duplicate React timer

## Flower-bed slow zones (§1.2)
- `FLOWERBED_RECTS: Rect[]` in `map.ts` (3 rects centred on decoration positions)
- `isInFlowerBed(pos)` helper exported from `map.ts`
- Applied as `speedMult *= FLOWERBED_SLOW_MULT` (0.6) in `updateHumanPlayer` and `moveBot`

## Dumpster vent mechanic (§3.1.2)
- `ventCooldown` on Player; interaction block 4b in `updateInteractions`
- Key UX rule: on cooldown → show prompt but fall through; only block+return when vent is ready AND E pressed

## Siphon audio indicator (§13.1)
- `SIPHON_AUDIO_RADIUS = 280` px; computed in HUD, renders pulsing ⚠️ "СЛЫШЕН СЛИВ"

## Crouch stealth (§2.2)
- `crouchCheckPoly` at 70% FOV; crouching enemy in full cone but NOT crouch cone → 0.35 alpha

## Shawarma speed boost (§2.4)
- `speedBoostTimer: number` on Player (init 0 in state.ts)
- `completeTask` sets `speedBoostTimer = SHAWARMA_SPEED_BOOST_DURATION (10)` for khozain + shawarma defKey
- `updateHumanPlayer` applies `SHAWARMA_SPEED_BOOST_MULT (1.35)` while timer > 0, then decays

## Bot suspicion vector + voting (§4.3)
- `suspicion: Record<string, number>` on Player (init `{}` in state.ts)
- Khozain bots accumulate suspicion on: active siphons within 280px (+0.25), fleeing from slivshchik (continuous +0.15*dt), slivshchik near drained car (+0.08*dt)
- Suspicion decays at 0.01/s; clamped 0–1
- `castBotVotes` uses `pickBySuspicion(candidates, threshold=0.25)` — highest score above threshold wins
- Khozain bots: suspicion → random fallback if no data; skip controlled by `diff.skipVoteChance`
- Slivshchik bots: accuse khozain with highest suspicion → random khozain fallback (10% skip)

## Bot difficulty tiers (§4.2)
- `BotDifficulty = 'easy'|'medium'|'hard'|'nightmare'` in types.ts
- `BOT_DIFFICULTY_SETTINGS` in types.ts: ambushChance, sabotageChancePerFrame, useVents, fleeRadius, skipVoteChance
- `gs.botDifficulty` in GameState (init 'medium'); set by Lobby selector before startGame
- Lobby has 4-button grid selector with color-coded difficulty labels
- `updateSlivshchikBot` reads `BOT_DIFFICULTY_SETTINGS[gs.botDifficulty]` for ambush/sabotage chances
- `castBotVotes` reads `diff.skipVoteChance`

## Emote wheel UI (§2.2)
- `PLAY_EMOTES = ['👋','🤔','🚨','😂']` exported from logic.ts
- HUD has toggle button (bottom-right) + 2×2 emote grid overlay
- Calls `triggerEmote(gs.localPlayerId, emote)` on tap; wheel closes after selection
- Emote timer 3s (pre-existing `triggerEmote` implementation)

## Immunity Ticket (§10.2)
- `ImmunityTicket { id, pos }` interface in types.ts; `gs.immunityTickets: ImmunityTicket[]` in GameState
- Spawn: 70% per-match chance in `startGame()`, placed 40–80px right of a random dumpster
- Player field: `hasImmunityTicket: boolean` (init false)
- Pickup: interaction block 4c-i in `updateInteractions`; within CANISTER_RADIUS; E to pick up
- Use: interaction block 4c-ii; player holds ticket + near car (INTERACT_RADIUS) + car !hasImmunity + fuel>0; E applies 60s immunity (`IMMUNITY_TICKET_DURATION`)
- `updateImmunity(dt)` was already ticking `car.immunityTimer` in `tickGame` (pre-existing)
- Renderer: golden glow + 🎟️ icon + "ТАЛОН" label drawn by `drawImmunityTickets()`
- Immune cars: rotating dashed golden ring + 🛡️ icon + timer (drawn in `drawCars`)
- HUD badge: yellow banner "🎟️ ТАЛОН В РУКАХ" when `localPlayer.hasImmunityTicket`

## Architecture notes
- logic↔botAI circular import pre-exists; expanding it is safe as long as only side-effect-free helpers cross the boundary
- `getMostSuspectedId` exported from botAI.ts is a standalone utility (not imported by logic.ts after refactor — voting logic is self-contained using `pickBySuspicion` closure)
