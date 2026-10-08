import { clock } from './format.ts';

export type BookingRow = {
  id: string; kind: 'admin' | 'member'; status: 'open' | 'full' | 'completed' | 'cancelled'; interest_id: number; interest_name: string;
  title: string; description: string | null; venue_name: string | null; area: string | null; address_outer: string | null;
  starts_at: string; ends_at: string; headcount_min: number | null; headcount_max: number | null; male_slots: number | null; female_slots: number | null;
  min_score: number | null; age_min: number | null; age_max: number | null; created_at: string; host_id: string; host_username: string;
  joined_count: number; male_joined: number; female_joined: number; my_status: string | null; is_host: boolean; channel_id: string | null;
};

const IST = 'Asia/Kolkata';
const parts = (d: Date) => Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: IST, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d).map((p) => [p.type, p.value]));
const dayId = (d: Date) => { const p = parts(d); return `${p.year}-${p.month}-${p.day}`; };
const dayNum = (d: Date) => Date.parse(dayId(d));

/** Heading for a booking day: Tonight / Tomorrow / weekday. */
export function bookingDay(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const diff = Math.round((dayNum(d) - dayNum(now)) / 86400000);
  if (diff <= 0) return Number(parts(d).hour) >= 17 ? 'Tonight' : 'Today';
  if (diff === 1) return 'Tomorrow';
  return new Intl.DateTimeFormat('en-IN', { timeZone: IST, weekday: 'long', day: 'numeric', month: 'short' }).format(d);
}

/** "8:30 to 10:30 PM" (drops the first AM/PM when both match). */
export function timeRange(startIso: string, endIso: string): string {
  const a = clock(new Date(startIso)), b = clock(new Date(endIso));
  return a.slice(-2) === b.slice(-2) ? `${a.slice(0, -3)} to ${b}` : `${a} to ${b}`;
}

/** "Starts in 7 hours" / "Starts in 40 minutes" / "Started". */
export function startsIn(iso: string, now = new Date()): string {
  const mins = Math.round((new Date(iso).getTime() - now.getTime()) / 60000);
  if (mins <= 0) return 'Started';
  if (mins < 60) return `Starts in ${mins} minutes`;
  const h = Math.round(mins / 60);
  return `Starts in ${h} ${h === 1 ? 'hour' : 'hours'}`;
}

/** Half-hour start times 6 to 24 hours from now, as ISO strings (IST half hours are UTC half hours). */
export function startSlots(now = new Date(), minHours = 6, maxHours = 24): string[] {
  const HALF = 30 * 60000;
  const first = Math.ceil((now.getTime() + minHours * 3600000 + 60000) / HALF) * HALF; // a minute of slack
  const out: string[] = [];
  for (let t = first; t <= now.getTime() + maxHours * 3600000 - 60000; t += HALF) out.push(new Date(t).toISOString());
  return out;
}

export const slotLabel = (iso: string, now = new Date()) => `${bookingDay(iso, now) === 'Today' ? 'Today' : bookingDay(iso, now) === 'Tonight' ? 'Today' : bookingDay(iso, now)}, ${clock(new Date(iso))}`;

/** The last moment a member can leave without it counting against them. */
export const freeLeaveUntil = (startsIso: string, lockInHours = 3) => new Date(new Date(startsIso).getTime() - lockInHours * 3600000);

/** "2 of 4 in" and "6 spots". */
export function spots(b: Pick<BookingRow, 'joined_count' | 'headcount_max'>) {
  const left = b.headcount_max == null ? null : Math.max(0, b.headcount_max - b.joined_count);
  return { count: b.headcount_max == null ? `${b.joined_count} in` : `${b.joined_count} of ${b.headcount_max} in`, left: left == null ? null : `${left} ${left === 1 ? 'spot' : 'spots'}` };
}

/** Which genders are still wanted: "1 man, 1 woman wanted", or null when anyone can join. */
export function genderWanted(b: Pick<BookingRow, 'male_slots' | 'female_slots' | 'male_joined' | 'female_joined'>): string | null {
  if (b.male_slots == null && b.female_slots == null) return null;
  const m = Math.max(0, (b.male_slots ?? 0) - b.male_joined), f = Math.max(0, (b.female_slots ?? 0) - b.female_joined);
  const bits = [m ? `${m} ${m === 1 ? 'man' : 'men'}` : null, f ? `${f} ${f === 1 ? 'woman' : 'women'}` : null].filter(Boolean);
  return bits.length ? `${bits.join(', ')} wanted` : 'Gender spots are filled';
}

export const ageRange = (b: Pick<BookingRow, 'age_min' | 'age_max'>) =>
  b.age_min == null && b.age_max == null ? null : b.age_min != null && b.age_max != null ? `${b.age_min} to ${b.age_max}` : b.age_min != null ? `${b.age_min} and over` : `Up to ${b.age_max}`;

export type JoinCheck = { ok: boolean; reason?: string };
/** Quick client-side hint before the server decides: never the final word. */
export function joinCheck(b: BookingRow, me: { age: number | null; gender: string | null }, now = new Date()): JoinCheck {
  if (b.is_host || b.my_status === 'joined') return { ok: false };
  if (b.status === 'full' || (b.headcount_max != null && b.joined_count >= b.headcount_max)) return { ok: false, reason: 'This booking is full.' };
  if (b.status !== 'open' || new Date(b.starts_at) <= now) return { ok: false, reason: 'This booking has closed.' };
  if (me.age != null && ((b.age_min != null && me.age < b.age_min) || (b.age_max != null && me.age > b.age_max))) return { ok: false, reason: "You're outside the age range." };
  if (b.male_slots != null || b.female_slots != null) {
    const open = me.gender === 'male' ? (b.male_slots ?? 0) > b.male_joined : me.gender === 'female' ? (b.female_slots ?? 0) > b.female_joined : false;
    if (!open) return { ok: false, reason: 'The spots for your gender are taken.' };
  }
  return { ok: true };
}

/** Group bookings by their day heading, keeping start order. */
export function groupByDay<T extends { starts_at: string }>(rows: T[], now = new Date()) {
  const out: { day: string; rows: T[] }[] = [];
  for (const r of [...rows].sort((a, b) => a.starts_at.localeCompare(b.starts_at))) {
    const day = bookingDay(r.starts_at, now);
    const last = out[out.length - 1];
    if (last && last.day === day) last.rows.push(r); else out.push({ day, rows: [r] });
  }
  return out;
}
