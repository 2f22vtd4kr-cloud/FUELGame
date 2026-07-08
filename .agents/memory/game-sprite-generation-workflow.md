---
name: 95-Y procedural sprite-sheet generation workflow
description: How directional walk-cycle sprite sheets are generated and wired in, and how to extend the pattern to more characters/assets
---

# Procedural sprite-sheet generation

Adopted to replace "external AI image + hand-written slicing code" with a single
sandboxed step: draw the sheet procedurally in Node, then write animation code
against the exact grid just generated. Denis is the reference implementation
(pilot, done); the other 9 characters + 6 cars are not yet converted.

**Full workflow, reusable building blocks, and step-by-step pattern for adding
a new character are written in `HANDOFF.md` under "Sprite-sheet generation
workflow"** — read that before starting the next character, since it's the
part meant to survive across repo re-imports/sessions.

## Detail pass (Denis v2)
- To add real detail (glasses, cap badge, jacket zipper, jeans vs. plain pants,
  boot soles) without changing the final 64×64 frame size or touching
  `sprites.ts` metadata, bump the working grid resolution and lower the scale
  proportionally (16×16×4 → 32×32×2) rather than redesigning the pipeline.
  **Why:** doubling the grid at constant final size roughly doubles addressable
  detail while staying nearest-neighbor/nostalgic-pixelated — just re-doubling
  the *old* 16×16 coordinates would only produce bigger blocks, not more detail.
- Always crop+view individual frames (ImageMagick `-crop`+`-filter point -resize`)
  at both native and actual in-game draw size (spriteSize ~42px) before calling
  a redesign done — details that read at 64px can disappear at 42px.

## Rounded-silhouette redesign (Denis v3)
- User feedback on v1/v2 ("still looked like shit... no abrupt square angles")
  meant the *silhouette* itself was too rectangular, not a resolution/detail
  problem. Fix: `pixelart.mjs` now has `fillCircle`/`fillEllipse`
  (distance-test fill) and `fillRoundedRect` (rect with corner-circle cutout)
  primitives — every major body part (cap, head, torso, arms, legs) is built
  from these instead of straight `fillRect` bars, which is what actually
  produces a rounded/cartoon look matching a reference image.
  **Why:** hand-tuning per-row pixel widths to fake curves is slow and never
  reads as "rounded" at a glance; distance-based shape fills give a correct
  rounded silhouette for free at any working resolution.
- **Gotcha:** `fillRoundedRect`/loops index the pixel grid with the y/x
  values directly as array indices — if a caller passes a fractional
  coordinate (e.g. from `bob * 0.4` walk-cycle animation math), `grid[y]` is
  `undefined` (JS arrays don't have fractional keys) and it throws deep
  inside `set()`, not at the call site. Fixed by `Math.round`-ing
  x0/y0/w/h at the top of `fillRoundedRect` itself — round once centrally
  rather than requiring every call site to remember to round.
- Denis v3 uses a 64x64 working grid directly (scale x1, no upscale) instead
  of the earlier 32x32x2 — more addressable resolution for smooth curves at
  the same final frame size, no `sprites.ts` metadata change needed.
- When placing a cap/hat that overlaps the face, keep its bottom edge (bill
  included) above the eyebrow line — drawing the cap after the face (so it
  layers correctly) but too low reads as a solid dark "sunglasses" bar across
  the eyes instead of a brim.

## Key non-obvious decisions
- Animation frame-rate is driven by actual per-frame position delta (px/sec),
  not the raw joystick vector magnitude — **why:** in this game, movement
  speed is not itself proportional to joystick tilt (direction is normalized,
  only sprint/crouch/etc. change speed), so tying animation rate to joystick
  tilt would visually desync from how fast the character actually moves.
- Direction bucketing reuses `player.facingAngle` (already set from
  input dx/dy each tick) instead of re-deriving from the joystick — one
  source of truth, avoids duplicate logic.
- Animation state lives entirely in `renderer.ts` as a module-level
  `Map<playerId, ...>`, not on the `Player` type — keeps it a pure rendering
  concern with zero changes to game logic or the client/server-mirrored
  network types.
- PNG encoding is done with a hand-rolled zero-dependency encoder (Node
  `zlib` only) rather than `node-canvas`/`sharp`/ImageMagick — avoids native
  binding/system-dependency risk entirely for future sessions.

## Full roster + static prop generalization (session: all characters + decor)
- All 10 characters now generated via `generate-characters.mjs` (humans) +
  `generate-barsik-sprite.mjs` (cat), using a shared `lib/characterBuilder.mjs`
  that takes a small palette/headwear config per character instead of
  hand-writing per-character draw code — adding a character is just a new
  config object (skin/hair/top/bottom/shoe/headwear).
- Static (non-animated) map props use the same `PixelGrid` primitives but
  skip `composeSheet`'s square-frame-sheet assumption — `generate-props.mjs`
  has its own `writeGrid()` that encodes one arbitrary-size grid straight to
  PNG. **Why:** `composeSheet` assumes uniform square frames tiled in a grid
  (built for walk-cycle sheets); one-off props like a lamppost (18×64) or
  bench (48×22) aren't square and don't need multi-frame tiling.
- Decoration sprites are drawn centered on the existing `(x,y)` gameplay
  anchor point via a `DECOR_SPRITE_META` lookup (`{w,h,offsetY}` per type) in
  `sprites.ts`, with `renderer.ts::drawDecorations` trying the sprite first
  and falling back to the old primitive-shape drawing if not loaded — same
  graceful-fallback pattern as character/car sprites, so decor art can be
  iterated without touching collision/gameplay code (`FLOWERBED_RECTS`,
  `DUMPSTER_POSITIONS`, etc. are untouched and still reference the same
  `(x,y)` points).
