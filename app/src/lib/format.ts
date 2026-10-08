const IST = 'Asia/Kolkata';
const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-IN', { timeZone: IST, ...o }).format(d);
const dayKey = (d: Date) => fmt(d, { year: 'numeric', month: '2-digit', day: '2-digit' });

/** 12-hour clock in IST, e.g. "8:30 PM". */
export function clock(d: Date) {
  return fmt(d, { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?([ap])m/i, (_, x) => ` ${x.toUpperCase()}M`);
}

/** Chat-list style stamp: today "9:40", yesterday "Yesterday", this week "Mon", else "12 Sep". */
export function listStamp(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (dayKey(d) === dayKey(now)) return clock(d);
  const diffDays = Math.round((Date.parse(dayKey2(now)) - Date.parse(dayKey2(d))) / 86400000);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) return fmt(d, { weekday: 'short' });
  return fmt(d, { day: 'numeric', month: 'short' });
}
const dayKey2 = (d: Date) => fmt(d, { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');

/** Short age of a notification: "2m", "1h", "Yesterday", "Mon". */
export function ago(iso: string, now = new Date()): string {
  const mins = Math.floor((now.getTime() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  if (mins < 60 * 24 && dayKey(new Date(iso)) === dayKey(now)) return `${Math.floor(mins / 60)}h`;
  return listStamp(iso, now);
}

/** Heading for a day in a chat: "Today", "Yesterday", "Mon 6 Oct". */
export function dayLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (dayKey(d) === dayKey(now)) return 'Today';
  const diff = Math.round((Date.parse(dayKey2(now)) - Date.parse(dayKey2(d))) / 86400000);
  if (diff === 1) return 'Yesterday';
  return fmt(d, { weekday: 'short', day: 'numeric', month: 'short' });
}
export const sameDay = (a: string, b: string) => dayKey(new Date(a)) === dayKey(new Date(b));

/** "Ends in 19h" / "Ends in 40m" for a booking chat, or null when no expiry. */
export function endsIn(iso: string | null, now = new Date()): string | null {
  if (!iso) return null;
  const mins = Math.round((new Date(iso).getTime() - now.getTime()) / 60000);
  if (mins <= 0) return 'Closed';
  return mins < 60 ? `Ends in ${mins}m` : `Ends in ${Math.round(mins / 60)}h`;
}

/** Percentage of votes, rounded; 0 when there are no votes. */
export const pct = (votes: number, total: number) => (total ? Math.round((votes / total) * 100) : 0);
