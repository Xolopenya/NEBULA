import * as Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 30, 'NEBULA', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '64px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 40, 'Phaser 4 bootstrap ready', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#7dd3fc',
      })
      .setOrigin(0.5);
  }
}
