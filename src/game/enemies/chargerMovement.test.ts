import { describe, expect, it } from 'vitest';
import source from './chargerMovement.ts?raw';
import { ENEMY_DEFINITIONS } from './EnemyDefinitions';
import { initialChargerState, stepCharger, type ChargerState } from './chargerMovement';

const movement = ENEMY_DEFINITIONS.charger.movement;
const bounds = { minX: 25, maxX: 4775, minY: 25, maxY: 2675 };
const origin = { x: 1000, y: 1000 }, player = { x: 1300, y: 1000 };
const phase = (name: ChargerState['phase'], remainingMs: number, directionX = 1, directionY = 0): ChargerState =>
  ({ phase: name, remainingMs, directionX, directionY });
const step = (state = initialChargerState(), delta = 1, position = origin, target = player) =>
  stepCharger(position, target, state, movement, bounds, delta);

describe('concrete Charger phases', () => {
  it('starts APPROACH with no copied movement values', () => {
    expect(initialChargerState()).toEqual(phase('APPROACH', 0));
    expect(initialChargerState()).not.toBe(initialChargerState());
  });
  it('approaches at110 and spends exact range-crossing time before windup', () => {
    const before = step(initialChargerState(), 1000, { x: 500, y: 1000 });
    expect(before.position).toEqual({ x: 610, y: 1000 }); expect(before.state.phase).toBe('APPROACH');
    const crossed = step(initialChargerState(), 1500, { x: 840, y: 1000 });
    expect(crossed.position).toEqual({ x: 950, y: 1000 }); expect(crossed.state).toEqual(phase('WINDUP', 150));
  });
  it.each([0, Number.MIN_VALUE])('zero/representational tiny time %s never invents motion', delta => {
    const result = step(initialChargerState(), delta);
    expect(result.position).toEqual(origin);
    if (delta === 0) expect(result.state).toEqual(initialChargerState());
  });
  it('enters at inclusive range350 only on a positive update', () => {
    expect(step(initialChargerState(), 0, { x: 950, y: 1000 }).state.phase).toBe('APPROACH');
    expect(step(initialChargerState(), 100, { x: 950, y: 1000 }).state).toEqual(phase('WINDUP', 550));
  });
  it('tracks during650ms windup and commits once at expiry', () => {
    const result = step(phase('WINDUP', 650), 650, origin, { x: 1000, y: 1300 });
    expect(result.position).toEqual(origin); expect(result.state).toEqual(phase('CHARGING', 500, 0, 1));
    const charging = step(result.state, 100, result.position, { x: 700, y: 1000 });
    expect(charging.position).toEqual({ x: 1000, y: 1065 }); expect(charging.state).toEqual(phase('CHARGING', 400, 0, 1));
  });
  it('uses +X for coincident aim, without random fallback', () => {
    expect(step(phase('WINDUP', 1), 1, origin, origin).state).toEqual(phase('CHARGING', 500));
  });
  it('charges325px then recovers800ms and rearms on next positive update', () => {
    const result = step(phase('CHARGING', 500), 1300);
    expect(result.position).toEqual({ x: 1325, y: 1000 }); expect(result.state).toEqual(phase('APPROACH', 0));
    const rearm = step(result.state, 1, result.position); expect(rearm.state.phase).toBe('WINDUP');
  });
  it('carries exact residual windup/charge/recovery time', () => {
    const result = step(phase('WINDUP', 50), 150);
    expect(result.position).toEqual({ x: 1065, y: 1000 }); expect(result.state).toEqual(phase('CHARGING', 400));
    const recovery = step(result.state, 450, result.position);
    expect(recovery.position.x).toBe(1325); expect(recovery.state).toEqual(phase('RECOVERY', 750));
  });
  it.each(['APPROACH', 'WINDUP', 'CHARGING', 'RECOVERY'] as const)('large delta from %s completes at most current cycle', name => {
    const duration = name === 'WINDUP' ? 650 : name === 'CHARGING' ? 500 : name === 'RECOVERY' ? 800 : 0;
    const result = step(phase(name, duration), Number.MAX_SAFE_INTEGER);
    expect(result.state.phase).toBe('APPROACH'); expect(result.state.remainingMs).toBe(0);
    expect(Math.hypot(player.x - result.position.x, player.y - result.position.y)).toBeLessThanOrEqual(350);
    expect(step(result.state, 1, result.position).state.phase).toBe('WINDUP');
  });
  it('clamps the actual charge segment without changing heading or clock', () => {
    const result = step(phase('CHARGING', 500), 500, { x: 4750, y: 1000 }, { x: 4775, y: 1100 });
    expect(result.position).toEqual({ x: 4775, y: 1000 }); expect(result.state).toEqual(phase('RECOVERY', 800));
    expect(result.contact).toBeNull();
  });
  it.each([
    [{ x: 1200, y: 1000 }, 1158, 1000],
    [{ x: 1200, y: 1042 }, 1200, 1000],
    [{ x: 1000, y: 1000 }, 1000, 1000],
  ] as const)('captures earliest inclusive charge intersection with %j', (target, x, y) => {
    const result = step(phase('CHARGING', 500), 500, origin, target);
    expect(result.contact!.x).toBeCloseTo(x); expect(result.contact!.y).toBeCloseTo(y);
  });
  it('misses outside42 and creates no sweep in approach/windup/recovery', () => {
    expect(step(phase('CHARGING', 500), 500, origin, { x: 1200, y: 1042.01 }).contact).toBeNull();
    for (const state of [initialChargerState(), phase('WINDUP', 650), phase('RECOVERY', 800)]) expect(step(state, 1).contact).toBeNull();
  });
  it.each([NaN, Infinity, -1, Number.MAX_SAFE_INTEGER + 1, undefined, null, '1'])('rejects invalid delta %s', delta => {
    expect(() => stepCharger(origin, player, initialChargerState(), movement, bounds, delta as number)).toThrow(RangeError);
  });
  it.each([phase('WINDUP', 0), phase('CHARGING', 501), phase('RECOVERY', -1), phase('APPROACH', 1),
    phase('CHARGING', 1, 2), phase('WINDUP', 1, 0, 0), phase('INVALID' as 'APPROACH', 1)])('rejects invalid state %j', state => {
    expect(() => step(state)).toThrow(RangeError);
  });
  it.each(['speed', 'triggerRange', 'windupMs', 'chargeSpeed', 'chargeMs', 'recoveryMs'] as const)('rejects invalid authored %s', key => {
    for (const value of [0, -1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => stepCharger(origin, player, initialChargerState(), { ...movement, [key]: value }, bounds, 1)).toThrow(RangeError);
    }
  });
  it('rejects unsafe derived movement before returning and leaves callers untouched', () => {
    const state = Object.freeze(phase('CHARGING', Number.MAX_SAFE_INTEGER));
    expect(() => stepCharger(origin, player, state, { ...movement, chargeSpeed: Number.MAX_SAFE_INTEGER,
      chargeMs: Number.MAX_SAFE_INTEGER }, bounds, Number.MAX_SAFE_INTEGER)).toThrow(RangeError);
    expect(state.remainingMs).toBe(Number.MAX_SAFE_INTEGER); expect(origin).toEqual({ x: 1000, y: 1000 });
    expect(() => stepCharger(origin, player, initialChargerState(), movement, { ...bounds, maxX: 20 }, 1)).toThrow(RangeError);
  });
  it('contains no Phaser, clock, gameplay-owner or RNG dependency', () => {
    expect(source).not.toMatch(/Phaser|Math\.random|RunRandom|PlayerBuild|RunLifecycle|setTimeout|addEvent/);
  });
});
