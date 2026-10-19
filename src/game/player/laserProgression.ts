import type { LaserRanks } from '../progression/prismLaser';
import type { TagId, TagPoints, EffectiveStats } from './PlayerBuild';
import { composePlayerDamage, composePlayerImpact, createAttack, type LaserAttack } from '../combat/combat';

export type LaserBranch = 'scatter' | 'repeater' | 'lance';
export type LaserDevelopment = { kind: 'laserDevelopment'; branch: 'scatter'; upgrade: 'damage' | 'focus' | 'range' | 'impact' }
  | { kind: 'laserDevelopment'; branch: 'repeater'; upgrade: 'damage' | 'cadence' | 'velocity' | 'impact' }
  | { kind: 'laserDevelopment'; branch: 'lance'; upgrade: 'damage' | 'velocity' | 'penetration' | 'radius' };
export type LaserChoice = { kind: 'laser'; upgrade: keyof LaserRanks } | { kind: 'prism' }
  | { kind: 'laserSpecialization'; branch: LaserBranch } | LaserDevelopment
  | { kind: 'laserCapstone'; branch: LaserBranch };
export type LaserUpgradeId = `laser.scatter.${'damage' | 'focus' | 'range' | 'impact'}`
  | `laser.repeater.${'damage' | 'cadence' | 'velocity' | 'impact'}`
  | `laser.lance.${'damage' | 'velocity' | 'penetration' | 'radius'}`;
export type LaserConfiguration = { ranks: LaserRanks; form: 'BASE' | 'PRISM' | 'SCATTER' | 'REPEATER' | 'LANCE';
  upgrades: LaserUpgradeId[]; capstone: boolean };
export type LaserProfile = Readonly<{ damage: number; fireInterval: number; projectileSpeed: number;
  radius: number; lifetime: number; impact: number; pelletCount: number; angularStep: number; maxHits: number; color: number }>;
export const LASER_BRANCHES = Object.freeze(['scatter', 'repeater', 'lance'] as const);
export const LASER_DEVELOPMENTS = Object.freeze({
  scatter: Object.freeze(['damage', 'focus', 'range', 'impact'] as const),
  repeater: Object.freeze(['damage', 'cadence', 'velocity', 'impact'] as const),
  lance: Object.freeze(['damage', 'velocity', 'penetration', 'radius'] as const),
});
export const LASER_TAGS: Readonly<Record<LaserBranch, readonly TagId[]>> = Object.freeze({
  scatter: Object.freeze(['CLOSE_COMBAT', 'PROJECTILES', 'CONTROL'] as TagId[]),
  repeater: Object.freeze(['RAPID_FIRE', 'PROJECTILES'] as TagId[]),
  lance: Object.freeze(['PRECISION', 'PROJECTILES'] as TagId[]),
});
export const LASER_NEW_CHOICES: readonly LaserChoice[] = Object.freeze([
  ...LASER_BRANCHES.map(branch => ({ kind: 'laserSpecialization' as const, branch })),
  ...LASER_BRANCHES.flatMap(branch => [
    ...LASER_DEVELOPMENTS[branch].map(upgrade => ({ kind: 'laserDevelopment', branch, upgrade } as LaserDevelopment)),
    { kind: 'laserCapstone' as const, branch },
  ]),
].map(c => Object.freeze(c)));
const rankKeys = ['power', 'fireRate', 'speed'] as const;
function fields(value: unknown, keys: readonly string[]): void {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Reflect.ownKeys(value).length !== keys.length
    || keys.some(k => !Object.hasOwn(value, k))) throw new RangeError('Invalid Laser shape');
}
export function initialLaser(): LaserConfiguration {
  return { ranks: { power: 0, fireRate: 0, speed: 0 }, form: 'BASE', upgrades: [], capstone: false };
}
export function laserTagCandidate(tags: Readonly<TagPoints>, choice: LaserChoice): TagPoints {
  const next = { ...tags };
  if (choice.kind === 'laserSpecialization') for (const tag of LASER_TAGS[choice.branch]) {
    const value = next[tag] + 1;
    if (!Number.isSafeInteger(value) || value <= next[tag]) throw new RangeError('Laser Tag overflow');
    next[tag] = value;
  }
  return next;
}
export function validateLaser(c: LaserConfiguration): void {
  fields(c, ['ranks', 'form', 'upgrades', 'capstone']); fields(c.ranks, rankKeys);
  if (rankKeys.some(k => !Number.isInteger(c.ranks[k]) || c.ranks[k] < 0 || c.ranks[k] > 2)
    || !['BASE', 'PRISM', 'SCATTER', 'REPEATER', 'LANCE'].includes(c.form)
    || !Array.isArray(c.upgrades) || typeof c.capstone !== 'boolean') throw new RangeError('Invalid Laser state');
  const branch = LASER_BRANCHES.find(b => b.toUpperCase() === c.form);
  const allowed = branch ? LASER_DEVELOPMENTS[branch].map(u => `laser.${branch}.${u}`) : [];
  if (new Set(c.upgrades).size !== c.upgrades.length || Array.from(c.upgrades).some(id => !allowed.includes(id))
    || c.capstone && c.upgrades.length !== 4 || !branch && (c.upgrades.length || c.capstone)
    || branch && rankKeys.reduce((n, k) => n + c.ranks[k], 0) < 3
    || c.form === 'PRISM' && rankKeys.some(k => c.ranks[k] !== 2)) throw new RangeError('Invalid Laser progression');
}
export function laserReady(c: LaserConfiguration): boolean {
  validateLaser(c); return c.form === 'BASE' && c.ranks.power + c.ranks.fireRate + c.ranks.speed >= 3;
}
export function isLaserChoice(value: unknown): value is LaserChoice {
  if (!value || typeof value !== 'object') return false;
  const old: LaserChoice[] = [...rankKeys.map(upgrade => ({ kind: 'laser' as const, upgrade })), { kind: 'prism' }];
  return [...old, ...LASER_NEW_CHOICES].some(c => Reflect.ownKeys(value).length === Reflect.ownKeys(c).length
    && Reflect.ownKeys(c).every(k => Object.hasOwn(value, k) && Reflect.get(value, k) === Reflect.get(c, k)));
}
export function prepareLaserChoice(current: LaserConfiguration, choice: LaserChoice, combatLevel: number): LaserConfiguration {
  validateLaser(current);
  if (!isLaserChoice(choice) || !Number.isSafeInteger(combatLevel) || combatLevel < 0) throw new RangeError('Invalid Laser choice');
  const c = structuredClone(current);
  if (choice.kind === 'laser') {
    if (c.ranks[choice.upgrade] >= 2) throw new RangeError('Laser tuning capped');
    c.ranks[choice.upgrade]++;
  } else if (choice.kind === 'prism') {
    if (c.form !== 'BASE' || combatLevel < 1 || rankKeys.some(k => c.ranks[k] !== 2)) throw new RangeError('Prism unavailable');
    c.form = 'PRISM';
  } else if (choice.kind === 'laserSpecialization') {
    if (!laserReady(c)) throw new RangeError('Laser specialization unavailable');
    c.form = choice.branch.toUpperCase() as LaserConfiguration['form'];
  } else {
    if (c.form !== choice.branch.toUpperCase()) throw new RangeError('Wrong Laser branch');
    if (choice.kind === 'laserCapstone') {
      if (c.capstone || c.upgrades.length !== 4) throw new RangeError('Laser Capstone unavailable');
      c.capstone = true;
    } else {
      const id = `laser.${choice.branch}.${choice.upgrade}` as LaserUpgradeId;
      if (c.upgrades.includes(id)) throw new RangeError('Laser development already taken');
      c.upgrades.push(id);
      // Snapshot order is canonical, independent of acquisition order.
      c.upgrades.sort((a, b) => LASER_DEVELOPMENTS[choice.branch].findIndex(u => a.endsWith(`.${u}`))
        - LASER_DEVELOPMENTS[choice.branch].findIndex(u => b.endsWith(`.${u}`)));
    }
  }
  validateLaser(c); laserProfile(c); return c;
}
export function laserProfile(c: LaserConfiguration): LaserProfile {
  validateLaser(c);
  const has = (name: string) => c.upgrades.includes(`laser.${c.form.toLowerCase()}.${name}` as LaserUpgradeId);
  let damage = 1 + c.ranks.power, fireInterval = Math.max(100, 600 - 50 * c.ranks.fireRate);
  let projectileSpeed = 1200 + 200 * c.ranks.speed, radius = 6, lifetime = 2000, impact = 200;
  let pelletCount = c.form === 'PRISM' ? 3 : 1, angularStep = c.form === 'PRISM' ? 12 : 0, maxHits = 1, color = 0x67e8f9;
  if (c.form === 'SCATTER') {
    damage *= has('damage') ? 0.65 : 0.5; fireInterval *= 1.25; projectileSpeed *= 0.75;
    lifetime = has('range') ? 650 : 500; impact = has('impact') ? 400 : 300;
    pelletCount = c.capstone ? 5 : 3; angularStep = has('focus') ? 12 : 15; color = 0xfb923c;
  } else if (c.form === 'REPEATER') {
    damage *= has('damage') ? 0.5 : 0.4; fireInterval *= c.capstone ? 0.25 : has('cadence') ? 0.30 : 0.35;
    projectileSpeed *= has('velocity') ? 1.2 : 1; impact = has('impact') ? 120 : 80; color = 0xfde047;
  } else if (c.form === 'LANCE') {
    damage *= has('damage') ? 2.5 : 2; fireInterval *= 1.75; projectileSpeed *= has('velocity') ? 2 : 1.5;
    radius = has('radius') ? 8 : 6; impact = 240; maxHits = c.capstone ? 5 : has('penetration') ? 4 : 3; color = 0xbae6fd;
  }
  return Object.freeze({ damage, fireInterval, projectileSpeed, radius, lifetime, impact, pelletCount, angularStep, maxHits, color });
}
export function laserAttack(c: LaserConfiguration, stats: Readonly<EffectiveStats>, combat: number): LaserAttack {
  const p = laserProfile(c), delay = p.fireInterval / stats.fireControl;
  if (!Number.isFinite(delay) || delay < 1 || delay > Number.MAX_SAFE_INTEGER) throw new RangeError('Invalid Laser cadence');
  const mechanics = c.form === 'SCATTER' || c.form === 'REPEATER' || c.form === 'LANCE'
    ? { pattern: c.form, maxHits: p.maxHits, pelletCount: p.pelletCount } : undefined;
  return createAttack({ kind: 'LASER', variant: c.form === 'PRISM' ? 'PRISM' : 'BASE',
    ...(mechanics ? { mechanics } : {}), snapshot: {
      damage: composePlayerDamage('LASER', p.damage, combat, stats.reactorPower, stats.engineering),
      speed: p.projectileSpeed * stats.projectileVelocity, radius: p.radius * stats.projectileScale,
      lifetime: p.lifetime, impact: composePlayerImpact(p.impact, stats.impact),
    } }) as LaserAttack;
}
