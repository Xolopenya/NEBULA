/** Six world-axis offsets in 60-degree order, starting at positive X. */
export function clusterSatelliteOffsets(primaryRadius: number): { x: number; y: number }[] {
  const half = primaryRadius * 0.5;
  const height = primaryRadius * Math.sqrt(3) / 2;
  return [
    { x: primaryRadius, y: 0 },
    { x: half, y: height },
    { x: -half, y: height },
    { x: -primaryRadius, y: 0 },
    { x: -half, y: -height },
    { x: half, y: -height },
  ];
}
