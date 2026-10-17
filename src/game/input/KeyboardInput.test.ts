import { describe, expect, it } from 'vitest';
import { KeyboardInput } from './KeyboardInput';

function fixture() {
  const keys = new Map<string, ReturnType<typeof key>>();
  function key() {
    const callbacks = new Map<string, Set<(...args: unknown[]) => void>>();
    return { isDown: false,
      on(event: string, fn: (...args: unknown[]) => void) {
        if (!callbacks.has(event)) callbacks.set(event, new Set()); callbacks.get(event)!.add(fn);
      },
      off(event: string, fn: (...args: unknown[]) => void) { callbacks.get(event)?.delete(fn); },
      listeners(event: string) { return [...callbacks.get(event) ?? []]; },
    };
  }
  let playing = true;
  const keyboard = { addKey: (name: string) => { if (!keys.has(name)) keys.set(name, key()); return keys.get(name)!; } };
  const adapter = new KeyboardInput(keyboard as unknown as ConstructorParameters<typeof KeyboardInput>[0], () => playing);
  const down = (name: string, repeat = false) => {
    const k = keys.get(name)!; k.isDown = true; for (const fn of k.listeners('down')) fn(k, { repeat });
  };
  const up = (name: string) => {
    const k = keys.get(name)!; k.isDown = false; for (const fn of k.listeners('up')) fn(k, {});
  };
  return { adapter, keys, down, up, keyboard,
    pause: () => { playing = false; adapter.reset(); }, resume: () => { adapter.reset(); playing = true; } };
}
describe('KeyboardInput actual bindings and intents', () => {
  it.each([['W', 0, -1], ['A', -1, 0], ['S', 0, 1], ['D', 1, 0],
    ['UP', 0, -1], ['LEFT', -1, 0], ['DOWN', 0, 1], ['RIGHT', 1, 0]] as const)('%s resolves raw movement', (key, x, y) => {
    const f = fixture(); f.down(key);
    expect(f.adapter.sample()).toEqual({ moveX: x, moveY: y, activatePressed: false, pausePressed: false });
    f.up(key); expect(f.adapter.sample().moveX).toBe(0); expect(f.adapter.sample().moveY).toBe(0);
  });
  it('ORs aliases, cancels opposites and leaves diagonal normalization to gameplay', () => {
    const f = fixture(); f.down('W'); f.down('UP'); f.down('D');
    expect(f.adapter.sample()).toMatchObject({ moveX: 1, moveY: -1 });
    f.down('S'); f.down('LEFT'); expect(f.adapter.sample()).toMatchObject({ moveX: 0, moveY: 0 });
  });
  it.each([['SPACE', 'activatePressed'], ['ESC', 'pausePressed']] as const)('%s is one non-repeat edge', (key, field) => {
    const f = fixture(); f.down(key); expect(f.adapter.sample()[field]).toBe(true);
    expect(f.adapter.sample()[field]).toBe(false);
    f.down(key, true); expect(f.adapter.sample()[field]).toBe(false);
    f.up(key); f.down(key); expect(f.adapter.sample()[field]).toBe(true);
  });
  it.each(['W', 'SPACE', 'ESC'])('reset disarms held %s through logical Phaser reset/repeats until physical release', key => {
    const f = fixture(); f.down(key); f.adapter.reset();
    f.keys.get(key)!.isDown = false; // Phaser blur reset is not a physical release.
    f.down(key, true);
    expect(f.adapter.sample()).toEqual({ moveX: 0, moveY: 0, activatePressed: false, pausePressed: false });
    f.up(key); f.down(key);
    expect(f.adapter.sample()).not.toEqual({ moveX: 0, moveY: 0, activatePressed: false, pausePressed: false });
  });
  it('discards controls pressed during PAUSED, keeps Escape observable and resumes cleanly', () => {
    const f = fixture(); f.pause(); f.down('W'); f.down('SPACE'); f.down('ESC');
    expect(f.adapter.sample()).toEqual({ moveX: 0, moveY: 0, activatePressed: false, pausePressed: true });
    f.resume(); expect(f.adapter.sample()).toEqual({ moveX: 0, moveY: 0, activatePressed: false, pausePressed: false });
    f.up('W'); f.down('W'); expect(f.adapter.sample().moveY).toBe(-1);
  });
  it('reset clears pending edges, neutral controls work immediately and lost keyup never makes repeats fresh', () => {
    const f = fixture(); f.down('SPACE'); f.down('ESC'); f.adapter.reset();
    expect(f.adapter.sample()).toMatchObject({ activatePressed: false, pausePressed: false });
    f.down('D'); expect(f.adapter.sample().moveX).toBe(1);
    f.down('W', true); expect(f.adapter.sample().moveY).toBe(0);
    f.up('W'); f.down('W'); expect(f.adapter.sample().moveY).toBe(-1);
  });
  it('disposed adapter and saved callbacks stay inert; fresh binding suppresses inherited held keys', () => {
    const f = fixture(); const oldDown = f.keys.get('W')!.listeners('down')[0];
    f.down('W'); f.adapter.dispose(); f.adapter.dispose(); oldDown(f.keys.get('W'), { repeat: false });
    expect(f.adapter.sample()).toEqual({ moveX: 0, moveY: 0, activatePressed: false, pausePressed: false });
    const fresh = new KeyboardInput(f.keyboard as unknown as ConstructorParameters<typeof KeyboardInput>[0], () => true);
    expect(fresh.sample().moveY).toBe(0); f.up('W'); f.down('W'); expect(fresh.sample().moveY).toBe(-1);
    expect(fixture().adapter.sample()).toEqual({ moveX: 0, moveY: 0, activatePressed: false, pausePressed: false });
  });
});
