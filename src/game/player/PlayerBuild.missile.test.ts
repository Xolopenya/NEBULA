import { expect, it } from 'vitest';
import { PlayerBuild } from './PlayerBuild';
import { MISSILE_BRANCHES, MISSILE_DEVELOPMENTS, type MissileBranch, type MissileChoice } from './missileProgression';

const context = { combatMultiplier: 1, spatialLevel: 0 };
function ready(b = new PlayerBuild()) {
  for (const upgrade of ['warheadPower', 'propulsion', 'blastExpansion'] as const) b.applyMissileChoice({ kind: 'missile', upgrade }, context);
  return b;
}
it('adds exactly one detached missile snapshot without changing slots, Laser, stats or fresh Build isolation', () => {
  const b = new PlayerBuild(), fresh = new PlayerBuild(), before = b.snapshot();
  expect(Object.keys(before)).toEqual(['slots', 'baseStats', 'runModifiers', 'effectiveStats', 'tags', 'identity', 'laser', 'missile']);
  expect(before.missile).toEqual({ ranks: { warheadPower: 0, propulsion: 0, blastExpansion: 0 }, form: 'BASE', upgrades: [], capstone: false });
  before.missile.ranks.warheadPower = 2; before.missile.upgrades.push('missile.heavy.payload');
  const copy = b.getMissileConfiguration(); copy.ranks.propulsion = 2;
  expect(b.snapshot()).toEqual(fresh.snapshot());
  ready(b); expect(fresh.getMissileConfiguration().ranks.warheadPower).toBe(0);
  expect(b.snapshot().laser).toEqual(fresh.snapshot().laser); expect(b.getSlots()).toEqual(fresh.getSlots());
  expect(b.getEffectiveStats()).toEqual(fresh.getEffectiveStats());
});
it.each([
  ['guidance', ['PRECISION', 'PROJECTILES', 'EXPLOSIONS', 'TECHNOLOGY']],
  ['heavy', ['PROJECTILES', 'EXPLOSIONS', 'CONTROL']], ['fragmentation', ['PROJECTILES', 'EXPLOSIONS']],
] as const)('%s preview is detached and its acquisition commits exact Tags once', (branch, expectedTags) => {
  const b = ready(), before = b.snapshot(), choice = { kind: 'missileSpecialization' as const, branch };
  const preview = b.previewMissileChoice(choice, context); expect(b.snapshot()).toEqual(before);
  preview.missile.ranks.warheadPower = 2; preview.tags.SURVIVAL = 10; preview.identity.dominantTags.length = 0;
  b.applyMissileChoice(choice, context);
  const after = b.snapshot(); expect(after.missile.ranks).toEqual(before.missile.ranks);
  expect(Object.entries(after.tags).filter(([, n]) => n > 0)).toEqual(expectedTags.map(t => [t, 1]));
  expect(after.identity).toEqual({ dominantTags: [...expectedTags], secondaryTags: [] });
  expect(after.effectiveStats).toEqual(before.effectiveStats); expect(after.runModifiers).toEqual(before.runModifiers);
  expect(() => b.applyMissileChoice(choice, context)).toThrow(RangeError); expect(b.snapshot()).toEqual(after);
});
it.each(MISSILE_BRANCHES)('%s developments/Capstone apply once with no additional Tags', branch => {
  const b = ready(); b.applyMissileChoice({ kind: 'missileSpecialization', branch }, context);
  const tags = b.snapshot().tags;
  for (const upgrade of [...MISSILE_DEVELOPMENTS[branch]].reverse()) {
    const choice = { kind: 'missileDevelopment', branch, upgrade } as MissileChoice;
    b.applyMissileChoice(choice, context); const before = b.snapshot();
    expect(() => b.applyMissileChoice(choice, context)).toThrow(RangeError); expect(b.snapshot()).toEqual(before);
  }
  expect(b.getMissileConfiguration().upgrades).toEqual(MISSILE_DEVELOPMENTS[branch].map(u => `missile.${branch}.${u}`));
  b.applyMissileChoice({ kind: 'missileCapstone', branch }, context); const before = b.snapshot();
  expect(before.tags).toEqual(tags); expect(before.missile.capstone).toBe(true);
  expect(() => b.applyMissileChoice({ kind: 'missileCapstone', branch }, context)).toThrow(RangeError);
  expect(b.snapshot()).toEqual(before);
});
it('Cluster keeps the original recipe, adds zero Tags and excludes branches', () => {
  const b = ready(); for (const upgrade of ['warheadPower', 'propulsion', 'blastExpansion'] as const) b.applyMissileChoice({ kind: 'missile', upgrade }, context);
  const before = b.snapshot(); expect(() => b.applyMissileChoice({ kind: 'cluster' }, context)).toThrow(RangeError);
  expect(b.snapshot()).toEqual(before); b.applyMissileChoice({ kind: 'cluster' }, { ...context, spatialLevel: 1 });
  expect(b.getMissileConfiguration().form).toBe('CLUSTER'); expect(b.snapshot().tags).toEqual(before.tags);
  expect(() => b.applyMissileChoice({ kind: 'missileSpecialization', branch: 'heavy' }, context)).toThrow(RangeError);
});
it('rejects premature, foreign, malformed and numerically infeasible candidates atomically', () => {
  const b = ready(), before = b.snapshot();
  const reject = (choice: MissileChoice, input = context) => {
    expect(() => b.previewMissileChoice(choice, input)).toThrow(RangeError);
    expect(() => b.applyMissileChoice(choice, input)).toThrow(RangeError); expect(b.snapshot()).toEqual(before);
  };
  reject({ kind: 'missileCapstone', branch: 'guidance' });
  reject({ kind: 'missileDevelopment', branch: 'heavy', upgrade: 'payload' });
  reject({ kind: 'missile', upgrade: 'no' } as unknown as MissileChoice);
  reject({ kind: 'missileSpecialization', branch: 'heavy' }, { ...context, combatMultiplier: Number.MAX_SAFE_INTEGER });
  reject({ kind: 'missileSpecialization', branch: 'guidance' }, { ...context, spatialLevel: Number.MAX_SAFE_INTEGER });
});
it('rejects Tag overflow before changing any Missile, identity or cache', () => {
  const b = ready(); b.addTagPoints('EXPLOSIONS', Number.MAX_SAFE_INTEGER); const before = b.snapshot();
  expect(() => b.applyMissileChoice({ kind: 'missileSpecialization', branch: 'heavy' }, context)).toThrow(RangeError);
  expect(b.snapshot()).toEqual(before);
});
it('preserves an existing Laser specialization and adds Missile Tags to its existing totals', () => {
  const b = ready();
  b.applyLaserChoice({ kind: 'laser', upgrade: 'power' }, 0);
  b.applyLaserChoice({ kind: 'laser', upgrade: 'power' }, 0);
  b.applyLaserChoice({ kind: 'laser', upgrade: 'fireRate' }, 0);
  b.applyLaserChoice({ kind: 'laserSpecialization', branch: 'scatter' }, 0);
  const before = b.snapshot();
  b.applyMissileChoice({ kind: 'missileSpecialization', branch: 'heavy' }, context);
  expect(b.snapshot().laser).toEqual(before.laser); expect(b.getEffectiveStats()).toEqual(before.effectiveStats);
  expect(b.snapshot().tags).toEqual({ ...before.tags, PROJECTILES: 2, CONTROL: 2, EXPLOSIONS: 1 });
  expect(b.snapshot().identity).toEqual({ dominantTags: ['PROJECTILES', 'CONTROL'], secondaryTags: ['CLOSE_COMBAT', 'EXPLOSIONS'] });
});
it('uses captured Build stats and explicit external context without changing shared-stat mutation semantics', () => {
  const b = ready(); b.applyStatPercent('reactorPower', 1); b.applyStatPercent('engineering', 3);
  const p = b.previewMissileChoice({ kind: 'missileSpecialization', branch: 'guidance' }, { combatMultiplier: 1.25, spatialLevel: 20 });
  expect(p.composed.parent.damage).toBe(6.75); expect(p.composed.fuseDistance).toBe(128);
  b.applyMissileChoice({ kind: 'missileSpecialization', branch: 'guidance' }, context);
  expect(b.applyStatPercent('projectileVelocity', 0.5)).toBe(true); expect(b.getEffectiveStats().projectileVelocity).toBe(1.5);
  expect(p.composed.parent.speed).toBe(630); expect(b.snapshot().laser.form).toBe('BASE');
});
it('disposal invalidates all new methods and fresh instances have independent BASE configs', () => {
  const b = ready(), saved = b.getMissileConfiguration(); b.dispose();
  expect(() => b.getMissileConfiguration()).toThrow();
  for (const method of ['previewMissileChoice', 'applyMissileChoice'] as const) {
    expect(() => b[method]({ kind: 'missileSpecialization', branch: 'guidance' as MissileBranch }, context)).toThrow();
  }
  expect(saved.ranks.warheadPower).toBe(1); expect(new PlayerBuild().getMissileConfiguration().form).toBe('BASE');
});
