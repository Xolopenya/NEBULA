import { describe, expect, it } from 'vitest';
import { RunRandom } from './RunRandom';

const names = ['encounter', 'reward', 'world', 'boss'] as const;
// Literal uint32 outputs (next() * 2^32), pinning salts, avalanche and Mulberry32.
const goldens = [
  { seed: 0, outputs: [
    [2673918951, 1525398398, 1851933717, 1087923286],
    [2705199710, 630908246, 2572203414, 106545003],
    [2639002190, 1919493460, 1877602639, 1101288538],
    [2298484693, 2830936182, 3478138726, 1756018125],
  ] },
  { seed: 123456789, outputs: [
    [616882313, 69255599, 3287797651, 2590978839],
    [643128558, 3226618536, 2495513288, 2759596267],
    [3315392568, 1145729129, 3394470041, 4123876850],
    [3967006156, 1577244385, 1790299849, 3547189151],
  ] },
];

describe('RunRandom', () => {
  it.each([0, 0xffffffff])('accepts immutable uint32 seed %s', seed => {
    const random = new RunRandom(seed);
    expect(random.runSeed).toBe(seed);
    expect(Reflect.set(random, 'runSeed', 1)).toBe(false);
    expect(random.runSeed).toBe(seed);
  });
  it.each([-1, 0x100000000, 0.5, NaN, Infinity, -Infinity, '1', null, undefined, {}, 1n])(
    'rejects invalid explicit seed %s without coercion', seed => {
      expect(() => new RunRandom(seed as number)).toThrow('Run seed must be a uint32 integer');
    });
  it.each(goldens)('pins all four derived streams for seed $seed', ({ seed, outputs }) => {
    const a = new RunRandom(seed), b = new RunRandom(seed);
    names.forEach((name, index) => {
      expect(Array.from({ length: 4 }, () => a[name].next() * 4294967296)).toEqual(outputs[index]);
      expect(Array.from({ length: 4 }, () => b[name].next() * 4294967296)).toEqual(outputs[index]);
    });
    expect(new Set(outputs.map(values => values.join(','))).size).toBe(4);
  });
  it('keeps values finite in [0,1) over long sequences including uint32 wraparound', () => {
    for (const seed of [0, 123456789, 0xffffffff]) {
      const random = new RunRandom(seed);
      for (const name of names) for (let i = 0; i < 10000; i++) {
        const n = random[name].next();
        expect(Number.isFinite(n) && n >= 0 && n < 1).toBe(true);
      }
    }
  });
  it.each(names)('heavy %s consumption cannot advance any other stream', consumed => {
    const a = new RunRandom(123456789), b = new RunRandom(123456789);
    for (let i = 0; i < 1001; i++) a[consumed].next();
    for (const name of names.filter(name => name !== consumed)) {
      expect(Array.from({ length: 20 }, () => a[name].next()))
        .toEqual(Array.from({ length: 20 }, () => b[name].next()));
    }
  });
  it('idempotent disposal invalidates every retained handle, leaving a fresh owner unaffected', () => {
    const old = new RunRandom(0), fresh = new RunRandom(0);
    const handles = names.map(name => old[name]);
    const detachedDraws = handles.map(handle => handle.next);
    old.dispose(); old.dispose();
    for (const handle of handles) expect(() => handle.next()).toThrow('disposed RunRandom');
    for (const draw of detachedDraws) expect(draw).toThrow('disposed RunRandom');
    expect(fresh.encounter.next() * 4294967296).toBe(2673918951);
    expect(old.runSeed).toBe(0);
  });
});
