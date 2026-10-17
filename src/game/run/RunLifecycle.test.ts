import { describe, expect, it } from 'vitest';
import { RunLifecycle, type TerminalOutcome } from './RunLifecycle';

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
});
