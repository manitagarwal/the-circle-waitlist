import test from 'node:test';
import assert from 'node:assert/strict';
import { ageError, ageText, applyFilters, channelFit, channelSummary, filterOptions } from './channels.ts';
import type { ChannelRow } from './api.ts';

const mk = (o: Partial<ChannelRow>): ChannelRow => ({ id: 'x', kind: 'public', name: 'N', photo_path: null, interest_id: 1, interest_name: 'Badminton', created_by: null, created_at: '', member_count: 3, is_member: false, my_role: null, tags: [], ...o });
const t = (type: string, value: string) => ({ type, value });

test('summary: several cities, Pan India, genders', () => {
  assert.equal(channelSummary(mk({ member_count: 128, tags: [t('city', 'Gurgaon'), t('city', 'Noida'), t('area', 'Sector 43'), t('age_min', '25'), t('age_max', '35'), t('gender', 'female')] })), '128 members. Gurgaon, Noida. Sector 43. 25 to 35. Women.');
  assert.equal(channelSummary(mk({ member_count: 1 })), '1 member. Pan India. All ages.');
  assert.equal(channelSummary(mk({ tags: [t('gender', 'male'), t('gender', 'non_binary')] })), '3 members. Pan India. All ages. Men, Non-binary members.');
  assert.equal(channelSummary(mk({ tags: [t('age_group', '25 to 35')] })), '3 members. Pan India. 25 to 35.'); // older channels
});
test('age text', () => {
  assert.equal(ageText(25, null), '25 and over');
  assert.equal(ageText(null, 35), 'Up to 35');
  assert.equal(ageText(null, null), null);
});
test('fit: city, gender and age rules, with the reason', () => {
  const c = mk({ tags: [t('city', 'Delhi'), t('city', 'Noida'), t('gender', 'female'), t('age_min', '25'), t('age_max', '35')] });
  assert.equal(channelFit(c, { age: 30, gender: 'female', city: 'noida' }), null);
  assert.equal(channelFit(c, { age: 30, gender: 'female', city: 'Gurgaon' }), 'For members in Delhi or Noida.');
  assert.equal(channelFit(c, { age: 30, gender: 'male', city: 'Delhi' }), 'For women.');
  assert.equal(channelFit(c, { age: 40, gender: 'female', city: 'Delhi' }), 'For ages 25 to 35.');
  assert.equal(channelFit(mk({}), { age: 90, gender: 'male', city: 'Pune' }), null); // no rules: Pan India
});
test('filters', () => {
  const a = mk({ id: 'a', tags: [t('city', 'Gurgaon'), t('city', 'Delhi'), t('age_min', '25'), t('age_max', '35')] });
  const b = mk({ id: 'b', interest_name: 'Running', tags: [t('city', 'Delhi'), t('gender', 'non_binary')] });
  assert.deepEqual(applyFilters([a, b], { city: 'Gurgaon' }).map((c) => c.id), ['a']);
  assert.deepEqual(applyFilters([a, b], { fit: 'Only ones I can join' }, { age: 40, gender: 'male', city: 'Delhi' }).map((c) => c.id), []);
  assert.deepEqual(applyFilters([a, b], { gender: 'Non-binary members' }).map((c) => c.id), ['b']);
  assert.deepEqual(filterOptions([a, b], 'city'), ['Delhi', 'Gurgaon']);
});
test('age validation', () => {
  assert.equal(ageError('', ''), null);
  assert.equal(ageError('25', '35'), null);
  assert.ok(ageError('17', ''));
  assert.ok(ageError('40', '30'));
  assert.ok(ageError('abc', ''));
});
