---
name: QA gameplay screenshot mechanism
description: How to get a screenshot of the actual game canvas (not the lobby) during development.
---

# QA Gameplay Screenshot Mechanism

## The URL
`/?qa_autostart=1`

Navigate to this path on port 24631 to take a screenshot of the actual in-game canvas.

**Why:** The screenshot tool only captures a single frame. Without autostart, you'd see the Lobby (React UI). With `?qa_autostart`, the app skips directly to `phase='play'` with 6 bots, medium difficulty, character Denis.

## What it does (App.tsx)
- Sets `gs.selectedCharacter = 'denis'`
- Calls `startGame('denis', 6, 2, false)` — 6 bots, 2 traitors
- Calls `skipBriefing()` — skips the briefing timer
- Sets `localStorage.setItem('95Y_tutorial', 'done')` — suppresses tutorial
- Sets `gs.tutorialStep = 0` — suppresses tutorial overlay
- Returns phase `'play'` immediately

## What's suppressed in QA mode
- **Tutorial overlay** (`state.tutorialStep >= 1`): suppressed via localStorage + `gs.tutorialStep = 0`
- **Role splash** (`showRoleSplash`): suppressed via `!new URLSearchParams(window.location.search).has('qa_autostart')` check in BOTH the `useState` initializer AND the `useEffect` in HUD.tsx

## How to apply
When doing any visual work (renderer, vecDraw, HUD), always verify with:
```
screenshot({ type: 'app_preview', path: '/?qa_autostart=1', port: 24631 })
```

## What's visible
Full game canvas with fog-of-war, vecDraw characters (beans), map background, props, task markers, HUD strip, minimap, and action buttons.
