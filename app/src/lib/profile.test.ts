import test from 'node:test';
import assert from 'node:assert/strict';
import { ageOn, parseDob, profileArgs, toggleInterest } from './profile.ts';

const today = new Date(2026, 9, 8); // 8 Oct 2026
test('parseDob', () => {
  assert.equal(parseDob('5', '3', '1994', today), '1994-03-05');
  assert.equal(parseDob('31', '2', '1994', today), null);
  assert.equal(parseDob('1', '1', '2030', today), null);
  assert.equal(parseDob('1', '1', '94', today), null);
  assert.equal(parseDob('29', '2', '2000', today), '2000-02-29');
  assert.equal(parseDob('29', '2', '2001', today), null);
});
test('age', () => {
  assert.equal(ageOn('2008-10-08', today), 18);
  assert.equal(ageOn('2008-10-09', today), 17);
  assert.equal(ageOn('1994-03-05', today), 32);
});
test('interests are capped at five and can be removed', () => {
  let s: number[] = [];
  for (const id of [1, 2, 3, 4, 5, 6]) s = toggleInterest(s, id);
  assert.deepEqual(s, [1, 2, 3, 4, 5]);
  assert.deepEqual(toggleInterest(s, 3), [1, 2, 4, 5]);
});
test('a photo replaces the avatar in the arguments', () => {
  const base = { avatarId: 4, photoPath: null, interestIds: [1, 2, 3], dob: '1994-03-05', gender: 'male', address: 'a', area: 'b', lat: null, lng: null, field: 'f' };
  assert.equal(profileArgs(base).p_avatar_id, 4);
  const withPhoto = profileArgs({ ...base, photoPath: 'u/x.jpg' });
  assert.equal(withPhoto.p_avatar_id, null);
  assert.equal(withPhoto.p_photo_path, 'u/x.jpg');
});
