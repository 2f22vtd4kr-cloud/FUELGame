---
name: Mobile touch fixes for 95-Й Бакстаб
description: What causes touch issues on mobile and how to fix them correctly
---

## Rule
Joystick zones must bail early when `gs.activeMiniGame` is truthy — otherwise they call `e.preventDefault()` and swallow all touches in their screen area, making minigame buttons unresponsive.

**Why:** VirtualJoystick registers native DOM listeners (`{ passive: false }`) on `joystick-zone` and the left swipe zone. These listeners call `e.preventDefault()` which kills the subsequent synthetic `click` event even on visually higher-z elements.

**How to apply:** In `handleTouchStart` (joystick-zone native listener) and in the left zone's React `onTouchStart`, add `if (gs.activeMiniGame) return;` as the very first line before any `e.preventDefault()`.

## Keyboard hints on mobile
- Static UI: grep for `[E]`, `нажми E`, `удерживай E` in all .tsx/.ts files and replace directly
- Runtime prompts from logic.ts: use `touchPrompt()` (defined in HUD.tsx) which does regex replace at render time
- `touchPrompt` regex: `[E]→[ТАП]`, `[удерживай E]→[удержи]`, `нажми E→нажми кнопку`, `press E→tap`
- Interact button: replaced "E" label with "⚡" emoji

## iOS click delay
- `div` elements with `onClick` have a 300ms delay on iOS without `touch-action: manipulation`
- Add `touchAction: 'manipulation'` to any minigame panel or interactive container
- `button` and `a` elements don't have this problem

## Vision obstacle cache
- `buildVisionObstacles` is O(n), called 60×/sec — cache it
- Invalidate when `state.cars.length !== _cachedCarCount || state.phase !== _cachedPhase`
- Cars don't move, so position-based cache is safe within a match phase

## Shadow consistency
- All entities now use flat black ellipse shadows (`ctx.ellipse`, `globalAlpha: 0.28`)
- Replaced `createRadialGradient` for character shadows — was allocating a new gradient object every frame per player
