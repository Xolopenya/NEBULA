export type Vector = Readonly<{ x: number; y: number }>;
const maximumSpeed = 600;
const deceleration = 1200;
const tolerance = 8 * Number.EPSILON;

function bounded(value: number, minimum = -Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > Number.MAX_SAFE_INTEGER) {
    throw new RangeError('Invalid knockback number');
  }
  return value;
}

export function knockbackDirection(x: number, y: number): Vector {
  bounded(x); bounded(y);
  const length = Math.hypot(x, y);
  return length === 0 ? { x: 1, y: 0 } : { x: x / length, y: y / length };
}

function velocity(value: Vector): number {
  bounded(value.x); bounded(value.y);
  const length = Math.hypot(value.x, value.y);
  if (length > maximumSpeed + tolerance * maximumSpeed) throw new RangeError('Invalid stored knockback velocity');
  return length;
}

/** Validate the uncapped strength first; cap the vector SUM, preserving cancellation. */
export function withKnockbackImpulse(current: Vector, unit: Vector, magnitude: number): Vector {
  velocity(current); bounded(magnitude, 0); bounded(unit.x); bounded(unit.y);
  if (Math.abs(Math.hypot(unit.x, unit.y) - 1) > tolerance) throw new RangeError('Invalid impulse direction');
  if (magnitude === 0) return { ...current };
  const q = Math.max(1, magnitude, Math.abs(current.x), Math.abs(current.y));
  const x = current.x / q + unit.x * (magnitude / q);
  const y = current.y / q + unit.y * (magnitude / q);
  const length = Math.hypot(x, y);
  if (length === 0) return { x: 0, y: 0 };
  return length > maximumSpeed / q
    ? { x: x / length * maximumSpeed, y: y / length * maximumSpeed }
    : { x: x * q, y: y * q };
}

/** Analytically integrate linear speed decay once per active movement update. */
export function stepKnockback(current: Vector, deltaMs: number): { velocity: Vector; displacement: Vector } {
  const speed = velocity(current);
  bounded(deltaMs, 0);
  const dt = deltaMs / 1000;
  if (dt === 0) return { velocity: { ...current }, displacement: { x: 0, y: 0 } };
  if (speed === 0) return { velocity: { x: 0, y: 0 }, displacement: { x: 0, y: 0 } };
  const stopTime = speed / deceleration;
  const t = Math.min(dt, stopTime);
  const distance = speed * t - 0.5 * deceleration * t * t;
  const nextSpeed = dt >= stopTime ? 0 : speed - deceleration * dt;
  const unit = { x: current.x / speed, y: current.y / speed };
  return { velocity: nextSpeed === 0 ? { x: 0, y: 0 } : { x: unit.x * nextSpeed, y: unit.y * nextSpeed },
    displacement: { x: unit.x * distance, y: unit.y * distance } };
}
