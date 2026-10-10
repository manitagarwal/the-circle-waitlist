import test from 'node:test';
import assert from 'node:assert/strict';
import { GROUPS, toneFor } from './tones.ts';
import { ACTIVITY_ICON_NAMES } from './activityIcons.ts';

test('every activity with clipart has a colour', () => {
  for (const n of ACTIVITY_ICON_NAMES) assert.ok(toneFor(n), `no colour for ${n}`);
});
test('groups have distinct colours and a group name works too', () => {
  assert.equal(new Set(GROUPS.map((g) => g.tone.light)).size, GROUPS.length);
  assert.equal(toneFor('Chess'), toneFor('Intellectual & hobby'));
  assert.notEqual(toneFor('Chess', true), toneFor('Chess'));
  assert.equal(toneFor('Nope'), null);
});
