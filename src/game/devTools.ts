import type { PauseReason, RunState } from './run/RunLifecycle';
import type { RunDiagnosticsSnapshot } from './run/RunDiagnostics';
import type { BuildSnapshot } from './player/PlayerBuild';

export type DevSnapshot = {
  runSeed: number;
  diagnostics: RunDiagnosticsSnapshot;
  build: BuildSnapshot;
  runState: RunState;
  pauseReasons: PauseReason[];
  isPlayerDead: boolean;
  isRunVictorious: boolean;
  isLevelUpPaused: boolean;
  godMode: boolean;
  playerHealth: number;
  playerShield: number;
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
