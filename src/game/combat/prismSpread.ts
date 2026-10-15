/** Center, -12 degrees, +12 degrees; suppress the whole volley for near-zero aim. */
export function prismSpread(dx: number, dy: number): { x: number; y: number }[] {
  const distance = Math.hypot(dx, dy);
  if (distance < 0.001) return [];
  const x = dx / distance;
  const y = dy / distance;
  const angle = 12 * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    { x, y },
    { x: x * cos + y * sin, y: y * cos - x * sin },
    { x: x * cos - y * sin, y: y * cos + x * sin },
  ];
}
