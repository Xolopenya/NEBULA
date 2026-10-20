import type { BuildSnapshot, EffectiveStats } from '../player/PlayerBuild';
import type { LaserRanks } from '../progression/prismLaser';
import { validateLaser, laserProfile, prepareLaserChoice, isLaserChoice, laserAttack, laserTagCandidate } from '../player/laserProgression';
import { validateMissile, missileProfile, prepareMissileChoice, MISSILE_TAGS } from '../player/missileProgression';
import { missileLaunchPlan } from '../combat/missileFlight';
import { canEvolveTwinDrone } from '../progression/twinDrone';
import type { MissileRanks, DroneRanks } from '../progression/focusedUpgrade';
import { effectiveDroneBoltRadius } from '../progression/replicationMatrix';
import { composePlayerDamage, composePlayerImpact, createAttack } from '../combat/combat';
import { isRewardChoice, isMissileRewardChoice, type LevelUpChoice, type PassiveModule } from './rewardChoices';

export type RewardEligibilityContext = Readonly<{
  build: Readonly<BuildSnapshot>;
  laserRanks: Readonly<LaserRanks>; missileRanks: Readonly<MissileRanks>; droneRanks: Readonly<DroneRanks>;
  moduleLevels: Readonly<Record<PassiveModule, number>>;
  prismEvolved: boolean; clusterEvolved: boolean; twinDroneEvolved: boolean;
  laser: Readonly<{ damage: number; fireInterval: number; projectileSpeed: number }>;
  missile: Readonly<{ damage: number; speed: number; explosionRadius: number }>;
  drone: Readonly<{ damage: number; fireInterval: number; projectileSpeed: number }>;
  magnetRadius: number; combatMultiplier: number;
  hullPreview: Readonly<EffectiveStats> | null; thrusterPreview: Readonly<EffectiveStats> | null;
}>;

function positive(n: number, min = Number.MIN_VALUE): number {
  if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > Number.MAX_SAFE_INTEGER) {
    throw new RangeError('Invalid reward numeric value');
  }
  return n;
}
function integer(n: number): void {
  if (!Number.isSafeInteger(n) || n < 0) throw new RangeError('Invalid reward rank/module level');
}
function increase(n: number, by: number): number {
  const next = positive(n + by);
  if (next <= n) throw new RangeError('Reward increment is not representable');
  return next;
}

/** Compatibility projections are reads of Build, never an independent authority. */
export function assertLaserContext(c: RewardEligibilityContext): void {
  validateLaser(c.build.laser);
  const p = laserProfile(c.build.laser);
  if (Object.keys(c.build.laser.ranks).some(k => c.laserRanks[k as keyof LaserRanks] !== c.build.laser.ranks[k as keyof LaserRanks])
    || c.prismEvolved !== (c.build.laser.form === 'PRISM') || c.laser.damage !== p.damage
    || c.laser.fireInterval !== p.fireInterval || c.laser.projectileSpeed !== p.projectileSpeed) {
    throw new RangeError('Contradictory Laser projection');
  }
}
export function assertMissileContext(c: RewardEligibilityContext): void {
  validateMissile(c.build.missile);
  if (!c.missile || Reflect.ownKeys(c.missile).length !== 3
    || !['damage','speed','explosionRadius'].every(key => Object.hasOwn(c.missile, key))) {
    throw new RangeError('Invalid Missile projection');
  }
  const p = missileProfile(c.build.missile);
  if (Object.keys(c.build.missile.ranks).some(k => c.missileRanks[k as keyof MissileRanks] !== c.build.missile.ranks[k as keyof MissileRanks])
    || c.clusterEvolved !== (c.build.missile.form === 'CLUSTER') || c.missile.damage !== p.damage
    || c.missile.speed !== p.projectileSpeed || c.missile.explosionRadius !== p.explosionRadius) {
    throw new RangeError('Contradictory Missile projection');
  }
}

/** Numeric feasibility only, never an effect applier. Also used for loud acceptance preflight. */
export function assertRewardFeasible(choice: LevelUpChoice, c: RewardEligibilityContext): void {
  if (!isRewardChoice(choice)) throw new RangeError('Invalid reward choice');
  assertFeasible(choice, c);
}
export function assertCombatConsumers(c: RewardEligibilityContext): void { assertFeasible(null, c); }
export function assertRewardContext(c: RewardEligibilityContext): void {
  if (!c?.build?.slots || !c.build.effectiveStats
    || !c.laserRanks || !c.missileRanks || !c.droneRanks || !c.moduleLevels || !c.laser || !c.missile || !c.drone) {
    throw new RangeError('Invalid reward eligibility context');
  }
  assertLaserContext(c);
  assertMissileContext(c);
  const records = [[c.laserRanks, ['power', 'fireRate', 'speed']],
    [c.missileRanks, ['warheadPower', 'propulsion', 'blastExpansion']],
    [c.droneRanks, ['boltPower', 'firingSystem', 'boltPropulsion']],
    [c.moduleLevels, ['hull', 'thruster', 'collector', 'combat', 'spatial', 'replication']]] as const;
  for (const [record, keys] of records) {
    if (typeof record !== 'object' || Array.isArray(record) || Reflect.ownKeys(record).length !== keys.length
      || !keys.every(key => Object.hasOwn(record, key))) {
      throw new RangeError('Invalid reward rank/module shape');
    }
    for (const level of Object.values(record)) integer(level);
  }
  if (![c.prismEvolved, c.clusterEvolved, c.twinDroneEvolved].every(v => typeof v === 'boolean')
    || !Array.isArray(c.build.slots.combat) || c.build.slots.combat.length > 3
    || new Set(c.build.slots.combat).size !== c.build.slots.combat.length
    || c.build.slots.combat.some(id => !['LASER', 'MISSILE', 'COMBAT_DRONE'].includes(id))) {
    throw new RangeError('Invalid reward equipment/evolution context');
  }
  for (const record of [c.laser, c.missile, c.drone]) for (const value of Object.values(record)) positive(value);
  positive(c.magnetRadius); positive(c.combatMultiplier);
  const stats = c.build.effectiveStats;
  if (Reflect.ownKeys(stats).length !== 10 || !['hull', 'thrust', 'reactorPower', 'fireControl',
    'projectileVelocity', 'projectileScale', 'engineering', 'shieldSystems', 'impact', 'combatAnalyzer'].every(key => Object.hasOwn(stats, key))) {
    throw new RangeError('Invalid reward effective stat shape');
  }
  integer(stats.combatAnalyzer);
  for (const [key, value] of Object.entries(stats)) positive(value, key === 'combatAnalyzer' ? 0 : key === 'hull' || key === 'thrust' ? 1 : 0.01);
  if (stats.fireControl > 100) throw new RangeError('Invalid reward Fire Control');
}
function assertFeasible(choice: LevelUpChoice | null, c: RewardEligibilityContext): void {
  assertRewardContext(c);
  const stats = c.build.effectiveStats;
  if (choice?.kind === 'passive') integer(increase(c.moduleLevels[choice.module], 1));
  const laser = isLaserChoice(choice) ? prepareLaserChoice(c.build.laser, choice, c.moduleLevels.combat) : c.build.laser;
  if (isLaserChoice(choice)) laserTagCandidate(c.build.tags, choice);
  const droneDamage = choice?.kind === 'drone' && choice.upgrade === 'boltPower' ? increase(c.drone.damage, 1) : c.drone.damage;
  const droneSpeed = choice?.kind === 'drone' && choice.upgrade === 'boltPropulsion' ? increase(c.drone.projectileSpeed, 200) : c.drone.projectileSpeed;
  const droneInterval = choice?.kind === 'drone' && choice.upgrade === 'firingSystem' ? c.drone.fireInterval - 150 : c.drone.fireInterval;
  const combat = choice?.kind === 'passive' && choice.module === 'combat' ? increase(c.combatMultiplier, 0.25) : c.combatMultiplier;
  const spatial = c.moduleLevels.spatial + Number(choice?.kind === 'passive' && choice.module === 'spatial');
  let missileConfiguration = c.build.missile;
  if (choice && isMissileRewardChoice(choice)) {
    if (!c.build.slots.combat.includes('MISSILE')) throw new RangeError('Missile unavailable');
    missileConfiguration = prepareMissileChoice(c.build.missile, choice, spatial);
    if (choice.kind === 'missileSpecialization') for (const tag of MISSILE_TAGS[choice.branch]) {
      const points = c.build.tags?.[tag];
      integer(points); integer(increase(points, 1));
    }
  }
  {
    const { reactorPower, fireControl, projectileVelocity, projectileScale, engineering, impact } = stats;
    missileLaunchPlan(missileConfiguration, { reactorPower, fireControl, projectileVelocity, projectileScale, engineering, impact },
      { combatMultiplier: combat, spatialLevel: spatial });
  }
  const replication = c.moduleLevels.replication + Number(choice?.kind === 'passive' && choice.module === 'replication');
  if (choice?.kind === 'passive' && choice.module === 'collector') increase(c.magnetRadius, 40);
  if (choice?.kind === 'passive' && (choice.module === 'hull' || choice.module === 'thruster')) {
    const preview = choice.module === 'hull' ? c.hullPreview : c.thrusterPreview;
    if (!preview) throw new RangeError('Infeasible prototype Build reward');
    positive(preview.hull, 1); positive(preview.thrust, 1);
  }
  positive(droneInterval / stats.fireControl, 1);
  laserAttack(laser, stats, combat);
  createAttack({ kind: 'COMBAT_DRONE', variant: c.twinDroneEvolved || choice?.kind === 'twin' ? 'TWIN' : 'BASE', snapshot: {
    damage: composePlayerDamage('COMBAT_DRONE', droneDamage, combat, stats.reactorPower, stats.engineering),
    speed: droneSpeed * stats.projectileVelocity, radius: effectiveDroneBoltRadius(5, replication) * stats.projectileScale,
    lifetime: 1800, impact: composePlayerImpact(160, stats.impact) } });
}

export function isRewardEligible(choice: unknown, c: RewardEligibilityContext): choice is LevelUpChoice {
  if (!isRewardChoice(choice)) return false;
  try { assertRewardFeasible(choice, c); } catch (error) {
    if (error instanceof RangeError) return false;
    throw error;
  }
  const slots = c.build.slots.combat;
  if (isMissileRewardChoice(choice)) return slots.includes('MISSILE');
  if (isLaserChoice(choice)) return slots.includes('LASER');
  if (choice.kind === 'drone') return slots.includes('COMBAT_DRONE') && c.droneRanks[choice.upgrade] < 2;
  if (choice.kind === 'twin') return slots.includes('COMBAT_DRONE') && canEvolveTwinDrone(c.droneRanks, c.moduleLevels.replication, c.twinDroneEvolved);
  return true;
}
