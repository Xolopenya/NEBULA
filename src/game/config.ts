import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameplayScene } from './scenes/GameplayScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,

  width: 1920,
  height: 1080,

  parent: 'game',

  backgroundColor: '#050816',

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  scene: [BootScene, GameplayScene],
};
