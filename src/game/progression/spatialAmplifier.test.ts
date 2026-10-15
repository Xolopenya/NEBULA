import { describe, expect, it } from 'vitest';
import { effectiveMissileExplosionRadius } from './spatialAmplifier';

describe('effectiveMissileExplosionRadius', () => {
  it.each([
    [120, 0, 120],
    [120, 1, 135],
    [120, 2, 150],
    [150, 1, 165],
    [180, 2, 210],
  ])('combines Missile radius %i with Spatial level %i to produce %i', (radius, level, expected) => {
    expect(effectiveMissileExplosionRadius(radius, level)).toBe(expected);
  });

  it('is deterministic, keeps inputs unchanged and supports repeatable levels beyond two', () => {
    const input = Object.freeze({ radius: 180, level: 10 });
    expect(effectiveMissileExplosionRadius(input.radius, input.level)).toBe(330);
    expect(effectiveMissileExplosionRadius(input.radius, input.level)).toBe(330);
    expect(input).toEqual({ radius: 180, level: 10 });
    expect(effectiveMissileExplosionRadius(120, 0)).toBe(120);
  });
});
