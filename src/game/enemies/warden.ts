export function shouldSpawnWarden(nextSuccessfulTimedSpawnNumber: number, bossSpawned: boolean): boolean {
  return nextSuccessfulTimedSpawnNumber === 30 && !bossSpawned;
}

export function wardenPhase(health: number): 1 | 2 | undefined {
  if (health <= 0) return undefined;
  return health > 30 ? 1 : 2;
}

export function wardenBurstDirections(phase: 1 | 2): { x: number; y: number }[] {
  const count = phase === 1 ? 4 : 8;
  return Array.from({ length: count }, (_, index) => {
    const angle = index * Math.PI * 2 / count;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  });
}
