import { expect, it } from 'vitest';
import { initialMissile, prepareMissileChoice, type MissileBranch } from '../player/missileProgression';
import { copyMissileLaunchPlan, missileLaunchPlan, missileSeparated, missileGeometry, type MissileLaunchPlan } from './missileFlight';

const stats = { reactorPower: 1, fireControl: 1, projectileVelocity: 1, projectileScale: 1, engineering: 1, impact: 1 };
const context = { combatMultiplier: 1, spatialLevel: 0 };
function config(branch?: MissileBranch) {
  const c = { ...initialMissile(), ranks: { warheadPower: 1, propulsion: 1, blastExpansion: 1 } };
  return branch ? prepareMissileChoice(c, { kind: 'missileSpecialization', branch }, 0) : c;
}
it.each([['BASE', undefined, 'STRAIGHT'], ['GUIDANCE', 'guidance', 'HOMING_FUSE'], ['HEAVY', 'heavy', 'STRAIGHT'],
  ['FRAGMENTATION', 'fragmentation', 'STRAIGHT_FRAGMENTING']] as const)('%s creates only its closed immutable behavior', (form, branch, behavior) => {
  const c = config(branch), plan = missileLaunchPlan(c, stats, context), copy = copyMissileLaunchPlan(plan);
  expect(plan.form).toBe(form); expect(plan.behavior).toBe(behavior);
  expect(copy).toEqual(plan); expect(copy).not.toBe(plan); expect(copy.attack).not.toBe(plan.attack);
  for (const value of [plan, plan.attack, plan.attack.snapshot]) expect(Object.isFrozen(value)).toBe(true);
  c.ranks.warheadPower = 2; expect(plan.attack.snapshot.damage).toBe(form === 'BASE' ? 3 : form === 'GUIDANCE' ? 2.7 : form === 'HEAVY' ? 9 : 2.25);
});
it('Cluster is the explicit homing exception with the same six-field Attack and full recipe', () => {
  const c = { ...initialMissile(), ranks: { warheadPower: 2, propulsion: 2, blastExpansion: 2 } };
  const plan = missileLaunchPlan(prepareMissileChoice(c, { kind: 'cluster' }, 1), stats, { ...context, spatialLevel: 1 });
  expect(plan).toEqual({ form: 'CLUSTER', behavior: 'HOMING', attack: { kind: 'MISSILE', variant: 'CLUSTER',
    snapshot: { damage: 4, speed: 600, radius: 8, lifetime: 4000, impact: 400, explosionRadius: 195 } } });
});
it('fragment plan freezes depth-one child values without shared scaling twice', () => {
  const plan = missileLaunchPlan(config('fragmentation'), { ...stats, reactorPower: 2, impact: 2, projectileVelocity: 2, projectileScale: 2 },
    { combatMultiplier: 1.25, spatialLevel: 2 });
  if (plan.behavior !== 'STRAIGHT_FRAGMENTING') throw Error('Expected fragment plan');
  expect(plan.childCount).toBe(4); expect(plan.childAttack.snapshot).toEqual({ damage: 1.40625, speed: 1800, radius: 6, lifetime: 500, impact: 150, explosionRadius: 31.5 });
  expect(Object.isFrozen(plan.childAttack)).toBe(true); expect(Object.isFrozen(plan.childAttack.snapshot)).toBe(true);
  expect(Object.keys(plan.childAttack)).toEqual(['kind','variant','snapshot']);
});
it.each([null, {}, { ...missileLaunchPlan(config(), stats, context), extra: 0 },
  { ...missileLaunchPlan(config(), stats, context), behavior: 'HOMING' },
  { ...missileLaunchPlan(config('guidance'), stats, context), fuseDistance: Infinity },
  { ...missileLaunchPlan(config('fragmentation'), stats, context), childCount: 512 },
  { ...missileLaunchPlan(config('fragmentation'), stats, context), childAttack: { kind: 'LASER' } }])('rejects malformed flight plan %#', input => {
    expect(() => copyMissileLaunchPlan(input as MissileLaunchPlan)).toThrow(RangeError);
  });
it('preflights maximum authored enemy Impact response before publishing any plan', () => {
  expect(() => missileLaunchPlan(config('heavy'), { ...stats, impact: Number.MAX_SAFE_INTEGER / 1000 }, context)).toThrow(RangeError);
});
it.each([[0,0,false], [13,0,false], [13.000001,0,true], [0,13,false], [3,4,false], [-14,0,true]] as const)(
  'grace uses exact squared sum-of-radii at (%s,%s)', (x,y,separated) => expect(missileSeparated(x,y,3,0,0,10)).toBe(separated));
it('accepts huge finite bodies without an arena-derived cap and rejects nonfinite geometry', () => {
  expect(missileSeparated(0,0,Number.MAX_SAFE_INTEGER,100,100,24)).toBe(false);
  for (const value of [NaN,Infinity,-Infinity]) expect(() => missileGeometry(value)).toThrow(RangeError);
});
