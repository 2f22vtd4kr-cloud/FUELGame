# 95-Й Бакстаб

A Russian-themed social deduction game (similar to Among Us) built with React, Vite, and Canvas 2D. Players are split into Хозяева (hosts) and Сливщики (traitors) in a courtyard setting.

## Stack

- **Frontend/Game**: React 19 + Vite 7, Canvas 2D renderer, TypeScript
- **Monorepo**: pnpm workspace (`pnpm-workspace.yaml`)
- **Packages**:
  - `artifacts/game` — main game client
  - `artifacts/api-server` — backend API server
  - `lib/api-spec` — OpenAPI spec + Orval codegen
  - `lib/api-client-react` — generated React Query hooks
  - `lib/api-zod` — generated Zod schemas

## Running the project

```bash
pnpm install          # install all workspace dependencies
```

The game runs via the managed workflow **`artifacts/game: web`**:

```bash
PORT=24631 BASE_PATH=/ pnpm --filter @workspace/game run dev
```

The game is then available at the Replit preview URL (root path `/`).

## Key game files

- `artifacts/game/src/game/state.ts` — singleton `gs`; `startGame()` initializes
- `artifacts/game/src/game/logic.ts` — `tickGame`, all interactions, win-conditions
- `artifacts/game/src/game/renderer.ts` — Canvas 2D draw loop + fog-of-war
- `artifacts/game/src/game/vision.ts` — §2.3 raycasting fog-of-war
- `artifacts/game/src/game/botAI.ts` — bot behavior trees
- `artifacts/game/src/game/audio.ts` — Web Audio API SFX
- `artifacts/game/src/data/map.ts` — zones, cars, tasks, decorations
- `artifacts/game/src/data/tasks.ts` — 20 task definitions
- `artifacts/game/src/data/characters.ts` — 10 characters with voice lines
- `artifacts/game/src/components/HUD.tsx` — React HUD overlay (10Hz snapshots)
- `artifacts/game/src/components/MeetingScreen.tsx` — vote UI
- `artifacts/game/src/components/Lobby.tsx` — character select + game settings
- `artifacts/game/src/components/GameCanvas.tsx` — mounts canvas, drives RAF loop

## Character sprite sheets

- All 10 characters (Денис, Аня, Вова, Дядя Серёжа, Петрович, Марина, Ахмет, Олег, Лена, Барсик)
  now use procedurally-generated 256×256 (4×4 grid of 64×64 frames) walk-cycle sprite sheets —
  no external AI images. Generator: `artifacts/game/scripts/generate-characters.mjs` (humans,
  palette-driven via `scripts/lib/characterBuilder.mjs`) and `generate-barsik-sprite.mjs` (cat).
  Re-run all with `pnpm --filter @workspace/game run gen:sprites`. To add a new character, add a
  palette config entry to `generate-characters.mjs` — no new draw code needed.

## Map decoration sprites

- All courtyard decorations (bench, dumpster, flowerbed, tree, lamppost, kvass stand, EV charger,
  plus new hydrant/trash bin/bicycle rack) are procedurally generated static PNGs in
  `artifacts/game/public/sprites/` via `artifacts/game/scripts/generate-props.mjs`, drawn with the
  same `PixelGrid` toolkit used for characters. `artifacts/game/src/game/sprites.ts` exposes
  `DECOR_SPRITE_META` (size + vertical anchor offset per type) and `renderer.ts::drawDecorations()`
  draws the sprite first, falling back to the old primitive-shape drawing if a sprite fails to load.
  Regenerate all sprites (characters + props) with `pnpm --filter @workspace/game run gen:sprites`.

## Main menu (Propaganda Pop — LIVE)

- `docs/design/main-menu-style-guide.md` — "Propaganda Pop" (Soviet-retro poster) visual style.
  **Graduated and live** in `artifacts/game/src/components/Lobby.tsx` as of the July 2026 session.
  The mockup at `artifacts/mockup-sandbox/src/components/mockups/main-menu/Propaganda.tsx` is now
  a historical reference only. Next: extend the Propaganda Pop visual language to Shop,
  Leaderboard, and Meeting screens for consistency.

## Design bible

- `attached_assets/1_Game_DOC_1783421374443.md` — Volume I, 1992-line source of truth for all mechanics. **Fully implemented.**
- `docs/vol2/` — Volume II (Production Specs, Implementation & Operations), chunked one file per section (`18-task-minigames.md` … `28-final-word.md`) so it never needs to be re-read in one giant pass. **Start every Volume II session by reading `docs/vol2/PROGRESS.md`** — it tracks per-section status (done / partial / not started) and lists the next suggested gaps to close.

## Type-checking

```bash
pnpm --filter @workspace/game run typecheck
```

## Architecture notes

- Game state lives in a singleton `gs` mutated at 60fps — **no Zustand**
- React HUD reads a shallow snapshot of `gs` at 10Hz to avoid re-render overhead
- Coordinate system: 1200×900 canvas pixels (`MAP_W`, `MAP_H` in `types.ts`)
- `VISION_RADIUS=420px ≈ 12m`, `INTERACT_RADIUS=65px ≈ 1.5m`

## Production standards

- **Read `docs/PRODUCTION_STANDARDS.md` at the start of every session.** It
  captures a direct "reset of expectations" from the owner about quality bar,
  process (stop fixing one thing at a time), mobile-first requirements, and a
  production checklist. Every change should be checked against it before
  being considered done.

## User preferences

- Keep the existing monorepo structure and pnpm workspace conventions
- Do not restructure or migrate the stack without asking first
