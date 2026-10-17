import { describe, expect, it, vi } from 'vitest';
import { selectChoices } from './selectChoices';

const pool = ['power', 'fireRate', 'speed', 'hull', 'thruster', 'collector', 'combat'] as const;

describe('selectChoices', () => {
  it('returns three distinct members without changing the source pool', () => {
    const source = Object.freeze([...pool]);
    const result = selectChoices(source, 3, () => 0.5);
    expect(result).toHaveLength(3);
    expect(new Set(result).size).toBe(3);
    for (const choice of result) expect(source).toContain(choice);
    expect(source).toEqual(pool);
  });

  it('uses supplied randomness deterministically', () => {
    const values = [0, 0.5, 0.999];
    expect(selectChoices(pool, 3, () => values.shift()!)).toEqual(['power', 'thruster', 'combat']);
  });

  it('allows previously offered choices in separate selections', () => {
    expect(selectChoices(pool, 3, () => 0)).toEqual(['power', 'fireRate', 'speed']);
    expect(selectChoices(pool, 3, () => 0)).toEqual(['power', 'fireRate', 'speed']);
  });

  it('supports empty and full selections', () => {
    const random = vi.fn(() => 0);
    expect(selectChoices(pool, 0, random)).toEqual([]);
    expect(random).not.toHaveBeenCalled();
    expect(selectChoices(pool, pool.length, () => 0)).toEqual(pool);
  });

  it('rejects impossible counts and does not repeat duplicate pool entries', () => {
    for (const count of [-1, 1.5, 8]) expect(() => selectChoices(pool, count, () => 0)).toThrow(RangeError);
    expect(selectChoices(['a', 'a', 'b'], 2, () => 0)).toEqual(['a', 'b']);
    expect(() => selectChoices(['a', 'a'], 2, () => 0)).toThrow(RangeError);
  });

  it('rejects random values outside the documented range', () => {
    for (const value of [-0.1, 1, NaN, Infinity]) {
      expect(() => selectChoices(pool, 3, () => value)).toThrow(RangeError);
    }
  });
});
