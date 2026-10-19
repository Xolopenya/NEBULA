import type { LaserProfile } from '../player/laserProgression';
import { prismSpread } from './prismSpread';

/** One common launch aim; no target ranking or randomness. */
export function laserDirections(dx: number, dy: number, p: LaserProfile): { x: number; y: number }[] {
  if (p.angularStep === 12 && p.pelletCount === 3) return prismSpread(dx, dy);
  const distance = Math.hypot(dx, dy);
  if (distance < 0.001) return [];
  const x = dx / distance, y = dy / distance;
  const steps = p.pelletCount === 5 ? [0, -1, 1, -2, 2] : p.pelletCount === 3 ? [0, -1, 1] : [0];
  return steps.map(step => {
    if (step === 0) return { x, y };
    const angle = step * p.angularStep * Math.PI / 180;
    return { x: x * Math.cos(angle) - y * Math.sin(angle), y: x * Math.sin(angle) + y * Math.cos(angle) };
  });
}
