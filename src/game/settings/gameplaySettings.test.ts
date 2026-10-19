import { expect, it } from 'vitest';
import { GAMEPLAY_SETTINGS } from './gameplaySettings';
import { PlayerBuild } from '../player/PlayerBuild';
import { shouldSpawnWarden } from '../enemies/warden';

it('preserves the implemented defaults, Build movement and successful-spawn boss threshold', () => {
  expect(GAMEPLAY_SETTINGS).toEqual({
    player: { moveSpeedPxPerSecond: 300, dashSpeedPxPerSecond: 900, dashCooldownMs: 3000 },
    enemies: { maximumActiveEnemies: 10, bossSpawnAtSuccessfulSpawn: 30 },
    phases: { phaseTwoUnlockLevel: 2, phaseOneSpawnIntervalMs: 2000, phaseTwoSpawnIntervalMs: 1200,
      phaseTwoEnemyMoveSpeedMultiplier: 1.25, phaseTwoNotificationDurationMs: 3000 },
  });
  const build = new PlayerBuild();
  expect(build.getEffectiveStats().thrust).toBe(300);
  build.applyStatPercent('thrust', 0.25);
  expect(build.getEffectiveStats().thrust).toBe(375);
  expect([29, 30, 31].map(n => shouldSpawnWarden(n, false))).toEqual([false, true, false]);
  expect(shouldSpawnWarden(30, true)).toBe(false);
  for (const section of [GAMEPLAY_SETTINGS, ...Object.values(GAMEPLAY_SETTINGS)]) {
    expect(Object.isFrozen(section)).toBe(true);
  }
});
