export type RunState = 'PREPARING' | 'RUNNING' | 'PAUSED' | 'TERMINAL' | 'DISPOSED';
export type PauseReason = 'REWARD' | 'MANUAL' | 'FOCUS_LOSS';
const pauseOrder: readonly PauseReason[] = ['REWARD', 'MANUAL', 'FOCUS_LOSS'];
export type TerminalOutcome = 'DEATH' | 'VICTORY';

export class RunLifecycle {
  #state: RunState = 'PREPARING';
  #outcome: TerminalOutcome | null = null;
  #pauseReasons = new Set<PauseReason>();

  get state(): RunState { return this.#state; }
  get outcome(): TerminalOutcome | null { return this.#outcome; }
  get pauseReasons(): PauseReason[] { return pauseOrder.filter(reason => this.#pauseReasons.has(reason)); }

  hasPauseReason(reason: PauseReason): boolean { return this.#pauseReasons.has(reason); }

  requestPause(reason: PauseReason): boolean {
    if ((this.#state !== 'RUNNING' && this.#state !== 'PAUSED')
      || !pauseOrder.includes(reason) || this.#pauseReasons.has(reason)) return false;
    this.#pauseReasons.add(reason);
    this.#state = 'PAUSED';
    return true;
  }

  releasePause(reason: PauseReason): boolean {
    if (this.#state !== 'PAUSED' || !this.#pauseReasons.delete(reason)) return false;
    if (this.#pauseReasons.size === 0) this.#state = 'RUNNING';
    return true;
  }

  start(): boolean {
    if (this.#state !== 'PREPARING') return false;
    this.#state = 'RUNNING';
    return true;
  }

  tryEnterTerminal(outcome: TerminalOutcome): boolean {
    if (this.#state !== 'RUNNING' && this.#state !== 'PAUSED') return false;
    this.#outcome = outcome;
    this.#pauseReasons.clear();
    this.#state = 'TERMINAL';
    return true;
  }

  dispose(): void {
    this.#pauseReasons.clear();
    this.#state = 'DISPOSED';
  }
}
