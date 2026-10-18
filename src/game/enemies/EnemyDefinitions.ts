export type EnemyArchetype = 'chaser' | 'shooter' | 'tank' | 'boss';
export type PursuitMovement = Readonly<{ kind: 'PURSUIT'; speed: number }>;
export type ShooterMovement = Readonly<{
  kind: 'SHOOTER_BAND'; speed: number; minimumRange: number; maximumRange: number;
}>;
export type WardenMovement = Readonly<{
  kind: 'WARDEN_PURSUIT'; speed: number; phaseTwoSpeed: number;
}>;
export type EnemyNumbers = Readonly<{
  maxHealth: number; collisionRadius: number; contactDamage: number; xpValue: number;
}>;
export type EnemyDefinition = Readonly<EnemyNumbers & (
  { archetype: 'chaser' | 'tank'; movement: PursuitMovement }
  | { archetype: 'shooter'; movement: ShooterMovement }
  | { archetype: 'boss'; movement: WardenMovement }
)>;
export type EnemyScalingProfile = Readonly<{ kind: 'LEGACY_NEUTRAL' }>;
export type EnemySpawnContext = Readonly<{
  scalingProfile: EnemyScalingProfile; variant: 'BASE' | 'ELITE_TANK';
}>;
export type EnemySpawnSnapshot = Readonly<EnemyDefinition & { isElite: boolean }>;

export const ENEMY_DEFINITIONS = Object.freeze({
  chaser: Object.freeze({ archetype: 'chaser', maxHealth: 3, collisionRadius: 24, contactDamage: 1, xpValue: 1,
    movement: Object.freeze({ kind: 'PURSUIT', speed: 180 }) }),
  shooter: Object.freeze({ archetype: 'shooter', maxHealth: 2, collisionRadius: 24, contactDamage: 1, xpValue: 1,
    movement: Object.freeze({ kind: 'SHOOTER_BAND', speed: 140, minimumRange: 350, maximumRange: 500 }) }),
  tank: Object.freeze({ archetype: 'tank', maxHealth: 6, collisionRadius: 24, contactDamage: 1, xpValue: 1,
    movement: Object.freeze({ kind: 'PURSUIT', speed: 100 }) }),
  boss: Object.freeze({ archetype: 'boss', maxHealth: 60, collisionRadius: 40, contactDamage: 2, xpValue: 10,
    movement: Object.freeze({ kind: 'WARDEN_PURSUIT', speed: 70, phaseTwoSpeed: 100 }) }),
} satisfies Record<EnemyArchetype, EnemyDefinition>);

export const ELITE_TANK_PROFILE = Object.freeze({ maxHealth: 18, speed: 120, contactDamage: 2, xpValue: 5 });
export const LEGACY_NEUTRAL_SCALING_PROFILE: EnemyScalingProfile = Object.freeze({ kind: 'LEGACY_NEUTRAL' });
export const DEFAULT_ENEMY_SPAWN_CONTEXT: EnemySpawnContext = Object.freeze({
  scalingProfile: LEGACY_NEUTRAL_SCALING_PROFILE, variant: 'BASE',
});

function record(value: unknown, keys: readonly string[]): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new RangeError('Invalid enemy record');
  const actual = Reflect.ownKeys(value);
  if (actual.length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) {
    throw new RangeError('Invalid enemy record fields');
  }
}

function positive(value: unknown): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > Number.MAX_SAFE_INTEGER) {
    throw new RangeError('Invalid enemy number');
  }
}

function validateEnemy(value: unknown, snapshot = false): asserts value is EnemyDefinition {
  const keys = ['archetype', 'maxHealth', 'collisionRadius', 'contactDamage', 'xpValue', 'movement'];
  record(value, snapshot ? [...keys, 'isElite'] : keys);
  for (const key of ['maxHealth', 'collisionRadius', 'contactDamage', 'xpValue']) positive(value[key]);
  if (!Number.isSafeInteger(value.xpValue)) throw new RangeError('Invalid enemy XP');
  const movement = value.movement;
  switch (value.archetype) {
    case 'chaser': case 'tank':
      record(movement, ['kind', 'speed']);
      if (movement.kind !== 'PURSUIT') throw new RangeError('Invalid pursuit movement');
      break;
    case 'shooter':
      record(movement, ['kind', 'speed', 'minimumRange', 'maximumRange']);
      if (movement.kind !== 'SHOOTER_BAND') throw new RangeError('Invalid shooter movement');
      positive(movement.minimumRange); positive(movement.maximumRange);
      if (movement.minimumRange >= movement.maximumRange) throw new RangeError('Invalid shooter band');
      break;
    case 'boss':
      record(movement, ['kind', 'speed', 'phaseTwoSpeed']);
      if (movement.kind !== 'WARDEN_PURSUIT') throw new RangeError('Invalid Warden movement');
      positive(movement.phaseTwoSpeed);
      break;
    default: throw new RangeError('Invalid enemy archetype');
  }
  positive(movement.speed);
  if (snapshot && (typeof value.isElite !== 'boolean' || (value.isElite && value.archetype !== 'tank'))) {
    throw new RangeError('Invalid enemy Elite pairing');
  }
}

export function createEnemySpawnSnapshot(
  definition: EnemyDefinition, context: EnemySpawnContext,
): EnemySpawnSnapshot {
  validateEnemy(definition);
  record(context, ['scalingProfile', 'variant']);
  record(context.scalingProfile, ['kind']);
  if (context.scalingProfile.kind !== 'LEGACY_NEUTRAL') throw new RangeError('Unsupported enemy scaling');
  if (context.variant !== 'BASE' && context.variant !== 'ELITE_TANK') throw new RangeError('Invalid enemy variant');
  const isElite = context.variant === 'ELITE_TANK';
  if (isElite && definition.archetype !== 'tank') throw new RangeError('Elite requires Tank');
  // Neutral scaling performs no arithmetic. Elite is a fixed authored override.
  const numbers: EnemyNumbers = {
    maxHealth: isElite ? ELITE_TANK_PROFILE.maxHealth : definition.maxHealth,
    collisionRadius: definition.collisionRadius,
    contactDamage: isElite ? ELITE_TANK_PROFILE.contactDamage : definition.contactDamage,
    xpValue: isElite ? ELITE_TANK_PROFILE.xpValue : definition.xpValue,
  };
  let snapshot: EnemySpawnSnapshot;
  switch (definition.archetype) {
    case 'chaser': case 'tank':
      snapshot = { ...numbers, archetype: definition.archetype, isElite,
        movement: { kind: 'PURSUIT', speed: isElite ? ELITE_TANK_PROFILE.speed : definition.movement.speed } };
      break;
    case 'shooter':
      snapshot = { ...numbers, archetype: 'shooter', isElite,
        movement: { kind: 'SHOOTER_BAND', speed: definition.movement.speed,
          minimumRange: definition.movement.minimumRange, maximumRange: definition.movement.maximumRange } };
      break;
    case 'boss':
      snapshot = { ...numbers, archetype: 'boss', isElite,
        movement: { kind: 'WARDEN_PURSUIT', speed: definition.movement.speed,
          phaseTwoSpeed: definition.movement.phaseTwoSpeed } };
      break;
  }
  validateEnemy(snapshot, true);
  Object.freeze(snapshot.movement);
  return Object.freeze(snapshot);
}
