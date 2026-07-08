---
name: Denis sprite canvas design
description: Canvas mockup of Denis pixel-art sprite sheet; ready to export to PNG next session
---

## Status
Canvas mockup fully designed and live on the canvas board.
**Next session: export the canvas component to `artifacts/game/public/sprites/char_denis.png`.**

## What was built
`artifacts/mockup-sandbox/src/components/mockups/denis-sprite/DenisSprite.tsx`
- 4×4 sprite sheet (rows = left/right/front/back, cols = walk frames 0-3)
- Each frame: 64×64px → full sheet: 256×256px (matches `SPRITE_SHEETS.char_denis` in `sprites.ts`)
- Procedural Canvas 2D drawing — no external image assets
- Interactive: click cell to select frame, animated preview at 6×, play/pause, palette reference

## Colour palette (Denis)
| Role | Hex |
|------|-----|
| Cap / Hoodie yellow | `#F4C030` |
| Cap / Hoodie dark | `#C8900A` |
| Я red | `#CC1111` |
| Skin | `#C68642` |
| Jeans blue | `#4A72C0` |
| Shoe | `#222222` |
| Outline | `#111111` |

## Export plan (next session)
Use `node-canvas` (or the existing procedural PNG writer in `scripts/`) to:
1. Create a 256×256 canvas
2. Call `drawSheet(ctx)` with the same drawing functions
3. Write to `artifacts/game/public/sprites/char_denis.png`

**Why:** The current `char_denis.png` is a 2 286-byte placeholder. The new sheet must be
exactly 256×256 RGBA PNG, matching the `SpriteSheetMeta` in `sprites.ts`:
`{ cols:4, rows:4, frameW:64, frameH:64, rowFor:{left:0,right:1,down:2,up:3} }`

Note: `drawFrame` in the mockup component swaps left↔right in the switch to correct
an orientation bug — the raw draw functions `drawLeft`/`drawRight` face the opposite
direction from their names. Keep this swap when porting to the export script.
