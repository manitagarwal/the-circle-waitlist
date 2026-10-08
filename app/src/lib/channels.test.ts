import test from 'node:test';
import assert from 'node:assert/strict';
import { applyFilters, channelSummary, filterOptions, groupByActivity } from './channels.ts';
import type { ChannelRow } from './api.ts';

const mk = (o: Partial<ChannelRow>): ChannelRow => ({ id: 'x', kind: 'public', name: 'N', photo_path: null, interest_id: 1, interest_name: 'Badminton', created_by: null, created_at: '', member_count: 3, is_member: false, my_role: null, tags: [], ...o });
test('summary', () => {
  assert.equal(channelSummary(mk({ member_count: 128, tags: [{ type: 'area', value: 'Gurgaon' }, { type: 'age_group', value: '25 to 35' }] })), '128 members. Gurgaon. 25 to 35.');
  assert.equal(channelSummary(mk({ member_count: 1 })), '1 member. All ages.');
});
test('filters and groups', () => {
  const a = mk({ id: 'a', tags: [{ type: 'area', value: 'Gurgaon' }], member_count: 5 });
  const b = mk({ id: 'b', interest_name: 'Running', tags: [{ type: 'area', value: 'Delhi' }], member_count: 9 });
  assert.deepEqual(applyFilters([a, b], { area: 'Delhi' }).map((c) => c.id), ['b']);
  assert.deepEqual(applyFilters([a, b], { activity: 'Badminton' }).map((c) => c.id), ['a']);
  assert.deepEqual(filterOptions([a, b], 'area'), ['Delhi', 'Gurgaon']);
  assert.deepEqual(groupByActivity([a, b]).map((g) => g.activity), ['Badminton', 'Running']);
});
