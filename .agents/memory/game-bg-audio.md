---
name: 95-Y courtyard background + audio MP3
description: How the AI-generated map background image and MP3 music are integrated; HUD action stack z-index fix.
---

## Courtyard background image
- `artifacts/game/public/sprites/courtyard_bg.png` — 1024×1024 AI-generated top-down Soviet courtyard
- Added `'courtyard_bg'` as first entry in `SPRITE_KEYS` in `sprites.ts`
- In `renderer.ts::drawBackground()`: if sprite loaded, crop vertical centre to 4:3 (srcY = (1024-768)/2 = 128, srcH = 768) then draw at (0,0,MAP_W,MAP_H) and return early — skips all procedural building/ground code
- `renderer.ts::drawParkingLot()` also early-returns when `getSprite('courtyard_bg')` is truthy
- Decorations, entrance gate, cars, characters all still drawn on top

**Why:** Crop math: image is 1024×1024 (1:1), world is 1200×900 (4:3). To avoid distortion, compute `srcH = round(1024 × 900/1200) = 768`, crop `(1024-768)/2 = 128` from top and bottom.

## Background music MP3
- `artifacts/game/public/audio/bg.mp3` — "millions of scarlet roses" track, loops
- `audio.ts::bgMusic` (HTMLAudioElement) + `bgMusicSource` (MediaElementAudioSourceNode)
- On first `playMusic()` call after WebAudio init: `createMediaElementSource(bgMusic)` → connected to `musicGain` → `masterGain` so ALL volume controls (master + music slider) affect the MP3
- `bgMusic.volume = 1.0` once wired; gain nodes do all attenuation
- If `play()` is blocked (autoplay policy): registers `{ once: true }` listeners on `click` + `touchstart` that call `ctx.resume()` then `bgMusic.play()`
- Meeting track uses `vol = 0.35`, others use `vol = 0.62`

**Why:** Routing via MediaElementAudioSourceNode avoids the pre-existing regression where `setMasterVolume()` (which adjusts `masterGain`) had no effect on the MP3.

## HUD action stack z-index fix
- `.pp-action-stack` in `HUD.css`: changed to `position: fixed; bottom: 160px; right: 10px; z-index: 25`
- Joystick touch zone is `position: fixed; z-index: 20; right: 0; bottom: 0; width: 42%; height: 46%`
- Old action stack was `position: absolute; z-index` unset (inherited 10 from HUD root) → joystick zone (z-index 20) blocked all touches to action buttons
- 160px bottom clears joystick visual (104px tall at bottom 24px → top at 128px from bottom)

## Character shadow improvement
- `renderer.ts::drawPlayers`: shadow changed from flat `rgba(0,0,0,0.28)` ellipse to radial gradient ellipse (0.45 centre → 0 edge, 0.36 vertical ratio)
