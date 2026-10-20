import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAttack, type LaserAttack, type HostileAttack, type ContactAttack } from '../combat/combat';
import * as enemyDeath from '../enemies/EnemyDeath';
import * as enemyDefinitions from '../enemies/EnemyDefinitions';
import { GameplayScene } from './GameplayScene';
import { GAMEPLAY_SETTINGS } from '../settings/gameplaySettings';
import { RunLifecycle } from '../run/RunLifecycle';
import { RunRandom } from '../run/RunRandom';
import { RunDiagnostics } from '../run/RunDiagnostics';
import { PlayerBuild, TAG_IDS, type BuildSnapshot } from '../player/PlayerBuild';
import { PlayerProgression } from '../progression/PlayerProgression';
import { PlayerDefense } from '../player/PlayerDefense';
import { LevelUpGenerator } from '../rewards/LevelUpGenerator';
import { rewardChoices, choiceIdentity, type RewardCandidateId } from '../rewards/rewardChoices';
import { RewardTransaction } from '../rewards/RewardTransaction';

class EventEmitter {
  private callbacks = new Map<string, Set<(...args: unknown[]) => void>>();
  on(event: string, fn: (...args: unknown[]) => void) {
    if (!this.callbacks.has(event)) this.callbacks.set(event, new Set());
    this.callbacks.get(event)!.add(fn); return this;
  }
  off(event: string, fn: (...args: unknown[]) => void) { this.callbacks.get(event)?.delete(fn); return this; }
  emit(event: string, ...args: unknown[]) { for (const fn of this.listeners(event)) fn(...args); }
  listeners(event: string) { return [...this.callbacks.get(event) ?? []]; }
  removeAllListeners() { this.callbacks.clear(); }
}

function visual(x = 0, y = 0, radius = 0) {
  const callbacks = new EventEmitter();
  const object = {
    x, y, radius, width: 40, height: 48, lineWidth: 2, text: '', active: true, visible: true, alpha: 1,
    setStrokeStyle() { return this; }, setFillStyle() { return this; },
    setAlpha(alpha: number) { this.alpha = alpha; return this; }, setScrollFactor() { return this; }, setDepth() { return this; },
    setVisible(visible: boolean) { this.visible = visible; return this; },
    setText(text: string) { this.text = text; return this; },
    setOrigin() { return this; }, setInteractive() { return this; },
    on(key: string, callback: () => void) { callbacks.on(key, callback); return this; },
    off(key: string, callback: () => void) { callbacks.off(key, callback); return this; },
    listeners(key: string) { return callbacks.listeners(key); },
    listenerCount(key: string) { return callbacks.listeners(key).length; },
    once(key: string, callback: () => void) { const once = () => { callbacks.off(key, once); callback(); }; callbacks.on(key, once); return this; },
    emit(key: string) { callbacks.emit(key); return this; },
    destroy() { this.active = false; callbacks.removeAllListeners(); },
  };
  return object;
}
function graphics() {
  return Object.assign(visual(), { commands: [] as unknown[],
    clear() { this.commands = []; return this; },
    lineStyle(...args: number[]) { this.commands.push(['style', ...args]); return this; },
    lineBetween(...args: number[]) { this.commands.push(['line', ...args]); return this; },
    fillStyle() {}, fillCircle() {}, strokeRect() {}, strokeCircle() { return this; },
  });
}
vi.mock('phaser', () => ({
  Scene: class {},
  Math: { Vector2: class {
    x = 0; y = 0;
    set(x = 0, y = 0) { this.x = x; this.y = y; return this; }
    copy(v: { x: number; y: number }) { return this.set(v.x, v.y); }
    lengthSq() { return this.x ** 2 + this.y ** 2; }
    length() { return Math.hypot(this.x, this.y); }
    normalize() { const n = this.length(); if (n) { this.x /= n; this.y /= n; } return this; }
    scale(n: number) { this.x *= n; this.y *= n; return this; }
  }, Clamp: (n: number, a: number, b: number) => Math.max(a, Math.min(b, n)),
    Distance: { Between: (x: number, y: number, a: number, b: number) => Math.hypot(x - a, y - b) } },
  Scenes: { Events: { SHUTDOWN: 'shutdown', DESTROY: 'destroy' } },
  Core: { Events: { BLUR: 'blur', HIDDEN: 'hidden', FOCUS: 'focus', VISIBLE: 'visible' } },
}));

// Configuration setup uses the real Build applier; no writable Scene mirrors.
function setLaser(s: GameplayScene, ranks = { power: 2, fireRate: 2, speed: 2 }, prism = false) {
  for (const upgrade of ['power', 'fireRate', 'speed'] as const) {
    while (s['laserRanks'][upgrade] < ranks[upgrade]) s['playerBuild']!.applyLaserChoice({ kind: 'laser', upgrade }, s['moduleLevels'].combat);
  }
  if (prism) s['playerBuild']!.applyLaserChoice({ kind: 'prism' }, Math.max(1, s['moduleLevels'].combat));
}
function setMissile(s: GameplayScene, ranks = { warheadPower: 2, propulsion: 2, blastExpansion: 2 }, cluster = false) {
  for (const upgrade of ['warheadPower', 'propulsion', 'blastExpansion'] as const) {
    while (s['missileRanks'][upgrade] < ranks[upgrade]) s['playerBuild']!.applyMissileChoice({ kind: 'missile', upgrade },
      { combatMultiplier: s['globalDamageMultiplier'], spatialLevel: s['moduleLevels'].spatial });
  }
  if (cluster && !s['clusterEvolved']) {
    s['moduleLevels'].spatial = Math.max(1, s['moduleLevels'].spatial);
    s['playerBuild']!.applyMissileChoice({ kind: 'cluster' }, { combatMultiplier: s['globalDamageMultiplier'], spatialLevel: s['moduleLevels'].spatial });
  }
}
function playerHit(scene: GameplayScene, amount: number, run = scene['run']!, defense = scene['playerDefense']!) {
  return scene['damagePlayer']({ kind: 'PLAYER_CONTACT', run, target: defense,
    attack: createAttack({ kind: 'ENEMY_CONTACT', snapshot: { damage: amount } }) as ContactAttack });
}
function playerShot(scene: GameplayScene, x = 2800, damage = 1) {
  scene['launchPlayerProjectile']({ x, y: 1350 }, { x: 1, y: 0 },
    createAttack({ kind: 'LASER', variant: 'BASE', snapshot: { damage, speed: 1200, lifetime: 2000, radius: 6, impact: 200 } }) as LaserAttack,
    scene['run']!, 0xffffff);
  return scene['projectiles'].at(-1)!;
}
function primeProtection(scene: GameplayScene, remaining: number) {
  const defense = scene['playerDefense']!;
  defense.advanceProtection(Number.MAX_VALUE);
  defense.setCurrentShield(1); defense.applyIncomingDamage(1); defense.advanceProtection(500 - remaining);
}

describe('GAME-056 production Laser vertical', () => {
  function acquire(s: GameplayScene, branch: 'scatter' | 'repeater' | 'lance') {
    setLaser(s, { power: 2, fireRate: 1, speed: 0 });
    s['playerBuild']!.applyLaserChoice({ kind: 'laserSpecialization', branch }, 0);
  }
  function pick(s: GameplayScene, api: NonNullable<Window['__NEBULA_DEV__']>, id: RewardCandidateId) {
    const roll = aimChoice(s, id, 0); expect(api.forceLevelUp()).toBe(true); roll.mockRestore();
    const text = [...s['levelUpChoices']].find(([, value]) => value === id)![0];
    expect(text).toBeDefined(); text.emit('pointerdown'); expect(s['run']!.state).toBe('RUNNING');
  }
  it.each(['base','prism','scatter','repeater','lance'] as const)('rejected %s Hit terminates flight without effects or next-frame retry',form=>{
    const {scene:s}=fixture();
    if(form==='prism')setLaser(s,undefined,true);
    else if(form!=='base')acquire(s,form);
    const e=s['createEnemy'](2800,1350,'tank',s['run']!)!;s['currentTarget']=e;s['fireLaser']();
    const flights=[...s['projectiles']];for(const p of flights)p.visual.x=2800;
    const before=s['runDiagnostics']!.snapshot(),hp=e.health,progression=s['playerProgression']!.snapshot();
    const hit=s['applyEnemyHit'].bind(s);
    const rejected=vi.spyOn(s as unknown as {applyEnemyHit:typeof hit},'applyEnemyHit').mockReturnValue(null);
    s['updateProjectiles'](0);expect(rejected).toHaveBeenCalledTimes(flights.length);
    expect(s['projectiles']).toHaveLength(0);expect(flights.every(p=>!p.visual.active)).toBe(true);
    expect(e.health).toBe(hp);expect(s['xpPickups']).toHaveLength(0);
    expect(s['runDiagnostics']!.snapshot()).toEqual(before);expect(s['playerProgression']!.snapshot()).toEqual(progression);
    s['updateProjectiles'](1000);expect(rejected).toHaveBeenCalledTimes(flights.length);rejected.mockRestore();
  });
  it('rejected Scatter pellets release volley ownership without recording a contact; last exit clears the map',()=>{
    const {scene:s}=fixture();acquire(s,'scatter');const e=s['createEnemy'](2800,1350,'tank',s['run']!)!;
    e.health=100;s['currentTarget']=e;s['fireLaser']();const volley=s['projectiles'][0].scatterVolley!;
    s['projectiles'][2].visual.x=2800;s['updateProjectiles'](0);
    expect(volley.remaining).toBe(2);expect(volley.contacts.get(e)).toBe(1);
    const hit=s['applyEnemyHit'].bind(s),remove=s['removeProjectile'].bind(s),exits:number[][]=[];
    const rejected=vi.spyOn(s as unknown as {applyEnemyHit:typeof hit},'applyEnemyHit').mockReturnValue(null);
    const cleanup=vi.spyOn(s as unknown as {removeProjectile:typeof remove},'removeProjectile').mockImplementation(p=>{
      remove(p);exits.push([volley.remaining,volley.contacts.get(e)??0]);
    });
    for(const p of s['projectiles'])p.visual.x=2800;
    const hp=e.health,diag=s['runDiagnostics']!.snapshot();s['updateProjectiles'](0);
    expect(exits).toEqual([[1,1],[0,0]]);expect(volley.contacts.size).toBe(0);expect(e.health).toBe(hp);
    expect(s['runDiagnostics']!.snapshot()).toEqual(diag);expect(s['xpPickups']).toHaveLength(0);
    rejected.mockRestore();cleanup.mockRestore();
  });
  it('rejected Lance Hit stops piercing, consumes no visit and releases earlier visited references',()=>{
    const {scene:s}=fixture();acquire(s,'lance');
    const enemies=[2500,2700,2900].map(x=>s['createEnemy'](x,1350,'tank',s['run']!)!);
    for(const e of enemies)e.health=100;s['currentTarget']=enemies[0];s['fireLaser']();const flight=s['projectiles'][0];
    s['updateProjectiles'](100);expect(flight.visited?.has(enemies[0])).toBe(true);expect(enemies[0].health).toBe(94);
    const add=vi.spyOn(flight.visited!,'add'),hit=s['applyEnemyHit'].bind(s);
    const rejected=vi.spyOn(s as unknown as {applyEnemyHit:typeof hit},'applyEnemyHit').mockReturnValue(null);
    const before=s['runDiagnostics']!.snapshot();s['updateProjectiles'](300);
    expect(rejected).toHaveBeenCalledTimes(1);expect(add).not.toHaveBeenCalled();expect(flight.visited?.size).toBe(0);
    expect(enemies.map(e=>e.health)).toEqual([94,100,100]);expect(flight.visual.active).toBe(false);
    expect(s['projectiles']).toHaveLength(0);expect(s['runDiagnostics']!.snapshot()).toEqual(before);
    s['updateProjectiles'](300);expect(rejected).toHaveBeenCalledTimes(1);rejected.mockRestore();add.mockRestore();
  });
  it('terminal and native restart keep stale flight cleanup away from fresh projectiles',()=>{
    const f=fixture(),s=f.scene;allowCreate(s);s.create();const old=playerShot(s),oldRun=s['run']!;
    s['enterPlayerDeath']();s['updateProjectiles'](1000);expect(s['projectiles']).toContain(old);
    f.shutdown();s.create();const fresh=playerShot(s),before=s['runDiagnostics']!.snapshot();
    s['removeProjectile'](old);expect(oldRun.state).toBe('DISPOSED');expect(old.visual.active).toBe(false);
    expect(s['projectiles']).toEqual([fresh]);expect(fresh.visual.active).toBe(true);
    expect(s['runDiagnostics']!.snapshot()).toEqual(before);
  });
  it('numeric-only zero-branch fallback uses actual production offer/handlers without consuming pending or readiness',()=>{
    const {scene:s,api}=fixture();setLaser(s,{power:2,fireRate:1,speed:0});
    s['playerBuild']!.addTagPoints('PROJECTILES',Number.MAX_SAFE_INTEGER);
    const before=s['playerBuild']!.snapshot(),draws=spyStreams(s);
    expect(api.forceLevelUp()).toBe(true);expect(s['playerBuild']!.snapshot()).toEqual(before);
    const offer=s['rewardTransaction']!.snapshot()!;
    expect(new Set(offer.candidates.map(c=>c.id)).size).toBe(3);
    expect(offer.candidates.every(c=>c.choice.kind!=='laserSpecialization')).toBe(true);
    expect(s['playerProgression']!.snapshot().pendingLevels).toBe(1);
    expect(draws.map(d=>d.mock.calls.length)).toEqual([0,3,0,0]);
    s['levelUpPresentation'][2].emit('pointerdown');expect(s['playerProgression']!.snapshot().pendingLevels).toBe(0);
    expect(s['playerBuild']!.snapshot().laser.form).toBe('BASE');
  });
  it.each(['scatter', 'repeater', 'lance'] as const)('real transaction applies %s, all4 developments and Capstone exactly once', branch => {
    const { scene: s, api } = fixture(); setLaser(s, { power: 2, fireRate: 1, speed: 0 });
    const events = [...s['gameplayTimers']], streams = spyStreams(s);
    const ids = rewardChoices.filter(c => 'branch' in c && c.branch === branch).map(choiceIdentity);
    expect(ids).toHaveLength(6);
    for (const id of ids) pick(s, api, id);
    const snapshot = api.snapshot()!; expect(snapshot.build.laser).toMatchObject({ form: branch.toUpperCase(), capstone: true });
    expect(snapshot.build.laser.upgrades).toHaveLength(4); expect(snapshot.diagnostics.aggregates.choicesAccepted).toBe(6);
    expect(snapshot.build.tags.PROJECTILES).toBe(1); expect(s['gameplayTimers']).toEqual(events);
    expect(streams[0]).not.toHaveBeenCalled(); expect(streams[2]).not.toHaveBeenCalled(); expect(streams[3]).not.toHaveBeenCalled();
    const before = snapshot.build; expect(() => s['playerBuild']!.applyLaserChoice({ kind: 'laserSpecialization', branch }, 0)).toThrow();
    expect(api.snapshot()!.build).toEqual(before);
  });
  it('Scatter independently damages five times, diminishes only force and releases its bounded shared map', () => {
    const { scene: s } = fixture(); acquire(s, 'scatter');
    for (const choice of rewardChoices.filter(c => c.kind === 'laserDevelopment' && c.branch === 'scatter')) {
      s['playerBuild']!.applyLaserChoice(choice as import('../player/laserProgression').LaserChoice, 0);
    }
    s['playerBuild']!.applyLaserChoice({ kind: 'laserCapstone', branch: 'scatter' }, 0);
    const e = s['createEnemy'](2800, 1350, 'tank', s['run']!)!; e.health = 100; s['currentTarget'] = e;
    s['fireLaser'](); const flights = [...s['projectiles']], volley = flights[0].scatterVolley!;
    expect(flights).toHaveLength(5); expect(flights.every(p => p.scatterVolley === volley && p.attack === flights[0].attack)).toBe(true);
    const factors: number[] = [], hit = s['applyEnemyHit'].bind(s);
    const spy = vi.spyOn(s as unknown as { applyEnemyHit: typeof hit }, 'applyEnemyHit').mockImplementation((h: Parameters<typeof hit>[0]) => {
      if (h.kind === 'ENEMY_DIRECT') factors.push(h.impactFactor!); return hit(h);
    });
    for (const p of flights) { p.visual.x = e.visual.x; p.visual.y = e.visual.y; }
    s['updateProjectiles'](0); expect(factors).toEqual([1, .5, .25, .125, .0625]);
    expect(e.health).toBeCloseTo(100 - 5 * (3 * .65)); expect(volley.contacts.size).toBe(0); expect(volley.remaining).toBe(0);
    expect(s['projectiles']).toHaveLength(0); expect(e.knockbackVelocity.x).toBeLessThanOrEqual(600); spy.mockRestore();
  });
  it.each([3, 4, 5])('Lance bounds %s distinct references per flight with collection ties and no repeated survivor', limit => {
    const { scene: s } = fixture(); acquire(s, 'lance');
    if (limit >= 4) s['playerBuild']!.applyLaserChoice({ kind: 'laserDevelopment', branch: 'lance', upgrade: 'penetration' }, 0);
    if (limit === 5) {
      for (const upgrade of ['damage', 'velocity', 'radius'] as const) s['playerBuild']!.applyLaserChoice({ kind: 'laserDevelopment', branch: 'lance', upgrade }, 0);
      s['playerBuild']!.applyLaserChoice({ kind: 'laserCapstone', branch: 'lance' }, 0);
    }
    const enemies = Array.from({ length: 6 }, (_, i) => s['createEnemy'](2500 + 100 * i, 1350, 'tank', s['run']!)!);
    for (const e of enemies) e.health = 100; s['currentTarget'] = enemies[0]; s['fireLaser']();
    const damage = s['projectiles'][0].damage; s['updateProjectiles'](500);
    expect(enemies.map(e => e.health)).toEqual(enemies.map((_, i) => i < limit ? 100 - damage : 100));
    expect(s['projectiles']).toHaveLength(0); s['fireLaser'](); s['updateProjectiles'](0); expect(enemies[0].health).toBe(100 - damage);
  });
  it('Lance large and small segments agree, survivor refs cannot be hit twice but another flight can', () => {
    const simulate = (steps: number[]) => {
      const { scene: s } = fixture(); acquire(s, 'lance');
      const e = s['createEnemy'](2600, 1350, 'tank', s['run']!)!; e.health = 100; s['currentTarget'] = e; s['fireLaser']();
      const p = s['projectiles'][0]; for (const dt of steps) s['updateProjectiles'](dt);
      expect(p.visited?.has(e)).toBe(true); const hp = e.health;
      p.visual.x = 2600; s['updateProjectiles'](0); expect(e.health).toBe(hp);
      s['fireLaser'](); const next = s['projectiles'].at(-1)!; next.visual.x = 2600; s['updateProjectiles'](0);
      expect(e.health).toBe(hp - next.damage); return hp;
    };
    expect(simulate([200])).toBe(simulate([50, 50, 50, 50]));
  });
  it.each(['scatter', 'repeater', 'lance'] as const)('%s keeps old frozen attacks across upgrades and pauses geometry/RNG', branch => {
    const { scene: s } = fixture(); acquire(s, branch); const e = s['createEnemy'](3000, 1350, 'tank', s['run']!)!;
    s['currentTarget'] = e; const streams = spyStreams(s); s['fireLaser'](); const p = s['projectiles'][0], before = structuredClone(p.attack);
    s['playerBuild']!.applyLaserChoice({ kind: 'laserDevelopment', branch, upgrade: 'damage' }, 0);
    expect(p.attack).toEqual(before); s['run']!.requestPause('MANUAL');
    const position = { x: p.visual.x, y: p.visual.y, life: p.remainingLifetime }; s['updateProjectiles'](5000);
    expect({ x: p.visual.x, y: p.visual.y, life: p.remainingLifetime }).toEqual(position);
    for (const spy of streams) expect(spy).not.toHaveBeenCalled();
  });
  it('Lance Boss kill finishes owning cleanup, preserves BASE death bucket and physicalXP10, stops later hits', () => {
    const { scene: s, api } = fixture(); acquire(s, 'lance'); api.spawnWarden(); api.setWardenHealth(1);
    const boss = s['enemies'][0]; boss.visual.x = 2500; boss.visual.y = 1350;
    const other = s['createEnemy'](2600, 1350, 'tank', s['run']!)!; other.health = 100;
    s['currentTarget'] = boss; s['fireLaser'](); const flight = s['projectiles'][0]; s['updateProjectiles'](500);
    expect(s['run']!.outcome).toBe('VICTORY'); expect(s['projectiles']).not.toContain(flight); expect(other.health).toBe(100);
    expect(s['xpPickups'].map(x => x.value)).toEqual([10]);
    expect(api.snapshot()!.diagnostics.aggregates.killsBySource['LASER.BASE.DIRECT']).toBe(1);
  });
});
function fixture() {
  const scene = new GameplayScene();
  const listeners = new Map<string, Set<() => void>>();
  const created: ReturnType<typeof visual>[] = [];
  const run = new RunLifecycle();
  run.start();
  const runDiagnostics = new RunDiagnostics(0);
  runDiagnostics.recordRunStarted();
  Object.assign(scene, {
    run,
    runDiagnostics,
    rewardTransaction: new RewardTransaction(), levelUpGenerator: new LevelUpGenerator(),
    playerProgression: new PlayerProgression(), playerBuild: new PlayerBuild(), playerDefense: new PlayerDefense(5),
    time: { paused: false }, input: {}, game: { events: new EventEmitter() },
    runRandom: new RunRandom(0),
    cameras: { main: { worldView: { left: 1440, right: 3360, top: 810, bottom: 1890 } } },
    player: visual(2400, 1350), scale: { width: 1920, height: 1080 },
    add: {
      text: (_x: number, _y: number, text: string) => {
        const item = Object.assign(visual(), { text }); created.push(item); return item;
      },
      circle: (x: number, y: number, radius: number) => visual(x, y, radius),
      polygon: (x: number, y: number) => visual(x, y),
      graphics,
    },
    events: {
      once: (key: string, fn: () => void) => {
        if (!listeners.has(key)) listeners.set(key, new Set());
        listeners.get(key)!.add(fn);
      },
      off: (key: string, fn: () => void) => listeners.get(key)?.delete(fn),
    },
    gameplayTimers: Array.from({ length: 5 }, () => ({ callback: () => {}, elapsed: 123 })),
    spawnTimer: { delay: 2000, elapsed: 123, reset: vi.fn() },
  });
  scene['publishDevTools']();
  return { scene, api: window.__NEBULA_DEV__!, created,
    shutdown: () => { for (const fn of [...listeners.get('shutdown') ?? []]) fn(); } };
}
// Choose a midpoint input for an existing candidate in a controlled slot. Actual policy,
// transaction, handlers and effect application still run; no alternate generator is installed.
function targetRoll(s: GameplayScene, id: RewardCandidateId, slot: 0 | 1 | 2) {
  const plan = s['levelUpGenerator']!['prepare']({ ...s['rewardContext'](s['playerBuild']!), weaponFocus: s['weaponFocus'] });
  const first = plan.pool(0, [])[0], second = plan.pool(1, [first])[0];
  const pool = plan.pool(slot, slot === 0 ? [] : slot === 1 ? [first] : [first, second]);
  const index = pool.findIndex(c => c.id === id);
  if (index < 0) throw Error('Unavailable fixture choice ' + id);
  const weights = pool.map(c => plan.weights[slot].get(c.id)!);
  return (weights.slice(0, index).reduce((a,b) => a+b,0) + weights[index]/2) / weights.reduce((a,b) => a+b,0);
}
function aimChoice(s: GameplayScene, id: RewardCandidateId, slot: 0 | 1 | 2) {
  const roll = targetRoll(s, id, slot), spy = vi.spyOn(s['runRandom']!.reward, 'next');
  spy.mockReturnValueOnce(slot === 0 ? roll : 0).mockReturnValueOnce(slot === 1 ? roll : 0).mockReturnValueOnce(slot === 2 ? roll : 0);
  return spy;
}
describe('GAME-057-C real Missile combat vertical', () => {
  function setup(branch: 'guidance' | 'heavy' | 'fragmentation') {
    const f = fixture(), s = f.scene;
    setMissile(s, { warheadPower: 1, propulsion: 1, blastExpansion: 1 });
    s['playerBuild']!.applyMissileChoice({ kind: 'missileSpecialization', branch }, { combatMultiplier: 1, spatialLevel: 0 });
    const enemy = s['createEnemy'](2800,1350,'tank',s['run']!)!; enemy.health = 100;
    return { ...f, enemy };
  }
  function burst(f = setup('fragmentation'), offset = 0) {
    const s = f.scene; s['fireMissile'](); const parent = s['missiles'][0];
    parent.visual.x = f.enemy.visual.x + offset; parent.visual.y = f.enemy.visual.y;
    s['updateMissiles'](0); return { ...f, parent };
  }
  it.each(['guidance','heavy','fragmentation'] as const)('%s authentic acquisition, all developments and Capstone affect future combat exactly once', branch => {
    const f = fixture(), s = f.scene;
    setMissile(s, { warheadPower: 1, propulsion: 1, blastExpansion: 1 });
    s['createEnemy'](3000,1350,'tank',s['run']!); s['fireMissile'](); const old = s['missiles'][0], original = old.plan;
    const ids = rewardChoices.filter(c => 'branch' in c && c.branch === branch).map(choiceIdentity);
    const timers = [...s['gameplayTimers']], streams = spyStreams(s);
    for (const id of ids) {
      const roll = aimChoice(s, id, 0); expect(f.api.forceLevelUp()).toBe(true); expect(roll).toHaveBeenCalledTimes(3); roll.mockRestore();
      const text = [...s['levelUpChoices']].find(([, value]) => value === id)![0], handler = text.listeners('pointerdown')[0];
      text.emit('pointerdown'); const after = f.api.snapshot(); handler(); expect(f.api.snapshot()).toEqual(after);
      expect(s['run']!.state).toBe('RUNNING'); expect(old.plan).toBe(original);
    }
    expect(s['playerBuild']!.getMissileConfiguration()).toMatchObject({ form: branch.toUpperCase(), capstone: true });
    s['removeMissile'](old,s['missiles']); s['fireMissile'](); const next = s['missiles'][0];
    expect(next.plan.form).toBe(branch.toUpperCase()); expect(Object.isFrozen(next.plan)).toBe(true);
    expect(next.damage).toBe(branch === 'guidance' ? 3 * 1.1 : branch === 'heavy' ? 12 : 3);
    if (next.plan.behavior === 'STRAIGHT_FRAGMENTING') expect(next.plan.childCount).toBe(8);
    expect(s['gameplayTimers']).toEqual(timers); expect(timers).toHaveLength(5);
    for (const i of [0,2,3]) expect(streams[i]).not.toHaveBeenCalled();
  });
  it('same Missile event preserves exact fractional cadence and callback/scope/args; unchanged cadence never resets it', async () => {
    const { default: Clock } = await vi.importActual<{ default: typeof import('phaser').Time.Clock }>('../../../node_modules/phaser/src/time/Clock.js');
    const f = fixture(), s = f.scene; allowCreate(s); Object.assign(s,{ sys:{events:{once(){},on(){}}} });
    const clock = new Clock(s); Object.assign(s,{time:clock}); s.create(); clock.preUpdate(); clock.update(450,450);
    setMissile(s,{warheadPower:1,propulsion:1,blastExpansion:1});
    const event=s['missileTimer']!, callback=event.callback, scope=event.callbackScope, args=event.args, reset=vi.spyOn(event,'reset');
    const roll=aimChoice(s,'missile.specialize.heavy',0); window.__NEBULA_DEV__!.forceLevelUp(); roll.mockRestore();
    [...s['levelUpChoices']].find(([,id])=>id==='missile.specialize.heavy')![0].emit('pointerdown');
    expect(event.delay).toBe(2700); expect(event.elapsed).toBe(675); expect(event.callback).toBe(callback); expect(event.callbackScope).toBe(scope); expect(event.args).toBe(args);
    expect(reset).toHaveBeenCalledTimes(1);
    const payload=aimChoice(s,'missile.heavy.payload',0); window.__NEBULA_DEV__!.forceLevelUp(); payload.mockRestore();
    [...s['levelUpChoices']].find(([,id])=>id==='missile.heavy.payload')![0].emit('pointerdown'); expect(reset).toHaveBeenCalledTimes(1);
    expect(s['gameplayTimers'][2]).toBe(event); expect(s['gameplayTimers']).toHaveLength(5);
  });
  it('same Text/token rejects numeric overflow then genuinely accepts a corrected selection with zero extra draws', () => {
    const f=fixture(),s=f.scene; setMissile(s,{warheadPower:1,propulsion:1,blastExpansion:1});
    const roll=aimChoice(s,'missile.specialize.heavy',0); f.api.forceLevelUp(); roll.mockRestore();
    const text=[...s['levelUpChoices']].find(([,id])=>id==='missile.specialize.heavy')![0], handler=text.listeners('pointerdown')[0], token=s['rewardPresentation']!.token;
    s['playerBuild']!.applyStatPercent('projectileScale',Number.MAX_SAFE_INTEGER/9-1);
    const before=f.api.snapshot(),draws=spyStreams(s); text.emit('pointerdown');
    expect(f.api.snapshot()).toEqual(before); expect(text.active).toBe(true); expect(s['rewardPresentation']!.token).toBe(token); expect(text.listeners('pointerdown')[0]).toBe(handler);
    s['playerBuild']!.applyStatPercent('projectileScale',-(Number.MAX_SAFE_INTEGER/9-1)); text.emit('pointerdown');
    expect(s['playerBuild']!.getMissileConfiguration().form).toBe('HEAVY'); expect(s['run']!.state).toBe('RUNNING');
    for(const draw of draws) expect(draw).not.toHaveBeenCalled();
  });
  it.each(['BASE','HEAVY','FRAGMENTATION'] as const)('%s keeps its launch heading after target movement/removal', form => {
    const f=form==='BASE'?fixture():setup(form==='HEAVY'?'heavy':'fragmentation'),s=f.scene;
    if(form==='BASE')s['createEnemy'](3000,1350,'tank',s['run']!);
    s['fireMissile']();const m=s['missiles'][0],heading=[m.headingX,m.headingY];
    m.target!.visual.y+=300;s['updateMissiles'](10);expect([m.headingX,m.headingY]).toEqual(heading);
    s['enemies']=[];s['createEnemy'](2400,1800,'tank',s['run']!);s['updateMissiles'](10);expect([m.headingX,m.headingY]).toEqual(heading);
  });
  it.each(['CLUSTER','GUIDANCE'] as const)('%s retains a living target, reacquires nearest to itself, then retains heading without targets', form => {
    const f=form==='GUIDANCE'?setup('guidance'):fixture(),s=f.scene;
    if(form==='CLUSTER'){setMissile(s,undefined,true);s['createEnemy'](3000,1350,'tank',s['run']!);}
    s['fireMissile']();const m=s['missiles'][0],target=m.target!;target.visual.y=1800;
    s['createEnemy'](2400,1600,'tank',s['run']!);s['updateMissiles'](1);expect(m.target).toBe(target);expect(m.headingY).toBeGreaterThan(0);
    s['enemies'].splice(s['enemies'].indexOf(target),1);s['updateMissiles'](1);expect(m.target).toBe(s['enemies'][0]);
    const heading=[m.headingX,m.headingY];s['enemies']=[];s['updateMissiles'](1);expect(m.target).toBeUndefined();expect([m.headingX,m.headingY]).toEqual(heading);
  });
  it('Guidance selects the earlier frozen fuse intersection and composes Engineering only at launch', () => {
    const f=setup('guidance'),s=f.scene;f.enemy.visual.x=3000;s['fireMissile']();const m=s['missiles'][0];
    const explode=vi.spyOn(s as unknown as {explodeMissile:typeof s['explodeMissile']},'explodeMissile');
    s['applyBuildChange']({kind:'percent',stat:'engineering',delta:3});s['updateMissiles'](1000);
    expect(explode.mock.calls[0].slice(0,2)).toEqual([2936,1350]);expect(f.enemy.health).toBe(97.3);expect(m.plan).toMatchObject({fuseDistance:64});expect(s['missiles']).toHaveLength(0);
  });
  it('Guidance body collision remains earlier than fuse for a large captured body; center-only AoE does not guarantee target damage', () => {
    const f=setup('guidance'),s=f.scene;f.enemy.visual.x=3400;s['applyBuildChange']({kind:'percent',stat:'projectileScale',delta:99});s['fireMissile']();s['updateMissiles'](1000);
    expect(s['missiles']).toHaveLength(0);expect(f.enemy.health).toBe(100);
  });
  it.each([false,true])('Guidance Capstone expiry=%s detonates once; arena exit remains silent', capstone => {
    const f=setup('guidance'),s=f.scene;
    if(capstone){for(const upgrade of ['payload','propulsion','fuse','endurance'] as const)s['playerBuild']!.applyMissileChoice({kind:'missileDevelopment',branch:'guidance',upgrade},{combatMultiplier:1,spatialLevel:0});s['playerBuild']!.applyMissileChoice({kind:'missileCapstone',branch:'guidance'},{combatMultiplier:1,spatialLevel:0});}
    s['fireMissile']();const m=s['missiles'][0];m.remainingLifetime=1;s['enemies']=[];m.headingX=0;m.headingY=0;
    const explode=vi.spyOn(s as unknown as {explodeMissile:typeof s['explodeMissile']},'explodeMissile');s['updateMissiles'](20);s['updateMissiles'](20);expect(explode).toHaveBeenCalledTimes(capstone?1:0);
    s['enemies']=[f.enemy];s['fireMissile']();const exit=s['missiles'][0];exit.visual.x=-exit.radius-1;s['enemies']=[];exit.headingX=0;exit.headingY=0;s['updateMissiles'](20);expect(explode).toHaveBeenCalledTimes(capstone?1:0);
  });
  it('Heavy applies one full center-only blast and captured Impact, with a single-frame ring', () => {
    const f=setup('heavy'),s=f.scene;s['fireMissile']();const m=s['missiles'][0];m.visual.x=2800;s['updateMissiles'](0);
    expect(f.enemy.health).toBe(91);expect(f.enemy.knockbackVelocity).toEqual({x:200,y:0});expect(s['missileEffects']).toHaveLength(1);
    const ring=s['missileEffects'][0];s.update(0,0);expect(ring.active).toBe(false);expect(s['missileEffects']).toHaveLength(0);
  });
  it.each([0,-27])('children born at center/tangency offset%s do not move or instantly collide with the surviving origin', offset => {
    const f=burst(undefined,offset),s=f.scene,children=[...s['missileChildren']];
    expect(children).toHaveLength(4);expect(s['reservedMissileChildren']).toBe(0);expect(s['missiles']).toHaveLength(0);
    for(const c of children){expect(c.remainingLifetime).toBe(500);expect(c.excludedEnemy).toBe(f.enemy);expect(c.visual.x).toBe(2800+offset);expect(c.visual.y).toBe(1350);}
    s['updateMissiles'](10);expect(s['missileChildren']).toHaveLength(4);expect(f.enemy.health).toBe(97.75);
    expect(children.map(c=>[c.headingX,c.headingY])).toEqual(Array.from({length:4},(_,i)=>[Math.cos(2*Math.PI*i/4),Math.sin(2*Math.PI*i/4)]));
    expect(children[0].visual.x).toBe(2809+offset);expect(children.every(c=>c.plan.behavior==='STRAIGHT')).toBe(true);
  });
  it('strict separation retains equality, clears irreversibly after exit and permits a later independent direct hit', () => {
    const prepared=setup('fragmentation');prepared.scene['moduleLevels'].spatial=1;
    const f=burst(prepared),s=f.scene,c=s['missileChildren'][0];s['updateMissiles'](30);expect(c.visual.x).toBe(2827);expect(c.excludedEnemy).toBe(f.enemy);
    s['updateMissiles'](.001);expect(c.excludedEnemy).toBeNull();
    f.enemy.visual.x=c.visual.x+40;s['updateMissiles'](100);expect(s['missileChildren']).not.toContain(c);expect(c.excludedEnemy).toBeNull();
    expect(f.enemy.health).toBe(97.1875); // One legitimate later independent explosion.
  });
  it('moving originals clear at their current pose; death synchronously clears every child reference', () => {
    const f=burst(),s=f.scene,children=[...s['missileChildren']];f.enemy.visual.x+=100;s['updateMissiles'](1);expect(children.every(c=>c.excludedEnemy===null)).toBe(true);
    const next=burst();const kids=[...next.scene['missileChildren']];
    const shot=playerShot(next.scene,2800,1000);next.scene['applyEnemyHit']({kind:'ENEMY_DIRECT',run:next.scene['run']!,target:next.enemy,attack:shot.attack as LaserAttack,direction:{x:1,y:0}});
    expect(kids.every(c=>c.excludedEnemy===null)).toBe(true);expect(next.scene['xpPickups']).toHaveLength(1);
  });
  it('other enemies remain collidable from birth and every fragment independently splashes the original', () => {
    const f=burst(),s=f.scene,other=s['createEnemy'](2810,1350,'tank',s['run']!)!;other.health=100;s['updateMissiles'](1);
    expect(s['missileChildren']).toHaveLength(0);expect(f.enemy.health).toBe(95.5);expect(other.health).toBe(97.75);expect(s['reservedMissileChildren']).toBe(0);
  });
  it('origin death in the parent blast gives no stale exclusion, while independent child kills create physical XP with the same source bucket', () => {
    const f=setup('fragmentation');f.enemy.health=1;const b=burst(f);const s=b.scene;
    expect(s['missileChildren'].every(c=>c.excludedEnemy===null)).toBe(true);expect(s['xpPickups'][0].value).toBe(1);
    const e=s['createEnemy'](2800,1350,'chaser',s['run']!)!;e.health=.1;s['updateMissiles'](1);
    expect(s['xpPickups']).toHaveLength(2);expect(s['runDiagnostics']!.snapshot().aggregates.killsBySource['MISSILE.BASE.PRIMARY']).toBe(2);
    expect(s['playerProgression']!.snapshot().xp).toBe(0);
  });
  it('512 live/reserved capacity reserves whole bursts, rejects without visuals and releases on parent expiry', () => {
    const f=setup('fragmentation'),s=f.scene;f.enemy.health=10000;
    for(let i=0;i<128;i++)burst(f);expect(s['missileChildren']).toHaveLength(512);expect(s['reservedMissileChildren']).toBe(0);
    const circle=vi.spyOn(s.add,'circle'),draws=spyStreams(s);s['fireMissile']();expect(circle).not.toHaveBeenCalled();expect(s['missiles']).toHaveLength(0);
    s['removeMissile'](s['missileChildren'][0],s['missileChildren']);
    s['fireMissile']();expect(s['missileChildren']).toHaveLength(511);expect(s['missiles']).toHaveLength(0);expect(circle).not.toHaveBeenCalled();
    for(let i=0;i<3;i++)s['removeMissile'](s['missileChildren'][0],s['missileChildren']);
    s['fireMissile']();expect(s['reservedMissileChildren']).toBe(4);const parent=s['missiles'][0];parent.visual.x=100;parent.visual.y=100;parent.remainingLifetime=1;parent.target=undefined;parent.headingX=0;parent.headingY=0;
    s['updateMissiles'](1);expect(s['reservedMissileChildren']).toBe(0);expect(s['missileChildren'].length).toBeLessThanOrEqual(512);
    for(const d of draws)expect(d).not.toHaveBeenCalled();
  });
  it('failed burst preparation destroys unpublished visuals and releases the full reservation before any damage', () => {
    const f=setup('fragmentation'),s=f.scene;s['fireMissile']();s['missiles'][0].visual.x=2800;
    const actual=s.add.circle.bind(s.add),made:Array<ReturnType<typeof visual>>=[];let n=0;
    vi.spyOn(s.add,'circle').mockImplementation((...args)=>{if(++n===3)throw Error('engine failure');const v=actual(...args);made.push(v as unknown as ReturnType<typeof visual>);return v;});
    expect(()=>s['updateMissiles'](0)).toThrow('preparation failed');expect(made.every(v=>!v.active)).toBe(true);expect(s['missileChildren']).toHaveLength(0);expect(s['missiles']).toHaveLength(0);expect(s['reservedMissileChildren']).toBe(0);expect(f.enemy.health).toBe(100);
  });
  it.each(['MANUAL','REWARD','FOCUS_LOSS'] as const)('%s freezes child geometry, lifetime and grace; terminal clears references without late hits', reason => {
    const f=burst(),s=f.scene,c=s['missileChildren'][0],before=[c.visual.x,c.visual.y,c.remainingLifetime,c.excludedEnemy];
    s['run']!.requestPause(reason);s['updateMissiles'](10000);expect([c.visual.x,c.visual.y,c.remainingLifetime,c.excludedEnemy]).toEqual(before);
    s['run']!.releasePause(reason);s['updateMissiles'](10);expect(c.remainingLifetime).toBe(490);s['enterPlayerDeath']();const pos=[c.visual.x,c.visual.y,c.remainingLifetime];
    expect(s['missileChildren'].every(c=>c.excludedEnemy===null)).toBe(true);s['updateMissiles'](10000);expect([c.visual.x,c.visual.y,c.remainingLifetime]).toEqual(pos);
  });
  it.each(['parent','child'] as const)('Fragmentation %s Boss kill publishes/removes its complete detonation before Victory and freezes unrelated flights', mode => {
    const f=setup('fragmentation'),s=f.scene;s['moduleLevels'].spatial=20;
    let boss:typeof f.enemy;
    if(mode==='parent'){s['enemies']=[];boss=s['createEnemy'](2800,1350,'boss',s['run']!)!;boss.health=1;s['fireMissile']();s['missiles'][0].visual.x=2800;s['updateMissiles'](0);}
    else{burst(f);boss=s['createEnemy'](2800,1300,'boss',s['run']!)!;boss.health=.1;s['updateMissiles'](100);}
    expect(s['run']!.outcome).toBe('VICTORY');expect(s['missiles']).toHaveLength(0);expect(s['missileChildren']).toHaveLength(mode==='parent'?4:3);
    expect(s['reservedMissileChildren']).toBe(0);expect(s['missileChildren'].every(c=>c.excludedEnemy===null)).toBe(true);expect(s['enemies']).not.toContain(boss);
    expect(s['xpPickups'].filter(p=>p.value===10)).toHaveLength(1);const state=s['missileChildren'].map(c=>[c.visual.x,c.visual.y,c.remainingLifetime]);s['updateMissiles'](10000);expect(s['missileChildren'].map(c=>[c.visual.x,c.visual.y,c.remainingLifetime])).toEqual(state);
  });
  it('dirty PAUSED native restart destroys old parents/children, releases reservations and rejects old callbacks', () => {
    const f=fixture(),s=f.scene;allowCreate(s);s.create();s['enemies']=[];setMissile(s,{warheadPower:1,propulsion:1,blastExpansion:1});s['playerBuild']!.applyMissileChoice({kind:'missileSpecialization',branch:'fragmentation'},{combatMultiplier:1,spatialLevel:0});
    const enemy=s['createEnemy'](2800,1350,'tank',s['run']!)!;enemy.health=100;burst({...f,enemy});s['fireMissile']();const flights=[...s['missiles'],...s['missileChildren']],oldBuild=s['playerBuild']!,oldRun=s['run']!;
    oldRun.requestPause('MANUAL');f.shutdown();expect(flights.every(c=>!c.visual.active&&c.excludedEnemy===null&&c.reservedChildren===0)).toBe(true);
    s.create();expect(s['playerBuild']).not.toBe(oldBuild);expect(s['playerBuild']!.getMissileConfiguration().form).toBe('BASE');expect(s['missileChildren']).toHaveLength(0);expect(s['reservedMissileChildren']).toBe(0);expect(s['gameplayTimers']).toHaveLength(5);
    const before=window.__NEBULA_DEV__!.snapshot();s['explodeMissile'](2800,1350,flights[0]);s['stepMissile'](flights[0],1000,s['missiles'],false);expect(window.__NEBULA_DEV__!.snapshot()).toEqual(before);
  });
  it('old parent/child plans survive later payload, Spatial and shared-stat changes without double composition', () => {
    const f=setup('fragmentation'),s=f.scene;s['fireMissile']();const parent=s['missiles'][0],old=parent.plan;
    s['playerBuild']!.applyMissileChoice({kind:'missileDevelopment',branch:'fragmentation',upgrade:'payload'},{combatMultiplier:1,spatialLevel:0});
    s['applyBuildChange']({kind:'percent',stat:'reactorPower',delta:1});s['applyBuildChange']({kind:'percent',stat:'projectileVelocity',delta:1});s['moduleLevels'].spatial=10;
    parent.visual.x=2800;s['updateMissiles'](0);const child=s['missileChildren'][0];
    expect(parent.plan).toBe(old);expect(child.attack.snapshot).toEqual({damage:.5625,speed:900,radius:3,lifetime:500,impact:75,explosionRadius:25.5});
    s['fireMissile']();const next=s['missiles'][0];expect(next.damage).toBe(6);expect(next.plan).toMatchObject({childAttack:{snapshot:{damage:1.5,speed:1800,explosionRadius:55.5}}});
  });
  it('a large inward tangential segment exits once without an inclusive exit-boundary self-collision; zero delta leaves grace untouched', () => {
    const f=burst(undefined,-27),s=f.scene,c=s['missileChildren'][0];s['updateMissiles'](0);expect(c.excludedEnemy).toBe(f.enemy);
    s['updateMissiles'](100);expect(c.visual.x).toBe(2863);expect(c.excludedEnemy).toBeNull();expect(s['missileChildren']).toHaveLength(4);expect(f.enemy.health).toBe(97.75);
  });
  it('child lifetime clipping and arena exit release exact references without a late explosion', () => {
    const f=burst(),s=f.scene,children=[...s['missileChildren']];children[0].visual.x=-4;children[0].headingX=-1;s['updateMissiles'](1);
    expect(s['missileChildren']).not.toContain(children[0]);expect(children[0].excludedEnemy).toBeNull();
    s['updateMissiles'](10000);expect(s['missileChildren']).toHaveLength(0);expect(children.every(c=>!c.visual.active&&c.excludedEnemy===null)).toBe(true);expect(f.enemy.health).toBe(97.75);
  });
  it('terminal during unpublished child publication leaves no partial burst, stale reference or reserved capacity', () => {
    const f=setup('fragmentation'),s=f.scene;s['fireMissile']();s['missiles'][0].visual.x=2800;
    const actual=s.add.circle.bind(s.add),made:Array<ReturnType<typeof visual>>=[];let interrupted=false;
    vi.spyOn(s.add,'circle').mockImplementation((...args)=>{
      const child=actual(...args),show=child.setVisible.bind(child);made.push(child as unknown as ReturnType<typeof visual>);
      child.setVisible=(visible:boolean)=>{if(visible&&!interrupted){interrupted=true;s['enterPlayerDeath']();}return show(visible);};return child;
    });
    expect(()=>s['updateMissiles'](0)).toThrow('detonation failed');expect(made.every(c=>!c.active)).toBe(true);expect(s['missileChildren']).toHaveLength(0);expect(s['missiles']).toHaveLength(0);expect(s['reservedMissileChildren']).toBe(0);
  });
  it('shared stat preflight rejects the maximum authored enemy response before Build/cache/timer changes', () => {
    const f=setup('heavy'),s=f.scene,before=f.api.snapshot(),timers=s['gameplayTimers'].map(t=>t.elapsed);
    expect(()=>s['applyBuildChange']({kind:'percent',stat:'impact',delta:Number.MAX_SAFE_INTEGER/1000-1})).toThrow(RangeError);
    expect(f.api.snapshot()).toEqual(before);expect(s['gameplayTimers'].map(t=>t.elapsed)).toEqual(timers);
    expect(Reflect.set(s,'missileRanks',{warheadPower:2,propulsion:2,blastExpansion:2})).toBe(false);
    const copy=s['missileRanks'];copy.warheadPower=2;expect(s['missileRanks'].warheadPower).toBe(1);
  });
});

describe('GAME-057-C authoritative Missile reward boundary', () => {
  it('authentic tuning and Cluster selections update the single Build authority and real launch', () => {
    const { scene: s, api } = fixture(), timers = [...s['gameplayTimers']], rng = spyStreams(s);
    for (const id of ['missile.warheadPower', 'missile.propulsion', 'missile.blastExpansion',
      'missile.warheadPower', 'missile.propulsion', 'missile.blastExpansion', 'passive.spatial'] as const) {
      const ready = Object.values(s['missileRanks']).reduce((a,b) => a+b,0) >= 3;
      const roll = aimChoice(s, id, id === 'passive.spatial' ? 1 : ready ? 2 : 0);
      expect(api.forceLevelUp()).toBe(true); expect(roll).toHaveBeenCalledTimes(3); roll.mockRestore();
      const offer = s['rewardTransaction']!.snapshot()!;
      expect(offer.candidates.filter(c => c.choice.kind === 'missileSpecialization')).toHaveLength(s['missileRanks'].warheadPower + s['missileRanks'].propulsion + s['missileRanks'].blastExpansion >= 3 ? 1 : 0);
      const text = [...s['levelUpChoices']].find(([, value]) => value === id)![0]; text.emit('pointerdown');
      expect(s['run']!.state).toBe('RUNNING');
    }
    expect(s['missileRanks']).toEqual({ warheadPower: 2, propulsion: 2, blastExpansion: 2 });
    expect(s['missileValues']).toEqual({ damage: 4, speed: 600, explosionRadius: 180 });
    expect(api.forceLevelUp()).toBe(true);
    const text = [...s['levelUpChoices']].find(([, value]) => value === 'cluster')![0]; text.emit('pointerdown');
    expect(s['clusterEvolved']).toBe(true); expect(s['run']!.state).toBe('RUNNING');
    expect(s['playerBuild']!.getMissileConfiguration()).toEqual({ ranks: { warheadPower: 2, propulsion: 2, blastExpansion: 2 }, form: 'CLUSTER', upgrades: [], capstone: false });
    s['createEnemy'](2800, 1350, 'tank', s['run']!); s['fireMissile']();
    expect(s['missiles'][0].attack.variant).toBe('CLUSTER');
    expect(s['missiles'][0].attack.snapshot).toEqual({ damage: 4, speed: 600, radius: 8, lifetime: 4000, explosionRadius: 195, impact: 400 });
    expect(s['gameplayTimers']).toEqual(timers); expect(timers).toHaveLength(5);
    for (const index of [0, 2, 3]) expect(rng[index]).not.toHaveBeenCalled();
    expect(s['runDiagnostics']!.snapshot().aggregates.choicesAccepted).toBe(8);
  });
  it('rejects a premature injected Missile reward before mutation and keeps its authentic transaction retryable', () => {
    const { scene: s, api } = fixture();
    expect(api.forceLevelUp()).toBe(true);
    const p = s['rewardPresentation']!, text = [...p.choices.keys()][0], original = p.choices.get(text)!;
    const candidate = { id: 'missile.specialize.guidance' as const, choice: { kind: 'missileSpecialization' as const, branch: 'guidance' as const } };
    p.choices.set(text, candidate.id);
    expect(s['currentReward'](p, text, candidate.id)).toBe(true);
    const before = api.snapshot();
    expect(s['applyRewardChoice'](candidate, p, text)).toBe(false); expect(api.snapshot()).toEqual(before);
    expect(s['rewardTransaction']!.snapshot()!.phase).toBe('PRESENTED');
    p.choices.set(text, original);
    text.emit('pointerdown'); expect(s['run']!.state).toBe('RUNNING');
  });
});
beforeEach(() => { vi.stubGlobal('window', {}); vi.stubGlobal('document', { hasFocus: () => true, hidden: false }); });
describe('GAME-051 authoritative death', () => {
  function context(s: GameplayScene, damage = 1, variant: 'BASE' | 'PRISM' = 'BASE') {
    return { kind: 'ENEMY_DIRECT' as const, direction: { x: 1200, y: 0 }, run: s['run']!, target: s['enemies'][0],
      attack: createAttack({ kind: 'LASER', variant, snapshot: { damage, speed: 1200, radius: 6, lifetime: 2000, impact: 200 } }) as LaserAttack };
  }
  function watch(s: GameplayScene) { return vi.spyOn(s as unknown as { killEnemy: typeof s['killEnemy'] }, 'killEnemy'); }
  it('initial, normal, Elite and DEV enemies start with null attribution; DEV HP changes preserve a real source', () => {
    const f = fixture(), s = f.scene; allowCreate(s); s.create();
    expect(s['enemies'][0].lastDamagingSource).toBeNull();
    s['createEnemy'](2800, 1350, 'tank', s['run']!, true);
    window.__NEBULA_DEV__!.spawnWarden(); expect(s['enemies'].every(e => e.lastDamagingSource === null)).toBe(true);
    const e = s['enemies'].find(e => e.archetype === 'boss')!;
    s['applyEnemyHit']({ ...context(s), target: e }); const source = e.lastDamagingSource;
    window.__NEBULA_DEV__!.setWardenHealth(30); expect(e.lastDamagingSource).toBe(source);
  });
  it('A nonlethal then B lethal writes HP once per Hit, preflights first and creates one detached record', () => {
    const { scene: s, api } = fixture(), e = s['createEnemy'](-12.5, 0, 'chaser', s['run']!)!;
    let health = e.health; const writes: number[] = [];
    Object.defineProperty(e, 'health', { get: () => health, set: n => { writes.push(n); health = n; } });
    const factory = vi.spyOn(enemyDeath, 'createEnemyDeathRecord'), preflight = vi.spyOn(enemyDeath, 'validateEnemyDeathRecord'), completed = watch(s);
    try {
      const build = s['playerBuild']!.snapshot(), defense = s['playerDefense']!.snapshot(), timers = [...s['gameplayTimers']], draws = spyStreams(s);
      s['applyEnemyHit'](context(s)); const a = e.lastDamagingSource;
      expect(a).toEqual({ kind: 'LASER', variant: 'BASE', phase: 'DIRECT' }); expect(factory).not.toHaveBeenCalled();
      s['currentTarget'] = e;
      const hit = context(s, 10, 'PRISM'), result = s['applyEnemyHit'](hit)!;
      expect(result).toMatchObject({ calculatedDamage: 10, hpLost: 2, healthAfter: -8 }); expect(writes).toEqual([2, -8]);
      expect(preflight).toHaveBeenCalledTimes(1); expect(factory).toHaveBeenCalledTimes(1);
      const record = completed.mock.results[0].value!;
      expect(record).toEqual({ archetype: 'chaser', isElite: false, xpValue: 1, x: -12.5, y: 0,
        lastDamagingSource: { kind: 'LASER', variant: 'PRISM', phase: 'DIRECT' }, killSource: { kind: 'LASER', variant: 'PRISM', phase: 'DIRECT' } });
      expect(record.lastDamagingSource).not.toBe(e.lastDamagingSource); expect(a!.variant).toBe('BASE');
      expect(s['currentTarget']).toBeUndefined(); expect(e.visual.active).toBe(false); expect(s['enemies']).toHaveLength(0);
      expect(s['xpPickups'].map(p => [p.visual.x, p.visual.y, p.value, p.speed, p.visual.radius])).toEqual([[-12.5, 0, 1, 0, 10]]);
      expect(api.snapshot()!.diagnostics.aggregates).toMatchObject({ xpCollected: 0, xpCredited: 0, killsBySource: { 'LASER.PRISM.DIRECT': 1 } });
      expect(s['killEnemy'](...completed.mock.calls[0])).toBeNull(); expect(s['applyEnemyHit'](hit)).toBeNull();
      expect(factory).toHaveBeenCalledTimes(1); expect(s['xpPickups']).toHaveLength(1);
      expect(s['playerBuild']!.snapshot()).toEqual(build); expect(s['playerDefense']!.snapshot()).toEqual(defense);
      expect(s['gameplayTimers']).toEqual(timers); for (const draw of draws) expect(draw).not.toHaveBeenCalled();
    } finally { factory.mockRestore(); preflight.mockRestore(); completed.mockRestore(); }
  });
  it.each([false, true])('representational no-loss keeps prior attribution=%s and creates no record', prior => {
    const { scene: s } = fixture(), e = s['createEnemy'](2800, 1350, 'tank', s['run']!)!;
    if (prior) s['applyEnemyHit'](context(s)); const source = e.lastDamagingSource;
    e.health = Number.MAX_SAFE_INTEGER; const factory = vi.spyOn(enemyDeath, 'createEnemyDeathRecord');
    try {
      const before = s['runDiagnostics']!.snapshot(), result = s['applyEnemyHit'](context(s, Number.MIN_VALUE, 'PRISM'))!;
      expect(result).toMatchObject({ hpLost: 0, calculatedDamage: Number.MIN_VALUE, healthAfter: Number.MAX_SAFE_INTEGER, healthDepleted: false });
      expect(e.lastDamagingSource).toBe(source); expect(factory).not.toHaveBeenCalled(); expect(s['runDiagnostics']!.snapshot()).toEqual(before);
    } finally { factory.mockRestore(); }
  });
  it.each(['source', 'phase', 'x', 'y', 'xp', 'identity', 'elite'] as const)('invalid lethal %s fails before HP/source and any consequences', field => {
    const { scene: s } = fixture(), e = s['createEnemy'](2800, 1350, 'chaser', s['run']!)!;
    const hit = context(s, 10);
    if (field === 'source') Reflect.set(hit, 'attack', { ...hit.attack, variant: 'TWIN' });
    if (field === 'phase') Reflect.set(hit, 'kind', 'ENEMY_BLAST');
    if (field === 'x') e.visual.x = Infinity;
    if (field === 'y') e.visual.y = Number.MAX_SAFE_INTEGER + 1;
    if (field === 'xp' || field === 'identity' || field === 'elite') Object.defineProperty(e, 'spawnSnapshot', {
      value: { ...e.spawnSnapshot, ...(field === 'xp' ? { xpValue: 0 } : field === 'identity' ? { archetype: 'alien' } : { isElite: true }) },
    });
    const before = s['runDiagnostics']!.snapshot(), factory = vi.spyOn(enemyDeath, 'createEnemyDeathRecord');
    try {
      expect(() => s['applyEnemyHit'](hit)).toThrow(RangeError); expect(e.health).toBe(3); expect(e.lastDamagingSource).toBeNull();
      expect(e.visual.active).toBe(true); expect(s['enemies']).toContain(e); expect(s['xpPickups']).toHaveLength(0);
      expect(s['bossDefeated']).toBe(false); expect(s['runDiagnostics']!.snapshot()).toEqual(before); expect(factory).not.toHaveBeenCalled();
    } finally { factory.mockRestore(); }
  });
  it.each(['LASER', 'PRISM', 'DRONE', 'TWIN', 'MISSILE', 'CLUSTER_PRIMARY', 'CLUSTER_SATELLITE'] as const)('actual production %s creates exact source/record once', mode => {
    const { scene: s } = fixture(); Object.assign(s, { drone: visual(2510, 1350), twinDrone: visual(2290, 1350) });
    const e = s['createEnemy'](2800, 1350, 'chaser', s['run']!)!; e.health = 1; s['currentTarget'] = e;
    const completed = watch(s);
    try {
      if (mode === 'LASER' || mode === 'PRISM' || mode === 'DRONE' || mode === 'TWIN') {
        if (mode === 'PRISM') setLaser(s, undefined, true); s['twinDroneEvolved'] = mode === 'TWIN';
        if (mode === 'LASER' || mode === 'PRISM') s['fireLaser'](); else s['fireDrone']();
        const attacks = s['projectiles'].map(p => p.attack);
        for (const p of s['projectiles']) { p.visual.x = 2800; p.visual.y = 1350; }
        s['updateProjectiles'](0); expect(attacks.every(a => Object.isFrozen(a) && Object.isFrozen(a.snapshot))).toBe(true);
      } else {
        if (mode !== 'MISSILE') setMissile(s, undefined, true); s['fireMissile'](); const m = s['missiles'][0];
        if (mode === 'CLUSTER_SATELLITE') { const x = 2800 - m.explosionRadius * 1.5; s['explodeMissile'](x, 1350, m); s['explodeClusterSatellites'](x, 1350, m); }
        else { m.visual.x = 2800; m.visual.y = 1350; s['updateMissiles'](0); }
      }
      const source = { kind: mode === 'LASER' || mode === 'PRISM' ? 'LASER' : mode === 'DRONE' || mode === 'TWIN' ? 'COMBAT_DRONE' : 'MISSILE',
        variant: mode === 'PRISM' ? 'PRISM' : mode === 'TWIN' ? 'TWIN' : mode.startsWith('CLUSTER') ? 'CLUSTER' : 'BASE',
        phase: mode === 'CLUSTER_SATELLITE' ? 'SATELLITE' : mode === 'MISSILE' || mode === 'CLUSTER_PRIMARY' ? 'PRIMARY' : 'DIRECT' };
      expect(completed).toHaveBeenCalledTimes(1); expect(completed.mock.results[0].value).toMatchObject({ lastDamagingSource: source, killSource: source, x: 2800, y: 1350 });
      expect(s['xpPickups']).toHaveLength(1); const a = s['runDiagnostics']!.snapshot().aggregates;
      expect(a.killsBySource[`${source.kind}.${source.variant}.${source.phase}` as keyof typeof a.killsBySource]).toBe(1);
      expect(Object.values(a.killsBySource).reduce((a, b) => a + b, 0)).toBe(1);
    } finally { completed.mockRestore(); }
  });
  it('Cluster primary survivor dies to satellite and multiple overlapping deaths each keep their position/XP', () => {
    const { scene: s } = fixture(); setMissile(s, undefined, true);
    for (const x of [2497.5, 2498.5, 2692.5]) s['createEnemy'](x, 1350, 'chaser', s['run']!);
    s['enemies'][0].health = 5; s['enemies'][1].health = 5;
    s['enemies'][2].health = 1; s['fireMissile'](); const m = s['missiles'][0], completed = watch(s);
    try {
      s['explodeMissile'](2400, 1350, m); expect(s['enemies'].map(e => e.health)).toEqual([1, 1, 1]);
      expect(s['enemies'][0].lastDamagingSource?.phase).toBe('PRIMARY');
      s['explodeClusterSatellites'](2400, 1350, m); expect(completed).toHaveBeenCalledTimes(3);
      expect(completed.mock.results.every(r => r.value?.killSource.phase === 'SATELLITE')).toBe(true);
      expect(s['xpPickups'].map(p => [p.visual.x, p.value])).toEqual([[2497.5, 1], [2498.5, 1], [2692.5, 1]]);
      s['explodeClusterSatellites'](2400, 1350, m); expect(completed).toHaveBeenCalledTimes(3);
      expect(s['runDiagnostics']!.snapshot().aggregates).toMatchObject({ killed: { total: 3 }, xpDropped: 3, killsBySource: { 'MISSILE.CLUSTER.SATELLITE': 3 } });
    } finally { completed.mockRestore(); }
  });
  it.each([['chaser', false, 1], ['tank', true, 5], ['boss', false, 10]] as const)('XP%s elite%s stays physical and diagnostics observe completed removal', (kind, elite, xp) => {
    const { scene: s, api } = fixture(), e = s['createEnemy'](2800, 1350, kind, s['run']!, elite)!;
    const observe = vi.spyOn(s['runDiagnostics']!, 'recordEnemyKilled');
    const method = RunDiagnostics.prototype.recordEnemyKilled;
    observe.mockImplementation((...args) => {
      expect(e.visual.active).toBe(false); expect(s['enemies']).not.toContain(e); expect(s['xpPickups']).toHaveLength(1);
      expect(s['bossDefeated']).toBe(kind === 'boss'); return method.apply(s['runDiagnostics']!, args);
    });
    try {
      s['applyEnemyHit'](context(s, 100)); expect(s['xpPickups'][0].value).toBe(xp);
      expect(api.snapshot()!.diagnostics.aggregates).toMatchObject({ xpDropped: xp, xpCredited: 0 });
      expect(s['run']!.state).toBe('RUNNING'); if (kind === 'boss') expect(s['bossSpawned']).toBe(true);
    } finally { observe.mockRestore(); }
  });
  it.each(['BASE', 'CLUSTER_PRIMARY', 'CLUSTER_SATELLITE'] as const)('%s completes all death records and Missile cleanup before a single Victory', mode => {
    const { scene: s, api } = fixture(), boss = s['createEnemy'](mode === 'CLUSTER_SATELLITE' ? 3092.5 : 2800, 1350, 'boss', s['run']!)!;
    boss.health = 1; const primary = s['createEnemy'](2800, 1350, 'chaser', s['run']!)!, outer = s['createEnemy'](3092.5, 1350, 'chaser', s['run']!)!;
    primary.health = 1; outer.health = 1; if (mode !== 'BASE') setMissile(s, undefined, true); s['fireMissile']();
    const missile = s['missiles'][0]; missile.visual.x = 2800; missile.visual.y = 1350;
    const completed = watch(s), enter = s['enterRunVictory'].bind(s);
    const terminal = vi.spyOn(s as unknown as { enterRunVictory: typeof enter }, 'enterRunVictory');
    terminal.mockImplementation(() => {
      expect(s['missiles']).toHaveLength(0); expect(missile.visual.active).toBe(false);
      expect(completed.mock.results.filter(r => r.value)).toHaveLength(mode === 'BASE' ? 2 : 3);
      expect(s['runDiagnostics']!.snapshot().aggregates.killed.total).toBe(mode === 'BASE' ? 2 : 3);
      enter();
    });
    try {
      s['updateMissiles'](0); expect(terminal).toHaveBeenCalledTimes(1); expect(s['run']!.outcome).toBe('VICTORY');
      const record = completed.mock.results.find(r => r.value?.archetype === 'boss')!.value!;
      expect(record.killSource).toEqual({ kind: 'MISSILE', variant: mode === 'BASE' ? 'BASE' : 'CLUSTER',
        phase: mode === 'CLUSTER_SATELLITE' ? 'SATELLITE' : 'PRIMARY' });
      const before = api.snapshot()!.diagnostics, pickups = s['xpPickups'].map(p => [p.visual.x, p.visual.y, p.value, p.speed]);
      expect(pickups.some(p => p[2] === 10)).toBe(true); expect(before.aggregates.xpCredited).toBe(0);
      s['updateXpPickups'](10000); s['updateMissiles'](10000); s['enterPlayerDeath']();
      expect(api.snapshot()!.diagnostics).toEqual(before); expect(s['xpPickups'].map(p => [p.visual.x, p.visual.y, p.value, p.speed])).toEqual(pickups);
      expect(Object.values(before.aggregates.killsBySource).reduce((a, b) => a + b, 0)).toBe(before.aggregates.killed.total);
    } finally { completed.mockRestore(); terminal.mockRestore(); }
  });
  it('completion rejects living/nondepleted context without a record and rejects an incorrect source after an actual HP transition', () => {
    const { scene: s } = fixture(), e = s['createEnemy'](2800, 1350, 'chaser', s['run']!)!, hit = context(s, 3);
    const source = enemyDeath.createEnemyDamageSource({ kind: 'LASER', variant: 'BASE', phase: 'DIRECT' });
    const damage = { target: 'ENEMY' as const, calculatedDamage: 3, healthAfter: 0, hpLost: 3, healthDepleted: true };
    const factory = vi.spyOn(enemyDeath, 'createEnemyDeathRecord');
    try {
      expect(s['killEnemy'](hit, damage, source)).toBeNull(); expect(factory).not.toHaveBeenCalled();
      e.health = 0; e.lastDamagingSource = source;
      expect(s['killEnemy'](hit, { ...damage, healthDepleted: false }, source)).toBeNull();
      expect(() => s['killEnemy'](hit, damage, { kind: 'LASER', variant: 'PRISM', phase: 'DIRECT' })).toThrow(RangeError);
      expect(factory).not.toHaveBeenCalled(); expect(s['enemies']).toContain(e); expect(s['xpPickups']).toHaveLength(0);
    } finally { factory.mockRestore(); }
  });
});

describe('GAME-050 frozen spawn ownership', () => {
  it('creates the initial snapshot during PREPARING before start/entropy and bootstraps it once', () => {
    const { scene: s } = fixture(); allowCreate(s);
    const real = enemyDefinitions.createEnemySpawnSnapshot;
    const factory = vi.spyOn(enemyDefinitions, 'createEnemySpawnSnapshot');
    const start = vi.spyOn(RunLifecycle.prototype, 'start');
    factory.mockImplementation((definition, context) => {
      expect(s['run']!.state).toBe('PREPARING'); expect(start).not.toHaveBeenCalled();
      expect(s['enemies']).toHaveLength(0); return real(definition, context);
    });
    try {
      s.create(); const e = s['enemies'][0];
      expect(factory).toHaveBeenCalledTimes(1); expect(start).toHaveBeenCalledTimes(1);
      expect([e.visual.x, e.visual.y, e.health]).toEqual([3000, 1350, 3]);
      expect(e.run).toBe(s['run']); expect(e.spawnSnapshot).toEqual({ ...enemyDefinitions.ENEMY_DEFINITIONS.chaser, isElite: false });
      expect(s['successfulTimedSpawns']).toBe(0); expect(s['gameplayTimers']).toHaveLength(5);
      expect(s['runDiagnostics']!.snapshot().aggregates.spawned.total).toBe(1);
    } finally { factory.mockRestore(); start.mockRestore(); }
  });
  it.each(['chaser', 'shooter', 'tank', 'boss'] as const)('%s creates once with detached snapshot/getters and full mutable HP', kind => {
    const { scene: s } = fixture(), factory = vi.spyOn(enemyDefinitions, 'createEnemySpawnSnapshot'), draws = spyStreams(s);
    try {
      const e = s['createEnemy'](2800, 1350, kind, s['run']!, true)!;
      expect(factory).toHaveBeenCalledTimes(1); expect(e.run).toBe(s['run']);
      expect(e.health).toBe(e.spawnSnapshot.maxHealth); expect(e.isElite).toBe(kind === 'tank');
      expect(Object.isFrozen(e.spawnSnapshot) && Object.isFrozen(e.spawnSnapshot.movement)).toBe(true);
      for (const key of ['archetype', 'isElite', 'contactDamage', 'collisionRadius', 'xpValue'] as const) {
        expect(e[key]).toBe(e.spawnSnapshot[key]); expect(Object.getOwnPropertyDescriptor(e, key)?.set).toBeUndefined();
      }
      e.health = 0.5; expect(e.spawnSnapshot.maxHealth).toBe(kind === 'tank' ? 18 : enemyDefinitions.ENEMY_DEFINITIONS[kind].maxHealth);
      for (const draw of draws) expect(draw).not.toHaveBeenCalled();
    } finally { factory.mockRestore(); }
  });
  it.each(['PAUSED', 'TERMINAL', 'DISPOSED', 'PREPARING', 'stale'] as const)('rejects %s before factory/visual/count/flag/diagnostics/RNG', state => {
    const { scene: s } = fixture(), run = s['run']!, factory = vi.spyOn(enemyDefinitions, 'createEnemySpawnSnapshot');
    const polygon = vi.spyOn(s.add, 'polygon'), draws = spyStreams(s), before = s['runDiagnostics']!.snapshot();
    if (state === 'PAUSED') run.requestPause('MANUAL');
    if (state === 'TERMINAL') run.tryEnterTerminal('DEATH');
    if (state === 'DISPOSED') run.dispose();
    if (state === 'PREPARING') s['run'] = new RunLifecycle();
    if (state === 'stale') { const fresh = new RunLifecycle(); fresh.start(); s['run'] = fresh; }
    try {
      expect(s['createEnemy'](2800, 1350, 'boss', state === 'PREPARING' ? s['run']! : run)).toBeNull();
      s['spawnEnemy'](state === 'PREPARING' ? s['run']! : run);
      expect(factory).not.toHaveBeenCalled(); expect(polygon).not.toHaveBeenCalled(); expect(s['enemies']).toHaveLength(0);
      expect(s['successfulTimedSpawns']).toBe(0); expect(s['bossSpawned']).toBe(false);
      expect(s['runDiagnostics']!.snapshot()).toEqual(before); for (const draw of draws) expect(draw).not.toHaveBeenCalled();
    } finally { factory.mockRestore(); }
  });
  it('blocked cap/player/Boss and already-spawned DEV paths construct no snapshots', () => {
    const { scene: s, api } = fixture(); const factory = vi.spyOn(enemyDefinitions, 'createEnemySpawnSnapshot');
    try {
      for (let i = 0; i < 10; i++) s['createEnemy'](3000, 1350, 'chaser', s['run']!);
      factory.mockClear(); s['spawnEnemy'](s['run']!); expect(api.spawnWarden()).toBe(false);
      expect(factory).not.toHaveBeenCalled(); s['enemies'] = [];
      const player = s['player']; s['player'] = undefined; s['spawnEnemy'](s['run']!); expect(api.spawnWarden()).toBe(false);
      expect(factory).not.toHaveBeenCalled(); s['player'] = player;
      expect(api.spawnWarden()).toBe(true); expect(factory).toHaveBeenCalledTimes(1);
      factory.mockClear(); s['spawnEnemy'](s['run']!); expect(api.spawnWarden()).toBe(false);
      s['enemies'] = []; expect(api.spawnWarden()).toBe(false); expect(factory).not.toHaveBeenCalled();
    } finally { factory.mockRestore(); }
  });
  it('invalid authored values fail before visual, HP, flags, count or observation mutations', () => {
    const { scene: s } = fixture(), real = enemyDefinitions.createEnemySpawnSnapshot;
    const factory = vi.spyOn(enemyDefinitions, 'createEnemySpawnSnapshot'), polygon = vi.spyOn(s.add, 'polygon');
    factory.mockImplementation((definition, context) => real({ ...definition, maxHealth: NaN }, context));
    const before = s['runDiagnostics']!.snapshot();
    try {
      s['successfulTimedSpawns'] = 29; expect(() => s['spawnEnemy'](s['run']!)).toThrow(RangeError);
      expect(polygon).not.toHaveBeenCalled(); expect(s['enemies']).toHaveLength(0); expect(s['bossSpawned']).toBe(false);
      expect(s['successfulTimedSpawns']).toBe(29); expect(s['runDiagnostics']!.snapshot()).toEqual(before);
    } finally { factory.mockRestore(); }
  });
  it('moves from the owned snapshot rather than rereading authored numbers; current HP stays independent', () => {
    const { scene: s } = inputFixture();
    const real = enemyDefinitions.createEnemySpawnSnapshot, factory = vi.spyOn(enemyDefinitions, 'createEnemySpawnSnapshot');
    factory.mockImplementation((definition, context) => real({ ...definition, movement: { ...definition.movement, speed: 50 } } as enemyDefinitions.EnemyDefinition, context));
    try { s['createEnemy'](3000, 1350, 'tank', s['run']!); } finally { factory.mockRestore(); }
    const e = s['enemies'][0]; e.health = 4; s.update(0, 100);
    expect(e.visual.x).toBe(2995); expect(e.health).toBe(4); expect(e.spawnSnapshot.maxHealth).toBe(6);
    expect(s['enemies'][0].spawnSnapshot.movement.speed).toBe(50);
  });
  it('old enemy/Hit/removal and captured timed spawn cannot authorize work on a fresh run', () => {
    const f = fixture(), s = f.scene; allowCreate(s); s.create();
    const oldRun = s['run']!, old = s['enemies'][0], snapshot = old.spawnSnapshot;
    const callback = s['gameplayTimers'][0].callback!;
    const attack = createAttack({ kind: 'LASER', variant: 'BASE', snapshot: { damage: 100, speed: 1200, radius: 6, lifetime: 2000, impact: 200 } }) as LaserAttack;
    f.shutdown(); s.create(); const draws = spyStreams(s), before = window.__NEBULA_DEV__!.snapshot();
    callback(); s['spawnEnemy'](oldRun); expect(s['createEnemy'](3000, 1350, 'boss', oldRun)).toBeNull();
    // Even accidental old-runtime membership cannot grant ownership to a fresh Hit/removal.
    s['enemies'].push(old);
    expect(s['applyEnemyHit']({ kind: 'ENEMY_DIRECT', direction: { x: 1200, y: 0 }, run: s['run']!, target: old, attack })).toBeNull();
    expect(s['killEnemy']({ kind: 'ENEMY_DIRECT', direction: { x: 1200, y: 0 }, run: oldRun, target: old, attack },
      { target: 'ENEMY', calculatedDamage: 100, healthAfter: -97, hpLost: 3, healthDepleted: true },
      enemyDeath.createEnemyDamageSource({ kind: 'LASER', variant: 'BASE', phase: 'DIRECT' }))).toBeNull(); expect(old.health).toBe(3); s['enemies'].pop();
    expect(snapshot).toEqual({ ...enemyDefinitions.ENEMY_DEFINITIONS.chaser, isElite: false });
    expect(s['enemies'][0].spawnSnapshot).not.toBe(snapshot); expect(window.__NEBULA_DEV__!.snapshot()).toEqual(before);
    for (const draw of draws) expect(draw).not.toHaveBeenCalled();
  });
  it.each([
    ['chaser', false, 3000, 1000, 2820], ['tank', false, 3000, 1000, 2900],
    ['tank', true, 3000, 1000, 2880], ['chaser', false, 2500, 1000, 2400],
    ['shooter', false, 3000, 1000, 2900], ['shooter', false, 2900, 1000, 2900],
    ['shooter', false, 2750, 1000, 2750], ['shooter', false, 2700, 1000, 2750],
    ['shooter', false, 2400, 1000, 2540], ['shooter', false, 4000, 100000, 2900],
  ] as const)('%s elite%s x%s delta%s uses its movement snapshot -> x%s', (kind, elite, x, delta, expected) => {
    const { scene: s, api } = inputFixture(); api.setGodMode(true);
    const enemy = s['createEnemy'](x, 1350, kind, s['run']!, elite)!;
    const snapshot = enemy.spawnSnapshot; s.update(0, delta);
    expect(enemy.visual.x).toBe(expected); expect(enemy.visual.y).toBe(1350); expect(enemy.spawnSnapshot).toBe(snapshot);
  });
  it.each([[60, 70, 4], [31, 70, 4], [30, 100, 8], [1, 100, 8], [0, 0, 0], [-1, 0, 0]])(
    'Warden HP%s selects current speed%s/burst%s without modifying max or timer phases', (health, speed, shots) => {
      const { scene: s } = inputFixture(), e = s['createEnemy'](3000, 1350, 'boss', s['run']!)!;
      const timers = s['gameplayTimers'].map(t => t.elapsed); e.health = health; s.update(0, 1000); s['fireHostileProjectile']();
      expect(e.visual.x).toBe(3000 - speed); expect(s['projectiles']).toHaveLength(shots);
      expect(e.spawnSnapshot).toMatchObject({ maxHealth: 60, movement: { speed: 70, phaseTwoSpeed: 100 } });
      expect(s['gameplayTimers'].map(t => t.elapsed)).toEqual(timers);
    },
  );
  it('Warden DEV31->30->31 restores speed and authored phase outlines without immediate fire', () => {
    const { scene: s, api } = inputFixture(); expect(api.spawnWarden()).toBe(true);
    const e = s['enemies'][0], fill = vi.spyOn(e.visual, 'setFillStyle'), stroke = vi.spyOn(e.visual, 'setStrokeStyle');
    for (const [health, speed, color, outline] of [[31, 70, 0xd946ef, 0xfae8ff], [30, 100, 0xdc2626, 0xfb923c], [31, 70, 0xd946ef, 0xfae8ff]]) {
      e.visual.x = 3000; e.visual.y = 1350; expect(api.setWardenHealth(health)).toBe(true);
      expect(s['projectiles']).toHaveLength(0); s.update(0, 1000); expect(e.visual.x).toBe(3000 - speed);
      expect(fill).toHaveBeenLastCalledWith(color); s['restoreEnemyOutline'](e); expect(stroke).toHaveBeenLastCalledWith(3, outline);
    }
    expect(e.spawnSnapshot.maxHealth).toBe(60);
  });
  it('retains exact Scene polygon points/fills/highlight and regular/Elite outline restoration', () => {
    const { scene: s } = inputFixture(), polygon = vi.spyOn(s.add, 'polygon');
    const rows = [
      ['chaser', false, [24, 0, 48, 24, 24, 48, 0, 24], 0xf43f5e, 0xffcdd2, 2],
      ['shooter', false, [8, 8, 40, 8, 40, 40, 8, 40], 0xa855f7, 0xe9d5ff, 2],
      ['tank', false, [12, 4, 36, 4, 48, 24, 36, 44, 12, 44, 0, 24], 0xf59e0b, 0xfef3c7, 2],
      ['tank', true, [12, 4, 36, 4, 48, 24, 36, 44, 12, 44, 0, 24], 0xfacc15, 0xfffbeb, 3],
      ['boss', false, [40, 0, 68, 12, 80, 40, 68, 68, 40, 80, 12, 68, 0, 40, 12, 12], 0xd946ef, 0xfae8ff, 3],
    ] as const;
    for (const [kind, elite, points, fill, outline, width] of rows) {
      s['enemies'] = []; s['currentTarget'] = undefined;
      const e = s['createEnemy'](3000, 1350, kind, s['run']!, elite)!, stroke = vi.spyOn(e.visual, 'setStrokeStyle');
      expect(polygon).toHaveBeenLastCalledWith(3000, 1350, points, fill);
      s.update(0, 0); expect(stroke).toHaveBeenLastCalledWith(4, 0xfde047);
      s['restoreEnemyOutline'](e); expect(stroke).toHaveBeenLastCalledWith(width, outline);
    }
  });
  it('actual installed Clock dispatch preserves one snapshot per successful schedule and pending cap counts', async () => {
    const { default: Clock } = await vi.importActual<{ default: typeof import('phaser').Time.Clock }>('../../../node_modules/phaser/src/time/Clock.js');
    const { scene: s } = fixture(); allowCreate(s); Object.assign(s, { sys: { events: { once() {}, on() {} } } });
    const clock = new Clock(s); Object.assign(s, { time: clock }); s.create(); clock.preUpdate();
    Object.assign(s.cameras.main, { worldView: { left: 1440, right: 3360, top: 810, bottom: 1890 } });
    const factory = vi.spyOn(enemyDefinitions, 'createEnemySpawnSnapshot'), draw = vi.spyOn(s['runRandom']!.encounter, 'next');
    let elapsed = 0;
    try {
      for (let n = 1; n <= 30; n++) {
        s['enemies'] = []; s['projectiles'] = []; s['missiles'] = [];
        if (n === 12 || n === 30) {
          for (let i = 0; i < 10; i++) s['createEnemy'](4000, 2000, 'chaser', s['run']!);
          const calls = factory.mock.calls.length, draws = draw.mock.calls.length;
          clock.update(elapsed += 2000, 2000); expect(s['successfulTimedSpawns']).toBe(n - 1);
          expect(factory).toHaveBeenCalledTimes(calls); expect(draw).toHaveBeenCalledTimes(draws); s['enemies'] = [];
        }
        const calls = factory.mock.calls.length; clock.update(elapsed += 2000, 2000);
        expect(factory).toHaveBeenCalledTimes(calls + 1); expect(s['successfulTimedSpawns']).toBe(n);
        const enemy = s['enemies'][0]; expect(enemy.isElite).toBe(n === 12 || n === 24);
        expect(enemy.archetype).toBe(n === 30 ? 'boss' : ['chaser', 'chaser', 'chaser', 'shooter', 'chaser', 'tank'][(n - 1) % 6]);
      }
      expect(draw).toHaveBeenCalledTimes(60); const calls = factory.mock.calls.length;
      clock.update(elapsed += 2000, 2000); expect(factory).toHaveBeenCalledTimes(calls); expect(draw).toHaveBeenCalledTimes(60);
    } finally { factory.mockRestore(); draw.mockRestore(); }
  });
});

describe('current scene DevTools production operations', () => {
  it('publishes exactly five commands and observes detached snapshots without side effects', () => {
    const { scene, api } = fixture();
    expect(Object.keys(api)).toEqual(['snapshot', 'forceLevelUp', 'spawnWarden', 'setWardenHealth', 'setGodMode']);
    const before = api.snapshot()!;
    expect(before).toMatchObject({ godMode: false, playerHealth: 5, progression: { level: 1, xp: 0, threshold: 5 },
      protectionRemaining: 0, bossSpawned: false, bossDefeated: false, warden: null,
      successfulTimedSpawns: 0, activeEnemyCount: 0, gameplayTimerCount: 5 });
    before.progression.xp = 999;
    expect(api.snapshot()!.progression.xp).toBe(0);
    expect(api.snapshot()).toEqual(api.snapshot());
    scene['gameplayTimers'].pop();
    expect(api.snapshot()!.gameplayTimerCount).toBe(4);
  });
  it('credits exactly one real level from remainder, opens three choices and rejects duplicates', () => {
    const { scene, api } = fixture();
    scene['playerProgression']!.creditXp(12);
    scene['playerProgression']!.resolvePendingLevel();
    expect(api.forceLevelUp()).toBe(true);
    expect(scene['playerProgression']!.snapshot()).toEqual({ level: 3, xp: 0, threshold: 15, pendingLevels: 1 });
    expect(scene['levelUpPresentation']).toHaveLength(4);
    expect(api.snapshot()!.isLevelUpPaused).toBe(true);
    expect(api.forceLevelUp()).toBe(false);
    expect(scene['levelUpPresentation']).toHaveLength(4);
  });
  it('normal collected pickup is credited/removed before the real choice pause', () => {
    const { scene } = fixture();
    const pickup = { run: scene['run']!, visual: visual(2400, 1350), value: 5, speed: 0 };
    scene['xpPickups'] = [pickup as unknown as (typeof scene)['xpPickups'][number]];
    scene['updateXpPickups'](0);
    expect(scene['playerProgression']!.snapshot()).toEqual({ level: 2, xp: 0, threshold: 10, pendingLevels: 1 });
    expect(scene['xpPickups']).toHaveLength(0);
    expect(pickup.visual.active).toBe(false);
    expect(scene['levelUpPresentation']).toHaveLength(4);
  });
  it('creates real Warden once at deterministic safe corner without timed count/RNG', () => {
    const { scene, api } = fixture();
    const random = vi.spyOn(Math, 'random').mockImplementation(() => { throw Error('unexpected RNG'); });
    expect(api.spawnWarden()).toBe(true);
    const boss = scene['enemies'][0];
    expect(boss).toMatchObject({ archetype: 'boss', health: 60, collisionRadius: 40, contactDamage: 2, xpValue: 10 });
    expect([boss.visual.x, boss.visual.y]).toEqual([40, 40]);
    expect(Math.hypot(boss.visual.x - 2400, boss.visual.y - 1350)).toBeGreaterThanOrEqual(600);
    expect(api.spawnWarden()).toBe(false);
    scene['enemies'] = [];
    const before = api.snapshot();
    expect(api.spawnWarden()).toBe(false);
    expect(api.snapshot()).toEqual(before);
    expect(api.snapshot()!.successfulTimedSpawns).toBe(0);
    random.mockRestore();
  });
  it('rejects cap, missing player, prior defeat and an active Boss even without spawn flag', () => {
    const { scene, api } = fixture();
    for (let i = 0; i < 10; i++) scene['createEnemy'](100, 100, 'chaser', scene['run']!);
    expect(api.spawnWarden()).toBe(false);
    scene['enemies'] = [];
    scene['bossDefeated'] = true;
    expect(api.spawnWarden()).toBe(false);
    scene['bossDefeated'] = false;
    scene['createEnemy'](100, 100, 'boss', scene['run']!);
    scene['bossSpawned'] = false;
    expect(api.spawnWarden()).toBe(false);
    scene['enemies'] = [];
    scene['player'] = undefined;
    expect(api.spawnWarden()).toBe(false);
  });
  it.each([0, -1, 61, NaN, Infinity, -Infinity, '30', null])('rejects invalid Boss health %s without mutations', value => {
    const { api } = fixture();
    api.spawnWarden();
    const before = api.snapshot();
    expect(api.setWardenHealth(value as number)).toBe(false);
    expect(api.snapshot()).toEqual(before);
  });
  it('accepts endpoints/fractions and derives both phase transitions without other effects', () => {
    const { scene, api } = fixture();
    expect(api.setWardenHealth(30)).toBe(false);
    api.spawnWarden();
    for (const health of [1, 60, 1.5, 31, 30, 31]) {
      const before = api.snapshot()!;
      expect(api.setWardenHealth(health)).toBe(true);
      expect(api.snapshot()).toEqual({ ...before, warden: { health, phase: health > 30 ? 1 : 2 } });
      expect(scene['gameplayTimers'].every(timer => timer.elapsed === 123)).toBe(true);
    }
  });
  it('God Mode rejects contacts and consumes hostile shots without HP/protection changes', () => {
    const { scene, api } = fixture();
    expect(api.setGodMode('yes' as unknown as boolean)).toBe(false);
    api.setGodMode(true);
    scene['createEnemy'](2400, 1350, 'chaser', scene['run']!);
    scene['updatePlayerContact']();
    expect(scene['playerHealth']).toBe(5);
    expect(scene['player']!.x).toBe(2444);
    scene['launchHostileProjectile'](scene['player']!, 1, 0, scene['run']!);
    scene['updateProjectiles'](0);
    expect(scene['projectiles']).toHaveLength(0);
    expect(scene['playerDamageProtectionRemaining']).toBe(0);
    primeProtection(scene, 50);
    playerHit(scene, 1);
    expect(scene['playerDamageProtectionRemaining']).toBe(50);
    api.setGodMode(false);
    scene['playerDefense']!.advanceProtection(500);
    scene['updatePlayerContact']();
    expect(scene['playerHealth']).toBe(4);
    expect(scene['playerDamageProtectionRemaining']).toBe(500);
  });
  it.each(['isPlayerDead', 'isRunVictorious', 'isLevelUpPaused'] as const)('rejects all mutations during %s but allows snapshots', key => {
    const { scene, api } = fixture();
    if (key === 'isLevelUpPaused') { scene[key] = true; scene['run']!.requestPause('REWARD'); }
    else scene['run']!.tryEnterTerminal(key === 'isPlayerDead' ? 'DEATH' : 'VICTORY');
    const before = api.snapshot();
    expect(before).not.toBeNull();
    expect([api.spawnWarden(), api.forceLevelUp(), api.setGodMode(true), api.setWardenHealth(30)]).toEqual([false, false, false, false]);
    expect(api.snapshot()).toEqual(before);
  });
  it('permanently invalidates old closures even when the same Scene publishes a new binding', () => {
    const { scene, api, shutdown } = fixture();
    shutdown();
    expect(window.__NEBULA_DEV__).toBeUndefined();
    scene['publishDevTools']();
    const fresh = window.__NEBULA_DEV__!;
    expect(fresh).not.toBe(api);
    expect(api.snapshot()).toBeNull();
    expect([api.spawnWarden(), api.forceLevelUp(), api.setGodMode(true), api.setWardenHealth(30)]).toEqual([false, false, false, false]);
    expect(fresh.snapshot()!.godMode).toBe(false);
  });
  it('actual create resets God Mode and publishes fresh API with five newly owned pending events', () => {
    const { scene, api, shutdown } = fixture();
    api.setGodMode(true);
    api.spawnWarden();
    const oldTimers = [...scene['gameplayTimers']];
    shutdown();
    Object.assign(scene, {
      cameras: { main: { setBackgroundColor() {}, setBounds() {}, startFollow() {}, centerOn() {} } },
      input: {},
      time: { addEvent: (config: object) => ({ ...config, elapsed: 0 }) },
    });
    Object.assign(scene.add, { graphics });
    scene.create();
    const fresh = window.__NEBULA_DEV__!;
    expect(fresh).not.toBe(api);
    expect(fresh.snapshot()).toMatchObject({ godMode: false, bossSpawned: false, bossDefeated: false,
      warden: null, successfulTimedSpawns: 0, progression: { level: 1, xp: 0 }, activeEnemyCount: 1, gameplayTimerCount: 5 });
    expect(scene['gameplayTimers'].every(timer => !oldTimers.includes(timer))).toBe(true);
    expect(api.setGodMode(true)).toBe(false);
  });
  it('old shutdown cannot delete another current publication', () => {
    const old = fixture();
    const fresh = fixture();
    old.shutdown();
    expect(window.__NEBULA_DEV__).toBe(fresh.api);
    expect(old.api.snapshot()).toBeNull();
    expect(fresh.api.snapshot()).not.toBeNull();
  });
});

describe('GAME-042 real Scene terminal integration', () => {
  function shot(scene: GameplayScene, x = 2800, damage = 1) {
    playerShot(scene, x, damage);
    return scene['projectiles'].at(-1)!;
  }
  function boss(scene: GameplayScene, x = 2800) {
    scene['createEnemy'](x, 1350, 'boss', scene['run']!);
    const enemy = scene['enemies'].at(-1)!;
    enemy.health = 1;
    return enemy;
  }
  it('real lethal damage accepts one Death/presentation, rejects conflicting/duplicate terminal UI', () => {
    const { scene, api, created } = fixture();
    playerHit(scene, 100);
    expect([scene['run']!.state, scene['run']!.outcome]).toEqual(['TERMINAL', 'DEATH']);
    expect([scene['isPlayerDead'], scene['isRunVictorious'], scene['isSimulationPaused']()]).toEqual([true, false, true]);
    scene['enterPlayerDeath']();
    scene['bossDefeated'] = true;
    scene['enterRunVictory']();
    expect(created.filter(t => t.text === 'КОРАБЛЬ УНИЧТОЖЕН')).toHaveLength(1);
    expect(created.filter(t => t.text === 'ПОВТОРИТЬ')).toHaveLength(1);
    expect(scene['victoryPresentation']).toHaveLength(0);
    expect(api.snapshot()!.isPlayerDead).toBe(true);
    expect(api.spawnWarden()).toBe(false);
    expect(api.setGodMode(true)).toBe(false);
  });
  it('straight lethal hit and projectile cleanup complete before Victory; unrelated later shot freezes', () => {
    const { scene, api } = fixture();
    const enemy = boss(scene);
    const unrelated = shot(scene, 3100);
    const lethal = shot(scene);
    const run = scene['run']!;
    const accept = run.tryEnterTerminal.bind(run);
    vi.spyOn(run, 'tryEnterTerminal').mockImplementation(outcome => {
      expect(scene['enemies']).not.toContain(enemy);
      expect(scene['projectiles']).not.toContain(lethal);
      expect(lethal.visual.active).toBe(false);
      expect(scene['xpPickups'].filter(p => p.value === 10)).toHaveLength(1);
      return accept(outcome);
    });
    scene['updateProjectiles'](0);
    expect(run.outcome).toBe('VICTORY');
    expect(unrelated.remainingLifetime).toBe(2000);
    expect(scene['projectiles']).toEqual([unrelated]);
    expect([api.snapshot()!.isPlayerDead, api.snapshot()!.isRunVictorious]).toEqual([false, true]);
    const ui = [...scene['victoryPresentation']];
    scene['enterRunVictory']();
    scene['enterPlayerDeath']();
    playerHit(scene, 100);
    expect(scene['victoryPresentation']).toEqual(ui);
    expect(scene['playerHealth']).toBe(5);
    expect(run.outcome).toBe('VICTORY');
  });
  it.each(['missile', 'cluster-primary', 'cluster-satellite'] as const)('%s completes whole detonation before Victory', mode => {
    const { scene } = fixture();
    const enemy = boss(scene, mode === 'cluster-satellite' ? 3092.5 : 2800);
    scene['createEnemy'](2800, 1350, 'chaser', scene['run']!);
    const primary = scene['enemies'].at(-1)!;
    scene['createEnemy'](3092.5, 1350, 'chaser', scene['run']!);
    const satelliteSurvivor = scene['enemies'].at(-1)!;
    if (mode !== 'missile') setMissile(scene, undefined, true);
    if (mode !== 'missile') { primary.health = 5; satelliteSurvivor.health = 4; }
    scene['fireMissile']();
    const missile = scene['missiles'][0];
    missile.visual.x = 2800;
    missile.visual.y = 1350;
    const run = scene['run']!;
    const accept = run.tryEnterTerminal.bind(run);
    vi.spyOn(run, 'tryEnterTerminal').mockImplementation(outcome => {
      expect(scene['enemies']).not.toContain(enemy);
      expect(scene['missiles']).toHaveLength(0);
      expect(missile.visual.active).toBe(false);
      expect(primary.health).toBe(1);
      expect(satelliteSurvivor.health).toBe(mode === 'missile' ? 3 : 2);
      return accept(outcome);
    });
    scene['updateMissiles'](0);
    expect(run.outcome).toBe('VICTORY');
    expect(scene['xpPickups'].filter(p => p.value === 10)).toHaveLength(1);
  });
  it.each(['DEATH', 'VICTORY'] as const)('actual reverse projectile processing gives %s-first race to the first completed operation', first => {
    const { scene } = fixture();
    const enemy = boss(scene);
    const hostile = () => scene['launchHostileProjectile']({ x: 2400, y: 1350 }, 1, 0, scene['run']!);
    scene['playerDefense'] = new PlayerDefense(1);
    if (first === 'DEATH') { shot(scene); hostile(); }
    else { hostile(); shot(scene); }
    scene['updateProjectiles'](0);
    expect(scene['run']!.outcome).toBe(first);
    expect(scene['isPlayerDead'] && scene['isRunVictorious']).toBe(false);
    if (first === 'DEATH') {
      expect(scene['enemies']).toContain(enemy);
      expect(scene['victoryPresentation']).toHaveLength(0);
    } else {
      expect(scene['enemies']).not.toContain(enemy);
      expect(scene['playerHealth']).toBe(1);
    }
    expect(scene['run']!.tryEnterTerminal(first === 'DEATH' ? 'VICTORY' : 'DEATH')).toBe(false);
  });
  it('ordinary Level-Up uses PAUSED/REWARD, freezes simulation and resumes via real choice callback', () => {
    const { scene, api } = fixture();
    const projectile = shot(scene);
    expect(api.forceLevelUp()).toBe(true);
    expect([scene['run']!.state, scene['run']!.outcome]).toEqual(['PAUSED', null]);
    expect(scene['run']!.pauseReasons).toEqual(['REWARD']);
    scene['updateProjectiles'](100);
    expect(projectile.remainingLifetime).toBe(2000);
    scene['levelUpPresentation'][1].emit('pointerdown');
    expect(scene['isSimulationPaused']()).toBe(false);
    expect(scene['run']!.state).toBe('RUNNING');
    scene['updateProjectiles'](100);
    expect(projectile.remainingLifetime).toBe(1900);
  });
  it('PREPARING and DISPOSED suppress real gameplay and DevTools mutations', () => {
    const { scene, api } = fixture();
    const p = shot(scene);
    scene['run'] = new RunLifecycle();
    expect(scene['isSimulationPaused']()).toBe(true);
    expect(api.forceLevelUp()).toBe(false);
    scene['updateProjectiles'](100);
    playerHit(scene, 1);
    expect(p.remainingLifetime).toBe(2000);
    expect(scene['playerHealth']).toBe(5);
    scene['run'].dispose();
    expect(api.spawnWarden()).toBe(false);
    expect(scene['run'].start()).toBe(false);
  });
  it('real create binds disposal, timers and retry controls to the exact old authority on Scene reuse', () => {
    const { scene, shutdown, created } = fixture();
    const lifecycleCallbacks: Array<() => void> = [];
    const once = scene.events.once.bind(scene.events);
    vi.spyOn(scene.events, 'once').mockImplementation((key, fn, context) => {
      if (key === 'shutdown') lifecycleCallbacks.push(fn as () => void);
      return once(key, fn, context);
    });
    const restart = vi.fn();
    Object.assign(scene, {
      cameras: { main: { setBackgroundColor() {}, setBounds() {}, startFollow() {}, centerOn() {} } },
      input: {}, scene: { restart },
      time: { addEvent: (config: object) => ({ ...config, elapsed: 0 }) },
    });
    Object.assign(scene.add, { graphics });
    scene.create();
    const old = scene['run']!;
    const oldRandom = scene['runRandom']!;
    const oldStream = oldRandom.encounter;
    const oldApi = window.__NEBULA_DEV__!;
    expect([old.state, old.outcome]).toEqual(['RUNNING', null]);
    expect([scene['drone']!.x, scene['drone']!.y]).toEqual([scene['player']!.x + 110, scene['player']!.y]);
    playerHit(scene, 100);
    const retry = created.find(t => t.text === 'ПОВТОРИТЬ')!;
    const timers = [...scene['gameplayTimers']];
    const callbacks = timers.map(t => t.callback);
    shutdown();
    expect(() => oldStream.next()).toThrow('disposed RunRandom');
    expect(old.state).toBe('DISPOSED');
    expect(old.start()).toBe(false);
    expect(old.tryEnterTerminal('VICTORY')).toBe(false);
    scene.create();
    const fresh = scene['run']!;
    const freshRandom = scene['runRandom']!;
    expect(freshRandom).not.toBe(oldRandom);
    const encounter = vi.spyOn(freshRandom.encounter, 'next');
    const reward = vi.spyOn(freshRandom.reward, 'next');
    expect(fresh).not.toBe(old);
    expect([fresh.state, fresh.outcome]).toEqual(['RUNNING', null]);
    expect(window.__NEBULA_DEV__).not.toBe(oldApi);
    expect(oldApi.snapshot()).toBeNull();
    expect(scene['gameplayTimers']).toHaveLength(5);
    expect(scene['gameplayTimers'].every(t => !timers.includes(t))).toBe(true);
    for (const callback of lifecycleCallbacks.slice(0, 7)) callback();
    for (const callback of callbacks) callback();
    expect(encounter).not.toHaveBeenCalled();
    expect(reward).not.toHaveBeenCalled();
    expect(() => freshRandom.world.next()).not.toThrow();
    expect(scene['enemies']).toHaveLength(1);
    expect(scene['projectiles']).toHaveLength(0);
    expect(fresh.state).toBe('RUNNING');
    // Even if the new run dies, the old retained ПОВТОРИТЬ cannot restart it.
    playerHit(scene, 100);
    retry.emit('pointerdown');
    expect(restart).not.toHaveBeenCalled();
  });
});

function allowCreate(scene: GameplayScene) {
  Object.assign(scene, {
    cameras: { main: { setBackgroundColor() {}, setBounds() {}, startFollow() {}, centerOn() {} } },
    input: {}, time: { addEvent: (config: object) => ({ ...config, elapsed: 0 }) },
  });
  Object.assign(scene.add, { graphics });
}
const streams = ['encounter', 'reward', 'world', 'boss'] as const;
function spyStreams(scene: GameplayScene) {
  return streams.map(name => vi.spyOn(scene['runRandom']![name], 'next'));
}
function offer(scene: GameplayScene) {
  return scene['levelUpPresentation'].slice(1).map(text => text.text);
}

describe('Scene run-scoped randomness production boundaries', () => {
  it('creates crypto entropy only after successful RUNNING and five timers, before DEV publication', () => {
    const { scene } = fixture(); allowCreate(scene);
    const oldApi = window.__NEBULA_DEV__;
    const entropy = vi.spyOn(crypto, 'getRandomValues').mockImplementation(array => {
      expect(scene['run']!.state).toBe('RUNNING');
      expect(scene['gameplayTimers']).toHaveLength(5);
      expect(window.__NEBULA_DEV__).toBe(oldApi);
      (array as Uint32Array)[0] = 0xffffffff;
      return array;
    });
    try {
      scene.create();
      expect(entropy).toHaveBeenCalledTimes(1);
      expect(window.__NEBULA_DEV__!.snapshot()!.runSeed).toBe(0xffffffff);
    } finally { entropy.mockRestore(); }
  });
  it('throws without entropy/publication when lifecycle start unexpectedly fails', () => {
    const { scene, api } = fixture(); allowCreate(scene);
    const start = vi.spyOn(RunLifecycle.prototype, 'start').mockReturnValue(false);
    const entropy = vi.spyOn(crypto, 'getRandomValues');
    try {
      expect(() => scene.create()).toThrow('failed to enter RUNNING');
      expect(entropy).not.toHaveBeenCalled();
      expect(window.__NEBULA_DEV__).toBe(api);
    } finally { start.mockRestore(); entropy.mockRestore(); }
  });
  it('fixed seed pins all four side mappings and coordinates through actual spawnEnemy', () => {
    const a = fixture().scene, b = fixture().scene;
    for (let i = 0; i < 100; i++) a['runRandom']!.reward.next();
    const draw = vi.spyOn(a['runRandom']!.encounter, 'next');
    for (let i = 0; i < 4; i++) { a['spawnEnemy'](a['run']!); b['spawnEnemy'](b['run']!); }
    const placements = (s: GameplayScene) => s['enemies'].map(e => [e.visual.x, e.visual.y, e.archetype]);
    expect(placements(a)).toEqual([
      [2121.9062224030495, 762, 'chaser'], [3408, 1083.566029239446, 'chaser'],
      [1392, 1410.6810470949858, 'chaser'], [3342.1704053878784, 1938, 'shooter'],
    ]);
    expect(placements(a)).toEqual(placements(b));
    expect(draw).toHaveBeenCalledTimes(8);
    expect(a['successfulTimedSpawns']).toBe(4);
  });
  it.each(['cap', 'pause', 'PREPARING', 'TERMINAL', 'DISPOSED', 'no player', 'Warden'])('%s rejects timed spawn with zero draws/count mutation', guard => {
    const { scene } = fixture();
    if (guard === 'cap') for (let i = 0; i < 10; i++) scene['createEnemy'](100, 100, 'chaser', scene['run']!);
    if (guard === 'pause') scene['run']!.requestPause('REWARD');
    if (guard === 'PREPARING') scene['run'] = new RunLifecycle();
    if (guard === 'TERMINAL') scene['run']!.tryEnterTerminal('VICTORY');
    if (guard === 'DISPOSED') scene['run']!.dispose();
    if (guard === 'no player') scene['player'] = undefined;
    if (guard === 'Warden') scene['createEnemy'](100, 100, 'boss', scene['run']!);
    const count = scene['enemies'].length, draws = spyStreams(scene);
    scene['spawnEnemy'](scene['run']!);
    expect(scene['enemies']).toHaveLength(count);
    expect(scene['successfulTimedSpawns']).toBe(0);
    for (const draw of draws) expect(draw).not.toHaveBeenCalled();
  });
  it('close candidate falls back without a third draw, preserves normal/Warden margins and schedule30', () => {
    const { scene } = fixture();
    Object.assign(scene.cameras.main, { worldView: { left: 2380, right: 2420, top: 1330, bottom: 1370 } });
    const draw = vi.spyOn(scene['runRandom']!.encounter, 'next');
    const schedule = [];
    for (let i = 1; i <= 30; i++) {
      scene['enemies'] = []; scene['spawnEnemy'](scene['run']!);
      const e = scene['enemies'][0];
      schedule.push([e.archetype, e.isElite]);
      expect([e.visual.x, e.visual.y]).toEqual(i === 30 ? [40, 40] : [25, 25]);
    }
    expect(schedule.slice(0, 6).map(e => e[0])).toEqual(['chaser', 'chaser', 'chaser', 'shooter', 'chaser', 'tank']);
    expect([schedule[5], schedule[11], schedule[17], schedule[23], schedule[29]])
      .toEqual([['tank', false], ['tank', true], ['tank', false], ['tank', true], ['boss', false]]);
    expect(scene['successfulTimedSpawns']).toBe(30);
    expect(scene['bossSpawned']).toBe(true);
    expect(draw).toHaveBeenCalledTimes(60);
    scene['spawnEnemy'](scene['run']!); expect(draw).toHaveBeenCalledTimes(60);
  });
  it('clamps accepted normal and Warden placements at their existing arena margins', () => {
    const { scene } = fixture();
    Object.assign(scene.cameras.main, { worldView: { left: -200, right: -100, top: -200, bottom: -100 } });
    scene['spawnEnemy'](scene['run']!);
    expect([scene['enemies'][0].visual.x, scene['enemies'][0].visual.y]).toEqual([25, 25]);
    scene['enemies'] = []; scene['successfulTimedSpawns'] = 29; scene['spawnEnemy'](scene['run']!);
    expect([scene['enemies'][0].visual.x, scene['enemies'][0].visual.y]).toEqual([40, 40]);
  });
  it('pins consecutive real offers and isolates Reward from Encounter/snapshot/duplicate/accepted/stale callbacks', () => {
    const a = fixture(), b = fixture();
    for (let i = 0; i < 100; i++) a.scene['runRandom']!.encounter.next();
    const reward = vi.spyOn(a.scene['runRandom']!.reward, 'next');
    // GAME-055-v1 independently calculated seed0, accepting Slot1 between offers.
    const golden = [
      ['Радиус взрыва — ранг 1/2\n+30 пикс к радиусу взрыва', 'Бронепокрытие — ур. 1\n+1 к макс. здоровью / восстановить 1', 'Скорость снарядов дрона — ранг 1/2\n+200 пикс/с к скорости снарядов'],
      ['Мощность лазера — +1 к урону', 'Матрица репликации — ур. 1\n+1 пикс к радиусу снаряда дрона', 'Скорость лазера — +200 пикс/с'],
      ['Темп лазера — −50 мс (минимум 100 мс)', 'Поле сбора — ур. 1\n+40 пикс к радиусу притяжения опыта', 'Мощность дрона — ранг 1/2\n+1 к урону снаряда'],
    ];
    for (let i = 0; i < golden.length; i++) {
      expect(a.api.forceLevelUp()).toBe(true); expect(b.api.forceLevelUp()).toBe(true);
      expect(offer(a.scene)).toEqual(golden[i]); expect(offer(a.scene)).toEqual(offer(b.scene));
      const before = reward.mock.calls.length;
      for (let n = 0; n < 10; n++) a.api.snapshot();
      expect(a.api.forceLevelUp()).toBe(false); a.scene['enterLevelUpPause']();
      expect(offer(a.scene)).toEqual(golden[i]);
      const choice = a.scene['levelUpPresentation'][1];
      choice.emit('pointerdown'); b.scene['levelUpPresentation'][1].emit('pointerdown');
      a.scene['acceptLevelUpChoice'](choice, { kind: 'laser', upgrade: 'power' });
      expect(reward).toHaveBeenCalledTimes(before);
    }
    expect(reward).toHaveBeenCalledTimes(9);
  });
  it.each([false, true])('fully mastered fallback and eligible evolution=%s both consume3 draws', evolution => {
    const { scene, api } = fixture();
    setLaser(scene, { power: 2, fireRate: 2, speed: 2 });
    setMissile(scene);
    scene['droneRanks'] = { boltPower: 2, firingSystem: 2, boltPropulsion: 2 };
    if (evolution) scene['moduleLevels'].combat = 1;
    const draw = vi.spyOn(scene['runRandom']!.reward, 'next'); api.forceLevelUp();
    expect(draw).toHaveBeenCalledTimes(3);
    expect(new Set(offer(scene)).size).toBe(3);
    if (evolution) expect(offer(scene)[2]).toContain('ЭВОЛЮЦИЯ: Призменный лазер');
  });
  it('weighted development plus guaranteed evolution consumes3 draws', () => {
    const { scene, api } = fixture();
    setLaser(scene, { power: 2, fireRate: 2, speed: 2 }); scene['moduleLevels'].combat = 1;
    const draw = vi.spyOn(scene['runRandom']!.reward, 'next'); api.forceLevelUp();
    expect(draw).toHaveBeenCalledTimes(3); expect(offer(scene)[2]).toContain('ЭВОЛЮЦИЯ: Призменный лазер');
  });
  it('snapshot seed is detached/stable with zero draws; World/Boss stay dormant through actual Warden/Level-Up/terminal paths', () => {
    const { scene, api } = fixture(); const draws = spyStreams(scene);
    const snapshot = api.snapshot()!; expect(snapshot.runSeed).toBe(0); snapshot.runSeed = 123;
    expect(api.snapshot()!.runSeed).toBe(0);
    expect(Object.keys(api)).toEqual(['snapshot', 'forceLevelUp', 'spawnWarden', 'setWardenHealth', 'setGodMode']);
    expect(Object.values(api.snapshot()!).every(v => typeof v !== 'function')).toBe(true);
    api.spawnWarden(); api.setWardenHealth(30); scene['fireHostileProjectile']();
    playerHit(scene, 1); scene['updateHud']();
    for (const draw of draws) expect(draw).not.toHaveBeenCalled();
    api.forceLevelUp(); scene['levelUpPresentation'][1].emit('pointerdown');
    const before = draws.map(draw => draw.mock.calls.length);
    scene['applyEnemyHit']({ kind: 'ENEMY_DIRECT', direction: { x: 1200, y: 0 }, run: scene['run']!, target: scene['enemies'].find(e => e.archetype === 'boss')!,
      attack: createAttack({ kind: 'LASER', variant: 'BASE', snapshot: { damage: 30, speed: 1200, radius: 6, lifetime: 2000, impact: 200 } }) as LaserAttack });
    scene['enterRunVictory'](); scene['spawnEnemy'](scene['run']!); scene['enterLevelUpPause'](); api.snapshot();
    expect(draws.map(draw => draw.mock.calls.length)).toEqual(before);
    expect(draws[2]).not.toHaveBeenCalled(); expect(draws[3]).not.toHaveBeenCalled();
  });
});

function inputFixture() {
  const f = fixture();
  const keys = new Map<string, EventEmitter>();
  Object.assign(f.scene.input, { keyboard: { addKey: (key: string) => {
    if (!keys.has(key)) keys.set(key, new EventEmitter()); return keys.get(key);
  } } });
  f.scene['bindRunInput'](f.scene['run']!);
  const down = (key: string, repeat = false) => keys.get(key)!.emit('down', {}, { repeat });
  const up = (key: string) => keys.get(key)!.emit('up');
  const escape = () => { down('ESC'); f.scene.update(0, 0); up('ESC'); };
  return { ...f, keys, down, up, escape };
}

describe('CR-003 progression-triggered two-phase difficulty', () => {
  async function phaseFixture() {
    const f = fixture(), s = f.scene;
    allowCreate(s);
    Object.assign(s, { sys: { events: { once() {}, on() {}, off() {} } } });
    const { default: Clock } = await vi.importActual<{ default: typeof import('phaser').Time.Clock }>(
      '../../../node_modules/phaser/src/time/Clock.js');
    const clock = new Clock(s); Object.assign(s, { time: clock }); s.create(); clock.preUpdate();
    Object.assign(s.cameras.main, { worldView: { left: 1440, right: 3360, top: 810, bottom: 1890 } });
    s['enemies'] = [];
    return { ...f, clock, api: window.__NEBULA_DEV__! };
  }

  function finishLevelUp(s: GameplayScene) {
    expect(window.__NEBULA_DEV__!.forceLevelUp()).toBe(true);
    s['levelUpPresentation'][1].emit('pointerdown');
  }

  it('Level 1 ignores elapsed time; genuine Level 2 reward selection enables a single transition', async () => {
    const { scene: s, clock } = await phaseFixture();
    const timers = [...s['gameplayTimers']], timer = s['spawnTimer']!, draws = spyStreams(s);
    const reset = vi.spyOn(timer, 'reset'), callback = timer.callback, scope = timer.callbackScope, args = timer.args;
    expect(s['phase']).toBe(1); expect(s['phaseNotificationRemainingMs']).toBe(0);
    expect(s['phaseIndicator']!.text).toBe('ФАЗА 1'); expect(timer.delay).toBe(2000);
    s.update(0, 120_000);
    expect(s['phase']).toBe(1); expect(timer.delay).toBe(2000); expect(reset).not.toHaveBeenCalled();
    expect(s['playerProgression']!.snapshot().level).toBe(1);
    expect(window.__NEBULA_DEV__!.forceLevelUp()).toBe(true);
    expect(s['playerProgression']!.snapshot().level).toBe(GAMEPLAY_SETTINGS.phases.phaseTwoUnlockLevel);
    s.update(0, 120_000);
    expect(s['run']!.state).toBe('PAUSED'); expect(s['phase']).toBe(1);
    expect(reset).not.toHaveBeenCalled();
    s['levelUpPresentation'][1].emit('pointerdown');
    expect(s['run']!.state).toBe('RUNNING');
    timer.elapsed = 1900;
    s.update(0, 100);
    expect(s['phase']).toBe(2);
    expect(s['phaseNotificationRemainingMs']).toBe(GAMEPLAY_SETTINGS.phases.phaseTwoNotificationDurationMs);
    expect(timer.delay).toBe(GAMEPLAY_SETTINGS.phases.phaseTwoSpawnIntervalMs); expect(timer.elapsed).toBe(1140);
    expect(timer.callback).toBe(callback); expect(timer.callbackScope).toBe(scope); expect(timer.args).toBe(args);
    expect(s['phaseIndicator']!.text).toBe('ФАЗА 2'); expect(s['phaseNotification']!.visible).toBe(true);
    expect(s['successfulTimedSpawns']).toBe(0);
    expect(s['gameplayTimers']).toEqual(timers); expect(timers).toHaveLength(5);
    expect(draws.map(d => d.mock.calls.length)).toEqual([0, 3, 0, 0]);
    clock.update(0, 59); expect(s['successfulTimedSpawns']).toBe(0);
    clock.update(0, 1); expect(s['successfulTimedSpawns']).toBe(1);
    clock.update(0, 1199); expect(s['successfulTimedSpawns']).toBe(1);
    clock.update(0, 1); expect(s['successfulTimedSpawns']).toBe(2);
    s.update(0, 2999); expect(s['phaseNotification']!.visible).toBe(true);
    s.update(0, 1); s.update(0, 60_000);
    expect(reset).toHaveBeenCalledTimes(1); expect(timer.delay).toBe(1200);
    expect(s['phaseNotification']!.visible).toBe(false);
  });

  it.each(['MANUAL', 'REWARD', 'FOCUS_LOSS'] as const)('%s blocks transition and freezes notification until released', async reason => {
    const { scene: s, api } = await phaseFixture();
    if (reason !== 'REWARD') finishLevelUp(s);
    if (reason === 'MANUAL') s['handlePauseRequest']();
    else if (reason === 'REWARD') expect(api.forceLevelUp()).toBe(true);
    else s.game.events.emit('blur');
    expect(s['run']!.hasPauseReason(reason)).toBe(true);
    s.update(0, 120_000);
    expect(s['phaseNotificationRemainingMs']).toBe(0); expect(s['phase']).toBe(1); expect(s['spawnTimer']!.delay).toBe(2000);
    if (reason === 'REWARD') s['levelUpPresentation'][1].emit('pointerdown');
    else { s.game.events.emit('focus'); s['handlePauseRequest'](); }
    expect(s['run']!.state).toBe('RUNNING');
    s.update(0, 100); expect(s['phase']).toBe(2);
    s['handlePauseRequest'](); s.update(0, 5000);
    expect(s['phaseNotificationRemainingMs']).toBe(3000); expect(s['phaseNotification']!.visible).toBe(false);
    s['handlePauseRequest'](); expect(s['phaseNotification']!.visible).toBe(true);
  });

  it('reward selection with focus loss waits for the final pause release', async () => {
    const { scene: s, api } = await phaseFixture();
    api.forceLevelUp(); s.game.events.emit('hidden'); s['levelUpPresentation'][1].emit('pointerdown');
    s.update(0, 1000); expect(s['phaseNotificationRemainingMs']).toBe(0);
    s.game.events.emit('visible'); s.game.events.emit('focus'); s.update(0, 1000);
    expect(s['phaseNotificationRemainingMs']).toBe(0);
    s['handlePauseRequest'](); s.update(0, 100); expect(s['phase']).toBe(2);
  });

  it.each(['PREPARING', 'DEATH', 'VICTORY', 'DISPOSED'] as const)('%s cannot trigger Phase 2 even at Level 2', async state => {
    const { scene: s } = await phaseFixture(); s['playerProgression']!.creditXp(5);
    if (state === 'PREPARING') s['run'] = new RunLifecycle();
    else if (state === 'DISPOSED') s['run']!.dispose();
    else if (state === 'DEATH') s['enterPlayerDeath']();
    else { s.bossDefeated = true; s['enterRunVictory'](); }
    s.update(0, 120_000); expect(s['phaseNotificationRemainingMs']).toBe(0); expect(s['phase']).toBe(1);
  });

  it.each(['DEATH', 'VICTORY'] as const)('%s restart control restores Phase 1 and zero time', async outcome => {
    const f = await phaseFixture(), s = f.scene; finishLevelUp(s); s.update(0, 0);
    const oldRun = s['run']!, oldTimer = s['spawnTimer']!, oldCallback = oldTimer.callback!;
    Object.assign(s, { scene: { restart: () => { f.shutdown(); f.clock.removeAllEvents(); f.clock.preUpdate(); s.create(); f.clock.preUpdate(); } } });
    if (outcome === 'DEATH') s['enterPlayerDeath']();
    else { s.bossDefeated = true; s['enterRunVictory'](); }
    const control = f.created.findLast(t => t.text === (outcome === 'DEATH' ? 'ПОВТОРИТЬ' : 'НОВЫЙ ЗАБЕГ'))!;
    control.emit('pointerdown');
    expect(oldRun.state).toBe('DISPOSED'); expect(s['run']!.state).toBe('RUNNING');
    expect(s['phase']).toBe(1); expect(s['phaseNotificationRemainingMs']).toBe(0);
    expect(s['phaseIndicator']!.text).toBe('ФАЗА 1'); expect(s['phaseNotification']!.visible).toBe(false);
    expect(s['spawnTimer']).not.toBe(oldTimer); expect(s['spawnTimer']!.delay).toBe(2000);
    expect(s['gameplayTimers']).toHaveLength(5);
    oldCallback(); expect(s['successfulTimedSpawns']).toBe(0);
  });

  it.each([
    ['swarm', false, 240], ['chaser', false, 180], ['tank', false, 100], ['tank', true, 120],
    ['shooter', false, 140], ['boss', false, 70],
  ] as const)('existing and new %s Elite=%s move 1.25x without mutating snapshots', async (kind, elite, speed) => {
    const { scene: s } = await phaseFixture();
    const enemy = s['createEnemy'](4000, 1350, kind, s['run']!, elite)!, snapshot = enemy.spawnSnapshot;
    const original = structuredClone(snapshot);
    s.update(0, 100); expect(enemy.visual.x).toBeCloseTo(4000 - speed * 0.1);
    finishLevelUp(s); const x = enemy.visual.x;
    s.update(0, 100); expect(enemy.visual.x).toBeCloseTo(x - speed * 1.25 * 0.1);
    const fresh = s['createEnemy'](4000, 1350, kind, s['run']!, elite)!;
    s.update(0, 100); expect(fresh.visual.x).toBeCloseTo(4000 - speed * 1.25 * 0.1);
    expect(enemy.spawnSnapshot).toBe(snapshot); expect(snapshot).toEqual(original);
    expect(Object.isFrozen(snapshot.movement)).toBe(true);
    if (kind === 'boss') {
      enemy.health = 30; const x = enemy.visual.x; s.update(0, 100);
      expect(enemy.visual.x).toBeCloseTo(x - 100 * 1.25 * 0.1);
    }
  });

  it.each(['APPROACH', 'CHARGING'] as const)('Charger %s speeds up while phase durations and sweep contact stay correct', async phase => {
    const { scene: s } = await phaseFixture(); finishLevelUp(s); s.update(0, 0);
    const e = s['createEnemy'](phase === 'APPROACH' ? 4000 : 2450, 1350, 'charger', s['run']!)!;
    const movement = e.spawnSnapshot.movement;
    if (phase === 'CHARGING') e.charger!.state = { phase, remainingMs: 500, directionX: -1, directionY: 0 };
    s.update(0, 100);
    expect(e.visual.x).toBeCloseTo(phase === 'APPROACH' ? 3986.25 : 2368.75);
    expect(e.spawnSnapshot.movement).toBe(movement);
    if (phase === 'CHARGING') {
      expect(e.charger!.state.remainingMs).toBe(400); expect(s['playerHealth']).toBe(4);
      expect(s['player']!.x).toBe(2410.75);
    }
  });

  it('Phase 2 retains Shooter band stops, pursuit overshoot cap, contact separation and projectile collision', async () => {
    const { scene: s } = await phaseFixture(); finishLevelUp(s); s.update(0, 0);
    const shooter = s['createEnemy'](3000, 1350, 'shooter', s['run']!)!;
    s.update(0, 1000); expect(shooter.visual.x).toBe(2900);
    shooter.visual.x = 2700; s.update(0, 1000); expect(shooter.visual.x).toBe(2750);
    s['enemies'] = [];
    const chaser = s['createEnemy'](2450, 1350, 'chaser', s['run']!)!;
    s.update(0, 1000); expect(chaser.visual.x).toBe(2400);
    expect(s['player']!.x).toBe(2444); expect(s['playerHealth']).toBe(4);
    chaser.visual.x = 2800; playerShot(s, 2600); s['updateProjectiles'](200);
    expect(chaser.health).toBe(2); expect(s['projectiles']).toHaveLength(0);
  });
});

describe('GAME-044 authoritative pause and input production paths', () => {
  it('DEV diagnostics copy ordered reasons without leaking authority or consuming any stream', () => {
    const f = inputFixture(), s = f.scene, draws = spyStreams(s);
    s['run']!.requestPause('FOCUS_LOSS'); s['run']!.requestPause('MANUAL'); s['projectPause']();
    const snapshot = f.api.snapshot()!;
    expect(snapshot).toMatchObject({ runState: 'PAUSED', pauseReasons: ['MANUAL', 'FOCUS_LOSS'], runSeed: 0 });
    snapshot.pauseReasons.push('REWARD'); snapshot.pauseReasons.length = 0;
    expect(f.api.snapshot()!.pauseReasons).toEqual(['MANUAL', 'FOCUS_LOSS']);
    expect([f.api.forceLevelUp(), f.api.spawnWarden(), f.api.setGodMode(true), f.api.setWardenHealth(1)])
      .toEqual([false, false, false, false]);
    for (const draw of draws) expect(draw).not.toHaveBeenCalled();
  });
  it('REWARD is the sole freeze authority, Escape ignored, valid choice releases it once', () => {
    const f = inputFixture(), s = f.scene; const draws = spyStreams(s);
    f.down('W'); expect(f.api.forceLevelUp()).toBe(true);
    expect(f.api.snapshot()).toMatchObject({ runState: 'PAUSED', pauseReasons: ['REWARD'] });
    expect(s.time.paused).toBe(true); expect(s['pausePresentation']).toBeUndefined();
    const labels = offer(s), choice = s['levelUpPresentation'][1];
    f.escape(); expect(offer(s)).toEqual(labels); expect(s['run']!.pauseReasons).toEqual(['REWARD']);
    choice.emit('pointerdown');
    expect(s['run']!.state).toBe('RUNNING'); expect(s.time.paused).toBe(false);
    expect(s['inputAdapter']!.sample().moveY).toBe(0);
    s['acceptLevelUpChoice'](choice, { kind: 'laser', upgrade: 'power' });
    expect(s['missileRanks'].blastExpansion).toBe(1);
    expect(draws.map(draw => draw.mock.calls.length)).toEqual([0, 3, 0, 0]);
    s['isLevelUpPaused'] = true; expect(s['isSimulationPaused']()).toBe(false);
  });
  it('manual Escape freezes simulation and held movement until release/repress, no new RNG', () => {
    const f = inputFixture(), s = f.scene, draws = spyStreams(s);
    f.down('W'); s.update(0, 10); expect(s['player']!.y).toBe(1347);
    f.escape(); const y = s['player']!.y;
    expect(s['run']!.pauseReasons).toEqual(['MANUAL']); expect(s.time.paused).toBe(true);
    expect(s['pausePresentation']!.text).toBe('ПАУЗА\nEsc — продолжить');
    s.update(0, 1000); expect(s['player']!.y).toBe(y);
    f.escape(); expect(s['run']!.state).toBe('RUNNING'); expect(s['pausePresentation']).toBeUndefined();
    s.update(0, 100); expect(s['player']!.y).toBe(y);
    f.up('W'); f.down('W'); s.update(0, 100); expect(s['player']!.y).toBe(y - 30);
    for (const draw of draws) expect(draw).not.toHaveBeenCalled();
  });
  it('composes REWARD and focus; restoration never resumes and choice releases only REWARD', () => {
    const f = inputFixture(), s = f.scene;
    f.api.forceLevelUp(); s.game.events.emit('blur'); s.game.events.emit('hidden');
    expect(s['run']!.pauseReasons).toEqual(['REWARD', 'FOCUS_LOSS']);
    expect(s['pausePresentation']).toBeUndefined();
    s['levelUpPresentation'][1].emit('pointerdown');
    expect(s['run']!.pauseReasons).toEqual(['FOCUS_LOSS']); expect(s.time.paused).toBe(true);
    expect(s['pausePresentation']).toBeDefined();
    s.game.events.emit('visible'); f.escape(); expect(s['run']!.state).toBe('PAUSED');
    s.game.events.emit('focus'); expect(s['run']!.state).toBe('PAUSED');
    f.escape(); expect(s['run']!.state).toBe('RUNNING');
  });
  it('composes MANUAL/focus idempotently; both tracked and actual document focus/visibility required', () => {
    const f = inputFixture(), s = f.scene, draws = spyStreams(s);
    f.escape(); s.game.events.emit('hidden'); s.game.events.emit('blur'); s.game.events.emit('blur');
    expect(s['run']!.pauseReasons).toEqual(['MANUAL', 'FOCUS_LOSS']);
    s.game.events.emit('focus'); f.escape(); expect(s['run']!.state).toBe('PAUSED');
    s.game.events.emit('visible');
    vi.stubGlobal('document', { hasFocus: () => false, hidden: false }); f.escape();
    expect(s['run']!.state).toBe('PAUSED');
    vi.stubGlobal('document', { hasFocus: () => true, hidden: true }); f.escape();
    expect(s['run']!.state).toBe('PAUSED');
    vi.stubGlobal('document', { hasFocus: () => true, hidden: false }); f.escape();
    expect(s['run']!.pauseReasons).toEqual([]); expect(s['run']!.state).toBe('RUNNING');
    for (const draw of draws) expect(draw).not.toHaveBeenCalled();
  });
  it('Space intent preserves mid-Dash lock and freezes burst/cooldown; held Space never queues', () => {
    const f = inputFixture(), s = f.scene;
    f.down('D'); f.down('SPACE'); s.update(0, 50);
    expect([s['dashRemaining'], s['dashCooldownRemaining'], s['player']!.x]).toEqual([150, 2950, 2445]);
    f.escape(); s.update(0, 5000);
    expect([s['dashRemaining'], s['dashCooldownRemaining']]).toEqual([150, 2950]);
    f.escape(); s.update(0, 150);
    expect([s['dashRemaining'], s['dashCooldownRemaining'], s['player']!.x]).toEqual([0, 2800, 2580]);
    f.escape(); s.update(0, 5000); expect(s['dashCooldownRemaining']).toBe(2800); f.escape();
    s.update(0, 3000); expect(s['dashRemaining']).toBe(0);
    f.up('D'); f.down('D'); s.update(0, 10); expect(s['dashRemaining']).toBe(0);
    f.up('SPACE'); f.down('SPACE'); s.update(0, 10); expect(s['dashRemaining']).toBe(190);
  });
  it('freezes real gameplay helpers and all stream budgets during MANUAL pause', () => {
    const f = inputFixture(), s = f.scene;
    s['createEnemy'](2500, 1350, 'shooter', s['run']!); s['currentTarget'] = s['enemies'][0];
    s['fireLaser'](); s['fireMissile'](); s['fireHostileProjectile']();
    s['xpPickups'] = [{ run: s['run']!, visual: visual(2400, 1350), value: 5, speed: 0 } as unknown as (typeof s)['xpPickups'][number]];
    primeProtection(s, 200); f.escape();
    const state = () => JSON.stringify({ snapshot: f.api.snapshot(), drone: s['droneAngle'], dash: s['dashRemaining'],
      enemies: s['enemies'], projectiles: s['projectiles'], missiles: s['missiles'], pickups: s['xpPickups'] });
    const before = state(), draws = spyStreams(s);
    s.update(0, 5000); s['spawnEnemy'](s['run']!); s['fireLaser'](); s['fireMissile'](); s['fireDrone'](); s['fireHostileProjectile']();
    s['updateProjectiles'](5000); s['updateMissiles'](5000); s['updateXpPickups'](5000); s['updatePlayerContact'](); playerHit(s, 100);
    expect(state()).toBe(before); for (const draw of draws) expect(draw).not.toHaveBeenCalled();
  });
  it('actual installed Phaser Clock preserves five event phases and resumes same objects without catch-up', async () => {
    const { default: Clock } = await vi.importActual<{ default: typeof import('phaser').Time.Clock }>(
      '../../../node_modules/phaser/src/time/Clock.js');
    const { scene: s } = fixture(); allowCreate(s);
    Object.assign(s, { sys: { events: { once() {}, on() {} } } });
    const clock = new Clock(s); Object.assign(s, { time: clock }); s.create();
    clock.preUpdate(); clock.update(100, 100);
    const events = [...s['gameplayTimers']], phases = events.map(e => e.elapsed);
    const callbacks = events.map(e => vi.fn(e.callback as () => void)); callbacks.forEach((fn, i) => { events[i].callback = fn; });
    s['handlePauseRequest'](); s.game.events.emit('blur');
    for (let i = 0; i < 10; i++) clock.update(1000 + i * 1000, 1000);
    expect(events.map(e => e.elapsed)).toEqual(phases); expect(events).toEqual(s['gameplayTimers']);
    expect(callbacks.every(fn => fn.mock.calls.length === 0)).toBe(true);
    s['run']!.releasePause('MANUAL'); s['projectPause'](); expect(clock.paused).toBe(true);
    s.game.events.emit('focus'); s['handlePauseRequest'](); expect(clock.paused).toBe(false);
    clock.update(11001, 499); expect(callbacks.every(fn => fn.mock.calls.length === 0)).toBe(true);
    clock.update(11002, 1); expect(callbacks.map(fn => fn.mock.calls.length)).toEqual([0, 1, 0, 0, 0]);
    expect(s['gameplayTimers']).toEqual(events);
  });
  it.each(['laser', 'drone'] as const)('%s accepted cadence upgrade still resets the same TimerEvent while REWARD is owned', weapon => {
    const f = inputFixture(), s = f.scene;
    const event = { elapsed: 123, reset: vi.fn() };
    Object.assign(s, weapon === 'laser' ? { laserTimer: event } : { droneTimer: event });
    s['weaponFocus'] = weapon; aimChoice(s, weapon === 'laser' ? 'laser.fireRate' : 'drone.firingSystem', 0);
    f.api.forceLevelUp(); const choice = s['levelUpPresentation'][1];
    expect(s['levelUpChoices'].get(choice)).toBe(weapon === 'laser' ? 'laser.fireRate' : 'drone.firingSystem');
    choice.emit('pointerdown');
    expect(event.reset).toHaveBeenCalledWith(expect.objectContaining({ delay: weapon === 'laser' ? 550 : 1050, loop: true }));
    expect(weapon === 'laser' ? s['laserTimer'] : s['droneTimer']).toBe(event);
    expect(s['run']!.state).toBe('RUNNING');
  });
  it.each(['DEATH', 'VICTORY'] as const)('terminal %s from PAUSED clears input/reasons/UI and restores guarded Clock behavior', outcome => {
    const f = inputFixture(), s = f.scene; f.api.forceLevelUp();
    const choice = s['levelUpPresentation'][1]; s.game.events.emit('blur');
    if (outcome === 'VICTORY') { s['bossDefeated'] = true; s['enterRunVictory'](); } else s['enterPlayerDeath']();
    expect(s['run']!.outcome).toBe(outcome); expect(s['run']!.pauseReasons).toEqual([]);
    expect(s.time.paused).toBe(false); expect(s['pausePresentation']).toBeUndefined();
    s['acceptLevelUpChoice'](choice, { kind: 'laser', upgrade: 'power' }); f.escape(); s.game.events.emit('focus');
    expect(s['laserRanks'].power).toBe(0); expect(s['run']!.state).toBe('TERMINAL');
    expect(s['inputAdapter']!.sample()).toEqual({ moveX: 0, moveY: 0, activatePressed: false, pausePressed: false });
  });
  it('captured old input/focus/cleanup stays inert after paused Scene reuse and fresh Clock reset', () => {
    const f = inputFixture(), s = f.scene;
    allowCreate(s); s.create(); const oldRun = s['run']!, oldRandom = s['runRandom']!, oldInput = s['inputAdapter']!;
    const listeners = ['blur', 'hidden', 'focus', 'visible'].flatMap(event => s.game.events.listeners(event));
    s['handlePauseRequest'](); expect(s.time.paused).toBe(true); f.shutdown(); s.create();
    expect(s.time.paused).toBe(false); expect(s['inputAdapter']).not.toBe(oldInput);
    expect(oldRun.state).toBe('DISPOSED'); expect(() => oldRandom.encounter.next()).toThrow('disposed');
    const snapshot = window.__NEBULA_DEV__!.snapshot();
    s['handlePauseRequest'](); expect(s.time.paused).toBe(true);
    for (const listener of listeners) listener();
    expect(s.time.paused).toBe(true); oldInput.reset(); oldInput.dispose();
    expect(s['run']!.pauseReasons).toEqual(['MANUAL']);
    expect(snapshot).toMatchObject({ runState: 'RUNNING', pauseReasons: [], gameplayTimerCount: 5 });
  });
});

describe('GAME-045 concrete diagnostics production observations', () => {
  const shot = (s: GameplayScene) => playerShot(s);
  const boss = (s: GameplayScene) => { s['createEnemy'](2800, 1350, 'boss', s['run']!); const e = s['enemies'].at(-1)!; e.health = 1; return e; };
  it('actual create bootstraps the existing Chaser after start/seed, with detached diagnostics and five commands', () => {
    const { scene: s } = fixture(); allowCreate(s); s.create();
    const api = window.__NEBULA_DEV__!, d = api.snapshot()!.diagnostics;
    expect(d.runSeed).toBe(s['runRandom']!.runSeed);
    expect(d).toMatchObject({ gameplayElapsedMs: 0, aggregates: { spawned: { total: 1, byArchetype: { chaser: 1 } } },
      timeline: [{ type: 'RUN_STARTED', gameplayElapsedMs: 0 }], terminal: null });
    expect(Object.keys(api)).toEqual(['snapshot', 'forceLevelUp', 'spawnWarden', 'setWardenHealth', 'setGodMode']);
    d.aggregates.spawned.byArchetype.chaser = 99; d.timeline.length = 0;
    const draws = spyStreams(s); for (let i = 0; i < 5; i++) api.snapshot();
    expect(api.snapshot()!.diagnostics.aggregates.spawned.total).toBe(1);
    expect(api.snapshot()!.diagnostics.timeline).toHaveLength(1);
    for (const draw of draws) expect(draw).not.toHaveBeenCalled();
  });
  it('observes timed/Elite/Warden and deterministic DEV spawns but not blocked attempts', () => {
    const { scene: s } = fixture();
    for (let i = 0; i < 30; i++) { s['enemies'] = []; s['spawnEnemy'](s['run']!); }
    const d = s['runDiagnostics']!.snapshot();
    expect(d.aggregates.spawned).toEqual({ total: 30, byArchetype: { swarm: 0, chaser: 20, charger: 0, shooter: 5, tank: 4, boss: 1 }, eliteTanks: 2 });
    s['spawnEnemy'](s['run']!); expect(s['runDiagnostics']!.snapshot()).toEqual(d);
    expect(s['successfulTimedSpawns']).toBe(30);
    const other = fixture(); expect(other.api.spawnWarden()).toBe(true); expect(other.api.spawnWarden()).toBe(false);
    expect(other.api.snapshot()!.diagnostics.aggregates.spawned.byArchetype.boss).toBe(1);
    expect(other.scene['successfulTimedSpawns']).toBe(0);
    const capped = fixture(); for (let i = 0; i < 10; i++) capped.scene['createEnemy'](100, 100, 'chaser', capped.scene['run']!);
    const before = capped.api.snapshot()!.diagnostics; capped.scene['spawnEnemy'](capped.scene['run']!); expect(capped.api.snapshot()!.diagnostics).toEqual(before);
  });
  it('actual nonlethal/hit/removal records a kill/drop once, Boss aggregates precede atomic terminal', () => {
    const { scene: s, api } = fixture();
    s['createEnemy'](2800, 1350, 'chaser', s['run']!); const enemy = s['enemies'][0]; shot(s); s['updateProjectiles'](0);
    expect(api.snapshot()!.diagnostics.aggregates.killed.total).toBe(0);
    const completed = vi.spyOn(s as unknown as { killEnemy: typeof s['killEnemy'] }, 'killEnemy');
    const records = vi.spyOn(enemyDeath, 'createEnemyDeathRecord');
    enemy.health = 1; shot(s); s['updateProjectiles'](0);
    const context = completed.mock.calls[0] as unknown as Parameters<typeof s['killEnemy']>;
    expect(s['killEnemy'](...context)).toBeNull(); expect(records).toHaveBeenCalledTimes(1);
    completed.mockRestore(); records.mockRestore();
    expect(api.snapshot()!.diagnostics.aggregates).toMatchObject({ killed: { total: 1 }, xpDropped: 1 });
    const other = fixture(); const e = boss(other.scene); shot(other.scene); other.scene['updateProjectiles'](0);
    const d = other.api.snapshot()!.diagnostics;
    expect(e.visual.active).toBe(false); expect(d.aggregates).toMatchObject({ killed: { byArchetype: { boss: 1 } }, xpDropped: 10 });
    expect(d.timeline.at(-1)).toMatchObject({ type: 'TERMINAL', outcome: 'VICTORY' });
    expect(d.timeline.filter(row => row.type === 'TERMINAL')).toHaveLength(1);
  });
  it('counts accepted actual HP loss, ignores GodMode/protection/pause and clamps lethal damage before terminal', () => {
    const { scene: s, api } = fixture(); api.setGodMode(true); playerHit(s, 3); api.setGodMode(false);
    playerHit(s, 0.5); playerHit(s, 3);
    expect(api.snapshot()!.diagnostics.aggregates).toMatchObject({ acceptedDamagingHits: 1, hpLost: 0.5 });
    s['handlePauseRequest'](); playerHit(s, 100); s['canResume'] = () => true; s['handlePauseRequest']();
    s['playerDefense']!.advanceProtection(500); playerHit(s, 100);
    const d = api.snapshot()!.diagnostics;
    expect(d.aggregates).toMatchObject({ acceptedDamagingHits: 2, hpLost: 5 });
    expect(d.timeline.at(-1)).toMatchObject({ type: 'TERMINAL', outcome: 'DEATH' });
    s['enterRunVictory'](); s['enterPlayerDeath'](); expect(api.snapshot()!.diagnostics).toEqual(d);
  });
  it('common XP credit splits real pickup/DEV, preserving drop/credit/pause and no duplicate collection', () => {
    const { scene: s, api } = fixture(); s['createEnemy'](2400, 1350, 'tank', s['run']!, true);
    s['applyEnemyHit']({ kind: 'ENEMY_DIRECT', direction: { x: 1200, y: 0 }, run: s['run']!, target: s['enemies'][0],
      attack: createAttack({ kind: 'LASER', variant: 'BASE', snapshot: { damage: 18, speed: 1200, radius: 6, lifetime: 2000, impact: 200 } }) as LaserAttack });
    s['updateXpPickups'](0); s['updateXpPickups'](0);
    expect(api.snapshot()!.diagnostics.aggregates).toMatchObject({ xpDropped: 5, xpCollected: 5, xpCredited: 5, xpDevCredited: 0, levelsGained: 1, offersPresented: 1 });
    s['levelUpPresentation'][1].emit('pointerdown'); api.forceLevelUp();
    expect(api.snapshot()!.diagnostics.aggregates).toMatchObject({ xpCredited: 15, xpCollected: 5, xpDevCredited: 10, levelsGained: 2, offersPresented: 2 });
  });
  it('typed offer and once-only selected identity precede resume, stable/rejected reads add nothing', () => {
    const f = inputFixture(), s = f.scene; const draws = spyStreams(s); f.api.forceLevelUp();
    let d = f.api.snapshot()!.diagnostics;
    expect(d.timeline.map(row => row.type)).toEqual(['RUN_STARTED', 'PAUSE_ENTERED', 'LEVEL_UP_OFFERED']);
    expect(d.timeline.at(-1)).toMatchObject({ choices: ['missile.blastExpansion', 'passive.hull', 'drone.boltPropulsion'] });
    f.escape(); s.update(0, 3000); f.api.forceLevelUp(); expect(f.api.snapshot()!.diagnostics).toEqual(d);
    const choice = s['levelUpPresentation'][1]; choice.emit('pointerdown');
    s['acceptLevelUpChoice'](choice, { kind: 'laser', upgrade: 'power' });
    d = f.api.snapshot()!.diagnostics;
    expect(d.timeline.slice(-2).map(row => row.type)).toEqual(['LEVEL_UP_SELECTED', 'PAUSE_RESUMED']);
    expect(d.timeline.at(-2)).toMatchObject({ choice: 'missile.blastExpansion' }); expect(d.aggregates.choicesAccepted).toBe(1);
    expect(draws.map(draw => draw.mock.calls.length)).toEqual([0, 3, 0, 0]);
    f.api.forceLevelUp(); const before = f.api.snapshot()!.diagnostics;
    s['acceptLevelUpChoice'](choice, { kind: 'laser', upgrade: 'power' }); expect(f.api.snapshot()!.diagnostics).toEqual(before);
  });
  it('observes only high-level manual/focus/reward transitions, never reason composition or focus restoration', () => {
    const f = inputFixture(), s = f.scene; f.escape(); s.game.events.emit('blur'); s.game.events.emit('hidden'); s.game.events.emit('blur');
    let d = f.api.snapshot()!.diagnostics; expect(d.aggregates).toMatchObject({ pauseEntries: 1, pauseResumes: 0 });
    s.game.events.emit('focus'); s.game.events.emit('visible'); expect(f.api.snapshot()!.diagnostics).toEqual(d);
    f.escape(); expect(f.api.snapshot()!.diagnostics.aggregates.pauseResumes).toBe(1);
    f.api.forceLevelUp(); s.game.events.emit('blur'); s['levelUpPresentation'][1].emit('pointerdown');
    d = f.api.snapshot()!.diagnostics; expect(d.aggregates).toMatchObject({ pauseEntries: 2, pauseResumes: 1 });
    s.game.events.emit('focus'); f.escape(); expect(f.api.snapshot()!.diagnostics.aggregates.pauseResumes).toBe(2);
  });
  it('advances once after active guards, never pause/resume frames or terminal, no extra RNG', () => {
    const f = inputFixture(), s = f.scene; s.update(0, 16.5); s.update(0, 23.5);
    expect(f.api.snapshot()!.diagnostics.gameplayElapsedMs).toBe(40);
    f.escape(); s.update(0, 9999); f.escape(); expect(f.api.snapshot()!.diagnostics.gameplayElapsedMs).toBe(40);
    f.api.forceLevelUp(); s.update(0, 9999); s['levelUpPresentation'][1].emit('pointerdown');
    s.game.events.emit('blur'); s.update(0, 9999); s.game.events.emit('focus'); f.escape();
    s.update(0, 10); s['enterPlayerDeath'](); const d = f.api.snapshot()!.diagnostics; s.update(0, 9999);
    expect(d.terminal).toEqual({ outcome: 'DEATH', gameplayElapsedMs: 50 }); expect(f.api.snapshot()!.diagnostics).toEqual(d);
    const scenario = () => {
      const next = inputFixture(); next.scene.update(0, 16.5); next.scene['spawnEnemy'](next.scene['run']!); next.api.forceLevelUp();
      next.scene['levelUpPresentation'][1].emit('pointerdown'); next.scene.update(0, 23.5);
      return { snapshot: next.api.snapshot(), enemies: next.scene['enemies'].map(e => [e.archetype, e.visual.x, e.visual.y]) };
    };
    expect(scenario()).toEqual(scenario()); // Same seed, decisions and active deltas reproduce gameplay and observations.
  });
  it('terminal from REWARD pause emits no artificial resume, snapshots/recording do not consume RNG', () => {
    const { scene: s, api } = fixture(); api.forceLevelUp(); const draws = spyStreams(s);
    s['enterPlayerDeath'](); const d = api.snapshot()!.diagnostics;
    expect(d.aggregates.pauseResumes).toBe(0); expect(d.timeline.at(-1)?.type).toBe('TERMINAL');
    api.snapshot(); s['enterPlayerDeath'](); expect(api.snapshot()!.diagnostics).toEqual(d);
    for (const draw of draws) expect(draw).not.toHaveBeenCalled();
  });
  it('captured old cleanup/callbacks cannot record into fresh diagnostics on Scene reuse', () => {
    const { scene: s, shutdown } = fixture(); allowCreate(s);
    const cleanups: Array<() => void> = [], once = s.events.once.bind(s.events);
    vi.spyOn(s.events, 'once').mockImplementation((key, fn, ctx) => { if (key === 'shutdown') cleanups.push(fn as () => void); return once(key, fn, ctx); });
    s.create(); const old = s['runDiagnostics']!, callbacks = s['gameplayTimers'].map(t => t.callback);
    s['handlePauseRequest'](); shutdown(); s.create(); const fresh = s['runDiagnostics']!, before = fresh.snapshot();
    expect(fresh).not.toBe(old); expect(() => old.advance(1)).toThrow('disposed'); expect(() => old.snapshot()).toThrow('disposed');
    for (const callback of cleanups.slice(0, 7)) callback(); for (const callback of callbacks) callback();
    expect(fresh.snapshot()).toEqual(before); expect(before.aggregates.spawned.total).toBe(1); expect(before.timeline).toHaveLength(1);
  });
});


describe('GAME-046 PlayerBuild production consumers', () => {
  function armed() {
    const f = fixture(), s = f.scene;
    s['createEnemy'](3000, 1350, 'chaser', s['run']!); s['currentTarget'] = s['enemies'][0];
    Object.assign(s, { drone: visual(2510, 1350, 10) }); return f;
  }
  function passive(f: ReturnType<typeof fixture>, module: 'hull' | 'thruster' | 'collector' | 'combat' | 'spatial' | 'replication') {
    const draw = aimChoice(f.scene, `passive.${module}`, 1);
    expect(f.api.forceLevelUp()).toBe(true);
    const label = { hull: 'Бронепокрытие', thruster: 'Маневровый двигатель', collector: 'Поле сбора', combat: 'Боевой процессор', spatial: 'Усилитель взрыва', replication: 'Матрица репликации' }[module];
    const pick = f.scene['levelUpPresentation'].find(p => p.text.startsWith(label + ' — ур. '))!; expect(pick).toBeDefined(); pick.emit('pointerdown'); draw.mockRestore();
  }
  function weaponChoice(f: ReturnType<typeof fixture>, weapon: 'laser' | 'missile' | 'drone', cursor: number) {
    f.scene['weaponFocus'] = weapon;
    const tracks = weapon === 'laser' ? ['power', 'fireRate', 'speed'] : weapon === 'missile' ? ['warheadPower', 'propulsion', 'blastExpansion'] : ['boltPower', 'firingSystem', 'boltPropulsion'];
    const draw = aimChoice(f.scene, `${weapon}.${tracks[cursor]}` as RewardCandidateId, 0);
    expect(f.api.forceLevelUp()).toBe(true); f.scene['levelUpPresentation'][1].emit('pointerdown'); draw.mockRestore();
  }
  it('constructs Build during PREPARING before HP/HUD, then preserves diagnostic/seed/five-command boot', () => {
    const { scene: s } = fixture(); allowCreate(s);
    const hud = s['updateHud'].bind(s), preparing = vi.spyOn(s as unknown as { updateHud(): void }, 'updateHud').mockImplementation(() => {
      expect(s['run']!.state).toBe('PREPARING'); expect(s['playerBuild']!.getEffectiveStats().hull).toBe(5); hud();
    });
    s.create(); preparing.mockRestore(); const api = window.__NEBULA_DEV__!, before = api.snapshot()!, draws = spyStreams(s);
    expect(before.build).toEqual(new PlayerBuild().snapshot()); expect(s['playerHealth']).toBe(5); expect(s['movementSpeed']).toBe(300);
    expect(before.diagnostics).toMatchObject({ gameplayElapsedMs: 0, aggregates: { spawned: { total: 1 } }, timeline: [{ type: 'RUN_STARTED', gameplayElapsedMs: 0 }] });
    const copy = api.snapshot()!; copy.build.slots.combat.pop(); copy.build.runModifiers.percent.hull = 100; copy.build.effectiveStats.hull = 0;
    expect(api.snapshot()).toEqual(before); expect(Object.keys(api)).toHaveLength(5); expect(before.gameplayTimerCount).toBe(5);
    for (const draw of draws) expect(draw).not.toHaveBeenCalled();
  });
  it.each([5, 2, 2.5])('real Hull choice preserves max+1 / capped Heal1 from HP%s and repeats exactly', hp => {
    const f = fixture(), s = f.scene; s['playerDefense'] = new PlayerDefense(hp);
    passive(f, 'hull'); expect(s['playerMaxHealth']).toBe(6); expect(s['playerHealth']).toBe(hp + 1);
    for (let n = 2; n <= 20; n++) { passive(f, 'hull'); expect(s['playerMaxHealth']).toBe(5 + n); expect(s['playerHealth']).toBe(hp + n); }
    expect(s['moduleLevels'].hull).toBe(20); expect(s['playerBuild']!.getBaseStats().hull).toBe(5);
    expect(f.api.snapshot()!.diagnostics.timeline.slice(-2).map(r => r.type)).toEqual(['LEVEL_UP_SELECTED', 'PAUSE_RESUMED']);
  });
  it('shared Hull changes cap only on reduction, never heal on increase; failed choice mutation is atomic', () => {
    const f = fixture(), s = f.scene;
    s['applyBuildChange']({ kind: 'percent', stat: 'hull', delta: 1 }); expect(s['playerMaxHealth']).toBe(10); expect(s['playerHealth']).toBe(5);
    s['applyBuildChange']({ kind: 'percent', stat: 'hull', delta: -1.5 }); expect(s['playerMaxHealth']).toBe(2.5); expect(s['playerHealth']).toBe(2.5);
    passive(f, 'hull'); expect([s['playerMaxHealth'], s['playerHealth']]).toEqual([3.5, 3.5]);
    const draw = vi.spyOn(s['runRandom']!.reward, 'next').mockReturnValue(0);
    f.api.forceLevelUp(); draw.mockRestore();
    const pick = s['levelUpPresentation'][2], before = f.api.snapshot()!.diagnostics;
    expect(s['levelUpChoices'].get(pick)).toBe('passive.hull');
    s['playerBuild']!.dispose(); expect(() => s['acceptLevelUpChoice'](pick, { kind: 'passive', module: 'hull' })).toThrow('disposed PlayerBuild');
    expect(s['moduleLevels'].hull).toBe(1); expect(s['playerHealth']).toBe(3.5); expect(s['isLevelUpPaused']).toBe(true);
    expect(s['runDiagnostics']!.snapshot()).toEqual(before);
  });
  it('Thruster remains exact +30 with normal/diagonal/bounds and fixed Dash', () => {
    const f = inputFixture(), s = f.scene;
    for (let n = 1; n <= 20; n++) { passive(f, 'thruster'); expect(s['movementSpeed']).toBe(300 + n * 30); }
    f.down('W'); f.down('D'); const x = s['player']!.x, y = s['player']!.y; s.update(0, 100);
    expect(Math.hypot(s['player']!.x - x, s['player']!.y - y)).toBeCloseTo(90);
    s['applyBuildChange']({ kind: 'percent', stat: 'thrust', delta: 1 }); f.down('SPACE'); s.update(0, 200);
    expect(s['dashRemaining']).toBe(0); expect(s['dashCooldownRemaining']).toBe(2800);
    expect(Math.hypot(s['player']!.x - x, s['player']!.y - y)).toBeCloseTo(270);
    s['player']!.x = 4790; s['player']!.y = 10; s.update(0, 1000);
    expect(s['player']!.x).toBe(4779); expect(s['player']!.y).toBe(25);
  });
  it.each(['laser', 'missile', 'drone'] as const)('%s composes Reactor/Velocity/Scale with C once; Engineering is Drone-only', weapon => {
    const f = armed(), s = f.scene; passive(f, 'combat');
    for (const [key, delta] of [['reactorPower', 1], ['engineering', 2], ['projectileVelocity', 1], ['projectileScale', 1]] as const) s['applyBuildChange']({ kind: 'percent', stat: key, delta: delta });
    if (weapon === 'laser') s['fireLaser'](); else if (weapon === 'missile') s['fireMissile'](); else s['fireDrone']();
    const projectile = weapon === 'missile' ? s['missiles'][0] : s['projectiles'][0];
    expect(projectile.damage).toBe(weapon === 'drone' ? 7.5 : weapon === 'missile' ? 5 : 2.5);
    expect(projectile.radius).toBe(weapon === 'laser' ? 12 : weapon === 'missile' ? 16 : 10);
    expect(projectile.visual.radius).toBe(projectile.radius);
    if ('speed' in projectile) { expect(projectile.speed).toBe(900); expect(projectile.explosionRadius).toBe(120); }
    else expect(Math.hypot(projectile.velocityX, projectile.velocityY)).toBe(weapon === 'laser' ? 2400 : 1600);
  });
  it.each([0, 1, 2])('actual local Laser track%s preserves tuning under shared composition', cursor => {
    const f = armed(), s = f.scene; s['applyBuildChange']({ kind: 'percent', stat: 'reactorPower', delta: 1 }); s['applyBuildChange']({ kind: 'percent', stat: 'projectileVelocity', delta: 1 });
    weaponChoice(f, 'laser', cursor); s['fireLaser'](); const p = s['projectiles'][0];
    expect(s['laserRanks']).toEqual({ power: Number(cursor === 0), fireRate: Number(cursor === 1), speed: Number(cursor === 2) });
    expect(p.damage).toBe(cursor === 0 ? 4 : 2); expect(Math.hypot(p.velocityX, p.velocityY)).toBe(cursor === 2 ? 2800 : 2400);
    expect(s['laser'].fireInterval).toBe(cursor === 1 ? 550 : 600);
  });
  it.each([0, 1, 2])('actual local Missile track%s preserves local explosion and shared values', cursor => {
    const f = armed(), s = f.scene; weaponChoice(f, 'missile', cursor); s['fireMissile']();
    expect(s['missiles'][0]).toMatchObject({ damage: cursor === 0 ? 3 : 2, speed: cursor === 1 ? 525 : 450, explosionRadius: cursor === 2 ? 150 : 120, radius: 8 });
  });
  it.each([0, 1, 2])('actual local Drone track%s and Replication-before-Scale remain local', cursor => {
    const f = armed(), s = f.scene; passive(f, 'replication'); s['applyBuildChange']({ kind: 'percent', stat: 'projectileScale', delta: 1 });
    weaponChoice(f, 'drone', cursor); s['fireDrone'](); const p = s['projectiles'][0];
    expect(p.radius).toBe(12); expect(p.damage).toBe(cursor === 0 ? 2 : 1);
    expect(Math.hypot(p.velocityX, p.velocityY)).toBe(cursor === 2 ? 1000 : 800);
    expect(s['droneAttackValues'].fireInterval).toBe(cursor === 1 ? 1050 : 1200);
    expect(s['droneConfig']).toMatchObject({ orbitRadius: 110, angularSpeed: 2, visualRadius: 10 });
  });
  it('retains launched values and Missile radius in swept collision/world-exit after Build changes', () => {
    const f = armed(), s = f.scene; s['applyBuildChange']({ kind: 'percent', stat: 'projectileScale', delta: 1 }); s['fireLaser'](); s['fireMissile']();
    const p = s['projectiles'][0], m = s['missiles'][0], launch = { damage: m.damage, speed: m.speed, radius: m.radius, explosionRadius: m.explosionRadius };
    s['applyBuildChange']({ kind: 'percent', stat: 'projectileScale', delta: 1 }); s['applyBuildChange']({ kind: 'percent', stat: 'reactorPower', delta: 1 }); s['applyBuildChange']({ kind: 'percent', stat: 'projectileVelocity', delta: 1 });
    expect(p).toMatchObject({ damage: 1, radius: 12, velocityX: 1200 }); expect(m).toMatchObject(launch);
    s['fireMissile'](); expect(s['missiles']).toHaveLength(1); // Existing cap still applies.
    m.visual.x = -12; m.visual.y = 100; m.target = undefined; m.headingX = 0; m.headingY = 0; s['enemies'] = [];
    s['updateMissiles'](0); expect(s['missiles']).toHaveLength(1); // Stored16, not fixed8 or new24.
    m.visual.x = -17; s['updateMissiles'](0); expect(s['missiles']).toHaveLength(0);
    s['createEnemy'](3000, 1350, 'tank', s['run']!); s['fireMissile'](); const next = s['missiles'][0];
    next.visual.x = 3000 - 24 - next.radius; next.visual.y = 1350; s['updateMissiles'](0);
    expect(s['missiles']).toHaveLength(0); expect(s['enemies'][0].health).toBe(2); // Inclusive physical contact, damage4.
  });
  it('actual evolution pointer callbacks keep Prism/Cluster/Twin recipes, slots and attack behavior', () => {
    const f = armed(), s = f.scene;
    setLaser(s, { power: 2, fireRate: 2, speed: 2 }); s['moduleLevels'].combat = 1;
    f.api.forceLevelUp(); expect(offer(s)[2]).toContain('ЭВОЛЮЦИЯ: Призменный лазер'); s['levelUpPresentation'][3].emit('pointerdown'); s['fireLaser']();
    expect(s['projectiles']).toHaveLength(3); expect(s['projectiles'].every(p => p.damage === 3)).toBe(true);
    s['projectiles'] = []; setMissile(s); passive(f, 'spatial');
    f.api.forceLevelUp(); expect(offer(s)[2]).toContain('ЭВОЛЮЦИЯ: Кассетная ракета'); s['levelUpPresentation'][3].emit('pointerdown'); s['fireMissile']();
    expect(s['missiles'][0]).toMatchObject({ clusterEnabled: true, explosionRadius: 195 });
    s['droneRanks'] = { boltPower: 2, firingSystem: 2, boltPropulsion: 2 }; passive(f, 'replication');
    f.api.forceLevelUp(); expect(offer(s)[2]).toContain('ЭВОЛЮЦИЯ: Парные дроны'); s['levelUpPresentation'][3].emit('pointerdown'); s['fireDrone']();
    expect(s['projectiles']).toHaveLength(2); expect(s['twinDroneEvolved']).toBe(true);
    expect(f.api.snapshot()!.build.slots.combat).toEqual(['LASER', 'MISSILE', 'COMBAT_DRONE']);
  });
  it('unused Shield/Analyzer and outgoing-only Impact leave incoming behavior unchanged; no shared Scale leaks into hostile/XP/blast/orbit', () => {
    const f = armed(), s = f.scene, before = f.api.snapshot()!.diagnostics;
    s['applyBuildChange']({ kind: 'percent', stat: 'shieldSystems', delta: 1 }); s['applyBuildChange']({ kind: 'percent', stat: 'impact', delta: 1 }); s['playerBuild']!.addCombatAnalyzerLevels(3);
    s['applyBuildChange']({ kind: 'percent', stat: 'projectileScale', delta: 1 }); s['applyBuildChange']({ kind: 'percent', stat: 'projectileVelocity', delta: 1 });
    s['launchHostileProjectile']({ x: 100, y: 100 }, 1, 0, s['run']!); expect(s['projectiles'][0]).toMatchObject({ damage: 1, radius: 6, velocityX: 600 });
    expect(s['xpMagnetRadius']).toBe(180); expect(s['playerRadius']).toBe(20); expect(s['missileValues'].explosionRadius).toBe(120);
    expect(s['droneConfig']).toMatchObject({ orbitRadius: 110, visualRadius: 10 });
    expect(f.api.snapshot()!.diagnostics).toEqual(before);
  });
  it('rejects unsafe composed damage before any projectile or visual mutation', () => {
    const f = armed(), s = f.scene; passive(f, 'combat');
    expect(() => s['applyBuildChange']({ kind: 'percent', stat: 'reactorPower', delta: Number.MAX_SAFE_INTEGER - 1 })).toThrow(RangeError);
    // Inject a validated Build value directly to exercise launch defense as a separate boundary.
    s['playerBuild']!.applyStatPercent('reactorPower', Number.MAX_SAFE_INTEGER - 1);
    const circle = vi.spyOn(s.add, 'circle');
    for (const fire of [() => s['fireLaser'](), () => s['fireMissile'](), () => s['fireDrone']()]) {
      expect(fire).toThrow(RangeError); expect(s['projectiles']).toHaveLength(0); expect(s['missiles']).toHaveLength(0);
    }
    expect(circle).not.toHaveBeenCalled();
  });
  it('real installed Clock keeps five event identities; FC resets only three, local choices only their own', async () => {
    const { default: Clock } = await vi.importActual<{ default: typeof import('phaser').Time.Clock }>('../../../node_modules/phaser/src/time/Clock.js');
    const f = fixture(), s = f.scene; allowCreate(s); Object.assign(s, { sys: { events: { once() {}, on() {} } } });
    const clock = new Clock(s); Object.assign(s, { time: clock }); s.create(); clock.preUpdate(); clock.update(100, 100);
    const events = [...s['gameplayTimers']], callbacks = events.map(e => e.callback), resets = events.map(e => vi.spyOn(e, 'reset'));
    const current = { ...f, api: window.__NEBULA_DEV__! };
    expect(events.map(e => e.delay)).toEqual([2000, 600, 1800, 1200, 1500]);
    s['applyBuildChange']({ kind: 'percent', stat: 'fireControl', delta: 1 });
    expect(events.map(e => e.delay)).toEqual([2000, 300, 900, 600, 1500]);
    expect(events.map(e => e.elapsed)).toEqual([100, 0, 50, 0, 100]); expect(events.map(e => e.callback)).toEqual(callbacks);
    expect(s['projectiles']).toHaveLength(0); expect(s['missiles']).toHaveLength(0);
    s['applyBuildChange']({ kind: 'percent', stat: 'fireControl', delta: 0 }); s['applyBuildChange']({ kind: 'percent', stat: 'thrust', delta: 0.1 });
    expect(resets.map(e => e.mock.calls.length)).toEqual([0, 1, 1, 1, 0]);
    weaponChoice(current, 'laser', 1); expect(events[1].delay).toBe(275);
    weaponChoice(current, 'drone', 1); expect(events[3].delay).toBe(525);
    weaponChoice(current, 'missile', 0); expect(resets.map(e => e.mock.calls.length)).toEqual([0, 2, 1, 2, 0]);
    expect(s['gameplayTimers']).toEqual(events); s['handlePauseRequest'](); const phases = events.map(e => e.elapsed), build = s['playerBuild']!.snapshot();
    expect(s['applyBuildChange']({ kind: 'percent', stat: 'fireControl', delta: 1 })).toBe(false); clock.update(10000, 5000);
    expect(clock.paused).toBe(true); expect(events.map(e => e.elapsed)).toEqual(phases); expect(s['playerBuild']!.snapshot()).toEqual(build);
  });
  it('rejects paused/terminal/stale bridges and exact old cleanup cannot change fresh Build/HP/timers', () => {
    const f = fixture(), s = f.scene; allowCreate(s);
    const cleanups: Array<() => void> = [];
    const once = s.events.once.bind(s.events); vi.spyOn(s.events, 'once').mockImplementation((key, fn, ctx) => {
      if (key === 'shutdown') cleanups.push(fn as () => void); return once(key, fn, ctx);
    });
    s.create(); const old = s['playerBuild']!, oldRun = s['run']!;
    s['handlePauseRequest'](); expect(s['applyBuildChange']({ kind: 'percent', stat: 'hull', delta: 1 })).toBe(false);
    f.shutdown(); expect(() => old.snapshot()).toThrow('disposed'); expect(() => old.applyPrototypeHullPlating()).toThrow('disposed');
    s.create(); const fresh = s['playerBuild']!, before = window.__NEBULA_DEV__!.snapshot(), draws = spyStreams(s);
    expect(s['applyBuildChange']({ kind: 'percent', stat: 'hull', delta: 1 }, oldRun, old)).toBe(false);
    for (const cleanup of cleanups.slice(0, 7)) cleanup();
    expect(fresh).not.toBe(old); expect(fresh.getEffectiveStats()).toEqual(new PlayerBuild().getEffectiveStats());
    expect(window.__NEBULA_DEV__!.snapshot()).toEqual(before); for (const draw of draws) expect(draw).not.toHaveBeenCalled();
    s['enterPlayerDeath'](); expect(s['applyBuildChange']({ kind: 'percent', stat: 'hull', delta: 1 })).toBe(false);
  });
});

describe('GAME-047 canonical BuildSnapshot and production neutrality', () => {
  const choices = [
    { kind: 'laser', upgrade: 'power' }, { kind: 'laser', upgrade: 'fireRate' }, { kind: 'laser', upgrade: 'speed' },
    { kind: 'missile', upgrade: 'warheadPower' }, { kind: 'missile', upgrade: 'propulsion' }, { kind: 'missile', upgrade: 'blastExpansion' },
    { kind: 'drone', upgrade: 'boltPower' }, { kind: 'drone', upgrade: 'firingSystem' }, { kind: 'drone', upgrade: 'boltPropulsion' },
    { kind: 'passive', module: 'hull' }, { kind: 'passive', module: 'thruster' }, { kind: 'passive', module: 'collector' },
    { kind: 'passive', module: 'combat' }, { kind: 'passive', module: 'spatial' }, { kind: 'passive', module: 'replication' },
    { kind: 'prism' }, { kind: 'cluster' }, { kind: 'twin' },
  ] as const;
  const tagsAndIdentity = (b: BuildSnapshot) => ({ tags: b.tags, identity: b.identity });
  function dirty(build: PlayerBuild) {
    build.addTagPoints('TECHNOLOGY', 3); build.addTagPoints('DRONES', 3); build.addTagPoints('MOBILITY', 2);
  }
  it('boots the canonical detached BuildSnapshot with twelve zero Tags and the existing bootstrap', () => {
    const f = fixture(), s = f.scene; allowCreate(s); s.create();
    const api = window.__NEBULA_DEV__!, before = api.snapshot()!;
    expect(before.build).toEqual(new PlayerBuild().snapshot());
    expect(Object.keys(before.build.tags)).toEqual(TAG_IDS);
    expect(Object.values(before.build.tags)).toEqual(Array(12).fill(0));
    expect(before.build.identity).toEqual({ dominantTags: [], secondaryTags: [] });
    expect(before).toMatchObject({ playerHealth: 5, gameplayTimerCount: 5, runState: 'RUNNING' });
    expect(before.diagnostics).toMatchObject({ runSeed: before.runSeed, gameplayElapsedMs: 0,
      aggregates: { spawned: { total: 1 }, offersPresented: 0 }, timeline: [{ type: 'RUN_STARTED', gameplayElapsedMs: 0 }] });
    expect(Object.keys(api)).toEqual(['snapshot', 'forceLevelUp', 'spawnWarden', 'setWardenHealth', 'setGodMode']);
    expect('tags' in before).toBe(false); expect('buildIdentity' in before).toBe(false);
    dirty(s['playerBuild']!); const tagged = api.snapshot()!, copy = api.snapshot()!;
    copy.build.tags.DRONES = 99; copy.build.identity.dominantTags.pop(); copy.build.identity.secondaryTags.push('SURVIVAL');
    const diagnostics = s['runDiagnostics']!.snapshot(), draws = spyStreams(s);
    for (let i = 0; i < 5; i++) expect(api.snapshot()).toEqual(tagged);
    expect(s['runDiagnostics']!.snapshot()).toEqual(diagnostics);
    for (const draw of draws) expect(draw).not.toHaveBeenCalled();
    expect(JSON.parse(JSON.stringify(tagged))).toEqual(tagged);
  });
  for (const nonzero of [false, true]) {
    it.each(choices)('accepted $kind choice preserves Tags and exact offer RNG budget (nonzero=' + nonzero + ')', option => {
      const f = fixture(), s = f.scene, build = s['playerBuild']!;
      if (nonzero) dirty(build);
      let index = 1;
      if (option.kind === 'laser' || option.kind === 'missile' || option.kind === 'drone') {
        s['weaponFocus'] = option.kind;
      } else if (option.kind === 'passive') index = 2;
      else {
        index = 3;
        if (option.kind === 'prism') { setLaser(s, { power: 2, fireRate: 2, speed: 2 }); s['moduleLevels'].combat = 1; }
        if (option.kind === 'cluster') { setMissile(s); s['moduleLevels'].spatial = 1; }
        if (option.kind === 'twin') { s['droneRanks'] = { boltPower: 2, firingSystem: 2, boltPropulsion: 2 }; s['moduleLevels'].replication = 1; }
      }
      const before = tagsAndIdentity(build.snapshot()), draws = spyStreams(s);
      if (option.kind === 'passive') draws[1].mockReturnValueOnce(0).mockReturnValueOnce(targetRoll(s, `passive.${option.module}`, 1)).mockReturnValueOnce(0);
      else if ('upgrade' in option) draws[1].mockReturnValueOnce(targetRoll(s, choiceIdentity(option), 0)).mockReturnValueOnce(0).mockReturnValueOnce(0);
      expect(f.api.forceLevelUp()).toBe(true);
      expect(tagsAndIdentity(build.snapshot())).toEqual(before);
      expect(draws[1]).toHaveBeenCalledTimes(3);
      const pick = s['levelUpPresentation'][index];
      const diagnosticIdentity = option.kind === 'passive' ? 'passive.' + option.module
        : 'upgrade' in option ? option.kind + '.' + option.upgrade : option.kind;
      expect(f.api.snapshot()!.diagnostics.timeline.find(r => r.type === 'LEVEL_UP_OFFERED'))
        .toMatchObject({ choices: expect.arrayContaining([diagnosticIdentity]) });
      expect(f.api.forceLevelUp()).toBe(false); f.api.snapshot(); s['enterLevelUpPause']();
      pick.emit('pointerdown');
      expect(s['run']!.state).toBe('RUNNING');
      expect(f.api.snapshot()!.diagnostics.timeline.find(r => r.type === 'LEVEL_UP_SELECTED')).toMatchObject({ choice: diagnosticIdentity });
      s['acceptLevelUpChoice'](pick, option); pick.emit('pointerdown');
      expect(tagsAndIdentity(build.snapshot())).toEqual(before);
      expect(draws[1]).toHaveBeenCalledTimes(3);
      for (const i of [0, 2, 3]) expect(draws[i]).not.toHaveBeenCalled();
    });
  }
  it('nonzero contributions change no live HP/speed/launch values/diagnostics/streams or five Clock events', async () => {
    const { default: Clock } = await vi.importActual<{ default: typeof import('phaser').Time.Clock }>('../../../node_modules/phaser/src/time/Clock.js');
    const f = inputFixture(), s = f.scene; allowCreate(s); Object.assign(s, { sys: { events: { once() {}, on() {} } } });
    const clock = new Clock(s); Object.assign(s, { time: clock }); s.create(); clock.preUpdate(); clock.update(100, 100);
    const events = [...s['gameplayTimers']], phases = events.map(t => t.elapsed), delays = events.map(t => t.delay);
    const resets = events.map(t => vi.spyOn(t, 'reset')), diagnostics = s['runDiagnostics']!.snapshot(), draws = spyStreams(s);
    const build = s['playerBuild']!, stats = build.getEffectiveStats(); dirty(build);
    for (let i = 0; i < 5; i++) window.__NEBULA_DEV__!.snapshot();
    expect(build.getEffectiveStats()).toEqual(stats); expect(s['playerHealth']).toBe(5); expect(s['movementSpeed']).toBe(300);
    expect(s['gameplayTimers']).toEqual(events); expect(events.map(t => t.elapsed)).toEqual(phases);
    expect(events.map(t => t.delay)).toEqual(delays); for (const reset of resets) expect(reset).not.toHaveBeenCalled();
    expect(s['runDiagnostics']!.snapshot()).toEqual(diagnostics);
    s['currentTarget'] = s['enemies'][0]; s['fireLaser'](); s['fireMissile'](); s['fireDrone']();
    expect(s['projectiles'][0]).toMatchObject({ damage: 1, radius: 6, velocityX: 1200 });
    expect(s['missiles'][0]).toMatchObject({ damage: 2, radius: 8, speed: 450, explosionRadius: 120 });
    expect(s['projectiles'][1]).toMatchObject({ damage: 1, radius: 5, velocityX: 800 });
    const tags = tagsAndIdentity(build.snapshot()); s['handlePauseRequest']();
    clock.update(5000, 4900); expect(events.map(t => t.elapsed)).toEqual(phases);
    s.game.events.emit('blur'); s.game.events.emit('focus'); s['handlePauseRequest']();
    expect(tagsAndIdentity(build.snapshot())).toEqual(tags);
    for (const reset of resets) expect(reset).not.toHaveBeenCalled();
    for (const draw of draws) expect(draw).not.toHaveBeenCalled();
  });
  it('exact old disposal and saved reward/timer/focus callbacks cannot reach fresh Tags', () => {
    const f = fixture(), s = f.scene; allowCreate(s);
    const cleanups: Array<() => void> = [];
    const once = s.events.once.bind(s.events);
    vi.spyOn(s.events, 'once').mockImplementation((key, fn, ctx) => { if (key === 'shutdown') cleanups.push(fn as () => void); return once(key, fn, ctx); });
    s.create(); const oldCleanup = [...cleanups];
    const old = s['playerBuild']!, oldRun = s['run']!, oldApi = window.__NEBULA_DEV__!; dirty(old);
    const timers = s['gameplayTimers'].map(t => t.callback!);
    const focus = ['blur', 'hidden', 'focus', 'visible'].flatMap(event => s.game.events.listeners(event)) as Array<() => void>;
    oldApi.forceLevelUp(); const choice = s['levelUpPresentation'][1];
    f.shutdown(); s.create(); const fresh = s['playerBuild']!, before = window.__NEBULA_DEV__!.snapshot();
    expect(fresh).not.toBe(old); expect(fresh.snapshot()).toEqual(new PlayerBuild().snapshot());
    for (const op of [() => old.addTagPoints('DRONES', 0), () => old.addTagPoints('DRONES', 1), () => old.snapshot()]) expect(op).toThrow('disposed PlayerBuild');
    for (const callback of timers) callback();
    for (const callback of oldCleanup) callback();
    for (const callback of focus) callback();
    s['acceptLevelUpChoice'](choice, { kind: 'laser', upgrade: 'power' }, oldRun);
    expect(oldApi.snapshot()).toBeNull(); expect(oldApi.forceLevelUp()).toBe(false);
    expect(window.__NEBULA_DEV__!.snapshot()).toEqual(before);
  });
});

describe('GAME-048 defense production boundary', () => {
  it('constructs Defense before PREPARING HUD, owns no writable Scene health/protection and publishes derived scalars', () => {
    const f = fixture(), s = f.scene; allowCreate(s);
    const hud = s['updateHud'].bind(s);
    vi.spyOn(s as unknown as { updateHud(): void }, 'updateHud').mockImplementation(() => {
      expect(s['run']!.state).toBe('PREPARING');
      expect(s['playerDefense']!.snapshot()).toEqual({ currentHull: 5, currentShield: 0, protectionRemaining: 0 }); hud();
    });
    s.create(); const api = window.__NEBULA_DEV__!, state = api.snapshot()!;
    expect(state).toMatchObject({ playerHealth: 5, playerShield: 0, protectionRemaining: 0, gameplayTimerCount: 5 });
    expect(state.build).toEqual(new PlayerBuild().snapshot()); expect(state.build.effectiveStats.hull).toBe(5);
    expect(state.diagnostics.aggregates.spawned.total).toBe(1); expect(Object.keys(api)).toHaveLength(5);
    for (const key of ['playerHealth', 'playerDamageProtectionRemaining']) {
      expect(Object.hasOwn(s, key)).toBe(false);
      const descriptor = Object.getOwnPropertyDescriptor(GameplayScene.prototype, key)!;
      expect(descriptor.get).toBeTypeOf('function'); expect(descriptor.set).toBeUndefined();
    }
    expect('playerDamageProtectionDuration' in s).toBe(false);
    const copy = api.snapshot()!; copy.playerShield = 999; copy.playerHealth = 999; copy.protectionRemaining = 999;
    expect(api.snapshot()).toEqual(state); expect(s['hud']!.text).toContain('Здоровье: 5/5');
  });
  it.each([[3, 2, 1, 5, 0], [3, 3, 0, 5, 0], [3, 5, 0, 3, 2],
    [0.5, 0.75, 0, 4.75, 0.25], [2, 100, 0, 0, 5]])(
    'Scene Shield%s incoming%s consumes through real hostile collision with Hull-only diagnostics', (shield, amount, nextShield, hull, lost) => {
      const f = fixture(), s = f.scene; s['playerDefense']!.setCurrentShield(shield);
      s['applyBuildChange']({ kind: 'percent', stat: 'shieldSystems', delta: 10 });
      s['launchHostileProjectile'](s['player']!, 1, 0, s['run']!);
      const flight = s['projectiles'][0];
      s['projectiles'][0] = { ...flight, attack: createAttack({ kind: 'HOSTILE_PROJECTILE',
        snapshot: { ...flight.attack.snapshot, damage: amount } }) as HostileAttack };
      s['updateProjectiles'](0);
      expect(s['projectiles']).toHaveLength(0);
      expect(f.api.snapshot()).toMatchObject({ playerHealth: hull, playerShield: nextShield, protectionRemaining: 500 });
      expect(f.api.snapshot()!.diagnostics.aggregates).toMatchObject({ hpLost: lost, acceptedDamagingHits: lost > 0 ? 1 : 0 });
      expect(s['player']!.alpha).toBe(hull === 0 ? 0.25 : 0.5);
      if (hull === 0) {
        expect(s['run']!.outcome).toBe('DEATH'); expect(f.api.snapshot()!.diagnostics.timeline.at(-1)).toMatchObject({ type: 'TERMINAL', outcome: 'DEATH' });
        const before = s['playerDefense']!.snapshot(); s['updatePlayerProtection'](1000);
        s['acceptLevelUpChoice'](visual() as unknown as Phaser.GameObjects.Text, { kind: 'passive', module: 'hull' });
        expect(s['playerDefense']!.snapshot()).toEqual(before); expect(s['player']!.alpha).toBe(0.25);
      }
    });
  it('God and protection reject without extending, but collisions consume shots and expiry allows the next hit', () => {
    const f = fixture(), s = f.scene, d = s['playerDefense']!, incoming = vi.spyOn(d, 'applyIncomingDamage');
    d.setCurrentShield(2); f.api.setGodMode(true);
    s['launchHostileProjectile'](s['player']!, 1, 0, s['run']!); s['updateProjectiles'](0);
    expect(incoming).not.toHaveBeenCalled(); expect(s['projectiles']).toHaveLength(0);
    expect(d.snapshot()).toEqual({ currentHull: 5, currentShield: 2, protectionRemaining: 0 });
    f.api.setGodMode(false); playerHit(s, 1); s['updatePlayerProtection'](200);
    const protectedState = d.snapshot(); s['launchHostileProjectile'](s['player']!, 1, 0, s['run']!); s['updateProjectiles'](0);
    expect(s['projectiles']).toHaveLength(0); expect(d.snapshot()).toEqual(protectedState);
    s['updatePlayerProtection'](300); expect(s['player']!.alpha).toBe(1);
    playerHit(s, 2); expect(d.snapshot()).toEqual({ currentHull: 4, currentShield: 0, protectionRemaining: 500 });
  });
  const contacts = [
    ['chaser', false, 2400, 1350, 2430, 1350, 2444, 1350, true],
    ['chaser', false, 2400, 1350, 2370, 1350, 2356, 1350, true],
    ['tank', true, 2400, 1350, 2430, 1350, 2444, 1350, true],
    ['boss', false, 2400, 1350, 2430, 1350, 2460, 1350, true],
    ['chaser', false, 2400, 1350, 2418, 1374, 2426.4, 1385.2, true],
    ['chaser', false, 2400, 1350, 2400, 1350, 2444, 1350, true],
    ['boss', false, 2400, 1350, 2400, 1350, 2460, 1350, true],
    ['chaser', false, 2400, 1350, 2444, 1350, 2444, 1350, true],
    ['chaser', false, 2400, 1350, 2444.01, 1350, 2444.01, 1350, false],
    ['chaser', false, 4770, 1350, 4779, 1350, 4779, 1350, true],
    ['chaser', false, 40, 40, 21, 25, 21, 25, true],
  ] as const;
  it.each(contacts)('exact contact %s/elite%s enemy(%s,%s) player(%s,%s)', (kind, elite, ex, ey, px, py, x, y, touches) => {
    const f = fixture(), s = f.scene, draws = spyStreams(s);
    s['applyBuildChange']({ kind: 'percent', stat: 'impact', delta: 10 });
    s['player']!.x = px; s['player']!.y = py; s['createEnemy'](ex, ey, kind, s['run']!, elite);
    const routing = vi.spyOn(s as unknown as { damagePlayer(hit: unknown): unknown }, 'damagePlayer');
    s['updatePlayerContact'](); expect(s['player']!.x).toBeCloseTo(x); expect(s['player']!.y).toBeCloseTo(y);
    expect(routing).toHaveBeenCalledTimes(touches ? 1 : 0);
    expect(s['playerHealth']).toBe(touches ? (elite || kind === 'boss' ? 3 : 4) : 5);
    expect([s['enemies'][0].visual.x, s['enemies'][0].visual.y]).toEqual([ex, ey]);
    for (const draw of draws) expect(draw).not.toHaveBeenCalled();
  });
  it.each(['GOD', 'PROTECTED', 'PAUSED', 'TERMINAL'] as const)('%s contact keeps the exact damage/geometry distinction', state => {
    const f = fixture(), s = f.scene; s['createEnemy'](2400, 1350, 'chaser', s['run']!);
    if (state === 'GOD') f.api.setGodMode(true);
    if (state === 'PROTECTED') primeProtection(s, 200);
    if (state === 'PAUSED') s['handlePauseRequest']();
    if (state === 'TERMINAL') s['enterPlayerDeath']();
    const before = s['playerDefense']!.snapshot(); s['updatePlayerContact'](); s['updatePlayerProtection'](0);
    expect(s['player']!.x).toBe(state === 'GOD' || state === 'PROTECTED' ? 2444 : 2400);
    expect(s['playerDefense']!.snapshot()).toEqual(before);
  });
  it('processes first collection contact only and defense work adds no Build/Tags/RNG/diagnostic/timer effects', () => {
    const f = fixture(), s = f.scene; f.api.setGodMode(true);
    s['createEnemy'](2400, 1350, 'chaser', s['run']!); s['createEnemy'](2430, 1350, 'boss', s['run']!);
    const before = f.api.snapshot()!, build = s['playerBuild']!.snapshot(), draws = spyStreams(s), timers = [...s['gameplayTimers']];
    s['updatePlayerContact'](); expect(s['player']!.x).toBe(2444);
    s['playerDefense']!.setCurrentShield(2); s['playerDefense']!.healHull(0, 5); s['playerDefense']!.reconcileMaxHull(5);
    f.api.snapshot(); expect(s['playerBuild']!.snapshot()).toEqual(build);
    expect(f.api.snapshot()!.diagnostics).toEqual(before.diagnostics); expect(s['gameplayTimers']).toEqual(timers);
    for (const draw of draws) expect(draw).not.toHaveBeenCalled();
  });
  it('captures exact Defense disposal and rejects stale damage/reward/cleanup against a fresh create', () => {
    const f = fixture(), s = f.scene; allowCreate(s); const cleanups: Array<() => void> = [];
    const once = s.events.once.bind(s.events);
    vi.spyOn(s.events, 'once').mockImplementation((key, fn, ctx) => { if (key === 'shutdown') cleanups.push(fn as () => void); return once(key, fn, ctx); });
    s.create(); const old = s['playerDefense']!, oldRun = s['run']!, oldCleanup = [...cleanups];
    old.setCurrentShield(2); playerHit(s, 3); window.__NEBULA_DEV__!.forceLevelUp();
    const choice = s['levelUpPresentation'][2]; f.shutdown(); s.create();
    const fresh = s['playerDefense']!, before = window.__NEBULA_DEV__!.snapshot();
    expect(fresh).not.toBe(old); expect(() => old.snapshot()).toThrow('disposed PlayerDefense');
    expect(() => old.healHull(0, 5)).toThrow('disposed PlayerDefense');
    playerHit(s, 100, oldRun, old); s['acceptLevelUpChoice'](choice, { kind: 'passive', module: 'hull' }, oldRun);
    for (const callback of oldCleanup) callback();
    expect(window.__NEBULA_DEV__!.snapshot()).toEqual(before);
    expect(fresh.snapshot()).toEqual({ currentHull: 5, currentShield: 0, protectionRemaining: 0 });
  });
});


describe('GAME-049 concrete Attack/Hit integration', () => {
  function armed() {
    const f = fixture(), s = f.scene;
    s['createEnemy'](2800, 1350, 'tank', s['run']!); s['currentTarget'] = s['enemies'][0];
    Object.assign(s, { drone: visual(2510, 1350) });
    return f;
  }
  it.each([false, true])('Laser/Prism evolved%s shares one frozen Attack with independent nonpiercing hits', evolved => {
    const { scene: s } = armed(); if (evolved) { setLaser(s, undefined, true); s['enemies'][0].health = 18; } s['fireLaser']();
    const shots = [...s['projectiles']], attack = shots[0].attack;
    expect(shots).toHaveLength(evolved ? 3 : 1);
    expect(shots.every(p => p.attack === attack && p.run === s['run'])).toBe(true);
    expect(attack).toMatchObject({ kind: 'LASER', variant: evolved ? 'PRISM' : 'BASE' });
    expect(Object.isFrozen(attack.snapshot) && Object.isFrozen(attack)).toBe(true);
    for (const p of shots) { p.visual.x = 2800; p.visual.y = 1350; }
    s['updateProjectiles'](0); expect(s['enemies'][0].health).toBe(evolved ? 9 : 5);
    expect(s['projectiles']).toHaveLength(0);
  });
  it.each([false, true])('Drone/Twin evolved%s uses independent origin Attack/nearest target and full damage', evolved => {
    const { scene: s } = armed(); s['twinDroneEvolved'] = evolved;
    if (evolved) Object.assign(s, { twinDrone: visual(2290, 1350) });
    s['fireDrone'](); const shots = s['projectiles'];
    expect(shots).toHaveLength(evolved ? 2 : 1); expect(shots[0].attack).toMatchObject({ kind: 'COMBAT_DRONE', variant: evolved ? 'TWIN' : 'BASE' });
    if (evolved) { expect(shots[0].attack).not.toBe(shots[1].attack); expect(shots[0].visual.x).not.toBe(shots[1].visual.x); }
    for (const p of shots) { p.visual.x = 2800; p.visual.y = 1350; }
    s['updateProjectiles'](0); expect(s['enemies'][0].health).toBe(evolved ? 4 : 5);
  });
  it('captures all shared/local values and evolution without writable parallel launch truth', () => {
    const { scene: s } = armed(); s['fireLaser'](); s['fireDrone'](); s['fireMissile']();
    const p = s['projectiles'][0], d = s['projectiles'][1], m = s['missiles'][0];
    const before = [p, d, m].map(f => JSON.stringify(f.attack));
    for (const [stat, delta] of [['reactorPower', 1], ['engineering', 2], ['projectileVelocity', 1], ['projectileScale', 1]] as const) {
      s['applyBuildChange']({ kind: 'percent', stat, delta });
    }
    s['globalDamageMultiplier'] = 1.25; s['playerBuild']!.applyLaserChoice({ kind: 'laser', upgrade: 'power' }, 0); s['droneAttackValues'].damage = 2;
    setMissile(s, { warheadPower: 1, propulsion: 1, blastExpansion: 1 });
    s['moduleLevels'].spatial = 2; s['moduleLevels'].replication = 2; setMissile(s, undefined, true); setLaser(s, undefined, true);
    expect([p, d, m].map(f => JSON.stringify(f.attack))).toEqual(before);
    expect(() => { (p as unknown as { damage: number }).damage = 999; }).toThrow(TypeError);
    expect(() => { (m as unknown as { radius: number }).radius = 999; }).toThrow(TypeError);
    s['fireLaser'](); s['fireDrone'](); s['missiles'] = []; s['fireMissile']();
    expect(s['projectiles'][2].attack).toMatchObject({ kind: 'LASER', variant: 'PRISM', snapshot: { damage: 7.5, speed: 3200, radius: 12 } });
    expect(s['projectiles'].at(-1)!.attack).toMatchObject({ kind: 'COMBAT_DRONE', snapshot: { damage: 15, speed: 1600, radius: 14 } });
    expect(s['missiles'][0].attack).toMatchObject({ kind: 'MISSILE', variant: 'CLUSTER', snapshot: { damage: 10, speed: 1200, radius: 16, explosionRadius: 210 } });
    expect(m.attack).toMatchObject({ variant: 'BASE', snapshot: { damage: 2, speed: 450, radius: 8, explosionRadius: 120 } });
  });
  it('returns calculated versus actual loss, negative overkill HP and exactly one kill/XP', () => {
    const { scene: s } = armed(), enemy = s['enemies'][0]; enemy.health = 3;
    const p = playerShot(s, 2800, 10), hit = { kind: 'ENEMY_DIRECT' as const, direction: { x: 1200, y: 0 }, run: s['run']!, target: enemy, attack: p.attack as LaserAttack };
    expect(s['applyEnemyHit'](hit)).toEqual({ target: 'ENEMY', calculatedDamage: 10, healthAfter: -7, hpLost: 3, healthDepleted: true });
    expect(enemy.health).toBe(-7); expect(s['xpPickups']).toHaveLength(1); expect(s['applyEnemyHit'](hit)).toBeNull();
    expect(s['xpPickups']).toHaveLength(1);
  });
  it('rejects dead/missing/stale/paused targets before HP, fresh collection or Defense mutation', () => {
    const { scene: s } = armed(), enemy = s['enemies'][0], run = s['run']!, defense = s['playerDefense']!;
    const p = playerShot(s), hit = { kind: 'ENEMY_DIRECT' as const, direction: { x: 1200, y: 0 }, run, target: enemy, attack: p.attack as LaserAttack };
    enemy.health = 0; expect(s['applyEnemyHit'](hit)).toBeNull(); enemy.health = 6;
    s['enemies'] = []; expect(s['applyEnemyHit'](hit)).toBeNull(); s['enemies'] = [enemy];
    run.requestPause('MANUAL'); expect(s['applyEnemyHit'](hit)).toBeNull(); run.releasePause('MANUAL');
    const fresh = new RunLifecycle(); fresh.start(); s['run'] = fresh; s['playerDefense'] = new PlayerDefense(5);
    const before = s['playerDefense'].snapshot();
    expect(s['applyEnemyHit'](hit)).toBeNull(); expect(playerHit(s, 100, run, defense)).toBeNull();
    s['updateProjectiles'](1000); s['launchPlayerProjectile'](s['player']!, { x: 1, y: 0 }, hit.attack, run, 0xffffff);
    s['launchHostileProjectile'](s['player']!, 1, 0, run);
    expect(enemy.health).toBe(6); expect(s['projectiles']).toHaveLength(1); expect(p.remainingLifetime).toBe(2000);
    expect(s['playerDefense'].snapshot()).toEqual(before);
  });
  it.each([false, true])('swept straight hit selects earliest and collection tie first (tie%s)', tie => {
    const { scene: s } = fixture(); s['createEnemy'](3000, 1350, 'tank', s['run']!); s['createEnemy'](tie ? 3000 : 2900, 1350, 'tank', s['run']!);
    playerShot(s, 2800); s['updateProjectiles'](500);
    expect(s['enemies'].map(e => e.health)).toEqual(tie ? [5, 6] : [6, 5]); expect(s['projectiles']).toHaveLength(0);
  });
  it('Cluster snapshots primary then the survivor union, allowing one of each without overlap duplicates', () => {
    const { scene: s } = armed(); s['enemies'][0].visual.x = 2497.5; s['enemies'][0].health = 12; setMissile(s, undefined, true); s['fireMissile']();
    const m = s['missiles'][0]; s['explodeMissile'](2400, 1350, m); s['explodeClusterSatellites'](2400, 1350, m);
    expect(s['enemies'][0].health).toBe(6); // 12 - primary4 - satellite2 at inclusive tangent.
    s['createEnemy'](2692.5, 1350, 'tank', s['run']!); const outer = s['enemies'].at(-1)!;
    s['explodeClusterSatellites'](2400, 1350, m); expect(outer.health).toBe(4);
  });
  it('validates tiny Cluster half-damage before visual, array, HP or timer mutation', () => {
    const { scene: s } = armed(); setMissile(s, undefined, true); s['globalDamageMultiplier'] = Number.MIN_VALUE; s['playerBuild']!.applyStatPercent('reactorPower', -.99);
    const circle = vi.spyOn(s.add, 'circle'), before = s['gameplayTimers'].map(t => t.elapsed);
    expect(() => s['fireMissile']()).toThrow(RangeError); expect(circle).not.toHaveBeenCalled(); expect(s['missiles']).toHaveLength(0);
    expect(s['enemies'][0].health).toBe(6); expect(s['gameplayTimers'].map(t => t.elapsed)).toEqual(before);
  });
  it.each([0, 0.0009])('near-zero aim%s suppresses Laser/Drone without creating visuals', distance => {
    const { scene: s } = armed(); s['enemies'][0].visual.x = 2400 + distance;
    s['drone']!.x = 2400; const circle = vi.spyOn(s.add, 'circle');
    s['fireLaser'](); s['fireDrone'](); expect(s['projectiles']).toHaveLength(0); expect(circle).not.toHaveBeenCalled();
  });
  it('collision precedes lifetime expiry/world exit, including initial overlap and inclusive tangency', () => {
    const { scene: s } = fixture(); s['createEnemy'](4800, 1350, 'tank', s['run']!);
    const p = playerShot(s, 4800); p.remainingLifetime = 0; s['updateProjectiles'](0);
    expect(s['enemies'][0].health).toBe(5); expect(s['projectiles']).toHaveLength(0);
    s['enemies'][0].visual.x = 2900; s['enemies'][0].visual.y = 1380;
    playerShot(s, 2800); s['updateProjectiles'](100); expect(s['enemies'][0].health).toBe(4);
    s['enemies'] = []; const expired = playerShot(s); s['updateProjectiles'](3000);
    expect(s['projectiles']).toHaveLength(0); expect(expired.visual.active).toBe(false);
  });
  it('BASE hits an intervening non-target at interpolated center and keeps its launch heading after target loss', () => {
    const { scene: s } = fixture(); s['createEnemy'](3000, 1350, 'tank', s['run']!); s['fireMissile'](); const m = s['missiles'][0];
    const target = m.target; s['createEnemy'](2600, 1350, 'tank', s['run']!); const interceptor = s['enemies'][1];
    const explosion = vi.spyOn(s as unknown as { explodeMissile(x: number, y: number, missile: unknown): void }, 'explodeMissile');
    s['updateMissiles'](1000); expect(m.target).toBe(target); expect(explosion.mock.calls[0].slice(0, 2)).toEqual([2568, 1350]);
    expect(interceptor.health).toBe(4); expect(target!.health).toBe(6);
    s['fireMissile'](); const next = s['missiles'][0], heading = [next.headingX, next.headingY];
    s['enemies'] = [target!]; target!.visual.y += 300; s['updateMissiles'](10);
    expect([next.headingX, next.headingY]).toEqual(heading); expect(next.target).not.toBe(target);
  });
  it('stale Missile explosion cannot access fresh enemies and invalid BASE satellite fails before HP', () => {
    const { scene: s } = armed(); s['fireMissile'](); const m = s['missiles'][0], enemy = s['enemies'][0];
    expect(() => s['applyEnemyHit']({ kind: 'ENEMY_BLAST', origin: { x: 2400, y: 1350 }, run: s['run']!, target: enemy, attack: m.attack, phase: 'SATELLITE' })).toThrow(RangeError);
    expect(enemy.health).toBe(6); const fresh = new RunLifecycle(); fresh.start(); s['run'] = fresh;
    s['explodeMissile'](2800, 1350, m); s['explodeClusterSatellites'](2800, 1350, m); s['updateMissiles'](10000);
    expect(enemy.health).toBe(6); expect(m.remainingLifetime).toBe(4000);
  });

});


describe('GAME-052 physical interaction and Charger integration', () => {
  function direct(s: GameplayScene, target: typeof s['enemies'][number], impact = 200, damage = 1, x = 1, y = 0) {
    return { kind: 'ENEMY_DIRECT' as const, run: s['run']!, target, direction: { x, y },
      attack: createAttack({ kind: 'LASER', variant: 'BASE', snapshot: { damage, impact, speed: 1200, radius: 6, lifetime: 2000 } }) as LaserAttack };
  }
  it.each(['swarm', 'charger', 'chaser', 'shooter', 'tank', 'boss'] as const)('%s starts with owned frozen interaction and zero external velocity', kind => {
    const f = inputFixture(), s = f.scene, draws = spyStreams(s), e = s['createEnemy'](2800, 1350, kind, s['run']!)!;
    expect(e.knockbackVelocity).toEqual({ x: 0, y: 0 }); expect(e.lastDamagingSource).toBeNull();
    expect(e.spawnSnapshot.interaction).toEqual(enemyDefinitions.ENEMY_DEFINITIONS[kind].interaction);
    expect(e.spawnSnapshot.interaction).not.toBe(enemyDefinitions.ENEMY_DEFINITIONS[kind].interaction);
    expect(Object.isFrozen(e.spawnSnapshot.interaction)).toBe(true);
    expect(!!e.charger).toBe(kind === 'charger');
    if (e.charger) expect(e.charger.state).toEqual({ phase: 'APPROACH', remainingMs: 0, directionX: 1, directionY: 0 });
    expect(s['successfulTimedSpawns']).toBe(0); for (const draw of draws) expect(draw).not.toHaveBeenCalled();
  });
  it.each([['swarm', 1.5], ['chaser', 1], ['charger', 0.75], ['shooter', 1], ['tank', 0.25], ['boss', 0.05]] as const)(
    '%s response%s changes physical force, never damage or immediate position', (kind, response) => {
      const { scene: s } = inputFixture(), e = s['createEnemy'](2800, 1350, kind, s['run']!)!; e.health = 10;
      const result = s['applyEnemyHit'](direct(s, e)); expect(result!.healthAfter).toBe(9);
      expect(e.knockbackVelocity.x).toBe(200 * response); expect(e.knockbackVelocity.y).toBe(0);
      expect(e.visual.x).toBe(2800); expect(e.visual.y).toBe(1350);
    });
  it('Elite response is its explicit0.125 snapshot, independent of HP', () => {
    const { scene: s } = inputFixture(), e = s['createEnemy'](2800, 1350, 'tank', s['run']!, true)!;
    e.health = 100; s['applyEnemyHit'](direct(s, e)); expect(e.knockbackVelocity.x).toBe(25); expect(e.health).toBe(99);
  });
  it('integrates original AI first then one analytic external step and decay', () => {
    const { scene: s } = inputFixture(), e = s['createEnemy'](3000, 1350, 'chaser', s['run']!)!;
    s['applyEnemyHit'](direct(s, e)); expect(e.visual.x).toBe(3000);
    s.update(0, 100); expect(e.visual.x).toBeCloseTo(3000 - 18 + 14); expect(e.knockbackVelocity.x).toBeCloseTo(80);
    expect(e.health).toBe(2); s.update(0, 100); expect(e.knockbackVelocity).toEqual({ x: 0, y: 0 });
  });
  it('clears blocked outward velocity and retains its tangential component', () => {
    const { scene: s } = inputFixture(), e = s['createEnemy'](4775, 1350, 'shooter', s['run']!)!;
    s['player']!.x = 4775; s['player']!.y = 1800; e.knockbackVelocity = { x: 360, y: 480 };
    s.update(0, 100); expect(e.visual.x).toBe(4775); expect(e.visual.y).toBeCloseTo(1393.2);
    expect(e.knockbackVelocity.x).toBe(0); expect(e.knockbackVelocity.y).toBeCloseTo(384); expect(e.health).toBe(2);
  });
  it('Swarm pursues at240, contacts with32 radius and dies through one source/XP observer', () => {
    const { scene: s } = inputFixture(), e = s['createEnemy'](2800, 1350, 'swarm', s['run']!)!;
    s.update(0, 100); expect(e.visual.x).toBe(2776);
    e.visual.x = 2431; s['updatePlayerContact'](); expect(s['player']!.x).toBe(2399); expect(s['playerHealth']).toBe(4);
    const factory = vi.spyOn(enemyDeath, 'createEnemyDeathRecord');
    try { s['applyEnemyHit'](direct(s, e)); expect(factory).toHaveBeenCalledTimes(1); }
    finally { factory.mockRestore(); }
    expect(e.knockbackVelocity).toEqual({ x: 0, y: 0 }); expect(s['xpPickups'].map(p => p.value)).toEqual([1]);
    expect(s['runDiagnostics']!.snapshot().aggregates).toMatchObject({ killed: { total: 1, byArchetype: { swarm: 1 } },
      xpDropped: 1, killsBySource: { 'LASER.BASE.DIRECT': 1 } });
  });
  it('Charger tracks final displaced center during WINDUP, reuses Graphics and locks heading', () => {
    const { scene: s } = inputFixture(), e = s['createEnemy'](2700, 1350, 'charger', s['run']!)!;
    const graphic = e.charger!.telegraph as unknown as ReturnType<typeof graphics>;
    s.update(0, 100); expect(e.charger!.state.phase).toBe('WINDUP'); expect(e.charger!.state.remainingMs).toBe(550);
    expect(graphic.commands).toEqual([['style', 3, 0xfb7185, 0.75], ['line', 2700, 1350, 2375, 1350]]);
    e.knockbackVelocity = { x: 0, y: 200 }; s.update(0, 100);
    const aim = e.charger!.state; expect(aim.directionY).toBeLessThan(0); expect(e.visual.y).toBeCloseTo(1364);
    s.update(0, 450); expect(e.charger!.state.phase).toBe('CHARGING'); expect(graphic.commands).toEqual([]);
    const locked = e.charger!.state; s['player']!.y += 200; const x = e.visual.x, y = e.visual.y;
    s.update(0, 100); expect(e.charger!.state.directionX).toBe(locked.directionX); expect(e.charger!.state.directionY).toBe(locked.directionY);
    expect(e.visual.x - x).toBeCloseTo(locked.directionX * 65); expect(e.visual.y - y).toBeCloseTo(locked.directionY * 65);
    expect(e.charger!.telegraph).toBe(graphic); s.update(0, 400); expect(e.charger!.state.phase).toBe('RECOVERY');
    s.update(0, 800); expect(e.charger!.state.phase).toBe('APPROACH'); s.update(0, 1); expect(e.charger!.state.phase).toBe('WINDUP');
  });
  it('actual charge crossing goes through contact/Defense once and leaves committed motion intact', () => {
    const { scene: s } = inputFixture(), e = s['createEnemy'](2200, 1350, 'charger', s['run']!)!;
    e.charger!.state = { phase: 'CHARGING', remainingMs: 500, directionX: 1, directionY: 0 };
    const damage = vi.spyOn(s as unknown as { damagePlayer: typeof s['damagePlayer'] }, 'damagePlayer');
    s.update(0, 500); expect(e.visual.x).toBe(2525); expect(s['playerHealth']).toBe(4); expect(s['player']!.x).toBe(2400);
    expect(damage).toHaveBeenCalledTimes(1); expect(damage.mock.calls[0][0]).toMatchObject({ kind: 'PLAYER_CONTACT', attack: { snapshot: { damage: 1 } } });
    expect(e.charger!.state.phase).toBe('RECOVERY'); expect(s['playerDamageProtectionRemaining']).toBe(500);
    s.update(0, 1); expect(damage).toHaveBeenCalledTimes(1); expect(s['playerHealth']).toBe(4);
  });
  it('contact prefers final overlap and current collection order over retained charge pose', () => {
    const { scene: s } = inputFixture(), first = s['createEnemy'](2400, 1350, 'tank', s['run']!, true)!;
    const e = s['createEnemy'](2200, 1350, 'charger', s['run']!)!;
    e.charger!.state = { phase: 'CHARGING', remainingMs: 500, directionX: 1, directionY: 0 };
    s.update(0, 500); expect(s['playerHealth']).toBe(3); expect(s['player']!.x).toBe(2444); expect(first.health).toBe(18);
  });
  it('lethal projectile removes Charger/Graphics before its same-update sweep can contact', () => {
    const { scene: s } = inputFixture(), e = s['createEnemy'](2200, 1350, 'charger', s['run']!)!;
    e.charger!.state = { phase: 'CHARGING', remainingMs: 500, directionX: 1, directionY: 0 };
    playerShot(s, 2500, 10); const originalVelocity = e.knockbackVelocity;
    s.update(0, 500); expect(s['enemies']).not.toContain(e); expect(s['playerHealth']).toBe(5);
    expect(e.knockbackVelocity).toEqual(originalVelocity); expect(e.charger!.telegraph.active).toBe(false);
    expect(s['runDiagnostics']!.snapshot().aggregates).toMatchObject({ killed: { byArchetype: { charger: 1 } }, xpDropped: 1, xpCollected: 1 });
    expect(s['xpPickups']).toHaveLength(0); expect(s['playerProgression']!.snapshot().xp).toBe(1);
  });
  it.each(['MANUAL', 'REWARD', 'FOCUS_LOSS'] as const)('%s freezes Charger, Graphics and force then resumes remaining time', reason => {
    const { scene: s } = inputFixture(), e = s['createEnemy'](2700, 1350, 'charger', s['run']!)!; s.update(0, 100);
    e.knockbackVelocity = { x: 0, y: 200 }; const before = JSON.stringify([e.charger!.state, e.knockbackVelocity, e.visual.x, e.visual.y,
      (e.charger!.telegraph as unknown as ReturnType<typeof graphics>).commands]);
    s['run']!.requestPause(reason); s['projectPause'](); const draws = spyStreams(s);
    s.update(0, 5000); expect(JSON.stringify([e.charger!.state, e.knockbackVelocity, e.visual.x, e.visual.y,
      (e.charger!.telegraph as unknown as ReturnType<typeof graphics>).commands])).toBe(before);
    for (const draw of draws) expect(draw).not.toHaveBeenCalled(); s['run']!.releasePause(reason); s.update(0, 100);
    expect(e.charger!.state.remainingMs).toBe(450); expect(e.knockbackVelocity.y).toBe(80);
  });
  it('contact prefers actual final overlap over the earlier swept boundary pose', () => {
    const { scene: s } = inputFixture(), e = s['createEnemy'](2200, 1350, 'charger', s['run']!)!;
    e.charger!.state = { phase: 'CHARGING', remainingMs: 500, directionX: 1, directionY: 0 };
    s.update(0, 300); expect(e.visual.x).toBe(2395); expect(s['player']!.x).toBe(2437); expect(s['playerHealth']).toBe(4);
  });
  it('knockback-only crossing during recovery adds no swept contact', () => {
    const { scene: s } = inputFixture(), e = s['createEnemy'](2300, 1350, 'charger', s['run']!)!;
    e.charger!.state = { phase: 'RECOVERY', remainingMs: 800, directionX: 1, directionY: 0 };
    e.knockbackVelocity = { x: 600, y: 0 }; s.update(0, 500);
    expect(e.visual.x).toBe(2450); expect(s['playerHealth']).toBe(5); expect(e.knockbackVelocity).toEqual({ x: 0, y: 0 });
  });
  it('captured native cleanup destroys Charger Graphics and never touches a fresh create', () => {
    const f = fixture(), s = f.scene; allowCreate(s); s.create();
    const old = s['createEnemy'](2700, 1350, 'charger', s['run']!)!, oldRun = s['run']!;
    old.knockbackVelocity = { x: 200, y: 0 };
    f.shutdown(); expect(old.charger!.telegraph.active).toBe(false); expect(oldRun.state).toBe('DISPOSED');
    s.create(); const fresh = s['createEnemy'](2700, 1350, 'charger', s['run']!)!;
    expect(fresh.charger!.telegraph).not.toBe(old.charger!.telegraph); expect(fresh.knockbackVelocity).toEqual({ x: 0, y: 0 });
    expect(s['enemies'][0].spawnSnapshot.interaction).not.toBe(old.spawnSnapshot.interaction);
    expect(s['enemies'][0].knockbackVelocity).toEqual({ x: 0, y: 0 }); expect(s['gameplayTimers']).toHaveLength(5);
  });
  it('old enemies accidentally retained in a fresh collection cannot move, charge, receive Hits or contact', () => {
    const { scene: s } = inputFixture(), e = s['createEnemy'](2400, 1350, 'charger', s['run']!)!, oldHit = direct(s, e);
    e.knockbackVelocity = { x: 300, y: 0 }; const fresh = new RunLifecycle(); fresh.start(); s['run'] = fresh;
    s.update(0, 100); expect(e.visual.x).toBe(2400); expect(e.charger!.state.phase).toBe('APPROACH'); expect(e.knockbackVelocity.x).toBe(300);
    expect(s['applyEnemyHit'](oldHit)).toBeNull(); expect(s['applyEnemyHit']({ ...oldHit, run: fresh })).toBeNull(); expect(s['playerHealth']).toBe(5);
  });
  it.each(['impact', 'direction', 'response', 'velocity', 'product'] as const)('malformed %s fails preflight before HP/source/force mutation', field => {
    const { scene: s } = inputFixture(), e = s['createEnemy'](2800, 1350, 'tank', s['run']!)!, hit = direct(s, e);
    if (field === 'impact') Reflect.set(hit, 'attack', { ...hit.attack, snapshot: { ...hit.attack.snapshot, impact: NaN } });
    if (field === 'direction') hit.direction.x = Infinity;
    if (field === 'response' || field === 'product') Reflect.set(e, 'spawnSnapshot', { ...e.spawnSnapshot,
      interaction: { knockbackResponse: field === 'response' ? -1 : Number.MAX_SAFE_INTEGER, decoySusceptible: true } });
    if (field === 'velocity') e.knockbackVelocity = { x: 601, y: 0 };
    const velocity = e.knockbackVelocity, before = s['runDiagnostics']!.snapshot();
    expect(() => s['applyEnemyHit'](hit)).toThrow(RangeError); expect(e.health).toBe(6); expect(e.lastDamagingSource).toBeNull();
    expect(e.knockbackVelocity).toBe(velocity); expect(s['runDiagnostics']!.snapshot()).toEqual(before); expect(s['xpPickups']).toHaveLength(0);
  });
  it('representational hpLost0 still accepts control without attribution or kill metrics', () => {
    const { scene: s } = inputFixture(), e = s['createEnemy'](2800, 1350, 'chaser', s['run']!)!; e.health = Number.MAX_SAFE_INTEGER;
    const before = s['runDiagnostics']!.snapshot(), hit = direct(s, e, 200, Number.MIN_VALUE); const result = s['applyEnemyHit'](hit)!;
    expect(result.hpLost).toBe(0); expect(e.knockbackVelocity.x).toBe(200); expect(e.lastDamagingSource).toBeNull();
    expect(s['runDiagnostics']!.snapshot()).toEqual(before); expect(s['xpPickups']).toHaveLength(0);
  });
  it('explicit zero force deals ordinary damage without clearing retained velocity', () => {
    const { scene: s } = inputFixture(), e = s['createEnemy'](2800, 1350, 'tank', s['run']!)!; e.knockbackVelocity = { x: 100, y: 0 };
    s['applyEnemyHit'](direct(s, e, 0)); expect(e.health).toBe(5); expect(e.knockbackVelocity).toEqual({ x: 100, y: 0 });
  });
  it('an owned explicit zero response preserves ordinary damage and retained velocity', () => {
    const { scene: s } = inputFixture(), real = enemyDefinitions.createEnemySpawnSnapshot;
    const factory = vi.spyOn(enemyDefinitions, 'createEnemySpawnSnapshot').mockImplementation((definition, context) =>
      real({ ...definition, interaction: { ...definition.interaction, knockbackResponse: 0 } }, context));
    let e: typeof s['enemies'][number];
    try { e = s['createEnemy'](2800, 1350, 'tank', s['run']!)!; } finally { factory.mockRestore(); }
    e.knockbackVelocity = { x: -100, y: 0 }; s['applyEnemyHit'](direct(s, e));
    expect(e.health).toBe(5); expect(e.knockbackVelocity).toEqual({ x: -100, y: 0 });
  });
  it('launches real default200/160/400, keeps OLD Impact1 and NEW Impact2 independently frozen', () => {
    const { scene: s } = inputFixture(), e = s['createEnemy'](2800, 1350, 'tank', s['run']!)!; s['currentTarget'] = e;
    s['drone'] = visual(2500, 1350) as unknown as NonNullable<typeof s['drone']>;
    s['fireLaser'](); s['fireDrone'](); s['fireMissile'](); const old = [...s['projectiles'].map(p => p.attack), s['missiles'][0].attack];
    expect(old.map(a => 'impact' in a.snapshot ? a.snapshot.impact : null)).toEqual([200, 160, 400]);
    s['applyBuildChange']({ kind: 'percent', stat: 'impact', delta: 1 }); s['missiles'] = []; s['projectiles'] = [];
    s['fireLaser'](); s['fireDrone'](); s['fireMissile'](); const next = [...s['projectiles'].map(p => p.attack), s['missiles'][0].attack];
    expect(next.map(a => 'impact' in a.snapshot ? a.snapshot.impact : null)).toEqual([400, 320, 800]);
    for (let i = 0; i < old.length; i++) expect(next[i]).toEqual({ ...old[i], snapshot: { ...old[i].snapshot, impact: Reflect.get(old[i].snapshot, 'impact') * 2 } });
    expect(old.map(a => Reflect.get(a.snapshot, 'impact'))).toEqual([200, 160, 400]);
  });
  it.each(['laser', 'prism', 'drone', 'twin', 'missile', 'cluster-primary', 'cluster-satellite'] as const)('%s actual collision applies positive physical force once per accepted Hit', mode => {
    const { scene: s } = inputFixture(), e = s['createEnemy'](2800, 1350, 'chaser', s['run']!)!; e.health = 100;
    s['currentTarget'] = e; if (mode === 'prism') setLaser(s, undefined, true); s['twinDroneEvolved'] = mode === 'twin';
    if (mode === 'laser' || mode === 'prism') { s['fireLaser'](); s['updateProjectiles'](400); }
    else if (mode === 'drone' || mode === 'twin') {
      s['drone'] = visual(2500, 1350) as unknown as NonNullable<typeof s['drone']>;
      if (mode === 'twin') s['twinDrone'] = visual(2450, 1350) as unknown as NonNullable<typeof s['twinDrone']>;
      s['fireDrone'](); s['updateProjectiles'](500);
    } else {
      if (mode !== 'missile') setMissile(s, undefined, true); s['fireMissile'](); const m = s['missiles'][0];
      if (mode === 'cluster-satellite') s['explodeClusterSatellites'](2800 - m.explosionRadius, 1350, m);
      else s['explodeMissile'](2800, 1350, m);
    }
    const expected = mode === 'twin' ? 320 : mode.includes('satellite') ? 200 : mode.includes('primary') || mode === 'missile' ? 400 : mode === 'drone' ? 160 : 200;
    expect(e.knockbackVelocity.x).toBeCloseTo(expected); expect(e.visual.x).toBe(2800); expect(e.health).toBeLessThan(100);
    expect(s['xpPickups']).toHaveLength(0);
  });
  it('Cluster uses FIRST covering satellite origin once and preserves primary survivor positions/membership', () => {
    const { scene: s } = inputFixture(), e = s['createEnemy'](2680, 1350, 'chaser', s['run']!)!; e.health = 100;
    setMissile(s, undefined, true); s['fireMissile'](); const m = s['missiles'][0];
    // Target at offsetR is primary-inclusive and satellite-center coincident: both directions +X.
    e.visual.x = 2560 + m.explosionRadius;
    s['explodeMissile'](2560, 1350, m); s['explodeClusterSatellites'](2560, 1350, m);
    expect(e.health).toBe(94); expect(e.knockbackVelocity).toEqual({ x: 600, y: 0 }); expect(e.visual.x).toBe(2755);
    e.visual.x = 2560 + .75 * m.explosionRadius; e.visual.y = 1350 + Math.sqrt(3) * .25 * m.explosionRadius; e.knockbackVelocity = { x: 0, y: 0 };
    const hit = vi.spyOn(s as unknown as { applyEnemyHit: typeof s['applyEnemyHit'] }, 'applyEnemyHit');
    s['explodeClusterSatellites'](2560, 1350, m); expect(hit).toHaveBeenCalledTimes(1);
    expect(hit.mock.calls[0][0]).toMatchObject({ origin: { x: 2755, y: 1350 } }); expect(e.knockbackVelocity.x).toBeLessThan(0);
  });
});


describe('GAME-053 physical XP and pending progression', () => {
  function pickup(s: GameplayScene, value = 1, x = 2400, y = 1350) {
    const p = { run: s['run']!, visual: visual(x, y, 10), value, speed: 0 } as unknown as (typeof s)['xpPickups'][number];
    s['xpPickups'].push(p); return p;
  }
  function credit(s: GameplayScene, p: ReturnType<typeof pickup>, amount = p.value) {
    return s['creditExperience'](amount, p, s['run']!, s['playerProgression']!);
  }
  it('collects one32 pickup once and presents three distinct sequential offers under one REWARD', () => {
    const f = inputFixture(), s = f.scene, p = pickup(s, 32), draws = spyStreams(s), events = [...s['gameplayTimers']];
    s['updateXpPickups'](0);
    expect(s['playerProgression']!.snapshot()).toEqual({ level: 4, xp: 2, threshold: 20, pendingLevels: 3 });
    const first = s['levelUpPresentation'][1]; const firstIdentity = s['levelUpChoices'].get(first)!;
    expect(credit(s, p)).toBe(false);
    for (let remaining = 3; remaining > 0; remaining--) {
      const current = s['levelUpPresentation'][1];
      expect(s['run']!.pauseReasons).toEqual(['REWARD']); expect(s.time.paused).toBe(true);
      expect(s['playerProgression']!.snapshot().pendingLevels).toBe(remaining);
      f.down('W'); f.down('SPACE'); s.update(0, 1000);
      current.emit('pointerdown'); f.up('W'); f.up('SPACE');
      if (remaining > 1) {
        expect(s['run']!.state).toBe('PAUSED'); expect(s['levelUpPresentation'][1]).not.toBe(current);
        const before = f.api.snapshot(); s['acceptLevelUpChoice'](first, { kind: 'laser', upgrade: firstIdentity.split('.')[1] as 'power' });
        expect(f.api.snapshot()).toEqual(before);
      }
    }
    expect(s['run']!.state).toBe('RUNNING'); expect(s['inputAdapter']!.sample()).toMatchObject({ moveX: 0, moveY: 0 });
    expect(s['playerProgression']!.snapshot().pendingLevels).toBe(0); expect(p.visual.active).toBe(false);
    expect(f.api.snapshot()!.diagnostics.aggregates).toMatchObject({ xpCredited: 32, xpCollected: 32, xpDevCredited: 0,
      levelsGained: 3, offersPresented: 3, choicesAccepted: 3, pauseEntries: 1, pauseResumes: 1 });
    expect(draws.map(d => d.mock.calls.length)).toEqual([0, 9, 0, 0]); expect(s['gameplayTimers']).toEqual(events);
    expect(Object.keys(f.api.snapshot()!.progression)).toEqual(['level', 'xp', 'threshold']);
  });
  it('next sequential offer sees actual just-completed evolution prerequisite', () => {
    const { scene: s } = fixture();
    setLaser(s, { power: 2, fireRate: 2, speed: 1 }); s['moduleLevels'].combat = 1; vi.spyOn(s['runRandom']!.reward, 'next').mockReturnValue(0);
    pickup(s, 32); s['updateXpPickups'](0);
    expect(s['levelUpChoices'].get(s['levelUpPresentation'][3])).toBe('laser.speed');
    expect([...s['levelUpChoices'].values()]).not.toContain('prism');
    s['levelUpPresentation'][3].emit('pointerdown');
    expect(s['laserRanks'].speed).toBe(2); expect([...s['levelUpChoices'].values()]).toContain('prism');
    const evolve = [...s['levelUpChoices']].find(([, id]) => id === 'prism')![0]; evolve.emit('pointerdown');
    expect(s['prismEvolved']).toBe(true); expect([...s['levelUpChoices'].values()]).not.toContain('prism');
    expect(s['playerProgression']!.snapshot().pendingLevels).toBe(1);
  });
  it.each([-1, 0, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('malformed physical XP%s rejects before mutation', value => {
    const { scene: s, api } = fixture(), p = pickup(s, value), before = api.snapshot(), owner = s['playerProgression']!.snapshot();
    expect(() => s['updateXpPickups'](0)).toThrow(RangeError);
    expect(api.snapshot()).toEqual(before); expect(s['playerProgression']!.snapshot()).toEqual(owner);
    expect(s['xpPickups']).toContain(p); expect(p.visual.active).toBe(true); expect(p.speed).toBe(0);
  });
  it('rejects mismatched value, removed/stale/inactive pickup and illegitimate DEV credit', () => {
    const { scene: s, api } = fixture(), p = pickup(s), before = api.snapshot();
    expect(() => credit(s, p, 2)).toThrow(RangeError); expect(api.snapshot()).toEqual(before);
    p.visual.destroy(); expect(credit(s, p)).toBe(false);
    const old = pickup(s); s['xpPickups'].pop(); expect(credit(s, old)).toBe(false);
    const foreign = pickup(s); Object.assign(foreign, { run: new RunLifecycle() }); expect(credit(s, foreign)).toBe(false);
    expect(s['creditExperience'](2, undefined, s['run']!, s['playerProgression']!)).toBe(false);
  });
  it.each(['xpCredited', 'xpCollected', 'levelsGained', 'offersPresented', 'pauseEntries'] as const)('preflights %s overflow before cross-owner credit', key => {
    const { scene: s, api } = fixture(), p = pickup(s, 5);
    s['runDiagnostics']!['aggregates'][key] = Number.MAX_SAFE_INTEGER;
    const before = api.snapshot(), owner = s['playerProgression']!.snapshot();
    expect(() => credit(s, p)).toThrow(RangeError); expect(api.snapshot()).toEqual(before);
    expect(s['playerProgression']!.snapshot()).toEqual(owner); expect(p.visual.active).toBe(true); expect(s['xpPickups']).toContain(p);
  });
  it.each(['choicesAccepted', 'offersPresented'] as const)('selection preflights %s before actual Build/pending/UI changes', key => {
    const { scene: s, api } = fixture(); aimChoice(s, 'laser.power', 0); pickup(s, 32); s['updateXpPickups'](0);
    s['runDiagnostics']!['aggregates'][key] = Number.MAX_SAFE_INTEGER;
    const before = api.snapshot(), owner = s['playerProgression']!.snapshot(), ranks = { ...s['laserRanks'] }, current = s['levelUpPresentation'][1];
    expect(() => s['acceptLevelUpChoice'](current, { kind: 'laser', upgrade: 'power' })).toThrow(RangeError);
    expect(api.snapshot()).toEqual(before); expect(s['laserRanks']).toEqual(ranks); expect(s['playerProgression']!.snapshot()).toEqual(owner);
    expect(current.active).toBe(true); expect(s['levelUpPresentation'][1]).toBe(current);
  });
  it('rejects mismatched actual candidate while preserving live presentation', () => {
    const { scene: s, api } = fixture(); api.forceLevelUp(); const p = s['levelUpPresentation'][1], before = api.snapshot();
    s['acceptLevelUpChoice'](p, { kind: 'passive', module: 'hull' }); expect(api.snapshot()).toEqual(before); expect(p.active).toBe(true);
  });
  it.each([180, 220])('preserves magnet%s, exact acceleration/cap and collection boundary', magnet => {
    const { scene: s } = fixture(); s['xpMagnetRadius'] = magnet;
    const outside = pickup(s, 1, 2400 + magnet + 0.001), inside = pickup(s, 1, 2400 + magnet);
    outside.speed = 100; s['updateXpPickups'](100);
    expect(outside.speed).toBe(0); expect(outside.visual.x).toBe(2400 + magnet + 0.001);
    expect(inside.speed).toBe(90); expect(inside.visual.x).toBeCloseTo(2400 + magnet - 4.5);
    inside.visual.x = 2400 + magnet; inside.speed = 590; s['updateXpPickups'](20);
    expect(inside.speed).toBe(600); expect(inside.visual.x).toBeCloseTo(2400 + magnet - (590 / 90 + 0.5 * 900 / 8100 + 600 * (0.02 - 1 / 90)));
    const boundary = pickup(s, 1, 2420); s['updateXpPickups'](0); expect(boundary.visual.active).toBe(false);
  });
  it('reverse collection pauses after newest threshold pickup, leaving older one untouched', () => {
    const { scene: s } = fixture(), older = pickup(s), newer = pickup(s, 5); s['updateXpPickups'](0);
    expect(s['xpPickups']).toEqual([older]); expect(newer.visual.active).toBe(false); expect(older.visual.active).toBe(true);
  });
  it('consolidates actual visuals in survivor order, conserves XP and credits anchor only once', () => {
    const { scene: s, api } = fixture();
    for (let i = 0; i < 255; i++) pickup(s, 1, 4000 + i * 64, 2000);
    const a = pickup(s, 2, 3000, 2000), b = pickup(s, 3, 3001, 2001), before = api.snapshot()!.diagnostics;
    s['updateXpPickups'](0); expect(s['xpPickups']).toHaveLength(256);
    expect(s['xpPickups'].at(-1)).toBe(a); expect([a.visual.x, a.visual.y, a.value, a.speed]).toEqual([3000, 2000, 5, 0]);
    expect(b.visual.active).toBe(false); expect(credit(s, b)).toBe(false); expect(api.snapshot()!.diagnostics).toEqual(before);
    expect(s['xpPickups'].reduce((sum, p) => sum + p.value, 0)).toBe(260);
    a.visual.x = 2400; a.visual.y = 1350; s['updateXpPickups'](0);
    expect(api.snapshot()!.diagnostics.aggregates).toMatchObject({ xpCollected: 5, xpDropped: 0, levelsGained: 1 });
  });
  it.each(['MANUAL', 'REWARD', 'FOCUS_LOSS'] as const)('%s freezes physical/consolidation and XP state', reason => {
    const { scene: s, api } = fixture(); for (let i = 0; i < 258; i++) pickup(s, 1, 3000, 2000);
    s['run']!.requestPause(reason); s['projectPause'](); const before = api.snapshot(), ps = s['xpPickups'].map(p => [p.value, p.speed, p.visual.x]);
    s['updateXpPickups'](10000); expect(api.snapshot()).toEqual(before); expect(s['xpPickups'].map(p => [p.value, p.speed, p.visual.x])).toEqual(ps);
  });
  it('REWARD+FOCUS_LOSS holds all pending choices; terminal freezes unresolved state', () => {
    const f = inputFixture(), s = f.scene; pickup(s, 32); s['updateXpPickups'](0); s.game.events.emit('blur');
    for (let i = 0; i < 3; i++) s['levelUpPresentation'][1].emit('pointerdown');
    expect(s['run']!.pauseReasons).toEqual(['FOCUS_LOSS']); s.game.events.emit('focus'); expect(s['run']!.state).toBe('PAUSED'); f.escape();
    expect(s['run']!.state).toBe('RUNNING'); pickup(s, 100); s['updateXpPickups'](0);
    const oldChoice = s['levelUpPresentation'][1], before = s['playerProgression']!.snapshot(); s['enterPlayerDeath']();
    const d = f.api.snapshot()!.diagnostics, draws = spyStreams(s); oldChoice.emit('pointerdown'); s['enterLevelUpPause'](); s['updateXpPickups'](1000);
    expect(s['playerProgression']!.snapshot()).toEqual(before); expect(f.api.snapshot()!.diagnostics).toEqual(d); for (const draw of draws) expect(draw).not.toHaveBeenCalled();
  });
  it('native create disposes captured old owner/pickups and rejects stale callbacks', () => {
    const f = fixture(), s = f.scene; allowCreate(s); s.create(); const old = s['playerProgression']!, run = s['run']!;
    const p = pickup(s, 32); s['updateXpPickups'](0); const choice = s['levelUpPresentation'][1], copy = old.snapshot();
    f.shutdown(); s.create(); const api = window.__NEBULA_DEV__!, before = api.snapshot();
    expect(() => old.snapshot()).toThrow('disposed PlayerProgression'); expect(copy.pendingLevels).toBe(3);
    expect(s['creditExperience'](32, p, run, old)).toBe(false); s['acceptLevelUpChoice'](choice, { kind: 'laser', upgrade: 'power' }, run, old);
    expect(api.snapshot()).toEqual(before); expect(s['playerProgression']!.snapshot()).toEqual({ level: 1, xp: 0, threshold: 5, pendingLevels: 0 });
    expect(s['xpPickups']).toHaveLength(0); expect(p.visual.active).toBe(false); expect(s['gameplayTimers']).toHaveLength(5);
  });
});


describe('GAME-054 authentic transaction integration', () => {
  function physical32(s: GameplayScene) {
    s['xpPickups'].push({ run: s['run']!, value: 32, speed: 0,
      visual: visual(2400, 1350, 10) as unknown as Phaser.GameObjects.Arc });
    s['updateXpPickups'](0);
  }
  it('keeps exactly the same persistent Text/handler/token after repeated rejection, then accepts once', () => {
    const { scene: s, api } = fixture(); const targeted = aimChoice(s, 'laser.power', 0); api.forceLevelUp(); targeted.mockRestore();
    const p = s['rewardPresentation']!, text = p.texts[1], handler = text.listeners('pointerdown')[0], token = p.token;
    s['playerBuild']!.applyStatPercent('reactorPower', Number.MAX_SAFE_INTEGER / 1.5 - 1); const before = api.snapshot(), pending = s['playerProgression']!.snapshot(), offer = p.reward.snapshot();
    for (let i = 0; i < 3; i++) expect(() => text.emit('pointerdown')).toThrow(RangeError);
    expect(text.active).toBe(true); expect(text.listeners('pointerdown')).toEqual([handler]); expect(s['rewardPresentation']).toBe(p);
    expect(s['rewardPresentation']!.token).toBe(token); expect(p.reward.snapshot()).toEqual(offer);
    expect(api.snapshot()).toEqual(before); expect(s['playerProgression']!.snapshot()).toEqual(pending);
    s['playerBuild']!.applyStatPercent('reactorPower', -(Number.MAX_SAFE_INTEGER / 1.5 - 1)); text.emit('pointerdown');
    expect(s['laserRanks'].power).toBe(1); expect(s['laser'].damage).toBe(2); expect(p.reward.snapshot()).toBeNull();
    expect(text.listeners('pointerdown')).toEqual([]); expect(text.active).toBe(false);
    const accepted = api.snapshot(); handler(); text.emit('pointerdown');
    expect(api.snapshot()).toEqual(accepted); expect(s['playerProgression']!.snapshot().pendingLevels).toBe(0);
    expect(accepted!.diagnostics.aggregates).toMatchObject({ offersPresented: 1, choicesAccepted: 1, levelsGained: 1 });
  });
  it('callback effect/pending/selected -> invalidate -> return -> handler/UI cleanup -> next open', () => {
    const { scene: s, api } = fixture(); physical32(s);
    const p = s['rewardPresentation']!, owner = p.reward, trace: string[] = [], draws = spyStreams(s);
    const originalApply = s['applyRewardChoice'].bind(s), originalSelect = owner.trySelect.bind(owner), originalInvalidate = owner.invalidate.bind(owner);
    const originalClear = s['clearRewardPresentation'].bind(s), originalOpen = owner.open.bind(owner);
    let inSelect = false;
    const apply = vi.spyOn(s as unknown as { applyRewardChoice: typeof s['applyRewardChoice'] }, 'applyRewardChoice').mockImplementation((...args) => {
      trace.push('callback'); expect(inSelect).toBe(true);
      expect(() => owner.open(owner.snapshot()!.candidates)).toThrow('already active');
      const result = originalApply(...args);
      expect(p.texts[1].active).toBe(true); expect(owner.snapshot()?.phase).toBe('PRESENTED');
      expect(s['playerProgression']!.snapshot().pendingLevels).toBe(2); expect(api.snapshot()!.diagnostics.aggregates.choicesAccepted).toBe(1);
      for (const draw of draws) expect(draw).not.toHaveBeenCalled(); trace.push('callback true'); return result;
    });
    const invalidate = vi.spyOn(owner, 'invalidate').mockImplementation(() => { trace.push('invalidate'); originalInvalidate(); });
    const select = vi.spyOn(owner, 'trySelect').mockImplementation((...args) => { inSelect = true; const result = originalSelect(...args); inSelect = false; trace.push('return'); return result; });
    const clear = vi.spyOn(s as unknown as { clearRewardPresentation: typeof s['clearRewardPresentation'] }, 'clearRewardPresentation').mockImplementation(old => {
      expect(inSelect).toBe(false); expect(owner.snapshot()).toBeNull(); owner.assertCanOpen(); trace.push('cleanup'); originalClear(old);
    });
    const open = vi.spyOn(owner, 'open').mockImplementation(candidates => { if (inSelect) return originalOpen(candidates); expect(inSelect).toBe(false); trace.push('open'); return originalOpen(candidates); });
    p.texts[1].emit('pointerdown');
    expect(trace).toEqual(['callback', 'callback true', 'invalidate', 'return', 'cleanup', 'open']);
    expect(s['rewardPresentation']!.token).not.toBe(p.token); expect(s['rewardPresentation']!.token.offerId).toBe(2);
    expect(s['run']!.pauseReasons).toEqual(['REWARD']); expect(s.time.paused).toBe(true);
    expect(draws.map(d => d.mock.calls.length)).toEqual([0, 3, 0, 0]);
    for (const spy of [apply, invalidate, select, clear, open]) spy.mockRestore();
  });
  it('same-label next offer rejects old callbacks, clones and other owners even with equal ordinals', () => {
    const { scene: s, api } = fixture(); setLaser(s, { power: 0, fireRate: 0, speed: 0 });
    const repeat = vi.spyOn(s['runRandom']!.reward,'next').mockReturnValue(0); physical32(s); repeat.mockRestore();
    const nextRoll = vi.spyOn(s['runRandom']!.reward,'next').mockReturnValue(0);
    const p = s['rewardPresentation']!, text = p.texts[1], handler = text.listeners('pointerdown')[0]; text.emit('pointerdown');
    // Laser labels intentionally repeat; captured presentation identity still changes.
    const next = s['rewardPresentation']!, before = api.snapshot(), id = next.choices.get(next.texts[1])!;
    expect(next.texts[1].text).toBe(text.text); expect(next.token).not.toBe(p.token);
    expect(next.reward.trySelect({ ...next.token }, id, () => { throw Error('forged'); })).toBe(false);
    const foreign = new RewardTransaction(); foreign.open(next.reward.snapshot()!.candidates); foreign.invalidate();
    const token = foreign.open(next.reward.snapshot()!.candidates); foreign.present(token); expect(token.offerId).toBe(next.token.offerId);
    expect(next.reward.trySelect(token, id, () => { throw Error('foreign'); })).toBe(false);
    handler(); text.emit('pointerdown'); expect(api.snapshot()).toEqual(before); nextRoll.mockRestore();
    expect(next.texts[1].listeners('pointerdown')).toHaveLength(1); expect(next.texts.every(t => t.active)).toBe(true);
  });
  it.each(['choicesAccepted', 'offersPresented', 'timeline', 'cadence', 'impact', 'damage'] as const)('preflight %s failure preserves owners/UI/handlers/RNG and retries', mode => {
    const { scene: s, api } = fixture(); s['weaponFocus'] = 'drone'; const targeted = aimChoice(s, 'drone.firingSystem', 0); physical32(s); targeted.mockRestore();
    const p = s['rewardPresentation']!, text = p.texts[1], handler = text.listeners('pointerdown')[0];
    const diagnostics = s['runDiagnostics']!, original = diagnostics.snapshot(), cadence = s['droneAttackValues'].fireInterval;
    const impact = s['playerBuild']!.getEffectiveStats().impact, multiplier = s['globalDamageMultiplier'];
    if (mode === 'choicesAccepted' || mode === 'offersPresented') diagnostics['aggregates'][mode] = Number.MAX_SAFE_INTEGER;
    if (mode === 'timeline') { for (let i = 0; i < 260; i++) diagnostics.recordPauseEntered(['REWARD']); diagnostics['droppedTimelineRecords'] = Number.MAX_SAFE_INTEGER; }
    if (mode === 'cadence') s['droneAttackValues'].fireInterval = 100;
    if (mode === 'impact') s['playerBuild']!.applyStatPercent('impact', Number.MAX_SAFE_INTEGER / 2);
    if (mode === 'damage') s['globalDamageMultiplier'] = Number.MAX_SAFE_INTEGER;
    const before = api.snapshot(), progression = s['playerProgression']!.snapshot(), ranks = { ...s['droneRanks'] }, draws = spyStreams(s);
    expect(() => text.emit('pointerdown')).toThrow(RangeError);
    expect(api.snapshot()).toEqual(before); expect(s['playerProgression']!.snapshot()).toEqual(progression); expect(s['droneRanks']).toEqual(ranks);
    expect(p.reward.snapshot()?.phase).toBe('PRESENTED'); expect(text.listeners('pointerdown')).toEqual([handler]);
    for (const draw of draws) expect(draw).not.toHaveBeenCalled();
    if (mode === 'choicesAccepted' || mode === 'offersPresented') diagnostics['aggregates'][mode] = original.aggregates[mode];
    if (mode === 'timeline') diagnostics['droppedTimelineRecords'] = 0;
    if (mode === 'cadence') s['droneAttackValues'].fireInterval = cadence;
    if (mode === 'impact') s['playerBuild']!.applyStatPercent('impact', -s['playerBuild']!.getRunModifiers().percent.impact + impact - 1);
    if (mode === 'damage') s['globalDamageMultiplier'] = multiplier;
    text.emit('pointerdown'); expect(s['droneRanks'].firingSystem).toBe(1); expect(s['playerProgression']!.snapshot().pendingLevels).toBe(2);
  });
  it('prepares Twin last, destroys an unpublished Arc on rejected recheck, then valid retry creates one', () => {
    const { scene: s, api } = fixture(); s['droneRanks'] = { boltPower: 2, firingSystem: 2, boltPropulsion: 2 }; s['moduleLevels'].replication = 1;
    api.forceLevelUp(); const p = s['rewardPresentation']!, text = p.texts[3], before = api.snapshot(), arcs: ReturnType<typeof visual>[] = [];
    const circle = vi.spyOn(s.add, 'circle').mockImplementation((x, y, radius) => { const arc = visual(x, y, radius); arcs.push(arc); return arc as unknown as Phaser.GameObjects.Arc; });
    const current = s['currentReward'].bind(s); let checks = 0;
    const recheck = vi.spyOn(s as unknown as { currentReward: typeof s['currentReward'] }, 'currentReward').mockImplementation((...args) => ++checks === 3 ? false : current(...args));
    text.emit('pointerdown'); expect(arcs).toHaveLength(1); expect(arcs[0].active).toBe(false); expect(api.snapshot()).toEqual(before);
    expect(s['twinDroneEvolved']).toBe(false); expect(s['twinDrone']).toBeUndefined(); expect(text.listeners('pointerdown')).toHaveLength(1);
    recheck.mockRestore(); text.emit('pointerdown'); expect(arcs).toHaveLength(2); expect(arcs[1].active).toBe(true);
    expect(s['twinDroneEvolved']).toBe(true); expect(s['twinDrone']).toBe(arcs[1]); circle.mockRestore();
  });
  it('terminal/disposal detach every old handler; exact old cleanup and callbacks cannot touch fresh owners', () => {
    const f = fixture(), s = f.scene; allowCreate(s); s.create(); window.__NEBULA_DEV__!.forceLevelUp();
    const old = s['rewardPresentation']!, callbacks = [...old.handlers.values()], copy = old.reward.snapshot();
    s['enterPlayerDeath'](); expect(old.reward.snapshot()).toBeNull(); expect(old.texts.every(t => !t.active && t.listenerCount('pointerdown') === 0)).toBe(true);
    f.shutdown(); s.create(); const fresh = s['rewardTransaction']!, api = window.__NEBULA_DEV__!; api.forceLevelUp();
    const before = api.snapshot(), p = s['rewardPresentation']!; callbacks.forEach(fn => fn());
    expect(() => old.reward.snapshot()).toThrow('disposed RewardTransaction'); expect(copy?.candidates).toHaveLength(3);
    expect(fresh).not.toBe(old.reward); expect(api.snapshot()).toEqual(before); expect(p.texts[1].listenerCount('pointerdown')).toBe(1);
  });
  it('rejects exhausted ordinal openability before any Reward draw, UI, pause or input change', () => {
    const { scene: s } = fixture(); s['playerProgression']!.creditXp(5); const owner = s['rewardTransaction']!, draws = spyStreams(s);
    owner['ordinal'] = Number.MAX_SAFE_INTEGER;
    expect(() => s['enterLevelUpPause']()).toThrow('ordinal exhausted'); expect(s['run']!.state).toBe('RUNNING');
    expect(s['levelUpPresentation']).toHaveLength(0); expect(s['rewardPresentation']).toBeUndefined(); expect(owner.snapshot()).toBeNull();
    for (const draw of draws) expect(draw).not.toHaveBeenCalled();
  });
});


describe('GAME-054 remaining preflight boundaries', () => {
  it('refuses the next exhausted ordinal before current effect/pending/observer/UI mutation', () => {
    const { scene: s, api } = fixture(); s['rewardTransaction']!['ordinal'] = Number.MAX_SAFE_INTEGER - 1;
    s['playerProgression']!.creditXp(15); s['enterLevelUpPause']();
    const p = s['rewardPresentation']!, text = p.texts[1], before = api.snapshot(), pending = s['playerProgression']!.snapshot(), draws = spyStreams(s);
    expect(p.token.offerId).toBe(Number.MAX_SAFE_INTEGER); expect(() => text.emit('pointerdown')).toThrow('ordinal exhausted');
    expect(api.snapshot()).toEqual(before); expect(s['playerProgression']!.snapshot()).toEqual(pending);
    expect(text.listenerCount('pointerdown')).toBe(1); expect(s['laserRanks'].power).toBe(0);
    for (const draw of draws) expect(draw).not.toHaveBeenCalled();
  });
  it('a false actual Build application leaves the same Hull choice live for a real retry', () => {
    const { scene: s, api } = fixture(), rng = vi.spyOn(s['runRandom']!.reward, 'next').mockReturnValue(0);
    api.forceLevelUp(); rng.mockRestore(); const p = s['rewardPresentation']!, text = p.texts[2];
    const before = api.snapshot(), build = s['playerBuild']!, preview = build.previewPrototypeHullPlating();
    const apply = vi.spyOn(build, 'applyPrototypeHullPlating').mockReturnValueOnce(false);
    text.emit('pointerdown'); expect(api.snapshot()).toEqual(before); expect(text.listenerCount('pointerdown')).toBe(1);
    text.emit('pointerdown'); expect(build.getEffectiveStats()).toEqual(preview); expect(s['moduleLevels'].hull).toBe(1);
    expect(s['playerProgression']!.snapshot().pendingLevels).toBe(0); expect(apply).toHaveBeenCalledTimes(2); apply.mockRestore();
  });
  it('infeasible Hull preview filters only that candidate; disposed Build errors remain loud', () => {
    const { scene: s, api } = fixture(); s['playerBuild'] = new PlayerBuild({ ...new PlayerBuild().getBaseStats(), hull: Number.MAX_SAFE_INTEGER });
    const read = s['rewardContext'](s['playerBuild']!); expect(read.hullPreview).toBeNull(); expect(read.thrusterPreview).not.toBeNull();
    api.forceLevelUp(); expect([...s['levelUpChoices'].values()]).not.toContain('passive.hull');
    s['playerBuild']!.dispose(); expect(() => s['rewardContext'](s['playerBuild']!)).toThrow('disposed PlayerBuild');
  });
});


describe('GAME-055 real generator integration', () => {
  it('constructs policy in PREPARING, acknowledges real UI/present before offered observation', () => {
    const f=fixture(),s=f.scene;allowCreate(s);s.create();const api=window.__NEBULA_DEV__!;
    const g=s['levelUpGenerator']!, trace:string[]=[], original=g.recordPresented.bind(g);
    expect(g.snapshot()).toMatchObject({misses:0,history:[],hasGenerated:false,lastPresented:0});
    const ack=vi.spyOn(g,'recordPresented').mockImplementation(id=>{
      expect(s['rewardPresentation']!.generator).toBe(g);expect(s['rewardTransaction']!.snapshot()?.phase).toBe('PRESENTED');
      expect(s['rewardPresentation']!.texts).toHaveLength(4);expect(s['rewardPresentation']!.handlers.size).toBe(3);
      trace.push('ack');return original(id);
    });
    const observe=vi.spyOn(s['runDiagnostics']!,'recordLevelUpOffered').mockImplementation(()=>{
      expect(g.snapshot().hasGenerated).toBe(false);expect(g.snapshot().lastPresented).toBe(1);trace.push('observe');return true;
    });
    const draws=spyStreams(s);expect(api.forceLevelUp()).toBe(true);
    expect(trace).toEqual(['ack','observe']);expect(draws.map(d=>d.mock.calls.length)).toEqual([0,3,0,0]);
    expect(g.snapshot().history[0]).toEqual(s['rewardTransaction']!.snapshot()!.candidates.map(c=>c.id));ack.mockRestore();observe.mockRestore();
  });
  it('rejects insufficient policy pool before RNG, pause, UI and transaction writes',()=>{
    const {scene:s}=fixture();s['playerProgression']!.creditXp(5);
    setLaser(s, {power:2,fireRate:2,speed:2});setMissile(s);s['droneRanks']={boltPower:2,firingSystem:2,boltPropulsion:2};
    for(const key of Object.keys(s['moduleLevels']))Reflect.set(s['moduleLevels'],key,Number.MAX_SAFE_INTEGER);
    const draws=spyStreams(s),before=s['levelUpGenerator']!.snapshot();
    expect(()=>s['enterLevelUpPause']()).toThrow('Insufficient');expect(s['run']!.state).toBe('RUNNING');expect(s['rewardTransaction']!.snapshot()).toBeNull();
    expect(s['levelUpPresentation']).toHaveLength(0);expect(s['levelUpGenerator']!.snapshot()).toEqual(before);for(const d of draws)expect(d).not.toHaveBeenCalled();
  });
  it('continuous physical32 generates only after selection returns, uses updated Build and commits3 histories/9 draws',()=>{
    const {scene:s}=fixture();const g=s['levelUpGenerator']!, generate=g.generate.bind(g),seen:number[]=[];
    let inSelection=false;const owner=s['rewardTransaction']!, select=owner.trySelect.bind(owner);
    const selecting=vi.spyOn(owner,'trySelect').mockImplementation((...args)=>{inSelection=true;try{return select(...args)}finally{inSelection=false}});
    const generating=vi.spyOn(g,'generate').mockImplementation((c,next)=>{expect(inSelection).toBe(false);seen.push(c.moduleLevels.hull);return generate(c,next)});
    const draws=spyStreams(s);draws[1].mockReturnValue(0);s['playerProgression']!.creditXp(32);s['enterLevelUpPause']();
    for(let i=0;i<3;i++){expect(s['run']!.pauseReasons).toEqual(['REWARD']);s['levelUpPresentation'][2].emit('pointerdown');}
    expect(seen).toEqual([0,1,2]);expect(g.snapshot().lastPresented).toBe(3);expect(g.snapshot().history).toHaveLength(2);
    expect(s['playerProgression']!.snapshot()).toMatchObject({level:4,xp:2,pendingLevels:0});expect(draws.map(d=>d.mock.calls.length)).toEqual([0,9,0,0]);
    selecting.mockRestore();generating.mockRestore();
  });
  it('terminal cancels provisional policy without a miss; native create disposes exact old owner and isolates callbacks',()=>{
    const f=fixture(),s=f.scene;allowCreate(s);s.create();const api=window.__NEBULA_DEV__!;
    api.forceLevelUp();const old=s['levelUpGenerator']!,p=s['rewardPresentation']!,callbacks=[...p.handlers.values()],copy=old.snapshot();
    const before=old.snapshot();s['enterPlayerDeath']();expect(old.snapshot()).toEqual(before);
    f.shutdown();s.create();const fresh=s['levelUpGenerator']!;expect(fresh).not.toBe(old);const initial=fresh.snapshot();
    for(const fn of callbacks)fn();expect(fresh.snapshot()).toEqual(initial);expect(initial).toEqual({misses:0,history:[],primarySignature:[],evolutionCursor:'prism',lastPresented:0,hasGenerated:false});
    expect(()=>old.snapshot()).toThrow('disposed LevelUpGenerator');expect(copy.history).toHaveLength(1);
    fresh.generate({...s['rewardContext'](s['playerBuild']!),weaponFocus:'laser'},()=>0);s['enterPlayerDeath']();expect(fresh.snapshot()).toEqual(initial);
  });
  it('an owner mismatch rejects saved current pointer without redirecting policy',()=>{
    const {scene:s,api}=fixture();api.forceLevelUp();const p=s['rewardPresentation']!,before=p.generator.snapshot(),fresh=new LevelUpGenerator();
    s['levelUpGenerator']=fresh;p.texts[1].emit('pointerdown');expect(p.generator.snapshot()).toEqual(before);expect(fresh.snapshot().history).toEqual([]);
    expect(p.texts[1].listenerCount('pointerdown')).toBe(1);s['levelUpGenerator']=p.generator;p.texts[1].emit('pointerdown');expect(s['playerProgression']!.snapshot().pendingLevels).toBe(0);
  });
});

const russianChoices: [RewardCandidateId, string][] = [
  ["laser.power", "Мощность лазера — +1 к урону"],
  ["laser.fireRate", "Темп лазера — −50 мс (минимум 100 мс)"],
  ["laser.speed", "Скорость лазера — +200 пикс/с"],
  ["missile.warheadPower", "Мощность боеголовки — ранг 1/2\n+1 к урону взрыва"],
  ["missile.propulsion", "Ракетный двигатель — ранг 1/2\n+75 пикс/с к скорости полёта"],
  ["missile.blastExpansion", "Радиус взрыва — ранг 1/2\n+30 пикс к радиусу взрыва"],
  ["drone.boltPower", "Мощность дрона — ранг 1/2\n+1 к урону снаряда"],
  ["drone.firingSystem", "Темп дрона — ранг 1/2\n−150 мс к интервалу выстрелов"],
  ["drone.boltPropulsion", "Скорость снарядов дрона — ранг 1/2\n+200 пикс/с к скорости снарядов"],
  ["passive.hull", "Бронепокрытие — ур. 1\n+1 к макс. здоровью / восстановить 1"],
  ["passive.thruster", "Маневровый двигатель — ур. 1\n+30 пикс/с к обычному движению"],
  ["passive.collector", "Поле сбора — ур. 1\n+40 пикс к радиусу притяжения опыта"],
  ["passive.combat", "Боевой процессор — ур. 1\n+0,25 к множителю урона оружия"],
  ["passive.spatial", "Усилитель взрыва — ур. 1\n+15 пикс к радиусу взрыва ракет"],
  ["passive.replication", "Матрица репликации — ур. 1\n+1 пикс к радиусу снаряда дрона"],
  ["prism", "ЭВОЛЮЦИЯ: Призменный лазер\nТри луча — полный урон лазера у каждого"],
  ["cluster", "ЭВОЛЮЦИЯ: Кассетная ракета\nОсновной взрыв + 6 дополнительных взрывов"],
  ["twin", "ЭВОЛЮЦИЯ: Парные дроны\nВторой дрон напротив, синхронные выстрелы"],
  ["laser.specialize.scatter", "Дробовой излучатель\nБлижний веер из 3 снарядов; урон ×0,5; интервал ×1,25."],
  ["laser.specialize.repeater", "Скорострельный излучатель\nЧастые выстрелы: урон ×0,4; интервал ×0,35."],
  ["laser.specialize.lance", "Пробивное копьё\nУрон ×2; интервал ×1,75; до 3 целей насквозь."],
  ["laser.scatter.damage", "Усиленная дробь\nУрон снаряда: ×0,5 → ×0,65."],
  ["laser.scatter.focus", "Суженный веер\nШаг веера: 15° → 12°."],
  ["laser.scatter.range", "Продлённый импульс\nВремя полёта: 500 → 650 мс."],
  ["laser.scatter.impact", "Отталкивающая дробь\nСила отбрасывания: 300 → 400."],
  ["laser.scatter.capstone", "ВЕРШИНА: Насыщенный залп\nСнарядов в залпе: 3 → 5."],
  ["laser.repeater.damage", "Усилитель импульса\nУрон снаряда: ×0,4 → ×0,5."],
  ["laser.repeater.cadence", "Ускоренный цикл\nИнтервал выстрелов: ×0,35 → ×0,30."],
  ["laser.repeater.velocity", "Быстрые импульсы\nСкорость снаряда: ×1 → ×1,2."],
  ["laser.repeater.impact", "Отталкивающие импульсы\nСила отбрасывания: 80 → 120."],
  ["laser.repeater.capstone", "ВЕРШИНА: Непрерывная серия\nИнтервал выстрелов: ×0,30 → ×0,25."],
  ["laser.lance.damage", "Заряженное копьё\nУрон снаряда: ×2 → ×2,5."],
  ["laser.lance.velocity", "Ускоренное копьё\nСкорость снаряда: ×1,5 → ×2."],
  ["laser.lance.penetration", "Сквозное пробитие\nЦелей насквозь: 3 → 4."],
  ["laser.lance.radius", "Широкое копьё\nРадиус снаряда: 6 → 8 пикс."],
  ["laser.lance.capstone", "ВЕРШИНА: Глубокое пробитие\nЦелей насквозь: 4 → 5."],
];
describe('UI-001 Russian production presentation', () => {
  it.each(russianChoices)('presents and accepts canonical %s through the real transaction', (id, expected) => {
    const { scene: s, api } = fixture();
    const candidate = rewardChoices.find(c => choiceIdentity(c) === id)!;
    if (candidate.kind === 'laserDevelopment' || candidate.kind === 'laserCapstone') {
      setLaser(s, { power: 2, fireRate: 1, speed: 0 });
      s['playerBuild']!.applyLaserChoice({ kind: 'laserSpecialization', branch: candidate.branch }, 0);
      if (candidate.kind === 'laserCapstone') for (const c of rewardChoices) {
        if (c.kind === 'laserDevelopment' && c.branch === candidate.branch) s['playerBuild']!.applyLaserChoice(c, 0);
      }
    } else if (candidate.kind === 'laserSpecialization') setLaser(s, { power: 2, fireRate: 1, speed: 0 });
    else if (id === 'prism') { setLaser(s); s['moduleLevels'].combat = 1; }
    else if (id === 'cluster') {
      setMissile(s); s['moduleLevels'].spatial = 1;
    } else if (id === 'twin') {
      s['droneRanks'] = { boltPower: 2, firingSystem: 2, boltPropulsion: 2 }; s['moduleLevels'].replication = 1;
    }
    const timers = [...s['gameplayTimers']], rng = spyStreams(s);
    const roll = ['prism', 'cluster', 'twin'].includes(id) ? undefined : aimChoice(s, id, candidate.kind === 'passive' ? 1 : 0);
    expect(api.forceLevelUp()).toBe(true); roll?.mockRestore();
    expect(s['levelUpPresentation'][0].text).toBe('НОВЫЙ УРОВЕНЬ — ВЫБЕРИТЕ ОДНО');
    expect(s['levelUpChoices'].size).toBe(3);
    const text = [...s['levelUpChoices']].find(([, value]) => value === id)![0];
    expect(text.text).toBe(expected); expect(text.listeners('pointerdown')).toHaveLength(1);
    const stale = text.listeners('pointerdown')[0]; text.emit('pointerdown');
    expect(s['playerProgression']!.snapshot().pendingLevels).toBe(0);
    expect(s['run']!.state).toBe('RUNNING'); expect(text.active).toBe(false);
    expect(s['runDiagnostics']!.snapshot().aggregates.choicesAccepted).toBe(1);
    const after = api.snapshot(); stale(); text.emit('pointerdown'); expect(api.snapshot()).toEqual(after);
    expect(s['gameplayTimers']).toEqual(timers);
    expect(rng[0]).not.toHaveBeenCalled(); expect(rng[2]).not.toHaveBeenCalled(); expect(rng[3]).not.toHaveBeenCalled();
  });
  it('initial guide and exact Russian HUD follow overlay visibility and native create ownership', () => {
    const f = fixture(), s = f.scene; allowCreate(s); s.create(); const guide = s['guide']!;
    expect(guide.text).toBe('Движение: WASD / стрелки. Рывок: пробел. Пауза: Esc.\n'
      + 'Оружие стреляет автоматически. Собирайте опыт и выбирайте улучшения.\nВыживайте и победите Стража.');
    expect(s['hud']!.text).toEqual(['Здоровье: 5/5', 'Опыт: 0/5', 'Уровень: 1', 'Рывок: ГОТОВ']);
    s['handlePauseRequest'](); expect(guide.visible).toBe(false);
    expect(s['pausePresentation']!.text).toBe('ПАУЗА\nEsc — продолжить');
    s['handlePauseRequest'](); expect(guide.visible).toBe(true);
    const roll = aimChoice(s, 'passive.hull', 1);
    expect(window.__NEBULA_DEV__!.forceLevelUp()).toBe(true); roll.mockRestore(); expect(guide.visible).toBe(false);
    const hull = [...s['levelUpChoices']].find(([, id]) => id === 'passive.hull')![0];
    hull.emit('pointerdown'); expect(guide.visible).toBe(true);
    s['enterPlayerDeath'](); expect(guide.visible).toBe(false);
    expect(f.created.some(t => t.text === 'КОРАБЛЬ УНИЧТОЖЕН')).toBe(true);
    expect(f.created.some(t => t.text === 'ПОВТОРИТЬ')).toBe(true);
    f.shutdown(); s.create(); expect(s['guide']).not.toBe(guide); expect(s['guide']!.visible).toBe(true);
    expect(s['gameplayTimers']).toHaveLength(5); expect(Object.keys(window.__NEBULA_DEV__!)).toHaveLength(5);
  });
  it('Victory labels show the actual level without changing terminal authority', () => {
    const f = fixture(), s = f.scene; s['playerProgression']!.creditXp(32);
    s['bossDefeated'] = true; s['enterRunVictory']();
    expect(s['victoryPresentation'].map(t => t.text)).toEqual([
      'ПОБЕДА', 'СТРАЖ УНИЧТОЖЕН', 'ДОСТИГНУТ УРОВЕНЬ: 4', 'НОВЫЙ ЗАБЕГ']);
    expect(s['run']!.outcome).toBe('VICTORY');
  });
});

describe('HOMEWORK-001 expanded Laser transaction continuity', () => {
  it('rejected expanded specialization retains the exact Text/handler/token then accepts one real retry', () => {
    const { scene: s, api } = fixture(); setLaser(s, { power: 2, fireRate: 1, speed: 0 });
    const roll = aimChoice(s, 'laser.specialize.scatter', 0); api.forceLevelUp(); roll.mockRestore();
    const p = s['rewardPresentation']!, text = [...p.choices].find(([, id]) => id === 'laser.specialize.scatter')![0];
    expect(text.text).toBe('Дробовой излучатель\nБлижний веер из 3 снарядов; урон ×0,5; интервал ×1,25.');
    const handler = p.handlers.get(text)!, before = api.snapshot(), pending = p.progression.snapshot(), history = p.generator.snapshot();
    const draws = spyStreams(s), apply = vi.spyOn(p.build, 'applyLaserChoice').mockReturnValueOnce(false);
    text.emit('pointerdown');
    expect(api.snapshot()).toEqual(before); expect(p.progression.snapshot()).toEqual(pending); expect(p.generator.snapshot()).toEqual(history);
    expect(s['rewardPresentation']).toBe(p); expect(text.active).toBe(true);
    expect(p.handlers.get(text)).toBe(handler); expect(text.listeners('pointerdown')).toEqual([handler]);
    expect(s['rewardPresentation']!.token).toBe(p.token);
    text.emit('pointerdown'); expect(s['playerBuild']!.snapshot().laser.form).toBe('SCATTER');
    expect(p.progression.snapshot().pendingLevels).toBe(0); expect(s['run']!.state).toBe('RUNNING');
    expect(apply).toHaveBeenCalledTimes(2); expect(text.active).toBe(false);
    const accepted = api.snapshot(); handler(); text.emit('pointerdown'); expect(api.snapshot()).toEqual(accepted);
    for (const draw of draws) expect(draw).not.toHaveBeenCalled(); apply.mockRestore();
  });
  it('physical32 opens an expanded specialization then preserves pending3/three choices/nine draws', () => {
    const { scene: s, api } = fixture(); setLaser(s, { power: 2, fireRate: 1, speed: 0 });
    const timers = [...s['gameplayTimers']], random = s['runRandom']!, draws = spyStreams(s);
    s['xpPickups'].push({ run: s['run']!, value: 32, speed: 0,
      visual: visual(2400, 1350, 10) as unknown as Phaser.GameObjects.Arc });
    s['updateXpPickups'](0);
    expect(s['playerProgression']!.snapshot()).toEqual({ level: 4, xp: 2, threshold: 20, pendingLevels: 3 });
    expect(s['levelUpPresentation'][1].text.split('\n')).toHaveLength(2);
    for (let pending = 3; pending > 0; pending--) {
      expect(s['run']!.pauseReasons).toEqual(['REWARD']); expect(s.time.paused).toBe(true);
      expect(s['playerProgression']!.snapshot().pendingLevels).toBe(pending);
      const text = s['levelUpPresentation'][1], callback = text.listeners('pointerdown')[0];
      text.emit('pointerdown'); const after = api.snapshot(); callback(); expect(api.snapshot()).toEqual(after);
    }
    expect(draws.map(d => d.mock.calls.length)).toEqual([0, 9, 0, 0]);
    expect(s['run']!.state).toBe('RUNNING'); expect(s['gameplayTimers']).toEqual(timers);
    expect(s['runRandom']).toBe(random); expect(Object.keys(api)).toHaveLength(5);
    expect(api.snapshot()!.diagnostics.aggregates).toMatchObject({ xpCollected: 32, xpDevCredited: 0, choicesAccepted: 3 });
  });
  it('expanded offer terminal/disposal handlers cannot mutate a native fresh run', () => {
    const f = fixture(), s = f.scene; allowCreate(s); s.create(); const oldRun = s['run']!;
    setLaser(s, { power: 2, fireRate: 1, speed: 0 }); window.__NEBULA_DEV__!.forceLevelUp();
    const p = s['rewardPresentation']!, callbacks = [...p.handlers.values()];
    expect(p.texts[1].text).toContain('\n'); s['enterPlayerDeath']();
    expect(p.texts.every(t => !t.active)).toBe(true); expect(s['run']!.outcome).toBe('DEATH');
    f.shutdown(); s.create(); const api = window.__NEBULA_DEV__!, before = api.snapshot();
    for (const callback of callbacks) callback();
    expect(api.snapshot()).toEqual(before); expect(oldRun.state).toBe('DISPOSED');
    expect(s['run']).not.toBe(oldRun); expect(s['gameplayTimers']).toHaveLength(5);
  });
});
