import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameplayScene } from './GameplayScene';
import { RunLifecycle } from '../run/RunLifecycle';
import { RunRandom } from '../run/RunRandom';
import { RunDiagnostics } from '../run/RunDiagnostics';
import { PlayerBuild, TAG_IDS, type BuildSnapshot } from '../player/PlayerBuild';

class EventEmitter {
  private callbacks = new Map<string, Set<(...args: unknown[]) => void>>();
  on(event: string, fn: (...args: unknown[]) => void) {
    if (!this.callbacks.has(event)) this.callbacks.set(event, new Set());
    this.callbacks.get(event)!.add(fn); return this;
  }
  off(event: string, fn: (...args: unknown[]) => void) { this.callbacks.get(event)?.delete(fn); return this; }
  emit(event: string, ...args: unknown[]) { for (const fn of this.listeners(event)) fn(...args); }
  listeners(event: string) { return [...this.callbacks.get(event) ?? []]; }
}

function visual(x = 0, y = 0, radius = 0) {
  const callbacks = new Map<string, () => void>();
  const object = {
    x, y, radius, width: 40, height: 48, lineWidth: 2, text: '', active: true,
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
    playerBuild: new PlayerBuild(), playerHealth: 5,
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
beforeEach(() => { vi.stubGlobal('window', {}); vi.stubGlobal('document', { hasFocus: () => true, hidden: false }); });
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
    for (const callback of lifecycleCallbacks.slice(0, 6)) callback();
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
    if (guard === 'pause') scene['run']!.requestPause('REWARD');
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
    expect(s['laserRanks'].power).toBe(1);
    expect(draws.map(draw => draw.mock.calls.length)).toEqual([0, 2, 0, 0]);
    s['isLevelUpPaused'] = true; expect(s['isSimulationPaused']()).toBe(false);
  });
  it('manual Escape freezes simulation and held movement until release/repress, no new RNG', () => {
    const f = inputFixture(), s = f.scene, draws = spyStreams(s);
    f.down('W'); s.update(0, 10); expect(s['player']!.y).toBe(1347);
    f.escape(); const y = s['player']!.y;
    expect(s['run']!.pauseReasons).toEqual(['MANUAL']); expect(s.time.paused).toBe(true);
    expect(s['pausePresentation']!.text).toBe('PAUSED\nESC to resume');
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
    s['createEnemy'](2500, 1350, 'shooter'); s['currentTarget'] = s['enemies'][0];
    s['fireLaser'](); s['fireMissile'](); s['fireHostileProjectile']();
    s['xpPickups'] = [{ visual: visual(2400, 1350), value: 5, speed: 0 } as unknown as (typeof s)['xpPickups'][number]];
    s['playerDamageProtectionRemaining'] = 200; f.escape();
    const state = () => JSON.stringify({ snapshot: f.api.snapshot(), drone: s['droneAngle'], dash: s['dashRemaining'],
      enemies: s['enemies'], projectiles: s['projectiles'], missiles: s['missiles'], pickups: s['xpPickups'] });
    const before = state(), draws = spyStreams(s);
    s.update(0, 5000); s['spawnEnemy'](); s['fireLaser'](); s['fireMissile'](); s['fireDrone'](); s['fireHostileProjectile']();
    s['updateProjectiles'](5000); s['updateMissiles'](5000); s['updateXpPickups'](5000); s['updatePlayerContact'](); s['damagePlayer'](100);
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
    f.api.forceLevelUp(); const choice = s['levelUpPresentation'][1];
    s['acceptLevelUpChoice'](choice, weapon === 'laser' ? { kind: 'laser', upgrade: 'fireRate' } : { kind: 'drone', upgrade: 'firingSystem' });
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
  const shot = (s: GameplayScene) => s['launchPlayerProjectile']({ x: 2800, y: 1350 }, { x: 1, y: 0 }, 1, 1200, 2000, 6, 0xffffff);
  const boss = (s: GameplayScene) => { s['createEnemy'](2800, 1350, 'boss'); const e = s['enemies'].at(-1)!; e.health = 1; return e; };
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
    for (let i = 0; i < 30; i++) { s['enemies'] = []; s['spawnEnemy'](); }
    const d = s['runDiagnostics']!.snapshot();
    expect(d.aggregates.spawned).toEqual({ total: 30, byArchetype: { chaser: 20, shooter: 5, tank: 4, boss: 1 }, eliteTanks: 2 });
    s['spawnEnemy'](); expect(s['runDiagnostics']!.snapshot()).toEqual(d);
    expect(s['successfulTimedSpawns']).toBe(30);
    const other = fixture(); expect(other.api.spawnWarden()).toBe(true); expect(other.api.spawnWarden()).toBe(false);
    expect(other.api.snapshot()!.diagnostics.aggregates.spawned.byArchetype.boss).toBe(1);
    expect(other.scene['successfulTimedSpawns']).toBe(0);
    const capped = fixture(); for (let i = 0; i < 10; i++) capped.scene['createEnemy'](100, 100, 'chaser');
    const before = capped.api.snapshot()!.diagnostics; capped.scene['spawnEnemy'](); expect(capped.api.snapshot()!.diagnostics).toEqual(before);
  });
  it('actual nonlethal/hit/removal records a kill/drop once, Boss aggregates precede atomic terminal', () => {
    const { scene: s, api } = fixture();
    s['createEnemy'](2800, 1350, 'chaser'); const enemy = s['enemies'][0]; shot(s); s['updateProjectiles'](0);
    expect(api.snapshot()!.diagnostics.aggregates.killed.total).toBe(0);
    enemy.health = 1; shot(s); s['updateProjectiles'](0); s['killEnemy'](enemy);
    expect(api.snapshot()!.diagnostics.aggregates).toMatchObject({ killed: { total: 1 }, xpDropped: 1 });
    const other = fixture(); const e = boss(other.scene); shot(other.scene); other.scene['updateProjectiles'](0);
    const d = other.api.snapshot()!.diagnostics;
    expect(e.visual.active).toBe(false); expect(d.aggregates).toMatchObject({ killed: { byArchetype: { boss: 1 } }, xpDropped: 10 });
    expect(d.timeline.at(-1)).toMatchObject({ type: 'TERMINAL', outcome: 'VICTORY' });
    expect(d.timeline.filter(row => row.type === 'TERMINAL')).toHaveLength(1);
  });
  it('counts accepted actual HP loss, ignores GodMode/protection/pause and clamps lethal damage before terminal', () => {
    const { scene: s, api } = fixture(); api.setGodMode(true); s['damagePlayer'](3); api.setGodMode(false);
    s['damagePlayer'](0.5); s['damagePlayer'](3);
    expect(api.snapshot()!.diagnostics.aggregates).toMatchObject({ acceptedDamagingHits: 1, hpLost: 0.5 });
    s['handlePauseRequest'](); s['damagePlayer'](100); s['canResume'] = () => true; s['handlePauseRequest']();
    s['playerDamageProtectionRemaining'] = 0; s['damagePlayer'](100);
    const d = api.snapshot()!.diagnostics;
    expect(d.aggregates).toMatchObject({ acceptedDamagingHits: 2, hpLost: 5 });
    expect(d.timeline.at(-1)).toMatchObject({ type: 'TERMINAL', outcome: 'DEATH' });
    s['enterRunVictory'](); s['enterPlayerDeath'](); expect(api.snapshot()!.diagnostics).toEqual(d);
  });
  it('common XP credit splits real pickup/DEV, preserving drop/credit/pause and no duplicate collection', () => {
    const { scene: s, api } = fixture(); s['createEnemy'](2400, 1350, 'tank', true); s['killEnemy'](s['enemies'][0]);
    s['updateXpPickups'](0); s['updateXpPickups'](0);
    expect(api.snapshot()!.diagnostics.aggregates).toMatchObject({ xpDropped: 5, xpCollected: 5, xpCredited: 5, xpDevCredited: 0, levelsGained: 1, offersPresented: 1 });
    s['levelUpPresentation'][1].emit('pointerdown'); api.forceLevelUp();
    expect(api.snapshot()!.diagnostics.aggregates).toMatchObject({ xpCredited: 15, xpCollected: 5, xpDevCredited: 10, levelsGained: 2, offersPresented: 2 });
  });
  it('typed offer and once-only selected identity precede resume, stable/rejected reads add nothing', () => {
    const f = inputFixture(), s = f.scene; const draws = spyStreams(s); f.api.forceLevelUp();
    let d = f.api.snapshot()!.diagnostics;
    expect(d.timeline.map(row => row.type)).toEqual(['RUN_STARTED', 'PAUSE_ENTERED', 'LEVEL_UP_OFFERED']);
    expect(d.timeline.at(-1)).toMatchObject({ choices: ['laser.power', 'passive.combat', 'laser.speed'] });
    f.escape(); s.update(0, 3000); f.api.forceLevelUp(); expect(f.api.snapshot()!.diagnostics).toEqual(d);
    const choice = s['levelUpPresentation'][1]; choice.emit('pointerdown');
    s['acceptLevelUpChoice'](choice, { kind: 'laser', upgrade: 'power' });
    d = f.api.snapshot()!.diagnostics;
    expect(d.timeline.slice(-2).map(row => row.type)).toEqual(['LEVEL_UP_SELECTED', 'PAUSE_RESUMED']);
    expect(d.timeline.at(-2)).toMatchObject({ choice: 'laser.power' }); expect(d.aggregates.choicesAccepted).toBe(1);
    expect(draws.map(draw => draw.mock.calls.length)).toEqual([0, 2, 0, 0]);
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
      const next = inputFixture(); next.scene.update(0, 16.5); next.scene['spawnEnemy'](); next.api.forceLevelUp();
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
    for (const callback of cleanups.slice(0, 6)) callback(); for (const callback of callbacks) callback();
    expect(fresh.snapshot()).toEqual(before); expect(before.aggregates.spawned.total).toBe(1); expect(before.timeline).toHaveLength(1);
  });
});


describe('GAME-046 PlayerBuild production consumers', () => {
  function armed() {
    const f = fixture(), s = f.scene;
    s['createEnemy'](3000, 1350, 'chaser'); s['currentTarget'] = s['enemies'][0];
    Object.assign(s, { drone: visual(2510, 1350, 10) }); return f;
  }
  function passive(f: ReturnType<typeof fixture>, module: 'hull' | 'thruster' | 'collector' | 'combat' | 'spatial' | 'replication') {
    const index = ['hull', 'thruster', 'collector', 'combat', 'spatial', 'replication'].indexOf(module);
    const draw = vi.spyOn(f.scene['runRandom']!.reward, 'next').mockReturnValue((index + 0.1) / 6);
    expect(f.api.forceLevelUp()).toBe(true);
    const label = { hull: 'Hull Plating', thruster: 'Thruster Module', collector: 'Collector Field', combat: 'Combat Processor', spatial: 'Spatial Amplifier', replication: 'Replication Matrix' }[module];
    const pick = f.scene['levelUpPresentation'].find(p => p.text.startsWith('Passive: ' + label))!; expect(pick).toBeDefined(); pick.emit('pointerdown'); draw.mockRestore();
  }
  function weaponChoice(f: ReturnType<typeof fixture>, weapon: 'laser' | 'missile' | 'drone', cursor: number) {
    f.scene['weaponFocus'] = weapon; f.scene['focusCursors'][weapon] = cursor;
    expect(f.api.forceLevelUp()).toBe(true); f.scene['levelUpPresentation'][1].emit('pointerdown');
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
    const f = fixture(), s = f.scene; s['playerHealth'] = hp;
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
    f.api.forceLevelUp(); const pick = s['levelUpPresentation'][1], before = f.api.snapshot()!.diagnostics;
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
    s['createEnemy'](3000, 1350, 'tank'); s['fireMissile'](); const next = s['missiles'][0];
    next.visual.x = 3000 - 24 - next.radius; next.visual.y = 1350; s['updateMissiles'](0);
    expect(s['missiles']).toHaveLength(0); expect(s['enemies'][0].health).toBe(2); // Inclusive physical contact, damage4.
  });
  it('actual evolution pointer callbacks keep Prism/Cluster/Twin recipes, slots and attack behavior', () => {
    const f = armed(), s = f.scene;
    s['laserRanks'] = { power: 2, fireRate: 2, speed: 2 }; s['moduleLevels'].combat = 1;
    f.api.forceLevelUp(); expect(offer(s)[2]).toContain('Prism'); s['levelUpPresentation'][3].emit('pointerdown'); s['fireLaser']();
    expect(s['projectiles']).toHaveLength(3); expect(s['projectiles'].every(p => p.damage === 1)).toBe(true);
    s['projectiles'] = []; s['missileRanks'] = { warheadPower: 2, propulsion: 2, blastExpansion: 2 }; passive(f, 'spatial');
    f.api.forceLevelUp(); expect(offer(s)[2]).toContain('Cluster'); s['levelUpPresentation'][3].emit('pointerdown'); s['fireMissile']();
    expect(s['missiles'][0]).toMatchObject({ clusterEnabled: true, explosionRadius: 135 });
    s['droneRanks'] = { boltPower: 2, firingSystem: 2, boltPropulsion: 2 }; passive(f, 'replication');
    f.api.forceLevelUp(); expect(offer(s)[2]).toContain('Twin'); s['levelUpPresentation'][3].emit('pointerdown'); s['fireDrone']();
    expect(s['projectiles']).toHaveLength(2); expect(s['twinDroneEvolved']).toBe(true);
    expect(f.api.snapshot()!.build.slots.combat).toEqual(['LASER', 'MISSILE', 'COMBAT_DRONE']);
  });
  it('unused stats have no gameplay consumer, and no shared Scale leaks into hostile/XP/blast/orbit', () => {
    const f = armed(), s = f.scene, before = f.api.snapshot()!.diagnostics;
    s['applyBuildChange']({ kind: 'percent', stat: 'shieldSystems', delta: 1 }); s['applyBuildChange']({ kind: 'percent', stat: 'impact', delta: 1 }); s['playerBuild']!.addCombatAnalyzerLevels(3);
    s['applyBuildChange']({ kind: 'percent', stat: 'projectileScale', delta: 1 }); s['applyBuildChange']({ kind: 'percent', stat: 'projectileVelocity', delta: 1 });
    s['launchHostileProjectile']({ x: 100, y: 100 }, 1, 0); expect(s['projectiles'][0]).toMatchObject({ damage: 1, radius: 6, velocityX: 600 });
    expect(s['xpMagnetRadius']).toBe(180); expect(s['playerRadius']).toBe(20); expect(s['missileValues'].explosionRadius).toBe(120);
    expect(s['droneConfig']).toMatchObject({ orbitRadius: 110, visualRadius: 10 });
    expect(f.api.snapshot()!.diagnostics).toEqual(before);
  });
  it('rejects unsafe composed damage before any projectile or visual mutation', () => {
    const f = armed(), s = f.scene; passive(f, 'combat');
    s['applyBuildChange']({ kind: 'percent', stat: 'reactorPower', delta: Number.MAX_SAFE_INTEGER - 1 });
    const circle = vi.spyOn(s.add, 'circle');
    for (const fire of [() => s['fireLaser'](), () => s['fireMissile'](), () => s['fireDrone']()]) {
      expect(fire).toThrow('Invalid composed'); expect(s['projectiles']).toHaveLength(0); expect(s['missiles']).toHaveLength(0);
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
    expect(events.map(e => e.elapsed)).toEqual([100, 0, 0, 0, 100]); expect(events.map(e => e.callback)).toEqual(callbacks);
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
    for (const cleanup of cleanups.slice(0, 6)) cleanup();
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
        const tracks = option.kind === 'laser' ? ['power', 'fireRate', 'speed']
          : option.kind === 'missile' ? ['warheadPower', 'propulsion', 'blastExpansion'] : ['boltPower', 'firingSystem', 'boltPropulsion'];
        s['focusCursors'][option.kind] = tracks.indexOf(option.upgrade);
      } else if (option.kind === 'passive') index = 2;
      else {
        index = 3;
        if (option.kind === 'prism') { s['laserRanks'] = { power: 2, fireRate: 2, speed: 2 }; s['moduleLevels'].combat = 1; }
        if (option.kind === 'cluster') { s['missileRanks'] = { warheadPower: 2, propulsion: 2, blastExpansion: 2 }; s['moduleLevels'].spatial = 1; }
        if (option.kind === 'twin') { s['droneRanks'] = { boltPower: 2, firingSystem: 2, boltPropulsion: 2 }; s['moduleLevels'].replication = 1; }
      }
      const before = tagsAndIdentity(build.snapshot()), draws = spyStreams(s);
      if (option.kind === 'passive') {
        const n = ['hull', 'thruster', 'collector', 'combat', 'spatial', 'replication'].indexOf(option.module);
        draws[1].mockReturnValue((n + 0.1) / 6);
      }
      expect(f.api.forceLevelUp()).toBe(true);
      expect(tagsAndIdentity(build.snapshot())).toEqual(before);
      expect(draws[1]).toHaveBeenCalledTimes(index === 3 ? 1 : 2);
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
      expect(draws[1]).toHaveBeenCalledTimes(index === 3 ? 1 : 2);
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
