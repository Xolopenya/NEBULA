import { describe, expect, it } from 'vitest';
import { PlayerBuild, DEFAULT_BASE_STATS, type BaseStats, type PercentStatKey } from './PlayerBuild';

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
