import type { ChargerMovement } from './EnemyDefinitions';
import { segmentCircleHitTime } from '../combat/collision';
import { knockbackDirection, type Vector } from './knockback';

export type ChargerState = Readonly<{
  phase: 'APPROACH' | 'WINDUP' | 'CHARGING' | 'RECOVERY';
  remainingMs: number; directionX: number; directionY: number;
}>;
export type ChargerBounds = Readonly<{ minX: number; maxX: number; minY: number; maxY: number }>;

export function initialChargerState(): ChargerState {
  return { phase: 'APPROACH', remainingMs: 0, directionX: 1, directionY: 0 };
}

function number(value: number, minimum = -Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > Number.MAX_SAFE_INTEGER) {
    throw new RangeError('Invalid Charger number');
  }
  return value;
}

function validate(state: ChargerState, movement: ChargerMovement): void {
  if (movement.kind !== 'CHARGER') throw new RangeError('Invalid Charger movement');
  for (const value of [movement.speed, movement.triggerRange, movement.windupMs,
    movement.chargeSpeed, movement.chargeMs, movement.recoveryMs]) number(value, Number.MIN_VALUE);
  number(state.directionX); number(state.directionY); number(state.remainingMs, 0);
  if (Math.abs(Math.hypot(state.directionX, state.directionY) - 1) > 8 * Number.EPSILON) {
    throw new RangeError('Invalid Charger direction');
  }
  const duration = state.phase === 'WINDUP' ? movement.windupMs
    : state.phase === 'CHARGING' ? movement.chargeMs : state.phase === 'RECOVERY' ? movement.recoveryMs : 0;
  if (state.phase === 'APPROACH' ? state.remainingMs !== 0
    : !duration || state.remainingMs <= 0 || state.remainingMs > duration) throw new RangeError('Invalid Charger phase');
}

/** One current charge cycle at most; residual time approaches, rearming next update. */
export function stepCharger(position: Vector, player: Vector, previous: ChargerState, movement: ChargerMovement,
  bounds: ChargerBounds, deltaMs: number): { position: Vector; state: ChargerState; contact: Vector | null } {
  validate(previous, movement); number(deltaMs, 0);
  for (const value of [position.x, position.y, player.x, player.y, bounds.minX, bounds.maxX, bounds.minY, bounds.maxY]) number(value);
  if (bounds.minX >= bounds.maxX || bounds.minY >= bounds.maxY
    || position.x < bounds.minX || position.x > bounds.maxX || position.y < bounds.minY || position.y > bounds.maxY) {
    throw new RangeError('Invalid Charger bounds');
  }
  let state = { ...previous };
  let x = position.x, y = position.y, remaining = deltaMs;
  let contact: Vector | null = null;
  const aim = () => knockbackDirection(number(player.x - x), number(player.y - y));
  const track = () => { const direction = aim(); state.directionX = direction.x; state.directionY = direction.y; };
  const approach = (): boolean => {
    const dx = number(player.x - x), dy = number(player.y - y);
    const distance = number(Math.hypot(dx, dy), 0);
    const gap = Math.max(0, distance - movement.triggerRange);
    const secondsToRange = gap / movement.speed;
    const reachesRange = remaining / 1000 >= secondsToRange;
    const step = reachesRange ? gap : number(movement.speed * (remaining / 1000), 0);
    if (distance > 0) { x = number(x + dx / distance * step); y = number(y + dy / distance * step); }
    x = Math.max(bounds.minX, Math.min(bounds.maxX, x));
    y = Math.max(bounds.minY, Math.min(bounds.maxY, y));
    remaining = reachesRange ? Math.max(0, remaining - secondsToRange * 1000) : 0;
    track();
    return reachesRange;
  };
  if (remaining === 0) return { position: { x, y }, state, contact };
  if (state.phase === 'APPROACH') {
    if (!approach()) return { position: { x, y }, state, contact };
    state.phase = 'WINDUP'; state.remainingMs = movement.windupMs;
  }
  // Four bounded concrete phases, never a loop proportional to delta.
  if (state.phase === 'WINDUP') {
    track();
    const consumed = Math.min(remaining, state.remainingMs);
    remaining -= consumed; state.remainingMs -= consumed;
    if (state.remainingMs === 0) { state.phase = 'CHARGING'; state.remainingMs = movement.chargeMs; }
  }
  if (state.phase === 'CHARGING') {
    const consumed = Math.min(remaining, state.remainingMs);
    const step = number(movement.chargeSpeed * (consumed / 1000), 0);
    const nextX = Math.max(bounds.minX, Math.min(bounds.maxX, number(x + state.directionX * step)));
    const nextY = Math.max(bounds.minY, Math.min(bounds.maxY, number(y + state.directionY * step)));
    if (consumed > 0) {
      const t = segmentCircleHitTime(x, y, nextX - x, nextY - y, player.x, player.y, 42);
      if (t !== Infinity) contact = { x: x + (nextX - x) * t, y: y + (nextY - y) * t };
    }
    x = nextX; y = nextY;
    remaining -= consumed; state.remainingMs -= consumed;
    if (state.remainingMs === 0) { state.phase = 'RECOVERY'; state.remainingMs = movement.recoveryMs; }
  }
  if (state.phase === 'RECOVERY') {
    const consumed = Math.min(remaining, state.remainingMs);
    remaining -= consumed; state.remainingMs -= consumed;
    if (state.remainingMs === 0) {
      state.phase = 'APPROACH';
      if (remaining > 0) approach();
    }
  }
  validate(state, movement);
  return { position: { x, y }, state, contact };
}
