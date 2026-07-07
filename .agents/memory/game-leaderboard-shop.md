---
name: 95-Y Leaderboard & Shop
description: §3.4 cosmetics shop, §9.3 server leaderboard, §10.3 Telegram Stars — what's implemented and key design decisions.
---

## What's implemented

### §9.3 Leaderboard
- DB table: `leaderboard_entries` — no FK to `users` (guest-friendly; playerName + babki + wins + matches + deviceId)
- API: `GET /api/leaderboard` returns top 20 by babki; `POST /api/leaderboard` upserts by deviceId
- Client: `submitLeaderboardScore()` in `rewards.ts` — fire-and-forget after each match; silent on failure (offline ok)
- UI: `LeaderboardTab.tsx` — shows medals (🥇🥈🥉), character emoji, highlights "ты" row by deviceId
- DeviceId: auto-generated UUID in `loadProfile()`, persisted in localStorage alongside profile

### §3.4 Cosmetics Shop
- Catalog: `data/cosmetics.ts` — 20 hats across free/babki/stars/fuel_linked/battlePass tiers; rarity colors
- UI: `ShopTab.tsx` — filter tabs (All/Owned/Бабки/Stars), 2-column grid, equip/buy actions with toast feedback
- Purchase flows: babki (deduct from profile.babki), Stars (window.Telegram.WebApp.openInvoice with slug pattern `hat_{id}_{cost}`)
- Profile fields added: `purchasedHats[]`, `equippedHat`, `playerName`, `deviceId`

### §10.3 Telegram Stars
- `ShopTab.tsx` calls `window.Telegram?.WebApp?.openInvoice(slug, callback)` on Stars items
- Callback checks `status === 'paid'` to unlock locally; graceful fallback if not in Telegram context

### Lobby tabs
- `Lobby.tsx` now has 3 tabs: 🎮 Игра | 🎩 Магазин | 🏆 Рейтинг
- Profile header + achievements panel always visible above tabs

## Key decisions

**Why no FK on leaderboard_entries?**
The game is web-first without mandatory Telegram auth. Using a deviceId allows any player to submit scores without registration. Real Telegram users can be linked later.

**Why fire-and-forget leaderboard submit?**
Network failure must never block the match-end flow or rewards screen. The score is already saved locally in profile.

**How to apply:**
Any new cosmetic item added to `data/cosmetics.ts` automatically appears in ShopTab. Stars items need a real Telegram invoice slug created server-side before going live.
