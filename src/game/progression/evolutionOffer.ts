export type Evolution = 'prism' | 'cluster';

export function selectEvolutionOffer(
  prismEligible: boolean, clusterEligible: boolean, cursor: Evolution,
): { offered: Evolution | undefined; nextCursor: Evolution } {
  if (!prismEligible && !clusterEligible) return { offered: undefined, nextCursor: cursor };
  const offered = prismEligible && clusterEligible ? cursor : prismEligible ? 'prism' : 'cluster';
  return { offered, nextCursor: offered === 'prism' ? 'cluster' : 'prism' };
}
