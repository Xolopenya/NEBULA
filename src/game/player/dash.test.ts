import { describe, expect, it } from 'vitest';
import { stepDash } from './dash';

describe('Dash active-time split', () => {
  it('uses the full frame for a running burst', () => {
    expect(stepDash(200, 3000, 50)).toEqual({
      dashTime: 50, normalTime: 0, remainingDuration: 150, remainingCooldown: 2950,
    });
  });

  it('splits a frame crossing expiry without extending the burst', () => {
    expect(stepDash(50, 2850, 100)).toEqual({
      dashTime: 50, normalTime: 50, remainingDuration: 0, remainingCooldown: 2750,
    });
  });

  it('returns to normal movement exactly at expiry', () => {
    const expired = stepDash(200, 3000, 200);
    expect(expired.dashTime).toBe(200);
    expect(expired.normalTime).toBe(0);
    expect(stepDash(expired.remainingDuration, expired.remainingCooldown, 20).normalTime).toBe(20);
  });

  it('gives equivalent burst distance and clocks for different frame partitions', () => {
    const run = (frames: number[]) => {
      let duration = 200;
      let cooldown = 3000;
      let distance = 0;
      for (const delta of frames) {
        const step = stepDash(duration, cooldown, delta);
        distance += (900 * step.dashTime + 300 * step.normalTime) / 1000;
        duration = step.remainingDuration;
        cooldown = step.remainingCooldown;
      }
      return { distance, duration, cooldown };
    };
    expect(run([250])).toEqual({ distance: 195, duration: 0, cooldown: 2750 });
    expect(run([50, 75, 125])).toEqual(run([250]));
    expect(run(Array(25).fill(10))).toEqual(run([250]));
  });

  it('does not advance clocks with zero active time', () => {
    expect(stepDash(120, 2920, 0)).toEqual({
      dashTime: 0, normalTime: 0, remainingDuration: 120, remainingCooldown: 2920,
    });
  });

  it('caps burst time and clamps cooldown at zero for a large frame', () => {
    expect(stepDash(200, 3000, 4000)).toEqual({
      dashTime: 200, normalTime: 3800, remainingDuration: 0, remainingCooldown: 0,
    });
  });
});
