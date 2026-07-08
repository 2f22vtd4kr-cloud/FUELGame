---
name: game-sprite-outline-chibi
description: How the 95-Й pixel-art sprite pipeline achieves a "professional" look (outline + chibi proportions) and the prop-metadata pitfall to avoid.
---

Added `PixelGrid#outline()` (lib/pixelart.mjs): traces a 1px dark border around any filled silhouette (8-neighbor, only fills still-empty pixels). This one primitive was the single biggest visual-quality lever — flat color blocks with no border read as amateurish; call it LAST in every frame build, after all shapes are drawn.

Chibi proportions (lib/characterBuilder.mjs): grew head radius roughly 11->15 while keeping the head *center* fixed, so it swallows more of the torso automatically without needing to re-derive every face-feature coordinate — cheap way to get a big-head/short-body read without a full geometry rewrite.

**Why:** user feedback said sprites "look like shit" vs a polished chibi reference sheet; root causes were exactly these two things (no outline, adult-like proportions), not color choice or detail level.

**Pitfall — prop sprite metadata drift:** `src/game/sprites.ts`'s `DECOR_SPRITE_META` hardcodes each decor PNG's w/h/offsetY for `drawImage`. If you resize a prop's PixelGrid canvas in generate-props.mjs (even by a couple px to fit new detail), you MUST update the matching entry in `DECOR_SPRITE_META` or the renderer scales/misanchors it silently (no error, just wrong-looking output) — caught only by an architect code review, not by `tsc`. Recompute offsetY as `old_offsetY - deltaHeight/2` to keep the visual base anchored.

Car sprites (car_*.png) are NOT produced by this PixelGrid pipeline (no generate-cars.mjs exists) — they're already high-quality/pre-existing and were deliberately left alone during the sprite-quality pass.
