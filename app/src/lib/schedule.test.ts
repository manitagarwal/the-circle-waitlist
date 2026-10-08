import test from 'node:test';
import assert from 'node:assert/strict';
import { addMonths, clampDuration, clockLabel, durationLabel, istToIso, monthGrid, startError, todayIST, ymdLabel } from './schedule.ts';

test('IST conversion', () => {
  assert.equal(istToIso({ y: 2026, m: 10, d: 9 }, { hour: 8, minute: 30, pm: true }), '2026-10-09T15:00:00.000Z'); // 8:30 PM IST
  assert.equal(istToIso({ y: 2026, m: 10, d: 9 }, { hour: 12, minute: 0, pm: false }), '2026-10-08T18:30:00.000Z'); // midnight IST
  assert.equal(istToIso({ y: 2026, m: 10, d: 9 }, { hour: 12, minute: 30, pm: true }), '2026-10-09T07:00:00.000Z'); // 12:30 PM IST
  assert.deepEqual(todayIST(new Date('2026-10-08T19:00:00Z')), { y: 2026, m: 10, d: 9 }); // already tomorrow in India
});
test('calendar', () => {
  const g = monthGrid(2026, 10); // 1 Oct 2026 is a Thursday
  assert.deepEqual(g[0], [null, null, null, 1, 2, 3, 4]);
  assert.equal(g.flat().filter(Boolean).length, 31);
  assert.ok(g.every((w) => w.length === 7));
  assert.deepEqual(addMonths(2026, 12, 1), { y: 2027, m: 1 });
  assert.deepEqual(addMonths(2026, 1, -1), { y: 2025, m: 12 });
  assert.equal(ymdLabel({ y: 2026, m: 10, d: 9 }), 'Fri, 9 Oct 2026');
});
test('the 6 to 24 hour check', () => {
  const now = new Date('2026-10-08T12:00:00Z');
  assert.equal(startError('2026-10-08T17:00:00Z', now), 'Start at least 6 hours from now.');
  assert.equal(startError('2026-10-08T18:00:00Z', now), null); // exactly 6 hours
  assert.equal(startError('2026-10-09T11:30:00Z', now), null);
  assert.equal(startError('2026-10-09T12:30:00Z', now), 'Start within 24 hours from now.');
  assert.equal(startError(null, now), null);
});
test('durations', () => {
  assert.equal(durationLabel(30), '30 minutes');
  assert.equal(durationLabel(60), '1 hour');
  assert.equal(durationLabel(90), '1 hour 30 minutes');
  assert.equal(durationLabel(360), '6 hours');
  assert.equal(clampDuration(300, 120), 120);
  assert.equal(clampDuration(10, 120), 30);
  assert.equal(clockLabel({ hour: 8, minute: 0, pm: true }), '8:00 PM');
});
