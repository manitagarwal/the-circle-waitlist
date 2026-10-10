import test from 'node:test';
import assert from 'node:assert/strict';
import { calcScore, EXAMPLES, rulesFrom, DEFAULT_RULES } from './score.ts';

// These expected values come from the database function calc_score run on the same inputs.
const EXPECTED = [8.0, 9.0, 8.6, 6.7, 8.0, 9.2, 8.2, 4.6];

test('every example scores the same as the database', () => {
  EXAMPLES.forEach((x, i) => assert.equal(calcScore(x.events, x.signIns ?? []), EXPECTED[i], x.title));
});
test('a mistake after a long record costs much less than one after a short record', () => {
  const long = calcScore(EXAMPLES[2].events); const short = calcScore(EXAMPLES[3].events);
  assert.ok(long > short + 1.5);
});
test('the second mistake is not forgiven like the first', () => {
  const one = calcScore([...EXAMPLES[1].events.slice(0, 8), { age: 18, type: 'no_show' }]);
  const two = calcScore([...EXAMPLES[1].events.slice(0, 8), { age: 18, type: 'no_show' }, { age: 4, type: 'no_show' }]);
  assert.ok(one - two > 0.5);
});
test('daily sign-ins can never add more than the cap', () => {
  const lots = Array.from({ length: 4000 }, (_, i) => i % 400);
  assert.ok(calcScore([], lots) <= calcScore([], lots, { ...DEFAULT_RULES, signInCap: 1 }));
  assert.ok(calcScore([], lots) < 9);
});
test('a host no-show is the worst thing', () => {
  const base = EXAMPLES[1].events;
  assert.ok(calcScore([...base, { age: 3, type: 'host_no_show' }]) < calcScore([...base, { age: 3, type: 'no_show' }]) - 2);
});
test('rules from the server override the defaults', () => {
  assert.equal(rulesFrom({ 'score.weight.no_show': -5 }).weights.no_show, -5);
  assert.equal(rulesFrom(null).halfLife, 90);
});
