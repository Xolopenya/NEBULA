import type { PauseReason, TerminalOutcome } from './RunLifecycle';
import { createEnemyDamageSource, type EnemyDamageSource } from '../enemies/EnemyDeath';

export type EnemyKillSourceKey = 'LASER.BASE.DIRECT' | 'LASER.PRISM.DIRECT'
  | 'MISSILE.BASE.PRIMARY' | 'MISSILE.CLUSTER.PRIMARY' | 'MISSILE.CLUSTER.SATELLITE'
  | 'COMBAT_DRONE.BASE.DIRECT' | 'COMBAT_DRONE.TWIN.DIRECT';
export type EnemyKillSourceCounts = Record<EnemyKillSourceKey, number>;
function emptyKillSources(): EnemyKillSourceCounts {
  return { 'LASER.BASE.DIRECT': 0, 'LASER.PRISM.DIRECT': 0, 'MISSILE.BASE.PRIMARY': 0,
    'MISSILE.CLUSTER.PRIMARY': 0, 'MISSILE.CLUSTER.SATELLITE': 0,
    'COMBAT_DRONE.BASE.DIRECT': 0, 'COMBAT_DRONE.TWIN.DIRECT': 0 };
}
function killSourceKey(input: EnemyDamageSource): EnemyKillSourceKey {
  const source = createEnemyDamageSource(input);
  switch (source.kind) {
    case 'LASER': return source.variant === 'BASE' ? 'LASER.BASE.DIRECT' : 'LASER.PRISM.DIRECT';
    case 'COMBAT_DRONE': return source.variant === 'BASE' ? 'COMBAT_DRONE.BASE.DIRECT' : 'COMBAT_DRONE.TWIN.DIRECT';
    case 'MISSILE': return source.variant === 'BASE' ? 'MISSILE.BASE.PRIMARY'
      : source.phase === 'PRIMARY' ? 'MISSILE.CLUSTER.PRIMARY' : 'MISSILE.CLUSTER.SATELLITE';
  }
}

export type DiagnosticArchetype = 'chaser' | 'shooter' | 'tank' | 'boss';
const choices = [
  'laser.power', 'laser.fireRate', 'laser.speed',
  'missile.warheadPower', 'missile.propulsion', 'missile.blastExpansion',
  'drone.boltPower', 'drone.firingSystem', 'drone.boltPropulsion',
  'passive.hull', 'passive.thruster', 'passive.collector', 'passive.combat',
  'passive.spatial', 'passive.replication', 'prism', 'cluster', 'twin',
] as const;
export type ChoiceIdentity = typeof choices[number];
const pauseOrder: readonly PauseReason[] = ['REWARD', 'MANUAL', 'FOCUS_LOSS'];
type EnemyCounts = { total: number; byArchetype: Record<DiagnosticArchetype, number>; eliteTanks: number };
type Aggregates = {
  spawned: EnemyCounts; killed: EnemyCounts;
  killsBySource: EnemyKillSourceCounts;
  acceptedDamagingHits: number; hpLost: number;
  xpDropped: number; xpCredited: number; xpCollected: number; xpDevCredited: number; levelsGained: number;
  offersPresented: number; choicesAccepted: number; pauseEntries: number; pauseResumes: number;
};
export type DiagnosticRecord = { gameplayElapsedMs: number } & (
  { type: 'RUN_STARTED' }
  | { type: 'PAUSE_ENTERED'; reasons: PauseReason[] }
  | { type: 'PAUSE_RESUMED'; previousReasons: PauseReason[] }
  | { type: 'LEVEL_UP_OFFERED'; choices: ChoiceIdentity[] }
  | { type: 'LEVEL_UP_SELECTED'; choice: ChoiceIdentity }
  | { type: 'TERMINAL'; outcome: TerminalOutcome });
export type RunDiagnosticsSnapshot = {
  runSeed: number; gameplayElapsedMs: number; aggregates: Aggregates;
  timeline: DiagnosticRecord[]; droppedTimelineRecords: number;
  terminal: { outcome: TerminalOutcome; gameplayElapsedMs: number } | null;
};

function integer(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('Expected nonnegative safe integer');
}
function finite(value: number): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) {
    throw new RangeError('Expected finite nonnegative safe numeric value');
  }
}
function add(a: number, b: number): number { const value = a + b; integer(value); return value; }
function choice(value: ChoiceIdentity): void {
  if (!choices.includes(value)) throw new RangeError('Unsupported choice identity');
}
function reasons(values: readonly PauseReason[]): PauseReason[] {
  if (!Array.isArray(values) || !values.length || new Set(values).size !== values.length
    || [...values].some(value => !pauseOrder.includes(value))) throw new RangeError('Invalid pause reasons');
  return pauseOrder.filter(value => values.includes(value));
}
function enemy(archetype: DiagnosticArchetype, isElite: boolean): void {
  if (!['chaser', 'shooter', 'tank', 'boss'].includes(archetype)
    || typeof isElite !== 'boolean' || (isElite && archetype !== 'tank')) throw new RangeError('Invalid enemy identity');
}
function emptyEnemies(): EnemyCounts {
  return { total: 0, byArchetype: { chaser: 0, shooter: 0, tank: 0, boss: 0 }, eliteTanks: 0 };
}
function countEnemy(current: EnemyCounts, archetype: DiagnosticArchetype, isElite: boolean): EnemyCounts {
  return { total: add(current.total, 1),
    byArchetype: { ...current.byArchetype, [archetype]: add(current.byArchetype[archetype], 1) },
    eliteTanks: add(current.eliteTanks, Number(isElite)) };
}

/** Observation only. Receives seed identity, never gameplay authorities or procedural sources. */
export class RunDiagnostics {
  readonly #runSeed: number;
  private started = false;
  private disposed = false;
  private gameplayElapsedMs = 0;
  private aggregates: Aggregates = { spawned: emptyEnemies(), killed: emptyEnemies(),
    killsBySource: emptyKillSources(),
    acceptedDamagingHits: 0, hpLost: 0, xpDropped: 0, xpCredited: 0, xpCollected: 0, xpDevCredited: 0,
    levelsGained: 0, offersPresented: 0, choicesAccepted: 0, pauseEntries: 0, pauseResumes: 0 };
  private timeline: DiagnosticRecord[] = [];
  private droppedTimelineRecords = 0;
  private terminal: RunDiagnosticsSnapshot['terminal'] = null;

  constructor(runSeed: number) {
    integer(runSeed);
    if (runSeed > 0xffffffff) throw new RangeError('Run seed must be uint32');
    this.#runSeed = runSeed;
  }
  get runSeed(): number { return this.#runSeed; }

  recordRunStarted(): boolean {
    this.assertLive();
    if (this.started) return false;
    if (this.gameplayElapsedMs !== 0) throw new Error('RunDiagnostics must start at zero');
    this.append({ type: 'RUN_STARTED', gameplayElapsedMs: 0 });
    this.started = true;
    return true;
  }

  advance(delta: number): boolean {
    this.assertLive(); finite(delta);
    if (!this.writable()) return false;
    const elapsed = this.gameplayElapsedMs + delta; finite(elapsed);
    this.gameplayElapsedMs = elapsed;
    return true;
  }

  recordEnemySpawned(archetype: DiagnosticArchetype, isElite: boolean): boolean {
    this.assertLive(); enemy(archetype, isElite);
    if (!this.writable()) return false;
    const spawned = countEnemy(this.aggregates.spawned, archetype, isElite);
    this.aggregates.spawned = spawned;
    return true;
  }
  recordEnemyKilled(archetype: DiagnosticArchetype, isElite: boolean, xpValue: number, killSource: EnemyDamageSource): boolean {
    this.assertLive(); enemy(archetype, isElite); integer(xpValue);
    const key = killSourceKey(killSource);
    if (!this.writable()) return false;
    const killed = countEnemy(this.aggregates.killed, archetype, isElite);
    const xpDropped = add(this.aggregates.xpDropped, xpValue);
    const killsBySource = { ...this.aggregates.killsBySource, [key]: add(this.aggregates.killsBySource[key], 1) };
    this.aggregates = { ...this.aggregates, killed, xpDropped, killsBySource };
    return true;
  }
  recordPlayerDamage(actualHpLost: number): boolean {
    this.assertLive(); finite(actualHpLost);
    if (actualHpLost === 0) throw new RangeError('HP loss must be positive');
    if (!this.writable()) return false;
    const hpLost = this.aggregates.hpLost + actualHpLost; finite(hpLost);
    const acceptedDamagingHits = add(this.aggregates.acceptedDamagingHits, 1);
    this.aggregates = { ...this.aggregates, hpLost, acceptedDamagingHits };
    return true;
  }
  recordXpCredited(amount: number, levelsGained: number, source: 'pickup' | 'dev'): boolean {
    this.assertLive(); integer(amount); integer(levelsGained);
    if (source !== 'pickup' && source !== 'dev') throw new RangeError('Invalid XP source');
    if (!this.writable()) return false;
    const next = { ...this.aggregates, xpCredited: add(this.aggregates.xpCredited, amount),
      levelsGained: add(this.aggregates.levelsGained, levelsGained) };
    if (source === 'pickup') next.xpCollected = add(next.xpCollected, amount);
    else next.xpDevCredited = add(next.xpDevCredited, amount);
    this.aggregates = next;
    return true;
  }
  recordPauseEntered(input: readonly PauseReason[]): boolean {
    this.assertLive(); const copied = reasons(input);
    if (!this.writable()) return false;
    const count = add(this.aggregates.pauseEntries, 1);
    this.append({ type: 'PAUSE_ENTERED', gameplayElapsedMs: this.gameplayElapsedMs, reasons: copied });
    this.aggregates.pauseEntries = count;
    return true;
  }
  recordPauseResumed(input: readonly PauseReason[]): boolean {
    this.assertLive(); const copied = reasons(input);
    if (!this.writable()) return false;
    const count = add(this.aggregates.pauseResumes, 1);
    this.append({ type: 'PAUSE_RESUMED', gameplayElapsedMs: this.gameplayElapsedMs, previousReasons: copied });
    this.aggregates.pauseResumes = count;
    return true;
  }
  recordLevelUpOffered(input: readonly ChoiceIdentity[]): boolean {
    this.assertLive();
    if (!Array.isArray(input) || input.length !== 3 || new Set(input).size !== 3) throw new RangeError('Expected three distinct choices');
    for (const value of input) choice(value);
    if (!this.writable()) return false;
    const count = add(this.aggregates.offersPresented, 1);
    this.append({ type: 'LEVEL_UP_OFFERED', gameplayElapsedMs: this.gameplayElapsedMs, choices: [...input] });
    this.aggregates.offersPresented = count;
    return true;
  }
  recordLevelUpSelected(value: ChoiceIdentity): boolean {
    this.assertLive(); choice(value);
    if (!this.writable()) return false;
    const count = add(this.aggregates.choicesAccepted, 1);
    this.append({ type: 'LEVEL_UP_SELECTED', gameplayElapsedMs: this.gameplayElapsedMs, choice: value });
    this.aggregates.choicesAccepted = count;
    return true;
  }
  recordTerminal(outcome: TerminalOutcome): boolean {
    this.assertLive();
    if (outcome !== 'DEATH' && outcome !== 'VICTORY') throw new RangeError('Invalid terminal outcome');
    if (!this.writable()) return false;
    this.append({ type: 'TERMINAL', gameplayElapsedMs: this.gameplayElapsedMs, outcome });
    this.terminal = { outcome, gameplayElapsedMs: this.gameplayElapsedMs };
    return true;
  }
  snapshot(): RunDiagnosticsSnapshot {
    this.assertLive();
    return structuredClone({ runSeed: this.#runSeed, gameplayElapsedMs: this.gameplayElapsedMs,
      aggregates: this.aggregates, timeline: this.timeline, droppedTimelineRecords: this.droppedTimelineRecords,
      terminal: this.terminal });
  }
  dispose(): void { this.disposed = true; }

  private assertLive(): void {
    if (this.disposed) throw new Error('Cannot use disposed RunDiagnostics');
  }
  private writable(): boolean {
    if (!this.started) throw new Error('RunDiagnostics requires RUN_STARTED');
    return this.terminal === null;
  }
  private append(row: DiagnosticRecord): void {
    const dropped = this.timeline.length === 256 ? add(this.droppedTimelineRecords, 1) : this.droppedTimelineRecords;
    this.timeline = [...(this.timeline.length === 256 ? this.timeline.slice(1) : this.timeline), row];
    this.droppedTimelineRecords = dropped;
  }
}
