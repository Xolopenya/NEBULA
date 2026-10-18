import { describe, expect, it } from 'vitest';
import { PlayerDefense } from './PlayerDefense';

describe('PlayerDefense', () => {
  it('starts full with Shield0/protection0 and detached plain JSON snapshots', () => {
    const d = new PlayerDefense(5), before = d.snapshot(), copy = d.snapshot();
    expect(before).toEqual({ currentHull: 5, currentShield: 0, protectionRemaining: 0 });
    copy.currentHull = 999; copy.currentShield = 999; copy.protectionRemaining = 999;
    expect(d.snapshot()).toEqual(before); expect(JSON.parse(JSON.stringify(before))).toEqual(before);
    expect(new PlayerDefense(2.5).snapshot().currentHull).toBe(2.5);
    expect(new PlayerDefense(Number.MAX_SAFE_INTEGER).snapshot().currentHull).toBe(Number.MAX_SAFE_INTEGER);
  });
  it.each([0, -1, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, '5', null, undefined])('rejects constructor %s', value => {
    expect(() => new PlayerDefense(value as number)).toThrow(RangeError);
  });
  it.each([NaN, Infinity, -Infinity, -1, '1', null, undefined, true, {}])('rejects invalid operation input %s atomically', value => {
    const d = new PlayerDefense(5); d.setCurrentShield(2); d.applyIncomingDamage(1); const before = d.snapshot();
    const n = value as number;
    for (const op of [() => d.applyIncomingDamage(n), () => d.advanceProtection(n), () => d.setCurrentShield(n),
      () => d.healHull(n, 5), () => d.healHull(1, n), () => d.reconcileMaxHull(n)]) {
      expect(op).toThrow(RangeError); expect(d.snapshot()).toEqual(before);
    }
  });
  it('rejects zero damage/invalid bounded maxima and Shields, with validation before protection/dead rejection', () => {
    const d = new PlayerDefense(5); d.applyIncomingDamage(1); const before = d.snapshot();
    expect(() => d.applyIncomingDamage(0)).toThrow(RangeError);
    for (const max of [0, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => d.healHull(1, max)).toThrow(RangeError); expect(() => d.reconcileMaxHull(max)).toThrow(RangeError);
    }
    expect(() => d.setCurrentShield(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError); expect(d.snapshot()).toEqual(before);
    d.advanceProtection(500); d.applyIncomingDamage(100); expect(() => d.applyIncomingDamage(NaN)).toThrow(RangeError);
  });
  it.each([1, 0.5, 5, 100, Number.MAX_VALUE])('applies actual Hull loss for amount%s and starts500 before returning', amount => {
    const d = new PlayerDefense(5), loss = Math.min(5, amount);
    expect(d.applyIncomingDamage(amount)).toEqual({ accepted: true, protectionRejected: false,
      shieldLost: 0, hullLost: loss, hullDepleted: loss === 5 });
    expect(d.snapshot()).toEqual({ currentHull: 5 - loss, currentShield: 0, protectionRemaining: 500 });
    if (loss === 5) {
      const before = d.snapshot(); expect(d.applyIncomingDamage(1)).toEqual({ accepted: false,
        protectionRejected: false, shieldLost: 0, hullLost: 0, hullDepleted: true }); expect(d.snapshot()).toEqual(before);
    }
  });
  it.each([[3, 2, 1, 5, 2, 0], [3, 3, 0, 5, 3, 0], [3, 5, 0, 3, 3, 2],
    [0.5, 0.75, 0, 4.75, 0.5, 0.25], [2, 100, 0, 0, 2, 5]])(
    'Shield%s takes incoming%s with same-hit overflow', (shield, amount, nextShield, hull, shieldLost, hullLost) => {
      const d = new PlayerDefense(5); d.setCurrentShield(shield);
      expect(d.applyIncomingDamage(amount)).toEqual({ accepted: true, protectionRejected: false,
        shieldLost, hullLost, hullDepleted: hull === 0 });
      expect(d.snapshot()).toEqual({ currentHull: hull, currentShield: nextShield, protectionRemaining: 500 });
    });
  it('rejects protected hits without extending, then accepts after exact expiry/overshoot', () => {
    const d = new PlayerDefense(5); d.setCurrentShield(3); d.applyIncomingDamage(2); d.advanceProtection(125);
    const before = d.snapshot();
    expect(d.applyIncomingDamage(3)).toEqual({ accepted: false, protectionRejected: true, shieldLost: 0, hullLost: 0, hullDepleted: false });
    d.advanceProtection(0); expect(d.snapshot()).toEqual(before); d.advanceProtection(375);
    expect(d.applyIncomingDamage(3)).toMatchObject({ accepted: true, shieldLost: 1, hullLost: 2 });
    d.advanceProtection(Number.MAX_VALUE); expect(d.snapshot().protectionRemaining).toBe(0);
  });
  it('no stored loss due to rounding does not accept a hit or start protection', () => {
    const d = new PlayerDefense(5), before = d.snapshot();
    expect(d.applyIncomingDamage(Number.MIN_VALUE)).toEqual({ accepted: false, protectionRejected: false,
      shieldLost: 0, hullLost: 0, hullDepleted: false }); expect(d.snapshot()).toEqual(before);
  });
  it('heals actual fractional Hull with capped overheal and unchanged Shield/protection', () => {
    const d = new PlayerDefense(5); d.applyIncomingDamage(2.5); d.setCurrentShield(2);
    expect(d.healHull(1, 5)).toBe(1); expect(d.healHull(0.25, 5)).toBe(0.25);
    expect(d.healHull(100, 5)).toBe(1.25); expect(d.healHull(1, 5)).toBe(0); expect(d.healHull(0, 5)).toBe(0);
    expect(d.snapshot()).toEqual({ currentHull: 5, currentShield: 2, protectionRemaining: 500 });
    expect(d.healHull(Number.MAX_VALUE, Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER - 5);
    expect(d.snapshot().currentHull).toBe(Number.MAX_SAFE_INTEGER);
    expect(d.healHull(1, 3)).toBe(0); expect(d.snapshot().currentHull).toBe(3);
  });
  it('reconciles only the current Hull cap; higher maxima do not heal or become stored truth', () => {
    const d = new PlayerDefense(5); d.setCurrentShield(2); d.applyIncomingDamage(1);
    d.reconcileMaxHull(10); expect(d.snapshot().currentHull).toBe(5);
    d.reconcileMaxHull(2.5); expect(d.snapshot()).toEqual({ currentHull: 2.5, currentShield: 1, protectionRemaining: 500 });
    d.reconcileMaxHull(20); expect(d.snapshot().currentHull).toBe(2.5);
    d.setCurrentShield(Number.MAX_SAFE_INTEGER); expect(d.snapshot().currentShield).toBe(Number.MAX_SAFE_INTEGER);
    d.setCurrentShield(0); expect(d.snapshot().protectionRemaining).toBe(500);
  });
  it('disposes idempotently and asserts live first for every read/mutation, leaving old copies/fresh owners independent', () => {
    const d = new PlayerDefense(5); d.applyIncomingDamage(1); const old = d.snapshot(); d.dispose(); d.dispose();
    for (const op of [() => d.snapshot(), () => d.advanceProtection(0), () => d.applyIncomingDamage(NaN),
      () => d.healHull(0, 5), () => d.reconcileMaxHull(5), () => d.setCurrentShield(0)]) {
      expect(op).toThrow('Cannot use disposed PlayerDefense');
    }
    expect(JSON.parse(JSON.stringify(old))).toEqual(old);
    expect(new PlayerDefense(5).snapshot()).toEqual({ currentHull: 5, currentShield: 0, protectionRemaining: 0 });
  });
});
