import { describe, expect, it } from 'vitest';
import source from './knockback.ts?raw';
import { knockbackDirection as direction, withKnockbackImpulse as impulse, stepKnockback as step } from './knockback';

const zero = { x: 0, y: 0 };
describe('physical impulse and analytic decay', () => {
  it.each([[0, 0, 1, 0], [1, 0, 1, 0], [-5, 0, -1, 0], [0, -7, 0, -1], [3, 4, 0.6, 0.8],
    [Number.MIN_VALUE, 0, 1, 0], [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Math.SQRT1_2, Math.SQRT1_2]])(
    'normalizes (%s,%s) without epsilon or RNG', (x, y, ux, uy) => {
      const unit = direction(x, y); expect(unit.x).toBeCloseTo(ux); expect(unit.y).toBeCloseTo(uy);
    });
  it.each([1.5, 1, 0.75, 0.25, 0.125, 0.05, 0])('responds once at authored coefficient %s', response => {
    expect(impulse(zero, direction(1, 0), 200 * response)).toEqual({ x: 200 * response, y: 0 });
  });
  it('caps the SUM, preserving opposite cancellation rather than capping incoming force', () => {
    expect(impulse({ x: 500, y: 0 }, direction(-1, 0), 800)).toEqual({ x: -300, y: 0 });
    expect(impulse({ x: 200, y: 0 }, direction(-1, 0), 200)).toEqual(zero);
    const result = impulse({ x: 400, y: 0 }, direction(0, 1), 800);
    expect(Math.hypot(result.x, result.y)).toBeCloseTo(600); expect(result.y / result.x).toBeCloseTo(2);
  });
  it('bounds repeated Prism/Twin and primary/satellite accumulation at 600', () => {
    let velocity = zero;
    for (const magnitude of [200, 200, 200, 160, 160, 400, 200]) velocity = impulse(velocity, direction(1, 0), magnitude);
    expect(velocity).toEqual({ x: 600, y: 0 });
    expect(impulse(zero, direction(1, 0), Number.MAX_SAFE_INTEGER)).toEqual({ x: 600, y: 0 });
  });
  it('uses constant radial strength and exact center fallback', () => {
    expect(impulse(zero, direction(0, 0), 400)).toEqual({ x: 400, y: 0 });
    expect(impulse(zero, direction(120, 0), 400)).toEqual({ x: 400, y: 0 });
  });
  it('preserves input ownership and explicit zero force', () => {
    const velocity = Object.freeze({ x: 300, y: 400 }), unit = Object.freeze(direction(3, 4));
    expect(impulse(velocity, unit, 0)).toEqual(velocity); expect(impulse(velocity, unit, 0)).not.toBe(velocity);
    step(velocity, 100); expect(velocity).toEqual({ x: 300, y: 400 });
  });
  it('integrates the Laser 200px/s example and partial linear decay', () => {
    const partial = step({ x: 200, y: 0 }, 100);
    expect(partial.velocity).toEqual({ x: 80, y: 0 }); expect(partial.displacement.x).toBeCloseTo(14);
    const exhausted = step({ x: 200, y: 0 }, 1000);
    expect(exhausted.velocity).toEqual(zero); expect(exhausted.displacement.x).toBeCloseTo(50 / 3);
    expect(step({ x: 600, y: 0 }, Number.MAX_SAFE_INTEGER)).toEqual({ velocity: zero, displacement: { x: 150, y: 0 } });
  });
  it('integrates diagonal displacement and exhausts exactly without a tail', () => {
    const result = step({ x: 360, y: 480 }, 500);
    expect(result).toEqual({ velocity: zero, displacement: { x: 90, y: 120 } });
  });
  it('partitions decay without AI or clamping', () => {
    const first = step({ x: 360, y: 480 }, 75), next = step(first.velocity, 175), whole = step({ x: 360, y: 480 }, 250);
    expect(next.velocity.x).toBeCloseTo(whole.velocity.x); expect(next.velocity.y).toBeCloseTo(whole.velocity.y);
    expect(first.displacement.x + next.displacement.x).toBeCloseTo(whole.displacement.x);
    expect(first.displacement.y + next.displacement.y).toBeCloseTo(whole.displacement.y);
  });
  it.each([0, Number.MIN_VALUE])('delta %s returns the unchanged velocity before arithmetic', delta => {
    const velocity = { x: Number.MIN_VALUE, y: 0 };
    expect(step(velocity, delta)).toEqual({ velocity, displacement: zero });
  });
  it('accepts a representationally tiny exhausted displacement without inventing an epsilon', () => {
    expect(step({ x: Number.MIN_VALUE, y: 0 }, 1)).toEqual({ velocity: zero, displacement: zero });
    expect(step(zero, 1)).toEqual({ velocity: zero, displacement: zero });
  });
  it.each([NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, undefined, null, '1'])('rejects malformed number %s', value => {
    expect(() => direction(value as number, 0)).toThrow(RangeError);
    expect(() => impulse(zero, direction(1, 0), value as number)).toThrow(RangeError);
    expect(() => step(zero, value as number)).toThrow(RangeError);
  });
  it.each([{ x: 601, y: 0 }, { x: 600, y: 1 }, { x: NaN, y: 0 }, { x: 0, y: Infinity }])('rejects invalid retained vector %j before cap', velocity => {
    expect(() => impulse(velocity, direction(1, 0), 0)).toThrow(RangeError);
    expect(() => step(velocity, 0)).toThrow(RangeError);
  });
  it.each([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: NaN, y: 0 }])('rejects non-unit direction %j', unit => {
    expect(() => impulse(zero, unit, 200)).toThrow(RangeError);
  });
  it('rejects negative magnitude/delta, and has no gameplay-owner dependency', () => {
    expect(() => impulse(zero, direction(1, 0), -1)).toThrow(RangeError);
    expect(() => step(zero, -1)).toThrow(RangeError);
    expect(source).not.toMatch(/Phaser|Math\.random|RunRandom|PlayerBuild|Hit|EnemyDeath|setTimeout|addEvent/);
  });
});
