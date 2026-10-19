import type { LaserRanks } from './prismLaser';

export type MissileRanks = { warheadPower: number; propulsion: number; blastExpansion: number };
export type DroneRanks = { boltPower: number; firingSystem: number; boltPropulsion: number };
export type WeaponFocus = 'laser' | 'missile' | 'drone';
export type FocusCursors = { laser: number; missile: number; drone: number };
export type EligibleTracks = { laser: Readonly<Record<keyof LaserRanks, boolean>>;
  missile: Readonly<Record<keyof MissileRanks, boolean>>; drone: Readonly<Record<keyof DroneRanks, boolean>> };
type FocusedUpgrade =
  | { kind: 'laser'; upgrade: keyof LaserRanks; nextCursor: number }
  | { kind: 'missile'; upgrade: keyof MissileRanks; nextCursor: number }
  | { kind: 'drone'; upgrade: keyof DroneRanks; nextCursor: number };

const laserOrder = ['power', 'fireRate', 'speed'] as const;
const missileOrder = ['warheadPower', 'propulsion', 'blastExpansion'] as const;
const droneOrder = ['boltPower', 'firingSystem', 'boltPropulsion'] as const;

function leastRankIndex(ranks: readonly number[], cursor: number, eligible: readonly boolean[]): number | undefined {
  const minimum = Math.min(...ranks.filter((rank, i) => rank < 2 && eligible[i]));
  if (minimum === Infinity) return undefined;
  for (let offset = 0; offset < ranks.length; offset += 1) {
    const index = (cursor + offset) % ranks.length;
    if (eligible[index] && ranks[index] === minimum) return index;
  }
  return undefined;
}

// Returns the offered weapon's next cursor; offering a fallback never changes focus.
export function selectFocusedUpgrade(
  focus: WeaponFocus,
  laserRanks: Readonly<LaserRanks>,
  missileRanks: Readonly<MissileRanks>,
  droneRanks: Readonly<DroneRanks>,
  cursors: Readonly<FocusCursors>,
  eligible?: Readonly<EligibleTracks>,
): FocusedUpgrade | undefined {
  const weapons: readonly WeaponFocus[] = [focus, ...(['laser', 'missile', 'drone'] as const).filter(weapon => weapon !== focus)];
  for (const weapon of weapons) {
    if (weapon === 'laser') {
      const index = leastRankIndex(laserOrder.map(track => laserRanks[track]), cursors.laser, laserOrder.map(track => eligible?.laser[track] ?? true));
      if (index !== undefined) return { kind: 'laser', upgrade: laserOrder[index], nextCursor: (index + 1) % 3 };
    } else if (weapon === 'missile') {
      const index = leastRankIndex(missileOrder.map(track => missileRanks[track]), cursors.missile, missileOrder.map(track => eligible?.missile[track] ?? true));
      if (index !== undefined) return { kind: 'missile', upgrade: missileOrder[index], nextCursor: (index + 1) % 3 };
    } else {
      const index = leastRankIndex(droneOrder.map(track => droneRanks[track]), cursors.drone, droneOrder.map(track => eligible?.drone[track] ?? true));
      if (index !== undefined) return { kind: 'drone', upgrade: droneOrder[index], nextCursor: (index + 1) % 3 };
    }
  }
  return undefined;
}
