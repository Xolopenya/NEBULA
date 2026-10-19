import { describe, expect, it, vi } from 'vitest';
import { PlayerBuild, DEFAULT_BASE_STATS, TAG_IDS, type TagId, type TagPoints,
  type BuildIdentity, type BaseStats, type PercentStatKey } from './PlayerBuild';

const percentKeys = ['hull', 'thrust', 'reactorPower', 'fireControl', 'projectileVelocity',
  'projectileScale', 'engineering', 'shieldSystems', 'impact'] as const;

describe('PlayerBuild', () => {
  it('bootstraps exactly three Combat, one empty Active and six empty Core slots and ten defaults', () => {
    const b = new PlayerBuild(), s = b.snapshot();
    expect(s.slots).toEqual({ combat: ['LASER', 'MISSILE', 'COMBAT_DRONE'], active: null, cores: Array(6).fill(null) });
    expect(s.baseStats).toEqual({ hull: 5, thrust: 300, reactorPower: 1, fireControl: 1, projectileVelocity: 1,
      projectileScale: 1, engineering: 1, shieldSystems: 1, impact: 1, combatAnalyzer: 0 });
    expect(s.effectiveStats).toEqual(s.baseStats); expect(Object.keys(s.baseStats)).toHaveLength(10);
    expect(Object.values(s.runModifiers.percent)).toEqual(Array(9).fill(0));
    expect(s.runModifiers).toMatchObject({ combatAnalyzerLevels: 0, prototypeHullFlat: 0, prototypeThrustFlat: 0 });
    expect('equip' in b).toBe(false); expect('setEffectiveStats' in b).toBe(false);
  });
  it.each(percentKeys)('adds ordinary percentages and penalties for %s independently, leaving base unchanged', key => {
    const b = new PlayerBuild(); b.applyStatPercent(key, 0.1); b.applyStatPercent(key, 0.2); b.applyStatPercent(key, -0.15);
    expect(b.getEffectiveStats()[key]).toBeCloseTo(DEFAULT_BASE_STATS[key] * 1.15, 10);
    expect(b.getRunModifiers().percent[key]).toBeCloseTo(0.15); expect(b.getBaseStats()).toEqual(DEFAULT_BASE_STATS);
    for (const other of percentKeys.filter(k => k !== key)) expect(b.getEffectiveStats()[other]).toBe(DEFAULT_BASE_STATS[other]);
  });
  it('has exact legacy flat arithmetic, applied after base percentages without rounding HP', () => {
    const b = new PlayerBuild();
    for (let n = 1; n <= 1000; n++) {
      b.applyPrototypeHullPlating(); b.applyPrototypeThruster();
      expect(b.getEffectiveStats()).toMatchObject({ hull: 5 + n, thrust: 300 + 30 * n });
    }
    b.applyStatPercent('hull', 0.1); b.applyStatPercent('thrust', 0.1);
    expect(b.getEffectiveStats()).toMatchObject({ hull: 1005.5, thrust: 30330 });
    expect(b.getBaseStats()).toEqual(DEFAULT_BASE_STATS);
  });
  it('treats Analyzer as additive integer levels, with zero no-ops', () => {
    const b = new PlayerBuild(); expect(b.addCombatAnalyzerLevels(0)).toBe(false); expect(b.applyStatPercent('hull', 0)).toBe(false);
    b.addCombatAnalyzerLevels(3); b.addCombatAnalyzerLevels(-2); expect(b.getEffectiveStats().combatAnalyzer).toBe(1);
    expect(b.getRunModifiers().combatAnalyzerLevels).toBe(1);
  });
  it('copies constructor input and deeply detaches all snapshots/reads with no read side effects', () => {
    const base = { ...DEFAULT_BASE_STATS }, b = new PlayerBuild(base); base.hull = 999;
    const before = b.snapshot(), s = b.snapshot();
    s.slots.combat[0] = 'MISSILE'; s.slots.cores.pop(); s.baseStats.hull = 999; s.runModifiers.percent.hull = 999;
    s.runModifiers.prototypeHullFlat = 99; s.effectiveStats.hull = 999;
    b.getSlots().combat.pop(); b.getBaseStats().thrust = 1; b.getRunModifiers().percent.thrust = 1; b.getEffectiveStats().thrust = 1;
    for (let i = 0; i < 10; i++) expect(b.snapshot()).toEqual(before);
    expect(JSON.parse(JSON.stringify(before))).toEqual(before);
  });
  it.each(percentKeys)('rejects an invalid base %s', key => {
    for (const value of [NaN, Infinity, -Infinity, -1, 0, Number.MAX_VALUE, '1', null, undefined]) {
      expect(() => new PlayerBuild({ ...DEFAULT_BASE_STATS, [key]: value } as BaseStats)).toThrow();
    }
  });
  it('rejects malformed bases, missing/extra keys, invalid Analyzer, unsafe values and Fire Control', () => {
    for (const base of [null, [], {}, { ...DEFAULT_BASE_STATS, luck: 1 },
      { ...DEFAULT_BASE_STATS, [Symbol('hidden')]: 1 }, { ...DEFAULT_BASE_STATS, combatAnalyzer: 0.5 },
      { ...DEFAULT_BASE_STATS, combatAnalyzer: -1 }, { ...DEFAULT_BASE_STATS, combatAnalyzer: Number.MAX_SAFE_INTEGER + 1 },
      { ...DEFAULT_BASE_STATS, fireControl: 101 }]) expect(() => new PlayerBuild(base as BaseStats)).toThrow();
    expect(new PlayerBuild({ ...DEFAULT_BASE_STATS, reactorPower: 0.01, hull: 1, thrust: 1, fireControl: 100 }).getEffectiveStats())
      .toMatchObject({ reactorPower: 0.01, hull: 1, thrust: 1, fireControl: 100 });
  });
  it.each(percentKeys)('rejects invalid %s modifiers atomically', key => {
    const b = new PlayerBuild(), before = b.snapshot();
    for (const delta of [NaN, Infinity, -Infinity, -1, -2, Number.MAX_VALUE, Number.MAX_SAFE_INTEGER, '1', null]) {
      expect(() => b.applyStatPercent(key, delta as number)).toThrow(); expect(b.snapshot()).toEqual(before);
    }
  });
  it('rejects keys, resulting minima, excessive Fire Control and integer/overflow errors without partial mutation', () => {
    const b = new PlayerBuild(), before = b.snapshot();
    for (const key of ['combatAnalyzer', 'luck', '__proto__', undefined]) expect(() => b.applyStatPercent(key as PercentStatKey, 1)).toThrow();
    for (const key of percentKeys) expect(() => b.applyStatPercent(key, -0.99999)).toThrow();
    expect(() => b.applyStatPercent('fireControl', 100)).toThrow();
    for (const delta of [0.5, -1, NaN, Infinity, '1', Number.MAX_SAFE_INTEGER + 1]) expect(() => b.addCombatAnalyzerLevels(delta as number)).toThrow();
    expect(b.snapshot()).toEqual(before);
    b.addCombatAnalyzerLevels(Number.MAX_SAFE_INTEGER); const max = b.snapshot();
    expect(() => b.addCombatAnalyzerLevels(1)).toThrow(); expect(b.snapshot()).toEqual(max);
    const huge = new PlayerBuild({ ...DEFAULT_BASE_STATS, hull: Number.MAX_SAFE_INTEGER, thrust: Number.MAX_SAFE_INTEGER });
    const hugeBefore = huge.snapshot();
    expect(() => huge.applyPrototypeHullPlating()).toThrow(); expect(() => huge.applyPrototypeThruster()).toThrow();
    expect(() => huge.applyStatPercent('hull', 1)).toThrow(); expect(huge.snapshot()).toEqual(hugeBefore);
  });
  it('throws on every disposed read/mutation, disposes idempotently and leaves a fresh owner independent', () => {
    const b = new PlayerBuild(); b.applyPrototypeHullPlating(); b.dispose(); b.dispose();
    for (const op of [() => b.getSlots(), () => b.getBaseStats(), () => b.getRunModifiers(), () => b.getEffectiveStats(),
      () => b.snapshot(), () => b.applyStatPercent('hull', 0), () => b.addCombatAnalyzerLevels(0),
      () => b.applyPrototypeHullPlating(), () => b.applyPrototypeThruster()]) expect(op).toThrow('disposed PlayerBuild');
    expect(new PlayerBuild().snapshot().effectiveStats).toEqual(DEFAULT_BASE_STATS);
  });
});

describe('GAME-047 Tags and BuildSnapshot', () => {
  it('defines exactly twelve immutable identities in canonical order and zero own totals', () => {
    expect(TAG_IDS).toEqual(['PRECISION', 'RAPID_FIRE', 'CLOSE_COMBAT', 'PROJECTILES', 'EXPLOSIONS',
      'DRONES', 'TECHNOLOGY', 'SHIELDS', 'CONTROL', 'MOBILITY', 'SUPPORT', 'SURVIVAL']);
    expect(Object.isFrozen(TAG_IDS)).toBe(true);
    const s = new PlayerBuild().snapshot();
    expect(Reflect.ownKeys(s.tags)).toEqual(TAG_IDS);
    expect(Object.values(s.tags)).toEqual(Array(12).fill(0));
    expect(s.identity).toEqual({ dominantTags: [], secondaryTags: [] });
    expect(Object.keys(s)).toEqual(['slots', 'baseStats', 'runModifiers', 'effectiveStats', 'tags', 'identity', 'laser']);
  });
  it.each(TAG_IDS)('accepts %s independently, with zero no-op and additive points', tag => {
    const b = new PlayerBuild(), before = b.snapshot();
    expect(b.addTagPoints(tag, 0)).toBe(false); expect(b.snapshot()).toEqual(before);
    expect(b.addTagPoints(tag, 1)).toBe(true); expect(b.addTagPoints(tag, 2)).toBe(true);
    expect(b.snapshot().tags[tag]).toBe(3);
    expect(b.snapshot().identity).toEqual({ dominantTags: [tag], secondaryTags: [] });
    for (const other of TAG_IDS.filter(t => t !== tag)) expect(b.snapshot().tags[other]).toBe(0);
  });
  it('rejects invalid IDs even for zero without partial mutation', () => {
    const b = new PlayerBuild(); b.addTagPoints('DRONES', 3); const before = b.snapshot();
    for (const tag of ['unknown', 'LASER', 'MISSILE', '__proto__', 'constructor', 'toString', '', null, undefined, 1, Symbol('DRONES')]) {
      for (const amount of [0, 1]) expect(() => b.addTagPoints(tag as TagId, amount)).toThrow(RangeError);
      expect(b.snapshot()).toEqual(before);
    }
  });
  it('rejects invalid amounts and overflowing totals atomically without coercion or clamping', () => {
    const b = new PlayerBuild(); b.addTagPoints('DRONES', 3); const before = b.snapshot();
    for (const amount of [-1, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, '1', null, undefined, true, {}]) {
      expect(() => b.addTagPoints('DRONES', amount as number)).toThrow(RangeError);
      expect(b.snapshot()).toEqual(before);
    }
    expect(b.addTagPoints('SURVIVAL', Number.MAX_SAFE_INTEGER)).toBe(true);
    const max = b.snapshot(); expect(max.tags.SURVIVAL).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => b.addTagPoints('SURVIVAL', 1)).toThrow(RangeError); expect(b.snapshot()).toEqual(max);
  });
  it('derives two distinct positive tiers with canonical ties despite reversed contribution arrival', () => {
    const b = new PlayerBuild();
    b.addTagPoints('TECHNOLOGY', 3); b.addTagPoints('DRONES', 3);
    expect(b.snapshot().identity).toEqual({ dominantTags: ['DRONES', 'TECHNOLOGY'], secondaryTags: [] });
    b.addTagPoints('MOBILITY', 2);
    expect(b.snapshot().identity.secondaryTags).toEqual(['MOBILITY']);
    b.addTagPoints('SURVIVAL', 1); b.addTagPoints('PRECISION', 2);
    expect(b.snapshot().identity).toEqual({ dominantTags: ['DRONES', 'TECHNOLOGY'], secondaryTags: ['PRECISION', 'MOBILITY'] });
    b.addTagPoints('SURVIVAL', 3);
    expect(b.snapshot().identity).toEqual({ dominantTags: ['SURVIVAL'], secondaryTags: ['DRONES', 'TECHNOLOGY'] });
    expect(b.snapshot().tags.PRECISION).toBe(2); expect(b.snapshot().tags.MOBILITY).toBe(2);
    const reversed = new PlayerBuild();
    for (const tag of [...TAG_IDS].reverse()) reversed.addTagPoints(tag, b.snapshot().tags[tag]);
    expect(reversed.snapshot()).toEqual(b.snapshot());
    expect(b.snapshot().identity.dominantTags.some(t => b.snapshot().identity.secondaryTags.includes(t))).toBe(false);
    expect('setIdentity' in b).toBe(false);
  });
  it('keeps stat and identity caches independent, with no recomputation on reads or rejected/no-op adds', () => {
    const b = new PlayerBuild(), before = b.snapshot();
    const resolver = vi.spyOn(b as unknown as { resolve(): BaseStats }, 'resolve');
    const identity = vi.spyOn(b as unknown as { deriveIdentity(tags: TagPoints): BuildIdentity }, 'deriveIdentity');
    b.addTagPoints('PROJECTILES', 3); b.addTagPoints('SURVIVAL', 2);
    expect(resolver).not.toHaveBeenCalled(); expect(identity).toHaveBeenCalledTimes(2);
    const tagged = b.snapshot();
    expect(tagged.baseStats).toEqual(before.baseStats); expect(tagged.runModifiers).toEqual(before.runModifiers);
    expect(tagged.effectiveStats).toEqual(before.effectiveStats);
    b.addTagPoints('PROJECTILES', 0); expect(() => b.addTagPoints('PROJECTILES', -1)).toThrow(RangeError);
    for (let i = 0; i < 5; i++) expect(b.snapshot()).toEqual(tagged);
    expect(identity).toHaveBeenCalledTimes(2); expect(resolver).not.toHaveBeenCalled();
    for (const stat of percentKeys) b.applyStatPercent(stat, 0.1);
    b.applyPrototypeHullPlating(); b.applyPrototypeThruster(); b.addCombatAnalyzerLevels(3);
    expect(resolver).toHaveBeenCalledTimes(12); expect(identity).toHaveBeenCalledTimes(2);
    expect(b.snapshot().tags).toEqual(tagged.tags); expect(b.snapshot().identity).toEqual(tagged.identity);
  });
  it('deeply detaches the full canonical snapshot and retains plain old data after disposal', () => {
    const b = new PlayerBuild(); b.addTagPoints('DRONES', 3); b.addTagPoints('MOBILITY', 2);
    const before = b.snapshot(), copy = b.snapshot();
    copy.tags.DRONES = 99; copy.identity.dominantTags.reverse(); copy.identity.dominantTags.push('SURVIVAL');
    copy.identity.secondaryTags.splice(0); copy.slots.combat.pop(); copy.slots.cores.pop();
    copy.baseStats.hull = 99; copy.runModifiers.percent.thrust = 99;
    copy.runModifiers.combatAnalyzerLevels = 99; copy.effectiveStats.hull = 99;
    expect(b.snapshot()).toEqual(before); expect(JSON.parse(JSON.stringify(before))).toEqual(before);
    expect(before.identity.dominantTags).toEqual(['DRONES']); expect(before.identity.secondaryTags).toEqual(['MOBILITY']);
    b.dispose(); b.dispose();
    for (const op of [() => b.addTagPoints('DRONES', 0), () => b.addTagPoints('DRONES', 1),
      () => b.addTagPoints('unknown' as TagId, NaN), () => b.snapshot(), () => b.getEffectiveStats()]) {
      expect(op).toThrow('Cannot use disposed PlayerBuild');
    }
    expect(JSON.parse(JSON.stringify(before))).toEqual(before);
    const fresh = new PlayerBuild().snapshot(); expect(Object.values(fresh.tags)).toEqual(Array(12).fill(0));
    expect(fresh.identity).toEqual({ dominantTags: [], secondaryTags: [] });
  });
});


describe('GAME-054 narrow Build previews', () => {
  it.each(['HullPlating', 'Thruster'] as const)('%s preview shares actual resolver and stays detached/nonmutating', kind => {
    const build = new PlayerBuild(); build.applyStatPercent('hull', 0.5); build.applyStatPercent('thrust', 0.25);
    build.addTagPoints('SURVIVAL', 3); build.addCombatAnalyzerLevels(2);
    const before = build.snapshot(), preview = kind === 'HullPlating' ? build.previewPrototypeHullPlating() : build.previewPrototypeThruster();
    expect(build.snapshot()).toEqual(before);
    const again = kind === 'HullPlating' ? build.previewPrototypeHullPlating() : build.previewPrototypeThruster();
    expect(again).toEqual(preview); expect(again).not.toBe(preview);
    if (kind === 'HullPlating') build.applyPrototypeHullPlating(); else build.applyPrototypeThruster();
    expect(build.getEffectiveStats()).toEqual(preview); preview.hull = 0; expect(build.getEffectiveStats()).toEqual(again);
    expect(build.snapshot().tags).toEqual(before.tags); expect(build.snapshot().identity).toEqual(before.identity);
    build.dispose(); expect(() => build.previewPrototypeHullPlating()).toThrow('disposed PlayerBuild');
    expect(() => build.previewPrototypeThruster()).toThrow('disposed PlayerBuild');
  });
  it('numeric preview failure preserves full Build and fails the real application identically', () => {
    const build = new PlayerBuild({ ...new PlayerBuild().getBaseStats(), hull: Number.MAX_SAFE_INTEGER, thrust: Number.MAX_SAFE_INTEGER });
    const before = build.snapshot();
    expect(() => build.previewPrototypeHullPlating()).toThrow(RangeError); expect(() => build.applyPrototypeHullPlating()).toThrow(RangeError);
    expect(() => build.previewPrototypeThruster()).toThrow(RangeError); expect(() => build.applyPrototypeThruster()).toThrow(RangeError);
    expect(build.snapshot()).toEqual(before);
  });
});
