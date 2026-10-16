import { describe, expect, it } from 'vitest';
import { canEvolveTwinDrone } from './twinDrone';

describe('canEvolveTwinDrone', () => {
  it.each(['boltPower', 'firingSystem', 'boltPropulsion'] as const)('rejects missing %s mastery', track => {
    const ranks = { boltPower: 2, firingSystem: 2, boltPropulsion: 2, [track]: 1 };
    expect(canEvolveTwinDrone(ranks, 1, false)).toBe(false);
  });
  const mastered = Object.freeze({ boltPower: 2, firingSystem: 2, boltPropulsion: 2 });
  it('rejects Replication zero', () => {
    expect(canEvolveTwinDrone(mastered, 0, false)).toBe(false);
  });
  it('qualifies exact mastery and Replication one', () => {
    expect(canEvolveTwinDrone(mastered, 1, false)).toBe(true);
  });
  it('qualifies higher Replication', () => {
    expect(canEvolveTwinDrone(mastered, 5, false)).toBe(true);
  });
  it('rejects already evolved Twin', () => {
    expect(canEvolveTwinDrone(mastered, 1, true)).toBe(false);
  });
  it('does not mutate ranks', () => {
    const ranks = Object.freeze({ boltPower: 1, firingSystem: 2, boltPropulsion: 2 });
    canEvolveTwinDrone(ranks, 3, false);
    expect(ranks).toEqual({ boltPower: 1, firingSystem: 2, boltPropulsion: 2 });
  });
});
