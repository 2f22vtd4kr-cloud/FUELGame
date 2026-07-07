/**
 * §9.2 Backstab Moment replay system
 * Captures the current canvas frame when a dramatic moment is detected.
 * Saves a watermarked JPEG that the player can download/share.
 */

let _momentDataUrl: string | null = null;
let _momentType: string | null = null;
let _onMomentCaptured: ((type: string) => void) | null = null;

/** Register a callback that fires when a new moment is captured */
export function onMomentCaptured(cb: (type: string) => void): void {
  _onMomentCaptured = cb;
}

/** Capture current canvas state as the Backstab Moment screenshot */
export function captureMoment(canvas: HTMLCanvasElement, type: string): void {
  if (_momentDataUrl) return; // already captured one this match, don't overwrite

  let tmp: HTMLCanvasElement;
  try {
    tmp = document.createElement('canvas');
  const size = Math.min(canvas.width, canvas.height, 1080);
  tmp.width = size;
  tmp.height = size;
  const ctx = tmp.getContext('2d');
  if (!ctx) return;

  // Centre-crop from source canvas
  const sx = (canvas.width - size) / 2;
  const sy = (canvas.height - size) / 2;
  ctx.drawImage(canvas, sx, sy, size, size, 0, 0, size, size);

  // Dark vignette overlay
  const vignette = ctx.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size * 0.75);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, size, size);

  // Moment label banner (top)
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, 0, size, 74);
  ctx.fillStyle = '#FF1744';
  ctx.font = `bold ${Math.round(size * 0.05)}px sans-serif`;
  ctx.textAlign = 'center';
  const labelMap: Record<string, string> = {
    catch_siphoner:  '💥 БАКСТАБ МОМЕНТ — ПОЙМАЛ СЛИВЩИКА!',
    caught_siphoning: '🚨 БАКСТАБ МОМЕНТ — ЗАСТУКАЛИ!',
    dramatic_eject:  '🗑️ БАКСТАБ МОМЕНТ — ВЫБРОШЕН ИЗ ДВОРА!',
  };
  ctx.fillText(labelMap[type] ?? '💥 БАКСТАБ МОМЕНТ!', size / 2, Math.round(size * 0.05) + 12);

  // Bottom watermark bar
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, size - 56, size, 56);
  ctx.fillStyle = '#FFD700';
  ctx.font = `bold ${Math.round(size * 0.032)}px sans-serif`;
  ctx.fillText('95-Й БАКСТАБ', size / 2, size - 28);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = `${Math.round(size * 0.022)}px sans-serif`;
  ctx.fillText('Зафиксируй цену бензина → @fuel_fuel_fuel_bot', size / 2, size - 8);

    _momentDataUrl = tmp.toDataURL('image/jpeg', 0.88);
    _momentType = type;
    _onMomentCaptured?.(type);
  } catch (err) {
    // Canvas may be tainted (cross-origin content) or unavailable — fail silently
    console.warn('[ReplayBuffer] captureMoment failed:', err);
  }
}

/** Download the captured Backstab Moment image */
export function downloadMoment(): void {
  if (!_momentDataUrl) return;
  const link = document.createElement('a');
  link.download = `95-backstab-moment-${_momentType ?? 'screenshot'}.jpg`;
  link.href = _momentDataUrl;
  link.click();
}

/** Returns the captured dataURL, or null if nothing was captured yet */
export function getMomentDataUrl(): string | null {
  return _momentDataUrl;
}

/** Clear the captured moment (call at match reset) */
export function clearMoment(): void {
  _momentDataUrl = null;
  _momentType = null;
}
