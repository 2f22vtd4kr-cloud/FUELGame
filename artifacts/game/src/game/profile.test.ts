import { describe, it, expect } from 'vitest';
import { xpToTier, XP_PER_TIER } from './profile';

describe('xpToTier (§3.3 Battle Pass)', () => {
  it('starts at tier 0 with no XP', () => {
    expect(xpToTier(0)).toBe(0);
  });

  it('advances one tier per XP_PER_TIER threshold', () => {
    expect(xpToTier(XP_PER_TIER)).toBe(1);
    expect(xpToTier(XP_PER_TIER * 3)).toBe(3);
    expect(xpToTier(XP_PER_TIER - 1)).toBe(0);
  });

  it('caps at tier 50 (the top of the battle pass) no matter how much XP is earned', () => {
    expect(xpToTier(XP_PER_TIER * 50)).toBe(50);
    expect(xpToTier(XP_PER_TIER * 999)).toBe(50);
  });
});
