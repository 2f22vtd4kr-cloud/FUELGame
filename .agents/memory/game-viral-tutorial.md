---
name: 95-Y viral mechanics and tutorial
description: §9.4 share prompts, friend invite deep link, §12.4 tutorial, §3.5 daily hats — all implemented this session
---

## §9.4 Viral Share Prompts (GameResults.tsx)

- **First-win prompt**: shown when `rewards.isFirstWin` (= `iWon && profile.totalMatchesWon === 1` after increment). Detected in `applyMatchRewards()`.
- **Daily challenge prompt**: shown when `rewards.dailyCompleted`. Also reveals hat emoji from `HAT_MAP`.
- Both use `window.Telegram?.WebApp?.openTelegramLink(...)` with `t.me/share/url?...` fallback to `window.open`.

## §9.4 Friend Invite Deep Link (MultiplayerLobby.tsx)

- "🔗 Пригласить друзей" button shown in waiting room when NOT in Quick Play (`!isQP`).
- Generates `https://t.me/bakstab_bot?startapp=ROOM_${roomCode}`.
- Telegram path: `openTelegramLink(t.me/share/url?...)`.
- Non-Telegram fallback: `navigator.clipboard.writeText(...)` with boolean result; different alert text on failure.
- **Consumption side**: `getTelegramStartRoomCode()` in App.tsx reads `Telegram.WebApp.initDataUnsafe.start_param`, strips `ROOM_` prefix, returns 4-char code. On mount: if code found, `appPhase` initialises to `'multiplayer'`. The code is passed as `initialJoinCode` prop to `MultiplayerLobby`, which uses it as initial `joinCode` state.

**Why:** Without consumption-side handling, invite links would just open the app with no auto-join, defeating the purpose.

## §12.4 Interactive Tutorial (Tutorial.tsx)

- 4 steps: World intro → Roles (Хозяин vs Сливщик grid) → Controls (6-item grid) → Meeting/voting.
- Shown once: `profile.seenTutorial` (default `false`); set to `true` + saved on finish or skip.
- Wired in App.tsx `handleGameStart`: if `!profile.seenTutorial`, phase → `'tutorial'`; Tutorial's `onComplete` → `'briefing'`.
- Multiplayer start bypasses tutorial (only for first single-player start).

## §3.5 Daily-Exclusive Hats (cosmetics.ts + rewards.ts)

- 7 hats `daily_sun`…`daily_sat`, `currency: 'daily'`, rarity: `rare` (Mon–Thu) / `epic` (Fri–Sun).
- ShopTab: `currency === 'daily'` hats are hidden unless already in `purchasedHats` (earned only, not purchasable).
- In `applyMatchRewards`: when `dailyCompleted`, compute Moscow day-of-week with UTC+3 offset, add `DAY_HATS[day]` to `purchasedHats` if not already owned. Return `dailyHatUnlocked` (string|null) in `MatchRewards`.

## isFirstWin detection

- Detected in `applyMatchRewards()` as `iWon && profile.totalMatchesWon === 1` (after `totalMatchesWon` is incremented in the same call).
- **Why:** Must check after increment so first win (value=1) is distinguished from subsequent wins.
