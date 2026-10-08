import test from 'node:test';
import assert from 'node:assert/strict';
import { ageRange, bookingDay, freeLeaveUntil, genderWanted, groupByDay, joinCheck, spots, startSlots, startsIn, timeRange, type BookingRow } from './bookings.ts';

const now = new Date('2026-10-08T12:00:00Z'); // 5:30 PM IST
const mk = (o: Partial<BookingRow> = {}): BookingRow => ({ id: 'b', kind: 'member', status: 'open', interest_id: 1, interest_name: 'Badminton', title: 'T', description: null, venue_name: null, area: null, address_outer: null,
  starts_at: '2026-10-08T15:00:00Z', ends_at: '2026-10-08T17:00:00Z', headcount_min: null, headcount_max: 4, male_slots: null, female_slots: null, min_score: null, age_min: null, age_max: null,
  created_at: '', host_id: 'h', host_username: 'h', joined_count: 2, male_joined: 1, female_joined: 1, my_status: null, is_host: false, channel_id: null, ...o });

test('slots are half hours, 6 to 24 hours out', () => {
  const s = startSlots(now);
  assert.equal(s[0], '2026-10-08T18:30:00.000Z'); // 12:00 AM IST: just over 6h, so it still passes the server check
  assert.ok(s.every((x) => new Date(x).getUTCMinutes() % 30 === 0));
  assert.ok(new Date(s[s.length - 1]).getTime() <= now.getTime() + 24 * 3600000);
  assert.ok(s.length > 30);
});
test('wording', () => {
  assert.equal(timeRange('2026-10-08T15:00:00Z', '2026-10-08T17:00:00Z'), '8:30 to 10:30 PM');
  assert.equal(startsIn('2026-10-08T19:00:00Z', now), 'Starts in 7 hours');
  assert.equal(bookingDay('2026-10-08T15:00:00Z', now), 'Tonight');
  assert.equal(bookingDay('2026-10-09T03:00:00Z', now), 'Tomorrow');
  assert.equal(spots(mk()).count, '2 of 4 in');
  assert.equal(spots(mk()).left, '2 spots');
  assert.equal(ageRange(mk({ age_min: 25, age_max: 35 })), '25 to 35');
  assert.equal(ageRange(mk()), null);
  assert.equal(freeLeaveUntil('2026-10-08T15:00:00Z').toISOString(), '2026-10-08T12:00:00.000Z');
});
test('gender wanted', () => {
  assert.equal(genderWanted(mk()), null);
  assert.equal(genderWanted(mk({ male_slots: 2, female_slots: 2, male_joined: 1, female_joined: 1 })), '1 man, 1 woman wanted');
  assert.equal(genderWanted(mk({ male_slots: 1, female_slots: 1, male_joined: 1, female_joined: 1 })), 'Gender spots are filled');
});
test('join hints', () => {
  assert.ok(joinCheck(mk(), { age: 30, gender: 'male' }, now).ok);
  assert.equal(joinCheck(mk({ age_min: 25, age_max: 35 }), { age: 40, gender: 'male' }, now).ok, false);
  assert.equal(joinCheck(mk({ male_slots: 1, female_slots: 2, male_joined: 1, female_joined: 1 }), { age: 30, gender: 'male' }, now).ok, false);
  assert.equal(joinCheck(mk({ headcount_max: 2 }), { age: 30, gender: 'male' }, now).reason, 'This booking is full.');
  assert.equal(joinCheck(mk({ is_host: true }), { age: 30, gender: 'male' }, now).ok, false);
});
test('grouping', () => {
  const g = groupByDay([mk({ id: 'a', starts_at: '2026-10-09T03:00:00Z' }), mk({ id: 'b' })], now);
  assert.deepEqual(g.map((x) => x.day), ['Tonight', 'Tomorrow']);
});
