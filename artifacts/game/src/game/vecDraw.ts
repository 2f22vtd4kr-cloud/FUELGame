// ─── 95-Й Бакстаб — Procedural Vector Art ──────────────────────────────────────
// Visual style: Among Us — flat fills, 2.5–3px solid black outlines, clean
// geometry, no PNG textures, muted Soviet-courtyard colour palette.
// All drawing is pure Canvas 2D — no images, no gradients, no noise.

// ── Soviet Courtyard Palette ──────────────────────────────────────────────────

export const VC = {
  // Ground
  asphalt:      '#565250',   // parking lot — dark warm charcoal
  asphaltShade: '#484644',   // strip shadows
  grass:        '#58944A',   // garden — muted olive-green
  grassDark:    '#4A8040',   // grass detail
  concrete:     '#9A9080',   // central path
  play:         '#C89040',   // playground rubber mat
  playBorder:   '#9A6C20',
  // Building
  building:     '#C4B4A0',   // apartment plaster
  buildingDark: '#A89C8A',   // shadow/edge
  outline:      '#1A1A1A',   // main thick outline
  // Windows
  winFrame:     '#47596A',
  winLit:       '#FFE080',
  winDark:      '#1A2535',
  winCurtain:   'rgba(200,175,140,0.5)',
  // Entrance
  entrance:     '#2A2438',
  // Parking lines
  parkLine:     'rgba(255,255,255,0.55)',
  // Subtle grid
  asphaltGrid:  'rgba(255,255,255,0.045)',
  grassGrid:    'rgba(0,0,0,0.07)',
  // Character visor
  visor:        '#7DD0CC',
  visorShine:   'rgba(255,255,255,0.35)',
  visorShadow:  '#4AACB0',
};

// ── Utility ───────────────────────────────────────────────────────────────────

function outline(ctx: CanvasRenderingContext2D, lw = 2.5) {
  ctx.strokeStyle = VC.outline;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round' as CanvasLineJoin;
}

// Flat rect with thick outline
export function vecRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  fill: string, lw = 2.5,
): void {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  outline(ctx, lw);
  ctx.strokeRect(x + lw / 2, y + lw / 2, w - lw, h - lw);
}

// Flat rounded-rect with thick outline
export function vecRRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  fill: string, strokeColor = VC.outline, lw = 2.5,
): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lw;
  ctx.stroke();
}

// ── Window helper (used by background) ───────────────────────────────────────

function seededVal(wx: number, wy: number): number {
  // deterministic pseudo-random from grid position
  const n = Math.sin(wx * 127.1 + wy * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function drawWindow(
  ctx: CanvasRenderingContext2D,
  wx: number, wy: number, ww: number, wh: number, seed: number,
): void {
  const lit = seed > 0.32;
  const hasCurtain = lit && seed > 0.72;
  // Frame
  ctx.fillStyle = VC.winFrame;
  ctx.fillRect(wx, wy, ww, wh);
  // Pane
  ctx.fillStyle = lit ? VC.winLit : VC.winDark;
  ctx.fillRect(wx + 2, wy + 2, ww - 4, wh - 4);
  // Divider cross
  ctx.fillStyle = VC.winFrame;
  ctx.fillRect(wx + Math.floor(ww / 2) - 1, wy + 2, 2, wh - 4);
  ctx.fillRect(wx + 2, wy + Math.floor(wh * 0.45), ww - 4, 1);
  // Curtain
  if (hasCurtain) {
    ctx.fillStyle = VC.winCurtain;
    ctx.fillRect(wx + 2, wy + 2, Math.floor((ww - 4) * 0.45), wh - 4);
  }
  // Outer frame outline
  ctx.strokeStyle = VC.outline;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(wx + 0.75, wy + 0.75, ww - 1.5, wh - 1.5);
}

// ── Security camera ───────────────────────────────────────────────────────────

function drawCamera(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, flip: boolean,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  if (flip) ctx.scale(-1, 1);
  // Mount bracket
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-4, -5, 8, 11);
  // Camera body
  ctx.fillStyle = '#455A64';
  ctx.beginPath();
  ctx.roundRect(0, -1, 18, 8, 2);
  ctx.fill();
  ctx.strokeStyle = VC.outline;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Lens
  ctx.fillStyle = '#263238';
  ctx.beginPath();
  ctx.arc(17, 3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = VC.outline;
  ctx.lineWidth = 1;
  ctx.stroke();
  // Indicator LED
  ctx.fillStyle = '#B71C1C';
  ctx.beginPath();
  ctx.arc(21, 1, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Background (full procedural, Among Us flat-geometry style) ────────────────

export function drawBackgroundVec(
  ctx: CanvasRenderingContext2D,
  MAP_W: number,
  MAP_H: number,
  PLAYGROUND: { x: number; y: number; w: number; h: number },
): void {
  // ── Base: building fill covers entire canvas ───────────────────────────────
  ctx.fillStyle = VC.building;
  ctx.fillRect(0, 0, MAP_W, MAP_H);

  // ── Parking / asphalt zone ─────────────────────────────────────────────────
  ctx.fillStyle = VC.asphalt;
  ctx.fillRect(90, 90, 1020, 380);

  // Very subtle tile grid (same hue, barely visible — like Among Us floors)
  ctx.strokeStyle = VC.asphaltGrid;
  ctx.lineWidth = 1;
  for (let gx = 90; gx <= 1110; gx += 55) {
    ctx.beginPath(); ctx.moveTo(gx, 90); ctx.lineTo(gx, 470); ctx.stroke();
  }
  for (let gy = 90; gy <= 470; gy += 55) {
    ctx.beginPath(); ctx.moveTo(90, gy); ctx.lineTo(1110, gy); ctx.stroke();
  }

  // Parking spot lines — thick & clean
  ctx.strokeStyle = VC.parkLine;
  ctx.lineWidth = 2;
  ctx.textAlign = 'center';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillStyle = VC.parkLine;
  let spotNum = 1;
  for (let px = 140; px < 1090; px += 130) {
    ctx.strokeRect(px + 1.5, 101, 108, 178);
    ctx.fillText(spotNum.toString(), px + 55, 120);
    spotNum++;
    ctx.strokeRect(px + 1.5, 293, 108, 168);
    ctx.fillText(spotNum.toString(), px + 55, 312);
    spotNum++;
  }

  // ── Grass garden zone ──────────────────────────────────────────────────────
  ctx.fillStyle = VC.grass;
  ctx.fillRect(90, 470, 1020, 340);

  // Subtle grass grid
  ctx.strokeStyle = VC.grassGrid;
  ctx.lineWidth = 1;
  for (let gx = 90; gx <= 1110; gx += 50) {
    ctx.beginPath(); ctx.moveTo(gx, 470); ctx.lineTo(gx, 810); ctx.stroke();
  }
  for (let gy = 470; gy <= 810; gy += 50) {
    ctx.beginPath(); ctx.moveTo(90, gy); ctx.lineTo(1110, gy); ctx.stroke();
  }

  // ── Central garden path ────────────────────────────────────────────────────
  ctx.fillStyle = VC.concrete;
  ctx.fillRect(560, 470, 80, 340);
  // Edge shadow strips
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.fillRect(560, 470, 4, 340);
  ctx.fillRect(636, 470, 4, 340);

  // ── Zone divider (parking ↔ garden) ───────────────────────────────────────
  ctx.strokeStyle = VC.outline;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(90, 470.5); ctx.lineTo(1110, 470.5);
  ctx.stroke();

  // ── Playground ────────────────────────────────────────────────────────────
  ctx.fillStyle = VC.play;
  ctx.fillRect(PLAYGROUND.x, PLAYGROUND.y, PLAYGROUND.w, PLAYGROUND.h);
  ctx.strokeStyle = VC.playBorder;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(PLAYGROUND.x + 1, PLAYGROUND.y + 1, PLAYGROUND.w - 2, PLAYGROUND.h - 2);
  ctx.setLineDash([]);
  // Label (like Among Us room names)
  ctx.fillStyle = VC.playBorder;
  ctx.globalAlpha = 0.55;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🛝 Детская', PLAYGROUND.x + PLAYGROUND.w / 2, PLAYGROUND.y + PLAYGROUND.h / 2);
  ctx.globalAlpha = 1;

  // ── Building strips (re-draw on top to cover any overflow) ────────────────
  const strips = [
    [0, 0, MAP_W, 90],
    [0, 810, MAP_W, 90],
    [0, 90, 90, 720],
    [1110, 90, 90, 720],
  ] as const;

  for (const [bx, by, bw, bh] of strips) {
    ctx.fillStyle = VC.building;
    ctx.fillRect(bx, by, bw, bh);
    // Inward shadow edge
    ctx.fillStyle = VC.buildingDark;
    if (by === 0) {
      ctx.fillRect(bx, by + bh - 8, bw, 8);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(bx, by + bh - 4, bw, 4);
    }
    if (by === 810) {
      ctx.fillRect(bx, by, bw, 8);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(bx, by, bw, 4);
    }
    if (bx === 0 && bw === 90) {
      ctx.fillRect(bx + bw - 8, by, 8, bh);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(bx + bw - 4, by, 4, bh);
    }
    if (bx === 1110) {
      ctx.fillRect(bx, by, 8, bh);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(bx, by, 4, bh);
    }
  }

  // ── Building outline borders (Among Us thick outlines) ─────────────────────
  ctx.strokeStyle = VC.outline;
  ctx.lineWidth = 3;
  ctx.strokeRect(0.5, 0.5, MAP_W - 1, 90);
  ctx.strokeRect(0.5, 810.5, MAP_W - 1, 89);
  ctx.strokeRect(0.5, 90.5, 90, 719);
  ctx.strokeRect(1110.5, 90.5, 89, 719);

  // ── Windows ────────────────────────────────────────────────────────────────
  // Top strip — 2 rows
  for (const wy of [10, 52]) {
    for (let wx = 110; wx < 1090; wx += 62) {
      if (wy === 52 && wx > 430 && wx < 760) continue; // entrance gap
      drawWindow(ctx, wx, wy, 30, 26, seededVal(wx, wy));
    }
  }
  // Bottom strip — 2 rows (split by entrance)
  for (const wy of [818, 858]) {
    for (let wx = 110; wx < 440; wx += 62) drawWindow(ctx, wx, wy, 30, 22, seededVal(wx, wy));
    for (let wx = 760; wx < 1090; wx += 62) drawWindow(ctx, wx, wy, 30, 22, seededVal(wx, wy));
  }
  // Left strip — inward-facing windows
  for (let wy = 124; wy < 790; wy += 82) {
    for (const wx of [10, 54]) drawWindow(ctx, wx, wy, 26, 34, seededVal(wx, wy));
    ctx.strokeStyle = '#546E7A'; ctx.lineWidth = 1;
    ctx.strokeRect(5, wy + 38, 80, 10);
  }
  // Right strip
  for (let wy = 124; wy < 790; wy += 82) {
    for (const wx of [1114, 1158]) drawWindow(ctx, wx, wy, 26, 34, seededVal(wx, wy));
    ctx.strokeStyle = '#546E7A'; ctx.lineWidth = 1;
    ctx.strokeRect(1115, wy + 38, 80, 10);
  }

  // ── Entrance arch ──────────────────────────────────────────────────────────
  ctx.fillStyle = VC.entrance;
  ctx.fillRect(450, 810, 300, 90);
  ctx.strokeStyle = VC.outline;
  ctx.lineWidth = 3;
  ctx.strokeRect(450.5, 810.5, 299, 89);
  // Dashed centre line
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 7]);
  ctx.beginPath(); ctx.moveTo(600, 813); ctx.lineTo(600, 897); ctx.stroke();
  ctx.setLineDash([]);
  // Arch label
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ВЪЕЗД', 600, 862);

  // ── Security cameras ───────────────────────────────────────────────────────
  drawCamera(ctx, 128, 92, false);
  drawCamera(ctx, 1072, 92, true);
  drawCamera(ctx, 128, 808, false);
  drawCamera(ctx, 1072, 808, true);

  // ── Zone labels (Among Us room name style — subtle, low-opacity) ───────────
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ПАРКОВКА', 600, 290);
  ctx.fillText('ДВОР', 320, 660);
  ctx.fillText('ДВОР', 860, 660);
}

// ── Character (Among Us bean-style, adapted for Soviet neighbours) ────────────

/**
 * Draws a top-down Among Us-style character.
 *  – Oval bean body with thick 3px black outline
 *  – Directional visor (glassy teal) clipped to body
 *  – Small backpack bump on opposite side
 *  – Flat fill, no textures
 * Call drawCharacterDetails() after this for per-character accessories.
 */
export function drawCharacterVec(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  facingAngle: number,   // radians: 0 = right, PI/2 = down
  isCrouching: boolean,
  isBarsik: boolean,
): void {
  const s  = isCrouching ? 0.80 : 1.0;
  const RW = (isBarsik ? 9 : 14) * s;   // half-width
  const RH = (isBarsik ? 10 : 17) * s;  // half-height (slightly taller)

  // Determine cardinal facing direction
  const a = ((facingAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const dir: 'r' | 'd' | 'l' | 'u' =
    a < Math.PI * 0.25 || a >= Math.PI * 1.75 ? 'r'
    : a < Math.PI * 0.75                       ? 'd'
    : a < Math.PI * 1.25                       ? 'l'
    :                                            'u';

  ctx.save();
  ctx.translate(x, y);

  // ── Shadow (subtle drop shadow ellipse) ───────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, RH * 0.85, RW * 1.1, RH * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Backpack (rounded rect peeking out on back side) ──────────────────────
  if (!isBarsik) {
    const BP_W = RW * 0.55;
    const BP_H = RH * 0.9;
    let bpx = 0, bpy = 0, bpw = BP_W, bph = BP_H;
    if (dir === 'r') { bpx = -RW - BP_W + 1; bpy = -RH * 0.35; }
    if (dir === 'l') { bpx =  RW - 1;          bpy = -RH * 0.35; }
    if (dir === 'd') { bpx = -RW * 0.35; bpy = -RH - BP_W + 1; bpw = RW * 0.7; bph = BP_W; }
    if (dir === 'u') { bpx = -RW * 0.35; bpy =  RH - 1;          bpw = RW * 0.7; bph = BP_W; }
    ctx.fillStyle = color;
    ctx.strokeStyle = VC.outline;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(bpx, bpy, bpw, bph, 3);
    ctx.fill();
    ctx.stroke();
  }

  // ── Body oval ─────────────────────────────────────────────────────────────
  ctx.fillStyle = color;
  ctx.strokeStyle = VC.outline;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.ellipse(0, 0, RW, RH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // ── Visor (clipped to body, glassy teal) ──────────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, RW - 0.5, RH - 0.5, 0, 0, Math.PI * 2);
  ctx.clip();

  // Visor covers the facing half of the body
  const visorOffset = RW * 0.12; // slight inset from centre
  let vx = 0, vy = 0, vw = 0, vh = 0;
  if (dir === 'r') { vx = visorOffset;  vy = -RH; vw = RW + 2;       vh = RH * 2; }
  if (dir === 'l') { vx = -RW - 2;      vy = -RH; vw = RW - visorOffset + 2; vh = RH * 2; }
  if (dir === 'd') { vx = -RW;          vy = visorOffset; vw = RW * 2; vh = RH + 2; }
  if (dir === 'u') { vx = -RW;          vy = -RH - 2;    vw = RW * 2; vh = RH - visorOffset + 2; }

  ctx.fillStyle = VC.visor;
  ctx.fillRect(vx, vy, vw, vh);

  // Visor shine (small highlight stripe near edge)
  ctx.fillStyle = VC.visorShine;
  if (dir === 'r') {
    ctx.fillRect(vx + 2, vy + RH * 0.2, RW * 0.28, RH * 0.4);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(vx + 6, vy + RH * 0.7, 3, 3);
  }
  if (dir === 'l') {
    ctx.fillRect(vx + vw - RW * 0.28 - 2, vy + RH * 0.2, RW * 0.28, RH * 0.4);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(vx + vw - 9, vy + RH * 0.7, 3, 3);
  }
  if (dir === 'd') {
    ctx.fillRect(vx + RW * 0.2, vy + 2, RW * 0.5, RH * 0.28);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(vx + RW * 0.8, vy + 6, 3, 3);
  }
  if (dir === 'u') {
    ctx.fillRect(vx + RW * 0.2, vy + vh - RH * 0.28 - 2, RW * 0.5, RH * 0.28);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(vx + RW * 0.8, vy + vh - 9, 3, 3);
  }

  ctx.restore(); // unclip

  ctx.restore();
}

// ── Car (top-down Lada/Zhiguli style) ─────────────────────────────────────────

/**
 * Draws a flat top-down Soviet car (Lada-style) in Among Us vector style.
 * Oriented vertically (nose pointing toward top of map / y-axis).
 * Sized to fill roughly the same footprint as the old 90×90 AI sprites.
 */
export function drawCarVec(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
): void {
  const CW = 26; // half-width (total = 52)
  const CH = 36; // half-height (total = 72)
  const WW = 11; // wheel width
  const WH = 14; // wheel height

  ctx.save();
  ctx.translate(x, y);

  // ── Wheels (back, drawn first so body covers inner edge) ──────────────────
  ctx.fillStyle = '#252220';
  ctx.strokeStyle = VC.outline;
  ctx.lineWidth = 2;
  const wheels = [
    [-CW - WW * 0.5,  -CH + 6],   // front-left
    [ CW - WW * 0.5,  -CH + 6],   // front-right
    [-CW - WW * 0.5,   CH - 6 - WH], // rear-left
    [ CW - WW * 0.5,   CH - 6 - WH], // rear-right
  ];
  for (const [wx, wy] of wheels) {
    ctx.beginPath();
    ctx.roundRect(wx, wy, WW, WH, 2);
    ctx.fill();
    ctx.stroke();
    // Wheel hub
    ctx.fillStyle = '#4A4644';
    ctx.beginPath();
    ctx.ellipse(wx + WW / 2, wy + WH / 2, WW * 0.28, WH * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#252220'; // reset for next wheel
  }

  // ── Body ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = color;
  ctx.strokeStyle = VC.outline;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.roundRect(-CW, -CH, CW * 2, CH * 2, 7);
  ctx.fill();
  ctx.stroke();

  // ── Front windshield ──────────────────────────────────────────────────────
  ctx.fillStyle = VC.visor;
  ctx.strokeStyle = VC.outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-CW * 0.72, -CH + 5, CW * 1.44, CH * 0.48, 4);
  ctx.fill();
  ctx.stroke();
  // Windshield shine
  ctx.fillStyle = VC.visorShine;
  ctx.beginPath();
  ctx.roundRect(-CW * 0.55, -CH + 7, CW * 0.45, 4, 2);
  ctx.fill();

  // ── Rear window ───────────────────────────────────────────────────────────
  ctx.fillStyle = '#5EB8C0';
  ctx.strokeStyle = VC.outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-CW * 0.6, CH * 0.45, CW * 1.2, CH * 0.45, 4);
  ctx.fill();
  ctx.stroke();

  // ── Roof highlight (lighter central panel) ────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.roundRect(-CW * 0.4, -CH * 0.08, CW * 0.8, CH * 0.35, 3);
  ctx.fill();

  // ── Hood line ─────────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-CW + 4, -CH + CH * 0.55);
  ctx.lineTo( CW - 4, -CH + CH * 0.55);
  ctx.stroke();

  ctx.restore();
}

// ── Decorations ───────────────────────────────────────────────────────────────

/**
 * Draw a Soviet bench — plank seats, wooden frame, thick outline.
 */
export function drawBenchVec(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  // Seat planks
  ctx.fillStyle = '#9C7A3C';
  ctx.strokeStyle = VC.outline;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(-26, -7, 52, 8, 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-26,  2, 52, 7, 2); ctx.fill(); ctx.stroke();
  // Back rest
  ctx.fillStyle = '#7A5E2A';
  ctx.beginPath(); ctx.roundRect(-26, -15, 52, 6, 2); ctx.fill(); ctx.stroke();
  // Legs
  ctx.fillStyle = '#666250';
  ctx.lineWidth = 2;
  for (const lx of [-22, -6, 14, 22]) {
    ctx.beginPath(); ctx.roundRect(lx, 9, 5, 8, 1); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draw a Soviet-green dumpster — chunky container with lid.
 */
export function drawDumpsterVec(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  // Body
  vecRRect(ctx, -18, -10, 36, 24, 3, '#3E7D40');
  // Lid
  vecRRect(ctx, -20, -18, 40, 11, 3, '#4CAF50');
  // Highlight stripe
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath(); ctx.roundRect(-15, -16, 30, 3, 2); ctx.fill();
  // Recycle icon
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('♻', 0, 3);
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

/**
 * Draw a flowerbed — bordered soil patch with flat coloured flowers.
 */
export function drawFlowerbedVec(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  // Soil base
  vecRRect(ctx, -28, -16, 56, 28, 4, '#7A5C30');
  // Dark soil detail
  ctx.fillStyle = '#6A4C20';
  ctx.beginPath(); ctx.ellipse(0, 4, 20, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Flowers
  const flowers = [
    { fx: -14, fy: -4, color: '#FF6090' },
    { fx:   0, fy: -6, color: '#FFD700' },
    { fx:  13, fy: -3, color: '#FF80AB' },
    { fx:  -6, fy:  5, color: '#FF6090' },
    { fx:   8, fy:  4, color: '#FFECB3' },
  ];
  for (const { fx, fy, color } of flowers) {
    // Petals
    ctx.fillStyle = color;
    for (let p = 0; p < 5; p++) {
      const pa = (p / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(fx + Math.cos(pa) * 5, fy + Math.sin(pa) * 5, 3, 3, pa, 0, Math.PI * 2);
      ctx.fill();
    }
    // Centre
    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.arc(fx, fy, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  // Leaf shoots
  ctx.fillStyle = '#4A8A3A';
  ctx.strokeStyle = VC.outline;
  ctx.lineWidth = 1;
  for (const { fx, fy } of flowers) {
    ctx.beginPath();
    ctx.moveTo(fx, fy + 2);
    ctx.lineTo(fx - 3, fy + 9);
    ctx.lineTo(fx + 3, fy + 9);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draw a Soviet-era tree (round canopy, trunk shadow).
 */
export function drawTreeVec(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  // Trunk
  vecRRect(ctx, -5, 8, 10, 16, 2, '#6D4C28');
  // Shadow ellipse under canopy
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(2, 6, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
  // Canopy (outer)
  ctx.fillStyle = '#3A7D32';
  ctx.strokeStyle = VC.outline;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, -6, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Canopy (inner highlight)
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath(); ctx.arc(-4, -10, 13, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/**
 * Draw a Soviet courtyard lamp post (top-down — post shadow + lamp head).
 */
export function drawLampVec(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  // Post shadow (elongated ellipse)
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.beginPath(); ctx.ellipse(10, 12, 6, 24, 0.3, 0, Math.PI * 2); ctx.fill();
  // Post
  ctx.fillStyle = '#546E7A';
  ctx.strokeStyle = VC.outline;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-2, 30); ctx.lineTo(-2, -28); ctx.lineTo(2, -28); ctx.lineTo(2, 30);
  ctx.fill(); ctx.stroke();
  // Lamp head
  ctx.fillStyle = '#FFF9C4';
  ctx.strokeStyle = VC.outline;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, -28, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Glow ring
  ctx.strokeStyle = 'rgba(255,240,120,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, -28, 11, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

/**
 * Draw a квас kiosk — orange stand with yellow barrel.
 */
export function drawKvassVec(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  // Stand body
  vecRRect(ctx, -20, -26, 40, 34, 4, '#E65100');
  // Awning stripe
  ctx.fillStyle = '#FF6D00';
  ctx.fillRect(-20, -26, 40, 8);
  ctx.strokeStyle = VC.outline; ctx.lineWidth = 1.5;
  ctx.strokeRect(-20, -26, 40, 8);
  // Sign text
  ctx.fillStyle = '#FFF9C4';
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('КВАС', 0, -10);
  // Barrel
  ctx.fillStyle = '#FFC107';
  ctx.strokeStyle = VC.outline; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 6, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#FF8F00';
  ctx.beginPath(); ctx.arc(0, 6, 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/**
 * Draw a broken EV charger station.
 */
export function drawEvChargerVec(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  // Post
  vecRRect(ctx, -7, -34, 14, 48, 2, '#546E7A');
  // Screen (cracked, off)
  vecRRect(ctx, -13, -50, 26, 20, 3, '#1A237E', VC.outline, 2);
  // Crack lines
  ctx.strokeStyle = '#FF1744';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-5, -48); ctx.lineTo(3, -34); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2, -46); ctx.lineTo(-2, -38); ctx.stroke();
  // Broken cable
  ctx.strokeStyle = '#37474F';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(5, 0);
  ctx.bezierCurveTo(18, 8, 14, 18, 10, 22);
  ctx.stroke();
  ctx.lineCap = 'butt';
  // Lightning bolt
  ctx.fillStyle = '#FFD600';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚡', 0, -36);
  // Broken LED
  ctx.fillStyle = '#FF1744';
  ctx.beginPath(); ctx.arc(10, -46, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/**
 * Draw a fire hydrant.
 */
export function drawHydrantVec(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  // Body
  vecRRect(ctx, -8, -14, 16, 28, 4, '#D32F2F');
  // Caps
  ctx.fillStyle = '#B71C1C';
  ctx.strokeStyle = VC.outline;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-12, -8, 6, 6, 1); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(6, -8, 6, 6, 1); ctx.fill(); ctx.stroke();
  // Top nut
  ctx.beginPath(); ctx.arc(0, -14, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}

/**
 * Draw a small trash bin.
 */
export function drawTrashBinVec(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  // Post
  ctx.fillStyle = '#546E7A';
  ctx.fillRect(-2, -6, 4, 18);
  // Bin
  vecRRect(ctx, -10, -14, 20, 18, 3, '#78909C');
  // Rim
  ctx.fillStyle = '#546E7A';
  ctx.fillRect(-11, -14, 22, 4);
  ctx.restore();
}

/**
 * Draw a bicycle rack.
 */
export function drawBicycleRackVec(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#90A4AE';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (let i = -24; i <= 24; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 12);
    ctx.lineTo(i, -12);
    ctx.arc(i + 4, -12, 4, Math.PI, 0);
    ctx.lineTo(i + 8, 12);
    ctx.stroke();
  }
  ctx.restore();
}
