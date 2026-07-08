---
name: 95-Y decor asset pipeline ordering
description: Rules for running sprite generation scripts in the right order so AI-processed sprites always win over procedural ones, and HUD hook-order rules
---

# Decor asset pipeline

## Rule: always run process-ai-decor.mjs AFTER generate-props.mjs

`generate-props.mjs` writes all decor sprites (bench, dumpster, flowerbed, etc.) using the procedural PixelGrid pipeline. `process-ai-decor.mjs` overwrites a subset with higher-quality AI-trimmed+downscaled versions from `public/sprites_src/`.

**Why:** Running generate-props.mjs alone clobbers AI sprites. The `gen:sprites` npm script was updated to always end with `process-ai-decor.mjs` so the AI versions win.

**How to apply:** If you ever add a new procedural sprite that also has an AI source in sprites_src/, add it to the `TARGETS` object in `process-ai-decor.mjs` AND update `DECOR_SPRITE_META` in `sprites.ts` with the actual output dimensions (logged by the script).

## Current AI-processed sprites (sprites_src/ → sprites/)

| Sprite | targetMax | Output |
|---|---|---|
| decor_bench | 54 | 54×30 |
| decor_dumpster | 40 | 38×40 |
| decor_flowerbed | 62 | 62×62 |
| decor_kvass_stand | 54 | 54×50 |
| decor_tree | 70 | 70×70 |
| decor_hydrant | 34 | 34×32 |
| decor_trash_bin | 32 | 32×32 |
| decor_bicycle_rack | 58 | 58×58 |

Lamppost and EV charger remain procedural (no sprites_src version).

## HUD hook-order rule

`HUD.tsx` has an early return `if (!localPlayer) return null` around line 290. ALL `useEffect` and other hooks must be declared ABOVE this guard, never below it. This caused a "rendered more hooks than previous render" crash when added below the guard.

**Why:** React's Rules of Hooks — hook count must be identical every render; an early return before hooks makes their count conditional.
