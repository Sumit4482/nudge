import { addDays, daysBetween, daysInMonth } from '../lib/dates';

export interface Bill {
  id: string;
  title: string;
  /** Day of the month it is due, 1 to 31. */
  dueDay: number;
  repeat: 'monthly' | 'yearly';
  /** For yearly bills: month 1 to 12. */
  month?: number;
  /** The due date that has been paid, YYYY-MM-DD. */
  paidFor?: string;
}

/** The next due date on or after `from`. A 31st becomes the last day of a short month. */
export function nextDue(bill: Pick<Bill, 'dueDay' | 'repeat' | 'month'>, from: string): string {
  const [fy, fm, fd] = from.split('-').map(Number);
  const make = (y: number, m: number) => {
    const d = Math.min(bill.dueDay, daysInMonth(y, m));
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };
  if (bill.repeat === 'yearly') {
    const m = bill.month ?? fm;
    const thisYear = make(fy, m);
    return thisYear >= from ? thisYear : make(fy + 1, m);
  }
  const thisMonth = make(fy, fm);
  if (thisMonth >= from && !(fd > Math.min(bill.dueDay, daysInMonth(fy, fm)))) return thisMonth;
  return fm === 12 ? make(fy + 1, 1) : make(fy, fm + 1);
}

/** Next unpaid due date. A paid bill moves to the following cycle. */
export function upcomingDue(bill: Bill, today: string): string {
  const due = nextDue(bill, today);
  if (bill.paidFor && bill.paidFor === due) {
    return nextDue(bill, addDays(due, 1));
  }
  return due;
}

export const daysUntil = (due: string, today: string) => daysBetween(today, due);

/** Reminder dates: 3 days before and on the day. */
export function reminderDates(due: string): string[] {
  return [addDays(due, -3), due];
}

export const CHORES = ['Kitchen reset', 'Bathroom wipe', 'Dust and mop', 'Fridge clean-out', 'Desk and cables reset'] as const;

/** One chore per weekday, Monday to Friday. `offset` shifts the order. Weekends have none. */
export function choreFor(dow: number, offset: number): string | null {
  if (dow < 1 || dow > 5) return null;
  return CHORES[(((dow - 1 + offset) % CHORES.length) + CHORES.length) % CHORES.length];
}
