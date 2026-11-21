/** Local date as YYYY-MM-DD. Never use UTC for "today". */
export function dateStr(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Minutes since local midnight. */
export function minutesOf(d: Date = new Date()): number {
  return d.getHours() * 60 + d.getMinutes();
}

export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
