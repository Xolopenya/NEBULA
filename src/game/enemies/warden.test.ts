import { describe, expect, it } from 'vitest';
import { shouldSpawnWarden, wardenPhase, wardenBurstDirections } from './warden';

describe('shouldSpawnWarden', () => {
  it.each([
    { number: 29, spawned: false, expected: false },
    { number: 30, spawned: false, expected: true },
    { number: 31, spawned: false, expected: false },
    { number: 30, spawned: true, expected: false },
  ])('spawn $number with spawned=$spawned -> $expected', ({ number, spawned, expected }) => {
    expect(shouldSpawnWarden(number, spawned)).toBe(expected);
  });
  it('repeats without mutating supplied state', () => {
    const input = Object.freeze({ number: 30, spawned: false });
    expect(shouldSpawnWarden(input.number, input.spawned)).toBe(true);
    expect(shouldSpawnWarden(input.number, input.spawned)).toBe(true);
    expect(input).toEqual({ number: 30, spawned: false });
  });
});

describe('wardenPhase', () => {
  it.each([[60, 1], [31, 1], [30, 2], [1, 2], [0, undefined], [-1, undefined]])(
    'health %i -> phase %s', (health, expected) => {
      expect(wardenPhase(health)).toBe(expected);
    },
  );
});

describe('wardenBurstDirections', () => {
  it.each([
    { phase: 1 as const, angles: [0, 90, 180, 270] },
    { phase: 2 as const, angles: [0, 45, 90, 135, 180, 225, 270, 315] },
  ])('returns phase $phase world angles and unit vectors', ({ phase, angles }) => {
    const directions = wardenBurstDirections(phase);
    expect(directions).toHaveLength(angles.length);
    directions.forEach((direction, index) => {
      expect(Math.hypot(direction.x, direction.y)).toBeCloseTo(1, 12);
      const degrees = (Math.atan2(direction.y, direction.x) * 180 / Math.PI + 360) % 360;
      expect(degrees).toBeCloseTo(angles[index], 10);
    });
  });
  it('returns deterministic independent arrays and vectors', () => {
    const first = wardenBurstDirections(2);
    const second = wardenBurstDirections(2);
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    first.forEach((direction, index) => expect(direction).not.toBe(second[index]));
    first[0].x = 99;
    first.pop();
    expect(second).toHaveLength(8);
    expect(second[0]).toEqual({ x: 1, y: 0 });
    expect(wardenBurstDirections(2)).toEqual(second);
  });
});
