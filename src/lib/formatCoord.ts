/** "53.4084°N" / "2.9916°W". Picks the hemisphere from the sign of the value. */
export function formatCoord(value: number, pos: string, neg: string): string {
  const sign = value >= 0 ? pos : neg;
  return `${Math.abs(value).toFixed(4)}°${sign}`;
}

export function formatLngLat(lng: number, lat: number): string {
  return `${formatCoord(lat, 'N', 'S')}  ${formatCoord(lng, 'E', 'W')}`;
}
