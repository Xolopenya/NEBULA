import { describe, expect, it, vi } from 'vitest';
import { LevelUpGenerator, REWARD_AFFINITIES, LEVEL_UP_POLICY_VERSION, type LevelUpContext } from './LevelUpGenerator';
import { PlayerBuild, TAG_IDS, type TagId } from '../player/PlayerBuild';
import { RunRandom } from '../run/RunRandom';
import { rewardChoices, choiceIdentity } from './rewardChoices';
function context(): LevelUpContext {
  const build = new PlayerBuild();
  return { weaponFocus: 'laser', build: build.snapshot(), laserRanks: { power: 0, fireRate: 0, speed: 0 },
    missileRanks: { warheadPower: 0, propulsion: 0, blastExpansion: 0 }, droneRanks: { boltPower: 0, firingSystem: 0, boltPropulsion: 0 },
    moduleLevels: { hull: 0, thruster: 0, collector: 0, combat: 0, spatial: 0, replication: 0 },
    prismEvolved: false, clusterEvolved: false, twinDroneEvolved: false, laser: { damage: 1, fireInterval: 600, projectileSpeed: 1200 },
    missile: { damage: 2, speed: 450, explosionRadius: 120 }, drone: { damage: 1, fireInterval: 1200, projectileSpeed: 800 },
    magnetRadius: 180, combatMultiplier: 1, hullPreview: build.previewPrototypeHullPlating(), thrusterPreview: build.previewPrototypeThruster() };
}
function tagged(primary: TagId, secondary?: TagId, analyzer = 0): LevelUpContext {
  const c = context(), b = new PlayerBuild(); b.addTagPoints(primary, 2);
  if (secondary) b.addTagPoints(secondary, 1); b.addCombatAnalyzerLevels(analyzer); Reflect.set(c, 'build', b.snapshot()); return c;
}
function roll(g: LevelUpGenerator, c = context(), values = [0, 0, 0]) {
  let calls = 0; const candidates = g.generate(c, () => values[calls++]);
  expect(calls).toBe(3); return candidates.map(c => c.id);
}
function missFour(g: LevelUpGenerator) {
  const c = tagged('PRECISION');
  for (let i = 1; i <= 4; i++) { roll(g, c, [.99, 0, 0]); expect(g.recordPresented(i)).toBe(true); }
  expect(g.snapshot().misses).toBe(4); return c;
}

describe('GAME-055-v1 policy', () => {
  it('has exactly18 deeply frozen canonical affinities in TAG_IDS order', () => {
    expect(LEVEL_UP_POLICY_VERSION).toBe('GAME-055-v1');
    expect(Object.keys(REWARD_AFFINITIES)).toEqual(rewardChoices.map(choiceIdentity));
    expect(Object.isFrozen(REWARD_AFFINITIES)).toBe(true);
    for (const tags of Object.values(REWARD_AFFINITIES)) {
      expect(Object.isFrozen(tags)).toBe(true);
      expect(tags).toEqual(TAG_IDS.filter(t => tags.includes(t)));
    }
    expect(REWARD_AFFINITIES.prism).toEqual(['PRECISION', 'PROJECTILES']);
    expect(REWARD_AFFINITIES['missile.blastExpansion']).toEqual(['EXPLOSIONS', 'CONTROL']);
  });
  it('starts empty, performs no draws/writes in preflight/reads, and commits only on acknowledgment', () => {
    const g = new LevelUpGenerator(), c = context(), before = structuredClone(c), initial = g.snapshot();
    expect(initial).toEqual({ misses: 0, history: [], primarySignature: [], evolutionCursor: 'prism', lastPresented: 0, hasGenerated: false });
    g.assertCanGenerate(c); expect(g.snapshot()).toEqual(initial); expect(c).toEqual(before);
    expect(roll(g)).toEqual(['laser.power', 'passive.hull', 'laser.fireRate']);
    expect(g.snapshot()).toEqual({ ...initial, hasGenerated: true });
    expect(() => g.assertCanGenerate(c)).toThrow('pending presentation');
    for (const id of [0, -1, .5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) expect(g.recordPresented(id)).toBe(false);
    expect(g.recordPresented(1)).toBe(true); expect(g.recordPresented(1)).toBe(false);
    expect(g.snapshot().history).toEqual([['laser.power', 'passive.hull', 'laser.fireRate']]);
    expect(c).toEqual(before);
  });
  it.each(['prism', 'cluster', 'twin'] as const)('reserves %s in Slot3 and consumes its singleton draw', kind => {
    const c = context(), g = new LevelUpGenerator();
    Object.assign(c.laserRanks, { power: 2, fireRate: 2, speed: 2 });
    Object.assign(c.missileRanks, { warheadPower: 2, propulsion: 2, blastExpansion: 2 });
    Object.assign(c.droneRanks, { boltPower: 2, firingSystem: 2, boltPropulsion: 2 });
    Reflect.set(c.moduleLevels, kind === 'prism' ? 'combat' : kind === 'cluster' ? 'spatial' : 'replication', 1);
    const ids = roll(g, c); expect(ids[0].startsWith('passive.')).toBe(true); expect(ids[2]).toBe(kind);
    expect(new Set(ids).size).toBe(3); expect(g.snapshot().evolutionCursor).toBe('prism');
    g.recordPresented(1); expect(g.snapshot().evolutionCursor).toBe(kind === 'prism' ? 'cluster' : kind === 'cluster' ? 'twin' : 'prism');
  });
  it('cycles eligible evolutions and retains history penalties without excluding forced choices', () => {
    const c = context(), g = new LevelUpGenerator();
    for (const ranks of [c.laserRanks, c.missileRanks, c.droneRanks]) for (const key of Object.keys(ranks)) Reflect.set(ranks, key, 2);
    Object.assign(c.moduleLevels, { combat: 1, spatial: 1, replication: 1 });
    for (const [i, kind] of ['prism', 'cluster', 'twin', 'prism'].entries()) { expect(roll(g,c)[2]).toBe(kind); g.recordPresented(i+1); }
    expect(g.snapshot().history).toHaveLength(2);
  });
  it('uses category fallbacks when all weapons or all passives are infeasible', () => {
    const c = context(); c.build.slots.combat.splice(0);
    expect(roll(new LevelUpGenerator(), c).every(id => id.startsWith('passive.'))).toBe(true);
    for (const key of Object.keys(c.moduleLevels)) Reflect.set(c.moduleLevels, key, Number.MAX_SAFE_INTEGER);
    Reflect.set(c.moduleLevels,'spatial',Math.floor((Number.MAX_SAFE_INTEGER-120)/15));
    Reflect.set(c.moduleLevels,'replication',Number.MAX_SAFE_INTEGER-5);
    c.build.slots.combat.push('LASER');
    expect(roll(new LevelUpGenerator(), c)).toEqual(['laser.power','laser.fireRate','laser.speed']);
  });
  it.each([false, true])('insufficient ordinary pool fails0 draws even with other evolutions=%s', evolution => {
    const c = context(), g = new LevelUpGenerator(), rng = vi.fn(() => 0);
    for (const ranks of [c.laserRanks,c.missileRanks,c.droneRanks]) for (const k of Object.keys(ranks)) Reflect.set(ranks,k,2);
    for (const k of Object.keys(c.moduleLevels)) Reflect.set(c.moduleLevels,k,Number.MAX_SAFE_INTEGER);
    Reflect.set(c.moduleLevels,'collector',0);
    if (!evolution) { Reflect.set(c,'prismEvolved',true); Reflect.set(c,'clusterEvolved',true); Reflect.set(c,'twinDroneEvolved',true); }
    const before=g.snapshot(); expect(()=>g.assertCanGenerate(c)).toThrow(RangeError);
    expect(()=>g.generate(c,rng)).toThrow(RangeError); expect(rng).not.toHaveBeenCalled(); expect(g.snapshot()).toEqual(before);
  });
  it('prefers a non-primary Pivot but falls back when every remaining ordinary candidate matches', () => {
    const c=tagged('PRECISION'); expect(roll(new LevelUpGenerator(),c,[.99,0,0])[2]).not.toBe('laser.power');
    const b=new PlayerBuild(); for(const t of TAG_IDS)b.addTagPoints(t,1); Reflect.set(c,'build',b.snapshot());
    expect(roll(new LevelUpGenerator(),c)).toEqual(['laser.power','passive.hull','laser.fireRate']);
  });
  // Hand arithmetic: primary Laser Power Slot1 =100*2*2*1.5*(1+2a).
  // Other Slot1 weights:150,150,six100. Strict cumulative equality chooses next entry.
  it.each([0,1,4,1000000,Number.MAX_SAFE_INTEGER])('Analyzer A%s uses exact factor and no cap4', a => {
    const c=tagged('PRECISION',undefined,a), g=new LevelUpGenerator();
    const factor=1+2*(a===0?0:1/(1+4/a)), boundary=600*factor/(600*factor+900);
    expect(roll(g,c,[boundary,0,0])[0]).toBe('laser.fireRate');
    g.cancelGenerated(); expect(roll(g,c,[boundary-1e-12,0,0])[0]).toBe('laser.power');
  });
  it('pins secondary/context/role/focus weights and tied canonical identity', () => {
    const c=tagged('SURVIVAL','PRECISION');
    // secondary power=100*1.5*1.25*1.5=281.25; others150,150,6*100.
    expect(roll(new LevelUpGenerator(),c,[281.25/1181.25,0,0])[0]).toBe('laser.fireRate');
    const b=new PlayerBuild(); b.addTagPoints('DRONES',2); b.addTagPoints('PRECISION',2); b.addTagPoints('SUPPORT',1); b.addTagPoints('MOBILITY',1);
    Reflect.set(c,'build',b.snapshot()); expect(()=>new LevelUpGenerator().assertCanGenerate(c)).not.toThrow();
  });
  it('pins recent factors1/.5/.25, hull Slot2 factor1.5, FIFO2 and soft repeats', () => {
    const g=new LevelUpGenerator();
    expect(roll(g)).toEqual(['laser.power','passive.hull','laser.fireRate']); g.recordPresented(1);
    // first power75, fireRate75, speed150, six100 =>900.
    expect(roll(g,context(),[75/900,0,0])[0]).toBe('laser.fireRate'); g.cancelGenerated();
    roll(g);g.recordPresented(2);
    // first power37.5, fireRate37.5, speed150, six100 =>825.
    expect(roll(g,context(),[37.5/825,0,0])[0]).toBe('laser.fireRate');g.cancelGenerated();
    // slot2 hull37.5, thruster150, four100 =>587.5.
    expect(roll(g,context(),[0,37.5/587.5,0])[1]).toBe('passive.thruster');g.recordPresented(3);
    expect(g.snapshot().history).toHaveLength(2); expect(g.snapshot().lastPresented).toBe(3);
  });
  it.each(['CLOSE_COMBAT','RAPID_FIRE','PRECISION'] as const)('oldm4 to changed %s commits0/1/0, never during generation', tag => {
    const g=new LevelUpGenerator(); missFour(g);const before=g.snapshot(), c=tagged(tag);
    roll(g,c,[.99,0,0]);expect(g.snapshot()).toEqual({...before,hasGenerated:true});
    g.cancelGenerated();expect(g.snapshot()).toEqual(before);
    roll(g,c,[.99,0,tag==='PRECISION'?.99:0]);g.recordPresented(5);
    // PRECISION here is unchanged and its Pivot cannot match. A separate changed matching case follows.
    expect(g.snapshot().misses).toBe(tag==='CLOSE_COMBAT'?0:tag==='RAPID_FIRE'?1:4);
    expect(g.snapshot().primarySignature).toEqual([tag]);expect(g.recordPresented(5)).toBe(false);
  });
  it('oldm4 -> new signature with a relevant offer commits0 and selection has no policy API', () => {
    const g=new LevelUpGenerator();missFour(g);const c=tagged('RAPID_FIRE');
    expect(roll(g,c,[.2,0,0])[0]).toBe('laser.fireRate');expect(g.snapshot().misses).toBe(4);
    g.recordPresented(5);expect(g.snapshot().misses).toBe(0);
    roll(g,context());g.recordPresented(6);expect(g.snapshot().primarySignature).toEqual([]);expect(g.snapshot().misses).toBe(0);
  });
  it('freezes existingm4 when no eligible primary remains, then resets on any relevant evolution', () => {
    const g=new LevelUpGenerator(), c=missFour(g);
    Reflect.set(c.laserRanks,'power',2);roll(g,c);g.recordPresented(5);expect(g.snapshot().misses).toBe(4);
    Object.assign(c.laserRanks,{power:2,fireRate:2,speed:2});Reflect.set(c.moduleLevels,'combat',1);
    const ids=roll(g,c);expect(ids[2]).toBe('prism');g.recordPresented(6);expect(g.snapshot().misses).toBe(0);
  });
  it('uses pre-offer cappedm4 in exact primary weights and still permits a missed offer', () => {
    const g=new LevelUpGenerator(),c=missFour(g);
    // Last2 identical misses: fireRate150*.25, Drone propulsion100*.25; hull does not enter Slot1.
    const boundary=1200/(1200+37.5+150+300+100+100+25);
    expect(roll(g,c,[boundary-1e-12,0,0])[0]).toBe('laser.power');g.cancelGenerated();
    expect(roll(g,c,[boundary,0,0])[0]).toBe('laser.fireRate');g.cancelGenerated();
    roll(g,c,[.99,0,0]);g.recordPresented(5);expect(g.snapshot().misses).toBe(4);
  });
  it.each([NaN,Infinity,-1,1,'0',null])('invalid RNG value%s fails without provisional state',value=>{
    const g=new LevelUpGenerator(),random=vi.fn(()=>value as number);
    expect(()=>g.generate(context(),random)).toThrow('draw 1');expect(random).toHaveBeenCalledTimes(1);expect(g.snapshot().hasGenerated).toBe(false);
  });
  it('near1 picks the last canonical candidate in each pool without retries',()=>{
    expect(roll(new LevelUpGenerator(),context(),[1-Number.EPSILON,1-Number.EPSILON,1-Number.EPSILON]))
      .toEqual(['drone.boltPropulsion','passive.replication','passive.spatial']);
  });
  it.each([1,2,3])('malformed draw%s counts consumed calls and leaves no provisional/commit', index => {
    const g=new LevelUpGenerator(), rng=vi.fn().mockReturnValue(0);rng.mockReturnValueOnce(index===1?NaN:0);
    if(index>1)rng.mockReturnValueOnce(index===2?1:0);if(index>2)rng.mockReturnValueOnce(-1);
    const before=g.snapshot();expect(()=>g.generate(context(),rng)).toThrow('draw '+index);expect(rng).toHaveBeenCalledTimes(index);expect(g.snapshot()).toEqual(before);
  });
  it.each([-1,.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])('invalid Analyzer%s rejects before RNG', a => {
    const c=context(), rng=vi.fn(()=>0);c.build.effectiveStats.combatAnalyzer=a;
    expect(()=>new LevelUpGenerator().generate(c,rng)).toThrow(RangeError);expect(rng).not.toHaveBeenCalled();
  });
  it.each(['tag','order','duplicate','tier','focus','stats'] as const)('invalid context %s rejects before RNG', mode=>{
    const c=tagged('DRONES','PRECISION'),rng=vi.fn(()=>0);
    if(mode==='tag')c.build.tags.DRONES=-1;
    if(mode==='order')c.build.identity.dominantTags.push('PRECISION');
    if(mode==='duplicate')c.build.identity.secondaryTags.push('PRECISION');
    if(mode==='tier')c.build.identity.dominantTags=['PRECISION'];
    if(mode==='focus')Reflect.set(c,'weaponFocus','unknown');
    if(mode==='stats')c.build.effectiveStats.impact=Infinity;
    expect(()=>new LevelUpGenerator().generate(c,rng)).toThrow(RangeError);expect(rng).not.toHaveBeenCalled();
  });
  it('deep-freezes separate outputs, protects provisional updates and isolates old reads/cancellation/disposal',()=>{
    const g=new LevelUpGenerator(), c=tagged('PRECISION'), result=g.generate(c,()=>0), old=g.snapshot();
    expect(Object.isFrozen(result)).toBe(true);expect(Object.isFrozen(result[0])).toBe(true);expect(Object.isFrozen(result[0].choice)).toBe(true);
    for(const mutate of [()=>Reflect.set(result,0,result[1]),()=>Reflect.set(result[0],'id','twin'),()=>Reflect.set(result[0].choice,'upgrade','bad')])expect(mutate()).toBe(false);
    expect(()=>Array.prototype.reverse.call(result)).toThrow(TypeError);expect(()=>Array.prototype.splice.call(result,0,1)).toThrow(TypeError);
    c.build.identity.dominantTags.splice(0);c.build.tags.PRECISION=0;
    g.recordPresented(1);expect(g.snapshot().history[0]).toEqual(['laser.power','passive.hull','laser.fireRate']);expect(g.snapshot().primarySignature).toEqual(['PRECISION']);
    expect(old.history).toEqual([]);const read=g.snapshot();Reflect.set(read.history[0],0,'twin');Reflect.set(read.primarySignature,0,'DRONES');
    const committed=g.snapshot();roll(g);g.cancelGenerated();expect(g.snapshot()).toEqual(committed);expect(g.recordPresented(2)).toBe(false);
    const later=g.generate(context(),()=>0);expect(later).not.toBe(result);expect(later[0]).not.toBe(result[0]);g.cancelGenerated();
    g.dispose();g.dispose();for(const op of [()=>g.snapshot(),()=>g.assertCanGenerate(context()),()=>g.generate(context(),()=>0),()=>g.cancelGenerated(),()=>g.recordPresented(2)])expect(op).toThrow('disposed LevelUpGenerator');
    expect(new LevelUpGenerator().snapshot().history).toEqual([]);expect(old.hasGenerated).toBe(true);
  });
  it.each([
    [0, [['missile.blastExpansion','passive.hull','drone.boltPropulsion'],['laser.power','passive.replication','laser.speed'],['laser.fireRate','passive.collector','drone.boltPower'],['drone.boltPropulsion','passive.hull','missile.warheadPower']]],
    [123456789, [['laser.fireRate','passive.spatial','drone.boltPropulsion'],['missile.blastExpansion','passive.collector','laser.power'],['missile.warheadPower','passive.thruster','missile.propulsion'],['laser.speed','passive.replication','passive.spatial']]],
  ] as const)('pins independently calculated GAME-055-v1 seed%s literal offers', (seed, expected) => {
    const g=new LevelUpGenerator(), r=new RunRandom(seed);
    for(const [i,ids] of expected.entries()){expect(g.generate(context(),r.reward.next).map(c=>c.id)).toEqual(ids);g.recordPresented(i+1);}
  });
  it.each([0,123456789])('uses exactly3 Reward draws, zero other streams for seed%s',seed=>{
    const r=new RunRandom(seed), control=new RunRandom(seed),g=new LevelUpGenerator(), draw=vi.spyOn(r.reward,'next');
    for(let i=1;i<=4;i++){g.generate(context(),r.reward.next);g.recordPresented(i);g.snapshot();}
    expect(draw).toHaveBeenCalledTimes(12);for(const stream of ['encounter','world','boss'] as const)expect(r[stream].next()).toBe(control[stream].next());
  });
});

// Literal golden fixtures derived independently with uint32 + hand-authored policy arithmetic,
// never by calling this sampler to compute expected outputs.
describe('GAME-055-v1 tagged/evolution/restricted literal seeded fixtures',()=>{
  it.each([[0,"tagged",[["laser.speed","passive.hull","passive.thruster"],["laser.power","passive.replication","laser.speed"],["laser.power","passive.collector","missile.blastExpansion"],["drone.firingSystem","passive.hull","missile.warheadPower"]]],[0,"evolution",[["passive.replication","passive.hull","prism"],["passive.hull","passive.replication","cluster"],["passive.collector","passive.combat","twin"],["passive.replication","passive.hull","prism"]]],[0,"restricted",[["laser.fireRate","passive.hull","passive.combat"],["laser.power","passive.replication","laser.speed"],["laser.power","passive.collector","passive.thruster"],["laser.speed","passive.hull","laser.fireRate"]]],[123456789,"tagged",[["laser.power","passive.spatial","drone.boltPropulsion"],["missile.warheadPower","passive.combat","laser.fireRate"],["laser.fireRate","passive.thruster","missile.propulsion"],["laser.power","passive.replication","passive.spatial"]]],[123456789,"evolution",[["passive.thruster","passive.replication","prism"],["passive.replication","passive.collector","cluster"],["passive.combat","passive.hull","twin"],["passive.combat","passive.replication","prism"]]],[123456789,"restricted",[["laser.power","passive.spatial","passive.collector"],["laser.speed","passive.collector","laser.power"],["laser.fireRate","passive.thruster","passive.hull"],["laser.fireRate","passive.replication","passive.spatial"]]]] as const)('seed%s %s multi-presentation IDs',(seed,mode,expected)=>{
    const c=mode==='tagged'?tagged('PRECISION','PROJECTILES',4):mode==='evolution'?tagged('DRONES',undefined,1):context();
    if(mode==='restricted')c.build.slots.combat.splice(1);
    if(mode==='evolution'){
      for(const ranks of [c.laserRanks,c.missileRanks,c.droneRanks])for(const key of Object.keys(ranks))Reflect.set(ranks,key,2);
      Object.assign(c.moduleLevels,{combat:1,spatial:1,replication:1});
    }
    const g=new LevelUpGenerator(),r=new RunRandom(seed);
    for(const [i,ids] of expected.entries()){expect(g.generate(c,r.reward.next).map(c=>c.id)).toEqual(ids);g.recordPresented(i+1);}
  });
});
