export function effectiveDroneBoltRadius(baseDroneBoltRadius: number, replicationMatrixLevel: number): number {
  return baseDroneBoltRadius + replicationMatrixLevel;
}
