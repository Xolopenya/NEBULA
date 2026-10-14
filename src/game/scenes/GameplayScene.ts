import * as Phaser from 'phaser';

export class GameplayScene extends Phaser.Scene {
  private player?: Phaser.GameObjects.Polygon;
  private enemy?: Phaser.GameObjects.Polygon;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<'up' | 'left' | 'down' | 'right', Phaser.Input.Keyboard.Key>;
  private readonly movementDirection = new Phaser.Math.Vector2();
  private readonly movementSpeed = 300;
  private readonly arenaWidth = 4800;
  private readonly arenaHeight = 2700;

  constructor() {
    super('GameplayScene');
  }

  create(): void {
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

    this.enemy = this.add.polygon(2800, 1350, [24, 0, 48, 24, 24, 48, 0, 24], 0xf43f5e);
    this.enemy.setStrokeStyle(2, 0xffcdd2);

    this.cameras.main.setBounds(0, 0, this.arenaWidth, this.arenaHeight);
    this.cameras.main.startFollow(this.player);
    this.cameras.main.centerOn(this.player.x, this.player.y);

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
  }
}
