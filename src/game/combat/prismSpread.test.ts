import { describe, expect, it } from 'vitest';
import { prismSpread } from './prismSpread';

describe('prismSpread', () => {
  it.each([[10, 0], [3, 4], [-3, -4], [0, -10]])(
    'returns three unit directions centered on aim (%s, %s)', (dx, dy) => {
      const directions = prismSpread(dx, dy);
      expect(directions).toHaveLength(3);
      for (const direction of directions) {
        expect(Math.hypot(direction.x, direction.y)).toBeCloseTo(1, 12);
      }
      expect(directions[0].x).toBeCloseTo(dx / Math.hypot(dx, dy), 12);
      expect(directions[0].y).toBeCloseTo(dy / Math.hypot(dx, dy), 12);
    },
  );

  it('places the sides symmetrically at -12 and +12 degrees from a non-cardinal aim', () => {
    const [center, negative, positive] = prismSpread(3, 4);
    const signedAngle = (direction: { x: number; y: number }) => Math.atan2(
      center.x * direction.y - center.y * direction.x,
      center.x * direction.x + center.y * direction.y,
    );
    expect(signedAngle(negative)).toBeCloseTo(-12 * Math.PI / 180, 12);
    expect(signedAngle(positive)).toBeCloseTo(12 * Math.PI / 180, 12);
  });

  it('is deterministic and ignores aim magnitude', () => {
    expect(prismSpread(3, 4)).toEqual(prismSpread(3, 4));
    expect(prismSpread(30, 40)).toEqual(prismSpread(3, 4));
  });

  it('suppresses every direction for zero or near-zero aim', () => {
    expect(prismSpread(0, 0)).toEqual([]);
    expect(prismSpread(0.0005, 0.0005)).toEqual([]);
    expect(prismSpread(0.001, 0)).toHaveLength(3);
  });
});
