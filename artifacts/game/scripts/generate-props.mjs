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

// ── Bench ───────────────────────────────────────────────────────────────
{
  const g = new PixelGrid(48, 22);
  g.fillRoundedRect(2, 14, 44, 5, 2, '#6B4A22');
  g.fillRoundedRect(2, 4, 44, 8, 3, '#8B6914');
  g.fillRoundedRect(2, 4, 44, 3, 2, '#A9812E');
  g.fillRect(5, 19, 3, 3, '#3E2A13');
  g.fillRect(40, 19, 3, 3, '#3E2A13');
  writeGrid('decor_bench', g);
}

// ── Dumpster ────────────────────────────────────────────────────────────
{
  const g = new PixelGrid(38, 36);
  g.fillRoundedRect(2, 8, 34, 26, 4, '#43A047');
  g.fillRoundedRect(2, 8, 34, 8, 3, '#2E7D32');
  g.fillRoundedRect(0, 4, 38, 6, 2, '#1B5E20');
  g.fillRoundedRect(6, 30, 6, 5, 1, '#1B1B1B');
  g.fillRoundedRect(26, 30, 6, 5, 1, '#1B1B1B');
  g.fillCircle(19, 20, 6, '#C8E6C9');
  writeGrid('decor_dumpster', g);
}

// ── Flowerbed ───────────────────────────────────────────────────────────
{
  const g = new PixelGrid(60, 40);
  g.fillEllipse(30, 20, 29, 19, '#3D7A28');
  g.fillEllipse(30, 20, 26, 16, '#4A9430');
  const petalColors = ['#FF6FA5', '#FFD23D', '#FF6FA5', '#FFD23D', '#FF6FA5', '#FFFFFF'];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const px = 30 + Math.cos(a) * 14;
    const py = 20 + Math.sin(a) * 8;
    g.fillCircle(px, py, 4, petalColors[i]);
    g.fillCircle(px, py, 1.4, '#7A4A00');
  }
  writeGrid('decor_flowerbed', g);
}

// ── Tree ────────────────────────────────────────────────────────────────
{
  const g = new PixelGrid(50, 66);
  g.fillRoundedRect(21, 46, 8, 18, 2, '#5D4037');
  g.fillRoundedRect(21, 46, 8, 6, 2, '#4A3226');
  g.fillEllipse(25, 30, 23, 22, '#2E7D32');
  g.fillEllipse(18, 22, 15, 15, '#388E3C');
  g.fillEllipse(32, 20, 13, 13, '#43A047');
  g.fillEllipse(25, 14, 12, 11, '#4CAF50');
  writeGrid('decor_tree', g);
}

// ── Lamppost ────────────────────────────────────────────────────────────
{
  const g = new PixelGrid(18, 64);
  g.fillRoundedRect(7, 12, 4, 48, 1, '#37474F');
  g.fillRoundedRect(2, 58, 14, 4, 1, '#263238');
  g.fillEllipse(9, 8, 8, 9, '#FFF9C4');
  g.fillEllipse(9, 8, 5, 6, '#FFEE58');
  g.fillRoundedRect(4, 0, 10, 4, 2, '#455A64');
  writeGrid('decor_lamppost', g);
}

// ── Kvass stand ─────────────────────────────────────────────────────────
{
  const g = new PixelGrid(42, 46);
  g.fillRoundedRect(2, 16, 38, 26, 3, '#E65100');
  g.fillRoundedRect(2, 16, 38, 6, 2, '#BF360C');
  g.fillRoundedRect(0, 8, 42, 10, 3, '#FFCA28');
  g.fillRoundedRect(17, 30, 8, 12, 2, '#FFC107');
  g.fillCircle(21, 42, 3, '#795548');
  writeGrid('decor_kvass_stand', g);
}

// ── EV charger (broken) ─────────────────────────────────────────────────
{
  const g = new PixelGrid(30, 78);
  g.fillRoundedRect(11, 30, 8, 44, 2, '#546E7A');
  g.fillRoundedRect(9, 44, 12, 6, 2, '#37474F');
  g.fillRoundedRect(2, 0, 26, 24, 3, '#1A237E');
  g.fillRoundedRect(4, 2, 22, 18, 2, '#151B60');
  g.fillCircle(23, 40, 3, '#FF1744');
  writeGrid('decor_ev_charger', g);
}

// ── Fire hydrant ────────────────────────────────────────────────────────
{
  const g = new PixelGrid(20, 30);
  g.fillRoundedRect(7, 22, 6, 6, 2, '#7A1010');
  g.fillRoundedRect(4, 8, 12, 16, 4, '#D32F2F');
  g.fillRoundedRect(2, 12, 4, 6, 2, '#B71C1C');
  g.fillRoundedRect(14, 12, 4, 6, 2, '#B71C1C');
  g.fillEllipse(10, 6, 6, 6, '#E53935');
  g.fillRoundedRect(8, 0, 4, 4, 1, '#B71C1C');
  writeGrid('decor_hydrant', g);
}

// ── Park trash bin ──────────────────────────────────────────────────────
{
  const g = new PixelGrid(22, 28);
  g.fillRoundedRect(3, 6, 16, 20, 3, '#455A64');
  g.fillRoundedRect(1, 2, 20, 6, 2, '#263238');
  g.fillRect(9, 10, 4, 12, '#37474F');
  writeGrid('decor_trash_bin', g);
}

// ── Bicycle rack ────────────────────────────────────────────────────────
{
  const g = new PixelGrid(52, 26);
  g.fillRoundedRect(2, 18, 48, 4, 2, '#455A64');
  for (const cx of [10, 26, 42]) g.fillRoundedRect(cx - 2, 4, 4, 16, 2, '#607D8B');
  g.fillCircle(12, 10, 5, '#1565C0');
  g.fillCircle(30, 8, 5, '#C62828');
  writeGrid('decor_bicycle_rack', g);
}
