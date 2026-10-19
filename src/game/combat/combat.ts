import type { IncomingDefenseResult } from '../player/PlayerDefense';

export type FlightSnapshot = Readonly<{ damage: number; speed: number; radius: number; lifetime: number }>;
export type PlayerFlightSnapshot = Readonly<FlightSnapshot & { impact: number }>;
export type MissileSnapshot = Readonly<PlayerFlightSnapshot & { explosionRadius: number }>;
export type ContactSnapshot = Readonly<{ damage: number }>;
export type LaserMechanics = Readonly<{ pattern: 'SCATTER' | 'REPEATER' | 'LANCE'; maxHits: number; pelletCount: number }>;
export type LaserAttack = Readonly<{ kind: 'LASER'; variant: 'BASE' | 'PRISM'; snapshot: PlayerFlightSnapshot;
  mechanics?: LaserMechanics }>;
export type MissileAttack = Readonly<{ kind: 'MISSILE'; variant: 'BASE' | 'CLUSTER'; snapshot: MissileSnapshot }>;
export type DroneAttack = Readonly<{ kind: 'COMBAT_DRONE'; variant: 'BASE' | 'TWIN'; snapshot: PlayerFlightSnapshot }>;
export type HostileAttack = Readonly<{ kind: 'HOSTILE_PROJECTILE'; snapshot: FlightSnapshot }>;
export type ContactAttack = Readonly<{ kind: 'ENEMY_CONTACT'; snapshot: ContactSnapshot }>;
export type Attack = LaserAttack | MissileAttack | DroneAttack | HostileAttack | ContactAttack;
export type AttackSnapshot = Attack['snapshot'];
export type PlayerAttackSource = Pick<LaserAttack, 'kind' | 'variant'> | Pick<MissileAttack, 'kind' | 'variant'>
  | Pick<DroneAttack, 'kind' | 'variant'>;
export type AttackSource = PlayerAttackSource | Pick<HostileAttack, 'kind'> | Pick<ContactAttack, 'kind'>;
export type HitPhase = 'DIRECT' | 'PRIMARY' | 'SATELLITE' | 'CONTACT';
export type EnemyDamage = Readonly<{ target: 'ENEMY'; calculatedDamage: number; healthAfter: number;
  hpLost: number; healthDepleted: boolean }>;
export type PlayerDamage = Readonly<{ target: 'PLAYER'; calculatedDamage: number; defense: IncomingDefenseResult }>;
export type Damage = EnemyDamage | PlayerDamage;

function positive(value: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > Number.MAX_SAFE_INTEGER) {
    throw new RangeError('Invalid combat value');
  }
  return value;
}

/** Copy only authored primitive launch values; no caller-owned objects survive. */
export function createAttack(input: Attack): Attack {
  if (!input || typeof input !== 'object') throw new RangeError('Invalid Attack');
  const { kind } = input;
  let mechanics: LaserMechanics | undefined;
  if ('mechanics' in input) {
    if (kind !== 'LASER' || input.variant !== 'BASE') throw new RangeError('Laser-only mechanics');
    const m = input.mechanics;
    if (!m || Reflect.ownKeys(m).length !== 3 || !['pattern', 'maxHits', 'pelletCount'].every(k => Object.hasOwn(m, k))
      || !(m.pattern === 'SCATTER' && m.maxHits === 1 && [3, 5].includes(m.pelletCount)
        || m.pattern === 'REPEATER' && m.maxHits === 1 && m.pelletCount === 1
        || m.pattern === 'LANCE' && [3, 4, 5].includes(m.maxHits) && m.pelletCount === 1)) throw new RangeError('Invalid Laser mechanics');
    mechanics = Object.freeze({ ...m });
  }
  const playerKind = kind === 'LASER' || kind === 'MISSILE' || kind === 'COMBAT_DRONE';
  if (playerKind) {
    const evolved = kind === 'LASER' ? 'PRISM' : kind === 'MISSILE' ? 'CLUSTER' : 'TWIN';
    if (input.variant !== 'BASE' && input.variant !== evolved) throw new RangeError('Invalid Attack variant');
  } else if ((kind !== 'HOSTILE_PROJECTILE' && kind !== 'ENEMY_CONTACT') || 'variant' in input) {
    throw new RangeError('Invalid Attack kind/variant');
  }
  const snapshot = input.snapshot;
  const fields = kind === 'ENEMY_CONTACT' ? ['damage']
    : kind === 'MISSILE' ? ['damage', 'speed', 'radius', 'lifetime', 'impact', 'explosionRadius']
      : playerKind ? ['damage', 'speed', 'radius', 'lifetime', 'impact'] : ['damage', 'speed', 'radius', 'lifetime'];
  if (!snapshot || typeof snapshot !== 'object' || Reflect.ownKeys(snapshot).length !== fields.length
    || !fields.every(field => Object.hasOwn(snapshot, field))) throw new RangeError('Invalid Attack snapshot shape');
  const damage = positive(snapshot.damage);
  if (kind === 'ENEMY_CONTACT') return Object.freeze({ kind, snapshot: Object.freeze({ damage }) });
  const flight = { damage, speed: positive(input.snapshot.speed), radius: positive(input.snapshot.radius),
    lifetime: positive(input.snapshot.lifetime) };
  if (input.kind === 'HOSTILE_PROJECTILE') return Object.freeze({ kind: input.kind, snapshot: Object.freeze(flight) });
  const playerFlight = { ...flight, impact: forceValue(input.snapshot.impact) };
  if (input.kind === 'MISSILE') {
    if (input.variant === 'CLUSTER') { positive(damage * 0.5); composePlayerImpact(playerFlight.impact, 0.5); }
    return Object.freeze({ kind: input.kind, variant: input.variant,
      snapshot: Object.freeze({ ...playerFlight, explosionRadius: positive(input.snapshot.explosionRadius) }) });
  }
  if (input.kind === 'LASER') return Object.freeze({ kind: input.kind, variant: input.variant,
    ...(mechanics ? { mechanics } : {}), snapshot: Object.freeze(playerFlight) });
  return Object.freeze({ kind: input.kind, variant: input.variant, snapshot: Object.freeze(playerFlight) });
}

function forceValue(value: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) {
    throw new RangeError('Invalid impact value');
  }
  return value;
}

/** Used by all three concrete player launch paths; explicit zero means no force. */
export function composePlayerImpact(localImpact: number, shipImpact: number): number {
  forceValue(localImpact); forceValue(shipImpact);
  const result = forceValue(localImpact * shipImpact);
  if (localImpact !== 0 && shipImpact !== 0 && result === 0) throw new RangeError('Impact underflow');
  return result;
}

export function composePlayerDamage(system: PlayerAttackSource['kind'], localDamage: number,
  combatMultiplier: number, reactorPower: number, engineering: number): number {
  positive(localDamage); positive(combatMultiplier); positive(reactorPower); positive(engineering);
  if (system !== 'LASER' && system !== 'MISSILE' && system !== 'COMBAT_DRONE') throw new RangeError('Invalid player system');
  // Preserve left-to-right arithmetic; only the final product has the authored bound.
  const damage = (localDamage * combatMultiplier) * reactorPower;
  return positive(system === 'COMBAT_DRONE' ? damage * engineering : damage);
}

export function calculateHitDamage(attack: Attack, phase: HitPhase): number {
  if ((phase === 'DIRECT' && (attack.kind === 'LASER' || attack.kind === 'COMBAT_DRONE' || attack.kind === 'HOSTILE_PROJECTILE'))
    || (phase === 'PRIMARY' && attack.kind === 'MISSILE') || (phase === 'CONTACT' && attack.kind === 'ENEMY_CONTACT')) {
    return positive(attack.snapshot.damage);
  }
  if (phase === 'SATELLITE' && attack.kind === 'MISSILE' && attack.variant === 'CLUSTER') {
    return positive(attack.snapshot.damage * 0.5);
  }
  throw new RangeError('Invalid Attack/Hit phase');
}

export function calculateEnemyDamage(currentHealth: number, calculatedDamage: number): EnemyDamage {
  positive(currentHealth); positive(calculatedDamage);
  const healthAfter = currentHealth - calculatedDamage;
  return { target: 'ENEMY', calculatedDamage, healthAfter,
    hpLost: currentHealth - Math.max(0, healthAfter), healthDepleted: healthAfter <= 0 };
}
