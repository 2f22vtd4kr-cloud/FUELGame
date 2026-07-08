// ─── Denis (Яндекс taxi driver) directional walk sprite sheet ──────────────
// Generates public/sprites/char_denis.png as a 4x4 grid of 64x64 frames:
//   Row 0: Walk Left   Row 1: Walk Right   Row 2: Walk Down   Row 3: Walk Up
//
// v3 (rounded redesign): previous versions built the silhouette out of
// straight fillRect bars only, which reads as blocky/right-angled ("abrupt
// square angles" feedback). This version builds every major shape — cap,
// head, torso, arms, legs — out of `fillEllipse`/`fillCircle`/
// `fillRoundedRect` primitives (see scripts/lib/pixelart.mjs) so the
// silhouette is naturally rounded like the reference art, while staying a
// crisp nearest-neighbor pixel-art look (no blur/anti-aliasing). Working
// grid is now 64x64 directly (scale x1) — no upscale needed, more addressable
// detail than the old 32x32x2 pass — final frame size unchanged (64x64), so
// no `sprites.ts` metadata changes are required.
//
// Re-run any time with: pnpm --filter @workspace/game run gen:sprite:denis

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PixelGrid, composeSheet } from './lib/pixelart.mjs';
import { encodePNG } from './lib/png.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '../public/sprites/char_denis.png');

const SIZE = 64; // working grid == final frame size (no upscale)
const SCALE = 1;

// ─── Palette (reference: bright yellow cap+hoodie w/ red "Я" badge, blue
// jeans, dark shoes, rounded cartoon silhouette) ────────────────────────────
const CAP_CROWN = '#FFD23D';
const CAP_CROWN_SHADE = '#E5A800';
const CAP_BILL = '#2B2B2E';
const CAP_BADGE = '#D81E1E';
const HAIR = '#4A2E1C';
const SKIN = '#D99A6C';
const SKIN_SHADE = '#C0805090';
const EYE = '#2A1E14';
const JACKET = '#FFC61E';
const JACKET_SHADE = '#E0A20A';
const JACKET_ZIP = '#8A6200';
const COLLAR = '#2B2B2E';
const JEANS = '#3D6EA5';
const JEANS_SHADE = '#2A4E78';
const SHOE = '#241C15';
const SHOE_SOLE = '#100C08';

// 4-frame walk cycle shared by all directions:
//   0: contact A (stride open one way)   1: passing (mid, raised)
//   2: contact B (stride open other way) 3: passing (mid, raised)
const CYCLE = [
  { legShift: 4, armSwing: -4, bob: 0 },
  { legShift: 0, armSwing: 0, bob: -2 },
  { legShift: -4, armSwing: 4, bob: 0 },
  { legShift: 0, armSwing: 0, bob: -2 },
];

/** Down (facing viewer) / Up (back view) builder. */
function buildFrontBack(facing, { legShift, bob }) {
  const g = new PixelGrid(SIZE, SIZE);
  const cx = 32;

  // ── Legs (drawn first, torso overlaps waist) ──
  const legW = 10;
  const legTopY = 50;
  const legH = 10;
  const leftLegX = cx - 12 - legShift * 0.5;
  const rightLegX = cx + 2 + legShift * 0.5;
  g.fillRoundedRect(Math.round(leftLegX), legTopY + bob, legW, legH, 4, JEANS);
  g.fillRoundedRect(Math.round(rightLegX), legTopY + bob, legW, legH, 4, JEANS);
  g.fillRoundedRect(Math.round(leftLegX) + 1, legTopY + legH - 3 + bob, legW - 2, 3, 2, JEANS_SHADE);
  g.fillRoundedRect(Math.round(rightLegX) + 1, legTopY + legH - 3 + bob, legW - 2, 3, 2, JEANS_SHADE);
  // Shoes
  g.fillRoundedRect(Math.round(leftLegX) - 1, legTopY + legH - 2 + bob, legW + 2, 6, 3, SHOE);
  g.fillRoundedRect(Math.round(rightLegX) - 1, legTopY + legH - 2 + bob, legW + 2, 6, 3, SHOE);
  g.fillRoundedRect(Math.round(leftLegX) - 1, legTopY + legH + 2 + bob, legW + 2, 2, 1, SHOE_SOLE);
  g.fillRoundedRect(Math.round(rightLegX) - 1, legTopY + legH + 2 + bob, legW + 2, 2, 1, SHOE_SOLE);

  // ── Hips band ──
  g.fillRoundedRect(cx - 15, 48 + bob, 30, 8, 4, JEANS);

  // ── Arms (behind torso edges, rounded capsules) ──
  g.fillRoundedRect(cx - 21, 32 + bob, 9, 20, 4, JACKET);
  g.fillRoundedRect(cx + 12, 32 + bob, 9, 20, 4, JACKET);
  g.fillCircle(cx - 17, 51 + bob, 4, SKIN);
  g.fillCircle(cx + 17, 51 + bob, 4, SKIN);

  // ── Torso (hoodie) — rounded rect body ──
  g.fillRoundedRect(cx - 16, 30 + bob, 32, 24, 9, JACKET);
  g.fillRect(cx + 4, 32 + bob, 12, 20, JACKET_SHADE);
  // Zipper + pocket + collar detail
  g.fillRect(cx - 1, 33 + bob, 2, 18, JACKET_ZIP);
  g.fillRoundedRect(cx - 11, 39 + bob, 5, 6, 1, JACKET_SHADE);
  g.fillRoundedRect(cx - 6, 28 + bob, 12, 5, 2, COLLAR);

  // ── Head ──
  g.fillEllipse(cx, 24 + bob, 11, 11, SKIN);
  g.fillEllipse(cx + 5, 26 + bob, 7, 8, SKIN_SHADE);

  if (facing === 'down') {
    // Eyebrows — sit clear of the cap bill, well above the eyes
    g.fillRoundedRect(cx - 8, 20 + bob, 4, 2, 1, HAIR);
    g.fillRoundedRect(cx + 4, 20 + bob, 4, 2, 1, HAIR);
    // Eyes
    g.fillCircle(cx - 6, 23 + bob, 1.6, EYE);
    g.fillCircle(cx + 6, 23 + bob, 1.6, EYE);
    // Nose hint
    g.set(cx, 26 + bob, SKIN_SHADE);
    // Mouth — small friendly smile
    g.fillRoundedRect(cx - 3, 29 + bob, 6, 2, 1, '#8A5A38');

    // Cap (drawn last, but kept above the eyebrow line so it never reads
    // as sunglasses across the face)
    g.fillEllipse(cx, 9 + bob, 13, 9, CAP_CROWN_SHADE);
    g.fillEllipse(cx - 2, 8 + bob, 12, 8, CAP_CROWN);
    g.fillRoundedRect(cx - 11, 13 + bob, 22, 4, 2, CAP_BILL);
    g.fillCircle(cx, 7 + bob, 3, CAP_BADGE);
  } else {
    // Back of head: solid cap dome + a sliver of hair at the nape, no face
    g.fillEllipse(cx, 20 + bob, 11, 10, HAIR);
    g.fillEllipse(cx, 11 + bob, 13, 11, CAP_CROWN_SHADE);
    g.fillEllipse(cx - 1, 10 + bob, 12, 10, CAP_CROWN);
    g.fillRoundedRect(cx - 6, 18 + bob, 12, 4, 2, CAP_CROWN_SHADE);
  }

  return g;
}

/** Right-facing profile builder (mirrored for Left). */
function buildProfileRight({ legShift, armSwing, bob }) {
  const g = new PixelGrid(SIZE, SIZE);
  const cx = 34; // slightly right-biased so the character reads as facing right

  // ── Trailing (far) leg — behind, mostly hidden ──
  const legW = 9;
  const nearLegX = cx - 4 + legShift;
  const farLegX = cx - 4 - legShift * 0.6;
  g.fillRoundedRect(Math.round(farLegX) - 3, 50 + bob, legW, 9, 4, JEANS_SHADE);
  g.fillRoundedRect(Math.round(farLegX) - 3, 56 + bob, legW, 6, 3, SHOE);

  // ── Hips ──
  g.fillRoundedRect(cx - 13, 48 + bob, 22, 8, 4, JEANS);

  // ── Near (front) leg — swings with the stride ──
  g.fillRoundedRect(Math.round(nearLegX) - 3, 50 + bob, legW, 10, 4, JEANS);
  g.fillRoundedRect(Math.round(nearLegX) - 4, 58 + bob, legW + 2, 6, 3, SHOE);
  g.fillRoundedRect(Math.round(nearLegX) - 4, 62 + bob, legW + 2, 2, 1, SHOE_SOLE);

  // ── Trailing arm (behind torso) ──
  g.fillRoundedRect(cx - 12, 34 + bob, 8, 16 - armSwing * 0.3, 4, JACKET_SHADE);

  // ── Torso (hoodie), profile — rounded capsule leaning slightly forward ──
  g.fillRoundedRect(cx - 12, 30 + bob, 26, 24, 9, JACKET);
  g.fillRect(cx - 12, 32 + bob, 8, 20, JACKET_SHADE);
  g.fillRect(cx + 3, 34 + bob, 2, 16, JACKET_ZIP);
  g.fillRoundedRect(cx - 3, 28 + bob, 10, 5, 2, COLLAR);

  // ── Swinging (near) arm ──
  const armY = 34 + bob + armSwing * 0.4;
  g.fillRoundedRect(cx + 6, armY, 9, 18, 4, JACKET);
  g.fillCircle(cx + 10, armY + 18, 4, SKIN);

  // ── Head (profile) ──
  g.fillEllipse(cx + 2, 20 + bob, 10, 10, SKIN);
  g.fillEllipse(cx + 6, 22 + bob, 6, 7, SKIN_SHADE);
  // Eye
  g.fillCircle(cx + 8, 20 + bob, 1.4, EYE);
  // Nose bump
  g.fillRoundedRect(cx + 11, 20 + bob, 2, 3, 1, SKIN);
  // Mouth
  g.fillRoundedRect(cx + 6, 24 + bob, 4, 2, 1, '#8A5A38');

  // Cap (profile — bill points right, in the facing direction)
  g.fillEllipse(cx + 1, 11 + bob, 12, 10, CAP_CROWN_SHADE);
  g.fillEllipse(cx, 10 + bob, 11, 9, CAP_CROWN);
  g.fillRoundedRect(cx + 8, 15 + bob, 10, 5, 2, CAP_BILL);
  g.fillCircle(cx - 3, 9 + bob, 2.6, CAP_BADGE);

  return g;
}

const frames = [];

// Row 0: Walk Left = mirror of Right profile
for (const pose of CYCLE) frames.push(buildProfileRight(pose).mirrored());
// Row 1: Walk Right
for (const pose of CYCLE) frames.push(buildProfileRight(pose));
// Row 2: Walk Down
for (const pose of CYCLE) frames.push(buildFrontBack('down', pose));
// Row 3: Walk Up
for (const pose of CYCLE) frames.push(buildFrontBack('up', pose));

const { width, height, rgba } = composeSheet(frames, { cols: 4, rows: 4, frameSize: SIZE, scale: SCALE });
const png = encodePNG(width, height, rgba);
writeFileSync(OUT_PATH, png);
console.log(`Wrote ${OUT_PATH} (${width}x${height})`);
