export function shouldSpawnEliteTank(
  scheduledArchetype: 'chaser' | 'shooter' | 'tank', nextSuccessfulTimedSpawnNumber: number,
): boolean {
  return scheduledArchetype === 'tank' && nextSuccessfulTimedSpawnNumber % 12 === 0;
}
