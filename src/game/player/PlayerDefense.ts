export type PlayerDefenseSnapshot = {
  currentHull: number;
  currentShield: number;
  protectionRemaining: number;
};
export type IncomingDefenseResult = {
  accepted: boolean;
  protectionRejected: boolean;
  shieldLost: number;
  hullLost: number;
  hullDepleted: boolean;
};
const protectionDuration = 500;

function numeric(value: number, minimum = 0, maximum = Infinity): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError('Invalid PlayerDefense numeric value');
  }
}
function maxHull(value: number): void { numeric(value, 1, Number.MAX_SAFE_INTEGER); }

/** Transient defense arithmetic only. Scene authorizes lifecycle and presents results. */
export class PlayerDefense {
  #currentHull: number;
  #currentShield = 0;
  #protectionRemaining = 0;
  #disposed = false;

  constructor(initialHull: number) { maxHull(initialHull); this.#currentHull = initialHull; }

  snapshot(): PlayerDefenseSnapshot {
    this.assertLive();
    return { currentHull: this.#currentHull, currentShield: this.#currentShield,
      protectionRemaining: this.#protectionRemaining };
  }
  advanceProtection(delta: number): void {
    this.assertLive(); numeric(delta);
    this.#protectionRemaining = Math.max(0, this.#protectionRemaining - delta);
  }
  applyIncomingDamage(amount: number): IncomingDefenseResult {
    this.assertLive(); numeric(amount);
    if (amount === 0) throw new RangeError('PlayerDefense damage must be positive');
    const rejected = { accepted: false, protectionRejected: false, shieldLost: 0, hullLost: 0,
      hullDepleted: this.#currentHull === 0 };
    if (this.#currentHull === 0) return rejected;
    if (this.#protectionRemaining > 0) return { ...rejected, protectionRejected: true };
    const absorbed = Math.min(this.#currentShield, amount);
    const nextShield = this.#currentShield - absorbed;
    const nextHull = Math.max(0, this.#currentHull - (amount - absorbed));
    const shieldLost = this.#currentShield - nextShield, hullLost = this.#currentHull - nextHull;
    if (shieldLost === 0 && hullLost === 0) return rejected;
    this.#currentHull = nextHull;
    this.#currentShield = nextShield;
    this.#protectionRemaining = protectionDuration;
    return { accepted: true, protectionRejected: false, shieldLost, hullLost, hullDepleted: nextHull === 0 };
  }
  healHull(amount: number, maximumHull: number): number {
    this.assertLive(); numeric(amount); maxHull(maximumHull);
    const next = Math.min(maximumHull, this.#currentHull + Math.min(amount, Math.max(0, maximumHull - this.#currentHull)));
    const gained = Math.max(0, next - this.#currentHull);
    this.#currentHull = next;
    return gained;
  }
  reconcileMaxHull(maximumHull: number): void {
    this.assertLive(); maxHull(maximumHull);
    this.#currentHull = Math.min(this.#currentHull, maximumHull);
  }
  setCurrentShield(value: number): void {
    this.assertLive(); numeric(value, 0, Number.MAX_SAFE_INTEGER); this.#currentShield = value;
  }
  dispose(): void { this.#disposed = true; }
  private assertLive(): void {
    if (this.#disposed) throw new Error('Cannot use disposed PlayerDefense');
  }
}
