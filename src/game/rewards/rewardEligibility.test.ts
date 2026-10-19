import { describe, expect, it } from 'vitest';
import { PlayerBuild } from '../player/PlayerBuild';
import { isRewardEligible, assertRewardFeasible, type RewardEligibilityContext } from './rewardEligibility';
import { rewardChoices, choiceIdentity } from './rewardChoices';

function context(): RewardEligibilityContext {
  const build = new PlayerBuild();
  return { build: build.snapshot(), laserRanks: { power: 0, fireRate: 0, speed: 0 },
    missileRanks: { warheadPower: 0, propulsion: 0, blastExpansion: 0 }, droneRanks: { boltPower: 0, firingSystem: 0, boltPropulsion: 0 },
    moduleLevels: { hull: 0, thruster: 0, collector: 0, combat: 0, spatial: 0, replication: 0 },
    prismEvolved: false, clusterEvolved: false, twinDroneEvolved: false, laser: { damage: 1, fireInterval: 600, projectileSpeed: 1200 },
    missile: { damage: 2, speed: 450, explosionRadius: 120 }, drone: { damage: 1, fireInterval: 1200, projectileSpeed: 800 },
    magnetRadius: 180, combatMultiplier: 1, hullPreview: build.previewPrototypeHullPlating(), thrusterPreview: build.previewPrototypeThruster() };
}
describe('detached hard reward eligibility', () => {
  it.each(rewardChoices)('checks canonical $kind with no mutation/Tag/Analyzer/RNG dependency', choice => {
    const c = context(), before = structuredClone(c), evolution = ['prism', 'cluster', 'twin'].includes(choice.kind);
    expect(isRewardEligible(choice, c)).toBe(!evolution); expect(c).toEqual(before);
    c.build.tags.PRECISION = 100; c.build.effectiveStats.combatAnalyzer = 20;
    expect(isRewardEligible(choice, c)).toBe(!evolution);
  });
  for (const choice of rewardChoices.filter(c => 'upgrade' in c)) {
    it.each([0, 1, 2])(`${choiceIdentity(choice)} rank%s respects installed system and cap`, rank => {
      const c = context(), ranks = choice.kind === 'laser' ? c.laserRanks : choice.kind === 'missile' ? c.missileRanks : c.droneRanks;
      Reflect.set(ranks, choice.upgrade, rank); expect(isRewardEligible(choice, c)).toBe(rank < 2);
      c.build.slots.combat.splice(0); expect(isRewardEligible(choice, c)).toBe(false);
    });
  }
  it.each(['prism', 'cluster', 'twin'] as const)('%s uses the complete recipe and installed system, not a free slot', kind => {
    const c = context(), ranks = kind === 'prism' ? c.laserRanks : kind === 'cluster' ? c.missileRanks : c.droneRanks;
    const module = kind === 'prism' ? 'combat' : kind === 'cluster' ? 'spatial' : 'replication';
    for (const key of Object.keys(ranks)) Reflect.set(ranks, key, 2);
    expect(isRewardEligible({ kind }, c)).toBe(false); Reflect.set(c.moduleLevels, module, 1);
    expect(isRewardEligible({ kind }, c)).toBe(true); Reflect.set(c.moduleLevels, module, 5); expect(isRewardEligible({ kind }, c)).toBe(true);
    for (const key of Object.keys(ranks)) { Reflect.set(ranks, key, 1); expect(isRewardEligible({ kind }, c)).toBe(false); Reflect.set(ranks, key, 2); }
    Reflect.set(c, kind === 'prism' ? 'prismEvolved' : kind === 'cluster' ? 'clusterEvolved' : 'twinDroneEvolved', true);
    expect(isRewardEligible({ kind }, c)).toBe(false);
    Reflect.set(c, kind === 'prism' ? 'prismEvolved' : kind === 'cluster' ? 'clusterEvolved' : 'twinDroneEvolved', false);
    c.build.slots.combat.splice(0); expect(isRewardEligible({ kind }, c)).toBe(false);
  });
  it.each(['hull', 'thruster', 'collector', 'combat', 'spatial', 'replication'] as const)('%s repeats without balance/slot caps, rejects safe-level exhaustion', module => {
    const c = context(); Reflect.set(c.moduleLevels, module, 1000); expect(isRewardEligible({ kind: 'passive', module }, c)).toBe(true);
    Reflect.set(c.moduleLevels, module, Number.MAX_SAFE_INTEGER); expect(isRewardEligible({ kind: 'passive', module }, c)).toBe(false);
  });
  it.each([null, {}, { kind: 'active' }, { kind: 'core' }, { kind: 'doctrine' }, { kind: 'laser', upgrade: 'power', bonus: 1 },
    { kind: 'laser', upgrade: 'unknown' }, { kind: 'passive', module: 'analyzer' }])('unsupported/malformed %# is rejected', choice => {
    expect(isRewardEligible(choice, context())).toBe(false);
  });
  it.each(['damage', 'speed', 'interval', 'multiplier', 'impact', 'scale', 'spatial', 'replication', 'hull', 'thruster'] as const)('rejects numeric %s overflow/infeasibility before mutation', field => {
    const c = context();
    if (field === 'damage') Reflect.set(c.laser, 'damage', Number.MAX_SAFE_INTEGER);
    if (field === 'speed') Reflect.set(c.laser, 'projectileSpeed', Infinity);
    if (field === 'interval') Reflect.set(c.drone, 'fireInterval', 100);
    if (field === 'multiplier') Reflect.set(c, 'combatMultiplier', Number.MAX_SAFE_INTEGER);
    if (field === 'impact') c.build.effectiveStats.impact = Number.MAX_SAFE_INTEGER;
    if (field === 'scale') c.build.effectiveStats.projectileScale = Number.MAX_SAFE_INTEGER;
    if (field === 'spatial') Reflect.set(c.moduleLevels, 'spatial', Number.MAX_SAFE_INTEGER);
    if (field === 'replication') { Reflect.set(c.moduleLevels, 'replication', Number.MAX_SAFE_INTEGER); c.build.effectiveStats.projectileScale = 2; }
    if (field === 'hull') Reflect.set(c, 'hullPreview', null);
    if (field === 'thruster') Reflect.set(c, 'thrusterPreview', null);
    const choice = field === 'interval' ? { kind: 'drone' as const, upgrade: 'firingSystem' as const }
      : field === 'multiplier' || field === 'hull' || field === 'thruster' ? { kind: 'passive' as const, module: field === 'multiplier' ? 'combat' as const : field }
        : { kind: 'laser' as const, upgrade: 'power' as const };
    const before = structuredClone(c); expect(isRewardEligible(choice, c)).toBe(false);
    expect(() => assertRewardFeasible(choice, c)).toThrow(RangeError); expect(c).toEqual(before);
  });
});
