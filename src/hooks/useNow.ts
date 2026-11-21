import { useEffect, useState } from 'react';
import { dateStr, minutesOf } from '../lib/date';
import { useApp } from '../store/useApp';

/** The clock the app plans with. Ticks every 30 seconds. Can be overridden for demos and tests. */
export function useNow(): { now: number; dow: number; date: string } {
  const nowOverride = useApp((s) => s.nowOverride);
  const dowOverride = useApp((s) => s.dowOverride);
  const [tick, setTick] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTick(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return { now: nowOverride ?? minutesOf(tick), dow: dowOverride ?? tick.getDay(), date: dateStr(tick) };
}
