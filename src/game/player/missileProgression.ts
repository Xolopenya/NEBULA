import type { MissileRanks } from '../progression/focusedUpgrade';
import type { TagId } from './PlayerBuild';

export type MissileBranch = 'guidance' | 'heavy' | 'fragmentation';
export type MissileDevelopment =
  | { kind: 'missileDevelopment'; branch: 'guidance'; upgrade: 'payload' | 'propulsion' | 'fuse' | 'endurance' }
  | { kind: 'missileDevelopment'; branch: 'heavy'; upgrade: 'payload' | 'propulsion' | 'blast' | 'reload' }
  | { kind: 'missileDevelopment'; branch: 'fragmentation'; upgrade: 'payload' | 'reload' | 'fragments' | 'endurance' };
export type MissileUpgradeId =
  | `missile.guidance.${Extract<MissileDevelopment, { branch: 'guidance' }>['upgrade']}`
  | `missile.heavy.${Extract<MissileDevelopment, { branch: 'heavy' }>['upgrade']}`
  | `missile.fragmentation.${Extract<MissileDevelopment, { branch: 'fragmentation' }>['upgrade']}`;
export type MissileChoice = { kind: 'missile'; upgrade: keyof MissileRanks } | { kind: 'cluster' }
  | { kind: 'missileSpecialization'; branch: MissileBranch } | MissileDevelopment
  | { kind: 'missileCapstone'; branch: MissileBranch };
export type MissileConfiguration = { ranks: MissileRanks; form: 'BASE' | 'CLUSTER' | 'GUIDANCE' | 'HEAVY' | 'FRAGMENTATION';
  upgrades: MissileUpgradeId[]; capstone: boolean };
export const MISSILE_BRANCHES = Object.freeze(['guidance', 'heavy', 'fragmentation'] as const);
export const MISSILE_DEVELOPMENTS = Object.freeze({
  guidance: Object.freeze(['payload', 'propulsion', 'fuse', 'endurance'] as const),
  heavy: Object.freeze(['payload', 'propulsion', 'blast', 'reload'] as const),
  fragmentation: Object.freeze(['payload', 'reload', 'fragments', 'endurance'] as const),
});
export const MISSILE_TAGS: Readonly<Record<MissileBranch, readonly TagId[]>> = Object.freeze({
  guidance: Object.freeze(['PRECISION', 'PROJECTILES', 'EXPLOSIONS', 'TECHNOLOGY'] as TagId[]),
  heavy: Object.freeze(['PROJECTILES', 'EXPLOSIONS', 'CONTROL'] as TagId[]),
  fragmentation: Object.freeze(['PROJECTILES', 'EXPLOSIONS'] as TagId[]),
});
const rankKeys = ['warheadPower', 'propulsion', 'blastExpansion'] as const;

function fields(value: unknown, keys: readonly string[]): void {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Reflect.ownKeys(value).length !== keys.length
    || keys.some(key => { const d = Object.getOwnPropertyDescriptor(value, key); return !d?.enumerable || !('value' in d); })) {
    throw new RangeError('Invalid Missile shape');
  }
}
function number(value: number, minimum = Number.MIN_VALUE): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > Number.MAX_SAFE_INTEGER) {
    throw new RangeError('Invalid Missile numeric value');
  }
  return value;
}
function spatial(value: number): void {
  number(value, 0);
  if (!Number.isSafeInteger(value)) throw new RangeError('Invalid Missile Spatial level');
}
function forceProduct(a: number, b: number): number {
  number(a, 0); number(b, 0);
  const result = number(a * b, 0);
  if (a !== 0 && b !== 0 && result === 0) throw new RangeError('Missile Impact underflow');
  return result;
}
export function initialMissile(): MissileConfiguration {
  return { ranks: { warheadPower: 0, propulsion: 0, blastExpansion: 0 }, form: 'BASE', upgrades: [], capstone: false };
}
export function validateMissile(c: MissileConfiguration): void {
  fields(c, ['ranks', 'form', 'upgrades', 'capstone']); fields(c.ranks, rankKeys);
  if (rankKeys.some(k => !Number.isInteger(c.ranks[k]) || c.ranks[k] < 0 || c.ranks[k] > 2)
    || !['BASE', 'CLUSTER', 'GUIDANCE', 'HEAVY', 'FRAGMENTATION'].includes(c.form)
    || typeof c.capstone !== 'boolean' || !Array.isArray(c.upgrades) || c.upgrades.length > 4
    || Reflect.ownKeys(c.upgrades).length !== c.upgrades.length + 1
    || Array.from({ length: c.upgrades.length }, (_, i) => Object.getOwnPropertyDescriptor(c.upgrades, String(i)))
      .some(d => !d?.enumerable || !('value' in d))) throw new RangeError('Invalid Missile configuration');
  const branch = MISSILE_BRANCHES.find(b => b.toUpperCase() === c.form);
  const allowed = branch ? MISSILE_DEVELOPMENTS[branch].map(u => `missile.${branch}.${u}`) : [];
  if (new Set(c.upgrades).size !== c.upgrades.length || c.upgrades.some(id => !allowed.includes(id))
    || c.capstone && c.upgrades.length !== 4 || !branch && (c.upgrades.length > 0 || c.capstone)
    || branch && rankKeys.reduce((sum, key) => sum + c.ranks[key], 0) < 3
    || c.form === 'CLUSTER' && rankKeys.some(k => c.ranks[k] !== 2)) throw new RangeError('Impossible Missile progression');
}
export function missileReady(c: MissileConfiguration): boolean {
  validateMissile(c); return c.form === 'BASE' && rankKeys.reduce((sum, key) => sum + c.ranks[key], 0) >= 3;
}
function validateChoice(choice: MissileChoice): void {
  if (!choice || typeof choice !== 'object') throw new RangeError('Invalid Missile choice');
  if (choice.kind === 'missile') {
    fields(choice, ['kind', 'upgrade']);
    if (!rankKeys.includes(choice.upgrade)) throw new RangeError('Unknown Missile tuning');
  } else if (choice.kind === 'cluster') fields(choice, ['kind']);
  else if (choice.kind === 'missileSpecialization' || choice.kind === 'missileCapstone' || choice.kind === 'missileDevelopment') {
    fields(choice, choice.kind === 'missileDevelopment' ? ['kind', 'branch', 'upgrade'] : ['kind', 'branch']);
    if (!MISSILE_BRANCHES.includes(choice.branch) || choice.kind === 'missileDevelopment'
      && !(MISSILE_DEVELOPMENTS[choice.branch] as readonly string[]).includes(choice.upgrade)) throw new RangeError('Unknown Missile branch choice');
  } else throw new RangeError('Unknown Missile choice');
}
export function prepareMissileChoice(current: MissileConfiguration, choice: MissileChoice, spatialLevel: number): MissileConfiguration {
  validateMissile(current); validateChoice(choice); spatial(spatialLevel);
  const c = structuredClone(current);
  if (choice.kind === 'missile') {
    if (c.ranks[choice.upgrade] === 2) throw new RangeError('Missile tuning capped');
    c.ranks[choice.upgrade]++;
  } else if (choice.kind === 'cluster') {
    if (c.form !== 'BASE' || spatialLevel < 1 || rankKeys.some(k => c.ranks[k] !== 2)) throw new RangeError('Cluster unavailable');
    c.form = 'CLUSTER';
  } else if (choice.kind === 'missileSpecialization') {
    if (!missileReady(c)) throw new RangeError('Missile specialization unavailable');
    c.form = choice.branch.toUpperCase() as MissileConfiguration['form'];
  } else {
    if (c.form !== choice.branch.toUpperCase()) throw new RangeError('Wrong Missile branch');
    if (choice.kind === 'missileCapstone') {
      if (c.capstone || c.upgrades.length !== 4) throw new RangeError('Missile Capstone unavailable');
      c.capstone = true;
    } else {
      const id = `missile.${choice.branch}.${choice.upgrade}` as MissileUpgradeId;
      if (c.upgrades.includes(id)) throw new RangeError('Missile development already taken');
      c.upgrades.push(id);
      c.upgrades.sort((a, b) => {
        const order = MISSILE_DEVELOPMENTS[choice.branch] as readonly string[];
        return order.indexOf(a.slice(a.lastIndexOf('.') + 1)) - order.indexOf(b.slice(b.lastIndexOf('.') + 1));
      });
    }
  }
  validateMissile(c);
  const profile = missileProfile(c);
  number(profile.explosionRadius + number(15 * spatialLevel, 0));
  return c;
}

export type MissileFlightValues = Readonly<{ damage: number; speed: number; radius: number;
  explosionRadius: number; lifetime: number; impact: number }>;
export type MissileProfile = Readonly<{ damage: number; fireInterval: number; projectileSpeed: number;
  radius: number; explosionRadius: number; lifetime: number; impact: number; fuseBasePx: number;
  detonateOnExpiry: boolean; fragmentCount: 0 | 4 | 6 | 8; fragmentLifetime: number }>;
export function missileProfile(c: MissileConfiguration): MissileProfile {
  validateMissile(c);
  const has = (upgrade: string) => c.upgrades.includes(`missile.${c.form.toLowerCase()}.${upgrade}` as MissileUpgradeId);
  let damage = 2 + c.ranks.warheadPower, fireInterval = 1800, projectileSpeed = 450 + 75 * c.ranks.propulsion;
  let explosionRadius = 120 + 30 * c.ranks.blastExpansion, radius = 8, lifetime = 4000, impact = 400, fuseBasePx = 0;
  let fragmentCount: 0 | 4 | 6 | 8 = 0, fragmentLifetime = 500;
  if (c.form === 'GUIDANCE') {
    damage *= has('payload') ? 1.1 : 0.9; fireInterval *= 0.85; projectileSpeed *= has('propulsion') ? 1.5 : 1.2;
    lifetime = has('endurance') ? 6000 : 5000; impact = 300; fuseBasePx = has('fuse') ? 80 : 64;
  } else if (c.form === 'HEAVY') {
    damage *= c.capstone ? 4 : has('payload') ? 3.5 : 3; fireInterval *= has('reload') ? 1.25 : 1.5;
    projectileSpeed *= has('propulsion') ? 0.9 : 0.75; explosionRadius *= has('blast') ? 1.8 : 1.5;
    radius = c.capstone ? 16 : 12; impact = c.capstone ? 1200 : 800;
  } else if (c.form === 'FRAGMENTATION') {
    damage *= has('payload') ? 1 : 0.75; fireInterval *= has('reload') ? 1 : 1.2; explosionRadius *= 0.85;
    impact = 300; fragmentCount = c.capstone ? 8 : has('fragments') ? 6 : 4;
    fragmentLifetime = has('endurance') ? 700 : 500;
  }
  return Object.freeze({ damage, fireInterval, projectileSpeed, explosionRadius, radius, lifetime, impact,
    fuseBasePx, detonateOnExpiry: c.form === 'GUIDANCE' && c.capstone, fragmentCount, fragmentLifetime });
}

// Explicit captured inputs; Combat Processor and Spatial remain owned by their current caller.
export type MissileCompositionContext = Readonly<{ combatMultiplier: number; spatialLevel: number }>;
export type MissileShipStats = Readonly<{ reactorPower: number; fireControl: number; projectileVelocity: number;
  projectileScale: number; engineering: number; impact: number }>;
export type ComposedMissileProfile = Readonly<{ parent: MissileFlightValues; fireInterval: number; fuseDistance: number;
  detonateOnExpiry: boolean; fragments: Readonly<{ count: 4 | 6 | 8; values: MissileFlightValues }> | null }>;
export function composeMissileProfile(c: MissileConfiguration, stats: MissileShipStats, context: MissileCompositionContext): ComposedMissileProfile {
  fields(stats, ['reactorPower', 'fireControl', 'projectileVelocity', 'projectileScale', 'engineering', 'impact']);
  fields(context, ['combatMultiplier', 'spatialLevel']); number(context.combatMultiplier); spatial(context.spatialLevel);
  for (const key of ['reactorPower', 'fireControl', 'projectileVelocity', 'projectileScale', 'engineering'] as const) number(stats[key], 0.01);
  number(stats.impact, 0);
  if (stats.fireControl > 100) throw new RangeError('Invalid Missile Fire Control');
  const p = missileProfile(c);
  const parent = Object.freeze({ damage: number(number(p.damage * context.combatMultiplier) * stats.reactorPower),
    speed: number(p.projectileSpeed * stats.projectileVelocity), radius: number(p.radius * stats.projectileScale),
    explosionRadius: number(p.explosionRadius + number(15 * context.spatialLevel, 0)),
    lifetime: p.lifetime, impact: forceProduct(p.impact, stats.impact) });
  const fireInterval = number(p.fireInterval / stats.fireControl, 1);
  const fuseDistance = p.fuseBasePx === 0 ? 0
    : number(Math.min(number(parent.explosionRadius * 0.75), number(p.fuseBasePx * Math.sqrt(stats.engineering))));
  if (c.form === 'CLUSTER') { number(parent.damage * 0.5); forceProduct(parent.impact, 0.5); }
  const fragments = p.fragmentCount === 0 ? null : Object.freeze({ count: p.fragmentCount, values: Object.freeze({
    damage: number(parent.damage * 0.25), impact: forceProduct(parent.impact, 0.25),
    speed: number(900 * stats.projectileVelocity), radius: number(3 * stats.projectileScale),
    explosionRadius: number(parent.explosionRadius * 0.2), lifetime: p.fragmentLifetime,
  }) });
  return Object.freeze({ parent, fireInterval, fuseDistance, detonateOnExpiry: p.detonateOnExpiry, fragments });
}
