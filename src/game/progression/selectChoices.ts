/** Select distinct pool entries without replacement. Random must return [0, 1). */
export function selectChoices<T>(pool: readonly T[], count: number, random: () => number): T[] {
  const remaining = [...new Set(pool)];
  if (!Number.isInteger(count) || count < 0 || count > remaining.length) {
    throw new RangeError('Choice count must fit the distinct pool');
  }
  const selected: T[] = [];
  for (let i = 0; i < count; i += 1) {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
      throw new RangeError('Random source must return a value in [0, 1)');
    }
    selected.push(remaining.splice(Math.floor(value * remaining.length), 1)[0]);
  }
  return selected;
}
