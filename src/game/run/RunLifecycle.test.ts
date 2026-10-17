import { describe, expect, it } from 'vitest';
import { RunLifecycle, type TerminalOutcome, type PauseReason } from './RunLifecycle';

describe('RunLifecycle', () => {
  it('starts PREPARING/null, rejects early terminal, and starts exactly once', () => {
    const run = new RunLifecycle();
    expect([run.state, run.outcome]).toEqual(['PREPARING', null]);
    expect(run.tryEnterTerminal('DEATH')).toBe(false);
    expect(run.tryEnterTerminal('VICTORY')).toBe(false);
    expect(run.start()).toBe(true);
    expect([run.state, run.outcome]).toEqual(['RUNNING', null]);
    expect(run.start()).toBe(false);
  });
  it.each(['DEATH', 'VICTORY'] as const)('first %s is immutable through conflicting/duplicate requests and disposal', first => {
    const run = new RunLifecycle();
    run.start();
    expect(run.tryEnterTerminal(first)).toBe(true);
    expect(run.state).toBe('TERMINAL');
    for (const outcome of ['DEATH', 'VICTORY'] as const) expect(run.tryEnterTerminal(outcome)).toBe(false);
    expect(run.start()).toBe(false);
    expect(run.outcome).toBe(first);
    run.dispose();
    expect([run.state, run.outcome]).toEqual(['DISPOSED', first]);
    expect(run.tryEnterTerminal(first)).toBe(false);
  });
  it.each(['PREPARING', 'RUNNING', 'TERMINAL'] as const)('idempotently disposes %s without allowing revival', state => {
    const run = new RunLifecycle();
    if (state !== 'PREPARING') run.start();
    if (state === 'TERMINAL') run.tryEnterTerminal('DEATH');
    run.dispose();
    run.dispose();
    expect(run.state).toBe('DISPOSED');
    expect(run.outcome).toBe(state === 'TERMINAL' ? 'DEATH' : null);
    expect(run.start()).toBe(false);
    for (const outcome of ['DEATH', 'VICTORY'] as TerminalOutcome[]) expect(run.tryEnterTerminal(outcome)).toBe(false);
  });
  it('fresh authority is independent of an old disposed authority', () => {
    const old = new RunLifecycle();
    old.start(); old.tryEnterTerminal('VICTORY'); old.dispose();
    const fresh = new RunLifecycle();
    expect(fresh).not.toBe(old);
    fresh.start();
    old.dispose(); old.start(); old.tryEnterTerminal('DEATH');
    expect([fresh.state, fresh.outcome]).toEqual(['RUNNING', null]);
    expect(old.outcome).toBe('VICTORY');
  });
  it('has read-only state and outcome accessors', () => {
    const run = new RunLifecycle();
    expect(Reflect.set(run, 'state', 'RUNNING')).toBe(false);
    expect(Reflect.set(run, 'outcome', 'DEATH')).toBe(false);
    expect([run.state, run.outcome]).toEqual(['PREPARING', null]);
  });
  it('composes reasons idempotently, releases only the owner and exposes a detached ordered view', () => {
    const run = new RunLifecycle();
    expect(run.pauseReasons).toEqual([]);
    run.start();
    expect(run.requestPause('FOCUS_LOSS')).toBe(true);
    expect(run.requestPause('REWARD')).toBe(true);
    expect(run.requestPause('MANUAL')).toBe(true);
    expect(run.requestPause('REWARD')).toBe(false);
    expect(run.state).toBe('PAUSED');
    expect(run.pauseReasons).toEqual(['REWARD', 'MANUAL', 'FOCUS_LOSS']);
    run.pauseReasons.length = 0;
    expect(run.hasPauseReason('REWARD')).toBe(true);
    expect(run.releasePause('MANUAL')).toBe(true);
    expect(run.releasePause('MANUAL')).toBe(false);
    expect(run.releasePause('REWARD')).toBe(true);
    expect(run.state).toBe('PAUSED');
    expect(run.releasePause('FOCUS_LOSS')).toBe(true);
    expect(run.state).toBe('RUNNING');
    expect(run.releasePause('FOCUS_LOSS')).toBe(false);
  });
  it.each(['REWARD', 'MANUAL', 'FOCUS_LOSS'] as const)('pauses and resumes exactly %s', reason => {
    const run = new RunLifecycle(); run.start();
    expect(run.requestPause(reason)).toBe(true);
    expect(run.hasPauseReason(reason)).toBe(true);
    expect(run.state).toBe('PAUSED');
    expect(run.releasePause(reason)).toBe(true);
    expect(run.state).toBe('RUNNING');
  });
  it.each(['DEATH', 'VICTORY'] as const)('accepts first %s from PAUSED, clearing reasons permanently', outcome => {
    const run = new RunLifecycle(); run.start(); run.requestPause('REWARD'); run.requestPause('FOCUS_LOSS');
    expect(run.tryEnterTerminal(outcome)).toBe(true);
    expect(run.pauseReasons).toEqual([]);
    expect(run.state).toBe('TERMINAL');
    expect(run.tryEnterTerminal(outcome === 'DEATH' ? 'VICTORY' : 'DEATH')).toBe(false);
    run.dispose(); expect(run.outcome).toBe(outcome);
  });
  it.each(['PREPARING', 'TERMINAL', 'DISPOSED'] as const)('rejects every pause/release from %s', state => {
    const run = new RunLifecycle();
    if (state !== 'PREPARING') run.start();
    if (state === 'TERMINAL') run.tryEnterTerminal('VICTORY');
    if (state === 'DISPOSED') { run.requestPause('MANUAL'); run.dispose(); }
    for (const reason of ['REWARD', 'MANUAL', 'FOCUS_LOSS'] as const) {
      expect(run.requestPause(reason)).toBe(false);
      expect(run.releasePause(reason)).toBe(false);
    }
    expect(run.state).toBe(state); expect(run.pauseReasons).toEqual([]);
  });
  it('disposes PAUSED without reviving and cannot affect a fresh authority', () => {
    const old = new RunLifecycle(); old.start(); old.requestPause('REWARD'); old.dispose(); old.dispose();
    const fresh = new RunLifecycle(); fresh.start();
    expect(old.pauseReasons).toEqual([]); expect(old.outcome).toBeNull();
    expect(old.start()).toBe(false); expect(old.releasePause('REWARD')).toBe(false);
    expect(fresh.state).toBe('RUNNING'); expect(fresh.pauseReasons).toEqual([]);
  });
  it('rejects an unsupported runtime reason without adding hidden ownership', () => {
    const run = new RunLifecycle(); run.start();
    expect(run.requestPause('DEBUG' as PauseReason)).toBe(false);
    expect(run.state).toBe('RUNNING'); expect(run.pauseReasons).toEqual([]);
  });
});
