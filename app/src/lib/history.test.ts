import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHistory } from './history.ts';

const now = Date.parse('2026-10-10T12:00:00Z');
const b = (o: object) => ({ id: 'b1', title: 'Padel', starts_at: '2026-09-01T10:00:00Z', ends_at: '2026-09-01T11:00:00Z', status: 'open', is_host: false, my_status: 'joined', area: 'Sector 56', venue_name: null, ...o }) as never;
const e = (o: object) => ({ id: 'e1', title: 'Launch', starts_at: '2026-09-15T10:00:00Z', ends_at: '2026-09-15T12:00:00Z', my_status: 'attended', area: null, venue_name: 'Cafe', ...o }) as never;

test('past only, newest first, with outcomes', () => {
  const h = buildHistory([b({}), b({ id: 'b2', is_host: true, my_status: null, starts_at: '2026-08-01T10:00:00Z', ends_at: '2026-08-01T11:00:00Z' }), b({ id: 'b3', ends_at: '2026-11-01T11:00:00Z' }), b({ id: 'b4', my_status: null })], [e({}), e({ id: 'e2', my_status: null })], now);
  assert.deepEqual(h.map((x) => `${x.id}:${x.outcome}`), ['e1:Attended', 'b1:Joined', 'b2:Hosted']);
});
test('cancelled booking is labelled', () => {
  assert.equal(buildHistory([b({ status: 'cancelled' })], [], now)[0].outcome, 'Cancelled');
});
