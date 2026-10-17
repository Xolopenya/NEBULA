export type CombatSystemId = 'LASER' | 'MISSILE' | 'COMBAT_DRONE';
export type BuildSlots = {
  combat: [CombatSystemId, CombatSystemId, CombatSystemId];
  active: null;
  cores: [null, null, null, null, null, null];
};
export type BaseStats = {
  hull: number; thrust: number; reactorPower: number; fireControl: number;
  projectileVelocity: number; projectileScale: number; engineering: number;
  shieldSystems: number; impact: number; combatAnalyzer: number;
};
export type EffectiveStats = BaseStats;
export type StatKey = keyof BaseStats;
export type PercentStatKey = Exclude<StatKey, 'combatAnalyzer'>;
export type RunModifiers = {
  percent: Omit<BaseStats, 'combatAnalyzer'>;
  combatAnalyzerLevels: number;
  prototypeHullFlat: number;
  prototypeThrustFlat: number;
};
export type PlayerBuildReadModel = {
  slots: BuildSlots; baseStats: BaseStats; runModifiers: RunModifiers; effectiveStats: EffectiveStats;
};
export const DEFAULT_BASE_STATS: Readonly<BaseStats> = Object.freeze({
  hull: 5, thrust: 300, reactorPower: 1, fireControl: 1, projectileVelocity: 1,
  projectileScale: 1, engineering: 1, shieldSystems: 1, impact: 1, combatAnalyzer: 0,
});
const percentKeys: readonly PercentStatKey[] = ['hull', 'thrust', 'reactorPower', 'fireControl',
  'projectileVelocity', 'projectileScale', 'engineering', 'shieldSystems', 'impact'];

function numeric(value: number): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) {
    throw new RangeError('PlayerBuild requires a finite safe numeric value');
  }
}
function integer(value: number): void {
  if (!Number.isSafeInteger(value)) throw new RangeError('PlayerBuild requires a safe integer');
}
function validStats(stats: Readonly<BaseStats>): void {
  for (const key of percentKeys) {
    numeric(stats[key]);
    if (stats[key] < (key === 'hull' || key === 'thrust' ? 1 : 0.01)) {
      throw new RangeError(`PlayerBuild ${key} below minimum`);
    }
  }
  if (stats.fireControl > 100) throw new RangeError('PlayerBuild fireControl exceeds 100');
  integer(stats.combatAnalyzer);
  if (stats.combatAnalyzer < 0) throw new RangeError('PlayerBuild combatAnalyzer below zero');
}

/** Concrete run build data only; no lifecycle, engine, input or procedural dependencies. */
export class PlayerBuild {
  readonly #base: BaseStats;
  readonly #slots: BuildSlots = { combat: ['LASER', 'MISSILE', 'COMBAT_DRONE'], active: null,
    cores: [null, null, null, null, null, null] };
  #modifiers: RunModifiers = { percent: { hull: 0, thrust: 0, reactorPower: 0, fireControl: 0,
    projectileVelocity: 0, projectileScale: 0, engineering: 0, shieldSystems: 0, impact: 0 },
    combatAnalyzerLevels: 0, prototypeHullFlat: 0, prototypeThrustFlat: 0 };
  #effective: EffectiveStats;
  #disposed = false;

  constructor(baseStats: Readonly<BaseStats> = DEFAULT_BASE_STATS) {
    const keys = [...percentKeys, 'combatAnalyzer'];
    if (!baseStats || typeof baseStats !== 'object' || Reflect.ownKeys(baseStats).length !== keys.length
      || Reflect.ownKeys(baseStats).some(key => typeof key !== 'string' || !keys.includes(key))) {
      throw new RangeError('PlayerBuild requires exactly ten base stat fields');
    }
    validStats(baseStats);
    this.#base = { ...baseStats };
    this.#effective = this.resolve(this.#modifiers);
  }

  getSlots(): BuildSlots { this.assertLive(); return structuredClone(this.#slots); }
  getBaseStats(): BaseStats { this.assertLive(); return { ...this.#base }; }
  getRunModifiers(): RunModifiers { this.assertLive(); return structuredClone(this.#modifiers); }
  getEffectiveStats(): EffectiveStats { this.assertLive(); return { ...this.#effective }; }
  snapshot(): PlayerBuildReadModel {
    this.assertLive();
    return { slots: this.getSlots(), baseStats: this.getBaseStats(),
      runModifiers: this.getRunModifiers(), effectiveStats: this.getEffectiveStats() };
  }

  applyStatPercent(stat: PercentStatKey, delta: number): boolean {
    this.assertLive();
    if (!percentKeys.includes(stat)) throw new RangeError('Unsupported PlayerBuild percentage stat');
    numeric(delta);
    const total = this.#modifiers.percent[stat] + delta; numeric(total);
    if (total === this.#modifiers.percent[stat]) return false;
    this.commit({ ...this.#modifiers, percent: { ...this.#modifiers.percent, [stat]: total } });
    return true;
  }
  addCombatAnalyzerLevels(delta: number): boolean {
    this.assertLive(); integer(delta);
    if (delta === 0) return false;
    const total = this.#modifiers.combatAnalyzerLevels + delta; integer(total);
    this.commit({ ...this.#modifiers, combatAnalyzerLevels: total });
    return true;
  }
  applyPrototypeHullPlating(): boolean {
    this.assertLive();
    this.commit({ ...this.#modifiers, prototypeHullFlat: this.#modifiers.prototypeHullFlat + 1 });
    return true;
  }
  applyPrototypeThruster(): boolean {
    this.assertLive();
    this.commit({ ...this.#modifiers, prototypeThrustFlat: this.#modifiers.prototypeThrustFlat + 30 });
    return true;
  }
  dispose(): void { this.#disposed = true; }

  private resolve(modifiers: RunModifiers): EffectiveStats {
    integer(modifiers.prototypeHullFlat); integer(modifiers.prototypeThrustFlat);
    integer(modifiers.combatAnalyzerLevels);
    const result = { ...this.#base };
    for (const key of percentKeys) {
      numeric(modifiers.percent[key]);
      const factor = 1 + modifiers.percent[key]; numeric(factor);
      if (factor <= 0) throw new RangeError('PlayerBuild percentage factor must be positive');
      result[key] = this.#base[key] * factor;
    }
    result.hull += modifiers.prototypeHullFlat;
    result.thrust += modifiers.prototypeThrustFlat;
    result.combatAnalyzer += modifiers.combatAnalyzerLevels;
    validStats(result);
    return result;
  }
  private commit(modifiers: RunModifiers): void {
    const effective = this.resolve(modifiers); // Validate the whole candidate before changing either source or cache.
    this.#modifiers = modifiers;
    this.#effective = effective;
  }
  private assertLive(): void {
    if (this.#disposed) throw new Error('Cannot use disposed PlayerBuild');
  }
}
