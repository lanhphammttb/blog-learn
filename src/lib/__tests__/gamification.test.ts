import { describe, it, expect } from 'vitest';
import { getUserBadges, calculateStreak, ALL_BADGES } from '../gamification';

describe('getUserBadges', () => {
  it('returns no unlocked badges for a new user', () => {
    const { unlocked, locked } = getUserBadges(0, 0, 0);
    expect(unlocked).toHaveLength(0);
    expect(locked).toHaveLength(ALL_BADGES.length);
  });

  it('unlocks early-bird after 1 lesson', () => {
    const { unlocked } = getUserBadges(1, 0, 0);
    expect(unlocked.map(b => b.id)).toContain('early-bird');
  });

  it('unlocks fire-starter after 3-day streak', () => {
    const { unlocked } = getUserBadges(0, 3, 0);
    expect(unlocked.map(b => b.id)).toContain('fire-starter');
  });

  it('unlocks vocab-master after 10 flashcards', () => {
    const { unlocked } = getUserBadges(0, 0, 10);
    expect(unlocked.map(b => b.id)).toContain('vocab-master');
  });

  it('unlocks scholar after 20 lessons', () => {
    const { unlocked } = getUserBadges(20, 0, 0);
    const ids = unlocked.map(b => b.id);
    expect(ids).toContain('early-bird');
    expect(ids).toContain('fast-learner');
    expect(ids).toContain('grammar-guru');
    expect(ids).toContain('scholar');
  });

  it('unlocked + locked counts always equal total badges', () => {
    const { unlocked, locked } = getUserBadges(15, 5, 12);
    expect(unlocked.length + locked.length).toBe(ALL_BADGES.length);
  });
});

describe('calculateStreak', () => {
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(12, 0, 0, 0);
    return d;
  };

  it('returns 0 for empty records', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('returns 0 when last activity was more than 1 day ago', () => {
    const records = [{ lastActive: daysAgo(2) }];
    expect(calculateStreak(records)).toBe(0);
  });

  it('returns 1 for activity only today', () => {
    const records = [{ lastActive: daysAgo(0) }];
    expect(calculateStreak(records)).toBe(1);
  });

  it('returns 3 for 3 consecutive days including today', () => {
    const records = [
      { lastActive: daysAgo(0) },
      { lastActive: daysAgo(1) },
      { lastActive: daysAgo(2) },
    ];
    expect(calculateStreak(records)).toBe(3);
  });

  it('stops streak at gap', () => {
    const records = [
      { lastActive: daysAgo(0) },
      { lastActive: daysAgo(1) },
      { lastActive: daysAgo(3) }, // gap at day 3
    ];
    expect(calculateStreak(records)).toBe(2);
  });
});
