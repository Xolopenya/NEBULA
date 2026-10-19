import { describe, expect, it } from 'vitest';
import { PlayerProgression } from './PlayerProgression';

describe('PlayerProgression', () => {
  it('starts fresh and returns detached plain reads', () => {
    const p = new PlayerProgression(), copy = p.snapshot();
    expect(copy).toEqual({ level: 1, xp: 0, threshold: 5, pendingLevels: 0 });
    Object.assign(copy, { xp: 100, pendingLevels: 50 });
    expect(p.snapshot().xp).toBe(0); expect(p.snapshot().pendingLevels).toBe(0);
    expect(JSON.parse(JSON.stringify(p.snapshot()))).toEqual(p.snapshot());
  });
  it.each([[5, 2, 0, 1], [15, 3, 0, 2], [32, 4, 2, 3]])('credits %s exactly with pending inclusive of current offer', (amount, level, xp, pendingLevels) => {
    const p = new PlayerProgression(); expect(p.creditXp(amount)).toEqual({ creditedXp: amount, levelsGained: pendingLevels });
    expect(p.snapshot()).toEqual({ level, xp, threshold: level * 5, pendingLevels });
    for (let n = pendingLevels; n > 0; n--) {
      expect(p.resolvePendingLevel()).toBe(true); expect(p.snapshot()).toEqual({ level, xp, threshold: level * 5, pendingLevels: n - 1 });
    }
    expect(p.resolvePendingLevel()).toBe(false);
  });
  it('zero preserves pending and split/combined XP is equivalent', () => {
    const a = new PlayerProgression(), b = new PlayerProgression();
    for (const amount of [3, 7, 15, 9]) a.creditXp(amount);
    b.creditXp(34); expect(a.snapshot()).toEqual(b.snapshot());
    const before = a.snapshot(); expect(a.creditXp(0)).toEqual({ creditedXp: 0, levelsGained: 0 }); expect(a.snapshot()).toEqual(before);
  });
  it('finishes MAX_SAFE promptly with an independent integer square-root oracle', () => {
    const p = new PlayerProgression(), amount = Number.MAX_SAFE_INTEGER, pool = BigInt(amount);
    const discriminant = 1n + 8n * (pool / 5n);
    let root = discriminant, next = (root + 1n) / 2n;
    while (next < root) { root = next; next = (root + discriminant / root) / 2n; }
    const n = (root - 1n) / 2n;
    const start = performance.now(); p.creditXp(amount);
    expect(performance.now() - start).toBeLessThan(1000);
    expect(p.snapshot()).toEqual({ level: Number(n + 1n), xp: Number(pool - 5n * n * (n + 1n) / 2n), threshold: Number(5n * (n + 1n)), pendingLevels: Number(n) });
  });
  it.each([-1, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, '5', null, undefined])('rejects invalid award %s atomically', amount => {
    const p = new PlayerProgression(); p.creditXp(32); const before = p.snapshot();
    expect(() => p.creditXp(amount as number)).toThrow(RangeError); expect(p.snapshot()).toEqual(before);
  });
  it('rejects overflowing pool without changing earned or pending state', () => {
    const p = new PlayerProgression(); p.creditXp(1); const before = p.snapshot();
    expect(() => p.creditXp(Number.MAX_SAFE_INTEGER)).toThrow(RangeError); expect(p.snapshot()).toEqual(before);
  });
  it('disposes exact owner, including zero and empty calls, while old copies stay readable', () => {
    const p = new PlayerProgression(), copy = p.snapshot(); p.dispose(); p.dispose();
    for (const op of [() => p.snapshot(), () => p.creditXp(0), () => p.creditXp(1), () => p.resolvePendingLevel()]) expect(op).toThrow('disposed PlayerProgression');
    expect(copy.level).toBe(1); expect(new PlayerProgression().snapshot()).toEqual(copy);
  });
});
