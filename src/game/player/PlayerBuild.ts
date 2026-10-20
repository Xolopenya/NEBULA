import { GAMEPLAY_SETTINGS } from '../settings/gameplaySettings';
import { initialMissile, prepareMissileChoice, missileProfile, composeMissileProfile, MISSILE_TAGS,
  type MissileConfiguration, type MissileChoice, type MissileCompositionContext } from './missileProgression';
import { initialLaser, prepareLaserChoice, laserProfile, laserAttack, laserTagCandidate,
  type LaserConfiguration, type LaserChoice, type LaserProfile } from './laserProgression';
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
export const TAG_IDS = Object.freeze(['PRECISION', 'RAPID_FIRE', 'CLOSE_COMBAT', 'PROJECTILES',
  'EXPLOSIONS', 'DRONES', 'TECHNOLOGY', 'SHIELDS', 'CONTROL', 'MOBILITY', 'SUPPORT', 'SURVIVAL'] as const);
export type TagId = typeof TAG_IDS[number];
export type TagPoints = Record<TagId, number>;
export type BuildIdentity = { dominantTags: TagId[]; secondaryTags: TagId[] };
export type BuildSnapshot = {
  slots: BuildSlots; baseStats: BaseStats; runModifiers: RunModifiers; effectiveStats: EffectiveStats;
  tags: TagPoints; identity: BuildIdentity; laser: LaserConfiguration; missile: MissileConfiguration;
};
export const DEFAULT_BASE_STATS: Readonly<BaseStats> = Object.freeze({
  hull: 5, thrust: GAMEPLAY_SETTINGS.player.moveSpeedPxPerSecond, reactorPower: 1, fireControl: 1, projectileVelocity: 1,
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
  #tags: TagPoints = { PRECISION: 0, RAPID_FIRE: 0, CLOSE_COMBAT: 0, PROJECTILES: 0,
    EXPLOSIONS: 0, DRONES: 0, TECHNOLOGY: 0, SHIELDS: 0, CONTROL: 0, MOBILITY: 0, SUPPORT: 0, SURVIVAL: 0 };
  #identity: BuildIdentity = { dominantTags: [], secondaryTags: [] };
  #laser = initialLaser();
  #missile = initialMissile();
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
  snapshot(): BuildSnapshot {
    this.assertLive();
    return { slots: this.getSlots(), baseStats: this.getBaseStats(),
      runModifiers: this.getRunModifiers(), effectiveStats: this.getEffectiveStats(),
      tags: { ...this.#tags }, identity: structuredClone(this.#identity), laser: structuredClone(this.#laser),
      missile: this.getMissileConfiguration() };
  }

  getMissileConfiguration(): MissileConfiguration { this.assertLive(); return structuredClone(this.#missile); }
  previewMissileChoice(choice: MissileChoice, context: MissileCompositionContext) {
    this.assertLive();
    if (!this.#slots.combat.includes('MISSILE')) throw new RangeError('Missile not installed');
    const missile = prepareMissileChoice(this.#missile, choice, context?.spatialLevel);
    const { reactorPower, fireControl, projectileVelocity, projectileScale, engineering, impact } = this.#effective;
    const composed = composeMissileProfile(missile, { reactorPower, fireControl, projectileVelocity,
      projectileScale, engineering, impact }, context);
    const tags = { ...this.#tags };
    if (choice.kind === 'missileSpecialization') for (const tag of MISSILE_TAGS[choice.branch]) {
      const total = tags[tag] + 1;
      if (!Number.isSafeInteger(total) || total <= tags[tag]) throw new RangeError('Missile Tag overflow');
      tags[tag] = total;
    }
    return { missile, tags, identity: this.deriveIdentity(tags), profile: missileProfile(missile), composed };
  }
  applyMissileChoice(choice: MissileChoice, context: MissileCompositionContext): boolean {
    const next = this.previewMissileChoice(choice, context);
    this.#missile = next.missile; this.#tags = next.tags; this.#identity = next.identity;
    return true;
  }

  previewLaserChoice(choice: LaserChoice, combatLevel: number): Readonly<{ laser: LaserConfiguration;
    tags: TagPoints; identity: BuildIdentity; profile: LaserProfile }> {
    this.assertLive();
    if (!this.#slots.combat.includes('LASER')) throw new RangeError('Laser not installed');
    const laser = prepareLaserChoice(this.#laser, choice, combatLevel);
    const tags = laserTagCandidate(this.#tags, choice), identity = this.deriveIdentity(tags);
    laserAttack(laser, this.#effective, 1 + 0.25 * combatLevel);
    return { laser, tags, identity, profile: laserProfile(laser) };
  }
  applyLaserChoice(choice: LaserChoice, combatLevel: number): boolean {
    const next = this.previewLaserChoice(choice, combatLevel);
    this.#laser = next.laser; this.#tags = next.tags; this.#identity = next.identity;
    return true;
  }
  previewStatPercent(stat: PercentStatKey, delta: number): EffectiveStats {
    this.assertLive();
    if (!percentKeys.includes(stat)) throw new RangeError('Unsupported PlayerBuild percentage stat');
    numeric(delta);
    return this.resolve({ ...this.#modifiers, percent: { ...this.#modifiers.percent,
      [stat]: this.#modifiers.percent[stat] + delta } });
  }

  addTagPoints(tag: TagId, amount: number): boolean {
    this.assertLive();
    if (!TAG_IDS.includes(tag)) throw new RangeError('Unsupported PlayerBuild tag');
    if (typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount < 0) {
      throw new RangeError('PlayerBuild tag points require a nonnegative safe integer');
    }
    const total = this.#tags[tag] + amount;
    if (!Number.isSafeInteger(total)) throw new RangeError('PlayerBuild tag points overflow');
    if (amount === 0) return false;
    const tags = { ...this.#tags, [tag]: total };
    const identity = this.deriveIdentity(tags);
    this.#tags = tags;
    this.#identity = identity;
    return true;
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
    this.commit(this.prototypeHullCandidate());
    return true;
  }
  applyPrototypeThruster(): boolean {
    this.assertLive();
    this.commit(this.prototypeThrustCandidate());
    return true;
  }
  previewPrototypeHullPlating(): EffectiveStats {
    this.assertLive(); return this.resolve(this.prototypeHullCandidate());
  }
  previewPrototypeThruster(): EffectiveStats {
    this.assertLive(); return this.resolve(this.prototypeThrustCandidate());
  }
  dispose(): void { this.#disposed = true; }

  private prototypeHullCandidate(): RunModifiers {
    return { ...this.#modifiers, prototypeHullFlat: this.#modifiers.prototypeHullFlat + 1 };
  }
  private prototypeThrustCandidate(): RunModifiers {
    return { ...this.#modifiers, prototypeThrustFlat: this.#modifiers.prototypeThrustFlat + 30 };
  }

  private deriveIdentity(tags: TagPoints): BuildIdentity {
    let highest = 0, second = 0;
    for (const tag of TAG_IDS) {
      const points = tags[tag];
      if (points > highest) { second = highest; highest = points; }
      else if (points < highest && points > second) second = points;
    }
    return { dominantTags: TAG_IDS.filter(tag => highest > 0 && tags[tag] === highest),
      secondaryTags: TAG_IDS.filter(tag => second > 0 && tags[tag] === second) };
  }

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
