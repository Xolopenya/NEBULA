import { missileProfile } from '../player/missileProgression';
import { laserProfile } from '../player/laserProgression';
import { describe, expect, it } from 'vitest';
import { PlayerBuild } from '../player/PlayerBuild';
import { isRewardEligible, assertRewardFeasible, type RewardEligibilityContext } from './rewardEligibility';
import { rewardChoices, choiceIdentity } from './rewardChoices';

function context(): RewardEligibilityContext {
  const build = new PlayerBuild(), buildSnapshot = build.snapshot();
  return { build: buildSnapshot, get laserRanks() { return this.build.laser.ranks; },
    get missileRanks() { return this.build.missile.ranks; }, droneRanks: { boltPower: 0, firingSystem: 0, boltPropulsion: 0 },
    moduleLevels: { hull: 0, thruster: 0, collector: 0, combat: 0, spatial: 0, replication: 0 },
    get prismEvolved() { return this.build.laser.form === 'PRISM'; }, set prismEvolved(v: boolean) { this.build.laser.form = v ? 'PRISM' : 'BASE'; }, get clusterEvolved() { return this.build.missile.form === 'CLUSTER'; }, set clusterEvolved(v: boolean) { this.build.missile.form = v ? 'CLUSTER' : 'BASE'; }, twinDroneEvolved: false, get laser() { const p = laserProfile(this.build.laser); return { damage: p.damage, fireInterval: p.fireInterval, projectileSpeed: p.projectileSpeed }; },
    get missile() { const p = missileProfile(this.build.missile); return { damage: p.damage, speed: p.projectileSpeed, explosionRadius: p.explosionRadius }; }, drone: { damage: 1, fireInterval: 1200, projectileSpeed: 800 },
    magnetRadius: 180, combatMultiplier: 1, hullPreview: build.previewPrototypeHullPlating(), thrusterPreview: build.previewPrototypeThruster() };
}
describe('detached hard reward eligibility', () => {
  it.each(rewardChoices.slice(0, 18))('checks canonical $kind with no mutation/Tag/Analyzer/RNG dependency', choice => {
    const c = context(), before = structuredClone(c), evolution = ['prism', 'cluster', 'twin'].includes(choice.kind);
    expect(isRewardEligible(choice, c)).toBe(!evolution); expect(c).toEqual(before);
    c.build.tags.PRECISION = 100; c.build.effectiveStats.combatAnalyzer = 20;
    expect(isRewardEligible(choice, c)).toBe(!evolution);
  });
  for (const choice of rewardChoices.slice(0, 18).filter(c => 'upgrade' in c)) {
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
    if (field === 'damage') Reflect.set(c.build.effectiveStats, 'reactorPower', Number.MAX_SAFE_INTEGER);
    if (field === 'speed') Reflect.set(c.build.effectiveStats, 'projectileVelocity', Infinity);
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
