// Called only for active simulation time. Durations and delta are milliseconds.
export function stepDash(remainingDuration: number, remainingCooldown: number, delta: number) {
  const dashTime = Math.min(remainingDuration, delta);
  return {
    dashTime,
    normalTime: delta - dashTime,
    remainingDuration: Math.max(0, remainingDuration - delta),
    remainingCooldown: Math.max(0, remainingCooldown - delta),
  };
}
