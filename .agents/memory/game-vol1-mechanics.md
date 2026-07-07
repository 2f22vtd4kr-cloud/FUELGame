---
name: 95-Y Vol1 mechanics
description: Design-doc Volume 1 implementation status, patterns, and critical bugs fixed
---

## What was implemented (Vol 1)

### Core gameplay
- **Sprint/crouch** — Shift = 1.55× speed, 5s stamina pool draining at 1/s, regen at 0.625/s. Ctrl = 0.52× speed. Stamina bar shown near player only when relevant.
- **Ambush mechanic** — Slivshchik holds E near lone Khozain (AMBUSH_RADIUS=55, AMBUSH_LONE_RADIUS=480). 1.5s charge → body dropped. 25s cooldown. Bot ambush is instant (no charge) for AI simplicity.
- **Body system** — `Body` struct in `gs.bodies`. Body render (lying-down colored circle, X eyes, name tag). Reporting trigger callMeeting('body'); gated by meetingCooldown.
- **Siphon phases** — Phase 1 (0–3s setup, subtle shimmer, no evidence if released). Phase 2 (active drain, green stream, can't move). Canister dropped at siphoner's pos on release/interrupt.
- **Canister evidence** — `Canister` struct in `gs.canisters`. Khozain picks up → evidence at meeting. Slivshchik picks up → can dispose at dumpster. Carrying slows player 20%.
- **Meeting triggers** — Alarm (entrance arch), body report, drained car (<10%); all gated by MEETING_COOLDOWN=30s.
- **20 ejection texts** — 10 siphoner + 10 innocent, randomly chosen.
- **10 tasks** — shawarma, intercom, trash, window, grandma, mailbox, pigeons, flowers, kvass, sweep. Each 7–8% unity reward.
- **Quick-chat wheel** — 12 phrases in MeetingScreen discussion phase (grid, not radial, for mobile tap-ability).
- **Emote wheel** — Q on desktop / button on mobile. 4 emotes (👋🤔🚨😂) shown as bubble above player for 3s.
- **Web Audio synthesis** — `audio.ts` module, 12 sound names, synthesized via AudioContext. Looping gurgle for active siphon (stopGurgle on all cancel paths).
- **Character voice lines in meeting** — 60% chance bots use character-specific lines, 40% generic fallback.
- **Bot fake task** — Slivshchik bots enter 'fake_task' state when watched by an owner, move to nearby task and stand there.

### New data
- 6 car spawns (was 4), 10 task spawns (was 5), dumpster positions, kvass stand deco.
- `botState` extended with `'fake_task'`.

## Critical bugs fixed

**Body-report gating**: Gating `nearBody.reportedBy = player.id` must happen AFTER confirming `gs.meetingCooldown <= 0`. Previously it marked body reported regardless, permanently blocking future reports.

**Vote state reset across meetings**: `MeetingScreen` keeps `myVote` in local React state. Must reset on `meeting.meetingId` change (incremented in `callMeeting`). Used `useEffect(..., [meeting?.meetingId])`.

**Mobile joystick overwrite**: RAF loop rebuilt dx/dy from keyboard state every frame, silently overwriting joystick values. Fix: separate `joystickRef` → merge in RAF: keyboard takes priority, joystick as fallback. Touch-interact/sprint/crouch also use separate `touchXRef.current` booleans.

**Siphon audio cleanup**: `audio.stopGurgle()` was only called on full-drain completion. Added `stopSiphon()` helper that calls `stopGurgle()` whenever phase was 2 before reset — covers dead/immune/out-of-range paths.

**Canister disposal flow**: Carried canisters are spliced from `gs.canisters`, so "near canister" check never finds them. Fix: check `player.isCarryingCanister` in a separate block BEFORE the ground canister pickup block.

## Import/circular dep notes

`logic.ts` imports `updateBots` from `botAI.ts`; `botAI.ts` imports `callMeeting` from `logic.ts`. This circular import is safe in Vite ESM because both exports are function definitions (not called at module init time). No dynamic `require()` — all imports are static.

## Architecture invariants to preserve

- `gs` singleton mutated in-place; React only sees snapshots.
- `meetingId` in `MeetingState` is the stable identity for per-meeting UI state reset.
- `stopSiphon(car, siphoner, reason)` helper must be used for all siphon cancellation paths.
- Joystick input lives in `joystickRef`, never in `inputRef` directly.
