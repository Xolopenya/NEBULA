import * as Phaser from 'phaser';

type LaserProjectile = {
  visual: Phaser.GameObjects.Arc;
  velocityX: number;
  velocityY: number;
  remainingLifetime: number;
};

export class GameplayScene extends Phaser.Scene {
  private player?: Phaser.GameObjects.Polygon;
  private enemies: Phaser.GameObjects.Polygon[] = [];
  private currentTarget?: Phaser.GameObjects.Polygon;
  private projectiles: LaserProjectile[] = [];
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<'up' | 'left' | 'down' | 'right', Phaser.Input.Keyboard.Key>;
  private readonly movementDirection = new Phaser.Math.Vector2();
  private readonly movementSpeed = 300;
  private readonly chaseDirection = new Phaser.Math.Vector2();
  private readonly enemySpeed = 180;
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
    this.enemies = [];
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
      this.chaseDirection.set(this.player.x - enemy.x, this.player.y - enemy.y);
      const chaseDistance = this.chaseDirection.length();
      const chaseStep = Math.min(this.enemySpeed * (delta / 1000), chaseDistance);
      this.chaseDirection.normalize().scale(chaseStep);
      enemy.x += this.chaseDirection.x;
      enemy.y += this.chaseDirection.y;
      enemy.x = Phaser.Math.Clamp(enemy.x, this.enemyMargin, this.arenaWidth - this.enemyMargin);
      enemy.y = Phaser.Math.Clamp(enemy.y, this.enemyMargin, this.arenaHeight - this.enemyMargin);
    }

    const target = this.selectNearestEnemy();
    if (target !== this.currentTarget) {
      this.currentTarget?.setStrokeStyle(2, 0xffcdd2);
      this.currentTarget = target;
      this.currentTarget?.setStrokeStyle(4, 0xfde047);
    }

    this.updateProjectiles(delta);
  }

  private fireLaser(): void {
    if (!this.player || !this.currentTarget) return;

    const dx = this.currentTarget.x - this.player.x;
    const dy = this.currentTarget.y - this.player.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 0.001) return;

    this.projectiles.push({
      visual: this.add.circle(this.player.x, this.player.y, this.projectileRadius, 0x67e8f9),
      velocityX: (dx / distance) * this.projectileSpeed,
      velocityY: (dy / distance) * this.projectileSpeed,
      remainingLifetime: this.projectileLifetime,
    });
  }

  private updateProjectiles(delta: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.projectiles[i];
      const deltaSeconds = Math.min(delta, projectile.remainingLifetime) / 1000;
      projectile.visual.x += projectile.velocityX * deltaSeconds;
      projectile.visual.y += projectile.velocityY * deltaSeconds;
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

  private selectNearestEnemy(): Phaser.GameObjects.Polygon | undefined {
    if (!this.player) return undefined;

    let nearest: Phaser.GameObjects.Polygon | undefined;
    let nearestDistanceSquared = Infinity;
    for (const enemy of this.enemies) {
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < nearestDistanceSquared) {
        nearest = enemy;
        nearestDistanceSquared = distanceSquared;
      }
    }
    return nearest;
  }

  private createEnemy(x: number, y: number): void {
    const enemy = this.add.polygon(x, y, [24, 0, 48, 24, 24, 48, 0, 24], 0xf43f5e);
    enemy.setStrokeStyle(2, 0xffcdd2);
    this.enemies.push(enemy);
  }

  private spawnEnemy(): void {
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
