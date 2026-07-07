---
name: 95-Y Vol1 Final Gaps
description: Session 7 — final Volume 1 gaps implemented; all doc-specced frontend/AI items now done
---

## Session 7 Changes (2026-07-07)

### 1. Дядя Серёжа Ejection CTA (§10.2 Integration 05)
- `EJECTED_AS_INNOCENT.uncle_seryozha` now ends with `→ @fuel_fuel_fuel_bot`
- Location: `artifacts/game/src/game/logic.ts` line ~53

### 2. Role-Aware Bot Meeting Chat (§4.4)
- `scheduleBotChatMessages()` expanded: Сливщик bots accuse their highest-suspicion target; accused bots send alibi phrases; Хозяин bots with suspicion share observations
- Fallback to character voice lines or generic phrases when no role-specific trigger applies
- Location: `logic.ts` ~line 1938

### 3. Хозяин Bot Follow Suspicious Player (§4.3)
- New BotBehavior value `'follow_suspicious'` added to types.ts
- In `updateKhozainBot`: when idle+cooldown-free, checks for suspect near drained car within 180px with suspicion > 0.2; 40% chance to follow for 5s
- If followed suspect approaches viable car: raises suspicion 0.35 + calls meeting
- Safety: stale-state flush runs at function entry before high-priority branches; flee branch also clears `botCarId`
- Location: `artifacts/game/src/game/botAI.ts` — `updateKhozainBot`

### 4. Nightmare Bot Stalking (§4.2)
- At Nightmare difficulty, `updateSlivshchikBot` step 4 biases toward the car nearest the human player rather than nearest the bot
- Guards: `viableCars.length > 0` before reduce; falls through to nearest-to-bot logic if human is dead/absent
- Location: `artifacts/game/src/game/botAI.ts` — `updateSlivshchikBot` step 4

## Remaining Tier 2+ (require backend/infrastructure)
- PostgreSQL persistence (users, inventory, match_history, leaderboards) — proposed as Task #2
- Telegram Mini App SDK integration (initData, share deeplinks) — proposed as Task #4
- Server-authoritative tick (currently client-authoritative)
- Redis session/room state
- Telegram Stars payment flow
- Bot exhausted-cars edge case hardening — proposed as Task #3
