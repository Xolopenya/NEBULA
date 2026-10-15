import type { MissileRanks } from './focusedUpgrade';

export function canEvolveClusterMissile(
  ranks: Readonly<MissileRanks>, spatialAmplifierLevel: number, evolved: boolean,
): boolean {
  return !evolved && ranks.warheadPower >= 2 && ranks.propulsion >= 2
    && ranks.blastExpansion >= 2 && spatialAmplifierLevel >= 1;
}
