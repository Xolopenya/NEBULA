export type DevSnapshot = {
  runSeed: number;
  isPlayerDead: boolean;
  isRunVictorious: boolean;
  isLevelUpPaused: boolean;
  godMode: boolean;
  playerHealth: number;
  progression: { level: number; xp: number; threshold: number };
  protectionRemaining: number;
  bossSpawned: boolean;
  bossDefeated: boolean;
  warden: { health: number; phase: 1 | 2 | null } | null;
  successfulTimedSpawns: number;
  activeEnemyCount: number;
  gameplayTimerCount: number;
};

export type DevTools = {
  snapshot(): DevSnapshot | null;
  forceLevelUp(): boolean;
  spawnWarden(): boolean;
  setWardenHealth(health: number): boolean;
  setGodMode(enabled: boolean): boolean;
};

declare global {
  interface Window { __NEBULA_DEV__?: DevTools }
}
