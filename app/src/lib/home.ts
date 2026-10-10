import type { BookingRow } from './bookings';
import type { EventRow } from './api';

export const greeting = (d = new Date()) => { const h = d.getHours(); return h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 22 ? 'Good evening' : 'Good night'; };

export type Upcoming = { kind: 'booking' | 'event'; id: string; title: string; interest: string | null; startsAt: string; endsAt: string; where: string; note: string };

/** The member's next plans: bookings they host or joined and events they are going to, soonest first. */
export function comingUp(bookings: BookingRow[], events: EventRow[], now = new Date()): Upcoming[] {
  const live = (end: string) => new Date(end) > now;
  const b: Upcoming[] = bookings.filter((x) => (x.is_host || x.my_status === 'joined') && (x.status === 'open' || x.status === 'full') && live(x.ends_at)).map((x) => ({
    kind: 'booking', id: x.id, title: x.title, interest: x.interest_name, startsAt: x.starts_at, endsAt: x.ends_at, where: [x.venue_name, x.area].filter(Boolean).join(', '),
    note: x.headcount_max ? `${x.joined_count} of ${x.headcount_max} in` : `${x.joined_count} in`,
  }));
  const e: Upcoming[] = events.filter((x) => x.my_status === 'going' && x.status === 'published' && live(x.ends_at)).map((x) => ({
    kind: 'event', id: x.id, title: x.title, interest: x.interest_name, startsAt: x.starts_at, endsAt: x.ends_at, where: [x.venue_name, x.area ?? x.city].filter(Boolean).join(', '), note: "You're going",
  }));
  return [...b, ...e].sort((p, q) => p.startsAt.localeCompare(q.startsAt)).slice(0, 8);
}

/** Bookings to suggest: open, not yours, not full, preferring the member's interests, soonest first. */
export function startingSoon(bookings: BookingRow[], interests: string[], now = new Date(), limit = 5): BookingRow[] {
  const open = bookings.filter((b) => b.status === 'open' && !b.is_host && b.my_status == null && new Date(b.starts_at) > now
    && (b.headcount_max == null || b.joined_count < b.headcount_max)
    && (b.close_hours == null || new Date(new Date(b.starts_at).getTime() - b.close_hours * 3600000) > now));
  const mine = open.filter((b) => b.interest_name && interests.includes(b.interest_name));
  const rest = open.filter((b) => !mine.includes(b));
  const by = (a: BookingRow, c: BookingRow) => a.starts_at.localeCompare(c.starts_at);
  return [...mine.sort(by), ...rest.sort(by)].slice(0, limit);
}
