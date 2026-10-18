import type { LaserAttack, DroneAttack } from '../combat/combat';
import type { EnemyArchetype } from './EnemyDefinitions';

export type EnemyDamageSource = Readonly<
  | (Pick<LaserAttack, 'kind' | 'variant'> & { phase: 'DIRECT' })
  | (Pick<DroneAttack, 'kind' | 'variant'> & { phase: 'DIRECT' })
  | { kind: 'MISSILE'; variant: 'BASE'; phase: 'PRIMARY' }
  | { kind: 'MISSILE'; variant: 'CLUSTER'; phase: 'PRIMARY' | 'SATELLITE' }
>;
export type EnemyDeathRecord = Readonly<{
  archetype: EnemyArchetype; isElite: boolean; xpValue: number; x: number; y: number;
  lastDamagingSource: EnemyDamageSource; killSource: EnemyDamageSource;
}>;

function fields(value: unknown, keys: readonly string[]): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Reflect.ownKeys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) {
    throw new RangeError('Invalid enemy death fields');
  }
}
function source(value: unknown): asserts value is EnemyDamageSource {
  fields(value, ['kind', 'variant', 'phase']);
  const valid = value.kind === 'LASER' && (value.variant === 'BASE' || value.variant === 'PRISM') && value.phase === 'DIRECT'
    || value.kind === 'COMBAT_DRONE' && (value.variant === 'BASE' || value.variant === 'TWIN') && value.phase === 'DIRECT'
    || value.kind === 'MISSILE' && (value.variant === 'BASE' || value.variant === 'CLUSTER') && value.phase === 'PRIMARY'
    || value.kind === 'MISSILE' && value.variant === 'CLUSTER' && value.phase === 'SATELLITE';
  if (!valid) throw new RangeError('Invalid enemy damage source');
}

/** A detached value, never an Attack or permission to apply a death. */
export function createEnemyDamageSource(input: EnemyDamageSource): EnemyDamageSource {
  source(input);
  return Object.freeze({ kind: input.kind, variant: input.variant, phase: input.phase }) as EnemyDamageSource;
}

/** Prospective lethal data only: no completed record or gameplay mutation. */
export function validateEnemyDeathRecord(input: EnemyDeathRecord): void {
  fields(input, ['archetype', 'isElite', 'xpValue', 'x', 'y', 'lastDamagingSource', 'killSource']);
  if (!['swarm', 'chaser', 'charger', 'shooter', 'tank', 'boss'].includes(input.archetype)
    || typeof input.isElite !== 'boolean' || (input.isElite && input.archetype !== 'tank')) {
    throw new RangeError('Invalid enemy death identity');
  }
  if (!Number.isSafeInteger(input.xpValue) || input.xpValue <= 0) throw new RangeError('Invalid enemy death XP');
  for (const value of [input.x, input.y]) {
    if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) {
      throw new RangeError('Invalid enemy death position');
    }
  }
  source(input.lastDamagingSource); source(input.killSource);
  if (input.lastDamagingSource.kind !== input.killSource.kind
    || input.lastDamagingSource.variant !== input.killSource.variant
    || input.lastDamagingSource.phase !== input.killSource.phase) throw new RangeError('Mismatched enemy death sources');
}

export function createEnemyDeathRecord(input: EnemyDeathRecord): EnemyDeathRecord {
  validateEnemyDeathRecord(input);
  return Object.freeze({ archetype: input.archetype, isElite: input.isElite, xpValue: input.xpValue,
    x: input.x, y: input.y, lastDamagingSource: createEnemyDamageSource(input.lastDamagingSource),
    killSource: createEnemyDamageSource(input.killSource) });
}
