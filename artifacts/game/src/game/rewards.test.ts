import { describe, it, expect } from 'vitest';
import { checkAchievements } from './rewards';
import type { GameState, Player } from './types';
import type { PlayerProfile } from './profile';

function makeProfile(overrides: Partial<PlayerProfile> = {}): PlayerProfile {
  return {
    babki: 0, battlePassXP: 0, battlePassTier: 0, battlePassPremium: false,
    achievements: [], daily: null,
    totalMatchesPlayed: 0, totalMatchesWon: 0, totalTasksCompleted: 0,
    totalFuelSiphoned: 0, totalCorrectVotes: 0, totalCanistersCollected: 0,
    survivalStreak: 0,
    purchasedHats: [], equippedHat: 'ushanka',
    purchasedPets: [], equippedPet: 'none',
    purchasedCarSkins: [], equippedCarSkin: 'moskvich_default',
    playerName: 'Test', deviceId: 'test-device',
    seenTutorial: true,
    textSize: 'medium', colorblindMode: false, highContrastMode: false,
    volumeMaster: 1, volumeMusic: 1, volumeSfx: 1,
    autoInteract: false, simplifiedChatWheel: false, audioCaptions: true, language: 'ru',
    ...overrides,
  } as PlayerProfile;
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player_human', name: 'Тест', character: 'denis',
    role: 'khozain', isAlive: true, pos: { x: 0, y: 0 }, facingAngle: 0,
    stamina: 100, tasksCompleted: 0, fuelSiphoned: 0, correctVotes: 0,
    canistersCollected: 0, isBot: false,
    ...overrides,
  } as unknown as Player;
}

describe('checkAchievements (§3.6)', () => {
  it('unlocks "first_match" exactly on the player\'s first recorded match', () => {
    const profile = makeProfile({ totalMatchesPlayed: 1 });
    const unlocked = checkAchievements({} as GameState, makePlayer(), false, profile);
    expect(unlocked.map(a => a.id)).toContain('first_match');
  });

  it('does not re-unlock an achievement the profile already has', () => {
    const profile = makeProfile({ totalMatchesPlayed: 1, achievements: ['first_match'] });
    const unlocked = checkAchievements({} as GameState, makePlayer(), false, profile);
    expect(unlocked.map(a => a.id)).not.toContain('first_match');
  });

  it('unlocks "first_win" only when the player actually won', () => {
    const profile = makeProfile({ totalMatchesPlayed: 2 });
    const lost = checkAchievements({} as GameState, makePlayer(), false, profile);
    const won = checkAchievements({} as GameState, makePlayer(), true, profile);
    expect(lost.map(a => a.id)).not.toContain('first_win');
    expect(won.map(a => a.id)).toContain('first_win');
  });

  it('unlocks task-count achievements based on this match\'s task total', () => {
    const profile = makeProfile({ totalMatchesPlayed: 3 });
    const unlocked = checkAchievements({} as GameState, makePlayer({ tasksCompleted: 10 }), false, profile);
    expect(unlocked.map(a => a.id)).toEqual(expect.arrayContaining(['hard_worker', 'all_tasks']));
  });
});
