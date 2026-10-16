import * as Phaser from 'phaser';
import { segmentCircleHitTime } from '../combat/collision';
import { prismSpread } from '../combat/prismSpread';
import { clusterSatelliteOffsets } from '../combat/clusterSatellites';
import { shooterMovement } from '../enemies/shooterMovement';
import { shouldSpawnEliteTank } from '../enemies/eliteTank';
import { shouldSpawnWarden, wardenPhase, wardenBurstDirections } from '../enemies/warden';
import { stepDash } from '../player/dash';
import { selectChoices } from '../progression/selectChoices';
import { effectiveMissileExplosionRadius } from '../progression/spatialAmplifier';
import { effectiveDroneBoltRadius } from '../progression/replicationMatrix';
import { canEvolveClusterMissile } from '../progression/clusterMissile';
import { canEvolveTwinDrone } from '../progression/twinDrone';
import { selectEvolutionOffer, type Evolution } from '../progression/evolutionOffer';
import { selectFocusedUpgrade, type MissileRanks, type DroneRanks, type WeaponFocus, type FocusCursors } from '../progression/focusedUpgrade';
import { canEvolvePrismLaser, type LaserRanks } from '../progression/prismLaser';
import { addExperience, xpForNextLevel, type ExperienceState } from '../progression/experience';

type LaserUpgrade = keyof LaserRanks;
type PassiveModule = 'hull' | 'thruster' | 'collector' | 'combat' | 'spatial' | 'replication';
type OrdinaryChoice = { kind: 'laser'; upgrade: LaserUpgrade }
  | { kind: 'missile'; upgrade: keyof MissileRanks }
  | { kind: 'drone'; upgrade: keyof DroneRanks } | { kind: 'passive'; module: PassiveModule };
type LevelUpChoice = OrdinaryChoice | { kind: 'prism' } | { kind: 'cluster' } | { kind: 'twin' };

const levelUpPool: readonly OrdinaryChoice[] = [
  { kind: 'laser', upgrade: 'power' },
  { kind: 'laser', upgrade: 'fireRate' },
  { kind: 'laser', upgrade: 'speed' },
  { kind: 'missile', upgrade: 'warheadPower' },
  { kind: 'missile', upgrade: 'propulsion' },
  { kind: 'missile', upgrade: 'blastExpansion' },
  { kind: 'drone', upgrade: 'boltPower' },
  { kind: 'drone', upgrade: 'firingSystem' },
  { kind: 'drone', upgrade: 'boltPropulsion' },
  { kind: 'passive', module: 'hull' },
  { kind: 'passive', module: 'thruster' },
  { kind: 'passive', module: 'collector' },
  { kind: 'passive', module: 'combat' },
  { kind: 'passive', module: 'spatial' },
  { kind: 'passive', module: 'replication' },
];

type EnemyArchetype = 'chaser' | 'shooter' | 'tank' | 'boss';

const enemyData = {
  chaser: { health: 3, speed: 180, points: [24, 0, 48, 24, 24, 48, 0, 24], color: 0xf43f5e, outline: 0xffcdd2 },
  shooter: { health: 2, speed: 140, points: [8, 8, 40, 8, 40, 40, 8, 40], color: 0xa855f7, outline: 0xe9d5ff },
  tank: { health: 6, speed: 100, points: [12, 4, 36, 4, 48, 24, 36, 44, 12, 44, 0, 24], color: 0xf59e0b, outline: 0xfef3c7 },
  boss: { health: 60, speed: 70, points: [40, 0, 68, 12, 80, 40, 68, 68, 40, 80, 12, 68, 0, 40, 12, 12], color: 0xd946ef, outline: 0xfae8ff },
} satisfies Record<EnemyArchetype, { health: number; speed: number; points: number[]; color: number; outline: number }>;

const eliteTankData = {
  ...enemyData.tank, health: 18, speed: 120, contactDamage: 2, xpValue: 5,
  color: 0xfacc15, outline: 0xfffbeb,
} as const;

const wardenPhaseTwo = { speed: 100, color: 0xdc2626, outline: 0xfb923c } as const;

const timedSpawnSequence: readonly Exclude<EnemyArchetype, 'boss'>[] = ['chaser', 'chaser', 'chaser', 'shooter', 'chaser', 'tank'];

type EnemyRuntime = {
  archetype: EnemyArchetype;
  readonly isElite: boolean;
  readonly contactDamage: number;
  readonly xpValue: number;
  readonly collisionRadius: number;
  visual: Phaser.GameObjects.Polygon;
  health: number;
};

type XpPickup = {
  visual: Phaser.GameObjects.Arc;
  value: number;
  speed: number;
};

type ProjectileRuntime = {
  source: 'player' | 'enemy';
  damage: number;
  radius: number;
  visual: Phaser.GameObjects.Arc;
  velocityX: number;
  velocityY: number;
  remainingLifetime: number;
};

type MissileRuntime = {
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
  private playerExperience: ExperienceState = { level: 1, xp: 0 };
  private isPlayerDead = false;
  private isLevelUpPaused = false;
  private levelUpPresentation: Phaser.GameObjects.Text[] = [];
  private moduleLevels: Record<PassiveModule, number> = { hull: 0, thruster: 0, collector: 0, combat: 0, spatial: 0, replication: 0 };
  private globalDamageMultiplier = 1;
  private playerMaxHealth = 5;
  private playerHealth = this.playerMaxHealth;
  private readonly playerRadius = 20;
  private readonly contactDamage = 1;
  private readonly playerDamageProtectionDuration = 500;
  private playerDamageProtectionRemaining = 0;
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
  private weaponFocus: WeaponFocus = 'laser';
  private focusCursors: FocusCursors = { laser: 0, missile: 0, drone: 0 };
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<'up' | 'left' | 'down' | 'right', Phaser.Input.Keyboard.Key>;
  private readonly movementDirection = new Phaser.Math.Vector2();
  private movementSpeed = 300;
  private dashKey?: Phaser.Input.Keyboard.Key;
  private readonly dashDirection = new Phaser.Math.Vector2();
  private readonly dashSpeed = 900;
  private readonly dashDuration = 200;
  private readonly dashCooldown = 3000;
  private dashRemaining = 0;
  private dashCooldownRemaining = 0;
  private readonly chaseDirection = new Phaser.Math.Vector2();
  private readonly shooterMinimumRange = 350;
  private readonly shooterMaximumRange = 500;
  private successfulTimedSpawns = 0;
  private bossSpawned = false;
  bossDefeated = false;
  private readonly enemyRadius = 24;
  private readonly hostileFireInterval = 1500;
  private readonly hostileSpeed = 600;
  private readonly hostileLifetime = 3000;
  private readonly hostileDamage = 1;
  private laser = { damage: 1, fireInterval: 600, projectileSpeed: 1200 };
  private laserRanks: LaserRanks = { power: 0, fireRate: 0, speed: 0 };
  private prismEvolved = false;
  private clusterEvolved = false;
  private evolutionOfferCursor: Evolution = 'prism';
  private laserTimer?: Phaser.Time.TimerEvent;
  private readonly projectileLifetime = 2000;
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
    this.moduleLevels = { hull: 0, thruster: 0, collector: 0, combat: 0, spatial: 0, replication: 0 };
    this.playerMaxHealth = 5;
    this.movementSpeed = 300;
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
    this.dashKey = undefined;
    this.laser = { damage: 1, fireInterval: 600, projectileSpeed: 1200 };
    this.laserRanks = { power: 0, fireRate: 0, speed: 0 };
    this.missileRanks = { warheadPower: 0, propulsion: 0, blastExpansion: 0 };
    this.missileValues = { damage: 2, speed: 450, explosionRadius: 120 };
    this.weaponFocus = 'laser';
    this.focusCursors = { laser: 0, missile: 0, drone: 0 };
    this.prismEvolved = false;
    this.clusterEvolved = false;
    this.evolutionOfferCursor = 'prism';
    this.playerExperience = { level: 1, xp: 0 };
    this.isPlayerDead = false;
    this.isLevelUpPaused = false;
    this.levelUpPresentation = [];
    this.playerHealth = this.playerMaxHealth;
    this.playerDamageProtectionRemaining = 0;
    this.enemies = [];
    this.successfulTimedSpawns = 0;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.xpPickups = [];
    this.currentTarget = undefined;
    this.projectiles = [];
    this.missiles = [];
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#050816');

    this.hud = this.add.text(32, 24, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      color: '#e2e8f0',
      backgroundColor: '#050816',
      padding: { x: 12, y: 8 },
    }).setScrollFactor(0).setDepth(1);
    this.updateHud();

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
    this.updateDrone(0);

    this.createEnemy(this.player.x + this.minimumSpawnDistance, this.player.y, 'chaser');

    this.cameras.main.setBounds(0, 0, this.arenaWidth, this.arenaHeight);
    this.cameras.main.startFollow(this.player);
    this.cameras.main.centerOn(this.player.x, this.player.y);

    this.time.addEvent({
      delay: this.spawnInterval,
      loop: true,
      callback: () => this.spawnEnemy(),
    });

    this.laserTimer = this.time.addEvent({
      delay: this.laser.fireInterval,
      loop: true,
      callback: () => this.fireLaser(),
    });

    this.time.addEvent({
      delay: this.missile.fireInterval,
      loop: true,
      callback: () => this.fireMissile(),
    });

    this.droneTimer = this.time.addEvent({
      delay: this.droneAttackValues.fireInterval,
      loop: true,
      callback: () => this.fireDrone(),
    });

    this.time.addEvent({
      delay: this.hostileFireInterval,
      loop: true,
      callback: () => this.fireHostileProjectile(),
    });

    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.dashKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.cursors = keyboard.createCursorKeys();
      this.wasd = {
        up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    this.add
      .text(width / 2, 80, 'NEBULA — GAMEPLAY SCENE', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        color: '#e2e8f0',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.add
      .text(width / 2, height - 80, 'Placeholder space arena', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#7dd3fc',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
  }

  private updateHud(): void {
    this.hud?.setText([
      `HP: ${this.playerHealth}/${this.playerMaxHealth}`,
      `XP: ${this.playerExperience.xp}/${xpForNextLevel(this.playerExperience.level)}`,
      `Level: ${this.playerExperience.level}`,
      `Dash: ${this.dashCooldownRemaining > 0 ? `${Math.ceil(this.dashCooldownRemaining / 100) / 10}s` : 'READY'}`,
    ]);
  }

  update(_time: number, delta: number): void {
    // Consume even rejected presses so pause/death/cooldown cannot queue a Dash.
    const dashPressed = this.dashKey
      ? Phaser.Input.Keyboard.JustDown(this.dashKey) && this.dashKey.isDown && !this.dashKey.originalEvent?.repeat
      : false;
    if (this.isSimulationPaused()) return;
    if (!this.player || !this.cursors || !this.wasd) return;

    const left = this.wasd.left.isDown || this.cursors.left.isDown;
    const right = this.wasd.right.isDown || this.cursors.right.isDown;
    const up = this.wasd.up.isDown || this.cursors.up.isDown;
    const down = this.wasd.down.isDown || this.cursors.down.isDown;

    this.movementDirection.set(Number(right) - Number(left), Number(down) - Number(up));
    this.movementDirection.normalize();

    const previousCooldownDisplay = Math.ceil(this.dashCooldownRemaining / 100);
    if (dashPressed && this.dashRemaining === 0 && this.dashCooldownRemaining === 0
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

    for (const enemy of this.enemies) {
      this.chaseDirection.set(this.player.x - enemy.visual.x, this.player.y - enemy.visual.y);
      let speed = enemy.isElite ? eliteTankData.speed : enemyData[enemy.archetype].speed;
      if (enemy.archetype === 'boss') {
        const phase = wardenPhase(enemy.health);
        if (!phase) continue;
        speed = phase === 2 ? wardenPhaseTwo.speed : enemyData.boss.speed;
        enemy.visual.setFillStyle(phase === 2 ? wardenPhaseTwo.color : enemyData.boss.color);
        if (enemy !== this.currentTarget) this.restoreEnemyOutline(enemy);
      }
      if (enemy.archetype === 'shooter') {
        const step = shooterMovement(this.chaseDirection.x, this.chaseDirection.y, speed, delta,
          this.shooterMinimumRange, this.shooterMaximumRange);
        this.chaseDirection.set(step.x, step.y);
      } else {
        const chaseDistance = this.chaseDirection.length();
        const chaseStep = Math.min(speed * (delta / 1000), chaseDistance);
        this.chaseDirection.normalize().scale(chaseStep);
      }
      enemy.visual.x += this.chaseDirection.x;
      enemy.visual.y += this.chaseDirection.y;
      const margin = Math.max(this.enemyMargin, enemy.collisionRadius);
      enemy.visual.x = Phaser.Math.Clamp(enemy.visual.x, margin, this.arenaWidth - margin);
      enemy.visual.y = Phaser.Math.Clamp(enemy.visual.y, margin, this.arenaHeight - margin);
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
    this.updatePlayerContact();
    this.updateXpPickups(delta);
  }

  private isSimulationPaused(): boolean {
    return this.isPlayerDead || this.isLevelUpPaused;
  }

  private restoreEnemyOutline(enemy: EnemyRuntime): void {
    const outline = enemy.archetype === 'boss' && wardenPhase(enemy.health) === 2
      ? wardenPhaseTwo.outline : enemy.isElite ? eliteTankData.outline : enemyData[enemy.archetype].outline;
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

  private enterLevelUpPause(): void {
    if (this.isSimulationPaused()) return;
    this.isLevelUpPaused = true;
    const title = this.add.text(this.scale.width / 2, this.scale.height / 2 - 160, 'LEVEL UP — CHOOSE ONE', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '64px',
      color: '#a3e635',
      backgroundColor: '#050816',
      padding: { x: 24, y: 16 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1);
    this.levelUpPresentation.push(title);
    const ordinaryPool = levelUpPool.filter(option =>
      option.kind === 'passive' || (option.kind === 'laser'
        ? this.laserRanks[option.upgrade] < 2 : option.kind === 'missile'
          ? this.missileRanks[option.upgrade] < 2 : this.droneRanks[option.upgrade] < 2));
    const focused = selectFocusedUpgrade(this.weaponFocus, this.laserRanks, this.missileRanks, this.droneRanks, this.focusCursors);
    // Keep canonical pool entries so later slots can exclude by identity.
    const focusedChoice = focused && ordinaryPool.find(option =>
      option.kind !== 'passive' && option.kind === focused.kind && option.upgrade === focused.upgrade);
    const first = focusedChoice ?? selectChoices(ordinaryPool, 1)[0];
    if (focused) this.focusCursors[focused.kind] = focused.nextCursor;
    const second = selectChoices(ordinaryPool.filter(option => option.kind === 'passive' && option !== first), 1)[0];
    // Eligibility belongs to this presentation; completing a prerequisite only affects the next one.
    const prismEligible = canEvolvePrismLaser(this.laserRanks, this.moduleLevels.combat, this.prismEvolved);
    const clusterEligible = canEvolveClusterMissile(this.missileRanks, this.moduleLevels.spatial, this.clusterEvolved);
    const twinEligible = canEvolveTwinDrone(this.droneRanks, this.moduleLevels.replication, this.twinDroneEvolved);
    const evolution = selectEvolutionOffer(prismEligible, clusterEligible, twinEligible, this.evolutionOfferCursor);
    this.evolutionOfferCursor = evolution.nextCursor;
    const third: LevelUpChoice = evolution.offered ? { kind: evolution.offered }
      : selectChoices(ordinaryPool.filter(option => option !== first && option !== second), 1)[0];
    const choices: LevelUpChoice[] = [first, second, third];
    choices.forEach((option, index) => {
      const choice = this.add.text(this.scale.width / 2, this.scale.height / 2 - 40 + index * 110,
        this.choiceLabel(option), {
          fontFamily: 'Arial, sans-serif',
          fontSize: '32px',
          align: 'center',
          color: '#e0f2fe',
          backgroundColor: '#1e3a5f',
          padding: { x: 24, y: 12 },
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1)
        .setInteractive({ useHandCursor: true });
      this.levelUpPresentation.push(choice);
      choice.once('pointerdown', () => this.acceptLevelUpChoice(choice, option));
    });
  }

  private choiceLabel(choice: LevelUpChoice): string {
    if (choice.kind === 'prism') return 'EVOLVE: Prism Laser\nThree beams — full Laser damage each';
    if (choice.kind === 'cluster') return 'EVOLVE: Cluster Missile\nPrimary blast + 6 satellite explosions';
    if (choice.kind === 'twin') return 'EVOLVE: Twin Drone Formation\nMirrored companion, synchronized Drone bolts';
    if (choice.kind === 'drone') {
      const rank = this.droneRanks[choice.upgrade] + 1;
      switch (choice.upgrade) {
        case 'boltPower': return `Drone: Bolt Power Rank ${rank}/2\n+1 bolt damage`;
        case 'firingSystem': return `Drone: Firing System Rank ${rank}/2\n-150 ms firing interval`;
        case 'boltPropulsion': return `Drone: Bolt Propulsion Rank ${rank}/2\n+200 px/s bolt speed`;
      }
    }
    if (choice.kind === 'laser') {
      switch (choice.upgrade) {
        case 'power': return 'Laser Power — +1 damage';
        case 'fireRate': return 'Laser Fire Rate — -50 ms (min 100 ms)';
        case 'speed': return 'Laser Projectile Speed — +200 px/s';
      }
    }
    if (choice.kind === 'missile') {
      const rank = this.missileRanks[choice.upgrade] + 1;
      switch (choice.upgrade) {
        case 'warheadPower': return `Missile Warhead Power Rank ${rank}/2\n+1 explosion damage`;
        case 'propulsion': return `Missile Propulsion Rank ${rank}/2\n+75 px/s flight speed`;
        case 'blastExpansion': return `Missile Blast Expansion Rank ${rank}/2\n+30 px explosion radius`;
      }
    }
    const level = this.moduleLevels[choice.module] + 1;
    switch (choice.module) {
      case 'hull': return `Passive: Hull Plating Lv. ${level}\n+1 Max HP / Heal 1`;
      case 'thruster': return `Passive: Thruster Module Lv. ${level}\n+30 px/s normal movement`;
      case 'collector': return `Passive: Collector Field Lv. ${level}\n+40 px magnet radius`;
      case 'combat': return `Passive: Combat Processor Lv. ${level}\n+0.25x player weapon damage`;
      case 'spatial': return `Passive: Spatial Amplifier Lv. ${level}\n+15 Missile explosion radius`;
      case 'replication': return `Passive: Replication Matrix Lv. ${level}\n+1 Drone bolt radius`;
    }
  }

  private acceptLevelUpChoice(choice: Phaser.GameObjects.Text, option: LevelUpChoice): void {
    if (this.isPlayerDead || !this.isLevelUpPaused || !this.levelUpPresentation.includes(choice)) return;
    if (option.kind === 'laser' && this.laserRanks[option.upgrade] >= 2) return;
    if (option.kind === 'missile' && this.missileRanks[option.upgrade] >= 2) return;
    if (option.kind === 'drone' && this.droneRanks[option.upgrade] >= 2) return;
    if (option.kind === 'prism' && this.prismEvolved) return;
    if (option.kind === 'cluster' && this.clusterEvolved) return;
    if (option.kind === 'twin' && this.twinDroneEvolved) return;
    if (this.dashKey) Phaser.Input.Keyboard.JustDown(this.dashKey);
    if (option.kind === 'laser') this.laserRanks[option.upgrade] += 1;
    if (option.kind === 'prism') this.prismEvolved = true;
    if (option.kind === 'cluster') {
      this.clusterEvolved = true;
      this.weaponFocus = 'missile';
    }
    if (option.kind === 'twin') {
      this.twinDroneEvolved = true;
      this.weaponFocus = 'drone';
      this.twinDrone = this.add.circle(0, 0, this.droneConfig.visualRadius, 0x2dd4bf)
        .setStrokeStyle(2, 0xccfbf1);
      this.positionDrone(this.twinDrone, this.droneAngle + Math.PI);
    }
    if (option.kind === 'laser' || option.kind === 'prism') this.weaponFocus = 'laser';
    if (option.kind === 'drone') {
      this.weaponFocus = 'drone';
      this.droneRanks[option.upgrade] += 1;
      switch (option.upgrade) {
        case 'boltPower': this.droneAttackValues.damage += 1; break;
        case 'boltPropulsion': this.droneAttackValues.projectileSpeed += 200; break;
        case 'firingSystem':
          this.droneAttackValues.fireInterval -= 150;
          this.droneTimer?.reset({
            delay: this.droneAttackValues.fireInterval,
            loop: true,
            callback: () => this.fireDrone(),
          });
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
      this.moduleLevels[option.module] += 1;
      switch (option.module) {
        case 'hull':
          this.playerMaxHealth += 1;
          this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 1);
          this.updateHud();
          break;
        case 'thruster': this.movementSpeed += 30; break;
        case 'collector': this.xpMagnetRadius += 40; break;
        case 'combat': this.globalDamageMultiplier += 0.25; break;
      }
    }
    if (option.kind === 'laser' && option.upgrade === 'power') this.laser.damage += 1;
    if (option.kind === 'laser' && option.upgrade === 'speed') this.laser.projectileSpeed += 200;
    if (option.kind === 'laser' && option.upgrade === 'fireRate') {
      this.laser.fireInterval = Math.max(100, this.laser.fireInterval - 50);
      this.laserTimer?.reset({
        delay: this.laser.fireInterval,
        loop: true,
        callback: () => this.fireLaser(),
      });
    }
    this.isLevelUpPaused = false;
    for (const text of this.levelUpPresentation) text.destroy();
    this.levelUpPresentation = [];
  }

  private updateXpPickups(delta: number): void {
    if (!this.player || this.isSimulationPaused()) return;
    for (let i = this.xpPickups.length - 1; i >= 0; i -= 1) {
      if (this.isSimulationPaused()) return;
      const pickup = this.xpPickups[i];
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
      pickup.speed = Math.min(this.xpMagnetMaxSpeed,
        pickup.speed + this.xpMagnetAcceleration * seconds);
      if (distance <= this.xpCollectionRadius + step) {
        const previousLevel = this.playerExperience.level;
        this.playerExperience = addExperience(this.playerExperience, pickup.value);
        this.updateHud();
        pickup.visual.destroy();
        this.xpPickups.splice(i, 1);
        if (this.playerExperience.level > previousLevel) this.enterLevelUpPause();
        continue;
      }
      pickup.visual.x += dx / distance * step;
      pickup.visual.y += dy / distance * step;
    }
  }

  private updatePlayerProtection(delta: number): void {
    if (!this.player) return;
    this.playerDamageProtectionRemaining = Math.max(0, this.playerDamageProtectionRemaining - delta);
    if (this.playerDamageProtectionRemaining > 0) return;
    this.player.setAlpha(1);
  }

  private updatePlayerContact(): void {
    if (this.isSimulationPaused()) return;
    if (!this.player || this.playerHealth === 0 || this.playerDamageProtectionRemaining > 0) return;

    for (const enemy of this.enemies) {
      const radius = this.playerRadius + enemy.collisionRadius;
      const dx = enemy.visual.x - this.player.x;
      const dy = enemy.visual.y - this.player.y;
      if (dx * dx + dy * dy <= radius * radius) {
        this.damagePlayer(enemy.contactDamage);
        break;
      }
    }
  }

  private damagePlayer(amount: number): void {
    if (this.isSimulationPaused()) return;
    if (!this.player || this.playerHealth === 0 || this.playerDamageProtectionRemaining > 0) return;
    this.playerHealth = Math.max(0, this.playerHealth - amount);
    this.updateHud();
    this.playerDamageProtectionRemaining = this.playerDamageProtectionDuration;
    this.player.setAlpha(0.5);
    if (this.playerHealth === 0) this.enterPlayerDeath();
  }

  private enterPlayerDeath(): void {
    if (this.isPlayerDead) return;
    this.isPlayerDead = true;
    this.player?.setAlpha(0.25);
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'SHIP DESTROYED', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '64px',
      color: '#fca5a5',
      backgroundColor: '#050816',
      padding: { x: 24, y: 16 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1);
    this.add.text(this.scale.width / 2, this.scale.height / 2 + 100, 'RETRY', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '40px',
      color: '#e0f2fe',
      backgroundColor: '#1e3a5f',
      padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1)
      .setInteractive({ useHandCursor: true })
      .once('pointerdown', () => {
        if (this.isPlayerDead) this.scene.restart();
      });
  }

  private fireLaser(): void {
    if (this.isSimulationPaused()) return;
    if (!this.player || !this.currentTarget) return;

    if (this.prismEvolved) {
      const directions = prismSpread(this.currentTarget.visual.x - this.player.x,
        this.currentTarget.visual.y - this.player.y);
      for (const direction of directions) {
        this.launchPlayerProjectile(this.player, direction, this.laser.damage,
          this.laser.projectileSpeed, this.projectileLifetime, this.projectileRadius, 0x67e8f9);
      }
      return;
    }
    this.firePlayerProjectile(this.player, this.currentTarget, this.laser.damage,
      this.laser.projectileSpeed, this.projectileLifetime, this.projectileRadius, 0x67e8f9);
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
    this.fireDroneFrom(this.drone);
    if (this.twinDrone) this.fireDroneFrom(this.twinDrone);
  }

  private fireDroneFrom(origin: Phaser.GameObjects.Arc): void {
    const target = this.selectNearestEnemy(undefined, origin);
    if (!target) return;
    this.firePlayerProjectile(origin, target, this.droneAttackValues.damage, this.droneAttackValues.projectileSpeed,
      this.droneConfig.lifetime, effectiveDroneBoltRadius(this.droneConfig.boltRadius, this.moduleLevels.replication), 0xc084fc);
  }

  private firePlayerProjectile(
    origin: { x: number; y: number }, target: EnemyRuntime,
    damage: number, speed: number, lifetime: number, radius: number, color: number,
  ): void {
    const dx = target.visual.x - origin.x;
    const dy = target.visual.y - origin.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 0.001) return;

    this.launchPlayerProjectile(origin, { x: dx / distance, y: dy / distance },
      damage, speed, lifetime, radius, color);
  }

  private launchPlayerProjectile(
    origin: { x: number; y: number }, direction: { x: number; y: number },
    damage: number, speed: number, lifetime: number, radius: number, color: number,
  ): void {
    this.projectiles.push({
      source: 'player',
      damage: damage * this.globalDamageMultiplier,
      radius,
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
      if (distance >= 0.001) this.launchHostileProjectile(enemy.visual, dx / distance, dy / distance);
    }
    const boss = this.enemies.find(candidate => candidate.archetype === 'boss' && candidate.health > 0);
    if (boss) {
      const phase = wardenPhase(boss.health);
      if (phase) for (const direction of wardenBurstDirections(phase)) {
        this.launchHostileProjectile(boss.visual, direction.x, direction.y);
      }
    }
  }

  private launchHostileProjectile(origin: { x: number; y: number }, directionX: number, directionY: number): void {
    this.projectiles.push({
      source: 'enemy',
      damage: this.hostileDamage,
      radius: this.projectileRadius,
      visual: this.add.circle(origin.x, origin.y, this.projectileRadius, 0xfb923c),
      velocityX: directionX * this.hostileSpeed,
      velocityY: directionY * this.hostileSpeed,
      remainingLifetime: this.hostileLifetime,
    });
  }

  private updateProjectiles(delta: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      if (this.isSimulationPaused()) return;
      const projectile = this.projectiles[i];
      const deltaSeconds = Math.min(delta, projectile.remainingLifetime) / 1000;
      const startX = projectile.visual.x;
      const startY = projectile.visual.y;
      const stepX = projectile.velocityX * deltaSeconds;
      const stepY = projectile.velocityY * deltaSeconds;
      if (projectile.source === 'enemy' && this.player && segmentCircleHitTime(
        startX, startY, stepX, stepY,
        this.player.x, this.player.y, this.playerRadius + projectile.radius,
      ) !== Infinity) {
        this.damagePlayer(projectile.damage);
        projectile.visual.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }
      let hitEnemy: EnemyRuntime | undefined;
      let firstHit = Infinity;
      for (const enemy of projectile.source === 'player' ? this.enemies : []) {
        const hit = segmentCircleHitTime(
          startX, startY, stepX, stepY,
          enemy.visual.x, enemy.visual.y, enemy.collisionRadius + projectile.radius,
        );
        if (hit < firstHit) {
          firstHit = hit;
          hitEnemy = enemy;
        }
      }
      if (hitEnemy) {
        hitEnemy.health -= projectile.damage;
        if (hitEnemy.health <= 0) {
          this.killEnemy(hitEnemy);
        }
        projectile.visual.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }
      projectile.visual.x = startX + stepX;
      projectile.visual.y = startY + stepY;
      projectile.remainingLifetime -= delta;

      const { x, y } = projectile.visual;
      const outsideArena = x < -projectile.radius || x > this.arenaWidth + projectile.radius
        || y < -projectile.radius || y > this.arenaHeight + projectile.radius;
      if (projectile.remainingLifetime <= 0 || outsideArena) {
        projectile.visual.destroy();
        this.projectiles.splice(i, 1);
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
    if (this.missiles.length >= this.missile.maxActiveMissiles) return;
    const target = this.selectNearestEnemy();
    if (!target) return;
    const missile: MissileRuntime = {
      clusterEnabled: this.clusterEvolved,
      damage: this.missileValues.damage * this.globalDamageMultiplier,
      speed: this.missileValues.speed,
      explosionRadius: effectiveMissileExplosionRadius(this.missileValues.explosionRadius, this.moduleLevels.spatial),
      visual: this.add.circle(this.player.x, this.player.y, this.missile.radius, 0xfacc15),
      target,
      headingX: 0,
      headingY: 0,
      remainingLifetime: this.missile.lifetime,
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
      for (const enemy of this.enemies) {
        const hit = segmentCircleHitTime(startX, startY, stepX, stepY,
          enemy.visual.x, enemy.visual.y, enemy.collisionRadius + this.missile.radius);
        if (hit < firstHit) firstHit = hit;
      }
      if (firstHit !== Infinity) {
        const impactX = startX + stepX * firstHit;
        const impactY = startY + stepY * firstHit;
        this.explodeMissile(impactX, impactY, missile.damage, missile.explosionRadius);
        if (missile.clusterEnabled) this.explodeClusterSatellites(impactX, impactY, missile);
      } else {
        missile.visual.x += stepX;
        missile.visual.y += stepY;
        missile.remainingLifetime -= delta;
        const { x, y } = missile.visual;
        const outside = x < -this.missile.radius || x > this.arenaWidth + this.missile.radius
          || y < -this.missile.radius || y > this.arenaHeight + this.missile.radius;
        if (missile.remainingLifetime > 0 && !outside) continue;
      }
      missile.visual.destroy();
      this.missiles.splice(i, 1);
    }
  }

  private explodeMissile(x: number, y: number, damage: number, explosionRadius: number): void {
    // Snapshot before lethal removals mutate the shared enemy collection.
    const affected = this.enemies.filter(enemy => {
      const dx = enemy.visual.x - x;
      const dy = enemy.visual.y - y;
      return dx * dx + dy * dy <= explosionRadius ** 2;
    });
    for (const enemy of affected) {
      enemy.health -= damage;
      if (enemy.health <= 0) this.killEnemy(enemy);
    }
  }

  private explodeClusterSatellites(x: number, y: number, missile: MissileRuntime): void {
    const offsets = clusterSatelliteOffsets(missile.explosionRadius);
    const radiusSquared = (missile.explosionRadius * 0.5) ** 2;
    // The union is evaluated after primary deaths; snapshot before satellite kills splice enemies.
    const affected = this.enemies.filter(enemy => offsets.some(offset => {
      const dx = enemy.visual.x - (x + offset.x);
      const dy = enemy.visual.y - (y + offset.y);
      return dx * dx + dy * dy <= radiusSquared;
    }));
    for (const enemy of affected) {
      enemy.health -= missile.damage * 0.5;
      if (enemy.health <= 0) this.killEnemy(enemy);
    }
  }

  private killEnemy(enemy: EnemyRuntime): void {
    const index = this.enemies.indexOf(enemy);
    if (index === -1) return;
    if (enemy.archetype === 'boss') this.bossDefeated = true;
    this.xpPickups.push({
      visual: this.add.circle(enemy.visual.x, enemy.visual.y, 10, 0xa3e635)
        .setStrokeStyle(2, 0xecfccb),
      value: enemy.xpValue,
      speed: 0,
    });
    if (this.currentTarget === enemy) this.currentTarget = undefined;
    enemy.visual.destroy();
    this.enemies.splice(index, 1);
  }

  private createEnemy(x: number, y: number, archetype: EnemyArchetype, eliteTank = false): void {
    const isElite = archetype === 'tank' && eliteTank;
    const data = isElite ? eliteTankData : enemyData[archetype];
    const enemy = this.add.polygon(x, y, data.points, data.color);
    enemy.setStrokeStyle(isElite || archetype === 'boss' ? 3 : 2, data.outline);
    this.enemies.push({ archetype, isElite, visual: enemy, health: data.health,
      contactDamage: archetype === 'boss' ? 2 : isElite ? eliteTankData.contactDamage : this.contactDamage,
      xpValue: archetype === 'boss' ? 10 : isElite ? eliteTankData.xpValue : 1,
      collisionRadius: archetype === 'boss' ? 40 : this.enemyRadius });
    if (archetype === 'boss') this.bossSpawned = true;
  }

  private spawnEnemy(): void {
    if (this.isSimulationPaused()) return;
    if (!this.player || this.enemies.length >= this.maximumEnemies) return;
    if (this.enemies.some(enemy => enemy.archetype === 'boss' && enemy.health > 0)) return;

    const nextTimedSpawnNumber = this.successfulTimedSpawns + 1;
    const spawnBoss = shouldSpawnWarden(nextTimedSpawnNumber, this.bossSpawned);
    const margin = spawnBoss ? Math.max(this.enemyMargin, 40) : this.enemyMargin;

    const view = this.cameras.main.worldView;
    const side = Phaser.Math.Between(0, 3);
    // One enemy width beyond a camera edge, then keep the whole polygon in the arena.
    let x = side < 2
      ? (side === 0 ? view.left - 48 : view.right + 48)
      : Phaser.Math.FloatBetween(view.left, view.right);
    let y = side < 2
      ? Phaser.Math.FloatBetween(view.top, view.bottom)
      : (side === 2 ? view.top - 48 : view.bottom + 48);
    x = Phaser.Math.Clamp(x, margin, this.arenaWidth - margin);
    y = Phaser.Math.Clamp(y, margin, this.arenaHeight - margin);

    if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < this.minimumSpawnDistance) {
      // At arena edges the chosen side may be too close; the opposite corner is safely distant.
      x = this.player.x < this.arenaWidth / 2 ? this.arenaWidth - margin : margin;
      y = this.player.y < this.arenaHeight / 2 ? this.arenaHeight - margin : margin;
    }

    if (spawnBoss) this.createEnemy(x, y, 'boss');
    else {
      const archetype = timedSpawnSequence[this.successfulTimedSpawns % timedSpawnSequence.length];
      this.createEnemy(x, y, archetype, shouldSpawnEliteTank(archetype, nextTimedSpawnNumber));
    }
    this.successfulTimedSpawns += 1;
  }
}
