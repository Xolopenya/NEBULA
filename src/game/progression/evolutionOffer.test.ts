import { describe, expect, it } from 'vitest';
import { selectEvolutionOffer, type Evolution } from './evolutionOffer';

describe('selectEvolutionOffer', () => {
  it.each(['prism', 'cluster'] as const)('keeps %s cursor when none eligible', cursor => {
    expect(selectEvolutionOffer(false, false, cursor)).toEqual({ offered: undefined, nextCursor: cursor });
  });
  it.each(['prism', 'cluster'] as const)('reoffers sole Prism from %s cursor', cursor => {
    for (let i = 0; i < 3; i++) {
      const result = selectEvolutionOffer(true, false, cursor);
      expect(result).toEqual({ offered: 'prism', nextCursor: 'cluster' });
      cursor = result.nextCursor;
    }
  });
  it.each(['prism', 'cluster'] as const)('reoffers sole Cluster from %s cursor', cursor => {
    for (let i = 0; i < 3; i++) {
      const result = selectEvolutionOffer(false, true, cursor);
      expect(result).toEqual({ offered: 'cluster', nextCursor: 'prism' });
      cursor = result.nextCursor;
    }
  });
  it('alternates both from Prism-first reset baseline', () => {
    let cursor: Evolution = 'prism';
    const offers = [];
    for (let i = 0; i < 4; i++) {
      const result = selectEvolutionOffer(true, true, cursor);
      offers.push(result.offered);
      cursor = result.nextCursor;
    }
    expect(offers).toEqual(['prism', 'cluster', 'prism', 'cluster']);
    expect(cursor).toBe('prism');
  });
  it('offers the remaining evolution after the other is accepted', () => {
    expect(selectEvolutionOffer(false, true, 'cluster').offered).toBe('cluster');
    expect(selectEvolutionOffer(true, false, 'prism').offered).toBe('prism');
  });
  it('does not mutate supplied eligibility or cursor state', () => {
    const input = Object.freeze({ prism: true, cluster: true, cursor: 'cluster' as const });
    expect(selectEvolutionOffer(input.prism, input.cluster, input.cursor)).toEqual({ offered: 'cluster', nextCursor: 'prism' });
    expect(input).toEqual({ prism: true, cluster: true, cursor: 'cluster' });
  });
});
