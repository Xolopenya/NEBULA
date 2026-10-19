import { describe, it, expect, vi } from 'vitest';
import { RewardTransaction, nextRewardOrdinal } from './RewardTransaction';
import { rewardChoices, choiceIdentity, type RewardCandidate } from './rewardChoices';

const candidates = () => rewardChoices.slice(0, 3).map(choice => ({ id: choiceIdentity(choice), choice }));
function presented() { const owner = new RewardTransaction(), token = owner.open(candidates()); owner.present(token); return { owner, token }; }

describe('RewardTransaction', () => {
  it('starts idle, opens exactly three copied canonical candidates and presents once', () => {
    const owner = new RewardTransaction(); expect(owner.snapshot()).toBeNull(); owner.assertCanOpen();
    const input = candidates(), token = owner.open(input);
    expect(token).toEqual({ offerId: 1 }); expect(Object.isFrozen(token)).toBe(true);
    expect(owner.snapshot()).toMatchObject({ offerId: 1, category: 'LEVEL_UP', phase: 'OFFER_GENERATED', candidates: input });
    expect(owner.trySelect(token, input[0].id, () => true)).toBe(false);
    expect(owner.present(token)).toBe(true); expect(owner.present(token)).toBe(false);
    expect(() => owner.open(input)).toThrow('already active');
  });
  it.each(rewardChoices)('copies and freezes canonical $kind input including nested choice', choice => {
    const owner = new RewardTransaction(), id = choiceIdentity(choice);
    const input = [{ id, choice: { ...choice } }, ...candidates().filter(c => c.id !== id).slice(0, 2)];
    const token = owner.open(input); owner.present(token);
    Reflect.set(input[0].choice, 'kind', 'forged'); input.pop();
    const read = owner.snapshot()!; Reflect.set(read.candidates[0].choice, 'kind', 'forged');
    const callback = vi.fn((c: RewardCandidate) => {
      expect(c.id).toBe(id); expect(c.choice).toEqual(choice);
      expect(Object.isFrozen(c)).toBe(true); expect(Object.isFrozen(c.choice)).toBe(true);
      expect(c).not.toBe(input[0]); expect(c.choice).not.toBe(input[0].choice); return true;
    });
    expect(owner.trySelect(token, id, callback)).toBe(true); expect(callback).toHaveBeenCalledOnce();
    expect(JSON.parse(JSON.stringify(read))).toEqual(read);
  });
  it.each([null, [], candidates().slice(1), [...candidates(), candidates()[0]], [candidates()[0], , candidates()[1]],
    [candidates()[0], candidates()[0], candidates()[1]],
    [{ id: 'laser.speed', choice: { kind: 'laser', upgrade: 'power' } }, ...candidates().slice(1)],
    [{ id: 'future', choice: { kind: 'active' } }, ...candidates().slice(1)],
    [{ ...candidates()[0], extra: 1 }, ...candidates().slice(1)],
    [{ id: 'prism', choice: { kind: 'prism', extra: 1 } }, ...candidates().slice(1)],
    [{ id: 'laser.power', choice: { kind: 'laser' } }, ...candidates().slice(1)]])('malformed open %# changes nothing', input => {
    const owner = new RewardTransaction(); expect(() => owner.open(input as RewardCandidate[])).toThrow(RangeError);
    expect(owner.snapshot()).toBeNull(); expect(owner.open(candidates()).offerId).toBe(1);
  });
  it('rejects clones, detached snapshots, cross-owner equal ordinals, unknown IDs and stale tokens', () => {
    const a = presented(), b = presented(), apply = vi.fn(() => true), before = a.owner.snapshot();
    for (const token of [{ ...a.token }, b.token, a.owner.snapshot()!, null]) {
      expect(a.owner.present(token!)).toBe(false); expect(a.owner.trySelect(token!, 'laser.power', apply)).toBe(false);
    }
    expect(a.owner.trySelect(a.token, 'future' as 'prism', apply)).toBe(false);
    expect(a.owner.snapshot()).toEqual(before); expect(apply).not.toHaveBeenCalled();
    expect(a.owner.trySelect(a.token, 'laser.power', apply)).toBe(true);
    const next = a.owner.open(candidates()); expect(next.offerId).toBe(2); a.owner.present(next);
    expect(a.owner.trySelect(a.token, 'laser.power', apply)).toBe(false); expect(apply).toHaveBeenCalledOnce();
  });
  it('false and throw-before-mutation preserve the same live offer for a valid retry', () => {
    const { owner, token } = presented(), before = owner.snapshot();
    expect(owner.trySelect(token, 'laser.power', () => false)).toBe(false); expect(owner.snapshot()).toEqual(before);
    expect(() => owner.trySelect(token, 'laser.power', () => { throw new RangeError('preflight'); })).toThrow('preflight');
    expect(owner.snapshot()).toEqual(before); expect(owner.trySelect(token, 'laser.power', () => true)).toBe(true);
    expect(owner.snapshot()).toBeNull(); expect(owner.trySelect(token, 'laser.power', () => true)).toBe(false);
  });
  it('blocks recursive selection/open, invalidates after callback and exits guard before Scene can open', () => {
    const { owner, token } = presented(), steps: string[] = [], duplicate = vi.fn(() => true);
    const accepted = owner.trySelect(token, 'laser.power', () => {
      steps.push('callback'); expect(owner.snapshot()?.phase).toBe('PRESENTED');
      expect(owner.trySelect(token, 'laser.power', duplicate)).toBe(false);
      expect(() => owner.open(candidates())).toThrow('already active');
      // Even explicit invalidation cannot allow a nested open while selection is active.
      owner.invalidate(); expect(owner.snapshot()).toBeNull();
      expect(() => owner.assertCanOpen()).toThrow('already active');
      expect(() => owner.open(candidates())).toThrow('already active');
      steps.push('callback true'); return true;
    });
    steps.push('trySelect returned'); expect(accepted).toBe(true); expect(owner.snapshot()).toBeNull();
    owner.assertCanOpen(); expect(owner.open(candidates()).offerId).toBe(2); steps.push('Scene next open');
    expect(duplicate).not.toHaveBeenCalled(); expect(steps).toEqual(['callback', 'callback true', 'trySelect returned', 'Scene next open']);
  });
  it('never revives an invalidated offer on false/throw and keeps ordinals monotonic', () => {
    const { owner, token } = presented(); expect(owner.trySelect(token, 'laser.power', () => { owner.invalidate(); return false; })).toBe(false);
    expect(owner.snapshot()).toBeNull(); expect(owner.open(candidates()).offerId).toBe(2);
    owner.invalidate(); owner.invalidate(); expect(owner.open(candidates()).offerId).toBe(3);
  });
  it.each([Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, -1, 1.5])('safe ordinal arithmetic rejects %s', ordinal => {
    expect(() => nextRewardOrdinal(ordinal)).toThrow(RangeError);
  });
  it('allows the final safe ordinal and starts each new run at one without sharing token authority', () => {
    expect(nextRewardOrdinal(Number.MAX_SAFE_INTEGER - 1)).toBe(Number.MAX_SAFE_INTEGER);
    expect(nextRewardOrdinal(0)).toBe(1);
    const a = presented(), b = presented(); expect(a.token).toEqual(b.token); expect(a.token).not.toBe(b.token);
  });
  it('rejects actual owner exhaustion without changing the current ordinal or opening an offer', () => {
    const owner = new RewardTransaction();
    owner['ordinal'] = Number.MAX_SAFE_INTEGER - 1; // Adversarial boundary fixture, no production setter.
    const last = owner.open(candidates()); expect(last.offerId).toBe(Number.MAX_SAFE_INTEGER);
    owner.invalidate(); expect(() => owner.assertCanOpen()).toThrow('ordinal exhausted');
    expect(() => owner.open(candidates())).toThrow('ordinal exhausted'); expect(owner.snapshot()).toBeNull();
    expect(owner['ordinal']).toBe(Number.MAX_SAFE_INTEGER);
  });
  it('disposes idempotently; every other command/read throws, old detached copies stay readable', () => {
    const { owner, token } = presented(), copy = owner.snapshot(); owner.dispose(); owner.dispose();
    for (const operation of [() => owner.assertCanOpen(), () => owner.open(candidates()), () => owner.present(token),
      () => owner.trySelect(token, 'laser.power', () => true), () => owner.invalidate(), () => owner.snapshot()]) {
      expect(operation).toThrow('disposed RewardTransaction');
    }
    expect(copy?.candidates).toHaveLength(3); expect(JSON.parse(JSON.stringify(copy))).toEqual(copy);
  });
});
