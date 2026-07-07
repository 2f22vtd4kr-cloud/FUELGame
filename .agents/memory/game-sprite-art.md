---
name: 95-Y sprite art system
description: How character and car sprites are loaded and rendered in the 95-Y game
---

# Sprite Art System

## What was built
- 10 character PNG sprites (transparent bg) at `artifacts/game/public/sprites/char_<key>.png`
- 6 car PNG sprites at `artifacts/game/public/sprites/car_<model>.png`
- `artifacts/game/src/game/sprites.ts`: `loadSprites()` pre-loads all PNGs; `getSprite(key)` returns `HTMLImageElement | null`
- `artifacts/game/src/game/renderer.ts`: `drawPlayers` uses sprite when loaded, falls back to colored circle + `drawCharacterDetails`; `drawCars` uses sprite when loaded, falls back to `fillRect` primitives
- `artifacts/game/src/components/GameCanvas.tsx`: `loadSprites()` called on mount via `useEffect([])`

## Key rules
- Character sprite key: `char_${player.character}` (e.g. `char_denis`, `char_barsik`)
- Car sprite key via `CAR_SPRITE_MAP`: car1→car_moskvich, car2→car_zeekr, car3→car_yandex, car4→car_tesla, car5→car_haval, car6→car_vesta
- **Sprite rotation: `player.facingAngle + Math.PI / 2`** — sprites are authored facing north (up); game angle 0 = east; +PI/2 aligns north→east then facingAngle gives final direction. Using `-PI/2` is wrong and rotates backwards.
- Barsik: spriteSize=24, playerRadius=10; all others: spriteSize=42, playerRadius=14
- Car sprite drawn at: `ctx.drawImage(carSprite, x - 42, y - 24, 84, 48)` (cars face right, no rotation)

**Why:** Graceful fallback means sprites can be iterated/replaced without touching game logic.
