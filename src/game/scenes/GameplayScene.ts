import * as Phaser from 'phaser';

export class GameplayScene extends Phaser.Scene {
  constructor() {
    super('GameplayScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#050816');

    const arena = this.add.graphics();
    arena.fillStyle(0x7dd3fc, 0.4);

    // Fixed star positions keep the placeholder background stable on scene entry.
    for (let i = 0; i < 60; i += 1) {
      const x = 24 + ((i * 197) % (width - 48));
      const y = 24 + ((i * 113) % (height - 48));
      arena.fillCircle(x, y, i % 4 === 0 ? 2 : 1);
    }

    arena.lineStyle(2, 0x1e3a5f, 1);
    arena.strokeRect(40, 40, width - 80, height - 80);

    this.add
      .polygon(width / 2, height / 2, [20, 0, 40, 48, 20, 36, 0, 48], 0x38bdf8)
      .setStrokeStyle(2, 0xe0f2fe);

    this.add
      .text(width / 2, 80, 'NEBULA — GAMEPLAY SCENE', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        color: '#e2e8f0',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height - 80, 'Placeholder space arena', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#7dd3fc',
      })
      .setOrigin(0.5);
  }
}
