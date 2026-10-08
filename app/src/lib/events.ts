import type { EventRow } from './api';
import { ageText } from './channels.ts';

const GENDER_WORDS: Record<string, string> = { male: 'men', female: 'women', non_binary: 'non-binary members', prefer_not_to_say: 'members who prefer not to say' };

export type EventMe = { age: number | null; gender: string | null; city: string | null };

export const priceText = (p: number) => (p > 0 ? `₹${Number.isInteger(p) ? p : p.toFixed(2)}` : 'Free');

/** "12 of 30 going", "Full. 3 on the waitlist", "12 going" when there is no cap. */
export function spotsText(e: Pick<EventRow, 'going_count' | 'capacity' | 'waitlist_count'>): string {
  if (e.capacity == null) return `${e.going_count} going`;
  if (e.going_count >= e.capacity) return e.waitlist_count ? `Full. ${e.waitlist_count} on the waitlist` : 'Full';
  return `${e.going_count} of ${e.capacity} going`;
}
export const isFull = (e: Pick<EventRow, 'going_count' | 'capacity'>) => e.capacity != null && e.going_count >= e.capacity;

/** Plain-words list of who an event is for, or an empty list when it is open to all. */
export function eventRules(e: EventRow): string[] {
  const out: string[] = [];
  if (e.cities.length) out.push(`Members in ${e.cities.join(', ')}`);
  const age = ageText(e.age_min, e.age_max); if (age) out.push(`Ages ${age}`);
  if (e.genders.length) out.push(`For ${e.genders.map((g) => GENDER_WORDS[g] ?? g).join(' and ')}`);
  if (e.min_score != null) out.push('Reliable members only');
  return out;
}

/** Why this member cannot take part, or null. The server decides; this only warns before they tap. */
export function eventFit(e: EventRow, me: EventMe): string | null {
  if (e.cities.length && me.city && !e.cities.some((c) => c.toLowerCase() === me.city!.toLowerCase())) return `For members in ${e.cities.join(' or ')}.`;
  if (e.genders.length && me.gender && !e.genders.includes(me.gender)) return `For ${e.genders.map((g) => GENDER_WORDS[g] ?? g).join(' and ')}.`;
  if (me.age != null && ((e.age_min != null && me.age < e.age_min) || (e.age_max != null && me.age > e.age_max))) return `For ages ${ageText(e.age_min, e.age_max)}.`;
  return null;
}

export type Cta = 'reserve' | 'waitlist' | 'cancel' | 'cancel_waitlist' | 'paid' | 'cancelled' | 'over' | 'none';
/** What the main button should do. */
export function eventCta(e: EventRow, now = new Date()): Cta {
  if (e.status === 'cancelled') return 'cancelled';
  if (e.my_status === 'going') return new Date(e.ends_at) > now ? 'cancel' : 'none';
  if (e.my_status === 'waitlist') return 'cancel_waitlist';
  if (e.my_status === 'attended' || e.my_status === 'no_show') return 'none';
  if (new Date(e.ends_at) <= now) return 'over';
  if (e.price_inr > 0) return 'paid';
  return isFull(e) ? 'waitlist' : 'reserve';
}
