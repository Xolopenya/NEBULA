import { describe, expect, it } from 'vitest';
import { selectFocusedUpgrade, type MissileRanks } from './focusedUpgrade';
import type { LaserRanks } from './prismLaser';

const laser: Readonly<LaserRanks> = Object.freeze({ power: 0, fireRate: 0, speed: 0 });
const missile: Readonly<MissileRanks> = Object.freeze({ warheadPower: 0, propulsion: 0, blastExpansion: 0 });
const masteredLaser = { power: 2, fireRate: 2, speed: 2 };
const masteredMissile = { warheadPower: 2, propulsion: 2, blastExpansion: 2 };
const drone = Object.freeze({ boltPower: 0, firingSystem: 0, boltPropulsion: 0 });
const masteredDrone = Object.freeze({ boltPower: 2, firingSystem: 2, boltPropulsion: 2 });

describe('selectFocusedUpgrade', () => {
  it('starts explicit Drone focus at Bolt Power', () => {
    expect(selectFocusedUpgrade('drone', laser, missile, drone, { laser: 2, missile: 1, drone: 0 }))
      .toEqual({ kind: 'drone', upgrade: 'boltPower', nextCursor: 1 });
  });

  it('prefers the lower Drone rank over cursor position and skips caps', () => {
    expect(selectFocusedUpgrade('drone', laser, missile,
      { boltPower: 1, firingSystem: 0, boltPropulsion: 1 }, { laser: 0, missile: 0, drone: 2 }))
      .toEqual({ kind: 'drone', upgrade: 'firingSystem', nextCursor: 2 });
    expect(selectFocusedUpgrade('drone', laser, missile,
      { boltPower: 2, firingSystem: 2, boltPropulsion: 1 }, { laser: 0, missile: 0, drone: 0 }))
      .toEqual({ kind: 'drone', upgrade: 'boltPropulsion', nextCursor: 0 });
  });

  it('cycles Drone ties independently from both other cursors', () => {
    const cursors = { laser: 2, missile: 1, drone: 0 };
    const offered = [];
    for (let i = 0; i < 4; i++) {
      const result = selectFocusedUpgrade('drone', laser, missile, drone, cursors)!;
      offered.push(result.upgrade);
      cursors.drone = result.nextCursor;
    }
    expect(offered).toEqual(['boltPower', 'firingSystem', 'boltPropulsion', 'boltPower']);
    expect(cursors).toEqual({ laser: 2, missile: 1, drone: 1 });
  });

  it('preserves Laser/Missile fallback priority even with Drone eligible', () => {
    const cursors = { laser: 0, missile: 0, drone: 0 };
    expect(selectFocusedUpgrade('laser', masteredLaser, missile, drone, cursors)?.kind).toBe('missile');
    expect(selectFocusedUpgrade('missile', laser, masteredMissile, drone, cursors)?.kind).toBe('laser');
  });

  it('falls back to Drone when both older weapons are mastered', () => {
    for (const focus of ['laser', 'missile'] as const) {
      expect(selectFocusedUpgrade(focus, masteredLaser, masteredMissile, drone, { laser: 0, missile: 0, drone: 1 }))
        .toEqual({ kind: 'drone', upgrade: 'firingSystem', nextCursor: 2 });
    }
  });

  it('falls back from mastered Drone to Laser before Missile', () => {
    expect(selectFocusedUpgrade('drone', laser, missile, masteredDrone, { laser: 2, missile: 0, drone: 1 }))
      .toEqual({ kind: 'laser', upgrade: 'speed', nextCursor: 0 });
    expect(selectFocusedUpgrade('drone', masteredLaser, missile, masteredDrone, { laser: 0, missile: 1, drone: 0 }))
      .toEqual({ kind: 'missile', upgrade: 'propulsion', nextCursor: 2 });
  });

  it('returns undefined for every focus when all weapons are mastered', () => {
    for (const focus of ['laser', 'missile', 'drone'] as const) {
      expect(selectFocusedUpgrade(focus, masteredLaser, masteredMissile, masteredDrone,
        { laser: 0, missile: 0, drone: 0 })).toBeUndefined();
    }
  });

  it('does not mutate Drone ranks or any cursor during selection or fallback', () => {
    const ranks = Object.freeze({ boltPower: 1, firingSystem: 0, boltPropulsion: 2 });
    const cursors = Object.freeze({ laser: 1, missile: 2, drone: 2 });
    const before = JSON.stringify({ ranks, cursors });
    selectFocusedUpgrade('drone', laser, missile, ranks, cursors);
    selectFocusedUpgrade('laser', masteredLaser, masteredMissile, ranks, cursors);
    expect(JSON.stringify({ ranks, cursors })).toBe(before);
  });

  it('starts with Laser Power and advances only the offered cursor', () => {
    expect(selectFocusedUpgrade('laser', laser, missile, masteredDrone, { laser: 0, missile: 0, drone: 0 }))
      .toEqual({ kind: 'laser', upgrade: 'power', nextCursor: 1 });
  });

  it('prefers lower rank over the cursor position', () => {
    expect(selectFocusedUpgrade('laser', { power: 1, fireRate: 0, speed: 1 }, missile, masteredDrone, { laser: 2, missile: 0, drone: 0 }))
      .toEqual({ kind: 'laser', upgrade: 'fireRate', nextCursor: 2 });
    expect(selectFocusedUpgrade('missile', laser, { warheadPower: 1, propulsion: 1, blastExpansion: 0 }, masteredDrone, { laser: 0, missile: 0, drone: 0 }))
      .toEqual({ kind: 'missile', upgrade: 'blastExpansion', nextCursor: 0 });
  });

  it('rotates tied Laser tracks in stable cyclic order across presentations', () => {
    let cursor = 0;
    const offered = [];
    for (let presentation = 0; presentation < 4; presentation += 1) {
      const result = selectFocusedUpgrade('laser', laser, missile, masteredDrone, { laser: cursor, missile: 0, drone: 0 });
      offered.push(result?.upgrade);
      cursor = result!.nextCursor;
    }
    expect(offered).toEqual(['power', 'fireRate', 'speed', 'power']);
  });

  it('rotates Missile ties independently in Warhead/Propulsion/Blast order', () => {
    let cursor = 0;
    const offered = [];
    for (let presentation = 0; presentation < 4; presentation += 1) {
      const result = selectFocusedUpgrade('missile', laser, missile, masteredDrone, { laser: 2, missile: cursor, drone: 0 });
      offered.push(result?.upgrade);
      cursor = result!.nextCursor;
    }
    expect(offered).toEqual(['warheadPower', 'propulsion', 'blastExpansion', 'warheadPower']);
  });

  it('skips capped tracks and wraps past them', () => {
    expect(selectFocusedUpgrade('laser', { power: 2, fireRate: 1, speed: 2 }, missile, masteredDrone, { laser: 2, missile: 0, drone: 0 }))
      .toEqual({ kind: 'laser', upgrade: 'fireRate', nextCursor: 2 });
    expect(selectFocusedUpgrade('missile', laser, { warheadPower: 2, propulsion: 2, blastExpansion: 1 }, masteredDrone, { laser: 0, missile: 0, drone: 0 }))
      .toEqual({ kind: 'missile', upgrade: 'blastExpansion', nextCursor: 0 });
  });

  it('falls back from mastered Laser using the Missile cursor', () => {
    expect(selectFocusedUpgrade('laser', masteredLaser, missile, masteredDrone, { laser: 0, missile: 1, drone: 0 }))
      .toEqual({ kind: 'missile', upgrade: 'propulsion', nextCursor: 2 });
  });

  it('falls back from mastered Missile using the Laser cursor', () => {
    expect(selectFocusedUpgrade('missile', laser, masteredMissile, masteredDrone, { laser: 2, missile: 0, drone: 0 }))
      .toEqual({ kind: 'laser', upgrade: 'speed', nextCursor: 0 });
  });

  it('returns no weapon option when all three weapons are mastered', () => {
    expect(selectFocusedUpgrade('laser', masteredLaser, masteredMissile, masteredDrone, { laser: 0, missile: 0, drone: 0 })).toBeUndefined();
  });

  it('does not mutate input ranks, focus or cursors, or reorder later selections', () => {
    const state = Object.freeze({ focus: 'laser' as const, laser, missile,
      cursors: Object.freeze({ laser: 0, missile: 2, drone: 0 }) });
    const before = JSON.stringify(state);
    const first = selectFocusedUpgrade(state.focus, state.laser, state.missile, masteredDrone, state.cursors);
    selectFocusedUpgrade('missile', state.laser, state.missile, masteredDrone, state.cursors);
    expect(selectFocusedUpgrade(state.focus, state.laser, state.missile, masteredDrone, state.cursors)).toEqual(first);
    expect(JSON.stringify(state)).toBe(before);
  });
});


describe('GAME-054 hard-eligible focus mask', () => {
  const cursors = { laser: 0, missile: 0, drone: 0 };
  const mask = () => ({ laser: { power: true, fireRate: true, speed: true },
    missile: { warheadPower: true, propulsion: true, blastExpansion: true }, drone: { boltPower: true, firingSystem: true, boltPropulsion: true } });
  it('skips an infeasible least-rank track without sampling or changing caller cursors', () => {
    const eligible = mask(); eligible.laser.power = false;
    expect(selectFocusedUpgrade('laser', laser, missile, drone, cursors, eligible)).toEqual({ kind: 'laser', upgrade: 'fireRate', nextCursor: 2 });
    expect(cursors).toEqual({ laser: 0, missile: 0, drone: 0 });
  });
  it('falls back in canonical weapon order when a focused system has no eligible track', () => {
    const eligible = mask(); eligible.drone = { boltPower: false, firingSystem: false, boltPropulsion: false };
    expect(selectFocusedUpgrade('drone', laser, missile, drone, cursors, eligible)).toEqual({ kind: 'laser', upgrade: 'power', nextCursor: 1 });
  });
  it('returns undefined only when all tracks are capped or hard-ineligible', () => {
    const eligible = mask(); eligible.drone = { boltPower: false, firingSystem: false, boltPropulsion: false };
    expect(selectFocusedUpgrade('drone', masteredLaser, masteredMissile, drone, cursors, eligible)).toBeUndefined();
  });
});
