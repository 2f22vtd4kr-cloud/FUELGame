---
name: 95-Y Vol1 remaining gaps implementation
description: What was implemented to close the final Vol 1 design-doc gaps
---

## What was implemented (Vol 1 completion)

### §2.1 Briefing cinematic text
- App.tsx now shows atmospheric setting text ("ЖК «Цветочные Поляны». Лето 2026. АИ-95: 85₽/л. Кто-то сифонит ваши баки.") above the role card
- Neutral role briefing block (barsik/policeman/janitor goal text in gold) shown inside the card when applicable
- Skip button appears when `briefingTimer < 3` (2+ seconds elapsed from 5s total); calls `skipBriefing()` exported from logic.ts
- `clearMoment()` called in `handlePlayAgain` to reset replay buffer

### §9.1 Per-match title
- `getMatchTitle(player, winner, unityMeter, winReason)` function in GameResults.tsx
- Contextual titles: Топливный Барон (>70% siphon + win), Строитель Двора (100% unity), Детектив ЖК (ejection win), Трудяга Двора (5+ tasks), Котик Двора (barsik), etc.
- Title shown prominently on results screen (large gold text)
- Title embedded in share card PNG between result headline and player stats

### §9.2 Backstab Moment replay system
- `replayBuffer.ts` — captures canvas to JPEG with watermark+label on `captureMoment(canvas, type)`, exposes `downloadMoment()`, `clearMoment()`, guarded with try/catch for tainted canvas
- `GameState` gains `backstabMoment: 'catch_siphoner' | 'caught_siphoning' | 'dramatic_eject' | null` and `backstabMomentAcked: boolean`
- `updateBackstabMoment()` (private) runs in tickGame play phase; exported as `checkBackstabMoment()` for multiplayer path
- Detection: `catch_siphoner` = khozain within SIPHON_AUDIO_RADIUS of phase-2 siphon; `caught_siphoning` = slivshchik siphoning while another player nearby; `dramatic_eject` = local player ejected in resolveMeeting
- `GameCanvas.tsx` detects when `gs.backstabMoment` transitions from null to non-null, calls `captureMoment(canvas, type)`; multiplayer path calls `checkBackstabMoment()` after applyLatestState
- `HUD.tsx` shows animated "💥 БАКСТАБ МОМЕНТ!" toast with "💾 Скачать момент" and dismiss "✕" buttons; CSS backstabPulse animation

## Known limitations
- Backstab detection uses proximity (SIPHON_AUDIO_RADIUS, 280px) not raycasting line-of-sight; this is intentional (matches the §13.1 audio indicator range — if you hear it, it's a moment)
- `dramatic_eject` only fires for the local player being ejected, not for witnessing others ejected
