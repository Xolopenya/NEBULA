import { describe, expect, it } from 'vitest';
import { canEvolveClusterMissile } from './clusterMissile';

describe('canEvolveClusterMissile', () => {
  it.each(['warheadPower', 'propulsion', 'blastExpansion'] as const)('rejects missing %s mastery', track => {
    const ranks = { warheadPower: 2, propulsion: 2, blastExpansion: 2, [track]: 1 };
    expect(canEvolveClusterMissile(ranks, 1, false)).toBe(false);
  });
  const mastered = Object.freeze({ warheadPower: 2, propulsion: 2, blastExpansion: 2 });
  it('rejects Spatial level zero', () => {
    expect(canEvolveClusterMissile(mastered, 0, false)).toBe(false);
  });
  it('qualifies exact mastery and Spatial one', () => {
    expect(canEvolveClusterMissile(mastered, 1, false)).toBe(true);
  });
  it('qualifies higher Spatial levels', () => {
    expect(canEvolveClusterMissile(mastered, 4, false)).toBe(true);
  });
  it('rejects an already evolved Cluster', () => {
    expect(canEvolveClusterMissile(mastered, 1, true)).toBe(false);
  });
  it('does not mutate input ranks', () => {
    const ranks = Object.freeze({ warheadPower: 1, propulsion: 2, blastExpansion: 2 });
    canEvolveClusterMissile(ranks, 3, false);
    expect(ranks).toEqual({ warheadPower: 1, propulsion: 2, blastExpansion: 2 });
  });
});
