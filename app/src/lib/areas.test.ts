import test from 'node:test';
import assert from 'node:assert/strict';
import { matchAreas } from './areas.ts';

const A = (id: number, name: string, sort = 20) => ({ id, name, place: null, sort });
const areas = [A(1, 'Sector 5, Gurugram'), A(2, 'Sector 56, Gurugram'), A(3, 'Sector 56, Noida', 30), A(4, 'Vasant Kunj, Delhi', 1)];

test('sec 56 finds sector 56 in every city part', () => {
  assert.deepEqual(matchAreas(areas, 'sec 56').map((a) => a.id), [2, 3]);
});
test('a bare number matches the whole number only', () => {
  assert.deepEqual(matchAreas(areas, 'sector 5').map((a) => a.id), [1]);
});
test('words in any order, case does not matter', () => {
  assert.deepEqual(matchAreas(areas, 'KUNJ vasant').map((a) => a.id), [4]);
  assert.deepEqual(matchAreas(areas, 'noida 56').map((a) => a.id), [3]);
});
test('empty search shows the first few', () => {
  assert.equal(matchAreas(areas, '', 2).length, 2);
});
