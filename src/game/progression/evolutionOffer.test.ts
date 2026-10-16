import { describe, expect, it } from 'vitest';
import { selectEvolutionOffer, type Evolution } from './evolutionOffer';

describe('selectEvolutionOffer', () => {
  it.each(['prism', 'cluster', 'twin'] as const)('reoffers sole Twin from %s cursor', cursor => {
    for (let i = 0; i < 3; i++) {
      const result = selectEvolutionOffer(false, false, true, cursor);
      expect(result).toEqual({ offered: 'twin', nextCursor: 'prism' });
      cursor = result.nextCursor;
    }
  });
  it.each([
    { eligible: [true, false, true] as const, expected: ['prism', 'twin', 'prism', 'twin'] },
    { eligible: [false, true, true] as const, expected: ['cluster', 'twin', 'cluster', 'twin'] },
  ])('cycles eligible pair $expected', ({ eligible, expected }) => {
    let cursor: Evolution = 'prism';
    const offers = [];
    for (let i = 0; i < 4; i++) {
      const result = selectEvolutionOffer(eligible[0], eligible[1], eligible[2], cursor);
      offers.push(result.offered);
      cursor = result.nextCursor;
    }
    expect(offers).toEqual(expected);
  });
  it.each([
    { cursor: 'prism' as const, expected: ['prism', 'cluster', 'twin', 'prism', 'cluster', 'twin'] },
    { cursor: 'cluster' as const, expected: ['cluster', 'twin', 'prism', 'cluster', 'twin', 'prism'] },
    { cursor: 'twin' as const, expected: ['twin', 'prism', 'cluster', 'twin', 'prism', 'cluster'] },
  ])('cycles all three starting at $cursor', ({ cursor: initial, expected }) => {
    let cursor: Evolution = initial;
    const offers = [];
    for (let i = 0; i < 6; i++) {
      const result = selectEvolutionOffer(true, true, true, cursor);
      offers.push(result.offered);
      cursor = result.nextCursor;
    }
    expect(offers).toEqual(expected);
    expect(cursor).toBe(initial);
  });
  it.each([
    { removed: 'prism', eligible: [false, true, true] as const, expected: ['cluster', 'twin', 'cluster', 'twin'] },
    { removed: 'cluster', eligible: [true, false, true] as const, expected: ['twin', 'prism', 'twin', 'prism'] },
    { removed: 'twin', eligible: [true, true, false] as const, expected: ['prism', 'cluster', 'prism', 'cluster'] },
  ])('continues remaining sequence after accepting $removed', ({ removed, eligible, expected }) => {
    const accepted = selectEvolutionOffer(true, true, true, removed as Evolution);
    expect(accepted.offered).toBe(removed);
    let cursor = accepted.nextCursor;
    const offers = [];
    for (let i = 0; i < 4; i++) {
      const result = selectEvolutionOffer(eligible[0], eligible[1], eligible[2], cursor);
      offers.push(result.offered);
      cursor = result.nextCursor;
    }
    expect(offers).toEqual(expected);
  });
  it('is repeatable with frozen three-identity input and reset baseline', () => {
    const input = Object.freeze({ prism: true, cluster: false, twin: true, cursor: 'cluster' as const });
    const call = () => selectEvolutionOffer(input.prism, input.cluster, input.twin, input.cursor);
    expect(call()).toEqual({ offered: 'twin', nextCursor: 'prism' });
    expect(call()).toEqual(call());
    expect(input).toEqual({ prism: true, cluster: false, twin: true, cursor: 'cluster' });
    expect(selectEvolutionOffer(true, true, true, 'prism')).toEqual({ offered: 'prism', nextCursor: 'cluster' });
  });
  it.each(['prism', 'cluster', 'twin'] as const)('keeps %s cursor when none eligible', cursor => {
    expect(selectEvolutionOffer(false, false, false, cursor)).toEqual({ offered: undefined, nextCursor: cursor });
  });
  it.each(['prism', 'cluster', 'twin'] as const)('reoffers sole Prism from %s cursor', cursor => {
    for (let i = 0; i < 3; i++) {
      const result = selectEvolutionOffer(true, false, false, cursor);
      expect(result).toEqual({ offered: 'prism', nextCursor: 'cluster' });
      cursor = result.nextCursor;
    }
  });
  it.each(['prism', 'cluster', 'twin'] as const)('reoffers sole Cluster from %s cursor', cursor => {
    for (let i = 0; i < 3; i++) {
      const result = selectEvolutionOffer(false, true, false, cursor);
      expect(result).toEqual({ offered: 'cluster', nextCursor: 'twin' });
      cursor = result.nextCursor;
    }
  });
  it('alternates both from Prism-first reset baseline', () => {
    let cursor: Evolution = 'prism';
    const offers = [];
    for (let i = 0; i < 4; i++) {
      const result = selectEvolutionOffer(true, true, false, cursor);
      offers.push(result.offered);
      cursor = result.nextCursor;
    }
    expect(offers).toEqual(['prism', 'cluster', 'prism', 'cluster']);
    expect(cursor).toBe('twin');
  });
  it('offers the remaining evolution after the other is accepted', () => {
    expect(selectEvolutionOffer(false, true, false, 'cluster').offered).toBe('cluster');
    expect(selectEvolutionOffer(true, false, false, 'prism').offered).toBe('prism');
  });
  it('does not mutate supplied eligibility or cursor state', () => {
    const input = Object.freeze({ prism: true, cluster: true, cursor: 'cluster' as const });
    expect(selectEvolutionOffer(input.prism, input.cluster, false, input.cursor)).toEqual({ offered: 'cluster', nextCursor: 'twin' });
    expect(input).toEqual({ prism: true, cluster: true, cursor: 'cluster' });
  });
});
