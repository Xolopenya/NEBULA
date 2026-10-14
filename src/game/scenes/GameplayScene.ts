import * as Phaser from 'phaser';
import { segmentCircleHitTime } from '../combat/collision';
import { addExperience, type ExperienceState } from '../progression/experience';

type EnemyRuntime = {
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
  visual: Phaser.GameObjects.Arc;
  velocityX: number;
  velocityY: number;
  remainingLifetime: number;
};

export class GameplayScene extends Phaser.Scene {
  private player?: Phaser.GameObjects.Polygon;
  private playerExperience: ExperienceState = { level: 1, xp: 0 };
  private isPlayerDead = false;
  private isLevelUpPaused = false;
  private levelUpPresentation: Phaser.GameObjects.Text[] = [];
  private readonly playerMaxHealth = 5;
  private playerHealth = this.playerMaxHealth;
  private readonly playerRadius = 20;
  private readonly contactDamage = 1;
  private readonly playerDamageProtectionDuration = 500;
  private playerDamageProtectionRemaining = 0;
  private enemies: EnemyRuntime[] = [];
  private xpPickups: XpPickup[] = [];
  private readonly xpMagnetRadius = 180;
  private readonly xpCollectionRadius = 20;
  private readonly xpMagnetAcceleration = 900;
  private readonly xpMagnetMaxSpeed = 600;
  private currentTarget?: EnemyRuntime;
  private projectiles: ProjectileRuntime[] = [];
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<'up' | 'left' | 'down' | 'right', Phaser.Input.Keyboard.Key>;
  private readonly movementDirection = new Phaser.Math.Vector2();
  private readonly movementSpeed = 300;
  private readonly chaseDirection = new Phaser.Math.Vector2();
  private readonly enemySpeed = 180;
  private readonly enemyHealth = 3;
  private readonly enemyRadius = 24;
  private readonly hostileFireInterval = 1500;
  private readonly hostileSpeed = 600;
  private readonly hostileLifetime = 3000;
  private readonly hostileDamage = 1;
  private readonly laserDamage = 1;
  private readonly laserFireInterval = 600;
  private readonly projectileSpeed = 1200;
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
    this.playerExperience = { level: 1, xp: 0 };
    this.isPlayerDead = false;
    this.isLevelUpPaused = false;
    this.levelUpPresentation = [];
    this.playerHealth = this.playerMaxHealth;
    this.playerDamageProtectionRemaining = 0;
    this.enemies = [];
    this.xpPickups = [];
    this.currentTarget = undefined;
    this.projectiles = [];
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#050816');

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

    this.createEnemy(this.player.x + this.minimumSpawnDistance, this.player.y);

    this.cameras.main.setBounds(0, 0, this.arenaWidth, this.arenaHeight);
    this.cameras.main.startFollow(this.player);
    this.cameras.main.centerOn(this.player.x, this.player.y);

    this.time.addEvent({
      delay: this.spawnInterval,
      loop: true,
      callback: () => this.spawnEnemy(),
    });

    this.time.addEvent({
      delay: this.laserFireInterval,
      loop: true,
      callback: () => this.fireLaser(),
    });

    this.time.addEvent({
      delay: this.hostileFireInterval,
      loop: true,
      callback: () => this.fireHostileProjectile(),
    });

    const keyboard = this.input.keyboard;
    if (keyboard) {
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

  update(_time: number, delta: number): void {
    if (this.isSimulationPaused()) return;
    if (!this.player || !this.cursors || !this.wasd) return;

    const left = this.wasd.left.isDown || this.cursors.left.isDown;
    const right = this.wasd.right.isDown || this.cursors.right.isDown;
    const up = this.wasd.up.isDown || this.cursors.up.isDown;
    const down = this.wasd.down.isDown || this.cursors.down.isDown;

    this.movementDirection.set(Number(right) - Number(left), Number(down) - Number(up));
    this.movementDirection.normalize();

    const distance = this.movementSpeed * (delta / 1000);
    this.player.x += this.movementDirection.x * distance;
    this.player.y += this.movementDirection.y * distance;

    // Half the placeholder size plus its outline keeps the whole ship inside.
    const marginX = this.player.width / 2 + this.player.lineWidth / 2;
    const marginY = this.player.height / 2 + this.player.lineWidth / 2;
    this.player.x = Phaser.Math.Clamp(this.player.x, marginX, this.arenaWidth - marginX);
    this.player.y = Phaser.Math.Clamp(this.player.y, marginY, this.arenaHeight - marginY);

    for (const enemy of this.enemies) {
      this.chaseDirection.set(this.player.x - enemy.visual.x, this.player.y - enemy.visual.y);
      const chaseDistance = this.chaseDirection.length();
      const chaseStep = Math.min(this.enemySpeed * (delta / 1000), chaseDistance);
      this.chaseDirection.normalize().scale(chaseStep);
      enemy.visual.x += this.chaseDirection.x;
      enemy.visual.y += this.chaseDirection.y;
      enemy.visual.x = Phaser.Math.Clamp(enemy.visual.x, this.enemyMargin, this.arenaWidth - this.enemyMargin);
      enemy.visual.y = Phaser.Math.Clamp(enemy.visual.y, this.enemyMargin, this.arenaHeight - this.enemyMargin);
    }

    const target = this.selectNearestEnemy();
    if (target !== this.currentTarget) {
      this.currentTarget?.visual.setStrokeStyle(2, 0xffcdd2);
      this.currentTarget = target;
      this.currentTarget?.visual.setStrokeStyle(4, 0xfde047);
    }

    this.updatePlayerProtection(delta);
    this.updateProjectiles(delta);
    this.updatePlayerContact();
    this.updateXpPickups(delta);
  }

  private isSimulationPaused(): boolean {
    return this.isPlayerDead || this.isLevelUpPaused;
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
    const labels = ['Laser Power', 'Laser Fire Rate', 'Laser Projectile Speed'];
    labels.forEach((label, index) => {
      const choice = this.add.text(this.scale.width / 2, this.scale.height / 2 - 40 + index * 110,
        `${label}\nPlaceholder — no effect yet`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '32px',
          align: 'center',
          color: '#e0f2fe',
          backgroundColor: '#1e3a5f',
          padding: { x: 24, y: 12 },
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1)
        .setInteractive({ useHandCursor: true });
      this.levelUpPresentation.push(choice);
      choice.once('pointerdown', () => this.acceptLevelUpChoice(choice));
    });
  }

  private acceptLevelUpChoice(choice: Phaser.GameObjects.Text): void {
    if (this.isPlayerDead || !this.isLevelUpPaused || !this.levelUpPresentation.includes(choice)) return;
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

    const radius = this.playerRadius + this.enemyRadius;
    for (const enemy of this.enemies) {
      const dx = enemy.visual.x - this.player.x;
      const dy = enemy.visual.y - this.player.y;
      if (dx * dx + dy * dy <= radius * radius) {
        this.damagePlayer(this.contactDamage);
        break;
      }
    }
  }

  private damagePlayer(amount: number): void {
    if (this.isSimulationPaused()) return;
    if (!this.player || this.playerHealth === 0 || this.playerDamageProtectionRemaining > 0) return;
    this.playerHealth = Math.max(0, this.playerHealth - amount);
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

    const dx = this.currentTarget.visual.x - this.player.x;
    const dy = this.currentTarget.visual.y - this.player.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 0.001) return;

    this.projectiles.push({
      source: 'player',
      damage: this.laserDamage,
      visual: this.add.circle(this.player.x, this.player.y, this.projectileRadius, 0x67e8f9),
      velocityX: (dx / distance) * this.projectileSpeed,
      velocityY: (dy / distance) * this.projectileSpeed,
      remainingLifetime: this.projectileLifetime,
    });
  }

  private fireHostileProjectile(): void {
    if (this.isSimulationPaused()) return;
    if (!this.player) return;
    const enemy = this.selectNearestEnemy();
    if (!enemy) return;
    const dx = this.player.x - enemy.visual.x;
    const dy = this.player.y - enemy.visual.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 0.001) return;
    this.projectiles.push({
      source: 'enemy',
      damage: this.hostileDamage,
      visual: this.add.circle(enemy.visual.x, enemy.visual.y, this.projectileRadius, 0xfb923c),
      velocityX: dx / distance * this.hostileSpeed,
      velocityY: dy / distance * this.hostileSpeed,
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
        this.player.x, this.player.y, this.playerRadius + this.projectileRadius,
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
          enemy.visual.x, enemy.visual.y, this.enemyRadius + this.projectileRadius,
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
      const outsideArena = x < -this.projectileRadius || x > this.arenaWidth + this.projectileRadius
        || y < -this.projectileRadius || y > this.arenaHeight + this.projectileRadius;
      if (projectile.remainingLifetime <= 0 || outsideArena) {
        projectile.visual.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }

  private selectNearestEnemy(): EnemyRuntime | undefined {
    if (!this.player) return undefined;

    let nearest: EnemyRuntime | undefined;
    let nearestDistanceSquared = Infinity;
    for (const enemy of this.enemies) {
      const dx = enemy.visual.x - this.player.x;
      const dy = enemy.visual.y - this.player.y;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < nearestDistanceSquared) {
        nearest = enemy;
        nearestDistanceSquared = distanceSquared;
      }
    }
    return nearest;
  }

  private killEnemy(enemy: EnemyRuntime): void {
    const index = this.enemies.indexOf(enemy);
    if (index === -1) return;
    this.xpPickups.push({
      visual: this.add.circle(enemy.visual.x, enemy.visual.y, 10, 0xa3e635)
        .setStrokeStyle(2, 0xecfccb),
      value: 1,
      speed: 0,
    });
    if (this.currentTarget === enemy) this.currentTarget = undefined;
    enemy.visual.destroy();
    this.enemies.splice(index, 1);
  }

  private createEnemy(x: number, y: number): void {
    const enemy = this.add.polygon(x, y, [24, 0, 48, 24, 24, 48, 0, 24], 0xf43f5e);
    enemy.setStrokeStyle(2, 0xffcdd2);
    this.enemies.push({ visual: enemy, health: this.enemyHealth });
  }

  private spawnEnemy(): void {
    if (this.isSimulationPaused()) return;
    if (!this.player || this.enemies.length >= this.maximumEnemies) return;

    const view = this.cameras.main.worldView;
    const side = Phaser.Math.Between(0, 3);
    // One enemy width beyond a camera edge, then keep the whole polygon in the arena.
    let x = side < 2
      ? (side === 0 ? view.left - 48 : view.right + 48)
      : Phaser.Math.FloatBetween(view.left, view.right);
    let y = side < 2
      ? Phaser.Math.FloatBetween(view.top, view.bottom)
      : (side === 2 ? view.top - 48 : view.bottom + 48);
    x = Phaser.Math.Clamp(x, this.enemyMargin, this.arenaWidth - this.enemyMargin);
    y = Phaser.Math.Clamp(y, this.enemyMargin, this.arenaHeight - this.enemyMargin);

    if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < this.minimumSpawnDistance) {
      // At arena edges the chosen side may be too close; the opposite corner is safely distant.
      x = this.player.x < this.arenaWidth / 2 ? this.arenaWidth - this.enemyMargin : this.enemyMargin;
      y = this.player.y < this.arenaHeight / 2 ? this.arenaHeight - this.enemyMargin : this.enemyMargin;
    }

    this.createEnemy(x, y);
  }
}
