import { createAttack, composePlayerImpact, type MissileAttack } from './combat';
import { ENEMY_DEFINITIONS } from '../enemies/EnemyDefinitions';
import { composeMissileProfile, type MissileConfiguration, type MissileShipStats,
  type MissileCompositionContext } from '../player/missileProgression';

export type MissileLaunchPlan = Readonly<{ attack: MissileAttack } & (
  { form: 'BASE' | 'HEAVY'; behavior: 'STRAIGHT' }
  | { form: 'CLUSTER'; behavior: 'HOMING' }
  | { form: 'GUIDANCE'; behavior: 'HOMING_FUSE'; fuseDistance: number; detonateOnExpiry: boolean }
  | { form: 'FRAGMENTATION'; behavior: 'STRAIGHT_FRAGMENTING'; childCount: 4 | 6 | 8; childAttack: MissileAttack }
)>;

/** Closed copied flight data only; never retains Build, target, run or position. */
export function copyMissileLaunchPlan(plan: MissileLaunchPlan): MissileLaunchPlan {
  if (!plan || typeof plan !== 'object') throw new RangeError('Invalid Missile plan');
  const fields = plan.behavior === 'HOMING_FUSE' ? ['attack', 'form', 'behavior', 'fuseDistance', 'detonateOnExpiry']
    : plan.behavior === 'STRAIGHT_FRAGMENTING' ? ['attack', 'form', 'behavior', 'childCount', 'childAttack'] : ['attack', 'form', 'behavior'];
  if (Reflect.ownKeys(plan).length !== fields.length || fields.some(key => {
    const d = Object.getOwnPropertyDescriptor(plan, key); return !d?.enumerable || !('value' in d);
  })) throw new RangeError('Invalid Missile plan shape');
  const attack = createAttack(plan.attack);
  if (attack.kind !== 'MISSILE') throw new RangeError('Missile plan requires Missile Attack');
  for (const enemy of Object.values(ENEMY_DEFINITIONS)) composePlayerImpact(attack.snapshot.impact, enemy.interaction.knockbackResponse);
  if (plan.form === 'CLUSTER' && plan.behavior === 'HOMING' && attack.variant === 'CLUSTER') {
    return Object.freeze({ form: plan.form, behavior: plan.behavior, attack });
  }
  if (attack.variant !== 'BASE') throw new RangeError('Invalid Missile plan variant');
  if ((plan.form === 'BASE' || plan.form === 'HEAVY') && plan.behavior === 'STRAIGHT') {
    return Object.freeze({ form: plan.form, behavior: plan.behavior, attack });
  }
  if (plan.form === 'GUIDANCE' && plan.behavior === 'HOMING_FUSE' && typeof plan.detonateOnExpiry === 'boolean'
    && Number.isFinite(plan.fuseDistance) && plan.fuseDistance > 0 && plan.fuseDistance <= attack.snapshot.explosionRadius * .75) {
    return Object.freeze({ form: plan.form, behavior: plan.behavior, attack,
      fuseDistance: plan.fuseDistance, detonateOnExpiry: plan.detonateOnExpiry });
  }
  if (plan.form === 'FRAGMENTATION' && plan.behavior === 'STRAIGHT_FRAGMENTING' && [4, 6, 8].includes(plan.childCount)) {
    const childAttack = createAttack(plan.childAttack);
    if (childAttack.kind !== 'MISSILE' || childAttack.variant !== 'BASE') throw new RangeError('Invalid Missile child Attack');
    for (const enemy of Object.values(ENEMY_DEFINITIONS)) composePlayerImpact(childAttack.snapshot.impact, enemy.interaction.knockbackResponse);
    return Object.freeze({ form: plan.form, behavior: plan.behavior, attack, childCount: plan.childCount, childAttack });
  }
  throw new RangeError('Invalid Missile flight behavior');
}

export function missileLaunchPlan(config: MissileConfiguration, stats: MissileShipStats, context: MissileCompositionContext): MissileLaunchPlan {
  const p = composeMissileProfile(config, stats, context);
  const attack = createAttack({ kind: 'MISSILE', variant: config.form === 'CLUSTER' ? 'CLUSTER' : 'BASE', snapshot: p.parent }) as MissileAttack;
  if (config.form === 'GUIDANCE') return copyMissileLaunchPlan({ form: config.form, behavior: 'HOMING_FUSE', attack,
    fuseDistance: p.fuseDistance, detonateOnExpiry: p.detonateOnExpiry });
  if (config.form === 'CLUSTER') return copyMissileLaunchPlan({ form: config.form, behavior: 'HOMING', attack });
  if (config.form === 'FRAGMENTATION' && p.fragments) return copyMissileLaunchPlan({ form: config.form, behavior: 'STRAIGHT_FRAGMENTING', attack,
    childCount: p.fragments.count, childAttack: createAttack({ kind: 'MISSILE', variant: 'BASE', snapshot: p.fragments.values }) as MissileAttack });
  if (config.form !== 'BASE' && config.form !== 'HEAVY') throw new RangeError('Invalid Missile form');
  return copyMissileLaunchPlan({ form: config.form, behavior: 'STRAIGHT', attack });
}

export function missileGeometry(...values: number[]): void {
  if (values.some(value => typeof value !== 'number' || !Number.isFinite(value))) throw new RangeError('Invalid Missile geometry');
}

/** Strict sum-of-collision-radii boundary: tangency is still excluded. */
export function missileSeparated(x: number, y: number, radius: number, enemyX: number, enemyY: number, enemyRadius: number): boolean {
  missileGeometry(x, y, radius, enemyX, enemyY, enemyRadius);
  if (radius <= 0 || enemyRadius <= 0) throw new RangeError('Invalid Missile collision radius');
  const dx = x - enemyX, dy = y - enemyY, combined = radius + enemyRadius;
  const distanceSquared = dx * dx + dy * dy, radiusSquared = combined * combined;
  missileGeometry(distanceSquared, radiusSquared);
  return distanceSquared > radiusSquared;
}
