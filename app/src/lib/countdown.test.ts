import test from 'node:test';
import assert from 'node:assert/strict';
import { countdown } from './countdown.ts';

const t = (iso: string) => Date.parse(iso);
const S = '2026-10-11T10:00:00Z', E = '2026-10-11T12:00:00Z';
test('minutes, hours, days', () => {
  assert.equal(countdown(S, E, t('2026-10-11T09:30:00Z')).text, 'in 30 min');
  assert.equal(countdown(S, E, t('2026-10-11T07:46:00Z')).text, 'in 2h 14m');
  assert.equal(countdown(S, E, t('2026-10-11T04:00:00Z')).text, 'in 6h');
  assert.equal(countdown(S, E, t('2026-10-10T08:00:00Z')).text, 'tomorrow');
  assert.equal(countdown(S, E, t('2026-10-08T08:00:00Z')).text, 'in 3 days');
});
test('soon, live and over', () => {
  assert.equal(countdown(S, E, t('2026-10-11T08:00:00Z')).soon, true);
  assert.equal(countdown(S, E, t('2026-10-11T05:00:00Z')).soon, false);
  assert.deepEqual(countdown(S, E, t('2026-10-11T10:30:00Z')), { text: 'Happening now', soon: true, live: true });
  assert.equal(countdown(S, E, t('2026-10-11T13:00:00Z')).text, 'Over');
});
