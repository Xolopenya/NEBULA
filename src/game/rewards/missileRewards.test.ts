import { missileProfile } from '../player/missileProgression';
import { describe, expect, it, vi } from 'vitest';
import { PlayerBuild } from '../player/PlayerBuild';
import { laserProfile } from '../player/laserProgression';
import { MISSILE_BRANCHES, MISSILE_DEVELOPMENTS, type MissileChoice } from '../player/missileProgression';
import { RunRandom } from '../run/RunRandom';
import { RunDiagnostics } from '../run/RunDiagnostics';
import { LevelUpGenerator, type LevelUpContext } from './LevelUpGenerator';
import { assertRewardContext, assertRewardFeasible, isRewardEligible } from './rewardEligibility';
import { choiceIdentity, copyCandidate, isNewMissileChoice, MISSILE_NEW_CHOICES, rewardChoices } from './rewardChoices';
import { RewardTransaction } from './RewardTransaction';

const composition = { combatMultiplier: 1, spatialLevel: 0 };
function ready(missile = true, laser = false) {
  const b = new PlayerBuild();
  if (missile) for (const upgrade of ['warheadPower', 'propulsion', 'blastExpansion'] as const) b.applyMissileChoice({ kind: 'missile', upgrade }, composition);
  if (laser) for (const upgrade of ['power', 'power', 'fireRate'] as const) b.applyLaserChoice({ kind: 'laser', upgrade }, 0);
  return b;
}
function context(b = ready()): LevelUpContext {
  return { build: b.snapshot(), weaponFocus: 'missile',
    get laserRanks() { return this.build.laser.ranks; }, get prismEvolved() { return this.build.laser.form === 'PRISM'; },
    get laser() { const p = laserProfile(this.build.laser); return { damage: p.damage, fireInterval: p.fireInterval, projectileSpeed: p.projectileSpeed }; },
    // Compatibility projections derive exclusively from the authoritative detached Build.
    get missileRanks() { return this.build.missile.ranks; }, get clusterEvolved() { return this.build.missile.form === 'CLUSTER'; }, set clusterEvolved(v: boolean) { this.build.missile.form = v ? 'CLUSTER' : 'BASE'; },
    get missile() { const p = missileProfile(this.build.missile); return { damage: p.damage, speed: p.projectileSpeed, explosionRadius: p.explosionRadius }; },
    droneRanks: { boltPower: 0, firingSystem: 0, boltPropulsion: 0 }, twinDroneEvolved: false,
    drone: { damage: 1, fireInterval: 1200, projectileSpeed: 800 },
    moduleLevels: { hull: 0, thruster: 0, collector: 0, combat: 0, spatial: 0, replication: 0 },
    magnetRadius: 180, combatMultiplier: 1, hullPreview: b.previewPrototypeHullPlating(), thrusterPreview: b.previewPrototypeThruster() };
}

describe('GAME-057-B closed Missile eligibility', () => {
  it.each(['ranks','values','cluster','extra'] as const)('rejects contradictory %s projections before drawing or mutation', kind => {
    const c=context(),g=new LevelUpGenerator(),rng=vi.fn(()=>0);
    if(kind==='ranks')Object.defineProperty(c,'missileRanks',{value:{warheadPower:0,propulsion:0,blastExpansion:0},enumerable:true});
    if(kind==='values')Object.defineProperty(c,'missile',{value:{...c.missile,damage:999},enumerable:true});
    if(kind==='cluster')Object.defineProperty(c,'clusterEvolved',{value:true,enumerable:true});
    if(kind==='extra')Object.defineProperty(c,'missile',{value:{...c.missile,extra:1},enumerable:true});
    const before=structuredClone(c),policy=g.snapshot();expect(()=>g.generate(c,rng)).toThrow(RangeError);
    expect(rng).not.toHaveBeenCalled();expect(g.snapshot()).toEqual(policy);expect(c).toEqual(before);
  });
  it.each(MISSILE_BRANCHES)('%s uses installed Build readiness, preserves ranks and excludes Cluster/other forms', branch => {
    const b = ready(), c = context(b), choice = { kind: 'missileSpecialization' as const, branch }, before = structuredClone(c);
    expect(isRewardEligible(choice, c)).toBe(true); expect(c).toEqual(before);
    c.build.missile.ranks.blastExpansion = 0; expect(isRewardEligible(choice, c)).toBe(false);
    c.build.missile.ranks.blastExpansion = 1; c.build.slots.combat.splice(1, 1); expect(isRewardEligible(choice, c)).toBe(false);
    Reflect.set(c, 'build', b.snapshot()); Reflect.set(c, 'clusterEvolved', true); expect(isRewardEligible(choice, c)).toBe(false);
    Reflect.set(c, 'clusterEvolved', false); b.applyMissileChoice(choice, composition); Reflect.set(c, 'build', b.snapshot());
    for (const other of MISSILE_BRANCHES) expect(isRewardEligible({ kind: 'missileSpecialization', branch: other }, c)).toBe(false);
    Object.assign(c.missileRanks, { warheadPower: 2, propulsion: 2, blastExpansion: 2 }); Reflect.set(c.moduleLevels, 'spatial', 1);
    expect(isRewardEligible({ kind: 'cluster' }, c)).toBe(false);
    const cluster = ready();
    for (const upgrade of ['warheadPower', 'propulsion', 'blastExpansion'] as const) cluster.applyMissileChoice({ kind: 'missile', upgrade }, composition);
    cluster.applyMissileChoice({ kind: 'cluster' }, { ...composition, spatialLevel: 1 });
    expect(isRewardEligible(choice, context(cluster))).toBe(false);
  });
  it.each(MISSILE_NEW_CHOICES.filter(c => c.kind === 'missileDevelopment'))('$branch.$upgrade requires its own branch and applies once', choice => {
    const b = ready(); expect(isRewardEligible(choice, context(b))).toBe(false);
    b.applyMissileChoice({ kind: 'missileSpecialization', branch: choice.branch }, composition);
    const c = context(b), before = b.snapshot();
    expect(isRewardEligible(choice, c)).toBe(true); expect(b.snapshot()).toEqual(before);
    b.applyMissileChoice(choice, composition); expect(isRewardEligible(choice, context(b))).toBe(false);
    const other = ready(); other.applyMissileChoice({ kind: 'missileSpecialization', branch: choice.branch === 'guidance' ? 'heavy' : 'guidance' }, composition);
    expect(isRewardEligible(choice, context(other))).toBe(false);
  });
  it.each(MISSILE_BRANCHES)('%s Capstone requires every development and is accepted once', branch => {
    const b = ready(); b.applyMissileChoice({ kind: 'missileSpecialization', branch }, composition);
    const cap = { kind: 'missileCapstone' as const, branch };
    for (const upgrade of MISSILE_DEVELOPMENTS[branch]) {
      expect(isRewardEligible(cap, context(b))).toBe(false);
      b.applyMissileChoice({ kind: 'missileDevelopment', branch, upgrade } as MissileChoice, composition);
    }
    expect(isRewardEligible(cap, context(b))).toBe(true); b.applyMissileChoice(cap, composition);
    expect(isRewardEligible(cap, context(b))).toBe(false);
  });
  it('rejects a complete prospective Heavy/fragment profile while allowing a numerically feasible Guidance alternative', () => {
    const c = context(); c.build.effectiveStats.projectileScale = Number.MAX_SAFE_INTEGER / 9;
    const before = structuredClone(c);
    expect(isRewardEligible({ kind: 'missileSpecialization', branch: 'heavy' }, c)).toBe(false);
    expect(isRewardEligible({ kind: 'missileSpecialization', branch: 'guidance' }, c)).toBe(true);
    // Tiny parent damage remains positive, but quarter child damage underflows.
    c.build.effectiveStats.projectileScale = 1; Reflect.set(c, 'combatMultiplier', Number.MIN_VALUE);
    expect(isRewardEligible({ kind: 'missileSpecialization', branch: 'fragmentation' }, c)).toBe(false);
    expect(isRewardEligible({ kind: 'missileSpecialization', branch: 'heavy' }, c)).toBe(true);
    expect(before.build.missile).toEqual(c.build.missile);
  });
  it.each(['shape', 'rank', 'spatial', 'combat', 'unknown'] as const)('rejects malformed %s context/choice atomically before RNG', mode => {
    const c = context(), g = new LevelUpGenerator(), rng = vi.fn(() => 0);
    if (mode === 'shape') Reflect.set(c.build.missile, 'extra', 1);
    if (mode === 'rank') c.build.missile.ranks.propulsion = NaN;
    if (mode === 'spatial') Reflect.set(c.moduleLevels, 'spatial', .5);
    if (mode === 'combat') Reflect.set(c, 'combatMultiplier', Infinity);
    const before = structuredClone(c.build), policy = g.snapshot();
    if (mode === 'unknown') {
      expect(() => assertRewardFeasible({ kind: 'missileDevelopment', branch: 'guidance', upgrade: 'reload' } as never, c)).toThrow(RangeError);
    } else {
      expect(() => assertRewardContext(c)).toThrow(RangeError);
      expect(() => g.generate(c, rng)).toThrow(RangeError);
    }
    expect(rng).not.toHaveBeenCalled(); expect(g.snapshot()).toEqual(policy); expect(c.build).toEqual(before);
  });
  it('preflights passive Combat/Spatial against the acquired profile and frozen children', () => {
    const b = ready(); b.applyMissileChoice({ kind: 'missileSpecialization', branch: 'fragmentation' }, composition);
    const c = context(b); c.build.effectiveStats.reactorPower = Number.MAX_SAFE_INTEGER / 3;
    Reflect.set(c, 'combatMultiplier', 1.25);
    expect(isRewardEligible({ kind: 'passive', module: 'combat' }, c)).toBe(false);
    expect(isRewardEligible({ kind: 'passive', module: 'hull' }, c)).toBe(true);
  });
});

describe('GAME-057-B shared acquisition and deterministic offer policy', () => {
  it.each([[false, true, 'laser.specialize.scatter'], [true, false, 'missile.specialize.guidance'], [true, true, 'laser.specialize.scatter']] as const)(
    'Missile ready=%s Laser ready=%s chooses the first canonical acquisition with a single slot draw', (missile, laser, id) => {
      const c = context(ready(missile, laser)), g = new LevelUpGenerator(), rng = vi.fn(() => 0), before = structuredClone(c);
      g.assertCanGenerate(c); expect(rng).not.toHaveBeenCalled();
      const offer = g.generate(c, rng); expect(offer[0].id).toBe(id); expect(rng).toHaveBeenCalledTimes(3);
      expect(offer.slice(1).every(c => !c.choice.kind.endsWith('Specialization'))).toBe(true);
      expect(new Set(offer.map(c => c.id)).size).toBe(3); expect(c).toEqual(before);
    });
  it('pins the exact six-way pool boundary, Missile focus and Laser-before-Missile order', () => {
    const c = context(ready(true, true));
    // Three Laser acquisitions100 each, then three Missile acquisitions150 each. Total750.
    const ids = (u: number) => new LevelUpGenerator().generate(c, vi.fn().mockReturnValueOnce(u).mockReturnValue(0)).map(c => c.id);
    expect(ids(300 / 750 - 1e-12)[0]).toBe('laser.specialize.lance');
    expect(ids(300 / 750)[0]).toBe('missile.specialize.guidance');
    expect(ids(450 / 750)[0]).toBe('missile.specialize.heavy');
    expect(ids(1 - Number.EPSILON)[0]).toBe('missile.specialize.fragmentation');
    Reflect.set(c, 'weaponFocus', 'laser');
    expect(ids(450 / 750)[0]).toBe('missile.specialize.guidance');
  });
  it('ordinary fallback preserves readiness and allows a future opportunity when all acquisitions overflow Tags', () => {
    const b = ready(true, true); b.addTagPoints('PROJECTILES', Number.MAX_SAFE_INTEGER);
    const c = context(b), g = new LevelUpGenerator(), rng = vi.fn(() => 0), before = structuredClone(c);
    const offer = g.generate(c, rng); expect(offer.every(c => !c.choice.kind.endsWith('Specialization'))).toBe(true);
    expect(rng).toHaveBeenCalledTimes(3); expect(g.snapshot().history).toEqual([]);
    g.recordPresented(1); expect(g.snapshot().history[0]).toEqual(offer.map(c => c.id)); expect(c).toEqual(before);
    expect(g.generate(context(ready(true, true)), () => .5)[0].id).toBe('missile.specialize.guidance');
  });
  it('applies unchanged Analyzer, secondary relevance, capped pity and recent history to the shared pool', () => {
    const b = ready(true, true); b.addTagPoints('EXPLOSIONS', 2); b.addTagPoints('PROJECTILES', 1); b.addCombatAnalyzerLevels(4);
    const c = context(b), g = new LevelUpGenerator();
    for (let ordinal = 1; ordinal <= 4; ordinal++) {
      expect(g.generate(c, () => 0).map(c => c.id)).toEqual(['laser.specialize.scatter', 'passive.hull', 'laser.fireRate']);
      g.recordPresented(ordinal);
    }
    expect(g.snapshot().misses).toBe(4); expect(g.snapshot().history).toHaveLength(2);
    // Secondary Laser:187.5 each, recent Scatter /4 =>421.875 total.
    // Primary Missile:100*2*2*1.5*Analyzer2*pity2=2400 each; total7621.875.
    const boundary = 421.875 / 7621.875, before = g.snapshot();
    const draw = (u: number) => g.generate(c, vi.fn().mockReturnValueOnce(u).mockReturnValue(0))[0].id;
    expect(draw(boundary - 1e-12)).toBe('laser.specialize.lance'); g.cancelGenerated();
    expect(g.snapshot()).toEqual(before); expect(draw(boundary)).toBe('missile.specialize.guidance');
    expect(g.snapshot().misses).toBe(4);
    g.recordPresented(5); expect(g.snapshot().misses).toBe(0);
  });
  it('removes infeasible acquisitions before sampling and completes an alternative with Slot3 legacy Cluster precedence', () => {
    const c = context(); c.build.effectiveStats.projectileScale = Number.MAX_SAFE_INTEGER / 9;
    Object.assign(c.missileRanks, { warheadPower: 2, propulsion: 2, blastExpansion: 2 }); Reflect.set(c.moduleLevels, 'spatial', 1);
    const rng = vi.fn(() => .5), offer = new LevelUpGenerator().generate(c, rng);
    expect(offer[0].id).toBe('missile.specialize.fragmentation'); expect(offer[2].id).toBe('cluster');
    expect(rng).toHaveBeenCalledTimes(3);
  });
  it('no complete three-choice offer rejects without draws or policy changes', () => {
    const c = context(), g = new LevelUpGenerator(), before = g.snapshot(), rng = vi.fn(() => 0);
    c.build.slots.combat.splice(0);
    for (const k of Object.keys(c.moduleLevels)) Reflect.set(c.moduleLevels, k, Number.MAX_SAFE_INTEGER);
    expect(() => g.generate(c, rng)).toThrow(RangeError); expect(rng).not.toHaveBeenCalled(); expect(g.snapshot()).toEqual(before);
  });
  it('new offers preserve Analyzer/pity/history and only presentation commits; preview, rejection and selection draw zero', () => {
    const b = ready(); b.addTagPoints('EXPLOSIONS', 2); b.addTagPoints('PROJECTILES', 1); b.addCombatAnalyzerLevels(4);
    const c = context(b), g = new LevelUpGenerator(), rng = vi.fn(() => 0), initial = g.snapshot();
    g.assertCanGenerate(c); const choice = { kind: 'missileSpecialization' as const, branch: 'guidance' as const };
    b.previewMissileChoice(choice, composition); expect(rng).not.toHaveBeenCalled();
    const offer = g.generate(c, rng); expect(g.snapshot()).toEqual({ ...initial, hasGenerated: true });
    expect(offer[0].id).toBe('missile.specialize.guidance');
    const t = new RewardTransaction(), token = t.open(offer); t.present(token); g.recordPresented(token.offerId);
    const policy = g.snapshot(); expect(policy.misses).toBe(0); expect(policy.primarySignature).toEqual(['EXPLOSIONS']);
    expect(policy.history).toEqual([offer.map(c => c.id)]);
    expect(t.trySelect(token, offer[0].id, () => false)).toBe(false);
    expect(t.trySelect(token, offer[0].id, c => { if (!isNewMissileChoice(c.choice)) return false; return b.applyMissileChoice(c.choice, composition); })).toBe(true);
    expect(t.trySelect(token, offer[0].id, () => true)).toBe(false);
    expect(rng).toHaveBeenCalledTimes(3); expect(g.snapshot()).toEqual(policy);
    const d = new RunDiagnostics(0); d.recordRunStarted(); d.recordLevelUpOffered(offer.map(c => c.id)); d.recordLevelUpSelected(offer[0].id);
    expect(d.snapshot().aggregates.choicesAccepted).toBe(1);
    for (const c of MISSILE_NEW_CHOICES) expect(copyCandidate({ id: choiceIdentity(c), choice: c }).id).toBe(choiceIdentity(c));
  });
  it('rejects forged identities while diagnostics accepts every approved Missile identity', () => {
    const d = new RunDiagnostics(0); d.recordRunStarted();
    for (const choice of MISSILE_NEW_CHOICES) { d.recordLevelUpSelected(choiceIdentity(choice)); }
    expect(d.snapshot().aggregates.choicesAccepted).toBe(18);
    expect(() => d.recordLevelUpSelected('missile.guidance.unknown' as never)).toThrow(RangeError);
    expect(() => copyCandidate({ id: 'missile.heavy.payload', choice: MISSILE_NEW_CHOICES[0] })).toThrow(RangeError);
    expect(rewardChoices).toHaveLength(54);
  });
});

// Literal fixtures calculated by independent uint32/weight arithmetic, never the production generator.
describe('GAME-057-v1 literal seeded shared-pool fixtures', () => {
  it.each([[0,"missile",[["missile.specialize.heavy","passive.hull","drone.boltPropulsion"],["missile.specialize.guidance","passive.replication","laser.fireRate"],["missile.specialize.heavy","passive.collector","missile.blastExpansion"],["missile.specialize.fragmentation","passive.hull","missile.warheadPower"]]],[0,"both",[["missile.specialize.heavy","passive.hull","drone.boltPropulsion"],["laser.specialize.scatter","passive.replication","laser.speed"],["laser.specialize.lance","passive.collector","missile.blastExpansion"],["missile.specialize.fragmentation","passive.hull","missile.warheadPower"]]],[0,"zero",[["missile.propulsion","passive.hull","drone.boltPropulsion"],["laser.fireRate","passive.replication","missile.warheadPower"],["laser.speed","passive.collector","drone.boltPower"],["drone.firingSystem","passive.hull","missile.blastExpansion"]]],[0,"partial",[["missile.specialize.fragmentation","passive.hull","passive.thruster"],["missile.specialize.fragmentation","passive.replication","laser.power"],["missile.specialize.fragmentation","passive.collector","missile.warheadPower"],["missile.specialize.fragmentation","passive.hull","laser.speed"]]],[0,"evolution",[["missile.specialize.heavy","passive.hull","cluster"],["laser.specialize.scatter","passive.replication","cluster"],["laser.specialize.lance","passive.collector","cluster"],["missile.specialize.fragmentation","passive.hull","cluster"]]],[123456789,"missile",[["missile.specialize.guidance","passive.spatial","drone.boltPropulsion"],["missile.specialize.fragmentation","passive.collector","laser.fireRate"],["missile.specialize.heavy","passive.thruster","missile.warheadPower"],["missile.specialize.guidance","passive.replication","passive.spatial"]]],[123456789,"both",[["laser.specialize.repeater","passive.spatial","drone.boltPropulsion"],["missile.specialize.heavy","passive.collector","laser.fireRate"],["missile.specialize.guidance","passive.thruster","missile.warheadPower"],["laser.specialize.lance","passive.replication","passive.spatial"]]],[123456789,"zero",[["laser.speed","passive.spatial","drone.boltPropulsion"],["missile.propulsion","passive.combat","laser.fireRate"],["missile.propulsion","passive.thruster","missile.blastExpansion"],["laser.speed","passive.replication","passive.spatial"]]],[123456789,"partial",[["missile.specialize.fragmentation","passive.spatial","passive.hull"],["missile.specialize.fragmentation","passive.combat","laser.power"],["missile.specialize.fragmentation","passive.thruster","laser.speed"],["missile.specialize.fragmentation","passive.replication","passive.spatial"]]],[123456789,"evolution",[["laser.specialize.repeater","passive.spatial","cluster"],["missile.specialize.heavy","passive.collector","cluster"],["missile.specialize.guidance","passive.thruster","cluster"],["laser.specialize.lance","passive.replication","cluster"]]]] as const)('seed%s mode%s', (seed, mode, expected) => {
    const b = ready(true, mode === 'both' || mode === 'zero' || mode === 'evolution');
    if (mode === 'zero') b.addTagPoints('PROJECTILES', Number.MAX_SAFE_INTEGER);
    if (mode === 'partial') { b.addTagPoints('TECHNOLOGY', Number.MAX_SAFE_INTEGER); b.addTagPoints('CONTROL', Number.MAX_SAFE_INTEGER); }
    const c = context(b);
    if (mode === 'evolution') { Object.assign(c.missileRanks, { warheadPower: 2, propulsion: 2, blastExpansion: 2 }); Reflect.set(c.moduleLevels, 'spatial', 1); }
    const g = new LevelUpGenerator(), r = new RunRandom(seed), fresh = new RunRandom(seed), rng = vi.fn(r.reward.next);
    for (const [i, ids] of expected.entries()) {
      expect(g.generate(c, rng).map(c => c.id)).toEqual(ids); g.recordPresented(i + 1);
    }
    expect(rng).toHaveBeenCalledTimes(12);
    for (const name of ['encounter', 'world', 'boss'] as const) expect(r[name].next()).toBe(fresh[name].next());
  });
});
