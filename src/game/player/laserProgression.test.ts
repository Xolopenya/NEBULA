import { describe, expect, it } from 'vitest';
import { PlayerBuild } from './PlayerBuild';
import { initialLaser, validateLaser, laserReady, laserProfile, laserAttack, prepareLaserChoice,
  LASER_BRANCHES, LASER_NEW_CHOICES, LASER_DEVELOPMENTS, LASER_TAGS, type LaserChoice } from './laserProgression';
import { createAttack, type Attack } from '../combat/combat';
import { laserDirections } from '../combat/laserPatterns';
import { choiceIdentity, isRewardChoice, rewardChoices } from '../rewards/rewardChoices';

function ready(b = new PlayerBuild()) {
  for (const upgrade of ['power', 'power', 'fireRate'] as const) b.applyLaserChoice({ kind: 'laser', upgrade }, 0);
  return b;
}
describe('GAME-056 closed Laser configuration and Build authority', () => {
  it.each(Array.from({ length: 27 }, (_, i) => [Math.floor(i / 9), Math.floor(i / 3) % 3, i % 3]))(
    'resolves ranks %s/%s/%s exactly, including sum2/3 and 2/1/0', (power, fireRate, speed) => {
      const c = { ...initialLaser(), ranks: { power, fireRate, speed } }, p = laserProfile(c);
      expect(p).toMatchObject({ damage: 1 + power, fireInterval: 600 - 50 * fireRate,
        projectileSpeed: 1200 + 200 * speed, radius: 6, lifetime: 2000, impact: 200, pelletCount: 1, maxHits: 1 });
      expect(laserReady(c)).toBe(power + fireRate + speed >= 3);
    });
  it('keeps detached previews/snapshots and commits one complete configuration with Tags', () => {
    const b = ready(), before = b.snapshot(), choice = { kind: 'laserSpecialization', branch: 'scatter' } as const;
    const preview = b.previewLaserChoice(choice, 0);
    expect(b.snapshot()).toEqual(before); expect(preview.tags).toMatchObject({ CLOSE_COMBAT: 1, PROJECTILES: 1, CONTROL: 1 });
    preview.laser.ranks.power = 0; preview.tags.CONTROL = 900;
    b.applyLaserChoice(choice, 0); const s = b.snapshot();
    expect(s.laser).toMatchObject({ ranks: before.laser.ranks, form: 'SCATTER' });
    expect(s.tags.CONTROL).toBe(1); expect(s.identity.dominantTags).toEqual(['CLOSE_COMBAT', 'PROJECTILES', 'CONTROL']);
    s.laser.upgrades.push('laser.scatter.damage'); s.laser.ranks.power = 0;
    expect(b.snapshot().laser.upgrades).toEqual([]); expect(b.snapshot().laser.ranks.power).toBe(2);
    const accepted = b.snapshot(); expect(() => b.applyLaserChoice(choice, 0)).toThrow(); expect(b.snapshot()).toEqual(accepted);
  });
  it.each(LASER_BRANCHES)('enforces all %s developments, exact Capstone dependency and exclusivity', branch => {
    const b = ready(), acquire = { kind: 'laserSpecialization', branch } as const;
    const projected = b.previewLaserChoice(acquire, 0); b.applyLaserChoice(acquire, 0);
    expect(b.snapshot().laser).toEqual(projected.laser); expect(b.snapshot().tags).toEqual(projected.tags);
    expect(() => b.applyLaserChoice({ kind: 'prism' }, 1)).toThrow();
    expect(() => b.applyLaserChoice({ kind: 'laserCapstone', branch }, 0)).toThrow();
    for (const upgrade of [...LASER_DEVELOPMENTS[branch]].reverse()) {
      const choice = { kind: 'laserDevelopment', branch, upgrade } as LaserChoice;
      b.applyLaserChoice(choice, 0); expect(() => b.applyLaserChoice(choice, 0)).toThrow();
    }
    b.applyLaserChoice({ kind: 'laserCapstone', branch }, 0);
    expect(() => b.applyLaserChoice({ kind: 'laserCapstone', branch }, 0)).toThrow();
    const p = laserProfile(b.snapshot().laser);
    expect(p).toMatchObject(branch === 'scatter' ? { damage: 3 * .65, fireInterval: 687.5, projectileSpeed: 900,
      radius: 6, lifetime: 650, impact: 400, pelletCount: 5, angularStep: 12 }
      : branch === 'repeater' ? { damage: 1.5, fireInterval: 137.5, projectileSpeed: 1440, impact: 120 }
        : { damage: 7.5, fireInterval: 962.5, projectileSpeed: 2400, radius: 8, maxHits: 5 });
    expect(b.snapshot().tags).toEqual(projected.tags);
    b.applyLaserChoice({ kind: 'laser', upgrade: 'speed' }, 0); expect(b.snapshot().laser.ranks.speed).toBe(1);
    expect(() => b.applyLaserChoice({ kind: 'laserSpecialization', branch: branch === 'scatter' ? 'lance' : 'scatter' }, 0)).toThrow();
  });
  it.each(LASER_NEW_CHOICES)('has an exact closed reward mapping for $kind $branch', c => {
    expect(isRewardChoice(c)).toBe(true); expect(rewardChoices.filter(x => choiceIdentity(x) === choiceIdentity(c))).toHaveLength(1);
    expect(isRewardChoice({ ...c, injected: true })).toBe(false);
  });
  it.each([
    ['scatter','damage','damage',3*.65],['scatter','focus','angularStep',12],
    ['scatter','range','lifetime',650],['scatter','impact','impact',400],
    ['repeater','damage','damage',1.5],['repeater','cadence','fireInterval',550*.30],
    ['repeater','velocity','projectileSpeed',1440],['repeater','impact','impact',120],
    ['lance','damage','damage',7.5],['lance','velocity','projectileSpeed',2400],
    ['lance','penetration','maxHits',4],['lance','radius','radius',8],
  ] as const)('%s %s changes only the authored local field %s', (branch,upgrade,field,value)=>{
    const b=ready();b.applyLaserChoice({kind:'laserSpecialization',branch},0);
    const before=laserProfile(b.snapshot().laser);
    b.applyLaserChoice({kind:'laserDevelopment',branch,upgrade} as LaserChoice,0);
    expect(laserProfile(b.snapshot().laser)).toEqual({...before,[field]:value});
  });
  it('retains Prism recipe, independent full beams, rank cap and no new Tags/developments', () => {
    const b = new PlayerBuild(); expect(() => b.applyLaserChoice({ kind: 'prism' }, 1)).toThrow();
    for (const upgrade of ['power', 'fireRate', 'speed'] as const) for (let i = 0; i < 2; i++) b.applyLaserChoice({ kind: 'laser', upgrade }, 0);
    expect(() => b.applyLaserChoice({ kind: 'prism' }, 0)).toThrow(); b.applyLaserChoice({ kind: 'prism' }, 1);
    const c = b.snapshot().laser, p = laserProfile(c); expect(p).toMatchObject({ damage: 3, fireInterval: 500, projectileSpeed: 1600 });
    expect(laserDirections(10, 0, p)).toHaveLength(3); expect(Object.values(b.snapshot().tags).every(n => n === 0)).toBe(true);
    expect(() => b.applyLaserChoice({ kind: 'laserSpecialization', branch: 'lance' }, 1)).toThrow();
    expect(() => b.applyLaserChoice({ kind: 'laser', upgrade: 'power' }, 1)).toThrow();
  });
  it('prepares all Tag arithmetic before any state write and enforces disposal', () => {
    const b = ready(); b.addTagPoints('CONTROL', Number.MAX_SAFE_INTEGER); const before = b.snapshot();
    expect(() => b.applyLaserChoice({ kind: 'laserSpecialization', branch: 'scatter' }, 0)).toThrow(); expect(b.snapshot()).toEqual(before);
    b.dispose(); expect(() => b.previewLaserChoice({ kind: 'laser', upgrade: 'speed' }, 0)).toThrow('disposed');
    expect(() => b.applyLaserChoice({ kind: 'laser', upgrade: 'speed' }, 0)).toThrow('disposed');
  });
  it.each([-1, .5, 3, NaN, Infinity, Number.MAX_SAFE_INTEGER])('rejects invalid rank%s without mutation', rank => {
    const c = initialLaser(); c.ranks.power = rank; expect(() => validateLaser(c)).toThrow(RangeError);
  });
  it('rejects cross-branch/extra/duplicate state and malformed correlated choices', () => {
    const c = ready().snapshot().laser;
    expect(() => prepareLaserChoice(c, { kind: 'laserDevelopment', branch: 'scatter', upgrade: 'velocity' } as unknown as LaserChoice, 0)).toThrow();
    expect(() => validateLaser({ ...c, upgrades: ['laser.scatter.damage'] })).toThrow();
    expect(LASER_NEW_CHOICES).toHaveLength(18); expect(rewardChoices).toHaveLength(54);
  });
  it.each(LASER_BRANCHES)('freezes %s launch mechanics/values, composes modifiers once, excludes Engineering', branch => {
    const b = ready(); b.applyLaserChoice({ kind: 'laserSpecialization', branch }, 0); const c = b.snapshot().laser;
    const stats = { ...b.getEffectiveStats(), reactorPower: 2, fireControl: 2, projectileVelocity: 3, projectileScale: 4, impact: 2, engineering: 100 };
    const p = laserProfile(c), attack = laserAttack(c, stats, 1.25);
    expect(attack.snapshot).toEqual({ damage: (p.damage * 1.25) * 2, speed: p.projectileSpeed * 3,
      radius: p.radius * 4, lifetime: p.lifetime, impact: p.impact * 2 });
    expect(Object.isFrozen(attack.mechanics)).toBe(true); expect(Object.isFrozen(attack.snapshot)).toBe(true);
    b.applyLaserChoice({ kind: 'laserDevelopment', branch, upgrade: 'damage' } as LaserChoice, 0);
    expect(attack.snapshot.damage).toBe(p.damage * 2.5); expect(LASER_TAGS[branch].length).toBeGreaterThan(0);
  });
  it.each(['SCATTER', 'REPEATER', 'LANCE'] as const)('copies %s mechanics and rejects illegal counts/non-Laser/Prism', pattern => {
    const mechanics = { pattern, maxHits: pattern === 'LANCE' ? 3 : 1, pelletCount: pattern === 'SCATTER' ? 3 : 1 };
    const input = { kind: 'LASER', variant: 'BASE', mechanics, snapshot: { damage: 1, speed: 1, radius: 1, lifetime: 1, impact: 0 } } as const;
    const a = createAttack(input); mechanics.maxHits = 99; expect((a as typeof input).mechanics.maxHits).not.toBe(99);
    expect(() => createAttack(input)).toThrow();
    expect(() => createAttack({ ...input, kind: 'COMBAT_DRONE' } as unknown as Attack)).toThrow();
    expect(() => createAttack({ ...input, variant: 'PRISM' } as unknown as Attack)).toThrow();
  });
  it('suppresses whole near-zero volleys and preserves deterministic normalized pellet order', () => {
    const b = ready(); b.applyLaserChoice({ kind: 'laserSpecialization', branch: 'scatter' }, 0); const p = laserProfile(b.snapshot().laser);
    expect(laserDirections(.0009, 0, p)).toEqual([]);
    const directions = laserDirections(.001, 0, p); expect(directions).toHaveLength(3);
    expect(directions[0]).toEqual({ x: 1, y: 0 }); expect(directions[1].y).toBeLessThan(0); expect(directions[2].y).toBeGreaterThan(0);
    for (const d of directions) expect(Math.hypot(d.x, d.y)).toBeCloseTo(1);
  });
  it.each(['scatter', 'repeater', 'lance'] as const)('%s rejects unsafe composed values before Build mutation or launch', branch => {
    const b=ready(); b.applyLaserChoice({kind:'laserSpecialization',branch},0);
    const c=b.snapshot().laser,stats=b.getEffectiveStats();
    for(const key of ['reactorPower','projectileVelocity','projectileScale','impact'] as const){
      expect(()=>laserAttack(c,{...stats,[key]:Number.MAX_SAFE_INTEGER},2)).toThrow(RangeError);
    }
    const before=b.snapshot();b.applyStatPercent('reactorPower',Number.MAX_SAFE_INTEGER-1);
    expect(()=>b.previewLaserChoice({kind:'laserDevelopment',branch,upgrade:'damage'},0)).toThrow(RangeError);
    expect(b.snapshot().laser).toEqual(before.laser);expect(b.snapshot().tags).toEqual(before.tags);
    expect(laserAttack(c,{...stats,impact:0},1).snapshot.impact).toBe(0);
  });
});
