/** Minutes since midnight to "HH:MM". */
export function fmt(m: number): string {
  const r = Math.round(m);
  const h = Math.floor(r / 60) % 24;
  return `${String(h).padStart(2, '0')}:${String(r % 60).padStart(2, '0')}`;
}

/** Minutes to "45m", "1h" or "1h 30m". */
export function dur(m: number): string {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}
