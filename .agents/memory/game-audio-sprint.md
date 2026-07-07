---
name: 95-Y audio and sprint
description: SFX wiring model, music lifecycle, and key audio decisions for 95-Й Бакстаб
---

## SFX model (§8.2)
All 30 SFX synthesizers exist in `artifacts/game/src/game/audio.ts`. All 30 are wired to call sites in `logic.ts` and `botAI.ts`.

Proximity rule: SFX that correspond to siphoning (engine_start, tesla_zap, gurgle) must guard on local player proximity before firing — use `SIPHON_AUDIO_RADIUS` as the distance threshold. This prevents off-screen bot siphons from spamming full-volume sounds. Pattern in updateSiphoning():
```
const localPlayer = gs.players.find(p => p.id === gs.localPlayerId);
const siphonAudible = siphoner.isHuman || (localPlayer && dist(siphoner.pos, localPlayer.pos) < SIPHON_AUDIO_RADIUS);
if (siphonAudible) { audio.play('engine_start'); audio.play('tesla_zap'); }
```

## Sprint
Sprint is a toggle (Shift key). Music lifecycle wired to phase transitions in tickGame top-level guard.

## Vent (§3.1.2)
Human Сливщик vent is gated by `BOT_DIFFICULTY_SETTINGS[gs.botDifficulty].useVents` — only Hard/Nightmare. Destination selection mirrors bot logic: picks the dumpster furthest from all living khozaeva.

**Why:** Spec §3.1.2 explicitly restricts vent to Hard/Nightmare; Easy/Medium was accidentally giving the ability to all difficulties.
