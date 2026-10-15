import { describe, expect, it } from 'vitest';
import { selectFocusedUpgrade, type MissileRanks } from './focusedUpgrade';
import type { LaserRanks } from './prismLaser';

const laser: Readonly<LaserRanks> = Object.freeze({ power: 0, fireRate: 0, speed: 0 });
const missile: Readonly<MissileRanks> = Object.freeze({ warheadPower: 0, propulsion: 0, blastExpansion: 0 });
const masteredLaser = { power: 2, fireRate: 2, speed: 2 };
const masteredMissile = { warheadPower: 2, propulsion: 2, blastExpansion: 2 };

describe('selectFocusedUpgrade', () => {
  it('starts with Laser Power and advances only the offered cursor', () => {
    expect(selectFocusedUpgrade('laser', laser, missile, { laser: 0, missile: 0 }))
      .toEqual({ kind: 'laser', upgrade: 'power', nextCursor: 1 });
  });

  it('prefers lower rank over the cursor position', () => {
    expect(selectFocusedUpgrade('laser', { power: 1, fireRate: 0, speed: 1 }, missile, { laser: 2, missile: 0 }))
      .toEqual({ kind: 'laser', upgrade: 'fireRate', nextCursor: 2 });
    expect(selectFocusedUpgrade('missile', laser, { warheadPower: 1, propulsion: 1, blastExpansion: 0 }, { laser: 0, missile: 0 }))
      .toEqual({ kind: 'missile', upgrade: 'blastExpansion', nextCursor: 0 });
  });

  it('rotates tied Laser tracks in stable cyclic order across presentations', () => {
    let cursor = 0;
    const offered = [];
    for (let presentation = 0; presentation < 4; presentation += 1) {
      const result = selectFocusedUpgrade('laser', laser, missile, { laser: cursor, missile: 0 });
      offered.push(result?.upgrade);
      cursor = result!.nextCursor;
    }
    expect(offered).toEqual(['power', 'fireRate', 'speed', 'power']);
  });

  it('rotates Missile ties independently in Warhead/Propulsion/Blast order', () => {
    let cursor = 0;
    const offered = [];
    for (let presentation = 0; presentation < 4; presentation += 1) {
      const result = selectFocusedUpgrade('missile', laser, missile, { laser: 2, missile: cursor });
      offered.push(result?.upgrade);
      cursor = result!.nextCursor;
    }
    expect(offered).toEqual(['warheadPower', 'propulsion', 'blastExpansion', 'warheadPower']);
  });

  it('skips capped tracks and wraps past them', () => {
    expect(selectFocusedUpgrade('laser', { power: 2, fireRate: 1, speed: 2 }, missile, { laser: 2, missile: 0 }))
      .toEqual({ kind: 'laser', upgrade: 'fireRate', nextCursor: 2 });
    expect(selectFocusedUpgrade('missile', laser, { warheadPower: 2, propulsion: 2, blastExpansion: 1 }, { laser: 0, missile: 0 }))
      .toEqual({ kind: 'missile', upgrade: 'blastExpansion', nextCursor: 0 });
  });

  it('falls back from mastered Laser using the Missile cursor', () => {
    expect(selectFocusedUpgrade('laser', masteredLaser, missile, { laser: 0, missile: 1 }))
      .toEqual({ kind: 'missile', upgrade: 'propulsion', nextCursor: 2 });
  });

  it('falls back from mastered Missile using the Laser cursor', () => {
    expect(selectFocusedUpgrade('missile', laser, masteredMissile, { laser: 2, missile: 0 }))
      .toEqual({ kind: 'laser', upgrade: 'speed', nextCursor: 0 });
  });

  it('returns no weapon option when both weapons are mastered', () => {
    expect(selectFocusedUpgrade('laser', masteredLaser, masteredMissile, { laser: 0, missile: 0 })).toBeUndefined();
  });

  it('does not mutate input ranks, focus or cursors, or reorder later selections', () => {
    const state = Object.freeze({ focus: 'laser' as const, laser, missile,
      cursors: Object.freeze({ laser: 0, missile: 2 }) });
    const before = JSON.stringify(state);
    const first = selectFocusedUpgrade(state.focus, state.laser, state.missile, state.cursors);
    selectFocusedUpgrade('missile', state.laser, state.missile, state.cursors);
    expect(selectFocusedUpgrade(state.focus, state.laser, state.missile, state.cursors)).toEqual(first);
    expect(JSON.stringify(state)).toBe(before);
  });
});
