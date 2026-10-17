import type * as Phaser from 'phaser';

export type GameplayIntent = {
  moveX: number;
  moveY: number;
  activatePressed: boolean;
  pausePressed: boolean;
};
const controls = ['W', 'A', 'S', 'D', 'UP', 'LEFT', 'DOWN', 'RIGHT', 'SPACE', 'ESC'] as const;
type Control = typeof controls[number];

/** Desktop bindings only. Physical held state survives Phaser's logical blur/resetKeys reset. */
export class KeyboardInput {
  private held = new Set<Control>();
  private suppressed = new Set<Control>();
  private activatePressed = false;
  private pausePressed = false;
  private disposed = false;
  private unbind: Array<() => void> = [];
  private canPlay: () => boolean;

  constructor(keyboard: Phaser.Input.Keyboard.KeyboardPlugin | null | undefined, canPlay: () => boolean) {
    this.canPlay = canPlay;
    for (const control of controls) {
      const key = keyboard?.addKey(control);
      if (!key) continue;
      if (key.isDown) { this.held.add(control); this.suppressed.add(control); }
      const down = (_key: Phaser.Input.Keyboard.Key, event: KeyboardEvent) => {
        if (this.disposed || this.held.has(control)) return;
        this.held.add(control);
        if (event.repeat || (!this.canPlay() && control !== 'ESC')) {
          this.suppressed.add(control);
          return;
        }
        if (control === 'SPACE') this.activatePressed = true;
        if (control === 'ESC') this.pausePressed = true;
      };
      const up = () => {
        if (this.disposed) return;
        this.held.delete(control);
        this.suppressed.delete(control);
      };
      key.on('down', down);
      key.on('up', up);
      this.unbind.push(() => { key.off('down', down); key.off('up', up); });
    }
    this.reset();
  }

  sample(): GameplayIntent {
    const active = (a: Control, b: Control) => Number(
      (this.held.has(a) && !this.suppressed.has(a)) || (this.held.has(b) && !this.suppressed.has(b)));
    const playing = !this.disposed && this.canPlay();
    const intent = {
      moveX: playing ? active('D', 'RIGHT') - active('A', 'LEFT') : 0,
      moveY: playing ? active('S', 'DOWN') - active('W', 'UP') : 0,
      activatePressed: playing && this.activatePressed,
      pausePressed: !this.disposed && this.pausePressed,
    };
    this.activatePressed = false;
    this.pausePressed = false;
    return intent;
  }

  reset(): void {
    for (const control of this.held) this.suppressed.add(control);
    this.activatePressed = false;
    this.pausePressed = false;
  }

  dispose(): void {
    this.disposed = true;
    this.reset();
    for (const unbind of this.unbind) unbind();
    this.unbind = [];
  }
}
