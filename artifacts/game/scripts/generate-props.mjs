// ─── Courtyard prop sprites (top-down, single static frame each) ──────────
// Same rounded-silhouette pixel-art pipeline as the characters, applied to
// map decorations so the courtyard reads as a real illustrated scene instead
// of flat canvas-primitive shapes. Each function returns one PixelGrid;
// written straight to a PNG (no walk-cycle grid needed for static props).
//
// Re-run with: pnpm --filter @workspace/game run gen:sprites

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PixelGrid, composeSheet } from './lib/pixelart.mjs';
import { encodePNG } from './lib/png.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../public/sprites');

/** Encodes a single (possibly non-square) PixelGrid straight to PNG. */
function writeGrid(name, grid) {
  const rgba = Buffer.alloc(grid.width * grid.height * 4, 0);
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const color = grid.grid[y][x];
      if (!color) continue;
      const h = color.replace('#', '');
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) : 255;
      const i = (y * grid.width + x) * 4;
      rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = a;
    }
  }
  const png = encodePNG(grid.width, grid.height, rgba);
  writeFileSync(path.join(outDir, `${name}.png`), png);
  console.log(`Wrote ${name}.png (${grid.width}x${grid.height})`);
}

const OUTLINE = '#14100C';

// ── Bench ───────────────────────────────────────────────────────────────
// v2: proper wooden park bench read top-down — slat lines, armrests, legs
// peeking past the seat, finished with the shared outline pass.
{
  const g = new PixelGrid(48, 26);
  g.fillRoundedRect(3, 18, 4, 6, 1, '#3E2A13'); // legs
  g.fillRoundedRect(41, 18, 4, 6, 1, '#3E2A13');
  g.fillRoundedRect(1, 6, 46, 14, 4, '#8B6914'); // seat slats block
  g.fillRoundedRect(1, 6, 46, 3, 2, '#A9812E');
  g.fillRoundedRect(1, 10, 46, 2, 1, '#6B4A22');
  g.fillRoundedRect(1, 15, 46, 2, 1, '#6B4A22');
  g.fillRoundedRect(0, 2, 6, 16, 2, '#6B4A22'); // armrests
  g.fillRoundedRect(42, 2, 6, 16, 2, '#6B4A22');
  g.fillRoundedRect(1, 2, 46, 3, 2, '#7A5A2A'); // backrest top rail
  g.outline(OUTLINE);
  writeGrid('decor_bench', g);
}

// ── Dumpster ────────────────────────────────────────────────────────────
// v2: adds a lid-seam highlight, wheels, and a graffiti-tag accent so it
// reads as a real courtyard object instead of a flat green block.
{
  const g = new PixelGrid(38, 38);
  g.fillCircle(8, 34, 3, '#1B1B1B'); // wheels
  g.fillCircle(30, 34, 3, '#1B1B1B');
  g.fillRoundedRect(2, 10, 34, 24, 4, '#43A047'); // body
  g.fillRoundedRect(2, 10, 34, 10, 3, '#2E7D32'); // shadow half
  g.fillRoundedRect(0, 4, 38, 8, 2, '#1B5E20'); // lid
  g.fillRoundedRect(0, 4, 38, 3, 2, '#2E7D32'); // lid highlight
  g.fillRoundedRect(17, 6, 4, 4, 1, '#0F3D0F'); // handle
  g.fillCircle(19, 22, 6, '#C8E6C9'); // recycling arrows disc
  g.fillCircle(19, 22, 4, '#2E7D32');
  g.fillRect(9, 30, 8, 2, '#FFEB3B'); // graffiti tag accent
  g.outline(OUTLINE);
  writeGrid('decor_dumpster', g);
}

// ── Flowerbed ───────────────────────────────────────────────────────────
// v2: darker soil rim, denser leaf clusters between flowers, brighter
// petal palette so it pops against the courtyard ground texture.
{
  const g = new PixelGrid(60, 42);
  g.fillEllipse(30, 22, 29, 19, '#5D4037'); // soil rim
  g.fillEllipse(30, 21, 27, 17, '#3D7A28');
  g.fillEllipse(30, 20, 24, 15, '#4A9430');
  for (const [lx, ly] of [[14, 16], [46, 16], [30, 30], [18, 28], [42, 28]]) {
    g.fillCircle(lx, ly, 4, '#2E6B1E');
  }
  const petalColors = ['#FF6FA5', '#FFD23D', '#FF6FA5', '#7C4DFF', '#FF6FA5', '#FFFFFF'];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const px = 30 + Math.cos(a) * 15;
    const py = 20 + Math.sin(a) * 9;
    g.fillCircle(px, py, 4.5, petalColors[i]);
    g.fillCircle(px, py, 1.6, '#7A4A00');
  }
  g.fillCircle(30, 20, 4, '#FFD23D');
  g.outline(OUTLINE);
  writeGrid('decor_flowerbed', g);
}

// ── Tree ────────────────────────────────────────────────────────────────
// v2: rounder layered canopy with a lit side, visible root flare and bark
// texture lines on the trunk.
{
  const g = new PixelGrid(52, 68);
  g.fillEllipse(26, 56, 12, 5, '#1B5E20'); // root shadow
  g.fillRoundedRect(20, 44, 10, 18, 3, '#5D4037');
  g.fillRect(20, 44, 3, 18, '#4A3226');
  g.fillRect(27, 44, 3, 18, '#6D4C41');
  g.fillEllipse(26, 28, 24, 23, '#2E7D32');
  g.fillEllipse(17, 20, 16, 16, '#388E3C');
  g.fillEllipse(35, 18, 13, 13, '#2E7D32');
  g.fillEllipse(26, 12, 13, 12, '#43A047');
  g.fillEllipse(19, 15, 8, 7, '#66BB6A'); // sunlit highlight
  g.outline(OUTLINE);
  writeGrid('decor_tree', g);
}

// ── Lamppost ────────────────────────────────────────────────────────────
// v2: tapered pole with a rivet band and a warmer glow halo.
{
  const g = new PixelGrid(20, 66);
  g.fillEllipse(10, 8, 9, 10, '#FFF9C440'); // outer glow
  g.fillRoundedRect(8, 14, 4, 46, 1, '#37474F');
  g.fillRect(8, 30, 4, 2, '#263238'); // rivet band
  g.fillRoundedRect(3, 60, 14, 4, 1, '#263238');
  g.fillEllipse(10, 8, 8, 9, '#FFF9C4');
  g.fillEllipse(10, 8, 5, 6, '#FFEE58');
  g.fillRoundedRect(5, 0, 10, 4, 2, '#455A64');
  g.outline(OUTLINE);
  writeGrid('decor_lamppost', g);
}

// ── Kvass stand ─────────────────────────────────────────────────────────
// v2: adds a canopy stripe pattern, serving window highlight, sign text
// block, and a barrel tap so it reads as a functional kiosk.
{
  const g = new PixelGrid(44, 48);
  g.fillCircle(10, 44, 3, '#3E2A13'); // legs
  g.fillCircle(34, 44, 3, '#3E2A13');
  g.fillRoundedRect(3, 18, 38, 26, 3, '#E65100'); // booth body
  g.fillRoundedRect(3, 18, 38, 8, 2, '#BF360C');
  g.fillRoundedRect(8, 28, 28, 12, 2, '#4A2E1C'); // serving window
  g.fillRoundedRect(9, 29, 26, 8, 1, '#2E1C10');
  g.fillRoundedRect(0, 8, 44, 12, 3, '#FFCA28'); // canopy
  for (let sx = 2; sx < 42; sx += 8) g.fillRect(sx, 8, 4, 12, '#E65100');
  g.fillRoundedRect(18, 34, 8, 12, 2, '#FFC107'); // kvass barrel
  g.fillRect(19, 38, 6, 2, '#B8860B');
  g.fillCircle(22, 44, 2.4, '#5D4037'); // tap
  g.outline(OUTLINE);
  writeGrid('decor_kvass_stand', g);
}

// ── EV charger (broken) ─────────────────────────────────────────────────
// v3: brighter palette so it reads at 32×80 game size — lighter post, visible
// screen crack lines and a blinking red fault LED.
{
  const g = new PixelGrid(32, 80);
  // Base/foot
  g.fillRoundedRect(8, 70, 16, 8, 2, '#546E7A');
  g.fillRoundedRect(9, 69, 14, 3, 1, '#78909C'); // foot highlight
  // Post (steel grey, visible)
  g.fillRoundedRect(12, 30, 8, 42, 2, '#78909C');
  g.fillRect(12, 30, 3, 42, '#90A4AE'); // lit edge
  g.fillRect(17, 30, 3, 42, '#546E7A'); // shadow edge
  // Cable bracket
  g.fillRoundedRect(9, 44, 14, 6, 2, '#546E7A');
  // Cable (dangling, bright orange so it reads)
  g.fillRect(18, 50, 3, 4, '#FF8F00');
  g.fillRect(20, 54, 3, 4, '#FF8F00');
  g.fillRect(19, 58, 3, 4, '#FF8F00');
  g.fillCircle(21, 64, 2, '#E65100'); // plug end
  // Head unit body (slate blue, much lighter than v2)
  g.fillRoundedRect(2, 0, 28, 30, 3, '#455A64');
  g.fillRoundedRect(3, 1, 26, 8, 2, '#607D8B'); // top highlight
  // Screen — cracked, dim (not pitch-black)
  g.fillRoundedRect(5, 4, 22, 18, 2, '#263238');
  g.fillRect(7, 6, 18, 13, '#1C2E38');
  // Crack lines (bright so they read)
  g.fillRect(12, 6, 1, 8, '#4FC3F7');
  g.fillRect(13, 8, 4, 1, '#4FC3F7');
  g.fillRect(17, 7, 1, 6, '#4FC3F7');
  // ⚡ icon ghost
  g.fillRect(10, 11, 2, 4, '#37474F');
  g.fillRect(14, 9, 2, 4, '#37474F');
  g.fillRect(12, 13, 2, 1, '#37474F');
  // Fault LED (red, clearly visible)
  g.fillCircle(24, 5, 3.5, '#FF1744');
  g.fillCircle(23, 4, 1.5, '#FF8A80'); // glint
  // Charging port slot
  g.fillRoundedRect(10, 24, 12, 4, 1, '#37474F');
  g.fillRect(11, 25, 10, 2, '#263238');
  g.outline(OUTLINE);
  writeGrid('decor_ev_charger', g);
}

// ── Fire hydrant ────────────────────────────────────────────────────────
// v2: straight-walled cylinder body (not a squashed rounded-rect, which
// pinched into a heart/berry shape) with a domed cap, flared base, and
// two side nozzles that sit clear of the body outline.
{
  const g = new PixelGrid(22, 32);
  g.fillRoundedRect(4, 25, 14, 5, 2, '#7A1010'); // flared base
  g.fillRect(5, 12, 12, 15, '#D32F2F'); // straight body
  g.fillRect(5, 12, 5, 15, '#E53935'); // lit side
  g.fillRoundedRect(0, 15, 4, 5, 1, '#B71C1C'); // left nozzle
  g.fillRoundedRect(18, 15, 4, 5, 1, '#B71C1C'); // right nozzle
  g.fillCircle(2, 17, 1, '#7A1010');
  g.fillCircle(20, 17, 1, '#7A1010');
  g.fillRoundedRect(6, 8, 10, 5, 2, '#D32F2F'); // collar
  g.fillEllipse(11, 6, 6, 6, '#E53935'); // dome cap
  g.fillEllipse(9, 4, 2.4, 2.4, '#F06B66'); // cap highlight
  g.fillRoundedRect(9, 0, 4, 4, 1, '#B71C1C'); // bolt
  g.outline(OUTLINE);
  writeGrid('decor_hydrant', g);
}

// ── Park trash bin ──────────────────────────────────────────────────────
// v2: rim highlight, liner peeking over the top, and a foot pedal.
{
  const g = new PixelGrid(24, 30);
  g.fillRect(10, 26, 4, 3, '#1B1B1B'); // pedal
  g.fillRoundedRect(4, 8, 16, 19, 3, '#455A64'); // body
  g.fillRoundedRect(4, 8, 6, 19, 2, '#54707D'); // lit side
  g.fillRoundedRect(2, 3, 20, 6, 2, '#263238'); // rim
  g.fillRoundedRect(3, 3, 18, 2, 1, '#37474F'); // liner peeking over
  g.fillRect(10, 11, 4, 13, '#37474F'); // seam
  g.outline(OUTLINE);
  writeGrid('decor_trash_bin', g);
}

// ── Bicycle rack ────────────────────────────────────────────────────────
// v2: adds a second bike frame + basket so the rack doesn't read as empty.
{
  const g = new PixelGrid(54, 30);
  g.fillRoundedRect(2, 20, 50, 4, 2, '#455A64'); // rail
  for (const cx of [10, 27, 44]) g.fillRoundedRect(cx - 2, 6, 4, 16, 2, '#607D8B');
  g.fillCircle(12, 12, 6, '#1565C0'); // bike 1 wheel
  g.fillCircle(12, 12, 3, '#0D3E7A');
  g.fillRoundedRect(12, 6, 10, 2, 1, '#B0BEC5'); // bike 1 frame
  g.fillCircle(34, 10, 6, '#C62828'); // bike 2 wheel
  g.fillCircle(34, 10, 3, '#7A1010');
  g.fillRoundedRect(34, 4, 10, 2, 1, '#B0BEC5'); // bike 2 frame
  g.fillRoundedRect(40, 2, 6, 4, 1, '#8D6E63'); // basket
  g.outline(OUTLINE);
  writeGrid('decor_bicycle_rack', g);
}
