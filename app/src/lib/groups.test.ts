import test from 'node:test';
import assert from 'node:assert/strict';
import { addableFriends, spotsLeft } from './groups.ts';

test('addable friends', () => {
  const f = [{ id: '1', username: 'aditi.s' }, { id: '2', username: 'rohan.m' }, { id: '3', username: 'priya.n' }];
  assert.deepEqual(addableFriends(f, ['2'], '').map((x) => x.id), ['1', '3']);
  assert.deepEqual(addableFriends(f, [], 'RO').map((x) => x.id), ['2']);
});
test('spots', () => {
  assert.equal(spotsLeft(1, 3), 46);
  assert.equal(spotsLeft(50, 0), 0);
  assert.equal(spotsLeft(48, 5), 0);
});
