import type { BookingRow } from './bookings.ts';
import type { EventRow } from './api.ts';

export type HistoryItem = {
  key: string; kind: 'booking' | 'event'; id: string; title: string; when: string; place: string | null; outcome: string;
};

const bookingOutcome = (b: BookingRow): string =>
  b.status === 'cancelled' ? 'Cancelled' : b.is_host ? 'Hosted' : b.my_status === 'joined' ? 'Joined' : 'Left';

const eventOutcome = (s: string | null): string =>
  s === 'attended' ? 'Attended' : s === 'no_show' ? 'Missed' : s === 'cancelled' ? 'Cancelled' : s === 'waitlist' ? 'Waitlisted' : 'Went';

/** Everything the member has done that is already over, newest first. */
export function buildHistory(bookings: BookingRow[], events: EventRow[], now = Date.now()): HistoryItem[] {
  const out: HistoryItem[] = [];
  for (const b of bookings) {
    if (new Date(b.ends_at).getTime() >= now) continue;
    if (!b.is_host && !b.my_status) continue;
    out.push({ key: `b${b.id}`, kind: 'booking', id: b.id, title: b.title, when: b.starts_at, place: b.area ?? b.venue_name, outcome: bookingOutcome(b) });
  }
  for (const e of events) {
    if (!e.my_status || new Date(e.ends_at ?? e.starts_at).getTime() >= now) continue;
    out.push({ key: `e${e.id}`, kind: 'event', id: e.id, title: e.title, when: e.starts_at, place: e.area ?? e.venue_name, outcome: eventOutcome(e.my_status) });
  }
  return out.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());
}

export const monthKey = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
