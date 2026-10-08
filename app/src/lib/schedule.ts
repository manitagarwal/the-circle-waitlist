// Dates and times for the booking form. Everything is India time (IST, UTC+5:30, no daylight saving).
const IST_OFFSET = 330 * 60000;

export type YMD = { y: number; m: number; d: number };
export type Clock12 = { hour: number; minute: 0 | 30; pm: boolean }; // hour is 1 to 12

export const todayIST = (now = new Date()): YMD => {
  const t = new Date(now.getTime() + IST_OFFSET);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
};

export const to24 = (hour12: number, pm: boolean) => (hour12 % 12) + (pm ? 12 : 0);

/** A date and a 12-hour clock in IST -> an ISO instant. */
export const istToIso = (ymd: YMD, c: Clock12) => new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d, to24(c.hour, c.pm), c.minute) - IST_OFFSET).toISOString();

export const ymdKey = (v: YMD) => v.y * 10000 + v.m * 100 + v.d;
export const sameYmd = (a: YMD | null, b: YMD | null) => !!a && !!b && ymdKey(a) === ymdKey(b);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const monthName = (m: number) => MONTHS[m - 1];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "Thu, 9 Oct 2026" */
export function ymdLabel(v: YMD): string {
  const wd = WEEKDAYS[new Date(Date.UTC(v.y, v.m - 1, v.d)).getUTCDay()];
  return `${wd}, ${v.d} ${MONTHS[v.m - 1].slice(0, 3)} ${v.y}`;
}

/** Weeks of a month, Monday first, with null for the empty cells. */
export function monthGrid(y: number, m: number): (number | null)[][] {
  const first = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Monday = 0
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

export const addMonths = (y: number, m: number, n: number) => { const t = y * 12 + (m - 1) + n; return { y: Math.floor(t / 12), m: (t % 12) + 1 }; };

export const clockLabel = (c: Clock12) => `${c.hour}:${c.minute === 0 ? '00' : '30'} ${c.pm ? 'PM' : 'AM'}`;

/** The start has to fall between minHours and maxHours from now. Returns a message, or null when it is fine. */
export function startError(iso: string | null, now = new Date(), minHours = 6, maxHours = 24): string | null {
  if (!iso) return null;
  const t = Date.parse(iso) - now.getTime();
  if (t < minHours * 3600000) return `Start at least ${minHours} hours from now.`;
  if (t > maxHours * 3600000) return `Start within ${maxHours} hours from now.`;
  return null;
}

/** "30 minutes", "1 hour", "1 hour 30 minutes", "2 hours". */
export function durationLabel(mins: number): string {
  const h = Math.floor(mins / 60), m = mins % 60;
  const hp = h ? `${h} ${h === 1 ? 'hour' : 'hours'}` : '';
  const mp = m ? `${m} minutes` : '';
  return [hp, mp].filter(Boolean).join(' ');
}

export const DURATION_STEP = 30;
export const MIN_DURATION = 30;
export const clampDuration = (mins: number, max: number) => Math.min(Math.max(mins, MIN_DURATION), Math.max(MIN_DURATION, max));
