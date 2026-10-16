import { describe, expect, it } from 'vitest';
import { effectiveDroneBoltRadius } from './replicationMatrix';

describe('effectiveDroneBoltRadius', () => {
  it.each([
    [0, 5],
    [1, 6],
    [2, 7],
    [5, 10],
  ])('adds level %i to Drone baseline 5 to give radius %i', (level, expected) => {
    expect(effectiveDroneBoltRadius(5, level)).toBe(expected);
  });

  it('is repeatable, preserves inputs and adds the level to the supplied Drone baseline', () => {
    const input = Object.freeze({ baseRadius: 7, level: 10 });
    expect(effectiveDroneBoltRadius(input.baseRadius, input.level)).toBe(17);
    expect(effectiveDroneBoltRadius(input.baseRadius, input.level)).toBe(17);
    expect(input).toEqual({ baseRadius: 7, level: 10 });
    expect(effectiveDroneBoltRadius(5, 0)).toBe(5);
  });
});
