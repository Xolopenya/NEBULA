import { describe, expect, it } from 'vitest';
import { initialMissile, validateMissile, missileReady, prepareMissileChoice, missileProfile, composeMissileProfile,
  MISSILE_BRANCHES, MISSILE_DEVELOPMENTS, type MissileBranch, type MissileChoice, type MissileConfiguration,
  type MissileShipStats } from './missileProgression';

const stats: MissileShipStats = { reactorPower: 1, fireControl: 1, projectileVelocity: 1, projectileScale: 1, engineering: 1, impact: 1 };
const context = { combatMultiplier: 1, spatialLevel: 0 };
function ready(): MissileConfiguration { return { ...initialMissile(), ranks: { warheadPower: 1, propulsion: 1, blastExpansion: 1 } }; }
function acquire(branch: MissileBranch) { return prepareMissileChoice(ready(), { kind: 'missileSpecialization', branch }, 0); }
function develop(branch: MissileBranch): MissileConfiguration {
  let c = acquire(branch);
  for (const upgrade of [...MISSILE_DEVELOPMENTS[branch]].reverse()) {
    c = prepareMissileChoice(c, { kind: 'missileDevelopment', branch, upgrade } as MissileChoice, 0);
  }
  return c;
}

describe('Missile progression foundation', () => {
  it('creates independent exact BASE state and derives the implemented local defaults', () => {
    const c = initialMissile(); expect(c).toEqual({ ranks: { warheadPower: 0, propulsion: 0, blastExpansion: 0 }, form: 'BASE', upgrades: [], capstone: false });
    expect(missileProfile(c)).toEqual({ damage: 2, projectileSpeed: 450, explosionRadius: 120, fireInterval: 1800,
      radius: 8, lifetime: 4000, impact: 400, fuseBasePx: 0, detonateOnExpiry: false, fragmentCount: 0, fragmentLifetime: 500 });
    expect(Object.isFrozen(missileProfile(c))).toBe(true);
    c.ranks.warheadPower = 1; c.upgrades.push('missile.heavy.payload'); expect(initialMissile().ranks.warheadPower).toBe(0);
    expect(initialMissile().upgrades).toEqual([]);
  });
  it.each(['warheadPower', 'propulsion', 'blastExpansion'] as const)('preserves both %s tuning increments, caps and nonmutation', upgrade => {
    const original = initialMissile(), one = prepareMissileChoice(original, { kind: 'missile', upgrade }, 0);
    const two = prepareMissileChoice(one, { kind: 'missile', upgrade }, 0);
    const field = upgrade === 'warheadPower' ? 'damage' : upgrade === 'propulsion' ? 'projectileSpeed' : 'explosionRadius';
    expect(missileProfile(one)[field]).toBe(upgrade === 'warheadPower' ? 3 : upgrade === 'propulsion' ? 525 : 150);
    expect(missileProfile(two)[field]).toBe(upgrade === 'warheadPower' ? 4 : upgrade === 'propulsion' ? 600 : 180);
    expect(() => prepareMissileChoice(two, { kind: 'missile', upgrade }, 0)).toThrow(RangeError);
    expect(original).toEqual(initialMissile()); expect(one.ranks[upgrade]).toBe(1);
  });
  it('requires three local investments, independently of Spatial, and retains them on acquisition', () => {
    const c = ready(); c.ranks.blastExpansion = 0; expect(missileReady(c)).toBe(false);
    expect(() => prepareMissileChoice(c, { kind: 'missileSpecialization', branch: 'guidance' }, 10)).toThrow(RangeError);
    c.ranks.blastExpansion = 1; expect(missileReady(c)).toBe(true);
    expect(acquire('guidance').ranks).toEqual(c.ranks); expect(missileReady(acquire('guidance'))).toBe(false);
  });
  it('requires exact Cluster mastery and Spatial, with exclusive BASE entry', () => {
    const c: MissileConfiguration = { ...initialMissile(), ranks: { warheadPower: 2, propulsion: 2, blastExpansion: 2 } };
    expect(() => prepareMissileChoice(c, { kind: 'cluster' }, 0)).toThrow(RangeError);
    for (const key of ['warheadPower', 'propulsion', 'blastExpansion'] as const) {
      expect(() => prepareMissileChoice({ ...c, ranks: { ...c.ranks, [key]: 1 } }, { kind: 'cluster' }, 1)).toThrow(RangeError);
    }
    const cluster = prepareMissileChoice(c, { kind: 'cluster' }, 1); expect(cluster.form).toBe('CLUSTER');
    expect(missileProfile(cluster)).toEqual(missileProfile(c));
    expect(() => prepareMissileChoice(cluster, { kind: 'cluster' }, 1)).toThrow(RangeError);
    for (const branch of MISSILE_BRANCHES) {
      expect(() => prepareMissileChoice(cluster, { kind: 'missileSpecialization', branch }, 1)).toThrow(RangeError);
      expect(() => prepareMissileChoice(acquire(branch), { kind: 'cluster' }, 1)).toThrow(RangeError);
    }
  });
  it.each([
    ['guidance', { damage: 2.7, fireInterval: 1530, projectileSpeed: 630, lifetime: 5000, impact: 300, fuseBasePx: 64 }],
    ['heavy', { damage: 9, fireInterval: 2700, projectileSpeed: 393.75, explosionRadius: 225, radius: 12, impact: 800 }],
    ['fragmentation', { damage: 2.25, fireInterval: 2160, explosionRadius: 127.5, impact: 300, fragmentCount: 4 }],
  ] as const)('derives the exact approved initial %s profile and one-time form', (branch, changes) => {
    const c = acquire(branch);
    expect(missileProfile(c)).toEqual({ ...missileProfile(ready()), ...changes });
    for (const next of MISSILE_BRANCHES) expect(() => prepareMissileChoice(c, { kind: 'missileSpecialization', branch: next }, 0)).toThrow(RangeError);
    expect(() => prepareMissileChoice(c, { kind: 'missileCapstone', branch }, 0)).toThrow(RangeError);
    expect(prepareMissileChoice(c, { kind: 'missile', upgrade: 'warheadPower' }, 0).ranks.warheadPower).toBe(2);
  });
  it.each([
    ['guidance', 'payload', { damage: 3 * 1.1 }], ['guidance', 'propulsion', { projectileSpeed: 787.5 }],
    ['guidance', 'fuse', { fuseBasePx: 80 }], ['guidance', 'endurance', { lifetime: 6000 }],
    ['heavy', 'payload', { damage: 10.5 }], ['heavy', 'propulsion', { projectileSpeed: 472.5 }],
    ['heavy', 'blast', { explosionRadius: 270 }], ['heavy', 'reload', { fireInterval: 2250 }],
    ['fragmentation', 'payload', { damage: 3 }], ['fragmentation', 'reload', { fireInterval: 1800 }],
    ['fragmentation', 'fragments', { fragmentCount: 6 }], ['fragmentation', 'endurance', { fragmentLifetime: 700 }],
  ] as const)('%s.%s changes only its approved profile fields and applies once', (branch, upgrade, changes) => {
    const choice = { kind: 'missileDevelopment', branch, upgrade } as MissileChoice, c = acquire(branch);
    const next = prepareMissileChoice(c, choice, 0);
    expect(missileProfile(next)).toEqual({ ...missileProfile(c), ...changes });
    expect(() => prepareMissileChoice(next, choice, 0)).toThrow(RangeError);
    expect(() => prepareMissileChoice(ready(), choice, 0)).toThrow(RangeError);
    expect(() => prepareMissileChoice(acquire(branch === 'guidance' ? 'heavy' : 'guidance'), choice, 0)).toThrow(RangeError);
  });
  it.each(MISSILE_BRANCHES)('%s develops in any order, sorts canonically and gates its exact Capstone', branch => {
    const c = develop(branch); expect(c.upgrades).toEqual(MISSILE_DEVELOPMENTS[branch].map(u => `missile.${branch}.${u}`));
    const next = prepareMissileChoice(c, { kind: 'missileCapstone', branch }, 0);
    expect(missileProfile(next)).toEqual({ ...missileProfile(c), ...(branch === 'guidance' ? { detonateOnExpiry: true }
      : branch === 'heavy' ? { damage: 12, radius: 16, impact: 1200 } : { fragmentCount: 8 }) });
    expect(() => prepareMissileChoice(next, { kind: 'missileCapstone', branch }, 0)).toThrow(RangeError);
    const partial = { ...c, upgrades: c.upgrades.slice(0, 3) };
    expect(() => prepareMissileChoice(partial, { kind: 'missileCapstone', branch }, 0)).toThrow(RangeError);
  });
  it('composes shared values once in the approved order with Spatial after local blast scaling', () => {
    const s = { reactorPower: 2, fireControl: 2, projectileVelocity: 3, projectileScale: 4, engineering: 9, impact: 5 };
    const input = { combatMultiplier: 1.25, spatialLevel: 2 };
    expect(composeMissileProfile(ready(), s, input)).toEqual({ parent: { damage: 7.5, speed: 1575, radius: 32,
      explosionRadius: 180, lifetime: 4000, impact: 2000 }, fireInterval: 900, fuseDistance: 0, detonateOnExpiry: false, fragments: null });
    expect(composeMissileProfile(acquire('heavy'), s, input).parent.explosionRadius).toBe(255);
    const f = composeMissileProfile(acquire('fragmentation'), s, input);
    expect(f).toEqual({ parent: { damage: 5.625, speed: 1575, radius: 32, explosionRadius: 157.5, lifetime: 4000, impact: 1500 },
      fireInterval: 1080, fuseDistance: 0, detonateOnExpiry: false,
      fragments: { count: 4, values: { damage: 1.40625, speed: 2700, radius: 12, explosionRadius: 31.5, lifetime: 500, impact: 375 } } });
    for (const obj of [f, f.parent, f.fragments, f.fragments!.values]) expect(Object.isFrozen(obj)).toBe(true);
    s.reactorPower = 10; input.spatialLevel = 5; expect(f.parent.damage).toBe(5.625);
  });
  it('Engineering changes only Guidance fuse, with both square-root scaling and final-blast bound', () => {
    const c = acquire('guidance'), one = composeMissileProfile(c, stats, context);
    const four = composeMissileProfile(c, { ...stats, engineering: 4 }, context);
    expect(one.fuseDistance).toBe(64); expect(four.fuseDistance).toBe(112.5); expect(four.parent).toEqual(one.parent);
    expect(composeMissileProfile(c, { ...stats, engineering: 4 }, { ...context, spatialLevel: 20 }).fuseDistance).toBe(128);
    const upgraded = prepareMissileChoice(c, { kind: 'missileDevelopment', branch: 'guidance', upgrade: 'fuse' }, 0);
    expect(composeMissileProfile(upgraded, stats, context).fuseDistance).toBe(80);
    expect(composeMissileProfile(acquire('heavy'), { ...stats, engineering: 4 }, context)).toEqual(composeMissileProfile(acquire('heavy'), stats, context));
  });
  it.each([
    null, {}, [], { ...initialMissile(), extra: 1 }, { ...initialMissile(), form: 'UNKNOWN' },
    { ...initialMissile(), ranks: { warheadPower: 3, propulsion: 0, blastExpansion: 0 } },
    { ...initialMissile(), ranks: { warheadPower: NaN, propulsion: 0, blastExpansion: 0 } },
    { ...initialMissile(), ranks: { warheadPower: 0.5, propulsion: 0, blastExpansion: 0 } },
    { ...initialMissile(), capstone: true }, { ...initialMissile(), upgrades: ['missile.heavy.payload'] },
    { ...acquire('heavy'), upgrades: ['missile.heavy.payload', 'missile.heavy.payload'] },
    { ...acquire('heavy'), upgrades: ['missile.guidance.payload'] }, { ...ready(), form: 'CLUSTER' },
    { ...initialMissile(), form: 'GUIDANCE' }, { ...acquire('guidance'), upgrades: new Array(1) },
  ])('rejects malformed or impossible configuration %#', input => {
    expect(() => validateMissile(input as MissileConfiguration)).toThrow(RangeError);
  });
  it('rejects hidden/symbol/accessor fields and malformed development arrays', () => {
    for (const key of ['extra', Symbol('extra')]) {
      const c = initialMissile(); Object.defineProperty(c, key, { value: 1 }); expect(() => validateMissile(c)).toThrow(RangeError);
    }
    const c = initialMissile(); Object.defineProperty(c, 'form', { get: () => 'BASE', enumerable: true });
    expect(() => validateMissile(c)).toThrow(RangeError);
    const a = acquire('guidance'); Object.defineProperty(a.upgrades, 'extra', { value: 1 }); expect(() => validateMissile(a)).toThrow(RangeError);
  });
  it.each([{ kind: 'unknown' }, { kind: 'missile', upgrade: 'no' }, { kind: 'cluster', extra: 0 },
    { kind: 'missileDevelopment', branch: 'guidance', upgrade: 'reload' }, { kind: 'missileCapstone', branch: 'no' }])('rejects unknown choice %#', choice => {
    expect(() => prepareMissileChoice(ready(), choice as MissileChoice, 1)).toThrow(RangeError);
  });
  it.each(['reactorPower', 'fireControl', 'projectileVelocity', 'projectileScale', 'engineering', 'impact'] as const)('validates numeric stat %s', key => {
    for (const value of [NaN, Infinity, -Infinity, -1, Number.MAX_VALUE]) {
      expect(() => composeMissileProfile(ready(), { ...stats, [key]: value }, context)).toThrow(RangeError);
    }
    if (key !== 'impact') expect(() => composeMissileProfile(ready(), { ...stats, [key]: 0 }, context)).toThrow(RangeError);
  });
  it('rejects unsafe arithmetic, underflow, invalid context/extra keys and preserves valid zero Impact', () => {
    for (const spatialLevel of [-1, 0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
      expect(() => composeMissileProfile(ready(), stats, { ...context, spatialLevel })).toThrow(RangeError);
      expect(() => prepareMissileChoice(ready(), { kind: 'missileSpecialization', branch: 'guidance' }, spatialLevel)).toThrow(RangeError);
    }
    for (const combatMultiplier of [0, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
      expect(() => composeMissileProfile(ready(), stats, { ...context, combatMultiplier })).toThrow(RangeError);
    }
    expect(() => composeMissileProfile(ready(), { ...stats, fireControl: 101 }, context)).toThrow(RangeError);
    expect(() => composeMissileProfile(ready(), stats, { ...context, extra: 1 } as typeof context)).toThrow(RangeError);
    expect(() => composeMissileProfile(ready(), { ...stats, extra: 1 } as MissileShipStats, context)).toThrow(RangeError);
    expect(() => composeMissileProfile(acquire('fragmentation'), stats, { ...context, combatMultiplier: Number.MIN_VALUE })).toThrow(RangeError);
    // The smallest positive Ship Impact remains representable after local300 and child1/4.
    const tiny = composeMissileProfile(acquire('fragmentation'), { ...stats, impact: Number.MIN_VALUE }, context);
    expect(tiny.fragments!.values.impact).toBe((300 * Number.MIN_VALUE) * 0.25);
    expect(tiny.fragments!.values.impact).toBeGreaterThan(0);
    const zero = composeMissileProfile(acquire('fragmentation'), { ...stats, impact: 0 }, context);
    expect(zero.parent.impact).toBe(0); expect(zero.fragments!.values.impact).toBe(0);
  });
});
