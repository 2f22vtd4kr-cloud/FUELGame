---
name: 95-Y audio, sprint, and accessibility
description: §8.1 music system, §8.2 12 SFX, sprint toggle, §13.1 accessibility features
---

## Sprint
Sprint is a **toggle** (Shift key) not a hold. Implemented in GameCanvas.tsx input handling.

## Music lifecycle
Music transitions wired to phase changes at the top of `tickGame()` (before any early returns) via `_prevPhase` module-level variable.

## §8.2 SFX list
All 30 SFX synthesized via Web Audio API in `audio.ts`. Key sounds: siphon_gurgle (looped oscillator), alarm_button, task_complete, canister_pickup, canister_drop, ambush, player_death, bot_death, win_owners, win_slivshchiki, fuel_lock, grandma_escort, body_found.

## §13.1 Accessibility (fully implemented)
All in `GameState` and settable via HUD.tsx settings panel (⚙️ button):
- **colorblindMode**: toggles fuel bar green → blue
- **volumeMaster / volumeMusic / volumeSfx**: 0–1 sliders wired to AudioManager.setMasterVolume / setMusicVolume / setSfxVolume
- **textSize** ('small'|'medium'|'large'): textScale factor (0.82/1.0/1.22) applied to prompt text and tutorial overlay text
- **autoInteract**: 2s proximity timer fires safe single-press interactions via `triggerInteract` flag in updateInteractions. Only fires for mini-game tasks (not hold-to-complete), canisters, immunity tickets, babushka NPC. Timer tracked in `gs.autoInteractTimer`.
- **simplifiedChatWheel**: shows 6 of 12 quick-chat phrases in MeetingScreen

## §13.1 Siphon audio indicator
`nearAudioSiphon` computed in HUD.tsx — shows ⚠️ pulse if any active siphon within 8m.

## §13.1 Subtitles
MeetingScreen shows last chatMessages entry as subtitle strip at bottom (above evidence notes). IIFE pattern in JSX.

## §12.4 Tutorial
- `gs.tutorialStep`: 0=off, 1=go_shawarma, 2=near_shawarma, 3=done
- `updateTutorial(dt)` in logic.ts — step 2→3 gates on `completedBy === gs.localPlayerId` (not any player)
- HUD.tsx useEffects: phase-change triggers init (localStorage check), step-3 auto-dismisses after 3s
- localStorage key: `95Y_tutorial = 'done'`

**Why:** Sprint-as-hold was confusing on mobile; toggle is doc spec §2.3. Accessibility features needed for §13.1 compliance.
