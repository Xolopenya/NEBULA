import { describe, expect, it } from 'vitest';
import { shooterMovement } from './shooterMovement';

const step = (dx: number, dy: number, delta = 1000) => shooterMovement(dx, dy, 140, delta, 350, 500);

describe('Shooter preferred-distance movement', () => {
  it('approaches at its speed with normalized diagonal motion', () => {
    expect(step(600, 800)).toEqual({ x: 84, y: 112 });
  });

  it('holds inside the inclusive band, including both exact boundaries', () => {
    for (const distance of [350, 425, 500]) expect(step(distance, 0)).toEqual({ x: 0, y: 0 });
    expect(step(210, 280)).toEqual({ x: 0, y: 0 });
    expect(step(300, 400)).toEqual({ x: 0, y: 0 });
  });

  it('retreats directly away below the band', () => {
    expect(step(150, 200)).toEqual({ x: -60, y: -80 });
    const cardinal = step(-100, 0, 500);
    expect(cardinal.x).toBe(70);
    expect(cardinal.y).toBeCloseTo(0);
  });

  it('stops at the nearest band edge for large deltas', () => {
    expect(step(600, 800, 10000)).toEqual({ x: 300, y: 400 });
    expect(step(150, 200, 10000)).toEqual({ x: -60, y: -80 });
  });

  it('retreats deterministically right at coincident centers without overshoot', () => {
    expect(step(0, 0)).toEqual({ x: 140, y: 0 });
    expect(step(0, 0, 10000)).toEqual({ x: 350, y: 0 });
  });

  it('does not move with zero active time', () => {
    expect(step(1000, 0, 0).x).toBe(0);
    expect(step(0, 0, 0)).toEqual({ x: 0, y: 0 });
  });

  it('gives equivalent positions for partitioned approach and retreat', () => {
    const run = (dx: number, frames: number[]) => {
      let x = 0;
      for (const delta of frames) x += step(dx - x, 0, delta).x;
      return x;
    };
    for (const dx of [1000, 100, 0]) {
      expect(run(dx, Array(100).fill(100))).toBeCloseTo(run(dx, [10000]));
    }
  });
});
