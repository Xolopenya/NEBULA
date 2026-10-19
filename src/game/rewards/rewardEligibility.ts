import type { BuildSnapshot, EffectiveStats } from '../player/PlayerBuild';
import type { LaserRanks } from '../progression/prismLaser';
import { canEvolvePrismLaser } from '../progression/prismLaser';
import { canEvolveClusterMissile } from '../progression/clusterMissile';
import { canEvolveTwinDrone } from '../progression/twinDrone';
import type { MissileRanks, DroneRanks } from '../progression/focusedUpgrade';
import { effectiveMissileExplosionRadius } from '../progression/spatialAmplifier';
import { effectiveDroneBoltRadius } from '../progression/replicationMatrix';
import { composePlayerDamage, composePlayerImpact, createAttack } from '../combat/combat';
import { isRewardChoice, type LevelUpChoice, type PassiveModule } from './rewardChoices';

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

/** Numeric feasibility only, never an effect applier. Also used for loud acceptance preflight. */
export function assertRewardFeasible(choice: LevelUpChoice, c: RewardEligibilityContext): void {
  if (!isRewardChoice(choice) || !c?.build?.slots || !c.build.effectiveStats
    || !c.laserRanks || !c.missileRanks || !c.droneRanks || !c.moduleLevels || !c.laser || !c.missile || !c.drone) {
    throw new RangeError('Invalid reward eligibility context');
  }
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
  if (choice.kind === 'passive') integer(increase(c.moduleLevels[choice.module], 1));
  const laserDamage = choice.kind === 'laser' && choice.upgrade === 'power' ? increase(c.laser.damage, 1) : c.laser.damage;
  const laserSpeed = choice.kind === 'laser' && choice.upgrade === 'speed' ? increase(c.laser.projectileSpeed, 200) : c.laser.projectileSpeed;
  const laserInterval = choice.kind === 'laser' && choice.upgrade === 'fireRate' ? Math.max(100, c.laser.fireInterval - 50) : c.laser.fireInterval;
  const missileDamage = choice.kind === 'missile' && choice.upgrade === 'warheadPower' ? increase(c.missile.damage, 1) : c.missile.damage;
  const missileSpeed = choice.kind === 'missile' && choice.upgrade === 'propulsion' ? increase(c.missile.speed, 75) : c.missile.speed;
  const missileRadius = choice.kind === 'missile' && choice.upgrade === 'blastExpansion' ? increase(c.missile.explosionRadius, 30) : c.missile.explosionRadius;
  const droneDamage = choice.kind === 'drone' && choice.upgrade === 'boltPower' ? increase(c.drone.damage, 1) : c.drone.damage;
  const droneSpeed = choice.kind === 'drone' && choice.upgrade === 'boltPropulsion' ? increase(c.drone.projectileSpeed, 200) : c.drone.projectileSpeed;
  const droneInterval = choice.kind === 'drone' && choice.upgrade === 'firingSystem' ? c.drone.fireInterval - 150 : c.drone.fireInterval;
  const combat = choice.kind === 'passive' && choice.module === 'combat' ? increase(c.combatMultiplier, 0.25) : c.combatMultiplier;
  const spatial = c.moduleLevels.spatial + Number(choice.kind === 'passive' && choice.module === 'spatial');
  const replication = c.moduleLevels.replication + Number(choice.kind === 'passive' && choice.module === 'replication');
  if (choice.kind === 'passive' && choice.module === 'collector') increase(c.magnetRadius, 40);
  if (choice.kind === 'passive' && (choice.module === 'hull' || choice.module === 'thruster')) {
    const preview = choice.module === 'hull' ? c.hullPreview : c.thrusterPreview;
    if (!preview) throw new RangeError('Infeasible prototype Build reward');
    positive(preview.hull, 1); positive(preview.thrust, 1);
  }
  positive(laserInterval / stats.fireControl, 1);
  positive(1800 / stats.fireControl, 1);
  positive(droneInterval / stats.fireControl, 1);
  createAttack({ kind: 'LASER', variant: c.prismEvolved || choice.kind === 'prism' ? 'PRISM' : 'BASE', snapshot: {
    damage: composePlayerDamage('LASER', laserDamage, combat, stats.reactorPower, stats.engineering),
    speed: laserSpeed * stats.projectileVelocity, radius: 6 * stats.projectileScale, lifetime: 2000,
    impact: composePlayerImpact(200, stats.impact) } });
  createAttack({ kind: 'MISSILE', variant: c.clusterEvolved || choice.kind === 'cluster' ? 'CLUSTER' : 'BASE', snapshot: {
    damage: composePlayerDamage('MISSILE', missileDamage, combat, stats.reactorPower, stats.engineering),
    speed: missileSpeed * stats.projectileVelocity, radius: 8 * stats.projectileScale, lifetime: 4000,
    explosionRadius: effectiveMissileExplosionRadius(missileRadius, spatial), impact: composePlayerImpact(400, stats.impact) } });
  createAttack({ kind: 'COMBAT_DRONE', variant: c.twinDroneEvolved || choice.kind === 'twin' ? 'TWIN' : 'BASE', snapshot: {
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
  if (choice.kind === 'laser') return slots.includes('LASER') && c.laserRanks[choice.upgrade] < 2;
  if (choice.kind === 'missile') return slots.includes('MISSILE') && c.missileRanks[choice.upgrade] < 2;
  if (choice.kind === 'drone') return slots.includes('COMBAT_DRONE') && c.droneRanks[choice.upgrade] < 2;
  if (choice.kind === 'prism') return slots.includes('LASER') && canEvolvePrismLaser(c.laserRanks, c.moduleLevels.combat, c.prismEvolved);
  if (choice.kind === 'cluster') return slots.includes('MISSILE') && canEvolveClusterMissile(c.missileRanks, c.moduleLevels.spatial, c.clusterEvolved);
  if (choice.kind === 'twin') return slots.includes('COMBAT_DRONE') && canEvolveTwinDrone(c.droneRanks, c.moduleLevels.replication, c.twinDroneEvolved);
  return true;
}
