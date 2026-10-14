import { describe, expect, it } from 'vitest';
import { segmentCircleHitTime } from './collision';

describe('segmentCircleHitTime', () => {
  it('finds the first hit through a circle', () => {
    expect(segmentCircleHitTime(0, 0, 10, 0, 5, 0, 1)).toBeCloseTo(0.4);
  });

  it('returns Infinity for a clear miss', () => {
    expect(segmentCircleHitTime(0, 2, 10, 0, 5, 0, 1)).toBe(Infinity);
  });

  it('returns zero when starting inside, even without movement', () => {
    expect(segmentCircleHitTime(5, 0, 10, 0, 5, 0, 1)).toBe(0);
    expect(segmentCircleHitTime(5, 0, 0, 0, 5, 0, 1)).toBe(0);
  });

  it('detects a tangent hit', () => {
    expect(segmentCircleHitTime(0, 1, 10, 0, 5, 0, 1)).toBe(0.5);
  });

  it('returns Infinity for a stationary segment outside', () => {
    expect(segmentCircleHitTime(0, 0, 0, 0, 5, 0, 1)).toBe(Infinity);
  });

  it('rejects an intersection beyond the segment end', () => {
    expect(segmentCircleHitTime(0, 0, 3, 0, 5, 0, 1)).toBe(Infinity);
  });

  it('orders normalized hits by distance along the segment', () => {
    const near = segmentCircleHitTime(0, 0, 10, 0, 3, 0, 1);
    const far = segmentCircleHitTime(0, 0, 10, 0, 7, 0, 1);
    expect(near).toBeCloseTo(0.2);
    expect(far).toBeCloseTo(0.6);
    expect(near).toBeLessThan(far);
  });

  it('rejects intersections behind the segment start', () => {
    expect(segmentCircleHitTime(0, 0, -10, 0, 5, 0, 1)).toBe(Infinity);
  });

  it('includes hits at segment boundaries', () => {
    expect(segmentCircleHitTime(0, 0, 4, 0, 5, 0, 1)).toBe(1);
    expect(segmentCircleHitTime(4, 0, -4, 0, 5, 0, 1)).toBe(0);
  });
});
