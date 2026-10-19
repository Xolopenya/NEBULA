import type { DevTools } from '../devTools';
import { RunLifecycle, type PauseReason, type RunState } from '../run/RunLifecycle';
import { RunRandom } from '../run/RunRandom';
import { RunDiagnostics, type ChoiceIdentity } from '../run/RunDiagnostics';
import { KeyboardInput } from '../input/KeyboardInput';
import * as Phaser from 'phaser';
import { createAttack, composePlayerDamage, composePlayerImpact, calculateHitDamage, calculateEnemyDamage,
  type LaserAttack, type DroneAttack, type MissileAttack, type HostileAttack, type ContactAttack,
  type EnemyDamage, type PlayerDamage } from '../combat/combat';
import { segmentCircleHitTime } from '../combat/collision';
import { clusterSatelliteOffsets } from '../combat/clusterSatellites';
import { ENEMY_DEFINITIONS, DEFAULT_ENEMY_SPAWN_CONTEXT, createEnemySpawnSnapshot,
  type EnemyArchetype, type EnemySpawnSnapshot } from '../enemies/EnemyDefinitions';
import { knockbackDirection, withKnockbackImpulse, stepKnockback, type Vector } from '../enemies/knockback';
import { initialChargerState, stepCharger, type ChargerState } from '../enemies/chargerMovement';
import { shooterMovement } from '../enemies/shooterMovement';
import { createEnemyDamageSource, validateEnemyDeathRecord, createEnemyDeathRecord,
  type EnemyDamageSource, type EnemyDeathRecord } from '../enemies/EnemyDeath';
import { shouldSpawnEliteTank } from '../enemies/eliteTank';
import { shouldSpawnWarden, wardenPhase, wardenBurstDirections } from '../enemies/warden';
import { stepDash } from '../player/dash';
import { PlayerBuild, type PercentStatKey } from '../player/PlayerBuild';
import { PlayerDefense } from '../player/PlayerDefense';
import { effectiveMissileExplosionRadius } from '../progression/spatialAmplifier';
import { effectiveDroneBoltRadius } from '../progression/replicationMatrix';
import { type MissileRanks, type DroneRanks, type WeaponFocus } from '../progression/focusedUpgrade';
import { laserProfile, laserAttack, isLaserChoice, prepareLaserChoice } from '../player/laserProgression';
import { laserDirections } from '../combat/laserPatterns';
import { addExperience } from '../progression/experience';
import { PlayerProgression } from '../progression/PlayerProgression';
import { planXpConsolidation, XP_CONSOLIDATION_THRESHOLD, XP_CONSOLIDATION_CELL_SIZE } from '../progression/xpConsolidation';

import { RUSSIAN_FONT, UI_TEXT, hudLines, rewardLabel, victoryLevel } from '../ui/russianText';
import { LevelUpGenerator } from '../rewards/LevelUpGenerator';
import { RewardTransaction, type RewardToken } from '../rewards/RewardTransaction';
import { choiceIdentity, type LevelUpChoice, type PassiveModule, type RewardCandidate } from '../rewards/rewardChoices';
import { isRewardEligible, assertRewardFeasible, assertCombatConsumers, type RewardEligibilityContext } from '../rewards/rewardEligibility';

type BuildChange = { kind: 'percent'; stat: PercentStatKey; delta: number } | { kind: 'hullPlating' } | { kind: 'thruster' };
type RewardPresentation = Readonly<{ run: RunLifecycle; progression: PlayerProgression; build: PlayerBuild;
  reward: RewardTransaction; generator: LevelUpGenerator; token: RewardToken; texts: Phaser.GameObjects.Text[];
  choices: Map<Phaser.GameObjects.Text, ChoiceIdentity>; handlers: Map<Phaser.GameObjects.Text, () => void> }>;

function combatValue(value: number, minimum = Number.MIN_VALUE): number {
  if (!Number.isFinite(value) || value < minimum || value > Number.MAX_SAFE_INTEGER) {
    throw new RangeError('Invalid composed player combat value');
  }
  return value;
}

const enemyPresentation = {
  swarm: { points: [0, 12, 12, 0, 24, 12, 12, 24], color: 0x84cc16, outline: 0xd9f99d },
  charger: { points: [0, 0, 44, 22, 0, 44, 10, 22], color: 0xef4444, outline: 0xfecaca },
  chaser: { points: [24, 0, 48, 24, 24, 48, 0, 24], color: 0xf43f5e, outline: 0xffcdd2 },
  shooter: { points: [8, 8, 40, 8, 40, 40, 8, 40], color: 0xa855f7, outline: 0xe9d5ff },
  tank: { points: [12, 4, 36, 4, 48, 24, 36, 44, 12, 44, 0, 24], color: 0xf59e0b, outline: 0xfef3c7 },
  boss: { points: [40, 0, 68, 12, 80, 40, 68, 68, 40, 80, 12, 68, 0, 40, 12, 12], color: 0xd946ef, outline: 0xfae8ff },
} satisfies Record<EnemyArchetype, { points: number[]; color: number; outline: number }>;

const eliteTankData = {
  ...enemyPresentation.tank,
  color: 0xfacc15, outline: 0xfffbeb,
} as const;

const wardenPhaseTwo = { color: 0xdc2626, outline: 0xfb923c } as const;

const timedSpawnSequence: readonly ('chaser' | 'shooter' | 'tank')[] = ['chaser', 'chaser', 'chaser', 'shooter', 'chaser', 'tank'];

type EnemyRuntime = {
  readonly spawnSnapshot: EnemySpawnSnapshot;
  readonly run: RunLifecycle;
  readonly archetype: EnemyArchetype;
  readonly isElite: boolean;
  readonly contactDamage: number;
  readonly xpValue: number;
  readonly collisionRadius: number;
  visual: Phaser.GameObjects.Polygon;
  health: number;
  lastDamagingSource: EnemyDamageSource | null;
  knockbackVelocity: Vector;
  charger?: { state: ChargerState; telegraph: Phaser.GameObjects.Graphics };
};

type ChargeContact = Readonly<{ run: RunLifecycle; position: Vector }>;

type XpPickup = {
  readonly run: RunLifecycle;
  visual: Phaser.GameObjects.Arc;
  value: number;
  speed: number;
};

type Hit = Readonly<{ run: RunLifecycle } & (
  { kind: 'ENEMY_DIRECT'; target: EnemyRuntime; attack: LaserAttack | DroneAttack; direction: Vector; impactFactor?: number }
  | { kind: 'ENEMY_BLAST'; target: EnemyRuntime; attack: MissileAttack; phase: 'PRIMARY' | 'SATELLITE'; origin: Vector }
  | { kind: 'PLAYER_PROJECTILE'; target: PlayerDefense; attack: HostileAttack }
  | { kind: 'PLAYER_CONTACT'; target: PlayerDefense; attack: ContactAttack }
)>;

type EnemyHit = Extract<Hit, { kind: 'ENEMY_DIRECT' | 'ENEMY_BLAST' }>;

function enemyHitSource(hit: EnemyHit): EnemyDamageSource {
  // The closed factory validates the correlated kind/variant/phase combination at runtime.
  return createEnemyDamageSource({ kind: hit.attack.kind, variant: hit.attack.variant,
    phase: hit.kind === 'ENEMY_DIRECT' ? 'DIRECT' : hit.phase } as EnemyDamageSource);
}

function enemyDeathInput(enemy: EnemyRuntime, source: EnemyDamageSource): EnemyDeathRecord {
  const { archetype, isElite, xpValue } = enemy.spawnSnapshot;
  return { archetype, isElite, xpValue, x: enemy.visual.x, y: enemy.visual.y,
    lastDamagingSource: source, killSource: source };
}

type ScatterVolley = { contacts: Map<EnemyRuntime, number>; remaining: number };
type ProjectileRuntime = {
  readonly attack: LaserAttack | DroneAttack | HostileAttack;
  readonly run: RunLifecycle;
  readonly visited?: Set<EnemyRuntime>;
  readonly scatterVolley?: ScatterVolley;
  readonly source: 'player' | 'enemy';
  readonly damage: number;
  readonly radius: number;
  visual: Phaser.GameObjects.Arc;
  velocityX: number;
  velocityY: number;
  remainingLifetime: number;
};

type MissileRuntime = {
  readonly attack: MissileAttack;
  readonly run: RunLifecycle;
  readonly radius: number;
  readonly clusterEnabled: boolean;
  readonly damage: number;
  readonly speed: number;
  readonly explosionRadius: number;
  visual: Phaser.GameObjects.Arc;
  target?: EnemyRuntime;
  headingX: number;
  headingY: number;
  remainingLifetime: number;
};

export class GameplayScene extends Phaser.Scene {
  private godMode = false;
  private gameplayTimers: Phaser.Time.TimerEvent[] = [];
  private player?: Phaser.GameObjects.Polygon;
  private drone?: Phaser.GameObjects.Arc;
  private twinDrone?: Phaser.GameObjects.Arc;
  private twinDroneEvolved = false;
  private droneAngle = 0;
  private readonly droneConfig = {
    orbitRadius: 110, angularSpeed: 2, visualRadius: 10,
    lifetime: 1800, boltRadius: 5,
  } as const;
  private droneAttackValues = { damage: 1, fireInterval: 1200, projectileSpeed: 800 };
  private droneRanks: DroneRanks = { boltPower: 0, firingSystem: 0, boltPropulsion: 0 };
  private droneTimer?: Phaser.Time.TimerEvent;
  private hud?: Phaser.GameObjects.Text;
  private phase: 1 | 2 = 1;
  private phaseElapsedMs = 0;
  private phaseIndicator?: Phaser.GameObjects.Text;
  private phaseNotification?: Phaser.GameObjects.Text;
  private spawnTimer?: Phaser.Time.TimerEvent;
  private guide?: Phaser.GameObjects.Text;
  private playerProgression?: PlayerProgression;
  private rewardTransaction?: RewardTransaction;
  private levelUpGenerator?: LevelUpGenerator;
  private rewardPresentation?: RewardPresentation;
  private run?: RunLifecycle;
  private runRandom?: RunRandom;
  private runDiagnostics?: RunDiagnostics;
  private playerBuild?: PlayerBuild;
  private playerDefense?: PlayerDefense;
  private get isPlayerDead(): boolean { return this.run?.outcome === 'DEATH'; }
  private get isRunVictorious(): boolean { return this.run?.outcome === 'VICTORY'; }
  private victoryPresentation: Phaser.GameObjects.Text[] = [];
  private isLevelUpPaused = false;
  private levelUpPresentation: Phaser.GameObjects.Text[] = [];
  private levelUpChoices = new Map<Phaser.GameObjects.Text, ChoiceIdentity>();
  private moduleLevels: Record<PassiveModule, number> = { hull: 0, thruster: 0, collector: 0, combat: 0, spatial: 0, replication: 0 };
  private globalDamageMultiplier = 1;
  private get playerMaxHealth(): number { return this.playerBuild!.getEffectiveStats().hull; }
  private get playerHealth(): number { return this.playerDefense!.snapshot().currentHull; }
  private readonly playerRadius = 20;
  private get playerDamageProtectionRemaining(): number { return this.playerDefense!.snapshot().protectionRemaining; }
  private enemies: EnemyRuntime[] = [];
  private xpPickups: XpPickup[] = [];
  private xpMagnetRadius = 180;
  private readonly xpCollectionRadius = 20;
  private readonly xpMagnetAcceleration = 900;
  private readonly xpMagnetMaxSpeed = 600;
  private currentTarget?: EnemyRuntime;
  private projectiles: ProjectileRuntime[] = [];
  private missiles: MissileRuntime[] = [];
  private readonly missile = {
    maxActiveMissiles: 1,
    fireInterval: 1800, lifetime: 4000, radius: 8,
  } as const;
  private missileValues = { damage: 2, speed: 450, explosionRadius: 120 };
  private missileRanks: MissileRanks = { warheadPower: 0, propulsion: 0, blastExpansion: 0 };
  private missileTimer?: Phaser.Time.TimerEvent;
  private weaponFocus: WeaponFocus = 'laser';
  private inputAdapter?: KeyboardInput;
  private canResume?: () => boolean;
  private pausePresentation?: Phaser.GameObjects.Text;
  private readonly movementDirection = new Phaser.Math.Vector2();
  private get movementSpeed(): number { return this.playerBuild!.getEffectiveStats().thrust; }
  private readonly dashDirection = new Phaser.Math.Vector2();
  private readonly dashSpeed = 900;
  private readonly dashDuration = 200;
  private readonly dashCooldown = 3000;
  private dashRemaining = 0;
  private dashCooldownRemaining = 0;
  private readonly chaseDirection = new Phaser.Math.Vector2();
  private successfulTimedSpawns = 0;
  private bossSpawned = false;
  bossDefeated = false;
  private readonly hostileFireInterval = 1500;
  private readonly hostileSpeed = 600;
  private readonly hostileLifetime = 3000;
  private readonly hostileDamage = 1;
  private get laser() { return laserProfile(this.playerBuild!.snapshot().laser); }
  private get laserRanks() { return this.playerBuild!.snapshot().laser.ranks; }
  private get prismEvolved() { return this.playerBuild!.snapshot().laser.form === 'PRISM'; }
  private clusterEvolved = false;
  private laserTimer?: Phaser.Time.TimerEvent;
  private readonly projectileRadius = 6;
  private readonly spawnInterval = 2000;
  private readonly minimumSpawnDistance = 600;
  private readonly maximumEnemies = 10;
  private readonly enemyMargin = 25;
  private readonly arenaWidth = 4800;
  private readonly arenaHeight = 2700;

  constructor() {
    super('GameplayScene');
  }

  create(): void {
    const run = new RunLifecycle();
    this.run = run;
    this.runDiagnostics = undefined;
    this.time.paused = false;
    this.pausePresentation = undefined;
    this.guide = undefined;
    this.phase = 1;
    this.phaseElapsedMs = 0;
    const disposeRun = () => {
      run.dispose();
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, disposeRun);
      this.events.off(Phaser.Scenes.Events.DESTROY, disposeRun);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, disposeRun);
    this.events.once(Phaser.Scenes.Events.DESTROY, disposeRun);
    const build = new PlayerBuild();
    this.playerBuild = build;
    const disposeBuild = () => {
      build.dispose();
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, disposeBuild);
      this.events.off(Phaser.Scenes.Events.DESTROY, disposeBuild);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, disposeBuild);
    this.events.once(Phaser.Scenes.Events.DESTROY, disposeBuild);
    const defense = new PlayerDefense(build.getEffectiveStats().hull);
    this.playerDefense = defense;
    const disposeDefense = () => {
      defense.dispose();
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, disposeDefense);
      this.events.off(Phaser.Scenes.Events.DESTROY, disposeDefense);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, disposeDefense);
    this.events.once(Phaser.Scenes.Events.DESTROY, disposeDefense);
    this.godMode = false;
    this.gameplayTimers = [];
    this.victoryPresentation = [];
    this.moduleLevels = { hull: 0, thruster: 0, collector: 0, combat: 0, spatial: 0, replication: 0 };
    this.xpMagnetRadius = 180;
    this.globalDamageMultiplier = 1;
    this.droneAngle = 0;
    this.twinDrone = undefined;
    this.twinDroneEvolved = false;
    this.droneAttackValues = { damage: 1, fireInterval: 1200, projectileSpeed: 800 };
    this.droneRanks = { boltPower: 0, firingSystem: 0, boltPropulsion: 0 };
    this.dashRemaining = 0;
    this.dashCooldownRemaining = 0;
    this.dashDirection.set(0, 0);
    this.missileRanks = { warheadPower: 0, propulsion: 0, blastExpansion: 0 };
    this.missileValues = { damage: 2, speed: 450, explosionRadius: 120 };
    this.weaponFocus = 'laser';
    this.clusterEvolved = false;
    const progression = new PlayerProgression();
    this.playerProgression = progression;
    const disposeProgression = () => {
      progression.dispose();
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, disposeProgression);
      this.events.off(Phaser.Scenes.Events.DESTROY, disposeProgression);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, disposeProgression);
    this.events.once(Phaser.Scenes.Events.DESTROY, disposeProgression);
    const generator = new LevelUpGenerator();
    this.levelUpGenerator = generator;
    const reward = new RewardTransaction();
    this.rewardTransaction = reward;
    this.rewardPresentation = undefined;
    const disposeReward = () => {
      if (this.rewardPresentation?.reward === reward) this.clearRewardPresentation(this.rewardPresentation);
      generator.dispose();
      reward.dispose();
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, disposeReward);
      this.events.off(Phaser.Scenes.Events.DESTROY, disposeReward);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, disposeReward);
    this.events.once(Phaser.Scenes.Events.DESTROY, disposeReward);
    this.isLevelUpPaused = false;
    this.levelUpPresentation = [];
    this.levelUpChoices = new Map();
    this.enemies = [];
    const enemies = this.enemies;
    const disposeTelegraphs = () => {
      for (const enemy of enemies) enemy.charger?.telegraph.destroy();
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, disposeTelegraphs);
      this.events.off(Phaser.Scenes.Events.DESTROY, disposeTelegraphs);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, disposeTelegraphs);
    this.events.once(Phaser.Scenes.Events.DESTROY, disposeTelegraphs);
    this.successfulTimedSpawns = 0;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.xpPickups = [];
    const pickups = this.xpPickups;
    const disposePickups = () => {
      for (const pickup of pickups) pickup.visual.destroy();
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, disposePickups);
      this.events.off(Phaser.Scenes.Events.DESTROY, disposePickups);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, disposePickups);
    this.events.once(Phaser.Scenes.Events.DESTROY, disposePickups);
    this.currentTarget = undefined;
    const flights: ProjectileRuntime[] = [];
    this.projectiles = flights;
    const disposeFlights = () => {
      for (const flight of flights) { flight.visited?.clear(); flight.scatterVolley?.contacts.clear(); flight.visual.destroy(); }
      flights.length = 0;
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, disposeFlights);
      this.events.off(Phaser.Scenes.Events.DESTROY, disposeFlights);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, disposeFlights);
    this.events.once(Phaser.Scenes.Events.DESTROY, disposeFlights);
    this.missiles = [];
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#050816');

    this.hud = this.add.text(32, 24, '', {
      fontFamily: RUSSIAN_FONT,
      fontSize: '30px',
      color: '#e2e8f0',
      backgroundColor: '#050816',
      padding: { x: 12, y: 8 },
    }).setScrollFactor(0).setDepth(1);
    this.updateHud();
    this.phaseIndicator = this.add.text(width - 32, 80, UI_TEXT.phaseOne, {
      fontFamily: RUSSIAN_FONT, fontSize: '24px', color: '#7dd3fc',
      backgroundColor: '#050816', padding: { x: 12, y: 8 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(1);
    this.phaseNotification = this.add.text(width / 2, 150, UI_TEXT.phaseTwo, {
      fontFamily: RUSSIAN_FONT, fontSize: '48px', color: '#facc15',
      backgroundColor: '#050816', padding: { x: 24, y: 16 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(2).setVisible(false);

    const arena = this.add.graphics();
    arena.fillStyle(0x7dd3fc, 0.4);

    // Fixed star positions keep the placeholder background stable on scene entry.
    for (let i = 0; i < 360; i += 1) {
      const x = 24 + ((i * 197) % (this.arenaWidth - 48));
      const y = 24 + ((i * 113) % (this.arenaHeight - 48));
      arena.fillCircle(x, y, i % 4 === 0 ? 2 : 1);
    }

    arena.lineStyle(2, 0x1e3a5f, 1);
    arena.strokeRect(1, 1, this.arenaWidth - 2, this.arenaHeight - 2);

    this.player = this.add
      .polygon(this.arenaWidth / 2, this.arenaHeight / 2, [20, 0, 40, 48, 20, 36, 0, 48], 0x38bdf8)
      .setStrokeStyle(2, 0xe0f2fe);

    this.drone = this.add.circle(0, 0, this.droneConfig.visualRadius, 0x2dd4bf)
      .setStrokeStyle(2, 0xccfbf1);
    this.positionDrone(this.drone, this.droneAngle);

    this.createEnemy(this.player.x + this.minimumSpawnDistance, this.player.y, 'chaser', run);

    this.cameras.main.setBounds(0, 0, this.arenaWidth, this.arenaHeight);
    this.cameras.main.startFollow(this.player);
    this.cameras.main.centerOn(this.player.x, this.player.y);

    this.gameplayTimers.push(this.spawnTimer = this.time.addEvent({
      delay: this.spawnInterval,
      loop: true,
      callback: () => { if (run.state === 'RUNNING') this.spawnEnemy(run); },
    }));
    this.gameplayTimers.push(this.laserTimer = this.time.addEvent({
      delay: this.weaponInterval(this.laser.fireInterval),
      loop: true,
      callback: () => { if (run.state === 'RUNNING') this.fireLaser(); },
    }));
    this.gameplayTimers.push(this.missileTimer = this.time.addEvent({
      delay: this.weaponInterval(this.missile.fireInterval),
      loop: true,
      callback: () => { if (run.state === 'RUNNING') this.fireMissile(); },
    }));
    this.gameplayTimers.push(this.droneTimer = this.time.addEvent({
      delay: this.weaponInterval(this.droneAttackValues.fireInterval),
      loop: true,
      callback: () => { if (run.state === 'RUNNING') this.fireDrone(); },
    }));
    this.gameplayTimers.push(this.time.addEvent({
      delay: this.hostileFireInterval,
      loop: true,
      callback: () => { if (run.state === 'RUNNING') this.fireHostileProjectile(); },
    }));

    this.bindRunInput(run);

    this.add
      .text(width - 32, 32, UI_TEXT.heading, {
        fontFamily: RUSSIAN_FONT,
        fontSize: '28px',
        color: '#e2e8f0',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0);

    this.guide = this.add
      .text(width / 2, height - 80, UI_TEXT.guide, {
        fontFamily: RUSSIAN_FONT,
        fontSize: '24px',
        align: 'center',
        color: '#7dd3fc',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    if (!run.start()) throw new Error('Gameplay run failed to enter RUNNING');
    const random = new RunRandom(crypto.getRandomValues(new Uint32Array(1))[0]);
    this.runRandom = random;
    const disposeRandom = () => {
      random.dispose();
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, disposeRandom);
      this.events.off(Phaser.Scenes.Events.DESTROY, disposeRandom);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, disposeRandom);
    this.events.once(Phaser.Scenes.Events.DESTROY, disposeRandom);
    const diagnostics = new RunDiagnostics(random.runSeed);
    this.runDiagnostics = diagnostics;
    diagnostics.recordRunStarted();
    diagnostics.recordEnemySpawned('chaser', false);
    const disposeDiagnostics = () => {
      diagnostics.dispose();
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, disposeDiagnostics);
      this.events.off(Phaser.Scenes.Events.DESTROY, disposeDiagnostics);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, disposeDiagnostics);
    this.events.once(Phaser.Scenes.Events.DESTROY, disposeDiagnostics);
    if (import.meta.env.DEV) this.publishDevTools();
  }

  private updateHud(): void {
    const progression = this.playerProgression!.snapshot();
    this.hud?.setText(hudLines(this.playerHealth, this.playerMaxHealth, progression.xp,
      progression.threshold, progression.level, this.dashCooldownRemaining));
  }

  update(_time: number, delta: number): void {
    const intent = this.inputAdapter?.sample();
    if (intent?.pausePressed) { this.handlePauseRequest(); return; }
    if (this.isSimulationPaused()) return;
    if (!this.player || !intent) return;
    this.runDiagnostics!.advance(delta);
    this.phaseElapsedMs += delta;
    if (this.phase === 1 && this.phaseElapsedMs >= 60_000) {
      this.phase = 2;
      const timer = this.spawnTimer!;
      // Keep the same event and fractional progress, without dispatching or catching up.
      timer.reset({ delay: 1200, startAt: timer.elapsed / timer.delay * 1200, loop: true,
        callback: timer.callback, callbackScope: timer.callbackScope, args: timer.args });
      this.phaseIndicator?.setText(UI_TEXT.phaseTwo);
    }
    this.phaseNotification?.setVisible(this.phase === 2 && this.phaseElapsedMs < 63_000);

    this.movementDirection.set(intent.moveX, intent.moveY);
    this.movementDirection.normalize();

    const previousCooldownDisplay = Math.ceil(this.dashCooldownRemaining / 100);
    if (intent.activatePressed && this.dashRemaining === 0 && this.dashCooldownRemaining === 0
      && this.movementDirection.lengthSq() > 0) {
      this.dashDirection.copy(this.movementDirection);
      this.dashRemaining = this.dashDuration;
      this.dashCooldownRemaining = this.dashCooldown;
    }

    const dash = stepDash(this.dashRemaining, this.dashCooldownRemaining, delta);
    this.dashRemaining = dash.remainingDuration;
    this.dashCooldownRemaining = dash.remainingCooldown;
    this.movePlayer(this.dashDirection, this.dashSpeed * dash.dashTime / 1000);
    this.movePlayer(this.movementDirection, this.movementSpeed * dash.normalTime / 1000);
    this.updateDrone(delta);
    if (previousCooldownDisplay !== Math.ceil(this.dashCooldownRemaining / 100)) this.updateHud();

    const run = this.run!;
    const chargeContacts = new Map<EnemyRuntime, ChargeContact>();
    for (const enemy of this.enemies) {
      if (this.run !== run || run.state !== 'RUNNING' || enemy.run !== run
        || !this.enemies.includes(enemy) || !(enemy.health > 0)) continue;
      const margin = Math.max(this.enemyMargin, enemy.collisionRadius);
      if (!Number.isFinite(margin) || margin * 2 >= this.arenaWidth || margin * 2 >= this.arenaHeight) {
        throw new RangeError('Enemy body does not fit arena');
      }
      const bounds = { minX: margin, maxX: this.arenaWidth - margin, minY: margin, maxY: this.arenaHeight - margin };
      let x = enemy.visual.x, y = enemy.visual.y;
      let chargerState = enemy.charger?.state;
      const movement = enemy.spawnSnapshot.movement;
      const speedMultiplier = this.phase === 2 ? 1.25 : 1;
      if (movement.kind === 'CHARGER') {
        if (!chargerState) throw new RangeError('Missing Charger state');
        const phaseMovement = this.phase === 2 ? { ...movement,
          speed: movement.speed * speedMultiplier, chargeSpeed: movement.chargeSpeed * speedMultiplier } : movement;
        const step = stepCharger({ x, y }, this.player, chargerState, phaseMovement, bounds, delta);
        x = step.position.x; y = step.position.y; chargerState = step.state;
        if (step.contact) chargeContacts.set(enemy, { run, position: step.contact });
      } else {
        this.chaseDirection.set(this.player.x - x, this.player.y - y);
        let speed = movement.speed;
        if (movement.kind === 'WARDEN_PURSUIT') {
          const phase = wardenPhase(enemy.health);
          if (!phase) continue;
          speed = phase === 2 ? movement.phaseTwoSpeed : movement.speed;
          enemy.visual.setFillStyle(phase === 2 ? wardenPhaseTwo.color : enemyPresentation.boss.color);
          if (enemy !== this.currentTarget) this.restoreEnemyOutline(enemy);
        }
        speed *= speedMultiplier;
        if (movement.kind === 'SHOOTER_BAND') {
          const step = shooterMovement(this.chaseDirection.x, this.chaseDirection.y, speed, delta,
            movement.minimumRange, movement.maximumRange);
          this.chaseDirection.set(step.x, step.y);
        } else {
          const chaseDistance = this.chaseDirection.length();
          const chaseStep = Math.min(speed * (delta / 1000), chaseDistance);
          this.chaseDirection.normalize().scale(chaseStep);
        }
        x += this.chaseDirection.x; y += this.chaseDirection.y;
      }
      const external = stepKnockback(enemy.knockbackVelocity, delta);
      x += external.displacement.x; y += external.displacement.y;
      for (const value of [x, y]) {
        if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) throw new RangeError('Invalid enemy position');
      }
      const nextX = Phaser.Math.Clamp(x, bounds.minX, bounds.maxX);
      const nextY = Phaser.Math.Clamp(y, bounds.minY, bounds.maxY);
      const velocity = {
        x: (x <= bounds.minX && external.velocity.x < 0) || (x >= bounds.maxX && external.velocity.x > 0) ? 0 : external.velocity.x,
        y: (y <= bounds.minY && external.velocity.y < 0) || (y >= bounds.maxY && external.velocity.y > 0) ? 0 : external.velocity.y,
      };
      if (chargerState?.phase === 'WINDUP' && delta > 0) {
        const aim = knockbackDirection(this.player.x - nextX, this.player.y - nextY);
        chargerState = { ...chargerState, directionX: aim.x, directionY: aim.y };
      }
      enemy.visual.x = nextX; enemy.visual.y = nextY;
      enemy.knockbackVelocity = velocity;
      if (enemy.charger && chargerState) {
        enemy.charger.state = chargerState;
        enemy.visual.rotation = Math.atan2(chargerState.directionY, chargerState.directionX);
        const graphic = enemy.charger.telegraph;
        graphic.clear();
        if (chargerState.phase === 'WINDUP') {
          graphic.lineStyle(3, 0xfb7185, 0.75);
          graphic.lineBetween(nextX, nextY,
            Phaser.Math.Clamp(nextX + chargerState.directionX * 325, bounds.minX, bounds.maxX),
            Phaser.Math.Clamp(nextY + chargerState.directionY * 325, bounds.minY, bounds.maxY));
        }
      }
    }

    const target = this.selectNearestEnemy();
    if (target !== this.currentTarget) {
      if (this.currentTarget) {
        this.restoreEnemyOutline(this.currentTarget);
      }
      this.currentTarget = target;
      this.currentTarget?.visual.setStrokeStyle(4, 0xfde047);
    }

    this.updatePlayerProtection(delta);
    this.updateProjectiles(delta);
    this.updateMissiles(delta);
    this.updatePlayerContact(chargeContacts);
    this.updateXpPickups(delta);
  }

  private isSimulationPaused(): boolean {
    return this.run?.state !== 'RUNNING';
  }

  private weaponInterval(localInterval: number): number {
    return combatValue(localInterval / this.playerBuild!.getEffectiveStats().fireControl, 1);
  }

  private resetWeaponTimer(timer: Phaser.Time.TimerEvent | undefined, delay: number): void {
    timer?.reset({ delay, loop: true, callback: timer.callback,
      callbackScope: timer.callbackScope, args: timer.args });
  }

  // Shared percent-stat bridge stays RUNNING-only; reward Build writes use the authenticated callback.
  private applyBuildChange(change: BuildChange, run = this.run, build = this.playerBuild,
    presentation?: RewardPresentation, id?: ChoiceIdentity): boolean {
    if (!run || this.run !== run || !build || this.playerBuild !== build) return false;
    if (change.kind === 'percent') {
      if (run.state !== 'RUNNING') return false;
    } else if (!presentation || presentation !== this.rewardPresentation || presentation.run !== run
      || presentation.build !== build || presentation.reward !== this.rewardTransaction
      || presentation.reward.snapshot()?.phase !== 'PRESENTED' || run.state !== 'PAUSED' || !run.hasPauseReason('REWARD')
      || presentation.reward.snapshot()?.offerId !== presentation.token.offerId
      || id !== (change.kind === 'hullPlating' ? 'passive.hull' : 'passive.thruster')
      || !presentation.reward.snapshot()?.candidates.some(candidate => candidate.id === id)) return false;
    const defense = this.playerDefense;
    if (!defense) return false;
    defense.snapshot(); // Assert current defense is live before changing Build.
    const before = build.getEffectiveStats();
    if (change.kind === 'percent') {
      const context = this.rewardContext(build);
      const candidate = { ...context, build: { ...context.build, effectiveStats: build.previewStatPercent(change.stat, change.delta) } };
      // This validates every affected launch consumer and cadence before the first Build write.
      assertCombatConsumers(candidate);
    }
    const changed = change.kind === 'percent' ? build.applyStatPercent(change.stat, change.delta)
      : change.kind === 'hullPlating' ? build.applyPrototypeHullPlating() : build.applyPrototypeThruster();
    if (!changed) return false;
    const after = build.getEffectiveStats();
    if (change.kind === 'percent' && change.stat === 'hull') {
      defense.reconcileMaxHull(after.hull);
      this.updateHud();
    }
    if (after.fireControl !== before.fireControl) {
      const laser = this.weaponInterval(this.laser.fireInterval);
      const missile = this.weaponInterval(this.missile.fireInterval);
      const drone = this.weaponInterval(this.droneAttackValues.fireInterval);
      this.resetWeaponTimer(this.laserTimer, laser);
      this.resetWeaponTimer(this.missileTimer, missile);
      this.resetWeaponTimer(this.droneTimer, drone);
    }
    return true;
  }

  private bindRunInput(run: RunLifecycle): void {
    let valid = true;
    const current = () => valid && this.run === run && run.state !== 'DISPOSED';
    const adapter = new KeyboardInput(this.input.keyboard, () => current() && run.state === 'RUNNING');
    this.inputAdapter = adapter;
    let focused = document.hasFocus();
    let visible = !document.hidden;
    this.canResume = () => current() && focused && visible && document.hasFocus() && !document.hidden;
    const loseFocus = () => {
      if (!current() || (run.state !== 'RUNNING' && run.state !== 'PAUSED')) return;
      const before = run.state, reasons = run.pauseReasons;
      run.requestPause('FOCUS_LOSS');
      this.observePause(before, reasons);
      adapter.reset();
      this.projectPause();
    };
    const blur = () => { if (current()) { focused = false; loseFocus(); } };
    const hidden = () => { if (current()) { visible = false; loseFocus(); } };
    const focus = () => { if (current()) focused = true; };
    const visibleAgain = () => { if (current()) visible = true; };
    const events = this.game.events;
    const bindings = [
      [Phaser.Core.Events.BLUR, blur], [Phaser.Core.Events.HIDDEN, hidden],
      [Phaser.Core.Events.FOCUS, focus], [Phaser.Core.Events.VISIBLE, visibleAgain],
    ] as const;
    for (const [event, listener] of bindings) events.on(event, listener);
    const disposeInput = () => {
      valid = false;
      adapter.dispose();
      for (const [event, listener] of bindings) events.off(event, listener);
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, disposeInput);
      this.events.off(Phaser.Scenes.Events.DESTROY, disposeInput);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, disposeInput);
    this.events.once(Phaser.Scenes.Events.DESTROY, disposeInput);
  }

  private handlePauseRequest(): void {
    const run = this.run;
    if (!run || run.hasPauseReason('REWARD')) return;
    const before = run.state, reasons = run.pauseReasons;
    if (run.state === 'RUNNING') run.requestPause('MANUAL');
    else if (run.state === 'PAUSED' && this.canResume?.()) {
      run.releasePause('MANUAL');
      run.releasePause('FOCUS_LOSS');
    } else return;
    this.observePause(before, reasons);
    this.inputAdapter?.reset();
    this.projectPause();
  }

  private projectPause(): void {
    this.guide?.setVisible(this.run?.state === 'RUNNING');
    this.phaseNotification?.setVisible(this.run?.state === 'RUNNING'
      && this.phase === 2 && this.phaseElapsedMs < 63_000);
    this.time.paused = this.run?.state === 'PAUSED';
    if (!this.time.paused || this.run?.hasPauseReason('REWARD')) {
      this.pausePresentation?.destroy();
      this.pausePresentation = undefined;
    } else if (!this.pausePresentation) {
      this.pausePresentation = this.add.text(this.scale.width / 2, this.scale.height / 2,
        UI_TEXT.pause, { fontFamily: RUSSIAN_FONT, fontSize: '48px', color: '#e2e8f0',
          backgroundColor: '#050816', padding: { x: 24, y: 16 }, align: 'center' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(2);
    }
  }

  private observePause(before: RunState, reasons: PauseReason[]): void {
    if (before === 'RUNNING' && this.run?.state === 'PAUSED') {
      this.runDiagnostics!.recordPauseEntered(this.run.pauseReasons);
    } else if (before === 'PAUSED' && this.run?.state === 'RUNNING') {
      this.runDiagnostics!.recordPauseResumed(reasons);
    }
  }

  private clearTerminalInput(): void {
    this.inputAdapter?.reset();
    this.levelUpGenerator?.cancelGenerated();
    this.rewardTransaction?.invalidate();
    if (this.rewardPresentation) this.clearRewardPresentation(this.rewardPresentation);
    this.projectPause();
  }

  private restoreEnemyOutline(enemy: EnemyRuntime): void {
    const outline = enemy.archetype === 'boss' && wardenPhase(enemy.health) === 2
      ? wardenPhaseTwo.outline : enemy.isElite ? eliteTankData.outline : enemyPresentation[enemy.archetype].outline;
    enemy.visual.setStrokeStyle(enemy.isElite || enemy.archetype === 'boss' ? 3 : 2, outline);
  }

  private movePlayer(direction: Phaser.Math.Vector2, distance: number): void {
    if (!this.player) return;
    // Clamp each segment separately when a frame spans Dash expiry at an edge.
    const marginX = this.player.width / 2 + this.player.lineWidth / 2;
    const marginY = this.player.height / 2 + this.player.lineWidth / 2;
    this.player.x = Phaser.Math.Clamp(this.player.x + direction.x * distance,
      marginX, this.arenaWidth - marginX);
    this.player.y = Phaser.Math.Clamp(this.player.y + direction.y * distance,
      marginY, this.arenaHeight - marginY);
  }

  private rewardContext(build: PlayerBuild): RewardEligibilityContext {
    const preview = (read: () => ReturnType<PlayerBuild['getEffectiveStats']>) => {
      try { return read(); } catch (error) { if (error instanceof RangeError) return null; throw error; }
    };
    return { build: build.snapshot(), laserRanks: { ...this.laserRanks }, missileRanks: { ...this.missileRanks },
      droneRanks: { ...this.droneRanks }, moduleLevels: { ...this.moduleLevels },
      prismEvolved: this.prismEvolved, clusterEvolved: this.clusterEvolved, twinDroneEvolved: this.twinDroneEvolved,
      laser: { damage: this.laser.damage, fireInterval: this.laser.fireInterval, projectileSpeed: this.laser.projectileSpeed }, missile: { ...this.missileValues }, drone: { ...this.droneAttackValues },
      magnetRadius: this.xpMagnetRadius, combatMultiplier: this.globalDamageMultiplier,
      hullPreview: preview(() => build.previewPrototypeHullPlating()), thrusterPreview: preview(() => build.previewPrototypeThruster()) };
  }

  private clearRewardPresentation(p: RewardPresentation): void {
    for (const [text, handler] of p.handlers) text.off('pointerdown', handler);
    p.handlers.clear();
    for (const text of p.texts) text.destroy();
    p.choices.clear();
    if (this.rewardPresentation === p) {
      this.rewardPresentation = undefined;
      this.levelUpPresentation = [];
      this.levelUpChoices = new Map();
      this.isLevelUpPaused = false;
    }
  }

  private currentReward(p: RewardPresentation, text: Phaser.GameObjects.Text, id: ChoiceIdentity): boolean {
    // Old callbacks stop before reading any disposed owner, even on a reused Scene.
    return p === this.rewardPresentation && p.run === this.run && p.progression === this.playerProgression
      && p.build === this.playerBuild && p.generator === this.levelUpGenerator && p.reward === this.rewardTransaction && p.run.state === 'PAUSED'
      && p.run.hasPauseReason('REWARD') && !!this.player?.active && !!this.playerDefense
      && this.isLevelUpPaused && text.active && p.texts.includes(text) && this.levelUpChoices === p.choices && this.levelUpChoices.get(text) === id
      && p.progression.snapshot().pendingLevels > 0 && p.reward.snapshot()?.phase === 'PRESENTED'
      && p.reward.snapshot()?.offerId === p.token.offerId;
  }

  private enterLevelUpPause(run = this.run, progression = this.playerProgression): void {
    const build = this.playerBuild, rewardOwner = this.rewardTransaction, generator = this.levelUpGenerator;
    if (this.run !== run || !run || this.playerProgression !== progression || !progression || !build || !rewardOwner || !generator
      || !this.player?.active || !this.playerDefense
      || (run.state !== 'RUNNING' && !(run.state === 'PAUSED' && run.hasPauseReason('REWARD')))
      || this.rewardPresentation || this.isLevelUpPaused || !progression.snapshot().pendingLevels) return;
    rewardOwner.assertCanOpen(); // Safe ordinal and guard BEFORE RNG, pause, input or UI mutation.
    this.playerDefense.snapshot();
    const context = { ...this.rewardContext(build), weaponFocus: this.weaponFocus };
    generator.assertCanGenerate(context);
    this.preflightProgressionObservations({ offersPresented: 1, ...(run.state === 'RUNNING' ? { pauseEntries: 1 } : {}) }, run.state === 'RUNNING' ? 2 : 1);
    if (run.state === 'RUNNING') { run.requestPause('REWARD'); this.observePause('RUNNING', []); }
    this.inputAdapter?.reset();
    this.projectPause();
    const candidates = generator.generate(context, this.runRandom!.reward.next);
    const choices = candidates.map(candidate => candidate.choice);
    const token = rewardOwner.open(candidates);
    const presentation: RewardPresentation = Object.freeze({ run, progression, build, reward: rewardOwner, generator, token,
      texts: [], choices: new Map(), handlers: new Map() });
    this.rewardPresentation = presentation;
    this.levelUpPresentation = presentation.texts;
    this.levelUpChoices = presentation.choices;
    this.isLevelUpPaused = true;
    const title = this.add.text(this.scale.width / 2, this.scale.height / 2 - 160, UI_TEXT.levelUp, {
      fontFamily: RUSSIAN_FONT,
      fontSize: '48px',
      color: '#a3e635',
      backgroundColor: '#050816',
      padding: { x: 24, y: 16 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1);
    this.levelUpPresentation.push(title);
    choices.forEach((option, index) => {
      const choice = this.add.text(this.scale.width / 2, this.scale.height / 2 - 40 + index * 110,
        this.choiceLabel(option), {
          fontFamily: RUSSIAN_FONT,
          fontSize: '32px',
          align: 'center',
          color: '#e0f2fe',
          backgroundColor: '#1e3a5f',
          padding: { x: 24, y: 12 },
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1)
        .setInteractive({ useHandCursor: true });
      presentation.texts.push(choice);
      presentation.choices.set(choice, choiceIdentity(option));
      const handler = () => { this.acceptLevelUpChoice(choice, option, run, progression, presentation); };
      presentation.handlers.set(choice, handler);
      choice.on('pointerdown', handler);
    });
    if (!rewardOwner.present(token)) throw new Error('Reward presentation lost its transaction');
    const actual = rewardOwner.snapshot();
    if (this.run !== run || this.playerBuild !== build || this.playerProgression !== progression
      || this.rewardTransaction !== rewardOwner || this.levelUpGenerator !== generator
      || this.rewardPresentation !== presentation || run.state !== 'PAUSED' || !run.hasPauseReason('REWARD')
      || actual?.phase !== 'PRESENTED' || actual.offerId !== token.offerId
      || actual.candidates.some((candidate, i) => candidate.id !== candidates[i].id)
      || !generator.recordPresented(token.offerId)) throw new Error('Level-Up policy presentation mismatch');
    this.runDiagnostics!.recordLevelUpOffered(choices.map(choiceIdentity));
  }

  private choiceLabel(choice: LevelUpChoice): string {
    return rewardLabel(choice, this.missileRanks, this.droneRanks, this.moduleLevels);
  }

  private acceptLevelUpChoice(choice: Phaser.GameObjects.Text, option: LevelUpChoice, run = this.run,
    progression = this.playerProgression, p = this.rewardPresentation): boolean {
    if (!p || p.run !== run || p.progression !== progression || !this.currentReward(p, choice, choiceIdentity(option))) return false;
    const accepted = p.reward.trySelect(p.token, choiceIdentity(option), candidate => this.applyRewardChoice(candidate, p, choice));
    if (!accepted) return false;
    // trySelect has invalidated the token AND exited its guard before any orchestration.
    this.clearRewardPresentation(p);
    this.inputAdapter?.reset();
    if (p.progression.snapshot().pendingLevels > 0) {
      this.enterLevelUpPause(p.run, p.progression);
    } else {
      const reasons = p.run.pauseReasons;
      p.run.releasePause('REWARD');
      this.observePause('PAUSED', reasons);
      this.projectPause();
    }
    return true;
  }

  private applyRewardChoice(candidate: RewardCandidate, p: RewardPresentation, choice: Phaser.GameObjects.Text): boolean {
    if (!this.currentReward(p, choice, candidate.id)) return false;
    const option = candidate.choice, context = this.rewardContext(p.build);
    if (option.kind === 'passive' && (option.module === 'hull' && !context.hullPreview
      || option.module === 'thruster' && !context.thrusterPreview)) return false;
    if (isLaserChoice(option)) {
      try { prepareLaserChoice(context.build.laser, option, context.moduleLevels.combat); }
      catch (error) { if (error instanceof RangeError) return false; throw error; }
    }
    assertRewardFeasible(option, context);
    if (!isRewardEligible(option, context)) return false;
    const defense = this.playerDefense!.snapshot();
    combatValue(defense.currentHull); // Dead/disposed Defense cannot accept a reward.
    const pending = p.progression.snapshot().pendingLevels;
    const resumes = pending === 1 && p.run.pauseReasons.length === 1;
    this.preflightProgressionObservations({ choicesAccepted: 1, ...(pending > 1 ? { offersPresented: 1 } : {}),
      ...(resumes ? { pauseResumes: 1 } : {}) }, 1 + Number(pending > 1 || resumes));
    if (pending > 1 && !Number.isSafeInteger(p.token.offerId + 1)) throw new RangeError('Reward ordinal exhausted');
    // Last resource preparation: unpublished until every validation has passed.
    let provisionalTwin: Phaser.GameObjects.Arc | undefined;
    if (option.kind === 'twin') {
      provisionalTwin = this.add.circle(0, 0, this.droneConfig.visualRadius, 0x2dd4bf);
      try {
        provisionalTwin.setStrokeStyle(2, 0xccfbf1);
        this.positionDrone(provisionalTwin, this.droneAngle + Math.PI);
        if (!this.currentReward(p, choice, candidate.id)) { provisionalTwin.destroy(); return false; }
      } catch (error) { provisionalTwin.destroy(); throw error; }
    }
    if (isLaserChoice(option)) {
      const beforeDelay = this.weaponInterval(this.laser.fireInterval);
      if (!p.build.applyLaserChoice(option, this.moduleLevels.combat)) return false;
      const afterDelay = this.weaponInterval(this.laser.fireInterval);
      if (beforeDelay !== afterDelay) this.resetWeaponTimer(this.laserTimer, afterDelay);
    }
    if (option.kind === 'cluster') {
      this.clusterEvolved = true;
      this.weaponFocus = 'missile';
    }
    if (option.kind === 'twin') {
      this.twinDroneEvolved = true;
      this.weaponFocus = 'drone';
      this.twinDrone = provisionalTwin;
    }
    if (isLaserChoice(option)) this.weaponFocus = 'laser';
    if (option.kind === 'drone') {
      this.weaponFocus = 'drone';
      this.droneRanks[option.upgrade] += 1;
      switch (option.upgrade) {
        case 'boltPower': this.droneAttackValues.damage += 1; break;
        case 'boltPropulsion': this.droneAttackValues.projectileSpeed += 200; break;
        case 'firingSystem':
          this.droneAttackValues.fireInterval -= 150;
          this.resetWeaponTimer(this.droneTimer, this.weaponInterval(this.droneAttackValues.fireInterval));
          break;
      }
    }
    if (option.kind === 'missile') {
      this.weaponFocus = 'missile';
      this.missileRanks[option.upgrade] += 1;
      switch (option.upgrade) {
        case 'warheadPower': this.missileValues.damage += 1; break;
        case 'propulsion': this.missileValues.speed += 75; break;
        case 'blastExpansion': this.missileValues.explosionRadius += 30; break;
      }
    }
    if (option.kind === 'passive') {
      // Build validates first: a failed mutation must not change level, current HP or selection.
      if (option.module === 'hull' && !this.applyBuildChange({ kind: 'hullPlating' }, p.run, p.build, p, candidate.id)) return false;
      if (option.module === 'thruster' && !this.applyBuildChange({ kind: 'thruster' }, p.run, p.build, p, candidate.id)) return false;
      this.moduleLevels[option.module] += 1;
      switch (option.module) {
        case 'hull':
          this.playerDefense!.reconcileMaxHull(this.playerMaxHealth);
          this.playerDefense!.healHull(1, this.playerMaxHealth);
          this.updateHud();
          break;
        case 'collector': this.xpMagnetRadius += 40; break;
        case 'combat': this.globalDamageMultiplier += 0.25; break;
      }
    }
    if (!p.progression.resolvePendingLevel()) throw new Error('Accepted reward lost pending level');
    this.runDiagnostics!.recordLevelUpSelected(candidate.id);
    return true; // No UI destruction, generation, RNG or pause release inside this callback.
  }

  private updateXpPickups(delta: number): void {
    if (!this.player || this.isSimulationPaused() || !this.playerProgression) return;
    const run = this.run!, progression = this.playerProgression;
    this.consolidateXpPickups(run, progression);
    for (let i = this.xpPickups.length - 1; i >= 0; i -= 1) {
      if (this.isSimulationPaused()) return;
      const pickup = this.xpPickups[i];
      if (pickup.run !== run || !pickup.visual.active) continue;
      const dx = this.player.x - pickup.visual.x;
      const dy = this.player.y - pickup.visual.y;
      const distance = Math.hypot(dx, dy);
      if (distance > this.xpMagnetRadius) {
        pickup.speed = 0;
        continue;
      }
      const seconds = delta / 1000;
      const accelerating = Math.min(seconds,
        (this.xpMagnetMaxSpeed - pickup.speed) / this.xpMagnetAcceleration);
      const step = pickup.speed * accelerating
        + 0.5 * this.xpMagnetAcceleration * accelerating * accelerating
        + this.xpMagnetMaxSpeed * (seconds - accelerating);
      if (distance <= this.xpCollectionRadius + step) {
        this.creditExperience(pickup.value, pickup, run, progression);
        continue;
      }
      pickup.speed = Math.min(this.xpMagnetMaxSpeed,
        pickup.speed + this.xpMagnetAcceleration * seconds);
      pickup.visual.x += dx / distance * step;
      pickup.visual.y += dy / distance * step;
    }
  }

  private updatePlayerProtection(delta: number): void {
    if (this.isSimulationPaused() || !this.player || !this.playerDefense) return;
    this.playerDefense.advanceProtection(delta);
    if (this.playerDamageProtectionRemaining > 0) return;
    this.player.setAlpha(1);
  }

  private updatePlayerContact(chargeContacts?: ReadonlyMap<EnemyRuntime, ChargeContact>): void {
    if (this.isSimulationPaused()) return;
    if (!this.player || !this.playerDefense || this.playerHealth === 0) return;

    for (const enemy of this.enemies) {
      if (enemy.run !== this.run || !(enemy.health > 0)) continue;
      const radius = this.playerRadius + enemy.collisionRadius;
      let dx = enemy.visual.x - this.player.x;
      let dy = enemy.visual.y - this.player.y;
      let distance = Math.hypot(dx, dy);
      const contact = chargeContacts?.get(enemy);
      if (distance > radius && contact?.run === this.run && enemy.charger) {
        dx = contact.position.x - this.player.x; dy = contact.position.y - this.player.y;
        distance = Math.hypot(dx, dy);
        // The intersection is inclusive; roundoff at the computed boundary must not lose it.
        distance = Math.min(radius, distance);
      }
      if (distance <= radius) {
        const attack = createAttack({ kind: 'ENEMY_CONTACT', snapshot: { damage: enemy.contactDamage } }) as ContactAttack;
        const step = Math.max(0, radius - distance);
        const marginX = this.player.width / 2 + this.player.lineWidth / 2;
        const marginY = this.player.height / 2 + this.player.lineWidth / 2;
        this.player.x = Phaser.Math.Clamp(this.player.x + (distance > 0 ? -dx / distance : 1) * step,
          marginX, this.arenaWidth - marginX);
        this.player.y = Phaser.Math.Clamp(this.player.y + (distance > 0 ? -dy / distance : 0) * step,
          marginY, this.arenaHeight - marginY);
        this.damagePlayer({ kind: 'PLAYER_CONTACT', run: this.run!, target: this.playerDefense, attack });
        break;
      }
    }
  }

  private applyEnemyHit(hit: EnemyHit): EnemyDamage | null {
    if (hit.run !== this.run || hit.run.state !== 'RUNNING') return null;
    if (hit.target.run !== hit.run || !this.enemies.includes(hit.target) || hit.target.health <= 0) return null;
    if (hit.kind === 'ENEMY_DIRECT' ? !hit.direction : !hit.origin) throw new RangeError('Missing physical Hit geometry');
    const phaseImpact = composePlayerImpact(hit.attack.snapshot.impact,
      hit.kind === 'ENEMY_BLAST' ? hit.phase === 'SATELLITE' ? 0.5 : 1 : hit.impactFactor ?? 1);
    const magnitude = composePlayerImpact(phaseImpact, hit.target.spawnSnapshot.interaction.knockbackResponse);
    if (hit.kind === 'ENEMY_BLAST') {
      for (const value of [hit.origin.x, hit.origin.y, hit.target.visual.x, hit.target.visual.y]) {
        if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) {
          throw new RangeError('Invalid blast geometry');
        }
      }
    }
    const direction = hit.kind === 'ENEMY_DIRECT' ? knockbackDirection(hit.direction.x, hit.direction.y)
      : knockbackDirection(hit.target.visual.x - hit.origin.x, hit.target.visual.y - hit.origin.y);
    const velocity = withKnockbackImpulse(hit.target.knockbackVelocity, direction, magnitude);
    const amount = calculateHitDamage(hit.attack, hit.kind === 'ENEMY_DIRECT' ? 'DIRECT' : hit.phase);
    const result = calculateEnemyDamage(hit.target.health, amount);
    const source = result.hpLost > 0 ? enemyHitSource(hit) : null;
    if (result.healthDepleted && source) validateEnemyDeathRecord(enemyDeathInput(hit.target, source));
    hit.target.health = result.healthAfter;
    if (source) hit.target.lastDamagingSource = source;
    if (result.healthDepleted && source) this.killEnemy(hit, result, source);
    else if (hit.run === this.run && hit.run.state === 'RUNNING' && hit.target.run === hit.run
      && this.enemies.includes(hit.target) && hit.target.health > 0) hit.target.knockbackVelocity = velocity;
    return result;
  }

  private damagePlayer(hit: Extract<Hit, { kind: 'PLAYER_PROJECTILE' | 'PLAYER_CONTACT' }>): PlayerDamage | null {
    if (hit.run !== this.run || hit.run.state !== 'RUNNING' || hit.target !== this.playerDefense) return null;
    if (!this.player || hit.target.snapshot().currentHull === 0) return null;
    if (import.meta.env.DEV && this.godMode) return null;
    const calculatedDamage = calculateHitDamage(hit.attack, hit.kind === 'PLAYER_PROJECTILE' ? 'DIRECT' : 'CONTACT');
    const defense = hit.target.applyIncomingDamage(calculatedDamage);
    const result: PlayerDamage = { target: 'PLAYER', calculatedDamage, defense };
    if (defense.hullLost > 0) this.runDiagnostics!.recordPlayerDamage(defense.hullLost);
    if (!defense.accepted) return result;
    this.updateHud();
    this.player.setAlpha(0.5);
    if (defense.hullDepleted) this.enterPlayerDeath();
    return result;
  }

  private enterPlayerDeath(): void {
    const run = this.run;
    if (!run?.tryEnterTerminal('DEATH')) return;
    this.runDiagnostics!.recordTerminal('DEATH');
    this.clearTerminalInput();
    this.player?.setAlpha(0.25);
    this.add.text(this.scale.width / 2, this.scale.height / 2, UI_TEXT.death, {
      fontFamily: RUSSIAN_FONT,
      fontSize: '64px',
      color: '#fca5a5',
      backgroundColor: '#050816',
      padding: { x: 24, y: 16 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1);
    let restartRequested = false;
    this.add.text(this.scale.width / 2, this.scale.height / 2 + 100, UI_TEXT.retry, {
      fontFamily: RUSSIAN_FONT,
      fontSize: '40px',
      color: '#e0f2fe',
      backgroundColor: '#1e3a5f',
      padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1)
      .setInteractive({ useHandCursor: true })
      .once('pointerdown', () => {
        if (restartRequested || this.run !== run || run.state !== 'TERMINAL') return;
        restartRequested = true;
        this.scene.restart();
      });
  }

  private enterRunVictory(): void {
    const run = this.run;
    if (!this.bossDefeated || !run?.tryEnterTerminal('VICTORY')) return;
    this.runDiagnostics!.recordTerminal('VICTORY');
    this.clearTerminalInput();
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    this.victoryPresentation = [
      this.add.text(centerX, centerY - 140, UI_TEXT.victory, {
        fontFamily: RUSSIAN_FONT, fontSize: '64px', color: '#a3e635',
        backgroundColor: '#050816', padding: { x: 24, y: 16 },
      }),
      this.add.text(centerX, centerY - 40, UI_TEXT.wardenDefeated, {
        fontFamily: RUSSIAN_FONT, fontSize: '40px', color: '#e0f2fe',
        backgroundColor: '#050816', padding: { x: 24, y: 12 },
      }),
      this.add.text(centerX, centerY + 40, victoryLevel(this.playerProgression!.snapshot().level), {
        fontFamily: RUSSIAN_FONT, fontSize: '32px', color: '#e0f2fe',
        backgroundColor: '#050816', padding: { x: 24, y: 12 },
      }),
    ];
    const newRun = this.add.text(centerX, centerY + 140, UI_TEXT.newRun, {
      fontFamily: RUSSIAN_FONT, fontSize: '40px', color: '#e0f2fe',
      backgroundColor: '#1e3a5f', padding: { x: 24, y: 12 },
    }).setInteractive({ useHandCursor: true });
    this.victoryPresentation.push(newRun);
    for (const text of this.victoryPresentation) text.setOrigin(0.5).setScrollFactor(0).setDepth(2);
    let restartRequested = false;
    newRun.once('pointerdown', () => {
      if (restartRequested || this.run !== run || run.state !== 'TERMINAL'
        || !this.isRunVictorious || !this.victoryPresentation.includes(newRun)) return;
      restartRequested = true;
      this.scene.restart();
    });
  }

  private fireLaser(): void {
    if (this.isSimulationPaused()) return;
    if (!this.player || !this.currentTarget) return;
    if (!this.playerBuild!.getSlots().combat.includes('LASER')) return;
    const config = this.playerBuild!.snapshot().laser, profile = laserProfile(config);
    const directions = laserDirections(this.currentTarget.visual.x - this.player.x,
      this.currentTarget.visual.y - this.player.y, profile);
    if (!directions.length) return;
    const attack = laserAttack(config, this.playerBuild!.getEffectiveStats(), this.globalDamageMultiplier);
    const volley: ScatterVolley | undefined = config.form === 'SCATTER' ? { contacts: new Map(), remaining: directions.length } : undefined;
    for (const direction of directions) this.launchPlayerProjectile(this.player, direction, attack, this.run!, profile.color, volley);
  }

  private updateDrone(delta: number): void {
    if (this.isSimulationPaused() || !this.player || !this.drone) return;
    this.droneAngle = (this.droneAngle + this.droneConfig.angularSpeed * delta / 1000) % (Math.PI * 2);
    this.positionDrone(this.drone, this.droneAngle);
    if (this.twinDrone) this.positionDrone(this.twinDrone, this.droneAngle + Math.PI);
  }

  private positionDrone(drone: Phaser.GameObjects.Arc, angle: number): void {
    if (!this.player) return;
    drone.x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * this.droneConfig.orbitRadius,
      0, this.arenaWidth);
    drone.y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * this.droneConfig.orbitRadius,
      0, this.arenaHeight);
  }

  private fireDrone(): void {
    if (this.isSimulationPaused() || !this.drone) return;
    if (!this.playerBuild!.getSlots().combat.includes('COMBAT_DRONE')) return;
    this.fireDroneFrom(this.drone);
    if (this.twinDrone) this.fireDroneFrom(this.twinDrone);
  }

  private fireDroneFrom(origin: Phaser.GameObjects.Arc): void {
    const target = this.selectNearestEnemy(undefined, origin);
    if (!target) return;
    const directions = this.aimProjectile(origin, target);
    if (directions.length === 0) return;
    const stats = this.playerBuild!.getEffectiveStats();
    const attack = createAttack({ kind: 'COMBAT_DRONE', variant: this.twinDroneEvolved ? 'TWIN' : 'BASE', snapshot: {
      damage: composePlayerDamage('COMBAT_DRONE', this.droneAttackValues.damage, this.globalDamageMultiplier, stats.reactorPower, stats.engineering),
      speed: this.droneAttackValues.projectileSpeed * stats.projectileVelocity, lifetime: this.droneConfig.lifetime,
      radius: effectiveDroneBoltRadius(this.droneConfig.boltRadius, this.moduleLevels.replication) * stats.projectileScale,
      impact: composePlayerImpact(160, stats.impact),
    } }) as DroneAttack;
    this.launchPlayerProjectile(origin, directions[0], attack, this.run!, 0xc084fc);
  }

  private aimProjectile(origin: { x: number; y: number }, target: EnemyRuntime): { x: number; y: number }[] {
    const dx = target.visual.x - origin.x;
    const dy = target.visual.y - origin.y;
    const distance = Math.hypot(dx, dy);
    return distance < 0.001 ? [] : [{ x: dx / distance, y: dy / distance }];
  }

  private launchPlayerProjectile(
    origin: { x: number; y: number }, direction: { x: number; y: number },
    attack: LaserAttack | DroneAttack, run: RunLifecycle, color: number, scatterVolley?: ScatterVolley,
  ): void {
    if (this.run !== run || run.state !== 'RUNNING') return;
    const { radius, speed, lifetime } = attack.snapshot;
    this.projectiles.push({
      attack, run, scatterVolley,
      ...(attack.kind === 'LASER' && attack.mechanics?.pattern === 'LANCE' ? { visited: new Set<EnemyRuntime>() } : {}),
      get source() { return attack.kind === 'LASER' || attack.kind === 'COMBAT_DRONE' ? 'player' : 'enemy'; },
      get damage() { return attack.snapshot.damage; },
      get radius() { return attack.snapshot.radius; },
      visual: this.add.circle(origin.x, origin.y, radius, color),
      velocityX: direction.x * speed,
      velocityY: direction.y * speed,
      remainingLifetime: lifetime,
    });
  }

  private fireHostileProjectile(): void {
    if (this.isSimulationPaused()) return;
    if (!this.player) return;
    const enemy = this.selectNearestEnemy('shooter');
    if (enemy) {
      const dx = this.player.x - enemy.visual.x;
      const dy = this.player.y - enemy.visual.y;
      const distance = Math.hypot(dx, dy);
      if (distance >= 0.001) this.launchHostileProjectile(enemy.visual, dx / distance, dy / distance, this.run!);
    }
    const boss = this.enemies.find(candidate => candidate.archetype === 'boss' && candidate.health > 0);
    if (boss) {
      const phase = wardenPhase(boss.health);
      if (phase) for (const direction of wardenBurstDirections(phase)) {
        this.launchHostileProjectile(boss.visual, direction.x, direction.y, this.run!);
      }
    }
  }

  private launchHostileProjectile(origin: { x: number; y: number }, directionX: number, directionY: number, run: RunLifecycle): void {
    if (this.run !== run || run.state !== 'RUNNING') return;
    const attack = createAttack({ kind: 'HOSTILE_PROJECTILE', snapshot: { damage: this.hostileDamage,
      speed: this.hostileSpeed, radius: this.projectileRadius, lifetime: this.hostileLifetime } }) as HostileAttack;
    this.projectiles.push({
      attack, run,
      get source() { return attack.kind === 'HOSTILE_PROJECTILE' ? 'enemy' : 'player'; },
      get damage() { return attack.snapshot.damage; },
      get radius() { return attack.snapshot.radius; },
      visual: this.add.circle(origin.x, origin.y, attack.snapshot.radius, 0xfb923c),
      velocityX: directionX * attack.snapshot.speed,
      velocityY: directionY * attack.snapshot.speed,
      remainingLifetime: attack.snapshot.lifetime,
    });
  }

  private removeProjectile(projectile: ProjectileRuntime): void {
    const index = this.projectiles.indexOf(projectile);
    if (index < 0) return;
    projectile.visited?.clear();
    const volley = projectile.scatterVolley;
    if (volley && --volley.remaining === 0) volley.contacts.clear();
    projectile.visual.destroy(); this.projectiles.splice(index, 1);
  }

  private updateProjectiles(delta: number): void {
    projectileLoop: for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      if (this.isSimulationPaused()) return;
      const projectile = this.projectiles[i];
      if (projectile.run !== this.run || projectile.run.state !== 'RUNNING') continue;
      const deltaSeconds = Math.min(delta, projectile.remainingLifetime) / 1000;
      const startX = projectile.visual.x;
      const startY = projectile.visual.y;
      const stepX = projectile.velocityX * deltaSeconds;
      const stepY = projectile.velocityY * deltaSeconds;
      if (projectile.attack.kind === 'HOSTILE_PROJECTILE' && this.player && segmentCircleHitTime(
        startX, startY, stepX, stepY,
        this.player.x, this.player.y, this.playerRadius + projectile.radius,
      ) !== Infinity) {
        if (this.playerDefense) this.damagePlayer({ kind: 'PLAYER_PROJECTILE', run: projectile.run,
          target: this.playerDefense, attack: projectile.attack });
        this.removeProjectile(projectile);
        continue;
      }
      for (let contact = 0; contact < (projectile.attack.kind === 'LASER' ? projectile.attack.mechanics?.maxHits ?? 1 : 1); contact++) {
        let hitEnemy: EnemyRuntime | undefined, firstHit = Infinity;
        for (const enemy of projectile.attack.kind !== 'HOSTILE_PROJECTILE' ? this.enemies : []) {
          if (enemy.run !== projectile.run || enemy.health <= 0 || projectile.visited?.has(enemy)) continue;
          const hit = segmentCircleHitTime(startX, startY, stepX, stepY,
            enemy.visual.x, enemy.visual.y, enemy.collisionRadius + projectile.radius);
          if (hit < firstHit) { firstHit = hit; hitEnemy = enemy; }
        }
        if (!hitEnemy || projectile.attack.kind === 'HOSTILE_PROJECTILE') break;
        const bossWasDefeated = this.bossDefeated;
        const count = projectile.scatterVolley?.contacts.get(hitEnemy) ?? 0;
        const result = this.applyEnemyHit({ kind: 'ENEMY_DIRECT', run: projectile.run, target: hitEnemy, attack: projectile.attack,
          direction: { x: projectile.velocityX, y: projectile.velocityY }, impactFactor: 2 ** -count });
        if (!result) {
          this.removeProjectile(projectile);
          continue projectileLoop;
        }
        if (projectile.scatterVolley) projectile.scatterVolley.contacts.set(hitEnemy, count + 1);
        projectile.visited?.add(hitEnemy);
        const limit = projectile.attack.kind === 'LASER' ? projectile.attack.mechanics?.maxHits ?? 1 : 1;
        if (!projectile.visited || projectile.visited.size >= limit || !bossWasDefeated && this.bossDefeated) {
          this.removeProjectile(projectile);
          if (!bossWasDefeated && this.bossDefeated) this.enterRunVictory();
          if (this.isRunVictorious) return;
          continue projectileLoop;
        }
      }
      projectile.visual.x = startX + stepX;
      projectile.visual.y = startY + stepY;
      projectile.remainingLifetime -= delta;

      const { x, y } = projectile.visual;
      const outsideArena = x < -projectile.radius || x > this.arenaWidth + projectile.radius
        || y < -projectile.radius || y > this.arenaHeight + projectile.radius;
      if (projectile.remainingLifetime <= 0 || outsideArena) {
        this.removeProjectile(projectile);
      }
    }
  }

  private selectNearestEnemy(
    archetype?: EnemyArchetype, origin: { x: number; y: number } | undefined = this.player,
  ): EnemyRuntime | undefined {
    if (!origin) return undefined;

    let nearest: EnemyRuntime | undefined;
    let nearestDistanceSquared = Infinity;
    for (const enemy of this.enemies) {
      if (archetype && enemy.archetype !== archetype) continue;
      const dx = enemy.visual.x - origin.x;
      const dy = enemy.visual.y - origin.y;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < nearestDistanceSquared) {
        nearest = enemy;
        nearestDistanceSquared = distanceSquared;
      }
    }
    return nearest;
  }

  private fireMissile(): void {
    if (this.isSimulationPaused() || !this.player) return;
    if (!this.playerBuild!.getSlots().combat.includes('MISSILE')) return;
    if (this.missiles.length >= this.missile.maxActiveMissiles) return;
    const target = this.selectNearestEnemy();
    if (!target) return;
    const stats = this.playerBuild!.getEffectiveStats();
    const attack = createAttack({ kind: 'MISSILE', variant: this.clusterEvolved ? 'CLUSTER' : 'BASE', snapshot: {
      damage: composePlayerDamage('MISSILE', this.missileValues.damage, this.globalDamageMultiplier, stats.reactorPower, stats.engineering),
      speed: this.missileValues.speed * stats.projectileVelocity,
      radius: this.missile.radius * stats.projectileScale,
      explosionRadius: effectiveMissileExplosionRadius(this.missileValues.explosionRadius, this.moduleLevels.spatial),
      lifetime: this.missile.lifetime, impact: composePlayerImpact(400, stats.impact),
    } }) as MissileAttack;
    const missile: MissileRuntime = {
      attack, run: this.run!,
      get clusterEnabled() { return attack.variant === 'CLUSTER'; },
      get damage() { return attack.snapshot.damage; },
      get speed() { return attack.snapshot.speed; },
      get radius() { return attack.snapshot.radius; },
      get explosionRadius() { return attack.snapshot.explosionRadius; },
      visual: this.add.circle(this.player.x, this.player.y, attack.snapshot.radius, 0xfacc15),
      target,
      headingX: 0,
      headingY: 0,
      remainingLifetime: attack.snapshot.lifetime,
    };
    this.aimMissile(missile);
    this.missiles.push(missile);
  }

  private aimMissile(missile: MissileRuntime): void {
    if (!missile.target) return;
    const dx = missile.target.visual.x - missile.visual.x;
    const dy = missile.target.visual.y - missile.visual.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 0.001) return;
    missile.headingX = dx / distance;
    missile.headingY = dy / distance;
  }

  private updateMissiles(delta: number): void {
    for (let i = this.missiles.length - 1; i >= 0; i -= 1) {
      if (this.isSimulationPaused()) return;
      const missile = this.missiles[i];
      if (missile.run !== this.run || missile.run.state !== 'RUNNING') continue;
      if (!missile.target || !this.enemies.includes(missile.target)) {
        missile.target = this.selectNearestEnemy(undefined, missile.visual);
      }
      this.aimMissile(missile);
      const seconds = Math.min(delta, missile.remainingLifetime) / 1000;
      const startX = missile.visual.x;
      const startY = missile.visual.y;
      const stepX = missile.headingX * missile.speed * seconds;
      const stepY = missile.headingY * missile.speed * seconds;
      let firstHit = Infinity;
      let defeatedBoss = false;
      for (const enemy of this.enemies) {
        const hit = segmentCircleHitTime(startX, startY, stepX, stepY,
          enemy.visual.x, enemy.visual.y, enemy.collisionRadius + missile.radius);
        if (hit < firstHit) firstHit = hit;
      }
      if (firstHit !== Infinity) {
        const impactX = startX + stepX * firstHit;
        const impactY = startY + stepY * firstHit;
        const bossWasDefeated = this.bossDefeated;
        this.explodeMissile(impactX, impactY, missile);
        if (missile.clusterEnabled) this.explodeClusterSatellites(impactX, impactY, missile);
        defeatedBoss = !bossWasDefeated && this.bossDefeated;
      } else {
        missile.visual.x += stepX;
        missile.visual.y += stepY;
        missile.remainingLifetime -= delta;
        const { x, y } = missile.visual;
        const outside = x < -missile.radius || x > this.arenaWidth + missile.radius
          || y < -missile.radius || y > this.arenaHeight + missile.radius;
        if (missile.remainingLifetime > 0 && !outside) continue;
      }
      missile.visual.destroy();
      this.missiles.splice(i, 1);
      // Primary, the full satellite union and Missile cleanup are one atomic detonation.
      if (defeatedBoss) this.enterRunVictory();
      if (this.isRunVictorious) return;
    }
  }

  private explodeMissile(x: number, y: number, missile: MissileRuntime): void {
    if (missile.run !== this.run || missile.run.state !== 'RUNNING') return;
    const { explosionRadius } = missile.attack.snapshot;
    // Snapshot before lethal removals mutate the shared enemy collection.
    const affected = this.enemies.filter(enemy => {
      const dx = enemy.visual.x - x;
      const dy = enemy.visual.y - y;
      return dx * dx + dy * dy <= explosionRadius ** 2;
    });
    for (const enemy of affected) {
      this.applyEnemyHit({ kind: 'ENEMY_BLAST', run: missile.run, target: enemy, attack: missile.attack, phase: 'PRIMARY', origin: { x, y } });
    }
  }

  private explodeClusterSatellites(x: number, y: number, missile: MissileRuntime): void {
    if (missile.run !== this.run || missile.run.state !== 'RUNNING' || missile.attack.variant !== 'CLUSTER') return;
    const offsets = clusterSatelliteOffsets(missile.explosionRadius);
    const radiusSquared = (missile.explosionRadius * 0.5) ** 2;
    // The union is evaluated after primary deaths; snapshot before satellite kills splice enemies.
    const affected: { enemy: EnemyRuntime; origin: Vector }[] = [];
    for (const enemy of this.enemies) {
      const offset = offsets.find(offset => {
        const dx = enemy.visual.x - (x + offset.x);
        const dy = enemy.visual.y - (y + offset.y);
        return dx * dx + dy * dy <= radiusSquared;
      });
      if (offset) affected.push({ enemy, origin: { x: x + offset.x, y: y + offset.y } });
    }
    for (const { enemy, origin } of affected) {
      this.applyEnemyHit({ kind: 'ENEMY_BLAST', run: missile.run, target: enemy, attack: missile.attack, phase: 'SATELLITE', origin });
    }
  }

  private killEnemy(hit: EnemyHit, damage: EnemyDamage, source: EnemyDamageSource): EnemyDeathRecord | null {
    if (hit.run !== this.run || hit.run.state !== 'RUNNING' || hit.target.run !== hit.run) return null;
    const enemy = hit.target;
    const index = this.enemies.indexOf(enemy);
    if (index === -1 || !damage.healthDepleted || !(damage.hpLost > 0)
      || enemy.health !== damage.healthAfter || !(enemy.health <= 0)) return null;
    const actual = enemyHitSource(hit);
    createEnemyDamageSource(source);
    if (actual.kind !== source.kind || actual.variant !== source.variant || actual.phase !== source.phase
      || enemy.lastDamagingSource?.kind !== source.kind || enemy.lastDamagingSource.variant !== source.variant
      || enemy.lastDamagingSource.phase !== source.phase) throw new RangeError('Mismatched lethal Hit source');
    const record = createEnemyDeathRecord(enemyDeathInput(enemy, source));
    if (record.archetype === 'boss') this.bossDefeated = true;
    this.xpPickups.push({
      run: hit.run,
      visual: this.add.circle(record.x, record.y, 10, 0xa3e635)
        .setStrokeStyle(2, 0xecfccb),
      value: record.xpValue,
      speed: 0,
    });
    if (this.currentTarget === enemy) this.currentTarget = undefined;
    enemy.charger?.telegraph.destroy();
    enemy.visual.destroy();
    this.enemies.splice(index, 1);
    this.runDiagnostics!.recordEnemyKilled(record.archetype, record.isElite, record.xpValue, record.killSource);
    return record;
  }

  private createEnemy(
    x: number, y: number, archetype: EnemyArchetype, run: RunLifecycle, eliteTank = false,
  ): EnemyRuntime | null {
    if (run !== this.run) return null;
    const initialChaser = run.state === 'PREPARING' && archetype === 'chaser' && !eliteTank
      && this.enemies.length === 0 && !!this.player
      && x === this.player.x + this.minimumSpawnDistance && y === this.player.y;
    if (run.state !== 'RUNNING' && !initialChaser) return null;
    // Preserve the legacy Scene input normalization; the pure factory rejects incompatible variants.
    const context = archetype === 'tank' && eliteTank
      ? { scalingProfile: DEFAULT_ENEMY_SPAWN_CONTEXT.scalingProfile, variant: 'ELITE_TANK' as const }
      : DEFAULT_ENEMY_SPAWN_CONTEXT;
    const spawnSnapshot = createEnemySpawnSnapshot(ENEMY_DEFINITIONS[archetype], context);
    const data = spawnSnapshot.isElite ? eliteTankData : enemyPresentation[archetype];
    const visual = this.add.polygon(x, y, data.points, data.color);
    visual.setStrokeStyle(spawnSnapshot.isElite || archetype === 'boss' ? 3 : 2, data.outline);
    const enemy: EnemyRuntime = {
      spawnSnapshot, run, visual, health: spawnSnapshot.maxHealth, lastDamagingSource: null,
      knockbackVelocity: { x: 0, y: 0 },
      ...(archetype === 'charger' ? { charger: { state: initialChargerState(), telegraph: this.add.graphics() } } : {}),
      get archetype() { return spawnSnapshot.archetype; },
      get isElite() { return spawnSnapshot.isElite; },
      get contactDamage() { return spawnSnapshot.contactDamage; },
      get xpValue() { return spawnSnapshot.xpValue; },
      get collisionRadius() { return spawnSnapshot.collisionRadius; },
    };
    this.enemies.push(enemy);
    if (archetype === 'boss') this.bossSpawned = true;
    // Initial Chaser is constructed during PREPARING and bootstrapped after seed creation.
    if (run.state === 'RUNNING') this.runDiagnostics!.recordEnemySpawned(archetype, spawnSnapshot.isElite);
    return enemy;
  }

  private consolidateXpPickups(run: RunLifecycle, progression: PlayerProgression): void {
    if (run !== this.run || run.state !== 'RUNNING' || progression !== this.playerProgression || !this.player) return;
    const pickups = this.xpPickups;
    if (pickups.length <= XP_CONSOLIDATION_THRESHOLD) return;
    progression.snapshot(); // Assert live owner before touching physical objects.
    const plan = planXpConsolidation(pickups.map(p => ({ x: p.visual.x, y: p.visual.y, value: p.value,
      eligible: p.run === run && p.visual.active })), this.player, this.xpMagnetRadius);
    const removed = new Set<XpPickup>();
    for (const [older, newer] of plan) {
      const a = pickups[older], b = pickups[newer];
      if (run !== this.run || run.state !== 'RUNNING' || progression !== this.playerProgression
        || pickups !== this.xpPickups || removed.has(a) || removed.has(b)) break;
      const eligible = (p: XpPickup) => p.run === run && p.visual.active
        && Number.isFinite(p.visual.x) && Number.isFinite(p.visual.y)
        && Number.isSafeInteger(p.value) && p.value > 0
        && Math.hypot(p.visual.x - this.player!.x, p.visual.y - this.player!.y) > this.xpMagnetRadius;
      if (!eligible(a) || !eligible(b) || a.value > Number.MAX_SAFE_INTEGER - b.value
        || Math.floor(a.visual.x / XP_CONSOLIDATION_CELL_SIZE) !== Math.floor(b.visual.x / XP_CONSOLIDATION_CELL_SIZE)
        || Math.floor(a.visual.y / XP_CONSOLIDATION_CELL_SIZE) !== Math.floor(b.visual.y / XP_CONSOLIDATION_CELL_SIZE)) continue;
      a.value += b.value;
      a.speed = 0;
      b.visual.destroy();
      removed.add(b);
    }
    // Keep the captured array identity for exact-create cleanup, and preserve survivor order.
    if (removed.size) {
      let write = 0;
      for (const p of pickups) if (!removed.has(p)) pickups[write++] = p;
      pickups.length = write;
    }
  }

  private preflightProgressionObservations(increments: Partial<Record<'xpCredited' | 'xpCollected' | 'xpDevCredited'
    | 'levelsGained' | 'offersPresented' | 'choicesAccepted' | 'pauseEntries' | 'pauseResumes', number>>, rows = 0): void {
    const snapshot = this.runDiagnostics!.snapshot();
    if (snapshot.terminal) throw new Error('Cannot observe progression after terminal');
    for (const [key, amount] of Object.entries(increments)) {
      const current = snapshot.aggregates[key as keyof typeof increments];
      if (!Number.isSafeInteger(current) || !Number.isSafeInteger(amount) || amount < 0
        || current < 0 || current > Number.MAX_SAFE_INTEGER - amount) throw new RangeError('Progression diagnostic overflow');
    }
    const evictions = Math.max(0, snapshot.timeline.length + rows - 256);
    if (snapshot.droppedTimelineRecords > Number.MAX_SAFE_INTEGER - evictions) throw new RangeError('Progression timeline overflow');
  }

  private creditExperience(amount: number, collectedPickup: XpPickup | undefined, run: RunLifecycle, progression: PlayerProgression): boolean {
    if (run !== this.run || run?.state !== 'RUNNING' || progression !== this.playerProgression || !progression || !this.player) return false;
    const before = progression.snapshot();
    if (collectedPickup) {
      if (collectedPickup.run !== run || !this.xpPickups.includes(collectedPickup) || !collectedPickup.visual.active) return false;
      if (!Number.isSafeInteger(collectedPickup.value) || collectedPickup.value <= 0 || amount !== collectedPickup.value) {
        throw new RangeError('Invalid physical XP credit');
      }
    } else if (amount !== before.threshold - before.xp) return false;
    const next = addExperience(before, amount), levelsGained = next.level - before.level;
    const pending = before.pendingLevels + levelsGained;
    if (!Number.isSafeInteger(pending) || pending > next.level - 1) throw new RangeError('Invalid pending levels');
    this.preflightProgressionObservations({ xpCredited: amount, [collectedPickup ? 'xpCollected' : 'xpDevCredited']: amount,
      levelsGained, ...(pending > 0 ? { offersPresented: 1, pauseEntries: 1 } : {}) }, pending > 0 ? 2 : 0);
    if (amount === 0) return true;
    progression.creditXp(amount);
    this.updateHud();
    if (collectedPickup) {
      collectedPickup.visual.destroy();
      this.xpPickups.splice(this.xpPickups.indexOf(collectedPickup), 1);
    }
    this.runDiagnostics!.recordXpCredited(amount, levelsGained, collectedPickup ? 'pickup' : 'dev');
    if (pending > 0) this.enterLevelUpPause(run, progression);
    return true;
  }

  private publishDevTools(): void {
    // Phaser reuses this Scene on restart: validity belongs to this create, not this object.
    const run = this.run!, progression = this.playerProgression!;
    let valid = true;
    const canMutate = () => valid && this.run === run && this.playerProgression === progression && !this.isSimulationPaused() && !!this.player;
    const activeWarden = () => this.enemies.find(enemy => enemy.archetype === 'boss' && enemy.health > 0);
    const api: DevTools = {
      snapshot: () => {
        if (!valid) return null;
        const boss = activeWarden();
        const defense = this.playerDefense!.snapshot();
        const { level, xp, threshold } = progression.snapshot();
        return {
          runSeed: this.runRandom!.runSeed,
          diagnostics: this.runDiagnostics!.snapshot(),
          build: this.playerBuild!.snapshot(),
          runState: this.run!.state, pauseReasons: this.run!.pauseReasons,
          isPlayerDead: this.isPlayerDead, isRunVictorious: this.isRunVictorious,
          isLevelUpPaused: this.isLevelUpPaused, godMode: this.godMode,
          playerHealth: defense.currentHull, playerShield: defense.currentShield,
          progression: { level, xp, threshold },
          protectionRemaining: defense.protectionRemaining,
          bossSpawned: this.bossSpawned, bossDefeated: this.bossDefeated,
          warden: boss ? { health: boss.health, phase: wardenPhase(boss.health) ?? null } : null,
          successfulTimedSpawns: this.successfulTimedSpawns, activeEnemyCount: this.enemies.length,
          gameplayTimerCount: this.gameplayTimers.filter(timer => !!timer.callback).length,
        };
      },
      forceLevelUp: () => {
        if (!canMutate()) return false;
        const state = progression.snapshot();
        return this.creditExperience(state.threshold - state.xp, undefined, run, progression);
      },
      spawnWarden: () => {
        if (!canMutate() || this.bossSpawned || this.bossDefeated || activeWarden()
          || this.enemies.length >= this.maximumEnemies) return false;
        const player = this.player!;
        const margin = Math.max(this.enemyMargin, ENEMY_DEFINITIONS.boss.collisionRadius);
        const x = player.x < this.arenaWidth / 2 ? this.arenaWidth - margin : margin;
        const y = player.y < this.arenaHeight / 2 ? this.arenaHeight - margin : margin;
        if (x < margin || x > this.arenaWidth - margin || y < margin || y > this.arenaHeight - margin
          || Math.hypot(x - player.x, y - player.y) < this.minimumSpawnDistance) return false;
        return this.createEnemy(x, y, 'boss', run) !== null;
      },
      setWardenHealth: health => {
        if (!canMutate() || typeof health !== 'number' || !Number.isFinite(health)
          || health < 1 || health > 60) return false;
        const boss = activeWarden();
        if (!boss) return false;
        boss.health = health;
        return true;
      },
      setGodMode: enabled => {
        if (!canMutate() || typeof enabled !== 'boolean') return false;
        this.godMode = enabled;
        return true;
      },
    };
    window.__NEBULA_DEV__ = api;
    const invalidate = () => {
      valid = false;
      if (window.__NEBULA_DEV__ === api) delete window.__NEBULA_DEV__;
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, invalidate);
      this.events.off(Phaser.Scenes.Events.DESTROY, invalidate);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, invalidate);
    this.events.once(Phaser.Scenes.Events.DESTROY, invalidate);
  }

  private spawnEnemy(run: RunLifecycle): void {
    if (run !== this.run || run.state !== 'RUNNING') return;
    if (!this.player || this.enemies.length >= this.maximumEnemies) return;
    if (this.enemies.some(enemy => enemy.archetype === 'boss' && enemy.health > 0)) return;

    const nextTimedSpawnNumber = this.successfulTimedSpawns + 1;
    const spawnBoss = shouldSpawnWarden(nextTimedSpawnNumber, this.bossSpawned);
    const margin = spawnBoss ? Math.max(this.enemyMargin, ENEMY_DEFINITIONS.boss.collisionRadius) : this.enemyMargin;

    const view = this.cameras.main.worldView;
    const encounter = this.runRandom!.encounter.next;
    const side = Math.floor(encounter() * 4);
    // One enemy width beyond a camera edge, then keep the whole polygon in the arena.
    let x = side < 2
      ? (side === 0 ? view.left - 48 : view.right + 48)
      : view.left + encounter() * (view.right - view.left);
    let y = side < 2
      ? view.top + encounter() * (view.bottom - view.top)
      : (side === 2 ? view.top - 48 : view.bottom + 48);
    x = Phaser.Math.Clamp(x, margin, this.arenaWidth - margin);
    y = Phaser.Math.Clamp(y, margin, this.arenaHeight - margin);

    if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < this.minimumSpawnDistance) {
      // At arena edges the chosen side may be too close; the opposite corner is safely distant.
      x = this.player.x < this.arenaWidth / 2 ? this.arenaWidth - margin : margin;
      y = this.player.y < this.arenaHeight / 2 ? this.arenaHeight - margin : margin;
    }

    const archetype = spawnBoss ? 'boss' : timedSpawnSequence[this.successfulTimedSpawns % timedSpawnSequence.length];
    const elite = archetype !== 'boss' && shouldSpawnEliteTank(archetype, nextTimedSpawnNumber);
    if (this.createEnemy(x, y, archetype, run, elite)) this.successfulTimedSpawns += 1;
  }
}
