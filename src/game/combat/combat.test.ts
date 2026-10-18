import { describe, expect, it } from 'vitest';
import { createAttack, composePlayerDamage, composePlayerImpact, calculateHitDamage, calculateEnemyDamage,
  type Attack, type HitPhase } from './combat';

const flight = { damage: 2.5, speed: 600, radius: 6, lifetime: 2000 };
const playerFlight = { ...flight, impact: 200 };
const inputs: Attack[] = [
  { kind: 'LASER', variant: 'BASE', snapshot: playerFlight }, { kind: 'LASER', variant: 'PRISM', snapshot: playerFlight },
  { kind: 'MISSILE', variant: 'BASE', snapshot: { ...playerFlight, explosionRadius: 100 } },
  { kind: 'MISSILE', variant: 'CLUSTER', snapshot: { ...playerFlight, explosionRadius: 100 } },
  { kind: 'COMBAT_DRONE', variant: 'BASE', snapshot: playerFlight }, { kind: 'COMBAT_DRONE', variant: 'TWIN', snapshot: playerFlight },
  { kind: 'HOSTILE_PROJECTILE', snapshot: flight }, { kind: 'ENEMY_CONTACT', snapshot: { damage: 0.5 } },
];
const invalid = [0, -1, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, '2', null, undefined];
describe('immutable concrete attacks', () => {
  it.each(inputs)('copies and freezes $kind/$variant with exact primitive fields', input => {
    const mutable = structuredClone(input), attack = createAttack(mutable);
    expect(attack).toEqual(input); expect(attack).not.toBe(mutable); expect(attack.snapshot).not.toBe(mutable.snapshot);
    expect(Object.isFrozen(attack)).toBe(true); expect(Object.isFrozen(attack.snapshot)).toBe(true);
    (mutable.snapshot as { damage: number }).damage = 99; expect(attack.snapshot.damage).toBe(input.snapshot.damage);
    expect(() => { (attack.snapshot as { damage: number }).damage = 99; }).toThrow(TypeError);
  });
  it.each(inputs)('rejects malformed snapshot shapes for $kind/$variant atomically', input => {
    for (const snapshot of [null, undefined, {}, { ...input.snapshot, extra: 1 },
      Object.fromEntries(Object.entries(input.snapshot).filter(([key]) => key !== 'damage'))]) {
      expect(() => createAttack({ ...input, snapshot } as Attack)).toThrow(RangeError);
    }
    expect(createAttack(input)).toEqual(input);
  });
  it.each(invalid)('rejects invalid value %s in every snapshot field', value => {
    for (const input of inputs) for (const field of Object.keys(input.snapshot)) {
      if (field === 'impact' && value === 0) continue; // Explicit no-force is the approved player-only exception.
      expect(() => createAttack({ ...input, snapshot: { ...input.snapshot, [field]: value } } as Attack)).toThrow(RangeError);
    }
  });
  it.each([null, undefined, 1, {}, { kind: 'UNKNOWN', snapshot: flight },
    { ...inputs[0], variant: 'TWIN' }, { ...inputs[2], variant: 'PRISM' },
    { ...inputs[4], variant: 'CLUSTER' }, { ...inputs[0], variant: undefined }])('rejects invalid source %j', input => {
    expect(() => createAttack(input as Attack)).toThrow(RangeError);
  });
  it('accepts positive fractions and safe endpoints, validates half-damage before Cluster creation', () => {
    const snapshot = { damage: Number.MIN_VALUE, speed: Number.MAX_SAFE_INTEGER, radius: 0.25, lifetime: 0.5, explosionRadius: 1, impact: 400 };
    expect(createAttack({ kind: 'MISSILE', variant: 'BASE', snapshot }).snapshot.damage).toBe(Number.MIN_VALUE);
    expect(() => createAttack({ kind: 'MISSILE', variant: 'CLUSTER', snapshot })).toThrow(RangeError);
  });
});
describe('authored damage composition', () => {
  it.each(['LASER', 'MISSILE', 'COMBAT_DRONE'] as const)('%s uses C once and Engineering only for Drone', kind => {
    expect(composePlayerDamage(kind, 2.5, 1.25, 3, 4)).toBe(kind === 'COMBAT_DRONE' ? 37.5 : 9.375);
    expect(composePlayerDamage(kind, 2.5, 1.25, 3, 8)).toBe(kind === 'COMBAT_DRONE' ? 75 : 9.375);
  });
  it.each(invalid)('rejects malformed operands %s even unused Engineering', value => {
    for (let i = 0; i < 4; i++) {
      const values = [1, 1, 1, 1]; values[i] = value as number;
      expect(() => composePlayerDamage('LASER', values[0], values[1], values[2], values[3])).toThrow(RangeError);
    }
  });
  it('preserves left-to-right order without an intermediate safe cap', () => {
    const n = Number.MAX_SAFE_INTEGER;
    expect(composePlayerDamage('LASER', n, 2, 0.25, 1)).toBe((n * 2) * 0.25);
    expect(composePlayerDamage('COMBAT_DRONE', n, 2, 1, 0.25)).toBe(((n * 2) * 1) * 0.25);
    expect(() => composePlayerDamage('LASER', Number.MIN_VALUE, 0.5, 2, 1)).toThrow(RangeError);
  });
  it('rejects final overflow, underflow and unknown systems', () => {
    expect(() => composePlayerDamage('MISSILE', Number.MAX_SAFE_INTEGER, 2, 1, 1)).toThrow(RangeError);
    expect(() => composePlayerDamage('COMBAT_DRONE', Number.MIN_VALUE, 0.5, 1, 1)).toThrow(RangeError);
    expect(() => composePlayerDamage('OTHER' as 'LASER', 1, 1, 1, 1)).toThrow(RangeError);
  });
});
describe('concrete hit phases', () => {
  it.each(inputs)('$kind/$variant accepts only its authored phases', input => {
    const attack = createAttack(input);
    for (const phase of ['DIRECT', 'PRIMARY', 'SATELLITE', 'CONTACT', 'UNKNOWN'] as HitPhase[]) {
      const legal = phase === 'CONTACT' ? attack.kind === 'ENEMY_CONTACT'
        : phase === 'PRIMARY' ? attack.kind === 'MISSILE'
          : phase === 'SATELLITE' ? attack.kind === 'MISSILE' && attack.variant === 'CLUSTER'
            : phase === 'DIRECT' && ['LASER', 'COMBAT_DRONE', 'HOSTILE_PROJECTILE'].includes(attack.kind);
      if (legal) expect(calculateHitDamage(attack, phase)).toBe(attack.snapshot.damage * (phase === 'SATELLITE' ? 0.5 : 1));
      else expect(() => calculateHitDamage(attack, phase)).toThrow(RangeError);
    }
  });
});
describe('enemy arithmetic without death side effects', () => {
  it.each([[5, 1.25, 3.75, 1.25, false], [3, 3, 0, 3, true], [3, 10, -7, 3, true],
    [Number.MAX_SAFE_INTEGER, Number.MIN_VALUE, Number.MAX_SAFE_INTEGER, 0, false]])(
    'H%s D%s preserves calculated versus actual loss', (health, damage, after, lost, depleted) => {
      expect(calculateEnemyDamage(health as number, damage as number)).toEqual({ target: 'ENEMY', calculatedDamage: damage,
        healthAfter: after, hpLost: lost, healthDepleted: depleted });
    });
  it('does not transfer overkill to another target', () => {
    expect(calculateEnemyDamage(3, 10).hpLost).toBe(3); expect(calculateEnemyDamage(20, 10).healthAfter).toBe(10);
  });
  it.each(invalid)('rejects invalid current health or damage %s', value => {
    expect(() => calculateEnemyDamage(value as number, 1)).toThrow(RangeError);
    expect(() => calculateEnemyDamage(1, value as number)).toThrow(RangeError);
  });
});

describe('player-only immutable Impact', () => {
  it.each(inputs.slice(0, 6))('$kind/$variant requires and copies player impact, including explicit zero', input => {
    const original = structuredClone(input), attack = createAttack(original);
    Reflect.set(original.snapshot, 'impact', 999);
    expect(Reflect.get(attack.snapshot, 'impact')).toBe(200);
    expect(Object.keys(attack.snapshot)).toContain('impact');
    expect(Reflect.get(createAttack({ ...input, snapshot: { ...input.snapshot, impact: 0 } } as Attack).snapshot, 'impact')).toBe(0);
    const missing = structuredClone(input); Reflect.deleteProperty(missing.snapshot, 'impact');
    expect(() => createAttack(missing)).toThrow(RangeError);
  });
  it.each(inputs.slice(6))('$kind rejects player physical fields', input => {
    expect(() => createAttack({ ...input, snapshot: { ...input.snapshot, impact: 0 } } as Attack)).toThrow(RangeError);
  });
  it.each([200, 160, 400])('resolves authored %s * Ship Impact once at launch', local => {
    expect(composePlayerImpact(local, 1)).toBe(local); expect(composePlayerImpact(local, 2)).toBe(local * 2);
    expect(composePlayerImpact(local, 0)).toBe(0); expect(composePlayerImpact(0, 2)).toBe(0);
  });
  it('rejects overflow and nonzero underflow before publishing a force', () => {
    expect(() => composePlayerImpact(Number.MAX_SAFE_INTEGER, 2)).toThrow(RangeError);
    expect(() => composePlayerImpact(Number.MIN_VALUE, 0.5)).toThrow(RangeError);
    const snapshot = { ...playerFlight, impact: Number.MIN_VALUE, explosionRadius: 120 };
    expect(() => createAttack({ kind: 'MISSILE', variant: 'CLUSTER', snapshot })).toThrow(RangeError);
    expect(createAttack({ kind: 'MISSILE', variant: 'BASE', snapshot }).snapshot).toEqual(snapshot);
  });
});
