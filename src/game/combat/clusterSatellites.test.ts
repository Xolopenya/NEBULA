import { describe, expect, it } from 'vitest';
import { clusterSatelliteOffsets } from './clusterSatellites';

describe('clusterSatelliteOffsets', () => {
  it.each([120, 195, 195.5])('returns six centers at radius %s and correct world-axis angles', radius => {
    const offsets = clusterSatelliteOffsets(radius);
    expect(offsets).toHaveLength(6);
    offsets.forEach((offset, i) => {
      const angle = i * Math.PI / 3;
      expect(offset.x).toBeCloseTo(Math.cos(angle) * radius, 10);
      expect(offset.y).toBeCloseTo(Math.sin(angle) * radius, 10);
      expect(Math.hypot(offset.x, offset.y)).toBeCloseTo(radius, 10);
    });
  });
  it('places radius120 cardinal and diagonal centers explicitly', () => {
    const offsets = clusterSatelliteOffsets(120);
    expect(offsets[0]).toEqual({ x: 120, y: 0 });
    expect(offsets[3]).toEqual({ x: -120, y: 0 });
    expect(offsets[1].x).toBe(60);
    expect(offsets[1].y).toBeCloseTo(60 * Math.sqrt(3));
  });
  it('is deterministic and leaves the numeric input unchanged', () => {
    const radius = 195;
    expect(clusterSatelliteOffsets(radius)).toEqual(clusterSatelliteOffsets(radius));
    expect(radius).toBe(195);
  });
  it('returns independent offsets so caller mutation cannot affect later detonations', () => {
    const offsets = clusterSatelliteOffsets(120);
    offsets[0].x = 0;
    expect(clusterSatelliteOffsets(120)[0]).toEqual({ x: 120, y: 0 });
  });
});
