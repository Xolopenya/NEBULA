import type { DroneRanks } from './focusedUpgrade';

export function canEvolveTwinDrone(
  ranks: Readonly<DroneRanks>, replicationLevel: number, evolved: boolean,
): boolean {
  return !evolved && ranks.boltPower >= 2 && ranks.firingSystem >= 2
    && ranks.boltPropulsion >= 2 && replicationLevel >= 1;
}
