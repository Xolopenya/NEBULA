export function effectiveMissileExplosionRadius(missileSpecificRadius: number, spatialAmplifierLevel: number): number {
  return missileSpecificRadius + spatialAmplifierLevel * 15;
}
