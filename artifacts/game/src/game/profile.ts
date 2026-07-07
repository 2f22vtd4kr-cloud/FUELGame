// ─── §3.2/§3.3/§3.5/§3.6 Player Profile (localStorage persistence) ────────────

const STORAGE_KEY = '95y_profile_v1';

export interface DailyChallengeState {
  date: string;       // YYYY-MM-DD in Moscow time
  challengeId: string;
  progress: number;
  completed: boolean;
  rewardClaimed: boolean;
}

export interface PlayerProfile {
  babki: number;
  battlePassXP: number;
  battlePassTier: number;
  battlePassPremium: boolean;
  achievements: string[];         // unlocked achievement IDs
  daily: DailyChallengeState | null;
  totalMatchesPlayed: number;
  totalMatchesWon: number;
  totalTasksCompleted: number;
  totalFuelSiphoned: number;      // cumulative % across all matches
  totalCorrectVotes: number;
  totalCanistersCollected: number;
  survivalStreak: number;         // consecutive matches survived (for survivor achievement)
  // §3.4 Cosmetics
  purchasedHats: string[];        // hat IDs owned
  equippedHat: string;            // currently equipped hat ID ('none' = bare head, 'ushanka' = default)
  // §9.3 Leaderboard / device identity
  playerName: string;             // display name for leaderboard
  deviceId: string;               // stable UUID for leaderboard upsert
}

const DEFAULTS: PlayerProfile = {
  babki: 0,
  battlePassXP: 0,
  battlePassTier: 0,
  battlePassPremium: false,
  achievements: [],
  daily: null,
  totalMatchesPlayed: 0,
  totalMatchesWon: 0,
  totalTasksCompleted: 0,
  totalFuelSiphoned: 0,
  totalCorrectVotes: 0,
  totalCanistersCollected: 0,
  survivalStreak: 0,
  purchasedHats: ['none', 'ushanka'],
  equippedHat: 'ushanka',
  playerName: '',
  deviceId: '',
};

function genDeviceId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const base: PlayerProfile = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
    // Ensure free starter hats are always present
    if (!base.purchasedHats.includes('none')) base.purchasedHats.push('none');
    if (!base.purchasedHats.includes('ushanka')) base.purchasedHats.push('ushanka');
    // Ensure deviceId is set
    if (!base.deviceId) {
      base.deviceId = genDeviceId();
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(base)); } catch { /* ignore */ }
    }
    return base;
  } catch {
    return { ...DEFAULTS, deviceId: genDeviceId() };
  }
}

export function saveProfile(p: PlayerProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch { /* storage might be blocked */ }
}

/** §3.3 Battle pass XP threshold per tier */
export const XP_PER_TIER = 500;

/** Compute battle pass tier from raw XP */
export function xpToTier(xp: number): number {
  return Math.min(50, Math.floor(xp / XP_PER_TIER));
}

/** Moscow time date string YYYY-MM-DD */
export function moscowDateString(): string {
  const now = new Date();
  // Moscow is UTC+3
  const moscow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return moscow.toISOString().slice(0, 10);
}
