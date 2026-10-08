import test from 'node:test';
import assert from 'node:assert/strict';
import { ago, dayLabel, endsIn, listStamp, pct } from './format.ts';

const now = new Date('2026-10-08T12:00:00Z'); // 5:30 PM IST, Thu 8 Oct
test('listStamp', () => {
  assert.equal(listStamp('2026-10-08T04:10:00Z', now), '9:40 AM');
  assert.equal(listStamp('2026-10-07T10:00:00Z', now), 'Yesterday');
  assert.equal(listStamp('2026-10-05T10:00:00Z', now), 'Mon');
});
test('ago', () => {
  assert.equal(ago('2026-10-08T11:58:00Z', now), '2m');
  assert.equal(ago('2026-10-08T09:00:00Z', now), '3h');
  assert.equal(ago('2026-10-07T10:00:00Z', now), 'Yesterday');
});
test('dayLabel', () => {
  assert.equal(dayLabel('2026-10-08T01:00:00Z', now), 'Today');
  assert.equal(dayLabel('2026-10-07T10:00:00Z', now), 'Yesterday');
});
test('endsIn and pct', () => {
  assert.equal(endsIn('2026-10-09T07:00:00Z', now), 'Ends in 19h');
  assert.equal(endsIn('2026-10-08T12:20:00Z', now), 'Ends in 20m');
  assert.equal(endsIn('2026-10-08T11:00:00Z', now), 'Closed');
  assert.equal(pct(61, 100), 61);
  assert.equal(pct(0, 0), 0);
});
