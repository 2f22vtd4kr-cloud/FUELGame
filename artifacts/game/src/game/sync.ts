// §6.3 Cross-device persistence — mirrors match history, inventory and
// achievement unlocks into Postgres for players identified by Telegram id.
// localStorage (see profile.ts) remains the source of truth for gameplay;
// these calls are fire-and-forget best-effort mirrors, silently no-op when
// not running inside Telegram (no telegramId available).

interface TelegramUser {
  id?: number;
  first_name?: string;
  username?: string;
  photo_url?: string;
}

function getTelegramUser(): TelegramUser | null {
  const tg = (window as typeof window & {
    Telegram?: { WebApp?: { initDataUnsafe?: { user?: TelegramUser } } };
  }).Telegram?.WebApp;
  return tg?.initDataUnsafe?.user ?? null;
}

function identityPayload(): Record<string, unknown> | null {
  const user = getTelegramUser();
  if (!user?.id) return null;
  return {
    telegramId: user.id,
    displayName: user.first_name || `Игрок ${user.id}`,
    username: user.username,
    photoUrl: user.photo_url,
  };
}

const apiBase = () => (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? '/api';

function post(path: string, body: Record<string, unknown>): void {
  fetch(`${apiBase()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => { /* offline/non-Telegram — DB mirror is best-effort */ });
}

/** Call once a match ends, alongside the localStorage profile update. */
export function syncMatchHistory(input: {
  role: string;
  result: 'win' | 'lose' | 'draw';
  fuelSiphoned?: number;
  tasksCompleted?: number;
  survivedSeconds?: number;
  character?: string;
}): void {
  const identity = identityPayload();
  if (!identity) return;
  post('/sync/match-history', { ...identity, ...input });
}

/** Call whenever a cosmetic item is purchased or (re-)equipped. */
export function syncInventoryItem(itemType: 'hat' | 'pet' | 'car', itemId: string, equipped: boolean): void {
  const identity = identityPayload();
  if (!identity) return;
  post('/sync/inventory', { ...identity, itemType, itemId, equipped });
}

/** Call whenever a new achievement is unlocked. */
export function syncAchievement(achievementId: string): void {
  const identity = identityPayload();
  if (!identity) return;
  post('/sync/achievement', { ...identity, achievementId });
}
