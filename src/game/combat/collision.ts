// Return the first segment-circle intersection in [0, 1], or Infinity for a miss.
export function segmentCircleHitTime(
  startX: number, startY: number, stepX: number, stepY: number,
  circleX: number, circleY: number, combinedRadius: number,
): number {
  const dx = startX - circleX;
  const dy = startY - circleY;
  const c = dx * dx + dy * dy - combinedRadius * combinedRadius;
  if (c <= 0) return 0;
  const a = stepX * stepX + stepY * stepY;
  if (a === 0) return Infinity;
  const b = dx * stepX + dy * stepY;
  const discriminant = b * b - a * c;
  if (discriminant < 0) return Infinity;
  const hit = (-b - Math.sqrt(discriminant)) / a;
  return hit >= 0 && hit <= 1 ? hit : Infinity;
}
