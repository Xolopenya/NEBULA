import { describe, expect, it } from 'vitest';
import { addExperience, xpForNextLevel } from './experience';

describe('experience rules', () => {
  it('requires five XP per current level', () => {
    expect([1, 2, 3].map(xpForNextLevel)).toEqual([5, 10, 15]);
  });
  it('credits XP below threshold', () => {
    expect(addExperience({ level: 1, xp: 2 }, 1)).toEqual({ level: 1, xp: 3 });
  });
  it('levels exactly at threshold', () => {
    expect(addExperience({ level: 1, xp: 4 }, 1)).toEqual({ level: 2, xp: 0 });
  });
  it('retains excess XP after a level', () => {
    expect(addExperience({ level: 1, xp: 4 }, 3)).toEqual({ level: 2, xp: 2 });
  });
  it('supports multiple levels in one award', () => {
    expect(addExperience({ level: 1, xp: 0 }, 32)).toEqual({ level: 4, xp: 2 });
  });
  it('handles a later-level exact threshold', () => {
    expect(addExperience({ level: 3, xp: 14 }, 1)).toEqual({ level: 4, xp: 0 });
  });
  it('does not mutate the supplied state and handles zero awards', () => {
    const state = { level: 2, xp: 7 };
    expect(addExperience(state, 0)).toEqual(state);
    addExperience(state, 10);
    expect(state).toEqual({ level: 2, xp: 7 });
  });
  it('gives the same result for split and combined awards', () => {
    const initial = { level: 1, xp: 0 };
    const split = [3, 7, 15, 9].reduce(addExperience, initial);
    expect(split).toEqual(addExperience(initial, 34));
  });
});
