// ─── Generalized top-down character sprite-sheet builder ──────────────────
// Extracted/parameterized from generate-denis-sprite.mjs so the same rounded
// -silhouette pixel-art pipeline can stamp out any character from a small
// palette + headwear config, instead of hand-writing per-character draw code.
// Produces the same 4x4 grid (rows: left/right/down/up, cols: 4 walk frames)
// at 64x64 per frame — drop-in compatible with sprites.ts::SPRITE_SHEETS.

import { PixelGrid, composeSheet } from './pixelart.mjs';
import { encodePNG } from './png.mjs';
import { writeFileSync } from 'node:fs';

export const SIZE = 64;

const CYCLE = [
  { legShift: 4, armSwing: -4, bob: 0 },
  { legShift: 0, armSwing: 0, bob: -2 },
  { legShift: -4, armSwing: 4, bob: 0 },
  { legShift: 0, armSwing: 0, bob: -2 },
];

// ─── Chibi proportions (v2: "beautiful sprites" pass) ──────────────────────
// Reference art (asset-library sheet) reads as chibi: an oversized rounded
// head (~roughly half the figure height) sitting on a short, stubby body,
// every shape finished with a crisp dark outline. v1 used an adult-like
// head-to-body ratio and had no outline at all, which is what made it read
// as a blobby placeholder instead of a finished character. Head radius grew
// 11->15 (mostly by extending both up and down from the same center, so
// existing cap/face-feature offsets barely needed to move) and torso/legs
// were shortened so the head dominates the silhouette. `PixelGrid#outline`
// is called last for every frame — see lib/pixelart.mjs.
const OUTLINE = '#14100C';

/** Draws headwear (or hair-only) onto the front/back builder at cap position. */
function drawHeadFrontBack(g, cx, bob, cfg, facing) {
  const { headwear, hair } = cfg;
  if (facing === 'up') {
    // Back of head — solid dome, no face
    g.fillEllipse(cx, 19 + bob, 14, 12, hair);
    if (headwear.type === 'cap') {
      g.fillEllipse(cx, 10 + bob, 16, 12, headwear.shade);
      g.fillEllipse(cx - 1, 9 + bob, 15, 11, headwear.color);
      g.fillRoundedRect(cx - 7, 17 + bob, 14, 5, 2, headwear.shade);
    } else if (headwear.type === 'bandana') {
      g.fillEllipse(cx, 13 + bob, 15, 9, headwear.shade);
      g.fillEllipse(cx - 1, 12 + bob, 14, 8, headwear.color);
    }
    return;
  }
  // Down (facing viewer)
  if (headwear.type === 'cap') {
    g.fillEllipse(cx, 8 + bob, 16, 10, headwear.shade);
    g.fillEllipse(cx - 2, 7 + bob, 15, 9, headwear.color);
    g.fillRoundedRect(cx - 13, 12 + bob, 26, 5, 2, headwear.bill ?? '#2B2B2E');
    if (headwear.badge) g.fillCircle(cx, 6 + bob, 3.2, headwear.badge);
  } else if (headwear.type === 'bandana') {
    g.fillEllipse(cx, 11 + bob, 14, 8, headwear.shade);
    g.fillEllipse(cx - 1, 10 + bob, 13, 7, headwear.color);
    g.fillRoundedRect(cx - 14, 13 + bob, 7, 5, 2, headwear.color);
  } else if (headwear.type === 'bun') {
    g.fillCircle(cx, 6 + bob, 6, hair);
  } else if (headwear.type === 'none') {
    g.fillRoundedRect(cx - 11, 12 + bob, 22, 6, 3, hair);
  }
}

/** Down (facing viewer) / Up (back view) builder. */
function buildFrontBack(cfg, facing, { legShift, bob }) {
  const g = new PixelGrid(SIZE, SIZE);
  const cx = 32;
  const { skin, skinShade, top, bottom, shoe, shoeSole } = cfg;

  // Legs — short and stubby, chibi body sits below a much bigger head
  const legW = 10;
  const legTopY = 48;
  const legH = 9;
  const leftLegX = cx - 12 - legShift * 0.5;
  const rightLegX = cx + 2 + legShift * 0.5;
  g.fillRoundedRect(Math.round(leftLegX), legTopY + bob, legW, legH, 4, bottom.color);
  g.fillRoundedRect(Math.round(rightLegX), legTopY + bob, legW, legH, 4, bottom.color);
  g.fillRoundedRect(Math.round(leftLegX) + 1, legTopY + legH - 3 + bob, legW - 2, 3, 2, bottom.shade);
  g.fillRoundedRect(Math.round(rightLegX) + 1, legTopY + legH - 3 + bob, legW - 2, 3, 2, bottom.shade);
  g.fillRoundedRect(Math.round(leftLegX) - 1, legTopY + legH - 2 + bob, legW + 2, 6, 3, shoe);
  g.fillRoundedRect(Math.round(rightLegX) - 1, legTopY + legH - 2 + bob, legW + 2, 6, 3, shoe);
  g.fillRoundedRect(Math.round(leftLegX) - 1, legTopY + legH + 2 + bob, legW + 2, 2, 1, shoeSole);
  g.fillRoundedRect(Math.round(rightLegX) - 1, legTopY + legH + 2 + bob, legW + 2, 2, 1, shoeSole);

  // Hips
  g.fillRoundedRect(cx - 15, 44 + bob, 30, 8, 4, bottom.color);

  // Arms
  g.fillRoundedRect(cx - 21, 30 + bob, 9, 18, 4, top.color);
  g.fillRoundedRect(cx + 12, 30 + bob, 9, 18, 4, top.color);
  g.fillCircle(cx - 17, 47 + bob, 4, skin);
  g.fillCircle(cx + 17, 47 + bob, 4, skin);

  // Torso — shortened so the head reads as dominant (chibi ratio)
  g.fillRoundedRect(cx - 15, 28 + bob, 30, 18, 8, top.color);
  g.fillRect(cx + 3, 30 + bob, 12, 14, top.shade);
  if (top.accent) {
    g.fillRect(cx - 1, 31 + bob, 2, 13, top.accent);
  }
  g.fillRoundedRect(cx - 10, 35 + bob, 5, 5, 1, top.shade);
  g.fillRoundedRect(cx - 6, 26 + bob, 12, 5, 2, top.collar ?? top.shade);

  // Head — big and round (chibi), drawn after torso so it dominates the silhouette
  g.fillEllipse(cx, 21 + bob, 15, 15, skin);
  g.fillEllipse(cx + 6, 24 + bob, 9, 10, skinShade);

  if (facing === 'down') {
    g.fillRoundedRect(cx - 9, 16 + bob, 5, 2, 1, cfg.hair);
    g.fillRoundedRect(cx + 4, 16 + bob, 5, 2, 1, cfg.hair);
    g.fillCircle(cx - 6, 20 + bob, 2, '#2A1E14');
    g.fillCircle(cx + 6, 20 + bob, 2, '#2A1E14');
    // Tiny eye highlight — cheap but reads as "alive" instead of dead dots
    g.set(cx - 7, 19 + bob, '#FFFFFF');
    g.set(cx + 5, 19 + bob, '#FFFFFF');
    g.set(cx, 23 + bob, skinShade);
    if (cfg.mustache) g.fillRoundedRect(cx - 4, 26 + bob, 8, 2, 1, cfg.hair);
    g.fillRoundedRect(cx - 3, 27 + bob, 6, 2, 1, '#8A5A38');
    if (cfg.glasses) {
      g.fillRoundedRect(cx - 10, 18 + bob, 7, 5, 2, '#1A1A1A80');
      g.fillRoundedRect(cx + 3, 18 + bob, 7, 5, 2, '#1A1A1A80');
      g.fillRect(cx - 3, 20 + bob, 6, 1, '#1A1A1A80');
    }
  }

  drawHeadFrontBack(g, cx, bob, cfg, facing);

  g.outline(OUTLINE);
  return g;
}

/** Right-facing profile builder (mirrored for Left). */
function buildProfileRight(cfg, { legShift, armSwing, bob }) {
  const g = new PixelGrid(SIZE, SIZE);
  const cx = 34;
  const { skin, skinShade, top, bottom, shoe, shoeSole, hair, headwear } = cfg;

  const legW = 9;
  const nearLegX = cx - 4 + legShift;
  const farLegX = cx - 4 - legShift * 0.6;
  g.fillRoundedRect(Math.round(farLegX) - 3, 48 + bob, legW, 8, 4, bottom.shade);
  g.fillRoundedRect(Math.round(farLegX) - 3, 54 + bob, legW, 6, 3, shoe);

  g.fillRoundedRect(cx - 13, 44 + bob, 22, 8, 4, bottom.color);

  g.fillRoundedRect(Math.round(nearLegX) - 3, 46 + bob, legW, 10, 4, bottom.color);
  g.fillRoundedRect(Math.round(nearLegX) - 4, 54 + bob, legW + 2, 6, 3, shoe);
  g.fillRoundedRect(Math.round(nearLegX) - 4, 58 + bob, legW + 2, 2, 1, shoeSole);

  g.fillRoundedRect(cx - 12, 30 + bob, 8, 14 - armSwing * 0.3, 4, top.shade);

  g.fillRoundedRect(cx - 12, 27 + bob, 26, 18, 8, top.color);
  g.fillRect(cx - 12, 29 + bob, 8, 14, top.shade);
  if (top.accent) g.fillRect(cx + 3, 31 + bob, 2, 12, top.accent);
  g.fillRoundedRect(cx - 3, 25 + bob, 10, 5, 2, top.collar ?? top.shade);

  const armY = 30 + bob + armSwing * 0.4;
  g.fillRoundedRect(cx + 6, armY, 9, 16, 4, top.color);
  g.fillCircle(cx + 10, armY + 16, 4, skin);

  // Head — big and round (chibi)
  g.fillEllipse(cx + 2, 18 + bob, 14, 14, skin);
  g.fillEllipse(cx + 7, 21 + bob, 8, 9, skinShade);
  g.fillCircle(cx + 11, 18 + bob, 2, '#2A1E14');
  g.set(cx + 12, 17 + bob, '#FFFFFF');
  g.fillRoundedRect(cx + 14, 18 + bob, 3, 4, 1, skin);
  if (cfg.mustache) g.fillRoundedRect(cx + 11, 21 + bob, 4, 2, 1, hair);
  g.fillRoundedRect(cx + 8, 22 + bob, 5, 2, 1, '#8A5A38');
  if (cfg.glasses) g.fillRoundedRect(cx + 7, 16 + bob, 8, 5, 2, '#1A1A1A80');

  if (headwear.type === 'cap') {
    g.fillEllipse(cx + 2, 9 + bob, 15, 11, headwear.shade);
    g.fillEllipse(cx + 1, 8 + bob, 14, 10, headwear.color);
    g.fillRoundedRect(cx + 10, 12 + bob, 12, 5, 2, headwear.bill ?? '#2B2B2E');
    if (headwear.badge) g.fillCircle(cx - 4, 7 + bob, 2.8, headwear.badge);
  } else if (headwear.type === 'bandana') {
    g.fillEllipse(cx + 2, 11 + bob, 13, 9, headwear.shade);
    g.fillEllipse(cx + 1, 10 + bob, 12, 8, headwear.color);
  } else if (headwear.type === 'bun') {
    g.fillCircle(cx - 5, 8 + bob, 6, hair);
    g.fillEllipse(cx + 2, 13 + bob, 12, 9, hair);
  } else if (headwear.type === 'none') {
    g.fillEllipse(cx + 2, 13 + bob, 12, 9, hair);
  }

  g.outline(OUTLINE);
  return g;
}

/** Builds and writes a 4x4 (64x64/frame) character walk sheet PNG for `cfg`. */
export function generateCharacterSheet(cfg, outPath) {
  const frames = [];
  for (const pose of CYCLE) frames.push(buildProfileRight(cfg, pose).mirrored());
  for (const pose of CYCLE) frames.push(buildProfileRight(cfg, pose));
  for (const pose of CYCLE) frames.push(buildFrontBack(cfg, 'down', pose));
  for (const pose of CYCLE) frames.push(buildFrontBack(cfg, 'up', pose));

  const { width, height, rgba } = composeSheet(frames, { cols: 4, rows: 4, frameSize: SIZE, scale: 1 });
  const png = encodePNG(width, height, rgba);
  writeFileSync(outPath, png);
  console.log(`Wrote ${outPath} (${width}x${height})`);
}
