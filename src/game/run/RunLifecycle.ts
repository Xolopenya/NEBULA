export type RunState = 'PREPARING' | 'RUNNING' | 'TERMINAL' | 'DISPOSED';
export type TerminalOutcome = 'DEATH' | 'VICTORY';

export class RunLifecycle {
  #state: RunState = 'PREPARING';
  #outcome: TerminalOutcome | null = null;

  get state(): RunState { return this.#state; }
  get outcome(): TerminalOutcome | null { return this.#outcome; }

  start(): boolean {
    if (this.#state !== 'PREPARING') return false;
    this.#state = 'RUNNING';
    return true;
  }

  tryEnterTerminal(outcome: TerminalOutcome): boolean {
    if (this.#state !== 'RUNNING') return false;
    this.#outcome = outcome;
    this.#state = 'TERMINAL';
    return true;
  }

  dispose(): void {
    this.#state = 'DISPOSED';
  }
}
