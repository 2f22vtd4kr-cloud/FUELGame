// ─── Denis (Яндекс taxi driver) directional walk sprite sheet ──────────────
// Generates public/sprites/char_denis.png as a 4x4 grid of 64x64 frames:
//   Row 0: Walk Left   Row 1: Walk Right   Row 2: Walk Down   Row 3: Walk Up
//
// v4: now a thin config wrapper around the shared `characterBuilder.mjs`
// pipeline (chibi proportions + outline pass) instead of a hand-duplicated
// copy of the body-drawing code — keeps Denis visually consistent with the
// rest of the roster and avoids maintaining two copies of the same logic.
//
// Re-run any time with: pnpm --filter @workspace/game run gen:sprite:denis

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { generateCharacterSheet } from './lib/characterBuilder.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '../public/sprites/char_denis.png');

// Palette (reference: bright yellow cap+hoodie w/ red "Я" badge, blue jeans,
// dark shoes, rounded cartoon silhouette)
const cfg = {
  skin: '#D99A6C',
  skinShade: '#C0805090',
  hair: '#4A2E1C',
  top: { color: '#FFC61E', shade: '#E0A20A', accent: '#8A6200', collar: '#2B2B2E' },
  bottom: { color: '#3D6EA5', shade: '#2A4E78' },
  shoe: '#241C15',
  shoeSole: '#100C08',
  headwear: { type: 'cap', color: '#FFD23D', shade: '#E5A800', bill: '#2B2B2E', badge: '#D81E1E' },
};

generateCharacterSheet(cfg, OUT_PATH);
