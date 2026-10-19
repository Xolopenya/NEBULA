import { copyCandidate, type RewardCandidate, type RewardCandidateId } from './rewardChoices';

export type RewardToken = Readonly<{ offerId: number }>;
export type RewardOfferSnapshot = Readonly<{ offerId: number; category: 'LEVEL_UP';
  phase: 'OFFER_GENERATED' | 'PRESENTED'; candidates: readonly RewardCandidate[] }>;

export function nextRewardOrdinal(current: number): number {
  if (!Number.isSafeInteger(current) || current < 0 || !Number.isSafeInteger(current + 1)) {
    throw new RangeError('Reward ordinal exhausted');
  }
  return current + 1;
}

/** Selection identity only. Application and post-return Scene orchestration are separate. */
export class RewardTransaction {
  private ordinal = 0;
  #token: RewardToken | null = null;
  #offer: RewardOfferSnapshot | null = null;
  #selecting = false;
  #disposed = false;

  assertCanOpen(): void {
    this.assertLive();
    if (this.#selecting || this.#offer) throw new Error('Reward transaction already active');
    nextRewardOrdinal(this.ordinal);
  }

  open(candidates: readonly RewardCandidate[]): RewardToken {
    this.assertCanOpen();
    if (!Array.isArray(candidates) || candidates.length !== 3) throw new RangeError('Exactly three reward candidates required');
    const copied = Array.from(candidates, copyCandidate); // Sparse arrays must validate missing entries too.
    if (new Set(copied.map(c => c.id)).size !== 3) throw new RangeError('Distinct reward candidates required');
    const token = Object.freeze({ offerId: this.ordinal + 1 });
    this.ordinal = token.offerId;
    this.#token = token;
    this.#offer = Object.freeze({ offerId: token.offerId, category: 'LEVEL_UP', phase: 'OFFER_GENERATED',
      candidates: Object.freeze(copied) });
    return token;
  }

  present(token: RewardToken): boolean {
    this.assertLive();
    if (this.#selecting || token !== this.#token || this.#offer?.phase !== 'OFFER_GENERATED') return false;
    this.#offer = Object.freeze({ ...this.#offer, phase: 'PRESENTED' });
    return true;
  }

  trySelect(token: RewardToken, id: RewardCandidateId, applyCurrentCandidate: (candidate: RewardCandidate) => boolean): boolean {
    this.assertLive();
    if (this.#selecting || token !== this.#token || this.#offer?.phase !== 'PRESENTED') return false;
    const candidate = this.#offer.candidates.find(c => c.id === id);
    if (!candidate) return false;
    this.#selecting = true;
    try {
      const accepted = applyCurrentCandidate(candidate);
      if (accepted !== true) return false;
      this.invalidate(); // No accepted token survives to Scene, including queued pointer events.
      return true;
    } finally {
      this.#selecting = false; // Runs before trySelect returns, on rejection and exceptions too.
    }
  }

  invalidate(): void { this.assertLive(); this.#token = null; this.#offer = null; }
  snapshot(): RewardOfferSnapshot | null {
    this.assertLive();
    return this.#offer && structuredClone(this.#offer);
  }
  dispose(): void { this.#token = null; this.#offer = null; this.#disposed = true; }
  private assertLive(): void {
    if (this.#disposed) throw new Error('Cannot use disposed RewardTransaction');
  }
}
