import { describe, expect, it, vi } from 'vitest';
import { createEnemyDamageSource, validateEnemyDeathRecord, createEnemyDeathRecord,
  type EnemyDamageSource, type EnemyDeathRecord } from './EnemyDeath';
import { createEnemySpawnSnapshot, DEFAULT_ENEMY_SPAWN_CONTEXT, ENEMY_DEFINITIONS } from './EnemyDefinitions';

const sources: EnemyDamageSource[] = [
  { kind: 'LASER', variant: 'BASE', phase: 'DIRECT' }, { kind: 'LASER', variant: 'PRISM', phase: 'DIRECT' },
  { kind: 'MISSILE', variant: 'BASE', phase: 'PRIMARY' }, { kind: 'MISSILE', variant: 'CLUSTER', phase: 'PRIMARY' },
  { kind: 'MISSILE', variant: 'CLUSTER', phase: 'SATELLITE' },
  { kind: 'COMBAT_DRONE', variant: 'BASE', phase: 'DIRECT' }, { kind: 'COMBAT_DRONE', variant: 'TWIN', phase: 'DIRECT' },
];
const input = (): EnemyDeathRecord => ({ archetype: 'chaser', isElite: false, xpValue: 1, x: 0, y: -0.5,
  lastDamagingSource: { ...sources[0] }, killSource: { ...sources[0] } });
const invalidShapes: unknown[] = [null, undefined, 0, 'source', true, [], () => {}, {},
  { kind: 'LASER', variant: 'BASE' }, { kind: 'LASER', phase: 'DIRECT' }, { variant: 'BASE', phase: 'DIRECT' },
  { ...sources[0], extra: 1 }, { ...sources[0], [Symbol('extra')]: 1 },
  Object.defineProperty({ ...sources[0] }, 'extra', { value: 1 }),
  Object.create(sources[0]),
];

describe('EnemyDeath primitive boundary', () => {
  it.each(sources)('copies and freezes legal source $kind/$variant/$phase', value => {
    const mutable = { ...value }, result = createEnemyDamageSource(mutable);
    expect(result).toEqual(value); expect(result).not.toBe(mutable);
    expect(Reflect.ownKeys(result)).toEqual(['kind', 'variant', 'phase']); expect(Object.isFrozen(result)).toBe(true);
    Reflect.set(mutable, 'kind', 'UNKNOWN'); expect(result).toEqual(value);
    expect(Reflect.set(result, 'phase', 'CONTACT')).toBe(false);
  });
  it.each(invalidShapes)('rejects malformed source shape %#', value => {
    expect(() => createEnemyDamageSource(value as EnemyDamageSource)).toThrow(RangeError);
  });
  it.each([
    ['LASER', 'BASE', 'PRIMARY'], ['LASER', 'TWIN', 'DIRECT'], ['LASER', 'PRISM', 'SATELLITE'],
    ['MISSILE', 'BASE', 'SATELLITE'], ['MISSILE', 'CLUSTER', 'DIRECT'], ['MISSILE', 'PRISM', 'PRIMARY'],
    ['COMBAT_DRONE', 'TWIN', 'PRIMARY'], ['COMBAT_DRONE', 'PRISM', 'DIRECT'],
    ['HOSTILE_PROJECTILE', 'BASE', 'DIRECT'], ['ENEMY_CONTACT', 'BASE', 'CONTACT'], ['ACTIVE', 'BASE', 'DIRECT'],
    ['UNKNOWN', 'BASE', 'DIRECT'], ['laser', 'BASE', 'DIRECT'], ['LASER', null, 'DIRECT'], ['LASER', 'BASE', undefined],
  ])('rejects illegal %s/%s/%s', (kind, variant, phase) => {
    expect(() => createEnemyDamageSource({ kind, variant, phase } as EnemyDamageSource)).toThrow(RangeError);
  });
  it('copies primitive fields even when a legal own field is nonenumerable', () => {
    const s = Object.defineProperty({ ...sources[0] }, 'phase', { value: 'DIRECT', enumerable: false });
    expect(createEnemyDamageSource(s)).toEqual(sources[0]);
  });
  it.each(sources)('preflights and creates exact detached record for $kind/$variant/$phase', s => {
    const value = { ...input(), lastDamagingSource: { ...s }, killSource: { ...s } };
    expect(validateEnemyDeathRecord(value)).toBeUndefined(); expect(Object.isFrozen(value)).toBe(false);
    const record = createEnemyDeathRecord(value);
    expect(Reflect.ownKeys(record)).toEqual(['archetype', 'isElite', 'xpValue', 'x', 'y', 'lastDamagingSource', 'killSource']);
    expect(record).toEqual(value); expect(record).not.toBe(value);
    expect(record.lastDamagingSource).not.toBe(value.lastDamagingSource);
    expect(record.killSource).not.toBe(value.killSource); expect(record.killSource).not.toBe(record.lastDamagingSource);
    for (const v of [record, record.lastDamagingSource, record.killSource]) expect(Object.isFrozen(v)).toBe(true);
    value.x = 400; Reflect.set(value.killSource, 'variant', 'UNKNOWN');
    expect(record.x).toBe(0); expect(record.killSource).toEqual(s);
    expect(structuredClone(record)).toEqual(record);
  });
  it.each([['chaser', false, 1], ['shooter', false, 1], ['tank', false, 1], ['tank', true, 5], ['boss', false, 10]] as const)(
    'copies %s elite%s XP%s from its spawn snapshot', (archetype, isElite, xpValue) => {
      const snapshot = createEnemySpawnSnapshot(ENEMY_DEFINITIONS[archetype], { ...DEFAULT_ENEMY_SPAWN_CONTEXT,
        variant: isElite ? 'ELITE_TANK' : 'BASE' });
      const holder = { snapshot, position: { x: -123.75, y: 0 } }, s = input();
      const r = createEnemyDeathRecord({ ...s, archetype: snapshot.archetype, isElite: snapshot.isElite,
        xpValue: snapshot.xpValue, ...holder.position });
      holder.position.x = 999; holder.snapshot = { ...snapshot, xpValue: 999 };
      expect(r).toMatchObject({ archetype, isElite, xpValue, x: -123.75, y: 0 });
    });
  it.each([-Number.MAX_SAFE_INTEGER, -1.25, -0, 0, 0.25, Number.MAX_SAFE_INTEGER])('accepts signed bounded coordinate %s', x => {
    const r = createEnemyDeathRecord({ ...input(), x, y: x }); expect(Object.is(r.x, x)).toBe(true);
  });
  it.each([1, Number.MAX_SAFE_INTEGER])('accepts positive safe integer XP %s', xpValue => {
    expect(createEnemyDeathRecord({ ...input(), xpValue }).xpValue).toBe(xpValue);
  });
  it.each([null, undefined, 0, 'record', [], {}, { ...input(), extra: 1 },
    { ...input(), [Symbol('extra')]: 1 }, Object.defineProperty(input(), 'extra', { value: 1 }),
    ...Object.keys(input()).map(key => { const r = { ...input() }; Reflect.deleteProperty(r, key); return r; }),
  ])('rejects exact outer shape error %# independently during validation and construction', value => {
    expect(() => validateEnemyDeathRecord(value as EnemyDeathRecord)).toThrow(RangeError);
    expect(() => createEnemyDeathRecord(value as EnemyDeathRecord)).toThrow(RangeError);
  });
  it.each(['chaser', 'shooter', 'boss', 'alien', null, undefined])('rejects Elite pairing/identity %s', archetype => {
    expect(() => validateEnemyDeathRecord({ ...input(), archetype, isElite: true } as EnemyDeathRecord)).toThrow(RangeError);
  });
  it.each([1, null, undefined, 'false'])('rejects nonboolean Elite %s', isElite => {
    expect(() => validateEnemyDeathRecord({ ...input(), isElite } as unknown as EnemyDeathRecord)).toThrow(RangeError);
  });
  it.each([0, -0, -1, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, '1', null, undefined])('rejects XP %s', xpValue => {
    expect(() => validateEnemyDeathRecord({ ...input(), xpValue } as EnemyDeathRecord)).toThrow(RangeError);
  });
  it.each([NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, -Number.MAX_SAFE_INTEGER - 1, '0', null, undefined])('rejects coordinate %s', value => {
    for (const axis of ['x', 'y']) expect(() => validateEnemyDeathRecord({ ...input(), [axis]: value })).toThrow(RangeError);
  });
  it.each(invalidShapes)('rejects malformed nested source %# before constructing a record', value => {
    for (const field of ['lastDamagingSource', 'killSource']) {
      const r = { ...input(), [field]: value };
      expect(() => validateEnemyDeathRecord(r)).toThrow(RangeError); expect(() => createEnemyDeathRecord(r)).toThrow(RangeError);
    }
  });
  it.each(sources.slice(1))('rejects mismatched last versus kill source $kind/$variant/$phase', killSource => {
    const r = { ...input(), killSource }; expect(() => validateEnemyDeathRecord(r)).toThrow(RangeError);
    expect(() => createEnemyDeathRecord(r)).toThrow(RangeError); expect(r.lastDamagingSource).toEqual(sources[0]);
  });
  it('constructs deterministic data with no ambient RNG or Phaser dependency', async () => {
    const random = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Unexpected RNG'); });
    try {
      expect(createEnemyDeathRecord(input())).toEqual(createEnemyDeathRecord(input()));
      const module = await import('./EnemyDeath');
      expect(Object.keys(module).sort()).toEqual(['createEnemyDamageSource', 'createEnemyDeathRecord', 'validateEnemyDeathRecord']);
    } finally { random.mockRestore(); }
  });
});
