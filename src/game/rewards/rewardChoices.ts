import type { LaserRanks } from '../progression/prismLaser';
import type { MissileRanks, DroneRanks } from '../progression/focusedUpgrade';
import { LASER_NEW_CHOICES, type LaserChoice, type LaserUpgradeId, type LaserBranch } from '../player/laserProgression';
import { MISSILE_BRANCHES, MISSILE_DEVELOPMENTS, type MissileChoice, type MissileDevelopment,
  type MissileUpgradeId, type MissileBranch } from '../player/missileProgression';

export type NewMissileChoice = Exclude<MissileChoice, { kind: 'missile' | 'cluster' }>;
export const MISSILE_NEW_CHOICES: readonly NewMissileChoice[] = Object.freeze([
  ...MISSILE_BRANCHES.map(branch => ({ kind: 'missileSpecialization' as const, branch })),
  ...MISSILE_BRANCHES.flatMap(branch => [
    ...MISSILE_DEVELOPMENTS[branch].map(upgrade => ({ kind: 'missileDevelopment', branch, upgrade } as MissileDevelopment)),
    { kind: 'missileCapstone' as const, branch },
  ]),
].map(choice => Object.freeze(choice)));
export function isNewMissileChoice(choice: LevelUpChoice): choice is NewMissileChoice {
  return choice.kind === 'missileSpecialization' || choice.kind === 'missileDevelopment' || choice.kind === 'missileCapstone';
}

export type PassiveModule = 'hull' | 'thruster' | 'collector' | 'combat' | 'spatial' | 'replication';
export type OrdinaryChoice = { readonly kind: 'laser'; readonly upgrade: keyof LaserRanks }
  | { readonly kind: 'missile'; readonly upgrade: keyof MissileRanks }
  | { readonly kind: 'drone'; readonly upgrade: keyof DroneRanks }
  | { readonly kind: 'passive'; readonly module: PassiveModule }
  | Exclude<LaserChoice, { kind: 'laser' | 'prism' }> | NewMissileChoice;
export type LevelUpChoice = OrdinaryChoice | { readonly kind: 'prism' } | { readonly kind: 'cluster' } | { readonly kind: 'twin' };
export type RewardCandidateId = `laser.${keyof LaserRanks}` | `missile.${keyof MissileRanks}`
  | `drone.${keyof DroneRanks}` | `passive.${PassiveModule}` | 'prism' | 'cluster' | 'twin'
  | `laser.specialize.${LaserBranch}` | LaserUpgradeId | `laser.${LaserBranch}.capstone`
  | `missile.specialize.${MissileBranch}` | MissileUpgradeId | `missile.${MissileBranch}.capstone`;
export type RewardCandidate = Readonly<{ id: RewardCandidateId; choice: LevelUpChoice }>;

/** Canonical prototype order is part of the seeded offer contract. */
export const levelUpPool: readonly OrdinaryChoice[] = Object.freeze([
  { kind: 'laser', upgrade: 'power' }, { kind: 'laser', upgrade: 'fireRate' }, { kind: 'laser', upgrade: 'speed' },
  { kind: 'missile', upgrade: 'warheadPower' }, { kind: 'missile', upgrade: 'propulsion' }, { kind: 'missile', upgrade: 'blastExpansion' },
  { kind: 'drone', upgrade: 'boltPower' }, { kind: 'drone', upgrade: 'firingSystem' }, { kind: 'drone', upgrade: 'boltPropulsion' },
  { kind: 'passive', module: 'hull' }, { kind: 'passive', module: 'thruster' }, { kind: 'passive', module: 'collector' },
  { kind: 'passive', module: 'combat' }, { kind: 'passive', module: 'spatial' }, { kind: 'passive', module: 'replication' },
  ...LASER_NEW_CHOICES, ...MISSILE_NEW_CHOICES,
].map(choice => Object.freeze(choice)) as OrdinaryChoice[]);
export const rewardChoices: readonly LevelUpChoice[] = Object.freeze([...levelUpPool.slice(0, 15),
  Object.freeze({ kind: 'prism' as const }), Object.freeze({ kind: 'cluster' as const }), Object.freeze({ kind: 'twin' as const }),
  ...LASER_NEW_CHOICES, ...MISSILE_NEW_CHOICES]);

export function choiceIdentity(choice: LevelUpChoice): RewardCandidateId {
  if (choice.kind === 'missileSpecialization') return `missile.specialize.${choice.branch}`;
  if (choice.kind === 'missileDevelopment') return `missile.${choice.branch}.${choice.upgrade}` as MissileUpgradeId;
  if (choice.kind === 'missileCapstone') return `missile.${choice.branch}.capstone`;
  if (choice.kind === 'laserSpecialization') return `laser.specialize.${choice.branch}`;
  if (choice.kind === 'laserDevelopment') return `laser.${choice.branch}.${choice.upgrade}` as LaserUpgradeId;
  if (choice.kind === 'laserCapstone') return `laser.${choice.branch}.capstone`;
  return 'upgrade' in choice ? `${choice.kind}.${choice.upgrade}` as RewardCandidateId
    : choice.kind === 'passive' ? `passive.${choice.module}` : choice.kind;
}

export function isRewardChoice(value: unknown): value is LevelUpChoice {
  if (!value || typeof value !== 'object') return false;
  return rewardChoices.some(choice => {
    const keys = Reflect.ownKeys(choice);
    return Reflect.ownKeys(value).length === keys.length
      && keys.every(key => Object.hasOwn(value, key) && Reflect.get(value, key) === Reflect.get(choice, key));
  });
}

export function copyCandidate(value: RewardCandidate): RewardCandidate {
  if (!value || typeof value !== 'object' || Reflect.ownKeys(value).length !== 2
    || !Object.hasOwn(value, 'id') || !Object.hasOwn(value, 'choice') || !isRewardChoice(value.choice)
    || value.id !== choiceIdentity(value.choice)) throw new RangeError('Invalid reward candidate');
  return Object.freeze({ id: value.id, choice: Object.freeze({ ...value.choice }) });
}
