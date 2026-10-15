export type LaserRanks = {
  power: number;
  fireRate: number;
  speed: number;
};

export function canEvolvePrismLaser(
  ranks: Readonly<LaserRanks>, combatProcessorLevel: number, evolved: boolean,
): boolean {
  return !evolved && ranks.power >= 2 && ranks.fireRate >= 2 && ranks.speed >= 2
    && combatProcessorLevel >= 1;
}
