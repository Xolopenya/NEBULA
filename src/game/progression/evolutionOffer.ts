export type Evolution = 'prism' | 'cluster' | 'twin';

const evolutionOrder: readonly Evolution[] = ['prism', 'cluster', 'twin'];

export function selectEvolutionOffer(
  prismEligible: boolean, clusterEligible: boolean, twinEligible: boolean, cursor: Evolution,
): { offered: Evolution | undefined; nextCursor: Evolution } {
  const eligible = { prism: prismEligible, cluster: clusterEligible, twin: twinEligible };
  const start = evolutionOrder.indexOf(cursor);
  for (let offset = 0; offset < evolutionOrder.length; offset++) {
    const index = (start + offset) % evolutionOrder.length;
    const offered = evolutionOrder[index];
    if (eligible[offered]) return { offered, nextCursor: evolutionOrder[(index + 1) % evolutionOrder.length] };
  }
  return { offered: undefined, nextCursor: cursor };
}
