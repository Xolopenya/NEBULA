import type { LaserRanks } from './prismLaser';

export type MissileRanks = { warheadPower: number; propulsion: number; blastExpansion: number };
export type WeaponFocus = 'laser' | 'missile';
export type FocusCursors = { laser: number; missile: number };
type FocusedUpgrade =
  | { kind: 'laser'; upgrade: keyof LaserRanks; nextCursor: number }
  | { kind: 'missile'; upgrade: keyof MissileRanks; nextCursor: number };

const laserOrder = ['power', 'fireRate', 'speed'] as const;
const missileOrder = ['warheadPower', 'propulsion', 'blastExpansion'] as const;

function leastRankIndex(ranks: readonly number[], cursor: number): number | undefined {
  const minimum = Math.min(...ranks.filter(rank => rank < 2));
  if (minimum === Infinity) return undefined;
  for (let offset = 0; offset < ranks.length; offset += 1) {
    const index = (cursor + offset) % ranks.length;
    if (ranks[index] === minimum) return index;
  }
  return undefined;
}

// Returns the offered weapon's next cursor; offering a fallback never changes focus.
export function selectFocusedUpgrade(
  focus: WeaponFocus,
  laserRanks: Readonly<LaserRanks>,
  missileRanks: Readonly<MissileRanks>,
  cursors: Readonly<FocusCursors>,
): FocusedUpgrade | undefined {
  const weapons: readonly WeaponFocus[] = focus === 'laser' ? ['laser', 'missile'] : ['missile', 'laser'];
  for (const weapon of weapons) {
    if (weapon === 'laser') {
      const index = leastRankIndex(laserOrder.map(track => laserRanks[track]), cursors.laser);
      if (index !== undefined) return { kind: 'laser', upgrade: laserOrder[index], nextCursor: (index + 1) % 3 };
    } else {
      const index = leastRankIndex(missileOrder.map(track => missileRanks[track]), cursors.missile);
      if (index !== undefined) return { kind: 'missile', upgrade: missileOrder[index], nextCursor: (index + 1) % 3 };
    }
  }
  return undefined;
}
