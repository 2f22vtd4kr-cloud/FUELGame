---
name: 95-Y Vol1 gap mechanics
description: All Vol1 gap features implemented in the "Set up the imported project" task
---

## Features implemented

### Match timer (§2.1)
- `matchTimeLimit: number` on GameState (default 300s)
- Counts down in tickGame play phase; Сливщики win on expiry
- Task completion (`completeTask`) adds +30s (capped at 600s total)
- Bot task completion also extends via botAI.ts
- HUD shows countdown clock (not count-up); turns red at <60s

### Skip discussion by majority (§2.7.4)
- `skipDiscussionVotes: string[]` on MeetingState
- `submitSkipDiscussion(voterId)` exported from logic.ts and gameActions.ts
- `tickMeeting` advances to voting when skipVotes > aliveCount/2
- MeetingScreen shows "⏭️ К голосованию" button + progress counter
- api-server room.ts handles `skip_discussion` action for multiplayer parity

### Neutral roles (§3.1.3)
- `neutralRole: NeutralRole | null` and `barsikMeowCooldown`, `canistersCollected` on Player
- Assigned in startGame for 6+ player games (1 khozain gets neutral role)
- Барсик character gets 'barsik' neutral if in game; otherwise random khozain
- `updateNeutralMechanics(dt)` called each play tick
- Barsik auto-meows when within 200px of active siphon (12s cooldown); manual meow via HUD (15s cd)
- Meow interrupts the siphon and knocks canister (creates evidence)
- Участковый: investigate body ability (reveals satirical clue)
- Дворник: collect canister ability (removes from world, no carry state)
- HUD shows neutral role buttons + emoji on role badge
- Janitor does NOT use isCarryingCanister (that's slivshchik-only)

### Bot pipe_burst resolution
- `updateKhozainBot` priority-0 check for active pipe_burst
- Bot finds nearest unfinished valve, moves to it, increments progress
- botState 'fix_sabotage' prevents other behaviors while fixing
- Independent resolution check in updateSabotages catches bot-driven completions

### Canister-carrying slivshchik → Хозяин meeting (§2.4)
- In updateInteractions: khozain within 280px of slivshchik carrying canister
- Prompt shown; E calls meeting with reason 'alarm'

### Per-player stats (§9.1)
- `fuelSiphoned: number` tracked in updateSiphoning (delta per frame)
- `tasksCompleted: number` tracked in completeTask (khozain) and botAI task completion
- Displayed in GameResults per-player breakdown table

### Барсик smaller circle
- renderer.ts: `playerRadius = player.character === 'barsik' ? 10 : 14`
- facingDist also adjusted proportionally

### Results screen & share card (§9.1)
- GameResults.tsx has per-player breakdown with fuelSiphoned/tasksCompleted
- "📸 Скачать карточку результата" button generates 1080×1080 PNG via Canvas API
- PNG includes match stats, personal stats, @fuel_fuel_fuel_bot CTA

## Sync notes
- api-server has its own types.ts/state.ts/logic.ts copies that were all updated
- api-server state.ts `createInitialState()` + `makePlayer()` both have new fields
- api-server callMeeting initializes skipDiscussionVotes: []
- Pre-existing api-server TS error (api-zod/dist not built) is unrelated to these changes

**Why:** All of these were Vol1 gaps per the design doc that needed filling before Vol1 can be considered complete.
