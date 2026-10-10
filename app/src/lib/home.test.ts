import test from 'node:test';
import assert from 'node:assert/strict';
import { comingUp, greeting, startingSoon } from './home.ts';
import type { BookingRow } from './bookings.ts';
import type { EventRow } from './api.ts';

const now = new Date('2026-10-10T12:00:00Z');
const bk = (o: Partial<BookingRow>): BookingRow => ({ id: 'b', kind: 'member', status: 'open', interest_id: 1, interest_name: 'Badminton', title: 'T', description: null, venue_name: 'V', area: 'A', address_outer: null,
  starts_at: '2026-10-11T12:00:00Z', ends_at: '2026-10-11T14:00:00Z', headcount_min: null, headcount_max: 4, male_slots: null, female_slots: null, min_score: null, close_hours: 2, age_min: null, age_max: null,
  created_at: '', host_id: 'h', host_username: 'h', joined_count: 2, male_joined: 1, female_joined: 1, my_status: null, is_host: false, channel_id: null, ...o });
const ev = (o: Partial<EventRow>) => ({ id: 'e', title: 'E', interest_name: 'Chess', venue_name: 'V', area: null, city: 'Delhi', starts_at: '2026-10-12T12:00:00Z', ends_at: '2026-10-12T15:00:00Z', status: 'published', my_status: 'going', ...o }) as unknown as EventRow;

test('greeting follows the hour', () => {
  assert.equal(greeting(new Date(2026, 9, 10, 8)), 'Good morning');
  assert.equal(greeting(new Date(2026, 9, 10, 14)), 'Good afternoon');
  assert.equal(greeting(new Date(2026, 9, 10, 19)), 'Good evening');
});
test('coming up merges my bookings and events, soonest first, and skips what is over', () => {
  const list = comingUp([bk({ id: 'mine', my_status: 'joined' }), bk({ id: 'notmine' }), bk({ id: 'old', is_host: true, ends_at: '2026-10-01T00:00:00Z' })], [ev({}), ev({ id: 'e2', my_status: null })], now);
  assert.deepEqual(list.map((x) => x.id), ['mine', 'e']);
  assert.equal(list[0].note, '2 of 4 in');
  assert.equal(list[1].note, "You're going");
});
test('starting soon prefers my interests and skips full, mine and closed ones', () => {
  const list = startingSoon([
    bk({ id: 'chess', interest_name: 'Chess', starts_at: '2026-10-12T12:00:00Z' }), bk({ id: 'bad', starts_at: '2026-10-13T12:00:00Z' }), bk({ id: 'full', joined_count: 4 }),
    bk({ id: 'mine', is_host: true }), bk({ id: 'closed', starts_at: '2026-10-10T13:00:00Z' })], ['Badminton'], now);
  assert.deepEqual(list.map((x) => x.id), ['bad', 'chess']);
});
