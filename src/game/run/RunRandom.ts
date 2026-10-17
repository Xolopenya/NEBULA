/** One explicit stream; captured handles remain bound to their original run. */
type RandomStream = { readonly next: () => number };

/** Fixed uint32 avalanche, applied to root XOR salt before Mulberry32. */
function mix(value: number): number {
  value = Math.imul(value ^ (value >>> 16), 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35);
  return (value ^ (value >>> 16)) >>> 0;
}

/** Reproducibility contract: salts, mix and Mulberry32 arithmetic are versioned by code. */
export class RunRandom {
  readonly #runSeed: number;
  #disposed = false;
  readonly encounter: RandomStream;
  readonly reward: RandomStream;
  readonly world: RandomStream;
  readonly boss: RandomStream;

  constructor(runSeed: number) {
    if (typeof runSeed !== 'number' || !Number.isInteger(runSeed) || runSeed < 0 || runSeed > 0xffffffff) {
      throw new RangeError('Run seed must be a uint32 integer');
    }
    this.#runSeed = runSeed;
    this.encounter = this.stream(mix(runSeed ^ 0x9e3779b9));
    this.reward = this.stream(mix(runSeed ^ 0x243f6a88));
    this.world = this.stream(mix(runSeed ^ 0xb7e15162));
    this.boss = this.stream(mix(runSeed ^ 0xdeadbeef));
  }

  get runSeed(): number { return this.#runSeed; }

  dispose(): void { this.#disposed = true; }

  private stream(state: number): RandomStream {
    return { next: () => {
      if (this.#disposed) throw new Error('Cannot draw from disposed RunRandom');
      state = (state + 0x6d2b79f5) >>> 0;
      let value = Math.imul(state ^ (state >>> 15), state | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    } };
  }
}
