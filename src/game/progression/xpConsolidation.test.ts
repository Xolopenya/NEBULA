import { describe, expect, it, vi } from 'vitest';
import { planXpConsolidation, type ConsolidationPickup } from './xpConsolidation';
const player = { x: 0, y: 0 };
const p = (x = 1000, y = 1000, value = 1, eligible = true) => ({ x, y, value, eligible });
const padding = (n: number) => Array.from({ length: n }, (_, i) => p(10000 + 64 * i));
const plan = (ps: ConsolidationPickup[], magnet = 180) => planXpConsolidation(ps, player, magnet);

describe('physical XP consolidation policy P', () => {
  it('256 no-op and 257 chooses older anchor, without mutating input or sampling RNG', () => {
    const ps = [...padding(255), p(), p(1001)], copy = structuredClone(ps);
    const random = vi.spyOn(Math, 'random').mockImplementation(() => { throw Error('RNG'); });
    try { expect(plan(ps.slice(0, 256))).toEqual([]); expect(plan(ps)).toEqual([[255, 256]]); expect(ps).toEqual(copy); }
    finally { random.mockRestore(); }
  });
  it.each([[1023, 1024, false], [1024, 1087.9, true], [-1, -63.9, true], [-0.1, 0, false]])('respects grid floor at %s,%s', (x, x2, merge) => {
    expect(plan([...padding(255), p(x), p(x2)])).toEqual(merge ? [[255, 256]] : []);
  });
  it.each([179, 180, 180.001, 219, 220, 220.001])('excludes inclusive magnet boundary %s and honors Collector', x => {
    const ps = [...padding(255), p(x, 0), p(x + 0.001, 0)];
    expect(plan(ps).length).toBe(x > 180 ? 1 : 0);
    expect(plan(ps, 220).length).toBe(x > 220 ? 1 : 0);
  });
  it.each([0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('skips malformed pickup value %s without losing it', value => {
    expect(plan([...padding(255), p(1000, 1000, value), p(1001)])).toEqual([]);
  });
  it('skips unsafe first pair and chooses earliest later safe pair', () => {
    const max = Number.MAX_SAFE_INTEGER;
    const ps = [p(1000, 1000, max), p(), p(1001), ...padding(255)];
    expect(plan(ps)).toEqual([[1, 2]]);
  });
  it('re-evaluates exact lexicographic priority after every sum and conserves BigInt total', () => {
    const ps = [p(1000, 1000, Number.MAX_SAFE_INTEGER - 2), p(), p(1002), p(1003), p(1004), ...padding(255)];
    const result = plan(ps); expect(result).toEqual([[0, 1], [0, 2], [3, 4]]);
    const values = ps.map(v => BigInt(v.value)), before = values.reduce((a, b) => a + b, 0n);
    for (const [a, b] of result) { values[a] += values[b]; values[b] = 0n; }
    expect(values.reduce((a, b) => a + b, 0n)).toBe(before);
  });
  it('ignores stale/inactive/nonfinite inputs; sparse populations remain above soft limit', () => {
    expect(plan([...padding(300), p(1000, 1000, 1, false), p(Infinity), p(NaN)])).toEqual([]);
  });
  it('handles thousands of sparse or unsafe same-cell pickups promptly', () => {
    const start = performance.now();
    expect(plan(padding(20000))).toEqual([]);
    expect(plan(Array.from({ length: 10000 }, () => p(1000, 1000, Number.MAX_SAFE_INTEGER)))).toEqual([]);
    expect(performance.now() - start).toBeLessThan(2000);
  });
  it('matches naive re-evaluation on varied deterministic populations', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const ps = Array.from({ length: 290 }, (_, i) => p(1000 + 64 * ((i * seed) % 17), 1000,
        i % 11 === 0 ? Number.MAX_SAFE_INTEGER - i : i + 1));
      const alive = ps.map((v, index) => ({ ...v, index })), expected: number[][] = [];
      while (alive.length > 256) {
        let found = false;
        for (let a = 0; a < alive.length && !found; a++) for (let b = a + 1; b < alive.length; b++) {
          if (Math.floor(alive[a].x / 64) !== Math.floor(alive[b].x / 64)
            || alive[a].value > Number.MAX_SAFE_INTEGER - alive[b].value) continue;
          expected.push([alive[a].index, alive[b].index]); alive[a].value += alive[b].value; alive.splice(b, 1); found = true; break;
        }
        if (!found) break;
      }
      expect(plan(ps)).toEqual(expected);
    }
  });
});
