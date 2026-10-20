import { TAG_IDS, type TagId } from '../player/PlayerBuild';
import { selectEvolutionOffer, type Evolution } from '../progression/evolutionOffer';
import type { WeaponFocus } from '../progression/focusedUpgrade';
import { isRewardEligible, assertRewardContext, type RewardEligibilityContext } from './rewardEligibility';
import { LASER_TAGS } from '../player/laserProgression';
import { MISSILE_TAGS } from '../player/missileProgression';
import { choiceIdentity, copyCandidate, isNewMissileChoice, rewardChoices, type RewardCandidate, type RewardCandidateId } from './rewardChoices';

export type LevelUpContext = RewardEligibilityContext & Readonly<{ weaponFocus: WeaponFocus }>;
export const LEVEL_UP_POLICY_VERSION = 'GAME-057-v1';
/** Closed policy affinity only. These records never contribute Build Tag points. */
export const REWARD_AFFINITIES: Readonly<Record<RewardCandidateId, readonly TagId[]>> = Object.freeze({
  'laser.power': ['PRECISION'], 'laser.fireRate': ['RAPID_FIRE'], 'laser.speed': ['PROJECTILES'],
  'missile.warheadPower': ['EXPLOSIONS'], 'missile.propulsion': ['PROJECTILES'],
  'missile.blastExpansion': ['EXPLOSIONS', 'CONTROL'],
  'drone.boltPower': ['DRONES', 'TECHNOLOGY'], 'drone.firingSystem': ['DRONES', 'TECHNOLOGY'],
  'drone.boltPropulsion': ['DRONES', 'TECHNOLOGY'], 'passive.hull': ['SURVIVAL'],
  'passive.thruster': ['MOBILITY'], 'passive.collector': ['SUPPORT'], 'passive.combat': ['PROJECTILES'],
  'passive.spatial': ['EXPLOSIONS'], 'passive.replication': ['DRONES'],
  prism: ['PRECISION', 'PROJECTILES'], cluster: ['EXPLOSIONS'], twin: ['DRONES'],
  'laser.specialize.scatter': LASER_TAGS.scatter,
  'laser.specialize.repeater': LASER_TAGS.repeater,
  'laser.specialize.lance': LASER_TAGS.lance,
  'laser.scatter.damage': LASER_TAGS.scatter,
  'laser.scatter.focus': LASER_TAGS.scatter,
  'laser.scatter.range': LASER_TAGS.scatter,
  'laser.scatter.impact': LASER_TAGS.scatter,
  'laser.scatter.capstone': LASER_TAGS.scatter,
  'laser.repeater.damage': LASER_TAGS.repeater,
  'laser.repeater.cadence': LASER_TAGS.repeater,
  'laser.repeater.velocity': LASER_TAGS.repeater,
  'laser.repeater.impact': LASER_TAGS.repeater,
  'laser.repeater.capstone': LASER_TAGS.repeater,
  'laser.lance.damage': LASER_TAGS.lance,
  'laser.lance.velocity': LASER_TAGS.lance,
  'laser.lance.penetration': LASER_TAGS.lance,
  'laser.lance.radius': LASER_TAGS.lance,
  'laser.lance.capstone': LASER_TAGS.lance,
  'missile.specialize.guidance': MISSILE_TAGS.guidance,
  'missile.specialize.heavy': MISSILE_TAGS.heavy,
  'missile.specialize.fragmentation': MISSILE_TAGS.fragmentation,
  'missile.guidance.payload': MISSILE_TAGS.guidance,
  'missile.guidance.propulsion': MISSILE_TAGS.guidance,
  'missile.guidance.fuse': MISSILE_TAGS.guidance,
  'missile.guidance.endurance': MISSILE_TAGS.guidance,
  'missile.guidance.capstone': MISSILE_TAGS.guidance,
  'missile.heavy.payload': MISSILE_TAGS.heavy,
  'missile.heavy.propulsion': MISSILE_TAGS.heavy,
  'missile.heavy.blast': MISSILE_TAGS.heavy,
  'missile.heavy.reload': MISSILE_TAGS.heavy,
  'missile.heavy.capstone': MISSILE_TAGS.heavy,
  'missile.fragmentation.payload': MISSILE_TAGS.fragmentation,
  'missile.fragmentation.reload': MISSILE_TAGS.fragmentation,
  'missile.fragmentation.fragments': MISSILE_TAGS.fragmentation,
  'missile.fragmentation.endurance': MISSILE_TAGS.fragmentation,
  'missile.fragmentation.capstone': MISSILE_TAGS.fragmentation,
} satisfies Record<RewardCandidateId, readonly TagId[]>);
for (const tags of Object.values(REWARD_AFFINITIES)) Object.freeze(tags);
const canonical = Object.freeze(rewardChoices.map(choice => copyCandidate({ id: choiceIdentity(choice), choice })));
type Policy = Readonly<{ misses: number; history: readonly (readonly RewardCandidateId[])[];
  primarySignature: readonly TagId[]; evolutionCursor: Evolution }>;
export type LevelUpPolicySnapshot = Policy & Readonly<{ lastPresented: number; hasGenerated: boolean }>;
function frozenCandidates(candidates: readonly RewardCandidate[]): readonly RewardCandidate[] {
  const copy = Object.freeze(Array.from(candidates, copyCandidate));
  if (new Set(copy.map(c => c.id)).size !== copy.length) throw new RangeError('Duplicate policy candidate');
  return copy;
}
function frozenPolicy(p: Policy): Policy {
  return Object.freeze({ misses: p.misses, history: Object.freeze(p.history.map(ids => Object.freeze([...ids]))),
    primarySignature: Object.freeze([...p.primarySignature]), evolutionCursor: p.evolutionCursor });
}
const matches = (id: RewardCandidateId, tags: readonly TagId[]) => REWARD_AFFINITIES[id].some(tag => tags.includes(tag));
function validateIdentity(c: LevelUpContext): void {
  const tags = c?.build?.tags, identity = c?.build?.identity;
  if (!tags || Reflect.ownKeys(tags).length !== TAG_IDS.length || !identity
    || Reflect.ownKeys(identity).length !== 2
    || !TAG_IDS.every(tag => Object.hasOwn(tags, tag) && Number.isSafeInteger(tags[tag]) && tags[tag] >= 0)
    || !['laser', 'missile', 'drone'].includes(c.weaponFocus)
    || !Number.isSafeInteger(c.build.effectiveStats?.combatAnalyzer) || c.build.effectiveStats.combatAnalyzer < 0) {
    throw new RangeError('Invalid Level-Up context');
  }
  const tiers = [...new Set(TAG_IDS.map(tag => tags[tag]).filter(n => n > 0))].sort((a, b) => b - a);
  for (const [key, tier] of [['dominantTags', tiers[0]], ['secondaryTags', tiers[1]]] as const) {
    const actual = identity[key], expected = TAG_IDS.filter(tag => tags[tag] === tier);
    if (!Array.isArray(actual) || actual.length !== expected.length || expected.some((tag, i) => actual[i] !== tag)) {
      throw new RangeError('Invalid Level-Up identity');
    }
  }
}

/** One presentation policy owner, with no selection, engine, Build or RNG ownership. */
export class LevelUpGenerator {
  #policy: Policy = frozenPolicy({ misses: 0, history: [], primarySignature: [], evolutionCursor: 'prism' });
  #lastPresented = 0;
  #provisional: Readonly<{ candidates: readonly RewardCandidate[]; update: Policy }> | null = null;
  #disposed = false;

  assertCanGenerate(context: LevelUpContext): void { this.prepare(context); }

  generate(context: LevelUpContext, rewardNext: () => number): readonly RewardCandidate[] {
    const plan = this.prepare(context); // All feasible paths validated before the first draw.
    if (typeof rewardNext !== 'function') throw new RangeError('Reward random source required');
    const selected: RewardCandidate[] = [];
    for (const slot of [0, 1, 2] as const) {
      const pool = plan.pool(slot, selected);
      const sum = pool.reduce((n, c) => n + plan.weights[slot].get(c.id)!, 0);
      const u = rewardNext();
      if (typeof u !== 'number' || !Number.isFinite(u) || u < 0 || u >= 1) {
        throw new RangeError(`Invalid Reward random value at draw ${slot + 1}`);
      }
      const threshold = u * sum;
      let cumulative = 0;
      // The last positive entry also covers a rounding-only threshold >= sum.
      let chosen = pool[pool.length - 1];
      for (const candidate of pool) {
        cumulative += plan.weights[slot].get(candidate.id)!;
        if (cumulative > threshold) { chosen = candidate; break; }
      }
      selected.push(chosen);
    }
    const ids = selected.map(c => c.id), primary = plan.primary;
    const relevant = selected.some(c => matches(c.id, primary));
    const misses = !primary.length || relevant ? 0 : plan.hasRelevant ? Math.min(4, plan.base + 1) : plan.base;
    this.#provisional = Object.freeze({ candidates: frozenCandidates(selected), update: frozenPolicy({
      misses, history: [...this.#policy.history, ids].slice(-2), primarySignature: primary,
      evolutionCursor: plan.nextCursor }) });
    return frozenCandidates(selected); // A second physical copy, including nested choices.
  }

  recordPresented(offerId: number): boolean {
    this.assertLive();
    if (!this.#provisional || !Number.isSafeInteger(offerId) || offerId <= this.#lastPresented) return false;
    this.#policy = this.#provisional.update;
    this.#lastPresented = offerId;
    this.#provisional = null;
    return true;
  }
  cancelGenerated(): void { this.assertLive(); this.#provisional = null; }
  snapshot(): LevelUpPolicySnapshot {
    this.assertLive();
    return structuredClone({ ...this.#policy, lastPresented: this.#lastPresented, hasGenerated: !!this.#provisional });
  }
  dispose(): void {
    this.#provisional = null;
    this.#policy = frozenPolicy({ misses: 0, history: [], primarySignature: [], evolutionCursor: 'prism' });
    this.#disposed = true;
  }
  private assertLive(): void { if (this.#disposed) throw new Error('Cannot use disposed LevelUpGenerator'); }

  private prepare(input: LevelUpContext) {
    this.assertLive();
    if (this.#provisional) throw new Error('Level-Up generation already pending presentation');
    validateIdentity(input);
    assertRewardContext(input); // Malformed Build/projections must not masquerade as numeric fallback.
    const c = structuredClone(input); // Injected RNG cannot change this offer's preflighted context.
    const candidates = frozenCandidates(canonical);
    if (candidates.length !== 54 || Object.keys(REWARD_AFFINITIES).length !== 54) throw new RangeError('Invalid canonical policy');
    for (const candidate of candidates) {
      const tags = REWARD_AFFINITIES[candidate.id];
      if (!tags || tags.some((tag, i) => !TAG_IDS.includes(tag) || i > 0 && TAG_IDS.indexOf(tags[i - 1]) >= TAG_IDS.indexOf(tag))) {
        throw new RangeError('Invalid reward affinity');
      }
    }
    const eligible = candidates.filter(candidate => isRewardEligible(candidate.choice, c));
    const ordinary = eligible.filter(candidate => !['prism', 'cluster', 'twin'].includes(candidate.choice.kind));
    const isAcquisition = (candidate: RewardCandidate) => candidate.choice.kind === 'laserSpecialization'
      || candidate.choice.kind === 'missileSpecialization';
    const acquisitions = ordinary.filter(isAcquisition);
    const remainingOrdinary = ordinary.filter(candidate => !isAcquisition(candidate));
    const evolution = selectEvolutionOffer(eligible.some(c => c.id === 'prism'), eligible.some(c => c.id === 'cluster'),
      eligible.some(c => c.id === 'twin'), this.#policy.evolutionCursor);
    const reserved = eligible.find(c => c.id === evolution.offered);
    const primary = [...c.build.identity.dominantTags], secondary = c.build.identity.secondaryTags;
    const base = primary.length === this.#policy.primarySignature.length
      && primary.every((tag, i) => tag === this.#policy.primarySignature[i]) ? this.#policy.misses : 0;
    const usable = reserved ? [...ordinary, reserved] : ordinary;
    const weights = ([0, 1, 2] as const).map(slot => new Map(usable.map(candidate => {
      const { id, choice } = candidate;
      const relevance = matches(id, primary) ? 2 : matches(id, secondary) ? 1 : 0;
      let weight = 100 * (1 + 0.5 * relevance);
      if (slot === 0) {
        weight *= relevance === 2 ? 2 : relevance === 1 ? 1.25 : 1;
        weight *= choice.kind === c.weaponFocus || c.weaponFocus === 'laser' && 'branch' in choice && !isNewMissileChoice(choice)
          || c.weaponFocus === 'missile' && isNewMissileChoice(choice) ? 1.5 : 1;
      } else if (slot === 1 && (id === 'passive.hull' || id === 'passive.thruster')) weight *= 1.5;
      const a = c.build.effectiveStats.combatAnalyzer;
      weight *= relevance === 2 ? 1 + 2 * (a === 0 ? 0 : 1 / (1 + 4 / a)) : 1;
      weight *= relevance === 2 ? 1 + 0.25 * base : 1;
      const k = this.#policy.history.filter(offer => offer.includes(id)).length;
      weight *= 2 ** -k;
      if (!Number.isFinite(weight) || weight < 25 || weight > 3600) throw new RangeError('Invalid Level-Up weight');
      return [id, weight] as const;
    })));
    const completions = new Map<string, readonly RewardCandidate[]>();
    const key = (slot: number, selected: readonly RewardCandidate[]) => `${slot}:${selected.map(c => c.id).join(',')}`;
    // Build every possible completion before drawing. Preferred paths that cannot finish fall back here.
    const preparePool = (slot: 0 | 1 | 2, selected: readonly RewardCandidate[]): readonly RewardCandidate[] => {
      const remaining = remainingOrdinary.filter(c => !selected.some(s => s.id === c.id));
      const preferred = remaining.filter(candidate => slot === 0 ? candidate.choice.kind !== 'passive'
        : slot === 1 ? candidate.choice.kind === 'passive' : !matches(candidate.id, primary));
      const complete = (options: readonly RewardCandidate[]) => options.filter(candidate => slot === 2
        || preparePool((slot + 1) as 1 | 2, [...selected, candidate]).length > 0);
      let options: readonly RewardCandidate[];
      if (slot === 2 && reserved) options = [reserved];
      else {
        options = complete(slot === 0 && acquisitions.length ? acquisitions : preferred);
        if (!options.length) options = complete(preferred);
        if (!options.length) options = complete(remaining);
      }
      const total = options.reduce((n, c) => n + weights[slot].get(c.id)!, 0);
      if (!Number.isFinite(total) || total > 194400) throw new RangeError('Invalid Level-Up pool');
      completions.set(key(slot, selected), options);
      return options;
    };
    if (!preparePool(0, []).length) throw new RangeError('Insufficient feasible prototype reward choices');
    const pool = (slot: 0 | 1 | 2, selected: readonly RewardCandidate[]) => completions.get(key(slot, selected))!;
    return { pool, weights, primary, base, hasRelevant: usable.some(c => matches(c.id, primary)), nextCursor: evolution.nextCursor };
  }
}
