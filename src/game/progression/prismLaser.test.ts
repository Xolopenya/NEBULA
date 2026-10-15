import { describe, expect, it } from 'vitest';
import { canEvolvePrismLaser, type LaserRanks } from './prismLaser';

describe('canEvolvePrismLaser', () => {
  it.each(['power', 'fireRate', 'speed'] as const)('requires rank 2 in %s', (upgrade) => {
    const ranks: LaserRanks = { power: 2, fireRate: 2, speed: 2 };
    ranks[upgrade] = 1;
    expect(canEvolvePrismLaser(ranks, 1, false)).toBe(false);
    ranks[upgrade] = 0;
    expect(canEvolvePrismLaser(ranks, 1, false)).toBe(false);
  });

  it('requires Combat Processor even with fully mastered Laser', () => {
    expect(canEvolvePrismLaser({ power: 2, fireRate: 2, speed: 2 }, 0, false)).toBe(false);
  });

  it('qualifies at exactly 2/2/2 and Combat level 1', () => {
    expect(canEvolvePrismLaser({ power: 2, fireRate: 2, speed: 2 }, 1, false)).toBe(true);
  });

  it('accepts higher Combat levels', () => {
    expect(canEvolvePrismLaser({ power: 2, fireRate: 2, speed: 2 }, 4, false)).toBe(true);
  });

  it('never qualifies once evolved', () => {
    expect(canEvolvePrismLaser({ power: 2, fireRate: 2, speed: 2 }, 4, true)).toBe(false);
  });

  it('does not mutate ranks while checking eligibility', () => {
    const ranks = Object.freeze({ power: 2, fireRate: 2, speed: 2 });
    expect(canEvolvePrismLaser(ranks, 1, false)).toBe(true);
    expect(ranks).toEqual({ power: 2, fireRate: 2, speed: 2 });
  });
});
