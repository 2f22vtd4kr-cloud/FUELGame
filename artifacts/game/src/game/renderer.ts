import type { GameState, Player, Vec2 } from './types';
import { ALARM_RADIUS, MAP_W, MAP_H, CROUCH_VISIBILITY_MULT, VENT_FLASH_DURATION } from './types';
import {
  drawBackgroundVec,
  drawCharacterVec, drawCarVec,
  drawBenchVec, drawDumpsterVec, drawFlowerbedVec,
  drawTreeVec, drawLampVec, drawKvassVec, drawEvChargerVec,
  drawHydrantVec, drawTrashBinVec, drawBicycleRackVec,
} from './vecDraw';
import { TASK_DEFS } from '../data/tasks';
import {
  DECORATIONS, ENTRANCE_POS, DUMPSTER_POSITIONS, VISION_BUILDINGS, VALVE_POSITIONS,
  BABUSHKA_CERBERUS_POS, BABUSHKA_NPC_POS, PLAYGROUND, CAR_SPAWNS,
} from '../data/map';
import {
  getSprite, SPRITE_SHEETS, CAR_SPRITE_MAP, DECOR_SPRITE_META,
} from './sprites';
import { getTexturePattern } from './textures';
import { CHARACTERS } from '../data/characters';
import {
  computeVisionPolygon,
  buildVisionObstacles,
  pointInPolygon,
  VISION_RADIUS,
  VISION_FOV_KHOZAIN,
  VISION_FOV_SLIVSHCHIK,
} from './vision';

// ─── Color palette ────────────────────────────────────────────────────────────

const COLORS = {
  sky:          '#87CEEB',
  grass:        '#6DB56D',
  asphalt:      '#4A4A4A',
  parking:      '#555555',
  building:     '#D0B49F',
  buildingEdge: '#B09070',
  archGray:     '#999',
  road:         '#666',
  canister:     '#F5A623',
  body:         '#B0BEC5',
  bodyOutline:  '#78909C',
};

// ─── §2.2 Camera smoothing state (lerp at 0.15 per frame ≈ 15% per frame @60fps)
let _camSmoothX = -1; // -1 signals "uninitialised — snap on first frame"
let _camSmoothY = -1;
const CAM_LERP = 0.15;
const CAMERA_ZOOM = 1.6;

// ─── Vision obstacle cache ─────────────────────────────────────────────────
// buildVisionObstacles is O(n) and called 60× per second. Cars and dumpsters
// are static within a match, so we build once and invalidate only when car
// count changes (i.e. a new match started).
let _visionObstacles: ReturnType<typeof buildVisionObstacles> | null = null;
let _visionObstacleCarCount = -1;
let _visionObstaclePhase = '';

// ─── Directional sprite-sheet animation state ──────────────────────────────
// Purely a rendering concern: derived each frame from how far a player's
// pos actually moved, so it needs no changes to Player/network types and
// works identically for the local player, bots, and remote players.
interface SpriteAnimState {
  row: 'left' | 'right' | 'down' | 'up';
  frame: number;
  frameTimer: number;
  lastX: number;
  lastY: number;
}
const _spriteAnim = new Map<string, SpriteAnimState>();
let _lastAnimTs = -1;

/** Buckets a facingAngle (0=right, PI/2=down) into one of 4 cardinal rows. */
function angleToRow(angle: number): 'left' | 'right' | 'down' | 'up' {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  const deg = (a * 180) / Math.PI;
  if (deg >= -45 && deg < 45) return 'right';
  if (deg >= 45 && deg < 135) return 'down';
  if (deg >= -135 && deg < -45) return 'up';
  return 'left';
}

/**
 * Advances (or freezes) the walk-cycle animation for a player with a
 * directional sprite sheet. Frame-rate scales with actual on-screen
 * movement speed (px/sec) — this tracks sprint/crouch/canister/flowerbed
 * modifiers automatically and always matches how fast the character visibly
 * moves, which reads better than driving it off raw joystick deflection
 * (movement speed itself isn't proportional to joystick tilt in this game).
 * Stopping (joystick released / no movement) freezes instantly on frame 0
 * of the last active direction row.
 */
function updateSpriteAnimation(player: Player, animDt: number): { row: number; frame: number } {
  const meta = SPRITE_SHEETS[`char_${player.character}`]!;
  let st = _spriteAnim.get(player.id);
  if (!st) {
    st = { row: 'down', frame: 0, frameTimer: 0, lastX: player.pos.x, lastY: player.pos.y };
    _spriteAnim.set(player.id, st);
  }

  const dx = player.pos.x - st.lastX;
  const dy = player.pos.y - st.lastY;
  const distMoved = Math.hypot(dx, dy);
  st.lastX = player.pos.x;
  st.lastY = player.pos.y;

  const MOVE_EPSILON = 0.15; // px/frame — filters out floating-point jitter while idle
  const moving = distMoved > MOVE_EPSILON && animDt > 0;

  if (moving) {
    st.row = angleToRow(player.facingAngle);
    const speedPxPerSec = distMoved / animDt;
    // Faster movement -> shorter frame interval (walk vs. sprint cadence).
    const frameInterval = Math.max(0.06, Math.min(0.22, 0.24 - speedPxPerSec * 0.0006));
    st.frameTimer += animDt;
    if (st.frameTimer >= frameInterval) {
      st.frameTimer = 0;
      st.frame = (st.frame + 1) % meta.cols;
    }
  } else {
    st.frame = 0;
    st.frameTimer = 0;
  }

  return { row: meta.rowFor[st.row], frame: st.frame };
}

// ─── Main render ──────────────────────────────────────────────────────────────

export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cw: number,
  ch: number,
): void {
  const localPlayer = state.players.find(p => p.id === state.localPlayerId);
  if (!localPlayer) return;

  // ── Sprite-sheet animation timing (independent of the render dt param,
  // since this function doesn't receive one) ──────────────────────────────
  const _animNow = performance.now();
  const animDt = _lastAnimTs === -1 ? 0 : Math.min((_animNow - _lastAnimTs) / 1000, 0.05);
  _lastAnimTs = _animNow;

  // ── §2.2 Camera: smoothly follow local player with lerp at 0.15 ─────────────
  const targetCamX = localPlayer.pos.x - cw / (2 * CAMERA_ZOOM);
  const targetCamY = localPlayer.pos.y - ch / (2 * CAMERA_ZOOM);

  // Snap on first render or when switching phases (lobby → play)
  if (_camSmoothX === -1 || state.phase === 'briefing') {
    _camSmoothX = targetCamX;
    _camSmoothY = targetCamY;
  } else {
    _camSmoothX += (targetCamX - _camSmoothX) * CAM_LERP;
    _camSmoothY += (targetCamY - _camSmoothY) * CAM_LERP;
  }

  const rawCamX = Math.round(_camSmoothX);
  const rawCamY = Math.round(_camSmoothY);
  const camX = Math.max(0, Math.min(rawCamX, MAP_W - cw / CAMERA_ZOOM));
  const camY = Math.max(0, Math.min(rawCamY, MAP_H - ch / CAMERA_ZOOM));

  ctx.save();
  ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM);
  ctx.translate(-camX, -camY);

  // ── §2.3 Vision polygon (computed once per frame) ────────────────────────────
  // Dead local player gets ghost vision (no fog) so they can watch the game.
  let visionPoly: Vec2[] | null = null;
  let crouchCheckPoly: Vec2[] | null = null; // §2.2 — narrowed cone for crouching targets
  if (localPlayer.isAlive) {
    const fovDeg = localPlayer.role === 'slivshchik'
      ? VISION_FOV_SLIVSHCHIK
      : VISION_FOV_KHOZAIN;
    // Use cached obstacles — positions are static within a match.
    // Invalidate when car count or game phase changes (new match = new layout).
    if (!_visionObstacles || _visionObstacleCarCount !== state.cars.length || _visionObstaclePhase !== state.phase) {
      _visionObstacles = buildVisionObstacles(VISION_BUILDINGS, state.cars, DUMPSTER_POSITIONS);
      _visionObstacleCarCount = state.cars.length;
      _visionObstaclePhase = state.phase;
    }
    const obstacles = _visionObstacles;
    visionPoly = computeVisionPolygon(
      localPlayer.pos,
      localPlayer.facingAngle,
      fovDeg,
      VISION_RADIUS,
      obstacles,
    );
    // §2.2 Crouch stealth: if any non-local player is crouching, also compute a
    // narrower cone (30% smaller FOV) to check their reduced visibility.
    const hasCrouchingEnemy = state.players.some(
      p => p.isAlive && p.id !== state.localPlayerId && p.isCrouching,
    );
    if (hasCrouchingEnemy) {
      crouchCheckPoly = computeVisionPolygon(
        localPlayer.pos,
        localPlayer.facingAngle,
        fovDeg * CROUCH_VISIBILITY_MULT,
        VISION_RADIUS,
        obstacles,
      );
    }
  }

  // ── World layers (drawn before fog overlay) ──────────────────────────────────
  drawBackground(ctx);
  drawParkingLot(ctx);
  drawLampGlows(ctx);      // warm floor pools under lamp posts
  drawDecorations(ctx);
  drawSabotageFlood(ctx, state);   // §2.9 flood effect under entities
  drawTaskGlows(ctx, state);
  drawTasks(ctx, state);
  drawCars(ctx, state);
  drawImmunityTickets(ctx, state);
  drawBodies(ctx, state);
  drawCanisters(ctx, state);
  drawValveMarkers(ctx, state);    // §2.9 valve fix markers
  drawPlayers(ctx, state, visionPoly, crouchCheckPoly, animDt);
  drawBabushkaNPC(ctx, state);     // §2.9 babushka cerberus NPC
  drawPersistentGrandma(ctx, state); // §2.4 always-present bench grandma
  drawAlarmButton(ctx, state);
  drawEntrance(ctx);
  drawUI(ctx, state, localPlayer);

  // ── §2.3 Fog-of-war overlay (on top of world, under camera restore) ──────────
  // Uses the evenodd fill rule: outer rect filled dark, vision polygon cuts a
  // transparent hole. Entities drawn outside the hole are hidden by the fog.
  if (visionPoly) drawFogOfWar(ctx, visionPoly);

  // ── Post-fog pass: slivshchik teammate outlines pierce fog (§3.1.2) ──────────
  // Must be drawn AFTER the fog so it is always visible to local slivshchik
  // regardless of walls or darkness. Same design intent as Among Us impostor glow.
  drawTeammateOutlines(ctx, state);
  drawJanitorCanisterHighlight(ctx, state); // §3.1.3 janitor sees canisters through fog

  ctx.restore();
}

// ─── §2.3 Fog-of-war overlay ─────────────────────────────────────────────────

function drawFogOfWar(ctx: CanvasRenderingContext2D, poly: Vec2[]): void {
  if (poly.length < 3) return;

  ctx.save();

  // Pass 1: Hard fog fill with evenodd hole (actual vision mask — preserves wall occlusion)
  ctx.fillStyle = 'rgba(0, 0, 10, 0.92)';
  ctx.beginPath();
  ctx.rect(-120, -120, MAP_W + 240, MAP_H + 240);
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
  ctx.closePath();
  ctx.fill('evenodd');

  // Pass 2: Soft vignette ring inside the vision polygon (Among Us aesthetic)
  // Clip to vision polygon, draw radial gradient: transparent center → semi-opaque edge
  const cx = poly.reduce((s, p) => s + p.x, 0) / poly.length;
  const cy = poly.reduce((s, p) => s + p.y, 0) / poly.length;
  const avgR = poly.reduce((s, p) => s + Math.hypot(p.x - cx, p.y - cy), 0) / poly.length;

  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
  ctx.closePath();
  ctx.clip();

  const grad = ctx.createRadialGradient(cx, cy, avgR * 0.5, cx, cy, avgR * 1.05);
  grad.addColorStop(0,   'rgba(0,0,10,0)');
  grad.addColorStop(0.65,'rgba(0,0,10,0)');
  grad.addColorStop(1,   'rgba(0,0,10,0.70)');

  ctx.fillStyle = grad;
  ctx.fillRect(-120, -120, MAP_W + 240, MAP_H + 240);

  ctx.restore();
}

// ─── Post-fog: teammate outlines (pierce the fog for local slivshchik) ────────
// This pass runs AFTER drawFogOfWar so outlines are always on top of the fog.

function drawTeammateOutlines(ctx: CanvasRenderingContext2D, state: GameState): void {
  const localPlayer = state.players.find(p => p.id === state.localPlayerId);
  if (!localPlayer || localPlayer.role !== 'slivshchik') return;

  for (const player of state.players) {
    if (!player.isAlive) continue;
    if (player.id === state.localPlayerId) continue;
    if (player.role !== 'slivshchik') continue;

    const { x, y } = player.pos;
    ctx.strokeStyle = '#FF1744';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Small "S" label so it's unambiguous even at distance
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#FF1744';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.9;
    ctx.fillText('СЛ', x, y - 30);
    ctx.globalAlpha = 1;
  }
}

// ─── §2.4 Persistent Бабушка NPC at bench ────────────────────────────────────

function drawPersistentGrandma(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (state.phase !== 'play') return;
  const { x, y } = BABUSHKA_NPC_POS;

  // Bench slats
  ctx.fillStyle = '#6D4C41';
  ctx.fillRect(x - 24, y + 8, 48, 7);
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(x - 22, y + 4, 6, 11);
  ctx.fillRect(x + 16, y + 4, 6, 11);

  // NPC circle
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fillStyle = '#7B1FA2';
  ctx.fill();
  ctx.strokeStyle = '#CE93D8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Emoji
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('👵', x, y + 1);
  ctx.textBaseline = 'alphabetic';

  // Hover label
  ctx.font = '8px sans-serif';
  ctx.fillStyle = '#E1BEE7';
  ctx.textAlign = 'center';
  ctx.fillText('Спросить', x, y - 17);
}

// ─── §3.1.3 Post-fog janitor canister X-ray ──────────────────────────────────

function drawJanitorCanisterHighlight(ctx: CanvasRenderingContext2D, state: GameState): void {
  const local = state.players.find(p => p.id === state.localPlayerId);
  if (!local || local.neutralRole !== 'janitor') return;
  if (state.canisters.length === 0) return;

  const t = Date.now();
  for (const can of state.canisters) {
    const { x, y } = can.pos;

    ctx.save();
    ctx.globalAlpha = 0.75 + 0.25 * Math.sin(t / 280);

    // Outer glow
    const grad = ctx.createRadialGradient(x, y, 0, x, y, 24);
    grad.addColorStop(0, 'rgba(255,152,0,0.65)');
    grad.addColorStop(1, 'rgba(255,152,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();

    // Core circle
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#FF6D00';
    ctx.fill();
    ctx.strokeStyle = '#FFD740';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Icon
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🪣', x, y + 1);
    ctx.textBaseline = 'alphabetic';

    ctx.restore();
  }
}

// ─── §2.9 Sabotage visual effects ────────────────────────────────────────────

/** Pipe burst: animated blue flood overlay on the parking/garden area */
function drawSabotageFlood(ctx: CanvasRenderingContext2D, state: GameState): void {
  const flood = state.activeSabotages.find(s => s.key === 'pipe_burst' && !s.isResolved);
  if (!flood) return;

  const urgency = flood.timer / 60; // 1 = fresh, 0 = critical
  const alpha = 0.18 + (1 - urgency) * 0.22; // gets more opaque as timer runs out
  const wave = Math.sin(Date.now() / 400) * 0.05;

  ctx.save();
  ctx.globalAlpha = alpha + wave;
  ctx.fillStyle = '#1565C0';
  ctx.fillRect(90, 90, 1020, 380 + 340); // cover parking + garden
  ctx.globalAlpha = 1;
  ctx.restore();

  // Ripple lines
  ctx.save();
  ctx.strokeStyle = 'rgba(100,181,246,0.35)';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5;
  const t = Date.now() / 800;
  for (let row = 0; row < 4; row++) {
    ctx.beginPath();
    for (let x = 90; x < 1110; x += 10) {
      const y = 200 + row * 150 + Math.sin((x / 60) + t + row) * 8;
      if (x === 90) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Warning text in center
  ctx.save();
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = urgency < 0.3 ? '#F44336' : '#FF9800';
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.85;
  ctx.fillText(`💧 ПОТОП — ${Math.ceil(flood.timer)}с`, MAP_W / 2, 470);
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** Pipe burst: valve markers with fix progress rings */
function drawValveMarkers(ctx: CanvasRenderingContext2D, state: GameState): void {
  const flood = state.activeSabotages.find(s => s.key === 'pipe_burst' && !s.isResolved);
  if (!flood) return;

  const valveProgress = [flood.valve1Progress, flood.valve2Progress];

  VALVE_POSITIONS.forEach((pos, i) => {
    const prog = valveProgress[i] / 3; // 3 = VALVE_FIX_TIME
    const isDone = prog >= 1;

    ctx.save();

    // Glow
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = isDone ? '#4CAF50' : '#2196F3';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Progress arc
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = isDone ? '#4CAF50' : '#2196F3';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 18, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
    ctx.stroke();

    // Icon
    ctx.globalAlpha = 1;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(isDone ? '✓' : '🔧', pos.x, pos.y + 5);

    // Label
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#90CAF9';
    ctx.fillText(`Вентиль ${i + 1}`, pos.x, pos.y + 26);

    ctx.restore();
  });
}

/** Babushka Cerberus: draws a little grandma NPC near the entrance */
function drawBabushkaNPC(ctx: CanvasRenderingContext2D, state: GameState): void {
  const active = state.activeSabotages.find(s => s.key === 'babushka_cerberus' && !s.isResolved);
  if (!active) return;

  const { x, y } = BABUSHKA_CERBERUS_POS;
  const bob = Math.sin(Date.now() / 500) * 2;

  ctx.save();

  // Shadow
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x, y + 16, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body (shawl)
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#6A1B9A';
  ctx.beginPath();
  ctx.ellipse(x, y + 4 + bob, 12, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#FFCC80';
  ctx.beginPath();
  ctx.arc(x, y - 14 + bob, 10, 0, Math.PI * 2);
  ctx.fill();

  // Headscarf
  ctx.fillStyle = '#7B1FA2';
  ctx.beginPath();
  ctx.arc(x, y - 14 + bob, 10, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(x - 10, y - 16 + bob, 20, 4);

  // Cane
  ctx.strokeStyle = '#8D6E63';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 10, y - 2 + bob);
  ctx.lineTo(x + 14, y + 14 + bob);
  ctx.stroke();

  // Label
  ctx.font = 'bold 9px sans-serif';
  ctx.fillStyle = '#CE93D8';
  ctx.textAlign = 'center';
  ctx.fillText('👵 Цербер', x, y - 30 + bob);

  // Timer bubble
  ctx.fillStyle = 'rgba(106,27,154,0.8)';
  ctx.beginPath();
  ctx.roundRect(x - 16, y - 45 + bob, 32, 14, 4);
  ctx.fill();
  ctx.font = '8px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText(`${Math.ceil(active.timer)}с`, x, y - 35 + bob);

  ctx.restore();
}

// ─── Background ───────────────────────────────────────────────────────────────

/** Fills a rect with a texture pattern, falling back to a flat color if the texture isn't loaded yet. */
function fillTexturedRect(
  ctx: CanvasRenderingContext2D,
  key: Parameters<typeof getTexturePattern>[1],
  fallbackColor: string,
  x: number, y: number, w: number, h: number,
): void {
  const pattern = getTexturePattern(ctx, key);
  ctx.fillStyle = pattern ?? fallbackColor;
  ctx.fillRect(x, y, w, h);
}

// Deterministic "random" for consistent per-window lighting — no Math.random()
function seededHash(x: number, y: number): number {
  const n = (x * 374761393 + y * 668265263) | 0;
  return Math.abs(((n ^ (n >> 13)) * 1274126177) | 0) / 2147483647;
}

function drawBackground(ctx: CanvasRenderingContext2D): void {
  // ── Primary: clean Among Us-style vector background (vecDraw) ───────────────
  drawBackgroundVec(ctx, MAP_W, MAP_H, PLAYGROUND);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _drawBackgroundLegacy(ctx: CanvasRenderingContext2D): void {
  // Kept for reference — replaced by drawBackgroundVec above.
  // ── Fallback: procedural background ─────────────────────────────────────────
  // ── Building strips ──────────────────────────────────────────────────────────
  fillTexturedRect(ctx, 'roof', COLORS.building, 0, 0, 1200, 90);
  fillTexturedRect(ctx, 'roof', COLORS.building, 0, 810, 1200, 90);
  fillTexturedRect(ctx, 'roof', COLORS.building, 0, 90, 90, 720);
  fillTexturedRect(ctx, 'roof', COLORS.building, 1110, 90, 90, 720);

  // ── Apartment windows ────────────────────────────────────────────────────────
  const WIN_COLORS_LIT  = ['#FFD54F', '#FFF9C4', '#B3E5FC', '#FFECB3', '#E8F5E9'];
  const WIN_COLORS_DARK = ['#1A237E', '#263238', '#212121', '#1B5E20', '#37474F'];
  const CURTAIN         = 'rgba(200,180,150,0.6)';

  function drawWindow(wx: number, wy: number, ww: number, wh: number, seed: number) {
    const lit   = seed > 0.35; // 65 % of windows lit
    const hasCurtain = lit && seed > 0.75;
    // Frame
    ctx.fillStyle = '#5D7080';
    ctx.fillRect(wx, wy, ww, wh);
    // Pane
    ctx.fillStyle = lit ? WIN_COLORS_LIT[Math.floor(seed * WIN_COLORS_LIT.length)] : WIN_COLORS_DARK[Math.floor(seed * WIN_COLORS_DARK.length)];
    ctx.fillRect(wx + 2, wy + 2, ww - 4, wh - 4);
    // Divider
    ctx.fillStyle = '#5D7080';
    ctx.fillRect(wx + Math.floor(ww / 2) - 1, wy + 2, 2, wh - 4);
    // Horizontal divider
    ctx.fillRect(wx + 2, wy + Math.floor(wh * 0.45), ww - 4, 1);
    // Curtain overlay
    if (hasCurtain) {
      ctx.fillStyle = CURTAIN;
      ctx.fillRect(wx + 2, wy + 2, Math.floor((ww - 4) * 0.45), wh - 4);
    }
  }

  // Top building strip — 2 rows of windows
  for (const wy of [8, 50]) {
    for (let wx = 105; wx < 1100; wx += 60) {
      const skip = (wx > 420 && wx < 760 && wy === 50); // entrance gap at bottom row
      if (!skip) drawWindow(wx, wy, 30, 28, seededHash(wx, wy));
    }
  }

  // Bottom building strip — 2 rows of windows (above entrance)
  for (const wy of [816, 858]) {
    for (let wx = 105; wx < 420; wx += 60)  drawWindow(wx, wy, 30, 22, seededHash(wx, wy));
    for (let wx = 760; wx < 1100; wx += 60) drawWindow(wx, wy, 30, 22, seededHash(wx, wy));
  }

  // Left strip — windows on the inward-facing facade
  for (let wy = 120; wy < 790; wy += 80) {
    for (const wx of [8, 52]) drawWindow(wx, wy, 26, 34, seededHash(wx, wy));
    // Balcony railing between window rows
    ctx.strokeStyle = '#546E7A';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, wy + 38, 82, 10);
  }

  // Right strip — same
  for (let wy = 120; wy < 790; wy += 80) {
    for (const wx of [1114, 1158]) drawWindow(wx, wy, 26, 34, seededHash(wx, wy));
    ctx.strokeStyle = '#546E7A';
    ctx.lineWidth = 1;
    ctx.strokeRect(1114, wy + 38, 82, 10);
  }

  // Building edge shadow lines
  ctx.strokeStyle = COLORS.buildingEdge;
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 1200, 90);
  ctx.strokeRect(0, 810, 1200, 90);
  ctx.strokeRect(0, 90, 90, 720);
  ctx.strokeRect(1110, 90, 90, 720);

  // ── Security cameras (top corners & above entrance) ──────────────────────────
  function drawCamera(cx: number, cy: number, flip: boolean) {
    ctx.save();
    ctx.translate(cx, cy);
    if (flip) ctx.scale(-1, 1);
    ctx.fillStyle = '#37474F';
    ctx.fillRect(-4, -4, 8, 10);   // mount bracket
    ctx.fillRect(0, 0, 18, 8);     // camera body
    ctx.fillStyle = '#263238';
    ctx.beginPath();
    ctx.arc(16, 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#B71C1C';
    ctx.beginPath();
    ctx.arc(20, 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  drawCamera(130, 92, false);
  drawCamera(1070, 92, true);
  drawCamera(130, 808, false);
  drawCamera(1070, 808, true);

  // ── Entrance arch gap ────────────────────────────────────────────────────────
  ctx.fillStyle = '#2A2A3A';
  ctx.fillRect(450, 810, 300, 90);
  // Road markings in the archway
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 8]);
  ctx.beginPath(); ctx.moveTo(600, 810); ctx.lineTo(600, 900); ctx.stroke();
  ctx.setLineDash([]);

  // ── Parking / asphalt ────────────────────────────────────────────────────────
  fillTexturedRect(ctx, 'asphalt', COLORS.parking, 90, 90, 1020, 380);

  // Parking spots with bold markings
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.5;
  for (let x = 140; x < 1100; x += 130) {
    ctx.strokeRect(x, 100, 110, 180);
    ctx.strokeRect(x, 290, 110, 170);
  }

  // Subtle tile grid on asphalt (big squares)
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let gx = 90; gx <= 1110; gx += 50) {
    ctx.beginPath(); ctx.moveTo(gx, 90); ctx.lineTo(gx, 470); ctx.stroke();
  }
  for (let gy = 90; gy <= 470; gy += 50) {
    ctx.beginPath(); ctx.moveTo(90, gy); ctx.lineTo(1110, gy); ctx.stroke();
  }

  // ── Garden / grass ────────────────────────────────────────────────────────────
  fillTexturedRect(ctx, 'grass', '#5AAD5A', 90, 470, 1020, 340);

  // Subtle grass tile grid
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;
  for (let gx = 90; gx <= 1110; gx += 60) {
    ctx.beginPath(); ctx.moveTo(gx, 470); ctx.lineTo(gx, 810); ctx.stroke();
  }
  for (let gy = 470; gy <= 810; gy += 60) {
    ctx.beginPath(); ctx.moveTo(90, gy); ctx.lineTo(1110, gy); ctx.stroke();
  }

  // ── Garden path ──────────────────────────────────────────────────────────────
  fillTexturedRect(ctx, 'path', '#7A6A5A', 560, 470, 80, 340);
  // Path edge shadows
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(560, 470, 4, 340);
  ctx.fillRect(636, 470, 4, 340);
}

function drawParkingLot(_ctx: CanvasRenderingContext2D): void {
  // drawBackgroundVec (called from drawBackground) already renders parking, garden,
  // playground and paths — nothing left to add here.
}

// ─── Decorations ─────────────────────────────────────────────────────────────

function drawLampGlows(ctx: CanvasRenderingContext2D): void {
  // Draw before decorations so lamp posts render on top of their glow
  for (const dec of DECORATIONS) {
    if (dec.type !== 'lamppost') continue;
    const { x, y } = dec.pos;
    const grad = ctx.createRadialGradient(x, y + 10, 0, x, y + 10, 80);
    grad.addColorStop(0,    'rgba(255,240,140,0.18)');
    grad.addColorStop(0.45, 'rgba(255,220,100,0.08)');
    grad.addColorStop(1,    'rgba(255,200,80,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 80, 55, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDecorations(ctx: CanvasRenderingContext2D): void {
  for (const deco of DECORATIONS) {
    const { x, y } = deco.pos;

    // Drop Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    switch (deco.type) {
      case 'bench':
        drawBenchVec(ctx, x, y);
        break;
      case 'dumpster':
        drawDumpsterVec(ctx, x, y);
        break;
      case 'flowerbed':
        drawFlowerbedVec(ctx, x, y);
        break;
      case 'tree':
        drawTreeVec(ctx, x, y);
        break;
      case 'lamppost':
        drawLampVec(ctx, x, y);
        break;
      case 'kvass_stand':
        drawKvassVec(ctx, x, y);
        break;
      case 'ev_charger':
        drawEvChargerVec(ctx, x, y);
        break;
      case 'hydrant':
        drawHydrantVec(ctx, x, y);
        break;
      case 'trash_bin':
        drawTrashBinVec(ctx, x, y);
        break;
      case 'bicycle_rack':
        drawBicycleRackVec(ctx, x, y);
        break;
    }
  }
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

function drawTaskGlows(ctx: CanvasRenderingContext2D, state: GameState): void {
  const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 600);

  for (const task of state.tasks) {
    if (task.isComplete) continue;  // no glow for completed tasks

    const { x, y } = task.pos;

    ctx.save();
    ctx.globalAlpha = pulse * 0.55;

    // Gentle radial glow — golden/amber for tasks
    const grad = ctx.createRadialGradient(x, y, 0, x, y, 42);
    grad.addColorStop(0,   'rgba(255,200,60,0.45)');
    grad.addColorStop(0.5, 'rgba(255,180,40,0.15)');
    grad.addColorStop(1,   'rgba(255,160,20,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 42, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawTasks(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const task of state.tasks) {
    if (task.isComplete) continue;
    const { x, y } = task.pos;
    const def = TASK_DEFS[task.defKey];

    // Glowing circle with subtle fill
    const alpha = 0.3 + 0.3 * Math.sin(Date.now() / 500);
    ctx.globalAlpha = alpha * 0.18;
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Emoji
    ctx.font = '22px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.emoji, x, y);

    // Progress ring
    if (task.progress > 0 && task.doer !== null) {
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, 18, -Math.PI / 2, -Math.PI / 2 + task.progress * Math.PI * 2);
      ctx.stroke();
    }

    // Label — Among Us style pill background with white text
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const labelMetrics = ctx.measureText(def.label);
    const labelW = labelMetrics.width;
    const pillPadX = 8;
    const pillPadY = 4;
    const pillH = 16;
    const pillW = labelW + pillPadX * 2;
    const pillX = x - pillW / 2;
    const pillY = y + 32 - pillH + pillPadY;
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(def.label, x, y + 32);
    ctx.textBaseline = 'alphabetic';
  }
}

// ─── Cars ─────────────────────────────────────────────────────────────────────

function drawCars(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const car of state.cars) {
    const { x, y } = car.pos;
    const fuel = car.fuel;

    // Ground shadow — drawn before sprite so sprite renders on top
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x, y + 32, 34, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // §7.3 Car sprite (generated PNG) or vector-car fallback
    const carSpriteKey = CAR_SPRITE_MAP[car.id];
    const carSprite = carSpriteKey ? getSprite(carSpriteKey) : null;
    if (carSprite) {
      // AI-generated isometric car sprites are square — draw at 90×90
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(carSprite, x - 45, y - 45, 90, 90);
    } else {
      // Vector car renderer (Among Us style)
      drawCarVec(ctx, x, y, car.color);
    }

    // Fuel indicator above car — clean Among Us style pill bar
    const barW = 44; const barH = 7;
    const bx = x - barW / 2; const by = y - 56;
    
    // Background pill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(bx - 2, by - 2, barW + 4, barH + 4, 4);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const fuelColor = fuel > 50 ? '#4CAF50' : fuel > 20 ? '#FFEB3B' : '#F44336';
    ctx.fillStyle = fuelColor;
    ctx.beginPath();
    ctx.roundRect(bx, by, Math.max(2, (fuel / 100) * barW), barH, 2);
    ctx.fill();

    // Car Label (License Plate Badge) below car
    ctx.save();
    ctx.font = 'bold 9px monospace';
    const spawnDef = CAR_SPAWNS.find(s => s.id === car.id);
    const labelText = spawnDef?.label || 'БАКСТАБ';
    const labelW = ctx.measureText(labelText).width + 8;
    const lx = x - labelW / 2;
    const ly = y + 42;
    
    // Badge background
    ctx.fillStyle = '#EEE';
    ctx.beginPath();
    ctx.roundRect(lx, ly, labelW, 14, 3);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Badge text
    ctx.fillStyle = '#111';
    ctx.textAlign = 'center';
    ctx.fillText(labelText, x, ly + 10);
    ctx.restore();

    // Siphon visual — dashed animated pulsing line
    if (car.siphonPhase === 1) {
      // Setup phase — subtle shimmer ring
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(Date.now() / 200);
      ctx.strokeStyle = '#A5D6A7';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -Date.now() / 50;
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    } else if (car.siphonPhase === 2) {
      // Active drain — animated green stream pulse
      const siphoner = state.players.find(p => p.id === car.siphoner);
      if (siphoner) {
        ctx.save();
        ctx.strokeStyle = '#00E676';
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.8 + 0.2 * Math.sin(Date.now() / 80);
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -Date.now() / 20;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(siphoner.pos.x, siphoner.pos.y);
        ctx.stroke();
        ctx.restore();
      }
      // Red alert ring
      ctx.strokeStyle = '#FF1744';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 150);
      ctx.beginPath();
      ctx.arc(x, y, 34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Low fuel warning icon
    if (fuel < 15 && fuel > 0) {
      ctx.font = '14px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const pulse = Math.sin(Date.now() / 300) > 0;
      if (pulse) ctx.fillText('⚠️', x, y + 28);
      ctx.textBaseline = 'alphabetic';
    }

    // §10.2 Immunity shield — golden rotating ring
    if (car.hasImmunity) {
      const t = Date.now() / 700;
      ctx.save();
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.8 + 0.2 * Math.sin(Date.now() / 250);
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = t * 20;
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      // Shield icon + timer
      ctx.font = '11px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🛡️', x, y - 46);
      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(`${Math.ceil(car.immunityTimer)}с`, x, y - 52);
      ctx.restore();
    }
  }
}

// ─── Immunity Tickets (§10.2) ────────────────────────────────────────────────

function drawImmunityTickets(ctx: CanvasRenderingContext2D, state: GameState): void {
  const t = Date.now();
  const pulse = 0.6 + 0.4 * Math.sin(t / 400);
  const shimmer = 0.5 + 0.5 * Math.sin(t / 250);

  for (const ticket of state.immunityTickets) {
    const { x, y } = ticket.pos;

    ctx.save();

    // Drop shadow
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 3, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Outer pulsing golden aura
    const auraGrad = ctx.createRadialGradient(x, y, 4, x, y, 28);
    auraGrad.addColorStop(0, `rgba(255,215,0,${0.35 * pulse})`);
    auraGrad.addColorStop(0.5, `rgba(255,180,0,${0.18 * pulse})`);
    auraGrad.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();

    // Pill / card body — golden ticket shape
    const pw = 34;
    const ph = 20;
    ctx.fillStyle = '#D4A017';
    ctx.beginPath();
    ctx.roundRect(x - pw / 2, y - ph / 2, pw, ph, 6);
    ctx.fill();

    // Lighter golden gradient overlay for sheen
    const sheenGrad = ctx.createLinearGradient(x - pw / 2, y - ph / 2, x + pw / 2, y + ph / 2);
    sheenGrad.addColorStop(0, `rgba(255,255,200,${0.45 + 0.3 * shimmer})`);
    sheenGrad.addColorStop(0.5, 'rgba(255,220,80,0.1)');
    sheenGrad.addColorStop(1, 'rgba(200,140,0,0.15)');
    ctx.fillStyle = sheenGrad;
    ctx.beginPath();
    ctx.roundRect(x - pw / 2, y - ph / 2, pw, ph, 6);
    ctx.fill();

    // Thick golden outline
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - pw / 2, y - ph / 2, pw, ph, 6);
    ctx.stroke();

    // Notched edges (classic ticket look)
    ctx.fillStyle = '#2a7a2a'; // background colour for notch cutouts
    ctx.beginPath();
    ctx.arc(x - pw / 2, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + pw / 2, y, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Star icon
    ctx.font = '11px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐', x, y + 0.5);
    ctx.textBaseline = 'alphabetic';

    // Sparkle dots at corners (shimmer effect)
    const sparkAlpha = 0.5 + 0.5 * shimmer;
    ctx.fillStyle = `rgba(255,255,180,${sparkAlpha})`;
    for (const [sx, sy] of [
      [x - pw / 2 + 4, y - ph / 2 + 3],
      [x + pw / 2 - 4, y - ph / 2 + 3],
      [x, y - ph / 2 - 5],
    ] as [number, number][]) {
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Label below
    ctx.font = 'bold 7px sans-serif';
    ctx.fillStyle = '#FFF9C4';
    ctx.textAlign = 'center';
    ctx.fillText('ТАЛОН', x, y + ph / 2 + 9);

    ctx.restore();
  }
}

// ─── Bodies ───────────────────────────────────────────────────────────────────

function drawBodies(ctx: CanvasRenderingContext2D, state: GameState): void {
  const sortedBodies = [...state.bodies].sort((a, b) => a.pos.y - b.pos.y);
  for (const body of sortedBodies) {
    const { x, y } = body.pos;

    // Pulsing red report indicator (drawn first so body renders on top)
    const bodyPulse = 0.5 + 0.5 * Math.sin(Date.now() / 500);
    ctx.save();
    ctx.globalAlpha = bodyPulse * 0.4;
    ctx.strokeStyle = '#FF1744';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Drop shadow beneath body
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + 18, 22, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Body silhouette (lying down) — ~15% larger than before (was r=12/rect 20×35)
    const charDef = CHARACTERS[body.character];
    ctx.save();
    ctx.fillStyle = charDef.color;
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 2);
    // Body torso (was -10,-20,20,35 → scaled ~15%: -11.5,-23,23,40)
    ctx.beginPath();
    ctx.roundRect(-11.5, -23, 23, 40, 5);
    ctx.fill();
    // Head (was r=12 → r=13.8)
    ctx.beginPath();
    ctx.arc(0, -28, 13.8, 0, Math.PI * 2);
    ctx.fill();
    // Teal visor detail (visible even on dead bodies — Among Us bean style)
    ctx.fillStyle = 'rgba(0, 220, 220, 0.55)';
    ctx.beginPath();
    ctx.ellipse(3, -30, 7, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Dark outline for the head
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(0, -28, 13.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // X eyes
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✕', x, y - 25);
    ctx.textBaseline = 'alphabetic';

    // Name tag
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#FF5722';
    ctx.textAlign = 'center';
    ctx.fillText(`💀 ${body.name}`, x, y + 42);
  }
}

// ─── Canisters ────────────────────────────────────────────────────────────────

function drawCanisters(ctx: CanvasRenderingContext2D, state: GameState): void {
  const sortedCans = [...state.canisters].sort((a, b) => a.pos.y - b.pos.y);
  const t = Date.now();
  const glowAlpha = 0.3 + 0.2 * Math.sin(t / 700);

  for (const can of sortedCans) {
    const { x, y } = can.pos;
    const mainColor = can.isFull ? '#F5A623' : '#BDBDBD';
    const glowColor = can.isFull ? '#F5A623' : '#90A4AE';

    ctx.save();

    // Drop shadow
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 14, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Pulsing gold aura (ground glow)
    const auraGrad = ctx.createRadialGradient(x, y, 4, x, y, 24);
    auraGrad.addColorStop(0, `rgba(245,166,35,${glowAlpha})`);
    auraGrad.addColorStop(0.6, `rgba(245,166,35,${glowAlpha * 0.4})`);
    auraGrad.addColorStop(1, 'rgba(245,166,35,0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();

    // Canister body with thick black outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.roundRect(x - 10, y - 14, 20, 24, 3);
    ctx.fill();
    ctx.stroke();

    // Sheen highlight on body
    const sheenGrad = ctx.createLinearGradient(x - 10, y - 14, x + 10, y - 14);
    sheenGrad.addColorStop(0, 'rgba(255,255,255,0.35)');
    sheenGrad.addColorStop(0.5, 'rgba(255,255,255,0.08)');
    sheenGrad.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.fillStyle = sheenGrad;
    ctx.beginPath();
    ctx.roundRect(x - 10, y - 14, 20, 24, 3);
    ctx.fill();

    // Nozzle / cap — thick black outline
    ctx.fillStyle = '#78909C';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 4, y - 20, 8, 8, 2);
    ctx.fill();
    ctx.stroke();

    // Spill droplet
    ctx.fillStyle = '#1E88E5';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + 8, y + 8, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pulsing glow ring
    ctx.globalAlpha = glowAlpha + 0.15;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Label
    ctx.font = '8px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(can.isFull ? '🪣 полная' : '🪣 улика', x, y + 22);

    ctx.restore();
  }
}

// ─── §7.3 Character-specific top-down silhouettes ────────────────────────────
// Each character has a defined visual identity readable at 64×64px from top-down.
// We draw these AFTER the base circle so details sit on top of the body color.

function drawCharacterDetails(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  character: string,
  r: number,
): void {
  ctx.save();
  switch (character) {
    case 'denis': {
      // Yellow Yandex cap (arc on top half)
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.8, Math.PI, 0);
      ctx.fill();
      // Cap brim line
      ctx.strokeStyle = '#FFA000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.8, y);
      ctx.lineTo(x + r * 0.8, y);
      ctx.stroke();
      // Phone glint (dark rect offset to side)
      ctx.fillStyle = '#111';
      ctx.fillRect(x + r * 0.45, y + 1, 4, 6);
      ctx.fillStyle = '#4FC3F7';
      ctx.fillRect(x + r * 0.46, y + 2, 2.5, 4);
      break;
    }
    case 'anya': {
      // AirPods — two tiny white dots on the sides
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x - r * 0.75, y - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + r * 0.75, y - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Ponytail (small arc at back)
      ctx.fillStyle = '#CE93D8';
      ctx.beginPath();
      ctx.arc(x, y + r * 0.6, 4, 0, Math.PI);
      ctx.fill();
      break;
    }
    case 'vova': {
      // Gold chain across chest
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y + 2, r * 0.45, -0.4, Math.PI + 0.4);
      ctx.stroke();
      // Sunglasses strip
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.roundRect(x - r * 0.6, y - r * 0.35, r * 1.2, 3, 1);
      ctx.fill();
      // Gold lens glint
      ctx.fillStyle = 'rgba(255,215,0,0.5)';
      ctx.fillRect(x - r * 0.55, y - r * 0.33, 4, 2);
      ctx.fillRect(x + r * 0.15, y - r * 0.33, 4, 2);
      break;
    }
    case 'uncle_seryozha': {
      // Gray mustache
      ctx.fillStyle = '#9E9E9E';
      ctx.beginPath();
      ctx.ellipse(x, y + r * 0.15, r * 0.45, r * 0.22, 0, 0, Math.PI);
      ctx.fill();
      // Reading glasses on forehead (two tiny rings)
      ctx.strokeStyle = '#BDBDBD';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x - r * 0.3, y - r * 0.55, r * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + r * 0.3, y - r * 0.55, r * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      // Bridge between glasses
      ctx.beginPath();
      ctx.moveTo(x - r * 0.1, y - r * 0.55);
      ctx.lineTo(x + r * 0.1, y - r * 0.55);
      ctx.stroke();
      break;
    }
    case 'petrovich': {
      // Wrench (silver, rotated 45°)
      ctx.fillStyle = '#B0BEC5';
      ctx.save();
      ctx.translate(x + r * 0.55, y - r * 0.55);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-2, -r * 0.45, 4, r * 0.9);
      // Wrench head (open end)
      ctx.fillRect(-4, -r * 0.45, 8, 4);
      ctx.restore();
      // Oil stain on body
      ctx.fillStyle = 'rgba(60,40,20,0.55)';
      ctx.beginPath();
      ctx.ellipse(x - 2, y + 3, 4, 2.5, 0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'marina': {
      // Ring light aura (dashed pink circle slightly outside body)
      ctx.strokeStyle = '#FF80AB';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(x, y, r + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // Selfie stick (thin line from body upward-right)
      ctx.strokeStyle = '#EEEEEE';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + r * 0.5, y + r * 0.5);
      ctx.lineTo(x + r + 4, y - r - 4);
      ctx.stroke();
      // Phone at tip
      ctx.fillStyle = '#111';
      ctx.fillRect(x + r + 2, y - r - 7, 5, 7);
      break;
    }
    case 'akhmet': {
      // Broom handle (diagonal line)
      ctx.strokeStyle = '#8D6E63';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.6, y + r * 0.6);
      ctx.lineTo(x + r * 0.6, y - r * 0.6);
      ctx.stroke();
      // Broom bristles at top-right end
      ctx.fillStyle = '#DEB887';
      ctx.save();
      ctx.translate(x + r * 0.6, y - r * 0.6);
      ctx.rotate(-Math.PI / 4);
      ctx.fillRect(-5, -2, 10, 4);
      ctx.restore();
      break;
    }
    case 'oleg': {
      // Earpiece wire on right side
      ctx.strokeStyle = '#ECEFF1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + r * 0.7, y - r * 0.3);
      ctx.lineTo(x + r * 0.9, y - r * 0.6);
      ctx.stroke();
      ctx.fillStyle = '#F5F5F5';
      ctx.beginPath();
      ctx.arc(x + r * 0.9, y - r * 0.6, 2, 0, Math.PI * 2);
      ctx.fill();
      // Dark sunglasses visor strip
      ctx.fillStyle = 'rgba(10,10,20,0.7)';
      ctx.beginPath();
      ctx.roundRect(x - r * 0.55, y - r * 0.3, r * 1.1, 4, 2);
      ctx.fill();
      break;
    }
    case 'lena': {
      // Bicycle helmet arc (top half)
      ctx.fillStyle = '#81C784';
      ctx.beginPath();
      ctx.arc(x, y - r * 0.15, r * 0.75, Math.PI, 0);
      ctx.fill();
      // Helmet strap lines
      ctx.strokeStyle = '#388E3C';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.6, y - r * 0.05);
      ctx.lineTo(x - r * 0.4, y + r * 0.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + r * 0.6, y - r * 0.05);
      ctx.lineTo(x + r * 0.4, y + r * 0.35);
      ctx.stroke();
      // Green tote bag to the side
      ctx.fillStyle = '#4CAF50';
      ctx.strokeStyle = '#2E7D32';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x + r * 0.6, y - r * 0.1, 7, 10, 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'barsik': {
      // Cat ears (two small triangles on top)
      ctx.fillStyle = '#FF7043';
      ctx.beginPath();
      ctx.moveTo(x - r * 0.4, y - r * 0.55);
      ctx.lineTo(x - r * 0.7, y - r * 1.05);
      ctx.lineTo(x - r * 0.05, y - r * 0.75);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + r * 0.4, y - r * 0.55);
      ctx.lineTo(x + r * 0.7, y - r * 1.05);
      ctx.lineTo(x + r * 0.05, y - r * 0.75);
      ctx.closePath();
      ctx.fill();
      // Inner ear pink
      ctx.fillStyle = '#FFCCBC';
      ctx.beginPath();
      ctx.moveTo(x - r * 0.38, y - r * 0.6);
      ctx.lineTo(x - r * 0.6, y - r * 0.95);
      ctx.lineTo(x - r * 0.1, y - r * 0.75);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + r * 0.38, y - r * 0.6);
      ctx.lineTo(x + r * 0.6, y - r * 0.95);
      ctx.lineTo(x + r * 0.1, y - r * 0.75);
      ctx.closePath();
      ctx.fill();
      // Tail (curved line to the right)
      ctx.strokeStyle = '#FF7043';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + r * 0.7, y + r * 0.3);
      ctx.quadraticCurveTo(x + r * 1.5, y + r * 0.1, x + r * 1.2, y - r * 0.5);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

// ─── Players ─────────────────────────────────────────────────────────────────
// §2.3: visionPoly is null when local player is dead (ghost vision = see all).
// The fog overlay drawn after this function naturally hides players outside the
// visible polygon. We only need explicit visibility checks for HUD annotations
// that would reveal tactical info (the ⚠️ siphon-setup warning).

function drawPlayers(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  visionPoly: Vec2[] | null,
  crouchCheckPoly: Vec2[] | null = null,
  animDt = 0,
): void {
  const localPlayer = state.players.find(p => p.id === state.localPlayerId);
  const isLocalSlivshchik = localPlayer?.role === 'slivshchik';

  // Prune sprite-animation state for players no longer in this match (bots
  // recreated each match, players who left, etc.) so `_spriteAnim` never
  // grows unbounded across a long multiplayer session.
  if (_spriteAnim.size > 0) {
    const currentIds = new Set(state.players.map(p => p.id));
    for (const id of _spriteAnim.keys()) {
      if (!currentIds.has(id)) _spriteAnim.delete(id);
    }
  }

  // Y-sort players so characters lower on screen (higher Y) render on top — correct depth
  const sortedPlayers = [...state.players].sort((a, b) => a.pos.y - b.pos.y);

  for (const player of sortedPlayers) {
    if (!player.isAlive) continue;
    const { x, y } = player.pos;
    const charDef = CHARACTERS[player.character];
    const isLocal = player.id === state.localPlayerId;

    // §2.3 — check visibility for HUD annotation gating (not for rendering,
    // which is handled by the fog overlay drawn afterwards).
    // §2.2 — crouching players require the narrower 70%-FOV cone to be "seen"
    // (outer 30% of the player's cone doesn't reveal crouching targets).
    const inFullCone = visionPoly === null || pointInPolygon(x, y, visionPoly);
    const inCrouchCone = !player.isCrouching || crouchCheckPoly === null || pointInPolygon(x, y, crouchCheckPoly);
    const playerVisible = isLocal || (inFullCone && inCrouchCone);

    // §2.2 Crouch stealth — fade players visible only in outer cone ring
    const crouchFadeAlpha = (!isLocal && player.isCrouching && inFullCone && !inCrouchCone) ? 0.35 : 1;
    ctx.globalAlpha = crouchFadeAlpha;

    // Suspected outline
    if (player.suspectedTimer > 0) {
      ctx.strokeStyle = '#FF1744';
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Note: fellow-slivshchik teammate outline is drawn in drawTeammateOutlines()
    // AFTER the fog overlay so it pierces the fog (§3.1.2 team awareness).

    // Shadow — flat ellipse, consistent with car/body/NPC shadow style (no per-frame gradient alloc)
    const shadowR = player.character === 'barsik' ? 12 : 24;
    ctx.save();
    ctx.globalAlpha = 0.30;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 16, shadowR, shadowR * 0.30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // §3.1.3 Барсик character is slightly smaller
    const isBarsik = player.character === 'barsik';
    const playerRadius = isBarsik ? 10 : 14;

    // §7.3 Character sprite (generated PNG) or primitive-circle fallback
    const charSprite = getSprite(`char_${player.character}`);
    const sheetMeta = SPRITE_SHEETS[`char_${player.character}`];
    // Display size for the sprite (AI-generated 128×128 originals)
    const spriteDisplaySize = isBarsik ? 52 : 82;

    if (charSprite && sheetMeta) {
      // Directional walk-cycle sheet: slice the current (row, frame)
      const { row, frame } = updateSpriteAnimation(player, animDt);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        charSprite,
        frame * sheetMeta.frameW, row * sheetMeta.frameH, sheetMeta.frameW, sheetMeta.frameH,
        x - spriteDisplaySize / 2, y - spriteDisplaySize / 2, spriteDisplaySize, spriteDisplaySize,
      );
      ctx.restore();
    } else if (charSprite) {
      // AI-generated single sprite — face toward viewer, no rotation.
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(charSprite, x - spriteDisplaySize / 2, y - spriteDisplaySize / 2, spriteDisplaySize, spriteDisplaySize);
      ctx.restore();
    } else {
      // Use Among Us style vector character
      drawCharacterVec(
        ctx,
        x,
        y,
        charDef.color,
        player.facingAngle,
        player.isCrouching,
        isBarsik,
      );
      // Accessories
      drawCharacterDetails(ctx, x, y, player.character, playerRadius);
    }

    // Identification ring — gold for local player, translucent white for others.
    // Ring radius matched to sprite size so it wraps just outside the sprite.
    // Ring matches the bean's actual half-height (RH for vecDraw bean)
    const ringRadius = charSprite ? spriteDisplaySize / 2 + 3 : 24; // 24 ≈ RH=22 + small gap
    // Local player: gold ring; others: subtle white ring
    if (isLocal) {
      // Soft gold glow halo
      ctx.globalAlpha = 0.20;
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(x, y, ringRadius + 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      // Sharp gold ring
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2.5;
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.40)';
      ctx.lineWidth = 1.5;
    }
    ctx.beginPath();
    ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Facing direction dot — larger, outlined for readability against any background
    const facingDist = charSprite
      ? (isBarsik ? spriteDisplaySize / 2 + 2 : spriteDisplaySize / 2 + 4)
      : 26; // just past the bean edge
    const fx = x + Math.cos(player.facingAngle) * facingDist;
    const fy = y + Math.sin(player.facingAngle) * facingDist;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(fx, fy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Crouching indicator
    if (player.isCrouching) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#90CAF9';
      ctx.beginPath();
      ctx.ellipse(x, y, 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Sprint dust trail — 3 fading particles trailing behind the movement direction
    if (player.isSprinting) {
      const trailDir = player.facingAngle + Math.PI; // opposite of facing = trail direction
      for (let t = 1; t <= 3; t++) {
        const dist = t * 12;
        const tx = x + Math.cos(trailDir) * dist;
        const ty = y + Math.sin(trailDir) * dist;
        const alpha = 0.25 - t * 0.07;
        const r = 5 - t;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#E0E0E0';
        ctx.beginPath();
        ctx.ellipse(tx, ty, r * 1.5, r * 0.7, trailDir, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Canister indicator
    if (player.isCarryingCanister) {
      ctx.font = '12px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🪣', x + 16, y - 10);
      ctx.textBaseline = 'alphabetic';
    }

    // §3.1.2 Vent teleport flash — brief expanding green ring
    if (player.ventFlashTimer > 0) {
      const progress = 1 - player.ventFlashTimer / VENT_FLASH_DURATION; // 0→1 over flash duration
      const radius = 14 + progress * 28;
      const alpha = 0.85 * (1 - progress);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#00E676';
      ctx.lineWidth = 3 + (1 - progress) * 4;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      // Inner white flash (brightest at start)
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, y, 14 * (1 - progress * 0.7), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Effective half-size for annotations: sprite edge when sprite loaded, else primitive radius
    const effectiveHalf = charSprite ? spriteDisplaySize / 2 : playerRadius;

    // Emote bubble — positioned above sprite top
    if (player.emote) {
      const emoteY = y - effectiveHalf - 28;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();
      ctx.roundRect(x - 18, emoteY - 2, 36, 28, 6);
      ctx.fill();
      ctx.font = '18px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.emote, x, emoteY + 12);
      ctx.textBaseline = 'alphabetic';
    }

    // Name tag — positioned ABOVE character
    const nameTagY = y - effectiveHalf - 18;
    ctx.font = `${isLocal ? 'bold ' : ''}12px sans-serif`;
    ctx.textAlign = 'center';

    // Dark pill background (Among Us style)
    const nameW = ctx.measureText(player.name).width;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    ctx.roundRect(x - nameW / 2 - 6, nameTagY - 11, nameW + 12, 16, 8);
    ctx.fill();

    ctx.fillStyle = isLocal ? '#FFD700' : '#FFFFFF';
    ctx.fillText(player.name, x, nameTagY + 1);

    // Ambush charge indicator — ring around sprite
    if (player.ambushChargeTimer > 0) {
      const pct = player.ambushChargeTimer / 1.5;
      ctx.strokeStyle = '#FF1744';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, ringRadius + 4, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
      ctx.stroke();
    }

    // §2.3 / §2.4 — ⚠️ siphon-setup warning only shown if the siphoner is
    // visible to the local player (otherwise it would reveal hidden activity).
    if (playerVisible) {
      const isInSetup = state.cars.some(c => c.siphoner === player.id && c.siphonPhase === 1);
      if (isInSetup) {
        const warnY = y - effectiveHalf - 14;
        ctx.font = '14px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 180);
        ctx.fillText('⚠️', x, warnY);
        ctx.textBaseline = 'alphabetic';
      }
    }
    // Always reset alpha at end of player draw pass
    ctx.globalAlpha = 1;
  }
}

// ─── Alarm button / entrance ──────────────────────────────────────────────────

function drawAlarmButton(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (state.meetingCooldown > 0) return;
  const { x, y } = ENTRANCE_POS;
  const bx = x;
  const by = y - 10;

  const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 400);
  const glowColor = '#CC1A1A';

  // Outer concentric glow rings (3 rings fading outward)
  const ringRadii = [40, 30, 22];
  const ringAlphas = [0.10, 0.14, 0.18];
  for (let i = 0; i < ringRadii.length; i++) {
    ctx.save();
    ctx.globalAlpha = pulse * ringAlphas[i];
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(bx, by, ringRadii[i], 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Radial gradient fill for the button body
  const grad = ctx.createRadialGradient(bx - 4, by - 4, 2, bx, by, 15);
  grad.addColorStop(0, '#FF5252');
  grad.addColorStop(0.6, '#D32F2F');
  grad.addColorStop(1, '#B71C1C');

  // Dark thick outline
  ctx.save();
  ctx.beginPath();
  ctx.arc(bx, by, 16, 0, Math.PI * 2);
  ctx.fillStyle = '#1A0000';
  ctx.fill();
  ctx.restore();

  // Button body
  ctx.save();
  ctx.beginPath();
  ctx.arc(bx, by, 14, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  // Inner highlight ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(bx, by, 14, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,200,200,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Sheen highlight (top-left arc)
  ctx.save();
  ctx.beginPath();
  ctx.arc(bx - 3, by - 4, 7, Math.PI * 1.1, Math.PI * 1.7);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  // Label "СХОДКА" centered on the button
  ctx.save();
  ctx.font = 'bold 7px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 3;
  ctx.fillText('СХОДКА', bx, by);
  ctx.shadowBlur = 0;
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

function drawEntrance(ctx: CanvasRenderingContext2D): void {
  const L = 450, R = 750; // arch left/right
  const T = 810;          // arch top y
  const PW = 26;          // pillar width
  const LINTEL = 20;      // lintel height

  // ── Pillar bodies (Soviet pre-cast concrete) ─────────────────────────────
  for (const [px] of [[L - PW, 1], [R, -1]] as [number, number][]) {
    ctx.fillStyle = '#8D9EAB';
    ctx.fillRect(px, T, PW, 90);
    ctx.fillStyle = '#607D8B';   // shadow side
    ctx.fillRect(px + PW - 5, T, 5, 90);
    ctx.fillStyle = '#B0BEC5';   // lit side
    ctx.fillRect(px, T, 5, 90);
    // Horizontal joint lines (panel seams)
    ctx.strokeStyle = '#546E7A';
    ctx.lineWidth = 1;
    for (const jy of [T + 22, T + 44, T + 66]) {
      ctx.beginPath();
      ctx.moveTo(px, jy);
      ctx.lineTo(px + PW, jy);
      ctx.stroke();
    }
  }

  // ── Lintel (overhead beam spanning full arch width) ──────────────────────
  const fullW = R - L + PW * 2;
  ctx.fillStyle = '#78909C';
  ctx.fillRect(L - PW, T, fullW, LINTEL);
  ctx.fillStyle = '#90A4AE';   // top highlight
  ctx.fillRect(L - PW, T, fullW, 5);
  ctx.fillStyle = '#455A64';   // underside shadow
  ctx.fillRect(L - PW, T + LINTEL - 4, fullW, 4);
  // Lintel panel seams
  ctx.strokeStyle = '#607D8B';
  ctx.lineWidth = 1;
  for (const sx of [L - PW + 90, L - PW + 180, L - PW + 270]) {
    ctx.beginPath();
    ctx.moveTo(sx, T);
    ctx.lineTo(sx, T + LINTEL);
    ctx.stroke();
  }

  // ── Iron gate bars descending from lintel ────────────────────────────────
  ctx.strokeStyle = '#2E3A45';
  ctx.lineWidth = 3;
  for (let gx = L + 22; gx < R - 10; gx += 26) {
    ctx.beginPath();
    ctx.moveTo(gx, T + LINTEL);
    ctx.lineTo(gx, T + LINTEL + 26);
    ctx.stroke();
  }
  // Crossbar
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#37474F';
  ctx.beginPath();
  ctx.moveTo(L + 12, T + LINTEL + 26);
  ctx.lineTo(R - 12, T + LINTEL + 26);
  ctx.stroke();

  // ── Building address plate on left pillar ────────────────────────────────
  ctx.fillStyle = '#37474F';
  ctx.beginPath();
  ctx.roundRect(L - PW + 5, T + 32, 16, 24, 2);
  ctx.fill();
  ctx.fillStyle = '#B0BEC5';
  ctx.font = 'bold 5px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ЖК', L - PW + 13, T + 42);
  ctx.fillText('ЦП', L - PW + 13, T + 49);
  ctx.fillStyle = '#e5a50a';
  ctx.font = 'bold 6px sans-serif';
  ctx.fillText('14', L - PW + 13, T + 52);
}

// ─── World UI ─────────────────────────────────────────────────────────────────

function drawUI(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  local: typeof state.players[number],
): void {
  // Stamina bar near local player (only when not full or sprinting)
  const showStamina = local.isSprinting || local.stamina < 4.9;
  if (showStamina) {
    const { x, y } = local.pos;
    const barW = 36; const barH = 5;
    const bx = x - barW / 2; const by = y - 42;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(bx - 1, by - 1, barW + 2, barH + 2, 3);
    ctx.fill();
    ctx.fillStyle = local.isSprinting ? '#FFF176' : '#81D4FA';
    ctx.beginPath();
    ctx.roundRect(bx, by, (local.stamina / 5) * barW, barH, 2);
    ctx.fill();
    ctx.font = '7px sans-serif';
    ctx.fillStyle = '#FFD54F';
    ctx.textAlign = 'center';
    ctx.fillText('🏃', x, by - 2);
  }
}
