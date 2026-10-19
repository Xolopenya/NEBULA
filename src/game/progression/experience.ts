export type ExperienceState = { level: number; xp: number };
const maximumLevel = Math.floor(Number.MAX_SAFE_INTEGER / 5);

export function xpForNextLevel(level: number): number {
  if (!Number.isSafeInteger(level) || level < 1 || level > maximumLevel) {
    throw new RangeError('Invalid experience level');
  }
  return level * 5;
}

/** One exact arithmetic source for both progression commits and Scene preflight. */
export function addExperience(state: ExperienceState, amount: number): ExperienceState {
  const threshold = xpForNextLevel(state.level);
  if (!Number.isSafeInteger(state.xp) || state.xp < 0 || state.xp >= threshold
    || !Number.isSafeInteger(amount) || amount < 0 || amount > Number.MAX_SAFE_INTEGER - state.xp) {
    throw new RangeError('Invalid experience award or XP pool');
  }
  const level = BigInt(state.level), pool = BigInt(state.xp) + BigInt(amount);
  const cost = (n: bigint) => 5n * n * (2n * level + n - 1n) / 2n;
  let low = 0n, high = BigInt(maximumLevel) - level;
  while (low < high) {
    const middle = (low + high + 1n) / 2n;
    if (cost(middle) <= pool) low = middle;
    else high = middle - 1n;
  }
  const nextLevel = Number(level + low), xp = Number(pool - cost(low));
  if (!Number.isSafeInteger(xp) || xp >= xpForNextLevel(nextLevel)) {
    throw new RangeError('Unrepresentable earned level');
  }
  return { level: nextLevel, xp };
}
