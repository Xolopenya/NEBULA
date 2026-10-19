import { addExperience, xpForNextLevel } from './experience';

export type ProgressionSnapshot = Readonly<{ level: number; xp: number; threshold: number; pendingLevels: number }>;

/** Numeric state for exactly one run. Physical objects and reward presentation stay in Scene. */
export class PlayerProgression {
  #level = 1;
  #xp = 0;
  #pendingLevels = 0;
  #disposed = false;

  snapshot(): ProgressionSnapshot {
    this.assertLive();
    return { level: this.#level, xp: this.#xp, threshold: xpForNextLevel(this.#level), pendingLevels: this.#pendingLevels };
  }

  creditXp(amount: number): Readonly<{ creditedXp: number; levelsGained: number }> {
    this.assertLive();
    const next = addExperience({ level: this.#level, xp: this.#xp }, amount);
    const levelsGained = next.level - this.#level, pending = this.#pendingLevels + levelsGained;
    if (!Number.isSafeInteger(pending) || pending < 0 || pending > next.level - 1) {
      throw new RangeError('Invalid pending levels');
    }
    this.#level = next.level;
    this.#xp = next.xp;
    this.#pendingLevels = pending;
    return { creditedXp: amount, levelsGained };
  }

  resolvePendingLevel(): boolean {
    this.assertLive();
    if (this.#pendingLevels === 0) return false;
    this.#pendingLevels -= 1;
    return true;
  }

  dispose(): void { this.#disposed = true; }
  private assertLive(): void {
    if (this.#disposed) throw new Error('Cannot use disposed PlayerProgression');
  }
}
