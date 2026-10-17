import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameplayScene } from './GameplayScene';
import { RunLifecycle } from '../run/RunLifecycle';
import { RunRandom } from '../run/RunRandom';

function visual(x = 0, y = 0) {
  const callbacks = new Map<string, () => void>();
  const object = {
    x, y, width: 40, height: 48, lineWidth: 2, text: '', active: true,
    setStrokeStyle() { return this; }, setFillStyle() { return this; },
    setAlpha() { return this; }, setScrollFactor() { return this; }, setDepth() { return this; },
    setText(text: string) { this.text = text; return this; },
    setOrigin() { return this; }, setInteractive() { return this; },
    once(key: string, callback: () => void) { callbacks.set(key, callback); return this; },
    emit(key: string) { const fn = callbacks.get(key); callbacks.delete(key); fn?.(); return this; },
    destroy() { this.active = false; },
  };
  return object;
}
vi.mock('phaser', () => ({
  Scene: class {},
  Math: { Vector2: class { set() { return this; } }, Clamp: (n: number, a: number, b: number) => Math.max(a, Math.min(b, n)),
    Distance: { Between: (x: number, y: number, a: number, b: number) => Math.hypot(x - a, y - b) } },
  Scenes: { Events: { SHUTDOWN: 'shutdown', DESTROY: 'destroy' } },
}));

function fixture() {
  const scene = new GameplayScene();
  const listeners = new Map<string, Set<() => void>>();
  const created: ReturnType<typeof visual>[] = [];
  const run = new RunLifecycle();
  run.start();
  Object.assign(scene, {
    run,
    runRandom: new RunRandom(0),
    cameras: { main: { worldView: { left: 1440, right: 3360, top: 810, bottom: 1890 } } },
    player: visual(2400, 1350), scale: { width: 1920, height: 1080 },
    add: {
      text: (_x: number, _y: number, text: string) => {
        const item = Object.assign(visual(), { text }); created.push(item); return item;
      },
      circle: (x: number, y: number) => visual(x, y),
      polygon: (x: number, y: number) => visual(x, y),
    },
    events: {
      once: (key: string, fn: () => void) => {
        if (!listeners.has(key)) listeners.set(key, new Set());
        listeners.get(key)!.add(fn);
      },
      off: (key: string, fn: () => void) => listeners.get(key)?.delete(fn),
    },
    gameplayTimers: Array.from({ length: 5 }, () => ({ callback: () => {}, elapsed: 123 })),
  });
  scene['publishDevTools']();
  return { scene, api: window.__NEBULA_DEV__!, created,
    shutdown: () => { for (const fn of [...listeners.get('shutdown') ?? []]) fn(); } };
}
beforeEach(() => { vi.stubGlobal('window', {}); });
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
    scene['playerExperience'] = { level: 2, xp: 7 };
    expect(api.forceLevelUp()).toBe(true);
    expect(scene['playerExperience']).toEqual({ level: 3, xp: 0 });
    expect(scene['levelUpPresentation']).toHaveLength(4);
    expect(api.snapshot()!.isLevelUpPaused).toBe(true);
    expect(api.forceLevelUp()).toBe(false);
    expect(scene['levelUpPresentation']).toHaveLength(4);
  });
  it('normal collected pickup is credited/removed before the real choice pause', () => {
    const { scene } = fixture();
    const pickup = { visual: visual(2400, 1350), value: 5, speed: 0 };
    scene['xpPickups'] = [pickup as unknown as (typeof scene)['xpPickups'][number]];
    scene['updateXpPickups'](0);
    expect(scene['playerExperience']).toEqual({ level: 2, xp: 0 });
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
    for (let i = 0; i < 10; i++) scene['createEnemy'](100, 100, 'chaser');
    expect(api.spawnWarden()).toBe(false);
    scene['enemies'] = [];
    scene['bossDefeated'] = true;
    expect(api.spawnWarden()).toBe(false);
    scene['bossDefeated'] = false;
    scene['createEnemy'](100, 100, 'boss');
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
    scene['createEnemy'](2400, 1350, 'chaser');
    scene['updatePlayerContact']();
    expect(scene['playerHealth']).toBe(5);
    expect(scene['player']!.x).toBe(2400);
    scene['launchHostileProjectile']({ x: 2400, y: 1350 }, 1, 0);
    scene['updateProjectiles'](0);
    expect(scene['projectiles']).toHaveLength(0);
    expect(scene['playerDamageProtectionRemaining']).toBe(0);
    scene['playerDamageProtectionRemaining'] = 50;
    scene['damagePlayer'](1);
    expect(scene['playerDamageProtectionRemaining']).toBe(50);
    api.setGodMode(false);
    scene['playerDamageProtectionRemaining'] = 0;
    scene['updatePlayerContact']();
    expect(scene['playerHealth']).toBe(4);
    expect(scene['playerDamageProtectionRemaining']).toBe(500);
  });
  it.each(['isPlayerDead', 'isRunVictorious', 'isLevelUpPaused'] as const)('rejects all mutations during %s but allows snapshots', key => {
    const { scene, api } = fixture();
    if (key === 'isLevelUpPaused') scene[key] = true;
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
    Object.assign(scene.add, { graphics: () => ({ fillStyle() {}, fillCircle() {}, lineStyle() {}, strokeRect() {} }) });
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
    scene['launchPlayerProjectile']({ x, y: 1350 }, { x: 1, y: 0 }, damage, 1200, 2000, 6, 0xffffff);
    return scene['projectiles'].at(-1)!;
  }
  function boss(scene: GameplayScene, x = 2800) {
    scene['createEnemy'](x, 1350, 'boss');
    const enemy = scene['enemies'].at(-1)!;
    enemy.health = 1;
    return enemy;
  }
  it('real lethal damage accepts one Death/presentation, rejects conflicting/duplicate terminal UI', () => {
    const { scene, api, created } = fixture();
    scene['damagePlayer'](100);
    expect([scene['run']!.state, scene['run']!.outcome]).toEqual(['TERMINAL', 'DEATH']);
    expect([scene['isPlayerDead'], scene['isRunVictorious'], scene['isSimulationPaused']()]).toEqual([true, false, true]);
    scene['enterPlayerDeath']();
    scene['bossDefeated'] = true;
    scene['enterRunVictory']();
    expect(created.filter(t => t.text === 'SHIP DESTROYED')).toHaveLength(1);
    expect(created.filter(t => t.text === 'RETRY')).toHaveLength(1);
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
    scene['damagePlayer'](100);
    expect(scene['victoryPresentation']).toEqual(ui);
    expect(scene['playerHealth']).toBe(5);
    expect(run.outcome).toBe('VICTORY');
  });
  it.each(['missile', 'cluster-primary', 'cluster-satellite'] as const)('%s completes whole detonation before Victory', mode => {
    const { scene } = fixture();
    const enemy = boss(scene, mode === 'cluster-satellite' ? 2980 : 2800);
    scene['createEnemy'](2800, 1350, 'chaser');
    const primary = scene['enemies'].at(-1)!;
    scene['createEnemy'](2980, 1350, 'chaser');
    const satelliteSurvivor = scene['enemies'].at(-1)!;
    scene['clusterEvolved'] = mode !== 'missile';
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
    const hostile = () => scene['launchHostileProjectile']({ x: 2400, y: 1350 }, 1, 0);
    scene['playerHealth'] = 1;
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
  it('ordinary Level-Up remains RUNNING, freezes simulation and resumes via real choice callback', () => {
    const { scene, api } = fixture();
    const projectile = shot(scene);
    expect(api.forceLevelUp()).toBe(true);
    expect([scene['run']!.state, scene['run']!.outcome]).toEqual(['RUNNING', null]);
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
    scene['run'] = new RunLifecycle();
    const p = shot(scene);
    expect(scene['isSimulationPaused']()).toBe(true);
    expect(api.forceLevelUp()).toBe(false);
    scene['updateProjectiles'](100);
    scene['damagePlayer'](1);
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
    Object.assign(scene.add, { graphics: () => ({ fillStyle() {}, fillCircle() {}, lineStyle() {}, strokeRect() {} }) });
    scene.create();
    const old = scene['run']!;
    const oldRandom = scene['runRandom']!;
    const oldStream = oldRandom.encounter;
    const oldApi = window.__NEBULA_DEV__!;
    expect([old.state, old.outcome]).toEqual(['RUNNING', null]);
    expect([scene['drone']!.x, scene['drone']!.y]).toEqual([scene['player']!.x + 110, scene['player']!.y]);
    scene['damagePlayer'](100);
    const retry = created.find(t => t.text === 'RETRY')!;
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
    for (const callback of lifecycleCallbacks.slice(0, 3)) callback();
    for (const callback of callbacks) callback();
    expect(encounter).not.toHaveBeenCalled();
    expect(reward).not.toHaveBeenCalled();
    expect(() => freshRandom.world.next()).not.toThrow();
    expect(scene['enemies']).toHaveLength(1);
    expect(scene['projectiles']).toHaveLength(0);
    expect(fresh.state).toBe('RUNNING');
    // Even if the new run dies, the old retained RETRY cannot restart it.
    scene['damagePlayer'](100);
    retry.emit('pointerdown');
    expect(restart).not.toHaveBeenCalled();
  });
});

function allowCreate(scene: GameplayScene) {
  Object.assign(scene, {
    cameras: { main: { setBackgroundColor() {}, setBounds() {}, startFollow() {}, centerOn() {} } },
    input: {}, time: { addEvent: (config: object) => ({ ...config, elapsed: 0 }) },
  });
  Object.assign(scene.add, { graphics: () => ({ fillStyle() {}, fillCircle() {}, lineStyle() {}, strokeRect() {} }) });
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
    for (let i = 0; i < 4; i++) { a['spawnEnemy'](); b['spawnEnemy'](); }
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
    if (guard === 'cap') for (let i = 0; i < 10; i++) scene['createEnemy'](100, 100, 'chaser');
    if (guard === 'pause') scene['isLevelUpPaused'] = true;
    if (guard === 'PREPARING') scene['run'] = new RunLifecycle();
    if (guard === 'TERMINAL') scene['run']!.tryEnterTerminal('VICTORY');
    if (guard === 'DISPOSED') scene['run']!.dispose();
    if (guard === 'no player') scene['player'] = undefined;
    if (guard === 'Warden') scene['createEnemy'](100, 100, 'boss');
    const count = scene['enemies'].length, draws = spyStreams(scene);
    scene['spawnEnemy']();
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
      scene['enemies'] = []; scene['spawnEnemy']();
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
    scene['spawnEnemy'](); expect(draw).toHaveBeenCalledTimes(60);
  });
  it('clamps accepted normal and Warden placements at their existing arena margins', () => {
    const { scene } = fixture();
    Object.assign(scene.cameras.main, { worldView: { left: -200, right: -100, top: -200, bottom: -100 } });
    scene['spawnEnemy']();
    expect([scene['enemies'][0].visual.x, scene['enemies'][0].visual.y]).toEqual([25, 25]);
    scene['enemies'] = []; scene['successfulTimedSpawns'] = 29; scene['spawnEnemy']();
    expect([scene['enemies'][0].visual.x, scene['enemies'][0].visual.y]).toEqual([40, 40]);
  });
  it('pins consecutive real offers and isolates Reward from Encounter/snapshot/duplicate/accepted/stale callbacks', () => {
    const a = fixture(), b = fixture();
    for (let i = 0; i < 100; i++) a.scene['runRandom']!.encounter.next();
    const reward = vi.spyOn(a.scene['runRandom']!.reward, 'next');
    const golden = [
      ['Laser Power — +1 damage', 'Passive: Combat Processor Lv. 1\n+0.25x player weapon damage', 'Laser Projectile Speed — +200 px/s'],
      ['Laser Fire Rate — -50 ms (min 100 ms)', 'Passive: Combat Processor Lv. 1\n+0.25x player weapon damage', 'Laser Power — +1 damage'],
      ['Laser Projectile Speed — +200 px/s', 'Passive: Replication Matrix Lv. 1\n+1 Drone bolt radius', 'Laser Fire Rate — -50 ms (min 100 ms)'],
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
    expect(reward).toHaveBeenCalledTimes(6);
  });
  it.each([false, true])('fully mastered fallback Slot1 uses one draw; eligible evolution=%s removes Slot3 draw', evolution => {
    const { scene, api } = fixture();
    scene['laserRanks'] = { power: 2, fireRate: 2, speed: 2 };
    scene['missileRanks'] = { warheadPower: 2, propulsion: 2, blastExpansion: 2 };
    scene['droneRanks'] = { boltPower: 2, firingSystem: 2, boltPropulsion: 2 };
    if (evolution) scene['moduleLevels'].combat = 1;
    const draw = vi.spyOn(scene['runRandom']!.reward, 'next'); api.forceLevelUp();
    expect(draw).toHaveBeenCalledTimes(evolution ? 2 : 3);
    expect(new Set(offer(scene)).size).toBe(3);
    if (evolution) expect(offer(scene)[2]).toContain('EVOLVE: Prism Laser');
  });
  it('deterministic focus plus guaranteed evolution consumes only passive Slot2', () => {
    const { scene, api } = fixture();
    scene['laserRanks'] = { power: 2, fireRate: 2, speed: 2 }; scene['moduleLevels'].combat = 1;
    const draw = vi.spyOn(scene['runRandom']!.reward, 'next'); api.forceLevelUp();
    expect(draw).toHaveBeenCalledTimes(1); expect(offer(scene)[2]).toContain('EVOLVE: Prism Laser');
  });
  it('snapshot seed is detached/stable with zero draws; World/Boss stay dormant through actual Warden/Level-Up/terminal paths', () => {
    const { scene, api } = fixture(); const draws = spyStreams(scene);
    const snapshot = api.snapshot()!; expect(snapshot.runSeed).toBe(0); snapshot.runSeed = 123;
    expect(api.snapshot()!.runSeed).toBe(0);
    expect(Object.keys(api)).toEqual(['snapshot', 'forceLevelUp', 'spawnWarden', 'setWardenHealth', 'setGodMode']);
    expect(Object.values(api.snapshot()!).every(v => typeof v !== 'function')).toBe(true);
    api.spawnWarden(); api.setWardenHealth(30); scene['fireHostileProjectile']();
    scene['damagePlayer'](1); scene['updateHud']();
    for (const draw of draws) expect(draw).not.toHaveBeenCalled();
    api.forceLevelUp(); scene['levelUpPresentation'][1].emit('pointerdown');
    const before = draws.map(draw => draw.mock.calls.length);
    scene['killEnemy'](scene['enemies'].find(e => e.archetype === 'boss')!);
    scene['enterRunVictory'](); scene['spawnEnemy'](); scene['enterLevelUpPause'](); api.snapshot();
    expect(draws.map(draw => draw.mock.calls.length)).toEqual(before);
    expect(draws[2]).not.toHaveBeenCalled(); expect(draws[3]).not.toHaveBeenCalled();
  });
});
