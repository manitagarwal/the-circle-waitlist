import test from 'node:test';
import assert from 'node:assert/strict';
import { bucket } from './interests.ts';

const groups = [
  { id: 1, name: 'Sports', sort: 1, interests: [{ id: 10, name: 'Badminton', group_id: 1 }, { id: 11, name: 'Tennis', group_id: 1 }] },
  { id: 2, name: 'Games', sort: 2, interests: [{ id: 20, name: 'Chess', group_id: 2 }] },
] as any;
test('bucket keeps group order and drops empty groups', () => {
  const items = [{ n: 'a', i: 20 }, { n: 'b', i: 11 }, { n: 'c', i: 10 }, { n: 'd', i: null }];
  const b = bucket(groups, items, (x) => x.i);
  assert.deepEqual(b.map((x) => x.group.name), ['Sports', 'Games']);
  assert.deepEqual(b[0].items.map((x) => x.n), ['b', 'c']);
  assert.deepEqual(bucket(groups, [{ i: 99 }], (x) => x.i), []);
});
