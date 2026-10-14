export type ExperienceState = {
  level: number;
  xp: number;
};

export function xpForNextLevel(level: number): number {
  return level * 5;
}

// XP is progress toward the next level; callers supply nonnegative finite awards.
export function addExperience(state: ExperienceState, amount: number): ExperienceState {
  let level = state.level;
  let xp = state.xp + amount;
  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level += 1;
  }
  return { level, xp };
}
