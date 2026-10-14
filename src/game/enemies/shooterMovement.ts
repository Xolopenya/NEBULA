/** World-space step toward the inclusive preferred band; coincident retreat goes right. */
export function shooterMovement(
  dx: number, dy: number, speed: number, delta: number, minimumRange: number, maximumRange: number,
): { x: number; y: number } {
  const distance = Math.hypot(dx, dy);
  if (distance >= minimumRange && distance <= maximumRange) return { x: 0, y: 0 };
  const step = Math.min(speed * delta / 1000,
    distance > maximumRange ? distance - maximumRange : minimumRange - distance);
  if (distance === 0) return { x: step, y: 0 };
  const direction = distance > maximumRange ? 1 : -1;
  return { x: dx / distance * step * direction, y: dy / distance * step * direction };
}
