import { describe, expect, it } from 'vitest';
import { RunDiagnostics, type ChoiceIdentity } from './RunDiagnostics';
import type { PauseReason } from './RunLifecycle';

const offered: ChoiceIdentity[] = ['laser.power', 'passive.hull', 'prism'];
function started(seed = 0) { const d = new RunDiagnostics(seed); d.recordRunStarted(); return d; }
function operations(d: RunDiagnostics) {
  return [() => d.advance(1), () => d.recordEnemySpawned('tank', true), () => d.recordEnemyKilled('boss', false, 10),
    () => d.recordPlayerDamage(1), () => d.recordXpCredited(5, 1, 'pickup'), () => d.recordPauseEntered(['REWARD']),
    () => d.recordPauseResumed(['REWARD']), () => d.recordLevelUpOffered(offered), () => d.recordLevelUpSelected('prism'),
    () => d.recordTerminal('VICTORY')];
}
describe('RunDiagnostics', () => {
  it.each([0, 0xffffffff])('fresh detached zero state and immutable seed %s, start exactly once', seed => {
    const d = new RunDiagnostics(seed), s = d.snapshot();
    expect(s).toMatchObject({ runSeed: seed, gameplayElapsedMs: 0, timeline: [], terminal: null, droppedTimelineRecords: 0 });
    expect(Object.values(s.aggregates).filter(v => typeof v === 'number').every(v => v === 0)).toBe(true);
    expect(s.aggregates.spawned).toEqual({ total: 0, byArchetype: { chaser: 0, shooter: 0, tank: 0, boss: 0 }, eliteTanks: 0 });
    expect(Reflect.set(d, 'runSeed', 1)).toBe(false);
    expect(d.recordRunStarted()).toBe(true); expect(d.recordRunStarted()).toBe(false);
    expect(d.snapshot().timeline).toEqual([{ type: 'RUN_STARTED', gameplayElapsedMs: 0 }]);
  });
  it.each([-1, 0x100000000, 0.5, NaN, Infinity, -Infinity, '1', null, undefined])('rejects invalid seed %s', seed => {
    expect(() => new RunDiagnostics(seed as number)).toThrow(RangeError);
  });
  it('rejects valid record/advance operations before start without mutation', () => {
    const d = new RunDiagnostics(0), before = d.snapshot();
    for (const op of operations(d)) { expect(op).toThrow('RUN_STARTED'); expect(d.snapshot()).toEqual(before); }
  });
  it('sums active supplied deltas including zero/fractions without a wall clock', () => {
    const d = started(); d.advance(0); d.advance(16.5); d.advance(23.5);
    expect(d.snapshot().gameplayElapsedMs).toBe(40); expect(d.snapshot().timeline).toHaveLength(1);
  });
  it.each([-1, NaN, Infinity, -Infinity, '1', null])('rejects invalid delta %s atomically', delta => {
    const d = started(), before = d.snapshot(); expect(() => d.advance(delta as number)).toThrow(RangeError);
    expect(d.snapshot()).toEqual(before);
  });
  it('counts all archetypes and Elite subset, with XP drops but no enemy timeline rows', () => {
    const d = started();
    for (const a of ['chaser', 'shooter', 'tank', 'boss'] as const) { d.recordEnemySpawned(a, false); d.recordEnemyKilled(a, false, a === 'boss' ? 10 : 1); }
    d.recordEnemySpawned('tank', true); d.recordEnemyKilled('tank', true, 5);
    expect(d.snapshot().aggregates).toMatchObject({ spawned: { total: 5, eliteTanks: 1, byArchetype: { chaser: 1, shooter: 1, tank: 2, boss: 1 } },
      killed: { total: 5, eliteTanks: 1 }, xpDropped: 18 });
    expect(d.snapshot().timeline).toHaveLength(1);
  });
  it('rejects enemy identity/elite/XP errors before any partial kill count', () => {
    const d = started(), before = d.snapshot();
    for (const op of [() => d.recordEnemySpawned('boss', true), () => d.recordEnemySpawned('alien' as 'chaser', false),
      () => d.recordEnemySpawned('tank', 1 as unknown as boolean), () => d.recordEnemyKilled('tank', false, 0.5),
      () => d.recordEnemyKilled('tank', false, -1), () => d.recordEnemyKilled('tank', false, NaN)]) {
      expect(op).toThrow(RangeError); expect(d.snapshot()).toEqual(before);
    }
  });
  it('accounts fractional actual HP loss and separates pickup/dev XP and multi-level gains', () => {
    const d = started(); d.recordPlayerDamage(0.5); d.recordPlayerDamage(2);
    d.recordXpCredited(20, 2, 'pickup'); d.recordXpCredited(5, 1, 'dev');
    expect(d.snapshot().aggregates).toMatchObject({ acceptedDamagingHits: 2, hpLost: 2.5, xpCredited: 25,
      xpCollected: 20, xpDevCredited: 5, levelsGained: 3 });
  });
  it.each([0, -1, NaN, Infinity, '1'])('rejects invalid HP loss %s', value => {
    const d = started(), before = d.snapshot(); expect(() => d.recordPlayerDamage(value as number)).toThrow(); expect(d.snapshot()).toEqual(before);
  });
  it('rejects invalid XP source/amount/levels atomically', () => {
    const d = started(), before = d.snapshot();
    for (const op of [() => d.recordXpCredited(NaN, 0, 'pickup'), () => d.recordXpCredited(1, 0.5, 'dev'),
      () => d.recordXpCredited(1, 0, 'other' as 'dev'), () => d.recordXpCredited(-1, 0, 'dev')]) {
      expect(op).toThrow(); expect(d.snapshot()).toEqual(before);
    }
  });
  it('copies canonical nonempty reasons and offered slot identities, preserving equal-time insertion order', () => {
    const d = started(), input: PauseReason[] = ['FOCUS_LOSS', 'REWARD'], picks = [...offered];
    d.recordPauseEntered(input); d.recordLevelUpOffered(picks); d.recordLevelUpSelected('laser.power'); d.recordPauseResumed(input);
    input.length = 0; picks[0] = 'twin';
    const s = d.snapshot();
    expect(s.timeline.map(r => r.type)).toEqual(['RUN_STARTED', 'PAUSE_ENTERED', 'LEVEL_UP_OFFERED', 'LEVEL_UP_SELECTED', 'PAUSE_RESUMED']);
    expect(s.timeline[1]).toMatchObject({ reasons: ['REWARD', 'FOCUS_LOSS'], gameplayElapsedMs: 0 });
    expect(s.timeline[2]).toMatchObject({ choices: offered });
    expect(s.aggregates).toMatchObject({ pauseEntries: 1, pauseResumes: 1, offersPresented: 1, choicesAccepted: 1 });
    s.aggregates.spawned.byArchetype.chaser = 99; s.timeline.length = 0;
    expect(d.snapshot().timeline).toHaveLength(5); expect(d.snapshot().aggregates.spawned.byArchetype.chaser).toBe(0);
    expect(JSON.parse(JSON.stringify(d.snapshot()))).toEqual(d.snapshot());
  });
  it('rejects invalid/duplicate/empty reason arrays and invalid/duplicate offered choices', () => {
    const d = started(), before = d.snapshot();
    for (const values of [[], ['MANUAL', 'MANUAL'], ['DEBUG'], new Array(1)] as PauseReason[][]) {
      expect(() => d.recordPauseEntered(values)).toThrow(); expect(() => d.recordPauseResumed(values)).toThrow();
    }
    const sparseChoices: ChoiceIdentity[] = ['prism', 'twin']; sparseChoices.length = 3;
    for (const values of [[], ['prism', 'prism', 'twin'], ['prism', 'twin', 'unknown'], sparseChoices] as ChoiceIdentity[][]) expect(() => d.recordLevelUpOffered(values)).toThrow();
    expect(() => d.recordLevelUpSelected('unknown' as ChoiceIdentity)).toThrow(); expect(d.snapshot()).toEqual(before);
  });
  it('evicts oldest at capacity256, retaining full aggregates and final terminal as newest', () => {
    const d = started();
    for (let i = 0; i < 300; i++) { d.advance(1); d.recordPauseEntered(['MANUAL']); }
    expect(d.snapshot().timeline).toHaveLength(256); expect(d.snapshot().timeline[0].gameplayElapsedMs).toBe(45);
    expect(d.snapshot().droppedTimelineRecords).toBe(45); expect(d.snapshot().aggregates.pauseEntries).toBe(300);
    d.recordTerminal('VICTORY'); expect(d.snapshot().droppedTimelineRecords).toBe(46); expect(d.snapshot().timeline.at(-1)?.type).toBe('TERMINAL');
  });
  it('rejects overflow atomically across all multi-field and timeline operations', () => {
    const d = started(); d.recordXpCredited(0, Number.MAX_SAFE_INTEGER, 'dev');
    let before = d.snapshot(); expect(() => d.recordXpCredited(1, 1, 'pickup')).toThrow(); expect(d.snapshot()).toEqual(before);
    d.recordEnemyKilled('chaser', false, Number.MAX_SAFE_INTEGER); before = d.snapshot();
    expect(() => d.recordEnemyKilled('tank', true, 1)).toThrow(); expect(d.snapshot()).toEqual(before);
    d.advance(Number.MAX_SAFE_INTEGER); before = d.snapshot(); expect(() => d.advance(1)).toThrow(); expect(d.snapshot()).toEqual(before);
    d['aggregates'].spawned.byArchetype.chaser = Number.MAX_SAFE_INTEGER; before = d.snapshot();
    expect(() => d.recordEnemySpawned('chaser', false)).toThrow(); expect(d.snapshot()).toEqual(before);
    for (let i = 0; i < 255; i++) d.recordPauseEntered(['MANUAL']);
    d['droppedTimelineRecords'] = Number.MAX_SAFE_INTEGER; before = d.snapshot();
    expect(() => d.recordLevelUpOffered(offered)).toThrow(); expect(d.snapshot()).toEqual(before);
  });
  it.each(['DEATH', 'VICTORY'] as const)('freezes first %s time and rejects every later valid mutation', outcome => {
    const d = started(); d.advance(42); expect(d.recordTerminal(outcome)).toBe(true); const before = d.snapshot();
    for (const op of operations(d)) expect(op()).toBe(false);
    expect(d.advance(Number.MAX_SAFE_INTEGER)).toBe(false);
    expect(d.snapshot()).toEqual(before); const s = d.snapshot(); s.terminal!.gameplayElapsedMs = 99;
    expect(d.snapshot().terminal).toEqual({ outcome, gameplayElapsedMs: 42 });
  });
  it('idempotent disposal rejects direct mutations/reads and leaves fresh owner independent', () => {
    const d = started(); d.dispose(); d.dispose();
    for (const op of [...operations(d), () => d.recordRunStarted(), () => d.snapshot()]) expect(op).toThrow('disposed RunDiagnostics');
    const fresh = started(); expect(fresh.snapshot().timeline).toEqual([{ type: 'RUN_STARTED', gameplayElapsedMs: 0 }]);
  });
});
