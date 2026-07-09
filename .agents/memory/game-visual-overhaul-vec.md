---
name: 95-Y visual overhaul — vecDraw as primary renderer
description: July 2026 session switched from grainy AI sprite pipeline to clean Among Us-style vector art. SPRITE_KEYS=[] disables all AI PNGs; vecDraw is now the sole renderer.
---

# Visual Overhaul — vecDraw Primary Renderer

## The rule
`artifacts/game/src/game/sprites.ts` — `SPRITE_KEYS` is now `[]` (empty array).
All AI-generated PNG sprites (courtyard_bg, char_*, car_*, decor_*) still exist on disk but are **never loaded**. Do not add them back.

**Why:** AI images were grainy, mismatched in art direction, and inconsistent scale. The `vecDraw.ts` system already implemented clean Among Us-style flat vector art. The fix was to bypass sprites entirely.

## Active rendering path
- **Background**: `drawBackground()` calls `drawBackgroundVec(ctx, MAP_W, MAP_H, PLAYGROUND)` directly
- **Characters**: `drawCharacterVec()` — Among Us bean (oval body + visor + backpack + thick outline), per-character color
- **Cars**: `drawCarVec()` — top-down Soviet car style
- **Decorations**: All 10 prop types use named vecDraw functions (`drawBenchVec`, `drawDumpsterVec`, `drawFlowerbedVec`, `drawTreeVec`, `drawLampVec`, `drawKvassVec`, `drawEvChargerVec`, `drawHydrantVec`, `drawTrashBinVec`, `drawBicycleRackVec`)

## Dead code preserved for reference
- `_drawBackgroundLegacy()` in renderer.ts — old procedural background, never called
- `courtyard_bg.png`, `char_*.png`, `car_*.png`, `decor_*.png` — still on disk, just not loaded
- `CAR_SPRITE_MAP` — still defined in sprites.ts but `getSprite()` always returns null now

## How to apply
- Never add sprite keys back to `SPRITE_KEYS` without explicit owner decision
- To add a new decoration: add a `drawXxxVec()` function in vecDraw.ts, export it, import+call it in renderer.ts `drawDecorations()` switch-case
- To add a new character: add to `characters.ts` with a `.color` property — no sprite needed
