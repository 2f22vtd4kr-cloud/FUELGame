---
name: 95-Y accessibility persistence and msgpack protocol
description: §13.1 text size / accessibility persisted in profile; §12.4 shawarma tutorial replaces card overlay; §05.2 msgpack binary WS protocol
---

# Accessibility persistence (§13.1)

**Rule:** All eight accessibility settings (`textSize`, `colorblindMode`, `highContrastMode`, `volumeMaster`, `volumeMusic`, `volumeSfx`, `autoInteract`, `simplifiedChatWheel`) live in both `GameState` (gs) AND `PlayerProfile` (localStorage key `95y_profile_v1`).

**How to apply:** `state.ts` reads them back via `loadSavedAccessibility()` on every `createInitialState()` call. HUD.tsx settings handlers call `saveAccessibilityToProfile()` on every change. MeetingScreen subtitle strip scales font with `state.textSize`.

**Why:** Settings were only on `gs` (reset each session). Users lost their volume/text-size preferences between games.

# Interactive shawarma tutorial (§12.4)

**Rule:** `Tutorial.tsx` (card overlay) is NO LONGER shown in the App flow. `App.tsx` goes straight to `briefing` for all players — new or returning. The in-game 3-step interactive tutorial (HUD.tsx `tutorialStep` 1→3, logic.ts `updateTutorial`) is the sole onboarding path.

**How to apply:** Tutorial trigger in HUD checks BOTH `localStorage.getItem('95Y_tutorial') === 'done'` AND `loadProfile().seenTutorial`. Completion (step 3 timeout) and skip button both write BOTH locations.

**Why:** Old flow showed a static card overlay before the game. The doc (§12.4) requires an interactive walk-to-shawarma sequence inside the actual game world.

# MessagePack binary protocol (§05.2)

**Rule:** All WebSocket traffic is binary MessagePack, NOT JSON. Client sets `ws.binaryType = 'arraybuffer'`, decodes with `new Uint8Array(event.data)`. Server sends `Buffer.from(encode(msg))`. Both use `@msgpack/msgpack`.

**Files changed:** `artifacts/game/src/game/network.ts`, `artifacts/api-server/src/game/wsHandler.ts`, `artifacts/api-server/src/game/room.ts`.

**Why:** Doc §05.2 specifies binary MessagePack frames. Implementation had drifted to plain JSON strings.

**Caution:** If adding new WS send paths anywhere, always use `encode()`/`decode()` — never `JSON.stringify`/`JSON.parse` in the WS channel.
