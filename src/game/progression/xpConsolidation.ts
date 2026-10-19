export type ConsolidationPickup = Readonly<{ x: number; y: number; value: number; eligible: boolean }>;
export const XP_CONSOLIDATION_THRESHOLD = 256;
export const XP_CONSOLIDATION_CELL_SIZE = 64;

/** Ephemeral plan in original array indices; the caller must revalidate live ownership before applying. */
export function planXpConsolidation(pickups: readonly ConsolidationPickup[], player: Readonly<{ x: number; y: number }>, magnet: number): ReadonlyArray<readonly [number, number]> {
  if (pickups.length <= XP_CONSOLIDATION_THRESHOLD) return [];
  const cells = new Map<string, number[]>();
  for (let i = 0; i < pickups.length; i++) {
    const p = pickups[i];
    if (!p.eligible || !Number.isFinite(p.x) || !Number.isFinite(p.y)
      || !Number.isSafeInteger(p.value) || p.value <= 0
      || !(Math.hypot(p.x - player.x, p.y - player.y) > magnet)) continue;
    const key = `${Math.floor(p.x / XP_CONSOLIDATION_CELL_SIZE)},${Math.floor(p.y / XP_CONSOLIDATION_CELL_SIZE)}`;
    const cell = cells.get(key);
    if (cell) cell.push(i); else cells.set(key, [i]);
  }
  // Per-cell minimum trees find the earliest later safe value in O(log cell size),
  // including dense unsafe populations. No persistent registry or quadratic sparse scans.
  const locations = new Map<number, { indices: number[]; tree: number[]; size: number; offset: number }>();
  for (const indices of cells.values()) {
    if (indices.length < 2) continue;
    let size = 1;
    while (size < indices.length) size *= 2;
    const tree = Array<number>(2 * size).fill(Infinity);
    indices.forEach((index, offset) => { tree[size + offset] = pickups[index].value; });
    for (let n = size - 1; n > 0; n--) tree[n] = Math.min(tree[2 * n], tree[2 * n + 1]);
    indices.forEach((index, offset) => locations.set(index, { indices, tree, size, offset }));
  }
  const removed = new Set<number>(), plan: [number, number][] = [];
  for (let older = 0; older < pickups.length && pickups.length - removed.size > XP_CONSOLIDATION_THRESHOLD; older++) {
    const cell = locations.get(older);
    if (!cell || removed.has(older)) continue;
    let value = pickups[older].value;
    const { indices, tree, size, offset } = cell;
    while (pickups.length - removed.size > XP_CONSOLIDATION_THRESHOLD) {
      const limit = Number.MAX_SAFE_INTEGER - value;
      const firstSafe = (node: number, left: number, right: number): number => {
        if (right <= offset || tree[node] > limit) return -1;
        if (left === right) return left;
        const middle = (left + right) >>> 1;
        const first = firstSafe(node * 2, left, middle);
        return first >= 0 ? first : firstSafe(node * 2 + 1, middle + 1, right);
      };
      const newerOffset = firstSafe(1, 0, size - 1);
      if (newerOffset < 0) break;
      const newer = indices[newerOffset];
      value += pickups[newer].value;
      plan.push([older, newer]); removed.add(newer);
      let node = size + newerOffset;
      tree[node] = Infinity;
      while ((node = Math.floor(node / 2)) > 0) tree[node] = Math.min(tree[node * 2], tree[node * 2 + 1]);
    }
    // This anchor can never merge into a later anchor; all future pairs have larger older indices.
  }
  return plan;
}
