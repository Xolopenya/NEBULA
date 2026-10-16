import { describe, expect, it } from 'vitest';
import { shouldSpawnEliteTank } from './eliteTank';

describe('shouldSpawnEliteTank', () => {
  it.each([
    [6, false], [12, true], [18, false], [24, true],
  ])('schedules Tank at successful timed spawn %i as Elite: %s', (number, expected) => {
    expect(shouldSpawnEliteTank('tank', number)).toBe(expected);
  });
  it.each(['chaser', 'shooter'] as const)('never promotes %s at spawn12', archetype => {
    expect(shouldSpawnEliteTank(archetype, 12)).toBe(false);
  });
  it('is repeatable and preserves supplied state', () => {
    const input = Object.freeze({ archetype: 'tank' as const, number: 36 });
    expect(shouldSpawnEliteTank(input.archetype, input.number)).toBe(true);
    expect(shouldSpawnEliteTank(input.archetype, input.number)).toBe(true);
    expect(input).toEqual({ archetype: 'tank', number: 36 });
  });
});
